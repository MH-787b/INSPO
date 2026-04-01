/**
 * Daily inspiration email sender.
 * Fetches subscribers from Resend Audience, generates AI images
 * via Cloudflare Workers AI, and sends styled emails via Resend.
 *
 * Env vars required: RESEND_API_KEY, RESEND_AUDIENCE_ID, CF_API_TOKEN, CF_ACCOUNT_ID
 * Optional: FROM_EMAIL (defaults to 'artinspo <inspiration@resend.dev>')
 *
 * Usage: node scripts/send-daily-email.js
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const FROM_EMAIL = process.env.FROM_EMAIL || 'artinspo <inspiration@resend.dev>';

if (!RESEND_API_KEY) { console.error('Missing RESEND_API_KEY'); process.exit(1); }
if (!RESEND_AUDIENCE_ID) { console.error('Missing RESEND_AUDIENCE_ID'); process.exit(1); }
if (!CF_API_TOKEN) { console.error('Missing CF_API_TOKEN'); process.exit(1); }
if (!CF_ACCOUNT_ID) { console.error('Missing CF_ACCOUNT_ID'); process.exit(1); }

// ── Prompts (same as api/send-inspiration.js) ──

const PROMPTS = [
  { prompt: "A stranger left this on a park bench. What's the story?", word: "remnant", icon: "📖", category: "Story", scene: "a worn leather journal lying open on a park bench, autumn leaves scattered around, golden hour light" },
  { prompt: "This is the last thing she saw before she disappeared.", word: "vanish", icon: "📖", category: "Story", scene: "a half-open door at the end of a long hallway, light spilling through, an empty pair of shoes by the threshold" },
  { prompt: "He built this for someone who never came.", word: "waiting", icon: "📖", category: "Story", scene: "a small handmade wooden table set for two on a cliff overlooking the sea, wildflowers in a jar, one chair pushed back" },
  { prompt: "Write what this room remembers.", word: "echo", icon: "📖", category: "Story", scene: "an abandoned ballroom with dust in the air, a single chandelier still lit, sheet music scattered on the floor" },
  { prompt: "What is this person about to say?", word: "threshold", icon: "🎭", category: "Emotion", scene: "a sealed envelope resting on a windowsill, weathered hands' imprint in dust beside it, soft window light" },
  { prompt: "This is what courage looks like at 4am.", word: "resolve", icon: "🎭", category: "Emotion", scene: "a rooftop garden at dawn, a single coffee cup still steaming on the ledge, city lights below, first light on the horizon" },
  { prompt: "She hasn't smiled like this in years.", word: "release", icon: "🎭", category: "Emotion", scene: "bare footprints on a kitchen tile floor, morning light streaming through curtains, a record player spinning" },
  { prompt: "Two people who will never meet again.", word: "farewell", icon: "🎭", category: "Emotion", scene: "two umbrellas abandoned on opposite ends of a rain-soaked bench, reflections on wet pavement, street lamps glowing" },
  { prompt: "What happened here?", word: "aftermath", icon: "🌍", category: "Place", scene: "an overgrown greenhouse with broken glass, tropical plants reclaiming the space, soft fog rolling in" },
  { prompt: "Nobody knows this place exists.", word: "hidden", icon: "🌍", category: "Place", scene: "a narrow stone staircase descending into a cave with bioluminescent blue water, ancient carvings on the walls" },
  { prompt: "This is where the sound is coming from.", word: "source", icon: "🌍", category: "Place", scene: "a dense misty forest with a clearing, a single standing stone covered in moss, shafts of light breaking through" },
  { prompt: "Someone once called this place home.", word: "belonging", icon: "🌍", category: "Place", scene: "a weathered fishing boat resting on a pebble beach, a small cottage with smoke rising from the chimney, dusk" },
  { prompt: "This was found in a coat pocket. Tell its story.", word: "artifact", icon: "🔍", category: "Detail", scene: "a crumpled handwritten note next to a vintage key and a dried pressed flower on a dark wooden surface" },
  { prompt: "What song does this instrument want to play?", word: "longing", icon: "🔍", category: "Detail", scene: "a dusty violin resting on a velvet chair by a window, afternoon light catching the strings, sheet music nearby" },
  { prompt: "Someone left in a hurry. What were they running from?", word: "urgency", icon: "🔍", category: "Detail", scene: "an open suitcase on a bed with clothes spilling out, a clock showing 3am, curtains blowing from an open window" },
  { prompt: "This has been here longer than anyone remembers.", word: "ancient", icon: "🔍", category: "Detail", scene: "a massive twisted oak tree in a field, roots exposed, carvings in the bark, storm clouds gathering behind" },
  { prompt: "Something is about to change.", word: "shift", icon: "✨", category: "Wonder", scene: "the exact moment between sunset and night, a flock of birds changing direction mid-flight over a still lake" },
  { prompt: "This only happens once a year.", word: "rare", icon: "✨", category: "Wonder", scene: "thousands of lanterns floating into a dark sky above a river, their reflections doubling the light" },
  { prompt: "The tide brought this in overnight.", word: "gift", icon: "✨", category: "Wonder", scene: "a strange beautiful piece of driftwood shaped like a hand reaching up from the sand, morning mist, calm sea" },
  { prompt: "Look closer. There's something living in there.", word: "micro", icon: "✨", category: "Wonder", scene: "extreme close-up of a rain droplet on a leaf, a tiny world reflected and refracted inside it, vivid greens" },
];

// ── Fetch Subscribers from Resend Audience ──

async function getSubscribers() {
  const res = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch audience: ${res.status} ${err}`);
  }

  const data = await res.json();
  // Filter out unsubscribed contacts
  return (data.data || []).filter(c => !c.unsubscribed);
}

// ── Generate Image via Cloudflare Workers AI ──

function buildImagePrompt(inspo) {
  return `${inspo.scene}, no people, no faces, no figures, cinematic photography, atmospheric, high quality, detailed`;
}

function buildFallbackPrompt() {
  return 'a quiet landscape at golden hour, no people, soft light, cinematic photography, atmospheric, high quality';
}

async function generateImage(inspo) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
  const headers = {
    'Authorization': `Bearer ${CF_API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const prompts = [buildImagePrompt(inspo), buildFallbackPrompt()];

  for (const prompt of prompts) {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, steps: 4 })
    });

    if (res.ok) {
      const data = await res.json();
      return data.result.image;
    }

    const err = await res.text();
    if (res.status === 400 && err.includes('NSFW')) continue;
    throw new Error(`Cloudflare AI error ${res.status}: ${err}`);
  }

  throw new Error('Image generation blocked by content filter');
}

// ── Build Email HTML (cid: inline image) ──

function buildEmail(inspo) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-size:24px;font-weight:bold;color:#f5f5f0;letter-spacing:0.02em;">
        <span style="color:#c4a87c;">art</span>inspo<span style="color:#c4a87c;">.</span>
      </span>
    </div>

    <div style="margin-bottom:32px;border-radius:8px;overflow:hidden;">
      <img src="cid:inspiration" alt="Your creative inspiration" style="width:100%;height:auto;display:block;" />
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;font-size:12px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.15em;color:#c4a87c;border:1px solid rgba(196,168,124,0.3);border-radius:100px;padding:6px 16px;">
        ${inspo.icon} ${inspo.category}
      </span>
    </div>

    <h1 style="text-align:center;font-size:28px;font-weight:normal;font-style:italic;color:#f5f5f0;line-height:1.4;margin:0 0 20px;">
      ${inspo.prompt}
    </h1>

    <p style="text-align:center;font-size:13px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.3em;color:#888;margin:0 0 40px;">
      ${inspo.word}
    </p>

    <p style="text-align:center;font-size:14px;font-family:Georgia,'Times New Roman',serif;color:#aaa;line-height:1.6;margin:0 0 32px;">
      Use this as a starting point for a sketch, poem, song, story, or anything you like. There are no rules — just create.
    </p>

    <div style="text-align:center;margin-bottom:40px;">
      <a href="https://artinspo.co.uk" style="display:inline-block;padding:12px 32px;background:#c4a87c;color:#0a0a0a;text-decoration:none;border-radius:100px;font-family:Arial,sans-serif;font-size:14px;font-weight:500;">
        Get More Inspiration
      </a>
    </div>

    <div style="text-align:center;border-top:1px solid #222;padding-top:20px;">
      <p style="font-size:12px;font-family:Arial,sans-serif;color:#666;margin:0;">
        artinspo.co.uk — free inspiration for artists.
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Build Plain Text Version ──

function buildPlainText(inspo) {
  return `artinspo.

${inspo.category}

"${inspo.prompt}"

${inspo.word}

Use this as a starting point for a sketch, poem, song, story, or anything you like. There are no rules — just create.

--
artinspo.co.uk — free inspiration for artists.`;
}

// ── Send Email via Resend ──

async function sendEmail(to, inspo, imageBase64) {
  const fromEmail = FROM_EMAIL.includes('<') ? FROM_EMAIL.match(/<(.+)>/)[1] : FROM_EMAIL;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      reply_to: fromEmail,
      subject: `Your ${inspo.category.toLowerCase()} inspiration: ${inspo.word}`,
      headers: {
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      },
      attachments: [
        {
          filename: 'inspiration.png',
          content: imageBase64,
          content_id: 'inspiration'
        }
      ],
      html: buildEmail(inspo),
      text: buildPlainText(inspo)
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error for ${to}: ${res.status} ${err}`);
  }

  return res.json();
}

// ── Main ──

async function main() {
  // Fetch subscribers from Resend Audience
  const subscribers = await getSubscribers();

  if (subscribers.length === 0) {
    console.log('No subscribers. Exiting.');
    process.exit(0);
  }

  console.log(`Sending daily inspiration to ${subscribers.length} subscriber(s)...`);

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      // Pick a random prompt
      const inspo = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

      // Generate unique AI image
      const imageBase64 = await generateImage(inspo);

      // Send email
      await sendEmail(sub.email, inspo, imageBase64);
      console.log(`  Sent to ${sub.email}`);
      sent++;
    } catch (err) {
      console.error(`  Failed for ${sub.email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`Done. Sent: ${sent}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main();
