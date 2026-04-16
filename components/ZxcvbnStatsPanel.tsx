import type { PasswordSuggestion } from "@/types/password";

type ZxcvbnStatsPanelProps = Pick<
  PasswordSuggestion,
  | "guesses"
  | "guessesLog10"
  | "crackTimesDisplay"
  | "crackTimesSeconds"
  | "calcTimeMs"
  | "matchCount"
>;

const CRACK_ROWS: Array<{
  key: keyof ZxcvbnStatsPanelProps["crackTimesDisplay"];
  label: string;
  hint: string;
}> = [
  {
    key: "onlineThrottling100PerHour",
    label: "Online throttled (100/h)",
    hint: "Assumes a remote login limit—like many websites—not a leaked database.",
  },
  {
    key: "onlineNoThrottling10PerSecond",
    label: "Online (10/s)",
    hint: "Unthrottled guessing over the network; faster than strict rate limits.",
  },
  {
    key: "offlineSlowHashing1e4PerSecond",
    label: "Offline slow hash (10⁴/s)",
    hint: "Stolen hashes attacked with a slower hash (e.g. bcrypt-like); a common “serious” baseline.",
  },
  {
    key: "offlineFastHashing1e10PerSecond",
    label: "Offline fast hash (10¹⁰/s)",
    hint: "If hashes are weak or parallel GPUs apply; worst-case offline speed.",
  },
];

function formatSeconds(s: number): string {
  if (!Number.isFinite(s)) return "—";
  if (s >= 1e15) return `${(s / 1e15).toFixed(2)}×10¹⁵ s`;
  if (s >= 1e12) return `${(s / 1e12).toFixed(2)}×10¹² s`;
  if (s >= 1e9) return `${(s / 1e9).toFixed(2)}×10⁹ s`;
  if (s >= 1e6) return `${(s / 1e6).toFixed(2)}×10⁶ s`;
  if (s >= 1e3) return `${(s / 1e3).toFixed(2)}×10³ s`;
  if (s >= 1) return `${s.toFixed(2)} s`;
  if (s >= 1e-3) return `${(s * 1e3).toFixed(2)} ms`;
  return `${s.toExponential(2)} s`;
}

export function ZxcvbnStatsPanel(props: ZxcvbnStatsPanelProps) {
  const calcLabel =
    props.calcTimeMs < 1 ? "<1 ms" : `${props.calcTimeMs < 10 ? props.calcTimeMs.toFixed(2) : props.calcTimeMs.toFixed(1)} ms`;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50/90 to-white/60 px-3 py-3 text-xs text-slate-600 shadow-inner ring-1 ring-slate-100/80">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">zxcvbn estimates</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">
        Heuristic model: not a guarantee. Real risk depends on hashing, leaks, and attacker resources.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white/70 px-2.5 py-2 ring-1 ring-slate-100">
          <span className="text-[11px] font-medium text-slate-500">Guesses</span>
          <p className="mt-0.5 font-mono text-sm text-slate-800">
            {props.guesses.toLocaleString()}
            <span className="ml-1 text-xs text-slate-500">(log₁₀ {props.guessesLog10.toFixed(2)})</span>
          </p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Estimated search space before scoring; higher usually means harder to brute-force.
          </p>
        </div>
        <div className="rounded-lg bg-white/70 px-2.5 py-2 ring-1 ring-slate-100">
          <span className="text-[11px] font-medium text-slate-500">Match segments</span>
          <p className="mt-0.5 font-mono text-sm text-slate-800">{props.matchCount}</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            How many patterns (words, repeats, sequences, etc.) zxcvbn used to explain the password.
          </p>
        </div>
        <div className="rounded-lg bg-white/70 px-2.5 py-2 ring-1 ring-slate-100 sm:col-span-2">
          <span className="text-[11px] font-medium text-slate-500">Analysis time</span>
          <p className="mt-0.5 font-mono text-sm text-slate-800">{calcLabel}</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            CPU time for this check in your browser; unrelated to how long a real attack would take.
          </p>
        </div>
      </div>
      <p className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Time to crack (display)</p>
      <p className="mb-2 text-[11px] leading-snug text-slate-500">
        Human-readable times for each attack model below (same scenarios as the numeric seconds).
      </p>
      <ul className="space-y-2">
        {CRACK_ROWS.map(({ key, label, hint }) => (
          <li
            key={key}
            className="rounded-lg border border-slate-100/90 bg-white/60 px-2.5 py-2 last:mb-0"
          >
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              <span className="shrink-0 text-[11px] font-semibold text-slate-600">{label}</span>
              <span className="font-mono text-xs text-slate-800">{props.crackTimesDisplay[key]}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p>
          </li>
        ))}
      </ul>
      <details className="group mt-3 rounded-lg border border-slate-200/80 bg-white/50 px-2 py-1.5 transition hover:bg-white/80">
        <summary className="cursor-pointer list-none text-[11px] font-semibold text-slate-700 marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1.5">
            Crack time (seconds, raw)
            <span className="text-slate-400 transition group-open:rotate-90">›</span>
          </span>
        </summary>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">
          Same four scenarios as above, as seconds in scientific-style shorthand for large values.
        </p>
        <ul className="mt-2 space-y-2">
          {CRACK_ROWS.map(({ key, label, hint }) => (
            <li key={`${key}-sec`} className="rounded-lg border border-slate-100/90 bg-slate-50/50 px-2.5 py-2">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 text-[11px] font-semibold text-slate-600">{label}</span>
                <span className="font-mono text-xs text-slate-800">{formatSeconds(props.crackTimesSeconds[key])}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
