# Roast My Resume

Upload your resume, pick a severity level, and get a brutally honest, laugh-out-loud critique streamed back in real time — followed by genuinely useful fixes: rewritten bullet points, structural improvements, and the single highest-impact change to make today.

**Live demo:** _add your Vercel URL here_

Runs 100% free: Google Gemini's free tier for the AI, Vercel's Hobby plan for hosting. No credit card anywhere.

## Features

- **Native PDF understanding** — the resume PDF is sent directly to Gemini as inline data; no parsing library, no text extraction step, layout and formatting are part of the critique
- **Token-by-token streaming** — the roast types itself onto the page as the model generates it, via a `ReadableStream` piped from the route handler to the browser
- **Three severity levels** — Mild, Medium, and Savage, each mapped to a different prompt persona
- **Structured output without markdown** — the model is instructed to emit four plain-text sections (The Roast, Greatest Hits, Redemption Arc, Final Verdict); the client detects the header lines and renders each section with its own icon and styling
- **Graceful failure** — free-tier 503 spikes and upstream errors surface as readable messages, not blank screens
- **Privacy by design** — resumes go straight to the API and are never stored

## Design

The UI is a satirical take on an official document review — "The Bureau of Brutal Honesty." Editorial serif masthead (Fraunces), warm paper texture, mono-type form labels, stamp-style severity selector, and the roast rendered as a confidential assessment memo. Built with Tailwind CSS 4, lucide-react icons, no component library.

## How it works

1. The browser posts the PDF and chosen severity to a Next.js route handler (`app/api/roast/route.ts`)
2. The handler validates the file, base64-encodes it, and calls `generateContentStream` with a system prompt that defines the roast's structure and rules (punch at the resume, never the person)
3. Chunks are re-encoded into a `ReadableStream` and returned as `text/plain`; the client reads the stream and renders sections as they arrive

## Tech stack

| Layer     | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, route handlers, streaming responses)  |
| Language  | TypeScript                                                     |
| Styling   | Tailwind CSS 4, Fraunces + Geist via `next/font`               |
| Icons     | lucide-react                                                   |
| AI        | Gemini 2.5 Flash via `@google/genai` (free tier)               |

## Run it locally

```bash
git clone https://github.com/SoumodeepChakraborty/roast-my-resume.git
cd roast-my-resume
npm install
cp .env.example .env.local   # paste your free Gemini API key
npm run dev
```

Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card required. The free tier allows roughly 250 requests/day on Gemini 2.5 Flash.

Then open [http://localhost:3000](http://localhost:3000) and upload a resume you're emotionally prepared to sacrifice.

## Deploy

1. Import the repo at [vercel.com/new](https://vercel.com/new) (free Hobby plan)
2. Add the `GEMINI_API_KEY` environment variable in the project settings
3. Deploy

The route handler sets `maxDuration = 60` so streaming responses have room to finish.

## Environment variables

| Variable         | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `GEMINI_API_KEY` | Free API key from [Google AI Studio](https://aistudio.google.com/apikey)  |
