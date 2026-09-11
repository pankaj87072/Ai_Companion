import type { CompanionEmotion } from "../types";

// A small, transparent heuristic -- not sentiment ML. It exists purely to make the
// companion visibly react (comfort vs. celebrate vs. worry) while the reply is being
// generated, and to color its expression once the reply arrives. It intentionally errs
// toward simple, readable keyword matches rather than anything opaque.

const COMFORT_WORDS = [
  "sad",
  "upset",
  "crying",
  "cried",
  "cry",
  "depress",
  "heartbroken",
  "lonely",
  "miserable",
  "awful",
  "terrible day",
  "hurt",
  "hopeless",
  "grief",
  "broke up",
  "breakup",
  "lost my",
  "miss him",
  "miss her",
  "rough day",
  "hard day",
  "exhausting day",
];

const CONCERN_WORDS = [
  "anxious",
  "anxiety",
  "worried",
  "worry",
  "nervous",
  "scared",
  "afraid",
  "stressed",
  "stress",
  "panic",
  "overwhelmed",
  "can't sleep",
  "cant sleep",
  "exam",
  "interview tomorrow",
  "deadline",
];

const EXCITED_WORDS = [
  "excited",
  "amazing",
  "awesome",
  "yay",
  "proud",
  "love it",
  "thrilled",
  "wonderful",
  "fantastic",
  "great news",
  "i got the job",
  "i passed",
  "we won",
  "best day",
  "so happy",
  "can't wait",
  "cant wait",
];

const CALM_WORDS = ["tired", "sleepy", "resting", "relaxed", "exhausted", "long day"];

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

export function detectEmotion(text: string): CompanionEmotion {
  const t = text.toLowerCase();

  if (includesAny(t, COMFORT_WORDS)) return "comforting";
  if (includesAny(t, CONCERN_WORDS)) return "concerned";
  if (includesAny(t, EXCITED_WORDS)) return "excited";
  if (includesAny(t, CALM_WORDS)) return "calm";

  return "neutral";
}
