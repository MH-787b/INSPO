# artinspo — Inspiration for Artists

## Overview
A minimal website where users enter their email and instantly receive a unique image with a creative prompt. Inspiration for all art forms — poetry, drawing, music, writing, etc. Everything is free.

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (no framework, no build step)
- **Images**: Cloudflare Workers AI — FLUX.1-schnell (free, ~2,000 images/day)
- **Email delivery**: Resend API (free tier, 100 emails/day)
- **Hosting**: Vercel (free tier — static site + serverless functions)
- **Fonts**: Google Fonts — Inter + Playfair Display

## Project Structure
```
index.html                — Minimal landing page with email form
css/style.css             — Dark theme styles
js/script.js              — Form submission + API call
api/send-inspiration.js   — Vercel serverless function (picks prompt, generates image, sends email)
data/inspirations.json    — 5 categories, 40 prompts, 60 words (reference data)
vercel.json               — Vercel routing config
scripts/send-daily-email.js — Daily email script (reads subscribers, generates inspiration, sends via Resend)
.github/workflows/daily-email.yml — GitHub Actions cron job (runs daily at 9 AM UTC)
```

## How It Works
### On-Demand (Website)
1. User enters email on the site
2. Frontend POSTs to `/api/send-inspiration`
3. Serverless function picks a random creative prompt + scene description
4. Generates a unique scene image via Cloudflare Workers AI (no people/faces)
5. Sends a styled HTML + plain text email via Resend (cid: image, List-Unsubscribe header)
6. User receives inspiration in their inbox within seconds

### Daily Email (GitHub Actions)
1. GitHub Actions triggers at 9 AM UTC every day
2. Reads subscribers from `data/subscribers.json`
3. Generates unique inspiration + image for each subscriber
4. Sends via Resend API (batch mode)
5. Respects Resend free tier (100 emails/day, 3,000/month)

## Setup (all free)

### Vercel (On-Demand API)
1. Sign up at https://vercel.com → import GitHub repo
2. Environment variables in Vercel dashboard → Settings → Environment Variables:
   - `RESEND_API_KEY` = your Resend API key (https://resend.com)
   - `CF_API_TOKEN` = your Cloudflare API token (https://cloudflare.com)
   - `CF_ACCOUNT_ID` = your Cloudflare Account ID
   - `FROM_EMAIL` = custom from address (e.g. `artinspo<hello@artinspo.co.uk>`)
3. Deploy: Vercel auto-deploys on push to main

### GitHub Actions (Daily Email)
1. Add secrets to GitHub repo → Settings → Secrets and variables → Actions:
   - `RESEND_API_KEY` = your Resend API key
   - `FROM_EMAIL` = custom from address (e.g. `artinspo<hello@artinspo.co.uk>`)
2. Populate `data/subscribers.json` with subscriber emails and categories
3. Workflow runs daily at 9 AM UTC (`.github/workflows/daily-email.yml`)

## Services Used (all free tier)
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Vercel | Hosting + serverless API | 100GB bandwidth, 100K function invocations/month |
| Cloudflare Workers AI | Image generation (FLUX.1-schnell) | ~2,000 images/day, no credit card |
| Resend | Email delivery | 100 emails/day, 3,000/month |
| Google Fonts | Typography | Unlimited |

## Inspiration Categories
1. **Story** — narrative scenes to interpret through any medium
2. **Emotion** — traces of human presence for portrait, poetry, music, character study
3. **Place** — locations for landscape, worldbuilding, songwriting
4. **Detail** — objects and close-ups for still life, poetry, sketching
5. **Wonder** — natural phenomena for any art form

## Email Deliverability
- **DNS**: SPF (`v=spf1 include:send.resend.com ~all`), DKIM (Resend), DMARC (`p=quarantine`)
- **Headers**: `List-Unsubscribe` (mailto) + `List-Unsubscribe-Post` (one-click, RFC 8058), `Reply-To`
- **Content**: cid: inline image (not base64), plain text version, good text-to-image ratio
- **Subject line**: No emojis, descriptive format (`Your {category} inspiration: {word}`)

## Security
- **KEYS** — Local-only file storing API keys. **NEVER push to GitHub.** Listed in `.gitignore`.
- **`.gitignore`** — Excludes `KEYS`, `.env`, `.env.*`, and `node_modules/`

## Repository
- **Remote**: https://github.com/MH-787b/INSPO.git
- **Hosting**: Vercel (connected to GitHub repo)
- **Live site**: https://artinspo.co.uk
- **Domain**: artinspo.co.uk (verified in Resend for email delivery)
