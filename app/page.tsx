"use client";

import { useCallback, useRef, useState } from "react";
import {
  Check,
  Copy,
  FileText,
  Flame,
  Skull,
  Trophy,
  TrendingUp,
  Upload,
} from "lucide-react";

type RoastLevel = "mild" | "medium" | "savage";
type Status = "idle" | "roasting" | "done" | "error";

const LEVELS: { id: RoastLevel; label: string; flames: number; blurb: string }[] = [
  { id: "mild", label: "Mild", flames: 1, blurb: "Gentle teasing" },
  { id: "medium", label: "Medium", flames: 2, blurb: "Proper roast" },
  { id: "savage", label: "Savage", flames: 3, blurb: "No mercy" },
];

const SECTION_HEADERS: Record<string, { icon: typeof Flame; color: string }> = {
  "THE ROAST": { icon: Flame, color: "text-accent" },
  "GREATEST HITS": { icon: Skull, color: "text-ink" },
  "REDEMPTION ARC": { icon: TrendingUp, color: "text-[#4a6741]" },
  "FINAL VERDICT": { icon: Trophy, color: "text-[#8a6d1c]" },
};

function RoastOutput({ text, streaming }: { text: string; streaming: boolean }) {
  const lines = text.split("\n");
  return (
    <div className="text-[15px] leading-relaxed text-ink/90">
      {lines.map((line, i) => {
        const header = SECTION_HEADERS[line.trim()];
        if (header) {
          const Icon = header.icon;
          return (
            <h3
              key={i}
              className={`mt-8 mb-3 flex items-center gap-2.5 border-b border-rule pb-2 font-[family-name:var(--font-fraunces)] text-lg font-bold tracking-wide first:mt-0 ${header.color}`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
              {line.trim()}
            </h3>
          );
        }
        return (
          <p key={i} className="min-h-[1em] whitespace-pre-wrap">
            {line}
            {streaming && i === lines.length - 1 && (
              <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-accent align-text-bottom" />
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<RoastLevel>("medium");
  const [status, setStatus] = useState<Status>("idle");
  const [roast, setRoast] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const acceptFile = useCallback((f: File | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("That's not a PDF. Even your file format needs work.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("PDF over 10 MB? Your resume shouldn't be a novel.");
      return;
    }
    setError("");
    setFile(f);
  }, []);

  const startRoast = async () => {
    if (!file || status === "roasting") return;
    setStatus("roasting");
    setRoast("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("level", level);

      const res = await fetch("/api/roast", { method: "POST", body: formData });
      if (!res.ok || !res.body) {
        throw new Error(await res.text());
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setRoast((prev) => prev + decoder.decode(value, { stream: true }));
        outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
      }
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const copyRoast = async () => {
    await navigator.clipboard.writeText(roast);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-2xl flex-col px-5 py-12 sm:py-16">
        {/* masthead */}
        <header className="text-center">
          <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.35em] text-ink-faint">
            The Bureau of Brutal Honesty
          </p>
          <div className="mx-auto mt-3 h-px w-24 bg-ink/30" />
          <h1 className="mt-6 font-[family-name:var(--font-fraunces)] text-5xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Roast My{" "}
            <span className="italic text-accent">Resume</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md font-[family-name:var(--font-fraunces)] text-base italic leading-relaxed text-ink-soft sm:text-lg">
            Submit your resume for official review. Our assessor is honest,
            merciless, and — annoyingly — usually right.
          </p>
        </header>

        {/* intake form */}
        <section className="mt-12 border border-ink/25 bg-paper-card shadow-[4px_4px_0_rgba(33,26,19,0.12)]">
          <div className="flex items-center justify-between border-b border-ink/25 px-5 py-2.5">
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.25em] text-ink-soft">
              Form RR-1 · Resume Intake
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.25em] text-ink-faint">
              PDF · Max 10 MB
            </span>
          </div>

          <div className="p-5 sm:p-7">
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                acceptFile(e.dataTransfer.files[0]);
              }}
              className={`flex cursor-pointer flex-col items-center gap-3 border border-dashed px-6 py-10 text-center transition-colors ${
                dragging
                  ? "border-accent bg-accent/[0.06]"
                  : "border-ink/35 hover:border-accent/70 hover:bg-ink/[0.03]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              {file ? (
                <>
                  <FileText className="h-7 w-7 text-accent" strokeWidth={1.6} aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-ink">{file.name}</p>
                    <p className="mt-1 font-[family-name:var(--font-geist-mono)] text-[11px] text-ink-faint">
                      {(file.size / 1024).toFixed(0)} KB — click to swap
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-7 w-7 text-ink-faint" strokeWidth={1.6} aria-hidden />
                  <div>
                    <p className="font-[family-name:var(--font-fraunces)] text-base italic text-ink-soft">
                      Deposit the evidence here
                    </p>
                    <p className="mt-1.5 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-wider text-ink-faint">
                      Drag &amp; drop or click to browse
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* heat selector */}
            <fieldset className="mt-7">
              <legend className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.25em] text-ink-soft">
                Section 2 — Select severity
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={`group border px-3 py-3.5 text-center transition-all ${
                      level === l.id
                        ? "-rotate-1 border-accent bg-accent/[0.07] shadow-[2px_2px_0_rgba(187,58,29,0.25)]"
                        : "border-ink/25 hover:border-ink/50 hover:bg-ink/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: l.flames }).map((_, i) => (
                        <Flame
                          key={i}
                          aria-hidden
                          strokeWidth={2}
                          className={`h-4 w-4 transition-colors ${
                            level === l.id ? "text-accent" : "text-ink-faint"
                          }`}
                        />
                      ))}
                    </div>
                    <div
                      className={`mt-1.5 font-[family-name:var(--font-fraunces)] text-sm font-bold ${
                        level === l.id ? "text-accent-deep" : "text-ink-soft"
                      }`}
                    >
                      {l.label}
                    </div>
                    <div className="font-[family-name:var(--font-geist-mono)] text-[10px] text-ink-faint">
                      {l.blurb}
                    </div>
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              onClick={startRoast}
              disabled={!file || status === "roasting"}
              className="mt-7 flex w-full items-center justify-center gap-2.5 border border-ink bg-ink px-6 py-4 font-[family-name:var(--font-geist-mono)] text-xs font-semibold uppercase tracking-[0.25em] text-paper-card shadow-[3px_3px_0_rgba(187,58,29,0.9)] transition-all hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-[4px_5px_0_rgba(33,26,19,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:border-ink/30 disabled:bg-ink/30 disabled:shadow-none"
            >
              <Flame
                aria-hidden
                className={`h-4 w-4 ${status === "roasting" ? "animate-pulse" : ""}`}
              />
              {status === "roasting" ? "Assessment in progress" : "Submit for roasting"}
            </button>

            {error && (
              <p className="mt-5 border-l-2 border-accent bg-accent/[0.07] px-4 py-3 text-sm text-accent-deep">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* assessment memo */}
        {(roast || status === "roasting") && (
          <section className="mt-10 rotate-[0.3deg] border border-ink/25 bg-paper-card shadow-[4px_4px_0_rgba(33,26,19,0.12)]">
            <div className="flex items-center justify-between border-b border-ink/25 px-5 py-3">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.25em] text-accent">
                Confidential · Assessment Memo
              </span>
              {status === "done" ? (
                <button
                  onClick={copyRoast}
                  className="flex items-center gap-1.5 border border-ink/25 px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-wider text-ink-soft transition-colors hover:border-ink/50 hover:text-ink"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-[#4a6741]" aria-hidden />
                  ) : (
                    <Copy className="h-3 w-3" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              ) : (
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-wider text-ink-faint">
                  Typing…
                </span>
              )}
            </div>
            <div
              ref={outputRef}
              className="thin-scrollbar max-h-[36rem] overflow-y-auto px-6 py-6 sm:px-8"
            >
              <RoastOutput text={roast} streaming={status === "roasting"} />
            </div>
          </section>
        )}

        <footer className="mt-14 text-center">
          <div className="mx-auto mb-4 h-px w-24 bg-ink/20" />
          <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Documents are reviewed via Google&apos;s Gemini API and never stored
          </p>
        </footer>
      </div>
    </main>
  );
}
