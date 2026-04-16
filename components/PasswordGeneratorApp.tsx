"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { PasswordCard } from "@/components/PasswordCard";
import type { PasswordGeneratorOptions, PasswordStyle, PasswordSuggestion } from "@/types/password";

const INITIAL_OPTIONS: PasswordGeneratorOptions = {
  keywordsInput: "",
  length: 14,
  style: "balanced",
  includeNumbers: true,
  includeSymbols: true,
};

const STYLE_OPTIONS: Array<{ value: PasswordStyle; label: string }> = [
  { value: "memorable", label: "Memorable" },
  { value: "balanced", label: "Balanced" },
  { value: "strongest", label: "Strongest" },
];

const STYLE_HINTS: Record<PasswordStyle, readonly string[]> = {
  memorable: [
    "Builds readable word groups from your themes with light transformation.",
    "Numbers and symbols are appended at the end so the phrase stays easy to recall.",
    "If more length is needed, short pronounceable chunks are added—no full-password shuffle.",
  ],
  balanced: [
    "Mixes keyword-inspired words with moderate mutation and mixed padding.",
    "Aims between memorability and unpredictability for everyday accounts.",
    "Good default when you are unsure which extreme you need.",
  ],
  strongest: [
    "Uses more words, stronger mutation, and higher-entropy padding.",
    "Extra digits and symbols where enabled; harder for attackers to guess.",
    "Best for high-value accounts when you still want phrase-like structure.",
  ],
};

const FORM_TIPS = [
  "Avoid real names, birthdays, addresses, or exact dates—use broad interests only.",
  "Keywords are inspiration only; the output is transformed and should not echo private data.",
  "Prefer 14+ characters for important accounts; length beats complexity alone.",
  "Turn on numbers and symbols when the site allows; they widen the search space.",
  "Use a unique password per site and store them in a trusted password manager.",
  "Check the strength meter and crack-time hint, then pick one suggestion and save it once.",
] as const;

const SAFE_PRACTICE_TIPS = [
  "Never reuse passwords across sites—one breach should not unlock everything.",
  "Use a password manager to generate, fill, and rotate credentials without memorizing dozens.",
  "Enable two-factor authentication (2FA) wherever it is offered, especially on email and banking.",
  "Treat these suggestions as starting points; you can tweak a character before saving if you like.",
  "If a site limits symbols, disable “Include symbols” and regenerate.",
  "Change passwords after known leaks, and prefer app-based 2FA over SMS when available.",
] as const;

const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20";

export function PasswordGeneratorApp() {
  const [options, setOptions] = useState<PasswordGeneratorOptions>(INITIAL_OPTIONS);
  const [suggestions, setSuggestions] = useState<PasswordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const hasEnoughInput = useMemo(
    () => options.keywordsInput.trim().split(",").some((part) => part.trim().length >= 3),
    [options.keywordsInput]
  );

  useEffect(() => {
    if (!hasEnoughInput) {
      setSuggestions([]);
    }
  }, [hasEnoughInput]);

  const handleGenerate = async () => {
    const length = Math.min(Math.max(options.length, 10), 32);
    setLoading(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    try {
      const { generatePasswords } = await import("@/utils/passwordGenerator");
      const next = await generatePasswords({ ...options, length }, 8);
      setSuggestions(next);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 pt-8 md:pb-20 md:pt-12">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1.5 rounded-3xl bg-gradient-to-br from-indigo-500/25 via-teal-500/20 to-sky-500/25 blur-md"
              aria-hidden
            />
            <div className="relative h-[7.5rem] w-52 overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-2.5 py-1.5 shadow-lg shadow-slate-900/10 sm:h-36 sm:w-60">
              <Image
                src="/logo.png"
                alt="Smart Password Creator"
                width={512}
                height={256}
                priority
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
              Smart Password Creator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
              Generate strong but memorable passwords inspired by your interests, not by direct personal
              details. Everything happens in your browser and nothing is stored.
            </p>
          </div>
        </header>

        <section className="mb-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-[var(--card)] shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] ring-1 ring-white/60 backdrop-blur-md md:p-1">
          <div className="rounded-[1.35rem] bg-gradient-to-br from-white via-slate-50/80 to-teal-50/30 p-5 md:p-8">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200/60 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Configure</h2>
                <p className="mt-0.5 text-xs text-slate-500">Set keywords and options, then generate eight ideas.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-800">Keywords or interests</span>
                <span className="text-xs text-slate-500">Comma-separated — broad themes work best.</span>
                <input
                  value={options.keywordsInput}
                  onChange={(event) =>
                    setOptions((prev) => ({ ...prev, keywordsInput: event.target.value }))
                  }
                  placeholder="hiking, jazz, space, coffee"
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-800">Password length</span>
                <span className="text-xs text-slate-500">Between 10 and 32 characters.</span>
                <input
                  type="number"
                  min={10}
                  max={32}
                  value={options.length}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      length: Number.isNaN(Number(event.target.value))
                        ? prev.length
                        : Number(event.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-800">Style</span>
                <span className="text-xs text-slate-500">How readable vs. aggressive the mix is.</span>
                <select
                  value={options.style}
                  onChange={(event) =>
                    setOptions((prev) => ({ ...prev, style: event.target.value as PasswordStyle }))
                  }
                  className={`${inputClass} cursor-pointer`}
                >
                  {STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ul className="mt-2 space-y-1.5 border-l-2 border-teal-500/25 pl-3 text-xs leading-relaxed text-slate-600">
                  {STYLE_HINTS[options.style].map((line) => (
                    <li key={line} className="relative pl-2 before:absolute before:left-0 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-teal-500/60 before:content-['']">
                      {line}
                    </li>
                  ))}
                </ul>
              </label>

              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row">
                <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-slate-200/90 bg-white/60 px-4 py-3.5 shadow-sm transition hover:border-teal-500/30 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={options.includeNumbers}
                    onChange={(event) =>
                      setOptions((prev) => ({ ...prev, includeNumbers: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-500/30"
                  />
                  <span className="text-sm font-medium text-slate-700">Include numbers</span>
                </label>
                <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-slate-200/90 bg-white/60 px-4 py-3.5 shadow-sm transition hover:border-teal-500/30 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={options.includeSymbols}
                    onChange={(event) =>
                      setOptions((prev) => ({ ...prev, includeSymbols: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-500/30"
                  />
                  <span className="text-sm font-medium text-slate-700">Include symbols</span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-6 border-t border-slate-200/60 pt-6 md:flex-row md:items-end md:justify-between">
              <ul className="max-w-2xl space-y-2 text-xs leading-relaxed text-slate-600">
                {FORM_TIPS.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!hasEnoughInput || loading}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/15 transition hover:from-indigo-500 hover:to-teal-500 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none md:min-w-[200px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Generating…
                  </span>
                ) : (
                  "Generate 8 Passwords"
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Suggestions</h2>
              <p className="mt-0.5 text-xs text-slate-500">Pick one row, copy, and save in your password manager.</p>
            </div>
            {suggestions.length > 0 ? (
              <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                {suggestions.length} shown
              </span>
            ) : null}
          </div>
          {suggestions.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {suggestions.map((suggestion) => (
                <PasswordCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/50 px-6 py-14 text-center shadow-inner">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.169.659-1.591l6.728-6.728a3 3 0 015.912-7.029 6 6 0 017.029 5.912z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">No passwords yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                Add a few interests (at least one keyword with 3+ characters), choose your options, and generate
                password ideas.
              </p>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-6 shadow-sm ring-1 ring-emerald-900/5 md:p-8">
          <h2 className="text-base font-semibold text-emerald-950">Safe password practices</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-emerald-900/90">
            {SAFE_PRACTICE_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
