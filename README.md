# Roast My Resume

Upload your resume as a PDF, pick a spice level (Mild / Medium / Savage), and get flame-grilled by AI — then leave with genuinely better bullet points.

**Live demo:** _add your Vercel URL here_

**Runs 100% free** — Google Gemini's free tier + Vercel's free Hobby plan. No credit card anywhere.

## How it works

1. The browser uploads your PDF and chosen roast intensity to a Next.js route handler (`app/api/roast/route.ts`).
2. The server sends the PDF directly to the Gemini API as inline data — no PDF-parsing library needed.
3. Gemini streams back a structured roast (The Roast → Greatest Hits → Redemption Arc → Final Verdict), which is piped token-by-token to the UI.

Resumes are never stored — they go straight to the API and nowhere else.

## Tech stack

- **Next.js 16** (App Router, route handlers, streaming responses)
- **TypeScript** + **Tailwind CSS 4** (glassmorphism UI)
- **Gemini API** (`@google/genai`) — Gemini 2.5 Flash with native PDF input and streaming

## Run it locally

```bash
npm install
cp .env.example .env.local   # then paste your free Gemini API key
npm run dev
```

Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card required. The free tier allows roughly 250 requests/day on Gemini 2.5 Flash, which is plenty.

Open [http://localhost:3000](http://localhost:3000) and upload a resume you're emotionally prepared to sacrifice.

## Deploy

Deploy to [Vercel](https://vercel.com) (free Hobby plan) and set the `GEMINI_API_KEY` environment variable in the project settings. The route handler sets `maxDuration = 60` so streaming responses have room to finish.

## Environment variables

| Variable         | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `GEMINI_API_KEY` | Free API key from [Google AI Studio](https://aistudio.google.com/apikey)  |
