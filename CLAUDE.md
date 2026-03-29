# artinspo — Inspiration for Artists

## Overview
A minimal website where users enter their email and instantly receive a unique image with a creative prompt. Everything is free.

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
scripts/send-daily-email.js — (Legacy) daily email script via GitHub Actions
.github/workflows/daily-email.yml — (Legacy) daily cron job
```

## How It Works
1. User enters email on the site
2. Frontend POSTs to `/api/send-inspiration`
3. Serverless function picks a random creative prompt + evocative word
4. Generates a unique image via Cloudflare Workers AI (FLUX.1-schnell)
5. Sends a styled HTML email via Resend with the image embedded
6. User receives inspiration in their inbox within seconds

## Setup (all free)
1. **Resend**: Sign up at https://resend.com → get API key
2. **Cloudflare**: Sign up at https://cloudflare.com → get API token + Account ID
3. **Vercel**: Sign up at https://vercel.com → import GitHub repo
4. **Environment variables**: In Vercel dashboard → Settings → Environment Variables → add:
   - `RESEND_API_KEY` = your Resend API key
   - `CF_API_TOKEN` = your Cloudflare API token
   - `CF_ACCOUNT_ID` = your Cloudflare Account ID
   - `FROM_EMAIL` = custom from address using verified domain (e.g. `artinspo <hello@artinspo.co.uk>`)
4. **Deploy**: Vercel auto-deploys on push to main

## Services Used (all free tier)
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Vercel | Hosting + serverless API | 100GB bandwidth, 100K function invocations/month |
| Cloudflare Workers AI | Image generation (FLUX.1-schnell) | ~2,000 images/day, no credit card |
| Resend | Email delivery | 100 emails/day, 3,000/month |
| Google Fonts | Typography | Unlimited |

## Inspiration Categories
1. **Story** — narrative scenes to interpret through any medium
2. **Emotion** — human moments for portrait, poetry, music, character study
3. **Place** — locations for landscape, worldbuilding, songwriting
4. **Detail** — objects and close-ups for still life, poetry, sketching
5. **Wonder** — natural phenomena for any art form

## Repository
- **Remote**: https://github.com/MH-787b/INSPO.git
- **Hosting**: Vercel (connected to GitHub repo)
- **Live site**: https://artinspo.co.uk
- **Domain**: artinspo.co.uk (verified in Resend for email delivery)
