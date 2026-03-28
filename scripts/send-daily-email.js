/**
 * Daily inspiration email sender.
 * Reads subscribers from data/subscribers.json, picks a random inspiration,
 * and sends an HTML email via Resend API.
 *
 * Usage: RESEND_API_KEY=re_xxx node scripts/send-daily-email.js
 */

const fs = require('fs');
const path = require('path');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'INSPO <inspiration@resend.dev>';

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY environment variable');
  process.exit(1);
}

// ── Load Data ──

const inspirations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'inspirations.json'), 'utf-8')
);

const subscribersPath = path.join(__dirname, '..', 'data', 'subscribers.json');
let subscribers = [];
try {
  subscribers = JSON.parse(fs.readFileSync(subscribersPath, 'utf-8'));
} catch {
  console.log('No subscribers file found. Create data/subscribers.json with an array of {email, category}.');
  process.exit(0);
}

if (subscribers.length === 0) {
  console.log('No subscribers. Exiting.');
  process.exit(0);
}

// ── Pick Inspiration ──

function getInspiration(categoryPref) {
  const categories = Object.keys(inspirations.categories);
  const catKey = (categoryPref && categoryPref !== 'all' && categories.includes(categoryPref))
    ? categoryPref
    : categories[Math.floor(Math.random() * categories.length)];

  const cat = inspirations.categories[catKey];
  const prompt = cat.prompts[Math.floor(Math.random() * cat.prompts.length)];
  const word = cat.words[Math.floor(Math.random() * cat.words.length)];
  const imageId = Math.floor(Math.random() * 1000);
  const imageUrl = `https://picsum.photos/seed/${catKey}-${imageId}/600/400`;

  return { category: cat.name, icon: cat.icon, prompt, word, imageUrl };
}

// ── Build Email HTML ──

function buildEmail({ category, icon, prompt, word, imageUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-size:24px;font-weight:bold;color:#f5f5f0;letter-spacing:0.02em;">
        INSPO<span style="color:#c4a87c;">.</span>
      </span>
    </div>

    <!-- Image -->
    <div style="margin-bottom:32px;border-radius:8px;overflow:hidden;">
      <img src="${imageUrl}" alt="Inspiration" style="width:100%;height:auto;display:block;" />
    </div>

    <!-- Category -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;font-size:12px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.15em;color:#c4a87c;border:1px solid rgba(196,168,124,0.3);border-radius:100px;padding:6px 16px;">
        ${icon} ${category}
      </span>
    </div>

    <!-- Prompt -->
    <h1 style="text-align:center;font-size:28px;font-weight:normal;font-style:italic;color:#f5f5f0;line-height:1.4;margin:0 0 20px;">
      ${prompt}
    </h1>

    <!-- Word -->
    <p style="text-align:center;font-size:13px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.3em;color:#888;margin:0 0 40px;">
      ${word}
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:40px;">
      <a href="https://YOUR_SITE_URL" style="display:inline-block;padding:12px 32px;background:#c4a87c;color:#0a0a0a;text-decoration:none;border-radius:100px;font-family:Arial,sans-serif;font-size:14px;font-weight:500;">
        Get More Inspiration
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;border-top:1px solid #222;padding-top:20px;">
      <p style="font-size:12px;font-family:Arial,sans-serif;color:#666;margin:0;">
        You're receiving this because you subscribed to INSPO daily inspiration.
      </p>
    </div>

  </div>
</body>
</html>`.trim();
}

// ── Send via Resend ──

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html
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
  console.log(`Sending daily inspiration to ${subscribers.length} subscriber(s)...`);

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      const inspo = getInspiration(sub.category);
      const html = buildEmail(inspo);
      const subject = `${inspo.icon} ${inspo.prompt}`;

      await sendEmail(sub.email, subject, html);
      console.log(`  Sent to ${sub.email}`);
      sent++;
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`Done. Sent: ${sent}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main();
