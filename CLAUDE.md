# INSPO — Daily Inspiration for Artists

## Overview
A free static website that generates creative inspiration via random images, prompts, evocative words, and ambient sounds. Includes a daily email pipeline for subscribers.

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (no framework, no build step)
- **Images**: Lorem Picsum (free, no API key)
- **Audio**: Web Audio API (generated ambient sounds, no audio files)
- **Fonts**: Google Fonts — Inter + Playfair Display
- **Hosting**: GitHub Pages (free)
- **Subscribe form**: Formspree (free tier, 50 submissions/month)
- **Email delivery**: Resend API (free tier, 100 emails/day)
- **Email scheduler**: GitHub Actions cron (daily at 7am UTC)

## Project Structure
```
index.html              — Main single-page site
css/style.css           — All styles (dark minimal theme)
js/script.js            — Inspiration engine, category filtering, subscribe form
js/audio.js             — Web Audio API ambient sound generator (5 sound types)
data/inspirations.json  — 5 categories, 40 prompts, 60 words
data/subscribers.json   — Subscriber list for daily emails
scripts/send-daily-email.js — Builds HTML email + sends via Resend
.github/workflows/daily-email.yml — GitHub Actions daily cron job
```

## Inspiration Categories
1. **Color & Light** — sound: warm drone
2. **Texture & Form** — sound: filtered noise texture
3. **Emotion & Mood** — sound: gentle random melody
4. **Nature & Elements** — sound: wind/rain
5. **Movement & Energy** — sound: rhythmic pulses

## Setup Checklist
1. **Formspree**: Sign up at https://formspree.io → create form → replace `YOUR_FORM_ID` in `index.html`
2. **Resend**: Sign up at https://resend.com → get API key → add as GitHub secret `RESEND_API_KEY`
3. **GitHub Pages**: Repo Settings → Pages → Source: main branch
4. **Subscribers**: Edit `data/subscribers.json` (manually sync from Formspree submissions for now)
5. **Site URL**: Update `https://YOUR_SITE_URL` in `scripts/send-daily-email.js` once Pages is live

## Key Behaviors
- Press **Space** or click **Inspire Me** to generate new inspiration
- Category pills filter to a specific category; "All" picks randomly
- Sound toggle plays a generative ambient sound matching the current category
- Subscribe form POSTs to Formspree; shows success message on completion
- Daily email workflow can be manually triggered via GitHub Actions "workflow_dispatch"

## Repository
- **Remote**: https://github.com/MH-787b/INSPO.git
- **Hosting**: GitHub Pages (once enabled)
