import { Word, is_root } from "./dict";

// Every root is one CMVN syllable, and its root ID (0-255) is four base-4 digits, one per mark:
//   C = base consonant (place), M = manner (modifies C), V = vowel, N = final (or nothing)
// C and M together pick the onset. Onsets and finals share no sounds, so syllable
// boundaries are always audible, even when N is nothing.
// A sound written "a/b" (e.g. "r/l") is one phoneme whose realization varies freely by
// speaker; the first variant is the spelling.
// Syllables in a compound never change each other's sounds: a compound is pronounced as
// its roots' syllables, one after another. Stress: a simple rule, TBD.

export const MARKS = ["C", "M", "V", "N"] as const;
export type Mark = (typeof MARKS)[number];

export type Phonology = {
  places: string[]; // C labels, one per onset column
  manners: string[]; // M labels, one per onset row
  onsets: string[][]; // [manner][place]
  vowels: string[];
  finals: string[]; // "" = no final
  order: Mark[]; // which mark each base-4 digit of the ID selects, fastest-varying first
};

export const default_phonology: Phonology = {
  places: ["labial", "velar", "coronal", "sibilant"],
  manners: ["unvoiced", "voiced", "fricative", "voiced fricative"],
  onsets: [
    ["p", "k", "t", "s"],
    ["b", "g", "d", "z"],
    ["f", "kh", "th", "sh"],
    ["v", "gh", "dh", "zh"],
  ],
  vowels: ["a", "e", "o", "u"],
  finals: ["", "n/m", "r/l", "i"],
  order: ["C", "M", "V", "N"],
};

export type MarkValues = Record<Mark, number>;

export function marks_of(id: number, phonology: Phonology): MarkValues {
  const values = {} as MarkValues;
  phonology.order.forEach((mark, digit) => {
    values[mark] = Math.floor(id / 4 ** digit) % 4;
  });
  return values;
}

export function variants_of(sound: string): string[] {
  return sound.split("/");
}

export function spelling_of(sound: string): string {
  return variants_of(sound)[0]!;
}

export function syllable_of(id: number, phonology: Phonology): string {
  const { C, M, V, N } = marks_of(id, phonology);
  return [phonology.onsets[M]![C]!, phonology.vowels[V]!, phonology.finals[N]!]
    .map(spelling_of)
    .join("");
}

// A compound is its roots' syllables in sequence, unchanged.
export function pronounce(word: Word, phonology: Phonology): string {
  if (is_root(word)) return syllable_of(word.data.id, phonology);
  return word.data.parts.map((part) => pronounce(part, phonology)).join(".");
}

// Describes what a subset of marks has in common, e.g. the column or row of the Roots grid.
export function describe_marks(values: Partial<MarkValues>, phonology: Phonology): string {
  const parts: string[] = [];
  const { C, M, V, N } = values;
  if (C !== undefined && M !== undefined) parts.push(spelling_of(phonology.onsets[M]![C]!));
  else if (C !== undefined) parts.push(phonology.places[C]!);
  else if (M !== undefined) parts.push(phonology.manners[M]!);
  if (V !== undefined && N !== undefined)
    parts.push(`-${spelling_of(phonology.vowels[V]!)}${spelling_of(phonology.finals[N]!)}`);
  else if (V !== undefined) parts.push(`-${spelling_of(phonology.vowels[V]!)}-`);
  else if (N !== undefined)
    parts.push(phonology.finals[N] ? `-${phonology.finals[N]}` : "no final");
  return parts.join(" ");
}

export type PhonologyReport = {
  duplicates: string[]; // syllables shared by more than one ID, as "syllable: id, id"
  onset_final_overlap: string[];
  ambiguous_pairs: string[]; // two-syllable sequences that can be split more than one way
  ambiguous_pair_count: number;
};

export function check_phonology(phonology: Phonology): PhonologyReport {
  const syllables = Array.from({ length: 256 }, (_, id) => syllable_of(id, phonology));

  const ids_by_syllable = new Map<string, number[]>();
  syllables.forEach((s, id) => ids_by_syllable.set(s, [...(ids_by_syllable.get(s) ?? []), id]));
  const duplicates = [...ids_by_syllable.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([s, ids]) => `${s}: ${ids.join(", ")}`);

  const onsets = new Set(phonology.onsets.flat().flatMap(variants_of));
  const onset_final_overlap = phonology.finals
    .flatMap(variants_of)
    .filter((f) => f !== "" && onsets.has(f));

  // Every way of hearing two syllables back to back should split them the same way
  const syllable_set = new Set(syllables);
  const ambiguous_pairs: string[] = [];
  let ambiguous_pair_count = 0;
  for (const a of syllables) {
    for (const b of syllables) {
      const sequence = a + b;
      for (let i = 1; i < sequence.length; i++) {
        if (i === a.length) continue;
        const left = sequence.slice(0, i);
        const right = sequence.slice(i);
        if (syllable_set.has(left) && syllable_set.has(right)) {
          ambiguous_pair_count++;
          if (ambiguous_pairs.length < 5) ambiguous_pairs.push(`${a}.${b} = ${left}.${right}`);
          break;
        }
      }
    }
  }

  return { duplicates, onset_final_overlap, ambiguous_pairs, ambiguous_pair_count };
}

// Only edits are stored, so changes to the defaults show up for unedited settings
const STORAGE_KEY = "clg.phonology.v2";

export function load_phonology(): Phonology {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...default_phonology, ...JSON.parse(stored) };
  } catch {}
  return default_phonology;
}

export function save_phonology(phonology: Phonology) {
  try {
    const json = JSON.stringify(phonology);
    if (json === JSON.stringify(default_phonology)) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, json);
  } catch {}
}
