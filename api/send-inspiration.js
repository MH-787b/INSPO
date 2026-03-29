/**
 * Vercel Serverless Function: /api/send-inspiration
 *
 * Receives an email, picks a random creative prompt,
 * generates an AI image via Pollinations.ai, and sends
 * a styled email via Resend.
 *
 * Env vars required: RESEND_API_KEY
 */

const PROMPTS = [
  { prompt: "What color is silence?", word: "luminance", icon: "🎨", category: "Color & Light" },
  { prompt: "Paint the space between shadows", word: "chiaroscuro", icon: "🎨", category: "Color & Light" },
  { prompt: "What would sunset look like on another planet?", word: "prismatic", icon: "🎨", category: "Color & Light" },
  { prompt: "Capture light as it bends through glass", word: "refraction", icon: "🎨", category: "Color & Light" },
  { prompt: "Draw a sound you heard today", word: "tessellate", icon: "🪨", category: "Texture & Form" },
  { prompt: "Sculpt something that can't exist in gravity", word: "crystalline", icon: "🪨", category: "Texture & Form" },
  { prompt: "What shape is your current mood?", word: "amorphous", icon: "🪨", category: "Texture & Form" },
  { prompt: "Find pattern in something chaotic", word: "fractal", icon: "🪨", category: "Texture & Form" },
  { prompt: "Create something that feels like nostalgia", word: "saudade", icon: "💭", category: "Emotion & Mood" },
  { prompt: "What does joy look like at 3am?", word: "ephemeral", icon: "💭", category: "Emotion & Mood" },
  { prompt: "Draw the last dream you remember", word: "reverie", icon: "💭", category: "Emotion & Mood" },
  { prompt: "Express the pause between breaths", word: "catharsis", icon: "💭", category: "Emotion & Mood" },
  { prompt: "Draw what the wind is carrying today", word: "tempest", icon: "🌿", category: "Nature & Elements" },
  { prompt: "Capture the exact moment before rain", word: "petrichor", icon: "🌿", category: "Nature & Elements" },
  { prompt: "What does the ocean floor dream about?", word: "bioluminescent", icon: "🌿", category: "Nature & Elements" },
  { prompt: "Draw fire in slow motion", word: "metamorphic", icon: "🌿", category: "Nature & Elements" },
  { prompt: "Capture motion without showing the moving thing", word: "kinetic", icon: "⚡", category: "Movement & Energy" },
  { prompt: "What does acceleration look like?", word: "momentum", icon: "⚡", category: "Movement & Energy" },
  { prompt: "Draw something falling apart beautifully", word: "entropy", icon: "⚡", category: "Movement & Energy" },
  { prompt: "What would music look like if you could see it?", word: "crescendo", icon: "⚡", category: "Movement & Energy" },
];

// Build an artistic image prompt from the inspiration
function buildImagePrompt(inspo) {
  return `artistic inspiration, ${inspo.prompt}, ${inspo.word}, beautiful abstract art, evocative, cinematic lighting, high quality`;
}

// Build Pollinations.ai image URL
function getImageUrl(inspo) {
  const prompt = encodeURIComponent(buildImagePrompt(inspo));
  const seed = Math.floor(Math.random() * 100000);
  return `https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&seed=${seed}&nologo=true`;
}

// Build the HTML email
function buildEmail(inspo, imageUrl) {
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
        INSPO<span style="color:#c4a87c;">.</span>
      </span>
    </div>

    <div style="margin-bottom:32px;border-radius:8px;overflow:hidden;">
      <img src="${imageUrl}" alt="AI-generated inspiration" style="width:100%;height:auto;display:block;" />
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

    <div style="text-align:center;border-top:1px solid #222;padding-top:20px;">
      <p style="font-size:12px;font-family:Arial,sans-serif;color:#666;margin:0;">
        INSPO — free AI-powered inspiration for artists.
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Handler ──

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  // Pick a random inspiration
  const inspo = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  const imageUrl = getImageUrl(inspo);
  const html = buildEmail(inspo, imageUrl);

  // Send via Resend
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'INSPO <onboarding@resend.dev>',
        to: [email],
        subject: `${inspo.icon} ${inspo.prompt}`,
        html
      })
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend error:', resendRes.status, errBody);
      return res.status(502).json({ error: `Resend error: ${errBody}` });
    }

    return res.status(200).json({ ok: true, prompt: inspo.prompt });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: 'Failed to send email. Try again.' });
  }
}
