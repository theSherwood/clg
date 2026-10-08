import { is_root, type Word } from "./dict";
import { tokenize } from "./examples";
import { type Mark, type Phonology, adapt_foreign, marks_of, spelling_of, syllable_of } from "./phonology";

// Candidate scripts, for the playground. Each writes a syllable from its four marks, so every
// script covers all 256 roots. Mappings are keyed by each value's label (a place, a manner, a
// vowel, a final), so they follow the sounds when the phonology playground reorders them.

// A mark's four values, by label, in the phonology's current order
export function value_labels(mark: Mark, phonology: Phonology): string[] {
  if (mark === "C") return phonology.places;
  if (mark === "M") return phonology.manners;
  if (mark === "V") return phonology.vowels.map(spelling_of);
  return phonology.finals.map((f) => spelling_of(f) || "none");
}

export const MARK_NAMES: Record<Mark, string> = { C: "place", M: "manner", V: "vowel", N: "final" };

// A mapping from each value's label to a choice (a dot state, a shape, a turn)
export type Assignment = Record<string, number>;

function choice(assignment: Assignment, mark: Mark, value: number, phonology: Phonology): number {
  return assignment[value_labels(mark, phonology)[value]!] ?? value;
}

// Labels that share a choice, which would make two syllables look alike
export function clashes(assignment: Assignment, mark: Mark, phonology: Phonology): string[] {
  const labels = value_labels(mark, phonology);
  const by_choice = new Map<number, string[]>();
  labels.forEach((label, v) => {
    const c = choice(assignment, mark, v, phonology);
    by_choice.set(c, [...(by_choice.get(c) ?? []), label]);
  });
  return [...by_choice.values()].filter((l) => l.length > 1).map((l) => l.join(" and "));
}

// Braille: one 8-dot cell per syllable, one mark per row (2 dots, so 4 states). The stem script
// is the same cell drawn as strokes: a stem with a rung per row, none, left, right or across.

export const DOT_STATES = ["none", "left", "right", "both"] as const;

export type BrailleSettings = { rows: Mark[]; states: Record<Mark, Assignment> };

export const default_braille: BrailleSettings = {
  rows: ["C", "M", "V", "N"],
  states: {
    C: { velar: 2, coronal: 3, labial: 1, sibilant: 0 },
    M: { unvoiced: 0, voiced: 1, fricative: 2, "voiced fricative": 3 },
    V: { a: 3, e: 1, o: 2, u: 0 },
    N: { none: 0, n: 1, r: 2, i: 3 },
  },
};

// Each row's state, top to bottom
export function braille_rows(id: number, phonology: Phonology, settings: BrailleSettings): number[] {
  const marks = marks_of(id, phonology);
  return settings.rows.map((mark) => choice(settings.states[mark], mark, marks[mark], phonology));
}

// Unicode numbers the dots down the left column (1, 2, 3, 7) and then the right (4, 5, 6, 8)
const ROW_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

export function braille_cell(id: number, phonology: Phonology, settings: BrailleSettings): string {
  let bits = 0;
  braille_rows(id, phonology, settings).forEach((state, row) => {
    if (state & 1) bits |= ROW_BITS[row]![0]!;
    if (state & 2) bits |= ROW_BITS[row]![1]!;
  });
  return String.fromCodePoint(0x2800 + bits);
}

// Syllabics: two glyphs per syllable, each one of four shapes turned one of four ways. The onset
// glyph's shape is the manner and its turn the place; the rime glyph's shape is the final and its
// turn the vowel. Each shape is listed by clockwise quarter turns from its base.

export const SHAPES = {
  chevron: [..."ᐯᐸᐱᐳ"],
  cup: [..."ᑌᑕᑎᑐ"],
  corner: [..."ᒪᒥᒣᒧ"],
  hook: [..."ᒐᒋᒉᒍ"],
  triangle: [..."ᐁᐊᐃᐅ"],
  loop: [..."ᓀᓇᓂᓄ"],
} as const;
export type ShapeKey = keyof typeof SHAPES;
export const SHAPE_KEYS = Object.keys(SHAPES) as ShapeKey[];
export const TURNS = ["base", "¼ turn", "½ turn", "¾ turn"] as const;

export type SyllabicsSettings = {
  shapes: ShapeKey[]; // the four shapes in use; manners and finals pick from these by index
  onset_shapes: Assignment; // manner → shape index
  rime_shapes: Assignment; // final → shape index
  place_turns: Assignment;
  vowel_turns: Assignment;
};

export const default_syllabics: SyllabicsSettings = {
  shapes: ["chevron", "cup", "corner", "hook"],
  onset_shapes: { unvoiced: 0, voiced: 1, fricative: 2, "voiced fricative": 3 },
  rime_shapes: { none: 0, n: 1, r: 2, i: 3 },
  place_turns: { sibilant: 0, labial: 1, coronal: 2, velar: 3 },
  vowel_turns: { a: 0, e: 1, u: 2, o: 3 },
};

export function syllabics_glyphs(id: number, phonology: Phonology, settings: SyllabicsSettings): string {
  const m = marks_of(id, phonology);
  const glyph = (shape_index: number, turn: number) => SHAPES[settings.shapes[shape_index]!]![turn]!;
  return (
    glyph(choice(settings.onset_shapes, "M", m.M, phonology), choice(settings.place_turns, "C", m.C, phonology)) +
    glyph(choice(settings.rime_shapes, "N", m.N, phonology), choice(settings.vowel_turns, "V", m.V, phonology))
  );
}

// A transliteration as root IDs, word by word. Foreign names are respelled in our syllables
// first; a word with no root is null, and punctuation is kept as text.
export type ScriptToken = { ids: number[] | null; text: string } | { punctuation: string };

export function script_tokens(transliteration: string, phonology: Phonology): ScriptToken[] {
  const id_of = new Map(Array.from({ length: 256 }, (_, id) => [syllable_of(id, phonology), id]));
  const ids = (word: Word): number[] => (is_root(word) ? [word.data.id] : word.data.parts.flatMap(ids));
  return tokenize(transliteration).map((t) => {
    if (t.kind === "punctuation") return { punctuation: t.text };
    if (t.kind === "foreign") {
      const syllables = adapt_foreign(t.text, phonology).map((s) => id_of.get(s));
      return { ids: syllables.every((s) => s !== undefined) ? (syllables as number[]) : null, text: t.text };
    }
    return { ids: t.word ? ids(t.word) : null, text: t.text };
  });
}
