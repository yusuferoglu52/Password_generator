import {
  PasswordGeneratorOptions,
  PasswordStyle,
  PasswordSuggestion,
} from "@/types/password";
import { analyzePasswordStrength } from "@/lib/zxcvbn";

const SYMBOLS = "!@#$%&*_-+=?";
const VOWELS = /[aeiou]/gi;

/** Short pronounceable chunks for memorable padding (not user keywords). */
const MEMORABLE_FILLERS = [
  "ka",
  "lo",
  "mi",
  "nu",
  "ra",
  "ti",
  "vo",
  "ze",
  "po",
  "si",
  "du",
  "fa",
  "gi",
  "hu",
  "ja",
  "ki",
  "mo",
  "ne",
  "ro",
  "tu",
];

type StyleProfile = {
  wordCount: [number, number];
  mutationRate: number;
  separatorSet: string[];
  /** Title-case words only; no vowel stripping or odd caps. */
  readableWords: boolean;
  padMode: "readable" | "shuffle" | "heavy";
};

const STYLE_PROFILES: Record<PasswordStyle, StyleProfile> = {
  memorable: {
    wordCount: [3, 4],
    mutationRate: 0.06,
    separatorSet: ["-", "."],
    readableWords: true,
    padMode: "readable",
  },
  balanced: {
    wordCount: [2, 4],
    mutationRate: 0.28,
    separatorSet: ["-", "_", ".", "~"],
    readableWords: false,
    padMode: "shuffle",
  },
  strongest: {
    wordCount: [4, 6],
    mutationRate: 0.58,
    separatorSet: ["-", "_", ".", "~", "*", "+"],
    readableWords: false,
    padMode: "heavy",
  },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChar(charset: string): string {
  return charset[randomInt(0, charset.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function splitAndNormalizeKeywords(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((value) => value.replace(/[^a-z0-9]/g, ""))
    .filter((value) => value.length >= 3);
}

function isSensitiveToken(token: string): boolean {
  const fullNameLike = /^[a-z]{2,}[a-z]{2,}$/i.test(token) && token.length > 10;
  const dateLike =
    /^\d{6,8}$/.test(token) ||
    /(19|20)\d{2}/.test(token) ||
    /(0[1-9]|1[0-2])[.\-/](0[1-9]|[12]\d|3[01])[.\-/]\d{2,4}/.test(token);
  return fullNameLike || dateLike;
}

function transformWord(word: string, mutationRate: number, readable: boolean): string {
  if (readable) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  let transformed = word;

  if (Math.random() < mutationRate) {
    transformed = transformed.replace(VOWELS, (vowel) => (Math.random() < 0.5 ? vowel : ""));
    if (!transformed) transformed = word.slice(0, Math.max(2, Math.floor(word.length / 2)));
  }

  if (Math.random() < mutationRate) {
    transformed =
      transformed.charAt(0).toUpperCase() +
      transformed.slice(1, Math.max(2, transformed.length - 1)) +
      transformed.slice(-1).toUpperCase();
  } else {
    transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
  }

  return transformed;
}

function buildBasePhrase(
  tokens: string[],
  style: PasswordStyle
): { phrase: string; separator: string } {
  const profile = STYLE_PROFILES[style];
  const maxWords = Math.min(profile.wordCount[1], Math.max(2, tokens.length));
  const wordCount = randomInt(profile.wordCount[0], maxWords);
  const selected = shuffle(tokens).slice(0, wordCount);
  const transformed = selected.map((token) =>
    transformWord(token, profile.mutationRate, profile.readableWords)
  );
  const separator = profile.separatorSet[randomInt(0, profile.separatorSet.length - 1)];
  return { phrase: transformed.join(separator), separator };
}

function suffixLength(
  style: PasswordStyle,
  includeNumbers: boolean,
  includeSymbols: boolean
): number {
  let n = 0;
  if (includeNumbers) {
    n += style === "memorable" ? 1 : 2;
  }
  if (includeSymbols) {
    n += style === "strongest" ? 2 : 1;
  }
  return n;
}

function addCharacterClasses(
  value: string,
  includeNumbers: boolean,
  includeSymbols: boolean,
  style: PasswordStyle
): string {
  let result = value;

  if (includeNumbers) {
    const digits =
      style === "memorable"
        ? `${randomInt(2, 9)}`
        : style === "strongest"
          ? `${randomInt(10, 99)}${randomInt(0, 9)}`
          : `${randomInt(10, 99)}`;
    result += digits;
  }

  if (includeSymbols) {
    const symbolCount = style === "strongest" ? 2 : 1;
    for (let i = 0; i < symbolCount; i += 1) {
      result += randomChar(SYMBOLS);
    }
  }

  return result;
}

function truncateMemorable(phrase: string, separator: string, maxLen: number): string {
  if (phrase.length <= maxLen) return phrase;
  const parts = phrase.split(separator);
  while (parts.length > 1 && parts.join(separator).length > maxLen) {
    parts.pop();
  }
  let out = parts.join(separator);
  if (out.length > maxLen) {
    out = out.slice(0, maxLen);
  }
  return out;
}

/**
 * Memorable: extend with extra Title-case tokens or short fillers, same separator; no full-string shuffle.
 */
function padMemorable(
  phrase: string,
  separator: string,
  targetBodyLength: number,
  tokenPool: string[]
): string {
  if (phrase.length >= targetBodyLength) {
    return phrase.slice(0, targetBodyLength);
  }

  let result = phrase;
  const extras = shuffle(tokenPool.filter((t) => !phrase.toLowerCase().includes(t.toLowerCase())));

  let i = 0;
  while (result.length < targetBodyLength && i < extras.length) {
    const chunk = transformWord(extras[i], 0, true);
    const next = `${result}${separator}${chunk}`;
    if (next.length <= targetBodyLength) {
      result = next;
    }
    i += 1;
  }

  const fillers = shuffle([...MEMORABLE_FILLERS]);
  let f = 0;
  while (result.length < targetBodyLength && f < fillers.length * 4) {
    const raw = fillers[f % fillers.length];
    const piece = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    const next = `${result}${separator}${piece}`;
    if (next.length <= targetBodyLength) {
      result = next;
    } else {
      const room = targetBodyLength - result.length - separator.length;
      if (room > 0) {
        result = `${result}${separator}${piece.slice(0, room)}`;
      }
      break;
    }
    f += 1;
  }

  while (result.length < targetBodyLength) {
    result += randomChar("bcdfghjklmnpqrstvwxyz");
  }

  return result.slice(0, targetBodyLength);
}

function padToLength(
  value: string,
  targetLength: number,
  includeSymbols: boolean,
  style: PasswordStyle
): string {
  if (value.length >= targetLength) return value.slice(0, targetLength);

  const alnum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charset = includeSymbols ? `${alnum}${SYMBOLS}` : alnum;
  let result = value;

  while (result.length < targetLength) {
    result += randomChar(charset);
  }

  if (STYLE_PROFILES[style].padMode === "heavy" && result.length === targetLength) {
    const chars = result.split("");
    for (let k = 0; k < 2; k += 1) {
      const idx = randomInt(1, Math.max(1, chars.length - 2));
      if (includeSymbols && Math.random() < 0.5) {
        chars[idx] = randomChar(SYMBOLS);
      } else {
        chars[idx] = randomChar(alnum);
      }
    }
    result = chars.join("");
  }

  return shuffle(result.split("")).join("").slice(0, targetLength);
}

function fallbackTokens(): string[] {
  return ["orbit", "maple", "nova", "drift", "lumen", "ripple", "terra", "zenith"];
}

async function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (scheduler?.yield) {
    await scheduler.yield();
    return;
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function buildRandomPassword(target: number, includeSymbols: boolean): string {
  const alnum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charset = includeSymbols ? `${alnum}${SYMBOLS}` : alnum;
  const bytes = new Uint8Array(target);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < target; i += 1) {
    result += charset[bytes[i]! % charset.length]!;
  }
  return result;
}

const MAX_GENERATION_ATTEMPTS = 2500;
const MAX_FALLBACK_ATTEMPTS = 400;

export async function generatePasswords(
  options: PasswordGeneratorOptions,
  count = 8
): Promise<PasswordSuggestion[]> {
  const normalizedKeywords = splitAndNormalizeKeywords(options.keywordsInput).filter(
    (token) => !isSensitiveToken(token)
  );
  const tokenPool = normalizedKeywords.length > 0 ? normalizedKeywords : fallbackTokens();

  const suggestions: PasswordSuggestion[] = [];
  const target = Math.min(Math.max(options.length, 10), 32);
  let attempts = 0;

  while (suggestions.length < count && attempts < MAX_GENERATION_ATTEMPTS) {
    attempts += 1;
    await yieldToMain();

    const { phrase, separator } = buildBasePhrase(tokenPool, options.style);
    const reserved = suffixLength(options.style, options.includeNumbers, options.includeSymbols);
    const maxBody = Math.max(1, target - reserved);

    let body: string;
    if (options.style === "memorable") {
      if (phrase.length > maxBody) {
        body = truncateMemorable(phrase, separator, maxBody);
      } else {
        body = padMemorable(phrase, separator, maxBody, tokenPool);
      }
    } else {
      body = phrase.slice(0, maxBody);
    }

    const withClasses = addCharacterClasses(
      body,
      options.includeNumbers,
      options.includeSymbols,
      options.style
    );
    const finalValue =
      options.style === "memorable"
        ? withClasses.slice(0, target)
        : padToLength(withClasses, target, options.includeSymbols, options.style);

    const strength = await analyzePasswordStrength(finalValue);

    if (!suggestions.some((item) => item.value === finalValue)) {
      suggestions.push({
        id: `${Date.now()}-${suggestions.length}-${Math.random().toString(36).slice(2, 8)}`,
        value: finalValue,
        ...strength,
      });
    }
  }

  let fallbackAttempts = 0;
  while (suggestions.length < count && fallbackAttempts < MAX_FALLBACK_ATTEMPTS) {
    fallbackAttempts += 1;
    await yieldToMain();
    const finalValue = buildRandomPassword(target, options.includeSymbols);
    if (suggestions.some((item) => item.value === finalValue)) continue;
    const strength = await analyzePasswordStrength(finalValue);
    suggestions.push({
      id: crypto.randomUUID(),
      value: finalValue,
      ...strength,
    });
  }

  return suggestions;
}
