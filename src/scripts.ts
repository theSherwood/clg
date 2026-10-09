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

// Stems and the stave script both lay a syllable's four marks out in an order, each value
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

// Gates: five bars of the same height, always all there, so every syllable fills its square; the
// four gaps between them are a mark each, left to right, and each gap a gate: open, bridged at
// the top, bridged at the bottom, or both, a closed cell (bit 1 top, bit 2 bottom). Bridges join
// only neighbouring bars, top and bottom, so the gates make exactly 2⁸ = 256 drawings, every one a
// syllable.
export const GATES = ["open", "top", "bottom", "closed"] as const;

// Place, manner, vowel, final, left to right, and each mark's values in order take an open gate,
// a top, a bottom and a closed one, so the most common value of each (velar, unvoiced, a, no
// final) leaves its gap open
export const default_gates: MarkLayout = {
  order: ["C", "M", "V", "N"],
  values: {
    C: { velar: 0, coronal: 1, labial: 2, sibilant: 3 },
    M: { unvoiced: 0, voiced: 1, fricative: 2, "voiced fricative": 3 },
    V: { a: 0, e: 1, o: 2, u: 3 },
    N: { none: 0, n: 1, r: 2, i: 3 },
  },
};

// A syllable in gates as lines on a grid of pitches, x from 0 to 4 and y from 0 (top) to 4: the
// five bars, then each gate's bridges
export type GridLine = [number, number, number, number];
export function gate_lines(gates: number[]): GridLine[] {
  return [
    ...[0, 1, 2, 3, 4].map((x): GridLine => [x, 0, x, 4]),
    ...gates.flatMap((gate, i): GridLine[] => [
      ...(gate & 1 ? [[i, 0, i + 1, 0] as GridLine] : []),
      ...(gate & 2 ? [[i, 4, i + 1, 4] as GridLine] : []),
    ]),
  ];
}

// Gates as a fret, in one stroke: a path through every point of a 7×7 grid, from the top left
// corner to the top right, so every syllable fills its square and a word's syllables can be joined
// into one stroke along their tops. The square is four blocks round the centre point, in a U: one 3
// wide and 4 tall down the left, one 4 wide and 3 tall along the bottom, one tall up the right, then
// the centre, then one wide along the top and out at the top right corner:
//   0 0 0 3 3 3 3
//   0 0 0 3 3 3 3
//   0 0 0 3 3 3 3
//   0 0 0 · 2 2 2
//   1 1 1 1 2 2 2
//   1 1 1 1 2 2 2
//   1 1 1 1 2 2 2
// The stroke comes into each block at a corner and leaves at a corner by the next: a tall block's
// two corners on the same long side, a wide block's opposite. Between those corners, each block has
// exactly four paths through every one of its points, and no smaller block has as many, so the
// four blocks give exactly 4⁴ = 256 drawings; a mark each, in the order the stroke takes them. Of
// all the ways to tile a 7×7 grid with four such blocks, this U and its mirror image are the only
// ones that chain from one top corner to the other. A value is the same path in both tall blocks
// and in both wide ones, the second of each the first turned upside down; value A is the path of
// parallel runs, across a tall block and along a wide one.
export const FRETS = ["A", "B", "C", "D"] as const;
export type GridPoint = [number, number];
// A tall block's paths, 3 wide and 4 tall, from its top left corner to its bottom left
export const FRET_TALL: GridPoint[][] = [
  [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [1, 3], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [1, 3], [1, 2], [1, 1], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [0, 1], [1, 1], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [1, 3], [1, 2], [0, 2], [0, 3]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [1, 3], [0, 3]],
];
// A wide block's, 4 wide and 3 tall, from its top left corner to its bottom right
export const FRET_WIDE: GridPoint[][] = [
  [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2]],
  [[0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [3, 0], [3, 1], [3, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [1, 1], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [2, 2], [3, 2]],
];
export function fret_path(marks: number[]): GridPoint[] {
  const [down, along, up, over] = marks;
  return [
    ...FRET_TALL[down!]!,
    ...FRET_WIDE[along!]!.map(([x, y]): GridPoint => [x, 4 + y]),
    ...FRET_TALL[up!]!.map(([x, y]): GridPoint => [4 + x, 6 - y]),
    [3, 3],
    ...FRET_WIDE[over!]!.map(([x, y]): GridPoint => [3 + x, 2 - y]),
  ];
}

// The stave as a meander, a calligraphy after the gates: five bars of the same height, and each of
// the four gaps between them bridged once, for a mark each, left to right: at the top for a mark
// above the line, at the bottom for one below, flush with the bars' ends for a dash and set in by
// a pitch for a loop
export function meander_lines(marks: number[]): GridLine[] {
  return [
    ...[0, 1, 2, 3, 4].map((x): GridLine => [x, 0, x, 4]),
    ...marks.map((mark, i): GridLine => {
      const y = mark & 1 ? (mark & 2 ? 3 : 4) : mark & 2 ? 1 : 0;
      return [i, y, i + 1, y];
    }),
  ];
}

// The stave script: a word is a horizontal line written in one stroke, and each syllable four
// marks along it, left to right, each a flat-topped bump or a small loop, above or below the line
// (bit 1 below, bit 2 loop). Every position has a mark, so a syllable is always four marks long.
export const STAVE_MARKS = ["dash above", "dash below", "loop above", "loop below"] as const;

// Place, manner, vowel, final, left to right, and each mark's values in order are a dash above, a
// dash below, a loop above and a loop below, like the stems' rungs
export const default_stave: MarkLayout = {
  order: ["C", "M", "V", "N"],
  values: {
    C: { velar: 0, coronal: 1, labial: 2, sibilant: 3 },
    M: { unvoiced: 0, voiced: 1, fricative: 2, "voiced fricative": 3 },
    V: { a: 0, e: 1, o: 2, u: 3 },
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

// Each mark's values in order: the shapes for manner and final, and for place and vowel the turns
// base, ¼, ¾ and ½, so the second and third values point opposite ways
export const default_syllabics: SyllabicsSettings = {
  shapes: ["chevron", "cup", "corner", "hook"],
  onset_shapes: { unvoiced: 0, voiced: 1, fricative: 2, "voiced fricative": 3 },
  rime_shapes: { none: 0, n: 1, r: 2, i: 3 },
  place_turns: { velar: 0, coronal: 1, labial: 3, sibilant: 2 },
  vowel_turns: { a: 0, e: 1, o: 3, u: 2 },
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
