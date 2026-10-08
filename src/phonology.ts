import { Word, is_root } from "./dict";
import saved_defaults from "./phonology.defaults.json";

// Every root is one CMVN syllable, and its root ID (0-255) is four base-4 digits, one per mark:
//   C = base consonant (place), M = manner (modifies C), V = vowel, N = final (or nothing)
// C and M together pick the onset. Onsets and finals share no sounds, so syllable
// boundaries are always audible, even when N is nothing.
// A sound written "a/b" (e.g. "r/l") is one phoneme whose realization varies freely by
// speaker; the first variant is the spelling.
// Syllables in a compound never change each other's sounds: a compound is pronounced as
// its roots' syllables, one after another. Stress is on a word's first syllable, which marks
// where each word starts (the alternative was the second to last, as in Polish).

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

// The defaults live in phonology.defaults.json so the playground's "Save as defaults" can write them
if (!is_phonology(saved_defaults))
  throw new Error("phonology.defaults.json is not a valid phonology");
export const default_phonology: Phonology = saved_defaults;

export function is_phonology(value: unknown): value is Phonology {
  const strings = (list: unknown, length: number): list is string[] =>
    Array.isArray(list) && list.length === length && list.every((x) => typeof x === "string");
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<keyof Phonology, unknown>;
  return (
    strings(p.places, 4) &&
    strings(p.manners, 4) &&
    Array.isArray(p.onsets) &&
    p.onsets.length === 4 &&
    p.onsets.every((row) => strings(row, 4)) &&
    strings(p.vowels, 4) &&
    strings(p.finals, 4) &&
    strings(p.order, 4) &&
    MARKS.every((mark) => (p.order as string[]).includes(mark))
  );
}

// JSON with each list of sounds on one line
export function phonology_to_json(phonology: Phonology): string {
  return (
    JSON.stringify(phonology, null, 2).replace(
      /\[\s+([^[\]{}]*?)\s+\]/g,
      (_, items: string) => `[${items.split(/,\s+/).join(", ")}]`,
    ) + "\n"
  );
}

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

// A compound is its roots' syllables run together, unchanged: syllables can only be split one way.
export function pronounce(word: Word, phonology: Phonology): string {
  if (is_root(word)) return syllable_of(word.data.id, phonology);
  return word.data.parts.map((part) => pronounce(part, phonology)).join("");
}

// Describes what a subset of marks has in common, e.g. the column or row of the Roots grid.
export function describe_marks(values: Partial<MarkValues>, phonology: Phonology): string[] {
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
  return parts;
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

// Only the groups of settings that differ from the defaults are stored, so a change to the
// defaults still shows up in every group you haven't edited. The onset table's labels move
// with its sounds when you reorder it, so they're stored together.
const SETTING_GROUPS: (keyof Phonology)[][] = [
  ["places", "manners", "onsets"],
  ["vowels"],
  ["finals"],
  ["order"],
];
const STORAGE_KEY = "clg.phonology.v3";
const OLD_STORAGE_KEYS = ["clg.phonology", "clg.phonology.v2"];

function pick(phonology: Phonology, keys: (keyof Phonology)[]): Partial<Phonology> {
  return Object.fromEntries(keys.map((key) => [key, phonology[key]]));
}

export function load_phonology(): Phonology {
  try {
    OLD_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...default_phonology, ...JSON.parse(stored) };
  } catch {}
  return default_phonology;
}

export function save_phonology(phonology: Phonology) {
  try {
    const edited: Partial<Phonology> = {};
    for (const group of SETTING_GROUPS) {
      const values = pick(phonology, group);
      if (JSON.stringify(values) !== JSON.stringify(pick(default_phonology, group))) {
        Object.assign(edited, values);
      }
    }
    if (Object.keys(edited).length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(edited));
  } catch {}
}

// A foreign name or borrowing, respelled in our syllables, as Japanese and Toki Pona adapt
// names (London, Lonton). Each sound is kept where we have it; otherwise a consonant becomes
// the onset at its place and manner, and a vowel the nearest we have. n, m, r and l close the
// syllable before them where they can, a vowel with no onset takes kh (velar fricative), and an
// onset with no vowel takes u. Babel is ba-bel, Shinar shen-khar and Adam kha-dan.
const FOREIGN_FEATURES: Record<string, [place: string, manner: string]> = {
  k: ["velar", "unvoiced"],
  c: ["velar", "unvoiced"],
  q: ["velar", "unvoiced"],
  g: ["velar", "voiced"],
  h: ["velar", "fricative"],
  x: ["velar", "fricative"],
  kh: ["velar", "fricative"],
  gh: ["velar", "voiced fricative"],
  t: ["coronal", "unvoiced"],
  d: ["coronal", "voiced"],
  n: ["coronal", "voiced"],
  l: ["coronal", "voiced"],
  r: ["coronal", "voiced"],
  th: ["coronal", "fricative"],
  dh: ["coronal", "voiced fricative"],
  p: ["labial", "unvoiced"],
  b: ["labial", "voiced"],
  m: ["labial", "voiced"],
  f: ["labial", "fricative"],
  ph: ["labial", "fricative"],
  v: ["labial", "voiced fricative"],
  w: ["labial", "voiced fricative"],
  bh: ["labial", "voiced fricative"],
  s: ["sibilant", "unvoiced"],
  z: ["sibilant", "voiced"],
  sh: ["sibilant", "fricative"],
  ch: ["sibilant", "fricative"],
  zh: ["sibilant", "voiced fricative"],
  j: ["sibilant", "voiced fricative"],
  y: ["sibilant", "voiced fricative"],
};
// Nearest vowels, best first, for a vowel we don't have
const FOREIGN_VOWELS: Record<string, string[]> = {
  a: ["a", "o", "e"],
  e: ["e", "i", "a"],
  i: ["i", "e", "u"],
  y: ["i", "e", "u"],
  o: ["o", "u", "a"],
  u: ["u", "o", "e"],
};
const VOWEL_LETTERS = new Set(Object.keys(FOREIGN_VOWELS));
const FOREIGN_ONSET_DEFAULT: [string, string] = ["velar", "fricative"];
const FOREIGN_EPENTHETIC = "u";

export function adapt_foreign(name: string, phonology: Phonology): string[] {
  const letters = name
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");
  const has = (list: string[], sound: string) => list.find((s) => variants_of(s).includes(sound));
  const onset_at = ([place, manner]: [string, string]) => {
    const C = phonology.places.indexOf(place);
    const M = phonology.manners.indexOf(manner);
    return C >= 0 && M >= 0 ? phonology.onsets[M]![C]! : phonology.onsets[0]![0]!;
  };
  const vowel_for = (v: string) =>
    has(phonology.vowels, v) ??
    (FOREIGN_VOWELS[v] ?? []).map((x) => has(phonology.vowels, x)).find(Boolean) ??
    phonology.vowels[0]!;
  // Split into sounds, longest match first: our own spellings, then the digraphs we know
  const known = [...phonology.onsets.flat(), ...phonology.vowels, ...phonology.finals]
    .flatMap(variants_of)
    .concat(Object.keys(FOREIGN_FEATURES), [...VOWEL_LETTERS])
    .filter((s) => s.length > 0)
    .sort((a, b) => b.length - a.length);
  const sounds: string[] = [];
  for (let i = 0; i < letters.length; ) {
    const sound = known.find((s) => letters.startsWith(s, i)) ?? letters[i]!;
    sounds.push(sound);
    i += sound.length;
  }
  const is_vowel = (s: string | undefined, next: string | undefined): boolean =>
    s !== undefined &&
    (s === "y" ? !is_vowel(next, undefined) : VOWEL_LETTERS.has(s) || has(phonology.vowels, s) !== undefined);

  type Syllable = { onset?: string; vowel?: string; final?: string };
  const syllables: Syllable[] = [];
  let current: Syllable = {};
  const close = () => {
    if (current.onset === undefined && current.vowel === undefined) return;
    current.onset ??= onset_at(FOREIGN_ONSET_DEFAULT);
    current.vowel ??= vowel_for(FOREIGN_EPENTHETIC);
    syllables.push(current);
    current = {};
  };
  sounds.forEach((sound, i) => {
    const final = has(phonology.finals.filter((f) => f !== ""), sound);
    if (is_vowel(sound, sounds[i + 1])) {
      if (current.vowel === undefined) current.vowel = vowel_for(sound);
      else if (current.final === undefined && final) current.final = final;
      else {
        close();
        current.vowel = vowel_for(sound);
      }
    } else if (current.vowel !== undefined && current.final === undefined && final) {
      current.final = final;
    } else {
      close();
      const onset = has(phonology.onsets.flat(), sound);
      const features = FOREIGN_FEATURES[sound];
      if (onset ?? features) current.onset = onset ?? onset_at(features!);
    }
  });
  close();
  return syllables.map((s) => [s.onset!, s.vowel!, s.final ?? ""].map(spelling_of).join(""));
}
