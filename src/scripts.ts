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

// Stems and the line script both lay a syllable's four marks out in an order, each value
// drawn one of four ways, so they share their settings.
export type MarkLayout = { order: Mark[]; values: Record<Mark, Assignment> };

// Each mark's drawing, in the layout's order
export function layout_values(id: number, phonology: Phonology, layout: MarkLayout): number[] {
  const marks = marks_of(id, phonology);
  return layout.order.map((mark) => choice(layout.values[mark], mark, marks[mark], phonology));
}

// Stems: one stem per syllable with a rung for each mark, top to bottom, that is none, a stub
// to the left, a stub to the right or a bar across (bit 1 left, bit 2 right). A syllable with no
// rungs is still its stem, so every syllable can be seen (unlike braille, whose empty cell can't).
export const RUNGS = ["none", "left", "right", "across"] as const;

// Place, manner, vowel, final, top to bottom, and each mark's values in order take no rung, left,
// right and across, so a rung is just the value's index
export const default_stems: MarkLayout = {
  order: ["C", "M", "V", "N"],
  values: {
    C: { velar: 0, coronal: 1, labial: 2, sibilant: 3 },
    M: { unvoiced: 0, voiced: 1, fricative: 2, "voiced fricative": 3 },
    V: { a: 0, e: 1, o: 2, u: 3 },
    N: { none: 0, n: 1, r: 2, i: 3 },
  },
};

// The line script: a word is a horizontal line written in one stroke, and each syllable four
// marks along it, left to right, each a flat-topped bump or a small loop, above or below the line
// (bit 1 below, bit 2 loop). Every position has a mark, so a syllable is always four marks long.
export const LINE_MARKS = ["dash above", "dash below", "loop above", "loop below"] as const;

export const default_line: MarkLayout = {
  order: ["C", "M", "V", "N"],
  values: {
    // Lips round, so labial is a loop; the tongue tip goes up and the back of it down
    C: { coronal: 0, velar: 1, labial: 2, sibilant: 3 },
    // Below is voiced and a loop fricative
    M: { unvoiced: 0, voiced: 1, fricative: 2, "voiced fricative": 3 },
    // Rounded vowels are loops; above is high
    V: { e: 0, a: 1, u: 2, o: 3 },
    N: { none: 0, n: 1, r: 2, i: 3 },
  },
};

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
// word is the dictionary word, for its popup; foreign names have none
export type ScriptToken = { ids: number[] | null; text: string; word?: Word } | { punctuation: string };

export function script_tokens(transliteration: string, phonology: Phonology): ScriptToken[] {
  const id_of = new Map(Array.from({ length: 256 }, (_, id) => [syllable_of(id, phonology), id]));
  const ids = (word: Word): number[] => (is_root(word) ? [word.data.id] : word.data.parts.flatMap(ids));
  return tokenize(transliteration).map((t) => {
    if (t.kind === "punctuation") return { punctuation: t.text };
    if (t.kind === "foreign") {
      const syllables = adapt_foreign(t.text, phonology).map((s) => id_of.get(s));
      return { ids: syllables.every((s) => s !== undefined) ? (syllables as number[]) : null, text: t.text };
    }
    return { ids: t.word ? ids(t.word) : null, text: t.text, word: t.word };
  });
}
