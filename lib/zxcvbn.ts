import type { PasswordStrengthAnalysis, PasswordStrengthLabel } from "@/types/password";
import type { ZxcvbnResult } from "@zxcvbn-ts/core";

type ZxcvbnFn = (password: string, userInputs?: (string | number)[]) => ZxcvbnResult;

let zxcvbnFn: ZxcvbnFn | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Lazy-loads dictionaries on first use so the initial page bundle stays responsive.
 * Heavy work runs after the user clicks Generate (or first analysis), not on first paint.
 */
async function ensureZxcvbnLoaded(): Promise<ZxcvbnFn> {
  if (zxcvbnFn) return zxcvbnFn;
  if (!loadPromise) {
    loadPromise = (async () => {
      const [core, common, en] = await Promise.all([
        import("@zxcvbn-ts/core"),
        import("@zxcvbn-ts/language-common"),
        import("@zxcvbn-ts/language-en"),
      ]);
      core.zxcvbnOptions.setOptions({
        translations: en.translations,
        graphs: common.adjacencyGraphs,
        dictionary: {
          ...common.dictionary,
          ...en.dictionary,
        },
        // Faster than Levenshtein on long passwords; still strong enough for UI feedback.
        useLevenshteinDistance: false,
      });
      zxcvbnFn = core.zxcvbn;
    })();
  }
  await loadPromise;
  return zxcvbnFn!;
}

function clampScore(score: number): 0 | 1 | 2 | 3 | 4 {
  const n = Math.min(4, Math.max(0, Math.round(score)));
  return n as 0 | 1 | 2 | 3 | 4;
}

function capScoreByCrackTime(score: 0 | 1 | 2 | 3 | 4, offlineSlowHashSeconds: number): 0 | 1 | 2 | 3 | 4 {
  // If a password can be cracked in seconds on the offline-slow-hash model,
  // force it into the lowest tier regardless of pattern score.
  if (Number.isFinite(offlineSlowHashSeconds) && offlineSlowHashSeconds < 60) {
    return 0;
  }
  return score;
}

export function getPasswordStrengthLabel(score: number): PasswordStrengthLabel {
  const s = clampScore(score);
  if (s === 0) return "very weak";
  if (s === 1) return "weak";
  if (s === 2) return "fair";
  if (s === 3) return "strong";
  return "very strong";
}

export async function analyzePasswordStrength(password: string): Promise<PasswordStrengthAnalysis> {
  const zxcvbn = await ensureZxcvbnLoaded();
  const result = zxcvbn(password);
  const score = capScoreByCrackTime(
    clampScore(result.score),
    result.crackTimesSeconds.offlineSlowHashing1e4PerSecond
  );
  const feedback: string[] = [];
  if (result.feedback.warning) {
    feedback.push(result.feedback.warning);
  }
  feedback.push(...result.feedback.suggestions);

  return {
    score,
    label: getPasswordStrengthLabel(score),
    feedback,
    crackTime: result.crackTimesDisplay.offlineSlowHashing1e4PerSecond,
    guesses: result.guesses,
    guessesLog10: result.guessesLog10,
    crackTimesDisplay: { ...result.crackTimesDisplay },
    crackTimesSeconds: { ...result.crackTimesSeconds },
    calcTimeMs: result.calcTime,
    matchCount: result.sequence.length,
  };
}
