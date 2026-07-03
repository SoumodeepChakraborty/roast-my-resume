import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — keeps us under Gemini's 20 MB inline-data limit

type RoastLevel = "mild" | "medium" | "savage";

const LEVEL_INSTRUCTIONS: Record<RoastLevel, string> = {
  mild: "Keep the roast gentle and playful — light teasing, like a supportive friend who can't resist a few jokes. Encouragement should outweigh the burns.",
  medium:
    "Deliver a proper roast — sharp, witty, and a little ruthless, like a stand-up comedian reviewing resumes on stage. Still land on genuinely constructive notes.",
  savage:
    "Go full flame mode — brutal, hilarious, no mercy. Channel a comedy roast battle. But every burn must be rooted in a real, fixable flaw in the resume, and the final advice must be genuinely useful.",
};

const SYSTEM_PROMPT = `You are "Roast My Resume" — a resume reviewer with the soul of a stand-up comedian and the eye of a senior recruiter.

You will receive a resume as a PDF. Roast it: point out clichés, buzzword soup, vague claims, formatting crimes, and missed opportunities — but make every joke land on something real. Never invent flaws that aren't in the document, and never mock the person's name, photo, school, nationality, or anything they can't change. Punch at the resume, not the human.

Structure your response in plain text — no markdown symbols (#, *, -) and no emojis anywhere — with these four sections, each preceded by its header in capital letters on its own line, exactly as written:

THE ROAST
A few punchy paragraphs roasting the resume's weakest points.

GREATEST HITS
List the 3-5 most roastable lines quoted (or closely paraphrased) from the resume, each followed by a one-line burn.

REDEMPTION ARC
Concrete, specific fixes: rewrite 2-3 of their weakest bullet points into strong, quantified versions, and give 3 actionable improvements for structure or content.

FINAL VERDICT
A score out of 10, one sentence of honest encouragement, and the single highest-impact change they should make today.

Keep the whole response tight — quality burns over quantity.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      "Server is missing GEMINI_API_KEY. Add it to .env.local and restart.",
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const levelRaw = formData.get("level");
  const level: RoastLevel =
    levelRaw === "mild" || levelRaw === "savage" ? levelRaw : "medium";

  if (!(file instanceof File)) {
    return new Response("No file uploaded.", { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return new Response("Please upload a PDF file.", { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return new Response("PDF is too large (max 10 MB).", { status: 400 });
  }

  const pdfBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const ai = new GoogleGenAI({ apiKey });

  let stream;
  try {
    stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            text: `Roast this resume. Roast intensity: ${level}. ${LEVEL_INSTRUCTIONS[level]}`,
          },
        ],
      },
    ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 4096,
      },
    });
  } catch (err) {
    const status =
      err && typeof err === "object" && "status" in err && err.status === 503
        ? 503
        : 502;
    const message =
      status === 503
        ? "The AI is overloaded right now (free-tier traffic spike). Wait a few seconds and try again."
        : "Couldn't reach the AI service. Check the server logs and try again.";
    return new Response(message, { status });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.text) {
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        controller.enqueue(
          encoder.encode(`\n\n[The roast fizzled out: ${message}]`)
        );
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
