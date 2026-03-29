# INSPO — AI Inspiration for Artists

## Overview
A minimal website where users enter their email and instantly receive an AI-generated image with a creative prompt. Everything is free.

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (no framework, no build step)
- **AI Images**: Pollinations.ai (free, no API key)
- **Email delivery**: Resend API (free tier, 100 emails/day)
- **Hosting**: Vercel (free tier — static site + serverless functions)
- **Fonts**: Google Fonts — Inter + Playfair Display

## Project Structure
```
index.html                — Minimal landing page with email form
css/style.css             — Dark theme styles
js/script.js              — Form submission + API call
api/send-inspiration.js   — Vercel serverless function (picks prompt, generates AI image, sends email)
data/inspirations.json    — 5 categories, 40 prompts, 60 words (reference data)
vercel.json               — Vercel routing config
scripts/send-daily-email.js — (Legacy) daily email script via GitHub Actions
.github/workflows/daily-email.yml — (Legacy) daily cron job
```

## How It Works
1. User enters email on the site
2. Frontend POSTs to `/api/send-inspiration`
3. Serverless function picks a random creative prompt + evocative word
4. Builds an AI image URL via Pollinations.ai (prompt-based, no API key)
5. Sends a styled HTML email via Resend with the AI image embedded
6. User receives inspiration in their inbox within seconds

## Setup (all free)
1. **Resend**: Sign up at https://resend.com → get API key
2. **Vercel**: Sign up at https://vercel.com → import GitHub repo
3. **Environment variable**: In Vercel dashboard → Settings → Environment Variables → add:
   - `RESEND_API_KEY` = your Resend API key
   - `FROM_EMAIL` = (optional) custom from address, defaults to `INSPO <onboarding@resend.dev>`
4. **Deploy**: Vercel auto-deploys on push to main

## Services Used (all free tier)
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Vercel | Hosting + serverless API | 100GB bandwidth, 100K function invocations/month |
| Pollinations.ai | AI image generation | Unlimited, no API key |
| Resend | Email delivery | 100 emails/day, 3,000/month |
| Google Fonts | Typography | Unlimited |

## Inspiration Categories
1. **Color & Light** — luminance, chiaroscuro, prismatic...
2. **Texture & Form** — tessellate, crystalline, fractal...
3. **Emotion & Mood** — saudade, ephemeral, reverie...
4. **Nature & Elements** — petrichor, bioluminescent, aurora...
5. **Movement & Energy** — kinetic, entropy, crescendo...

## Repository
- **Remote**: https://github.com/MH-787b/INSPO.git
- **Hosting**: Vercel (connected to GitHub repo)
