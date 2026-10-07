import { elements } from "./elements";
import saved_section_order from "./section_order.json";

export const T = {
  // tags
  preposition: "preposition",
  pronoun: "pronoun",
  grammar_helper: "grammar_helper",
  part_of_speech_specifier: "part_of_speech_specifier",
  domain_specifier: "domain_specifier",
  verb_specifier: "verb_specifier",
  axis_helper: "axis_helper",
  axis_word: "axis_word",
} as const;

export type Tag = keyof typeof T;

// Sections reserve fixed ranges of root IDs for kinds of words, with room to grow, so adding a
// word to one section never shifts the IDs (and so the sounds) of words in another.
// Half the 256 IDs are core words. The other half are the domain receivers: 128 IDs shared by
// partial domains (the digits, in the number domain) and the axis words, told apart by domain.
// Domain words must be core words, so they're never ambiguous. The core sections and the
// receivers fill the IDs in the order section_order.json gives, which the Roots page can
// rearrange.
const core_sections = [
  { key: "marker", label: "Grammar markers", size: 16 },
  { key: "number_helper", label: "Number helpers", size: 2 },
  { key: "grammar", label: "Grammar helpers", size: 16 },
  { key: "dimension", label: "Dimension helpers", size: 4 },
  { key: "preposition", label: "Prepositions", size: 12 },
  { key: "pronoun", label: "Pronouns", size: 6 },
  { key: "axis_helper", label: "Axis helpers", size: 8 },
  { key: "content", label: "Content roots", size: 48 },
  { key: "rank", label: "Rank helpers", size: 16 },
] as const;
// The domain receivers: both of these sections cover all of its IDs
const receiver_sections = [
  { key: "axis", label: "Axis words" },
  { key: "digit", label: "Digits" },
] as const;
export const RECEIVERS = { key: "receivers", label: "Domain receivers", size: 128 } as const;

export type CoreSectionKey = (typeof core_sections)[number]["key"];
export type SectionKey = CoreSectionKey | (typeof receiver_sections)[number]["key"];
export type Section = { key: SectionKey; label: string; start: number; end: number }; // end is exclusive
// What the order arranges: the core sections, and the receivers as one block
export type UnitKey = CoreSectionKey | typeof RECEIVERS.key;
export type Unit = { key: UnitKey; label: string; start: number; end: number };

const unit_keys: UnitKey[] = [...core_sections.map((s) => s.key), RECEIVERS.key];

// An order of the units: each one exactly once
export function is_section_order(value: unknown): value is UnitKey[] {
  return (
    Array.isArray(value) &&
    value.length === unit_keys.length &&
    unit_keys.every((key) => value.includes(key))
  );
}

export function layout_units(order: UnitKey[]): Unit[] {
  let start = 0;
  const units = order.map((key) => {
    const { label, size } =
      key === RECEIVERS.key ? RECEIVERS : core_sections.find((s) => s.key === key)!;
    const unit = { key, label, start, end: start + size };
    start += size;
    return unit;
  });
  if (start !== 256) throw new Error(`The sections fill ${start} IDs, not 256`);
  return units;
}

export function layout_sections(order: UnitKey[]): Section[] {
  return layout_units(order).flatMap<Section>(({ key, label, start, end }) =>
    key === RECEIVERS.key
      ? receiver_sections.map((s) => ({ ...s, start, end }))
      : [{ key, label, start, end }],
  );
}

if (!is_section_order(saved_section_order))
  throw new Error("section_order.json must list each core section, and receivers, once");
export const section_order: UnitKey[] = saved_section_order;
export const sections: Section[] = layout_sections(section_order);
export const receivers: Unit = layout_units(section_order).find((u) => u.key === RECEIVERS.key)!;

type WordData = {
  id: number;
  t: Tag[]; // tags
  section: SectionKey;
  gloss?: string; // fuller English meaning, when the word name is a shorthand
  notes?: string;
  verb_i?: string; // for a verb that isn't on an axis: its meaning without an object
  verb_t?: string; // ... and with one
  synonyms?: string[]; // other English words for the same meaning, found by search

  homonyms: Word[];
  uses: Word[];
  parts: Word[];
  domain?: string;
};

export function is_defined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export class Word {
  word: string;
  data: WordData;
  constructor(word: string, data: WordData) {
    this.word = word;
    this.data = data;
  }
}

export function is_root(word: Word): boolean {
  return word.data.id >= 0;
}

function validate_word(word: Word): string | undefined {
  const parts_length = word.data.parts?.length ?? 0;
  const id = word.data.id;
  if (id >= 0 && parts_length > 0) return `Word ${word.word} has root ID and parts`;
  if (id < 0 && parts_length === 0) return `Word ${word.word} has negative ID and no parts`;
}

let current_section: Section = sections[0]!;
let root_index: number = current_section.start;

function section(key: SectionKey) {
  current_section = sections.find((s) => s.key === key)!;
  root_index = current_section.start;
}

function r(word: string, data: Partial<WordData> = {}): Word {
  let d: WordData = {
    id: -1,
    t: [],
    section: current_section.key,
    homonyms: [],
    uses: [],
    parts: [],
    ...data,
  };
  if (!is_defined(data.id)) {
    d.id = root_index++;
  }
  const { label, start, end } = current_section;
  if (d.id < start || d.id >= end) {
    throw new Error(
      `No room for ${word} (ID ${d.id}) in ${label}, which holds IDs ${start}-${end - 1}`,
    );
  }
  return new Word(word, d);
}

function c(word: string, data: Partial<WordData> & { parts: Required<WordData["parts"]> }): Word {
  let d: WordData = {
    id: -1,
    t: [],
    section: current_section.key,
    homonyms: [],
    uses: [],
    ...data,
  };
  return new Word(word, d);
}

export const roots: (Word[] | null)[] = Array.from({ length: 256 }, (_) => null);

export const dictionary = new Map<string, Word>();

function cr(word: string, data: Partial<WordData> = {}): Word {
  if (dictionary.has(word)) {
    throw new Error(`Duplicate word: ${word}`);
  }
  const w = r(word, data);
  let existing = roots[w.data.id];
  if (existing) {
    existing.push(w);
  } else {
    roots[w.data.id] = [w];
  }
  dictionary.set(word, w);
  return w;
}

function cw(word: string, data: Partial<WordData> & { parts: Required<WordData["parts"]> }): Word {
  if (dictionary.has(word)) {
    throw new Error(`Duplicate word: ${word}`);
  }
  const w = c(word, data);
  dictionary.set(word, w);
  return w;
}

// Words planned for a section that don't have a root yet, so they have no ID or sound
export type Candidate = { word: string; section: SectionKey; gloss?: string; notes?: string };

export const candidates: Candidate[] = [];

function candidate(word: string, data: Omit<Candidate, "word" | "section"> = {}) {
  candidates.push({ word, section: current_section.key, ...data });
}

type AxisWordForms = {
  noun?: string;
  adj?: string;
  verb?: string; // the name of the side's one verb word
  verb_i?: string; // what that verb means without an object (intransitive)
  verb_t?: string; // ... and with one (transitive)
  adverb?: string;
  notes?: string;
  synonyms?: Partial<Record<"noun" | "adj" | "verb" | "adverb", string[]>>; // other English words, by form
  steps?: Partial<Record<MinorStep, AxisWordForms>>; // on the axis entry: words for the other steps
};

// The scale steps besides negative and positive. Their words are the step helper plus the positive
// form, as the negative forms are negative plus the positive form.
export const MINOR_STEPS = ["max_negative", "min_negative", "neutral", "min_positive", "max_positive"] as const;
export type MinorStep = (typeof MINOR_STEPS)[number];

// [axis, negative, positive]. The axis noun is axis_of + the positive noun; each negative form is
// negative + the positive form. Each axis's ID is in its verb type's subsection (see
// AXIS_SUBSECTIONS), in the order listed here. Adding an axis inside a group shifts the IDs, and
// so the sounds, of the axes after it in that subsection; adding one at a group's end shifts none.
const axis_words_config: [AxisWordForms, AxisWordForms, AxisWordForms][] = [
  [
    {
      noun: "size",
      notes:
        "From axis.csv: positive noun giant; positive verb to grow something (transitive), to grow (intransitive)",
      steps: {
        max_positive: { verb: "explode(vi)", verb_i: "explode", verb_t: "blow up" },
        min_positive: {
          noun: "inflation",
          adj: "inflated",
          verb: "inflate(vt)",
          verb_i: "swell",
          verb_t: "inflate",
        },
        min_negative: {
          noun: "deflation",
          adj: "deflated",
          verb: "deflate(vt)",
          verb_i: "collapse",
          verb_t: "deflate",
        },
        max_negative: { verb: "implode(vi)", verb_i: "implode", verb_t: "implode" },
      },
    },
    {
      noun: "smallness",
      adj: "small",
      verb: "shrink(vi)",
      verb_i: "shrink",
      verb_t: "shrink",
      adverb: "slightly",
    },
    {
      noun: "bigness",
      adj: "big",
      verb: "grow(vi)",
      verb_i: "grow",
      verb_t: "enlarge",
      adverb: "hugely",
    },
  ],
  [
    { noun: "speed", notes: "From axis.csv: positive verb to accelerate (transitive)" },
    {
      noun: "slowness",
      adj: "slow",
      verb: "slow_down(vi)",
      verb_i: "slow down",
      verb_t: "slow down",
      adverb: "slowly",
    },
    {
      noun: "fastness",
      adj: "fast",
      verb: "accelerate(vt)",
      verb_i: "speed up",
      verb_t: "accelerate",
      adverb: "quickly",
    },
  ],
  [
    {
      noun: "adaptability",
      notes: "Changing at its fullest is transforming: into something else entirely",
      steps: {
        max_positive: {
          noun: "transformation",
          adj: "transformed",
          verb: "transform(vi)",
          verb_i: "transform",
          verb_t: "transform",
        },
      },
    },
    {
      noun: "stability",
      adj: "static",
      verb: "stabilize(vt)",
      verb_i: "settle",
      verb_t: "stabilize",
      adverb: "statically",
    },
    {
      noun: "dynamism",
      adj: "dynamic",
      verb: "change(vi)",
      verb_i: "change",
      verb_t: "alter",
      adverb: "dynamically",
    },
  ],
  [
    { noun: "complexity(axis)", notes: "From axis.csv: positive verb simplify (transitive)" },
    {
      noun: "complexity(state)",
      adj: "complex",
      verb: "complicate(vt)",
      verb_i: "become complicated",
      verb_t: "complicate",
      adverb: "complexly",
    },
    {
      noun: "simplicity",
      adj: "simple",
      verb: "simplify(vt)",
      verb_i: "become simpler",
      verb_t: "simplify",
      adverb: "simply",
    },
  ],
  [
    { noun: "strength(axis)", notes: "From axis.csv: positive verb strengthen (transitive)" },
    {
      noun: "weakness",
      adj: "weak",
      verb: "weaken(vi)",
      verb_i: "weaken",
      verb_t: "weaken",
      adverb: "weakly",
    },
    {
      noun: "strength(state)",
      adj: "strong",
      verb: "strengthen(vi)",
      verb_i: "strengthen",
      verb_t: "strengthen",
      adverb: "strongly",
    },
  ],
  [
    {
      noun: "quantity",
      notes:
        "Amounts and counts alike: water many is much water, person many many people. More and less are the comparison axis's greater and lesser",
    },
    {
      noun: "scarcity",
      adj: "few",
      verb: "decrease(vi)",
      verb_i: "decrease",
      verb_t: "decrease",
      adverb: "barely",
    },
    {
      noun: "abundance",
      adj: "many",
      verb: "increase(vi)",
      verb_i: "increase",
      verb_t: "increase",
      adverb: "abundantly",
    },
  ],
  [
    {
      noun: "orderliness",
      notes:
        "Strengths of order: regular is a mild order and determined an order so complete the outcome is fixed; irregular, chaotic and random mirror them",
      steps: {
        max_positive: {
          noun: "determinacy",
          adj: "determined",
          verb: "determine(vt)",
          verb_i: "become fixed",
          verb_t: "determine",
          adverb: "deterministically",
        },
        min_positive: {
          noun: "regularity",
          adj: "regular",
          verb: "regulate(vt)",
          verb_i: "become regular",
          verb_t: "regulate",
          adverb: "regularly",
        },
        min_negative: {
          noun: "irregularity",
          adj: "irregular",
          verb: "disrupt(vt)",
          verb_i: "become irregular",
          verb_t: "disrupt",
          adverb: "irregularly",
        },
        max_negative: {
          noun: "randomness",
          adj: "random",
          verb: "randomize(vt)",
          verb_i: "become random",
          verb_t: "randomize",
          adverb: "randomly",
        },
      },
    },
    {
      noun: "chaos",
      adj: "chaotic",
      verb: "disorganize(vt)",
      verb_i: "fall into chaos",
      verb_t: "disorganize",
      adverb: "chaotically",
    },
    {
      noun: "order",
      adj: "organized",
      verb: "organize(vt)",
      verb_i: "fall into order",
      verb_t: "organize",
      adverb: "orderly",
    },
  ],
  [
    { noun: "initiative", notes: "From axis.csv (as passivity?: passive / agentic)" },
    {
      noun: "passivity",
      adj: "passive",
      verb: "lull(vt)",
      verb_i: "subside",
      verb_t: "lull",
      adverb: "passively",
    },
    {
      noun: "agency",
      adj: "agentic",
      verb: "activate(vt)",
      verb_i: "become active",
      verb_t: "activate",
      adverb: "agentically",
    },
  ],
  [
    {
      noun: "continuity",
      notes: "From axis.csv: positive verb discretize (transitive); positive adjective discrete?",
    },
    {
      noun: "continuum",
      adj: "continuous",
      verb: "smear(vt)",
      verb_i: "merge",
      verb_t: "smear",
      adverb: "continuously",
    },
    {
      noun: "discreteness",
      adj: "discrete",
      verb: "demarcate(vt)",
      verb_i: "separate",
      verb_t: "demarcate",
      adverb: "choppily",
    },
  ],
  [
    { noun: "completeness" },
    {
      noun: "nothingness",
      adj: "none",
      verb: "erase(vt)",
      verb_i: "vanish",
      verb_t: "erase",
      adverb: "not_at_all",
    },
    {
      noun: "everything",
      adj: "all",
      verb: "complete(vt)",
      verb_i: "become complete",
      verb_t: "complete",
      adverb: "completely",
    },
  ],
  [
    {
      noun: "openness(axis)",
      notes: "From axis.csv: positive verb to open (transitive)",
      steps: {
        min_positive: { adj: "ajar", verb: "crack(vt)", verb_i: "crack open", verb_t: "crack" },
      },
    },
    {
      noun: "closure",
      adj: "closed",
      verb: "close(vi)",
      verb_i: "close",
      verb_t: "close",
      adverb: "tightly",
    },
    {
      noun: "openness(state)",
      adj: "open",
      verb: "open(vi)",
      verb_i: "open",
      verb_t: "open",
      adverb: "loosely",
    },
  ],
  [
    {
      noun: "granularity",
      notes:
        "Texture, and so friction: smooth at its fullest slips, coarse at its fullest sticks. Grease is <tool> slip(vi) and glue <tool> stick(vi). Tentative: sticky sits oddly with coarse",
      steps: {
        max_positive: {
          noun: "slipperiness",
          adj: "slippery",
          verb: "slip(vi)",
          verb_i: "slip",
          verb_t: "lubricate",
        },
        max_negative: { noun: "stickiness", adj: "sticky", verb: "stick(vi)", verb_i: "stick", verb_t: "stick" },
      },
    },
    {
      noun: "coarseness",
      adj: "coarse",
      verb: "roughen(vi)",
      verb_i: "roughen",
      verb_t: "roughen",
      adverb: "roughly",
    },
    {
      noun: "smoothness",
      adj: "smooth",
      verb: "smooth(vt)",
      verb_i: "become smooth",
      verb_t: "smooth",
      adverb: "smoothly",
    },
  ],
  [
    {
      noun: "liberty",
      notes: "Freedom from restraint; forcing someone to act is <max_positive> command(vt), force(vt)",
    },
    {
      noun: "bondage",
      adj: "bound",
      verb: "constrain(vt)",
      verb_i: "get stuck",
      verb_t: "constrain",
    },
    {
      noun: "freedom",
      adj: "free",
      verb: "free(vt)",
      verb_i: "break free",
      verb_t: "free",
      adverb: "freely",
    },
  ],
  [
    {
      noun: "abstraction(axis)",
      notes:
        "From axis.csv: positive noun abstraction, positive verb generalize (transitive), positive adjective general",
    },
    {
      noun: "concreteness",
      adj: "concrete",
      verb: "reify(vt)",
      verb_i: "take shape",
      verb_t: "reify",
      adverb: "concretely",
    },
    {
      noun: "abstraction(state)",
      adj: "abstract",
      verb: "abstract(vt)",
      verb_i: "generalize",
      verb_t: "abstract",
      adverb: "in_general",
    },
  ],
  [
    { noun: "relativity(axis)", notes: "Overlap with concrete/abstract" },
    {
      noun: "relativity(state)",
      adj: "relative",
      verb: "relativize(vt)",
      verb_i: "become relative",
      verb_t: "relativize",
      adverb: "relatively",
    },
    {
      noun: "absolute(state)",
      adj: "absolute",
      verb: "absolutize(vt)",
      verb_i: "become absolute",
      verb_t: "absolutize",
      adverb: "absolutely",
    },
  ],
  [
    {
      noun: "phase",
      notes:
        "Phase changes: melt(vi) goes up a phase and freeze(vi) down one, so the same verb is melting for ice and evaporating for water. Rank names the target phase, as matter's ranks do (<rank_0> solid, <rank_1> liquid, <rank_2> gas, <rank_3> plasma): melt(vi) <rank_2> is evaporate, freeze(vi) <rank_1> condense",
    },
    {
      noun: "rigidity(state)",
      adj: "rigid",
      verb: "freeze(vi)",
      verb_i: "freeze",
      verb_t: "freeze",
      adverb: "stiffly",
    },
    {
      noun: "fluidity",
      adj: "fluid",
      verb: "melt(vi)",
      verb_i: "melt",
      verb_t: "melt",
      adverb: "fluidly",
    },
  ],
  [
    { noun: "explicitness(axis)" },
    {
      noun: "implicitness",
      adj: "implicit",
      verb: "imply(vt)",
      verb_i: "become implicit",
      verb_t: "imply",
      adverb: "implicitly",
    },
    {
      noun: "explicitness(state)",
      adj: "explicit",
      verb: "make_explicit(vt)",
      verb_i: "become explicit",
      verb_t: "make explicit",
      adverb: "explicitly",
    },
  ],
  [
    {
      noun: "internality(axis)",
      notes: "Possibly a duplicate of in/out: internal ≈ inner, go inward ≈ enter, come out ≈ emerge",
    },
    {
      noun: "internality(state)",
      adj: "internal",
      verb: "internalize(vt)",
      verb_i: "go inward",
      verb_t: "internalize",
      adverb: "internally",
    },
    {
      noun: "externality",
      adj: "external",
      verb: "externalize(vt)",
      verb_i: "come out",
      verb_t: "externalize",
      adverb: "externally",
    },
  ],
  [
    { noun: "finiteness(axis)" },
    {
      noun: "finitude(state)",
      adj: "finite",
      verb: "end(vi)",
      verb_i: "end",
      verb_t: "limit",
      adverb: "finitely",
    },
    {
      noun: "infinity",
      adj: "infinite",
      verb: "perpetuate(vt)",
      verb_i: "become endless",
      verb_t: "perpetuate",
      adverb: "infinitely",
    },
  ],
  [
    { noun: "essentiality" },
    {
      noun: "accident",
      adj: "accidental",
      verb: "become_incidental(vi)",
      verb_i: "become incidental",
      verb_t: "make incidental",
      adverb: "accidentally",
    },
    {
      noun: "essence",
      adj: "essential",
      verb: "become_essential(vi)",
      verb_i: "become essential",
      verb_t: "make essential",
      adverb: "essentially",
    },
  ],
  [
    { noun: "outlook" },
    {
      noun: "pragmatism",
      adj: "pragmatic",
      verb: "become_practical(vi)",
      verb_i: "become practical",
      verb_t: "make practical",
      adverb: "pragmatically",
    },
    {
      noun: "idealism",
      adj: "ideal",
      verb: "idealize(vt)",
      verb_i: "become idealistic",
      verb_t: "idealize",
      adverb: "ideally",
    },
  ],
  [
    { noun: "hierarchy", notes: "negative verb flatten(vi) (no positive verb)" },
    {
      noun: "flatness",
      adj: "flat",
      verb: "flatten(vi)",
      verb_i: "flatten",
      verb_t: "flatten",
      adverb: "flatly",
    },
    {
      noun: "nestedness",
      adj: "nested",
      verb: "nest(vi)",
      verb_i: "nest",
      verb_t: "embed",
      adverb: "recursively",
    },
  ],
  [
    { noun: "measurability" },
    {
      noun: "quality",
      adj: "qualitative",
      verb: "characterize(vt)",
      verb_i: "become qualitative",
      verb_t: "characterize",
      adverb: "qualitatively",
    },
    {
      noun: "quantification",
      adj: "quantitative",
      verb: "enumerate(vt)",
      verb_i: "become measurable",
      verb_t: "enumerate",
      adverb: "quantitatively",
    },
  ],
  [
    { noun: "periodicity" },
    {
      noun: "line",
      adj: "linear",
      verb: "linearize(vt)",
      verb_i: "become linear",
      verb_t: "linearize",
      adverb: "linearly",
    },
    {
      noun: "cycle",
      adj: "cyclical",
      verb: "curl(vt)",
      verb_i: "recur",
      verb_t: "curl",
      adverb: "cyclically",
    },
  ],
  [
    { noun: "scope" },
    {
      noun: "reduction",
      adj: "reductionist",
      verb: "reduce(vi)",
      verb_i: "reduce",
      verb_t: "reduce",
      adverb: "reductively",
    },
    {
      noun: "emergence",
      adj: "holistic",
      verb: "emerge(vi)",
      verb_i: "emerge",
      verb_t: "integrate",
      adverb: "holistically",
    },
  ],
  [
    { noun: "distance" },
    {
      noun: "nearness",
      adj: "near",
      verb: "approach(vi)",
      verb_i: "approach",
      verb_t: "bring near",
      adverb: "nearby",
    },
    {
      noun: "remoteness",
      adj: "far",
      verb: "distance(vt)",
      verb_i: "move away",
      verb_t: "distance",
      adverb: "afar",
    },
  ],
  [
    { noun: "volume" },
    {
      noun: "loudness",
      adj: "loud",
      verb: "amplify(vt)",
      verb_i: "get louder",
      verb_t: "amplify",
      adverb: "loudly",
    },
    {
      noun: "quietness",
      adj: "quiet",
      verb: "quiet(vt)",
      verb_i: "quiet down",
      verb_t: "quiet",
      adverb: "quietly",
    },
  ],
  [
    {
      noun: "sharpness",
      notes:
        "negative intransitive verb: to become dull; positive intransitive verb: to become sharp",
    },
    {
      noun: "dullness",
      adj: "dull",
      verb: "dull(vt)",
      verb_i: "become dull",
      verb_t: "dull",
      adverb: "dully",
    },
    {
      noun: "sharpness(state)",
      adj: "sharp",
      verb: "sharpen(vt)",
      verb_i: "become sharp",
      verb_t: "sharpen",
      adverb: "sharply",
    },
  ],
  [
    { noun: "moisture", notes: "negative adverb “dryly” needs a positive adverb" },
    { noun: "dryness", adj: "dry", verb: "dry(vt)", verb_i: "dry out", verb_t: "dry" },
    { noun: "wetness", adj: "wet", verb: "wet(vt)", verb_i: "get wet", verb_t: "wet" },
  ],
  [
    { noun: "thickness" },
    {
      noun: "thinness",
      adj: "thin",
      verb: "thin(vt)",
      verb_i: "thin out",
      verb_t: "thin",
      adverb: "thinly",
    },
    {
      noun: "thickness(state)",
      adj: "thick",
      verb: "thicken(vi)",
      verb_i: "thicken",
      verb_t: "thicken",
      adverb: "thickly",
    },
  ],
  [
    {
      noun: "elevation",
      notes:
        "The top is the highest point and the bottom the lowest: <max_positive> high and <max_negative> high. Relative position (above, below) is the upper/lower axis",
      steps: {
        max_positive: {
          noun: "summit",
          adj: "top",
          verb: "peak(vi)",
          verb_i: "peak",
          verb_t: "top off",
          adverb: "atop",
        },
        max_negative: {
          noun: "base",
          adj: "bottom",
          verb: "bottom_out(vi)",
          verb_i: "bottom out",
          verb_t: "bring down",
          adverb: "beneath",
        },
      },
    },
    { noun: "depth", adj: "low", verb: "lower(vt)", verb_i: "descend", verb_t: "lower" },
    {
      noun: "height",
      adj: "high",
      verb: "lift(vt)",
      verb_i: "rise",
      verb_t: "lift",
      adverb: "aloft",
    },
  ],
  [
    {
      noun: "posture",
      notes:
        "How upright a body is, not how high it is (that's elevation). The verbs take a position: sit(vi) <continuous_tense_aspect> is to be sitting. Slouching is a manner, the negative adverb: stand(vi) slouchingly",
      steps: {
        min_positive: { noun: "sitting", adj: "seated", verb: "sit(vi)", verb_i: "sit", verb_t: "seat" },
        neutral: { noun: "crouch", adj: "crouched", verb: "crouch(vi)", verb_i: "crouch", verb_t: "crouch" },
        min_negative: {
          noun: "crawl",
          adj: "on_all_fours",
          verb: "crawl(vi)",
          verb_i: "crawl",
          verb_t: "crawl",
        },
      },
    },
    {
      noun: "recumbency",
      adj: "prone",
      verb: "lie(vi)",
      verb_i: "lie",
      verb_t: "lay down",
      adverb: "slouchingly",
    },
    {
      noun: "stance",
      adj: "upright",
      verb: "stand(vi)",
      verb_i: "stand",
      verb_t: "stand up",
      adverb: "uprightly",
    },
  ],
  [
    {
      noun: "temperature",
      notes:
        "Heat at its fullest is fire, and cooling at its fullest is putting it out: burn(vi) is <max_positive> heat(vt), quench(vt) <max_negative>",
      steps: {
        max_positive: {
          noun: "fire",
          adj: "burning",
          verb: "burn(vi)",
          verb_i: "burn",
          verb_t: "burn",
          adverb: "ablaze",
        },
        max_negative: { adj: "frigid", verb: "quench(vt)", verb_i: "go out", verb_t: "quench" },
      },
    },
    {
      noun: "coldness",
      adj: "cold",
      verb: "chill(vt)",
      verb_i: "cool down",
      verb_t: "chill",
      adverb: "coldly",
    },
    {
      noun: "heat",
      adj: "hot",
      verb: "heat(vt)",
      verb_i: "heat up",
      verb_t: "heat",
      adverb: "hotly",
    },
  ],
  [
    { noun: "brightness" },
    {
      noun: "darkness",
      adj: "dark",
      verb: "darken(vi)",
      verb_i: "darken",
      verb_t: "darken",
      adverb: "darkly",
    },
    {
      noun: "light",
      adj: "bright",
      verb: "brighten(vi)",
      verb_i: "brighten",
      verb_t: "brighten",
      adverb: "brightly",
    },
  ],
  [
    { noun: "firmness" },
    {
      noun: "softness",
      adj: "soft",
      verb: "soften(vi)",
      verb_i: "soften",
      verb_t: "soften",
      adverb: "softly",
    },
    {
      noun: "hardness",
      adj: "hard",
      verb: "harden(vi)",
      verb_i: "harden",
      verb_t: "harden",
      adverb: "firmly",
    },
  ],
  [
    { noun: "weight" },
    {
      noun: "lightness",
      adj: "light(weight)",
      verb: "lighten(vt)",
      verb_i: "get lighter",
      verb_t: "lighten",
      adverb: "lightly",
    },
    {
      noun: "heaviness",
      adj: "heavy",
      verb: "get_heavier(vi)",
      verb_i: "get heavier",
      verb_t: "weigh down",
      adverb: "heavily",
    },
  ],
  [
    {
      noun: "truth",
      notes: "Likelihood, not proof (prove(vt)) or necessity (the modality axis)",
      steps: {
        max_negative: { adj: "certainly_false", adverb: "certainly_not" },
        min_negative: { adj: "unlikely", adverb: "probably_not" },
        neutral: { adj: "uncertain", adverb: "maybe" },
        min_positive: { adj: "probable", adverb: "probably" },
        max_positive: { adj: "certain", adverb: "certainly" },
      },
    },
    {
      noun: "falsehood",
      adj: "false",
      verb: "falsify(vt)",
      verb_i: "turn out false",
      verb_t: "falsify",
      adverb: "falsely",
    },
    {
      noun: "truth(state)",
      adj: "true",
      verb: "prove(vt)",
      verb_i: "come true",
      verb_t: "prove",
      adverb: "truly",
    },
  ],
  [
    {
      noun: "time",
      notes:
        "Rank gives the unit, a step up a ladder rather than a power of ten: <rank_0> second, <rank_1> minute, <rank_2> hour, <rank_3> day, <rank_4> week, <rank_5> month, <rank_6> year, <rank_7> decade, <rank_8> century, <rank_9> millennium. time <rank_3> number 3 is three days and time <rank_3> this today. A day of 24 hours is time <rank_3>; daytime is time bright and night time dark",
      steps: {
        max_negative: { adj: "ancient", adverb: "long_ago" },
        min_negative: { adj: "recent", adverb: "recently" },
        neutral: { adj: "current", adverb: "now" },
        min_positive: { adj: "upcoming", adverb: "soon" },
        max_positive: { adj: "far_future", adverb: "in_the_far_future" },
      },
    },
    {
      noun: "history",
      adj: "past",
      verb: "pass(vi)",
      verb_i: "pass",
      verb_t: "bring forward",
      adverb: "formerly",
    },
    {
      noun: "futurity",
      adj: "future",
      verb: "postpone(vt)",
      verb_i: "get delayed",
      verb_t: "postpone",
      adverb: "henceforth",
    },
  ],
  [
    {
      noun: "aliveness",
      notes: "negative intransitive verb: to die; positive intransitive verb: to live",
    },
    { noun: "death", adj: "dead", verb: "kill(vt)", verb_i: "die", verb_t: "kill" },
    {
      noun: "life",
      adj: "alive",
      verb: "come_to_life(vi)",
      verb_i: "come to life",
      verb_t: "bring to life",
    },
  ],
  [
    {
      notes:
        "Inside is the root so that eat is one syllable. Without an object, eat(vt) is to go in; with one, to take it in: eat, or drink",
    },
    {
      noun: "outside",
      adj: "outer",
      verb: "eject(vt)",
      verb_i: "exit",
      verb_t: "eject",
      adverb: "out",
    },
    {
      noun: "inside",
      adj: "inner",
      verb: "eat(vt)",
      verb_i: "enter",
      verb_t: "eat",
      adverb: "within",
    },
  ],
  [
    {},
    {
      noun: "topside",
      adj: "upper",
      verb: "raise(vt)",
      verb_i: "rise above",
      verb_t: "raise",
      adverb: "above",
    },
    {
      noun: "underside",
      adj: "lower",
      verb: "sink(vi)",
      verb_i: "sink",
      verb_t: "submerge",
      adverb: "below",
    },
  ],
  [
    {},
    {
      adj: "left(side)",
      verb: "veer_left(vi)",
      verb_i: "veer left",
      verb_t: "steer left",
      adverb: "leftward",
    },
    {
      adj: "right(side)",
      verb: "veer_right(vi)",
      verb_i: "veer right",
      verb_t: "steer right",
      adverb: "rightward",
    },
  ],
  [
    {},
    {
      noun: "insertion",
      adj: "inserted",
      verb: "insert(vt)",
      verb_i: "penetrate",
      verb_t: "insert",
    },
    {
      noun: "withdrawal",
      adj: "withdrawn",
      verb: "withdraw(vt)",
      verb_i: "retreat",
      verb_t: "withdraw",
    },
  ],
  [
    { noun: "prevalence", notes: "Also frequency: rarely is how seldom, commonly how often" },
    {
      noun: "rarity",
      adj: "rare",
      verb: "dwindle(vi)",
      verb_i: "dwindle",
      verb_t: "suppress",
      adverb: "rarely",
    },
    {
      noun: "commonness",
      adj: "common",
      verb: "spread(vi)",
      verb_i: "spread",
      verb_t: "popularize",
      adverb: "commonly",
    },
  ],
  [
    { noun: "animacy" },
    {
      noun: "inanimacy",
      adj: "inanimate",
      verb: "petrify(vt)",
      verb_i: "go still",
      verb_t: "petrify",
    },
    {
      noun: "animation",
      adj: "animate",
      verb: "stir(vi)",
      verb_i: "stir",
      verb_t: "animate",
      adverb: "animatedly",
    },
  ],
  [
    { noun: "duration" },
    {
      noun: "transience",
      adj: "fleeting",
      verb: "fade(vi)",
      verb_i: "fade",
      verb_t: "wear away",
      adverb: "fleetingly",
    },
    {
      noun: "persistence",
      adj: "persistent",
      verb: "persist(vi)",
      verb_i: "persist",
      verb_t: "maintain",
      adverb: "persistently",
    },
  ],
  [
    { noun: "artificiality" },
    {
      noun: "nature",
      adj: "natural",
      verb: "naturalize(vt)",
      verb_i: "become natural",
      verb_t: "naturalize",
      adverb: "naturally",
    },
    {
      noun: "artifice",
      adj: "artificial",
      verb: "make_artificial(vt)",
      verb_i: "become artificial",
      verb_t: "make artificial",
      adverb: "artificially",
    },
  ],
  [
    { noun: "centrality" },
    {
      noun: "center",
      adj: "central",
      verb: "converge(vi)",
      verb_i: "converge",
      verb_t: "centralize",
      adverb: "centrally",
    },
    {
      noun: "frontier",
      adj: "peripheral",
      verb: "spread_out(vi)",
      verb_i: "spread out",
      verb_t: "disperse",
      adverb: "peripherally",
    },
  ],
  [
    { noun: "alignment" },
    {
      noun: "wonkiness",
      adj: "wonky",
      verb: "warp(vi)",
      verb_i: "warp",
      verb_t: "skew",
      adverb: "askew",
    },
    {
      noun: "plumbness",
      adj: "plumb",
      verb: "straighten(vi)",
      verb_i: "straighten",
      verb_t: "true up",
      adverb: "squarely",
    },
  ],
  [
    { noun: "merit" },
    {
      noun: "badness",
      adj: "bad",
      verb: "worsen(vi)",
      verb_i: "worsen",
      verb_t: "worsen",
      adverb: "badly",
    },
    {
      noun: "goodness",
      adj: "good",
      verb: "improve(vi)",
      verb_i: "improve",
      verb_t: "improve",
      adverb: "well",
    },
  ],
  [
    { noun: "comfort" },
    {
      noun: "pain",
      adj: "painful",
      verb: "torment(vt)",
      verb_i: "suffer",
      verb_t: "torment",
      adverb: "painfully",
    },
    {
      noun: "pleasure",
      adj: "fun",
      verb: "entertain(vt)",
      verb_i: "enjoy oneself",
      verb_t: "entertain",
      adverb: "pleasantly",
    },
  ],
  [
    { noun: "substance" },
    {
      noun: "immateriality",
      adj: "immaterial",
      verb: "dissolve(vi)",
      verb_i: "dissolve",
      verb_t: "dematerialize",
      adverb: "immaterially",
    },
    {
      noun: "physical_stuff",
      adj: "material",
      verb: "materialize(vi)",
      verb_i: "materialize",
      verb_t: "manifest",
      adverb: "materially",
    },
  ],
  [
    { noun: "effort" },
    {
      noun: "difficulty",
      adj: "difficult",
      verb: "hinder(vt)",
      verb_i: "bog down",
      verb_t: "hinder",
      adverb: "with_difficulty",
    },
    {
      noun: "ease",
      adj: "easy",
      verb: "enable(vt)",
      verb_i: "ease up",
      verb_t: "enable",
      adverb: "easily",
    },
  ],
  [
    { noun: "curvature", notes: "negative verb round(vt) (no positive verb)" },
    {
      noun: "roundness",
      adj: "round",
      verb: "round(vt)",
      verb_i: "round out",
      verb_t: "round",
      adverb: "roundly",
    },
    {
      noun: "angularity",
      adj: "angular",
      verb: "angle(vt)",
      verb_i: "bend",
      verb_t: "angle",
      adverb: "angularly",
    },
  ],
  [
    { noun: "age" },
    { noun: "oldness", adj: "old", verb: "age(vi)", verb_i: "age", verb_t: "age" },
    {
      noun: "newness",
      adj: "new",
      verb: "rejuvenate(vt)",
      verb_i: "renew",
      verb_t: "rejuvenate",
      adverb: "newly",
    },
  ],
  [
    {
      noun: "consciousness",
      notes: "negative verb forms: sleep; negative adverb “sleepily” needs a positive adverb",
    },
    { noun: "sleep", adj: "asleep", verb: "sleep(vi)", verb_i: "sleep", verb_t: "put to sleep" },
    { noun: "wakefulness", adj: "awake", verb: "wake(vi)", verb_i: "wake", verb_t: "wake" },
  ],
  [
    { notes: "positive verb forms: to create; to self-actualize? / to become" },
    {
      noun: "destruction",
      adj: "destructive",
      verb: "destroy(vt)",
      verb_i: "perish",
      verb_t: "destroy",
      adverb: "destructively",
    },
    {
      noun: "creation",
      adj: "creative",
      verb: "create(vt)",
      verb_i: "come into being",
      verb_t: "create",
      adverb: "creatively",
    },
  ],
  [
    { noun: "aesthetics" },
    {
      noun: "ugliness",
      adj: "ugly",
      verb: "uglify(vt)",
      verb_i: "become ugly",
      verb_t: "uglify",
      adverb: "hideously",
    },
    {
      noun: "beauty",
      adj: "beautiful",
      verb: "beautify(vt)",
      verb_i: "become beautiful",
      verb_t: "beautify",
      adverb: "beautifully",
    },
  ],
  [
    {
      noun: "travel",
      notes:
        "come - stay - go; negative verb forms: to bring; to come; positive verb forms: to send; to go",
    },
    {
      noun: "arrival",
      adj: "incoming",
      verb: "come(vi)",
      verb_i: "come",
      verb_t: "bring",
      adverb: "hither",
    },
    {
      noun: "departure",
      adj: "outgoing",
      verb: "go(vi)",
      verb_i: "go",
      verb_t: "take away",
      adverb: "away",
    },
  ],
  [
    { notes: "hole - flat - mound / to dig - to flatten - to heap" },
    { noun: "hole", adj: "hollow", verb: "dig(vt)", verb_i: "cave in", verb_t: "dig" },
    { noun: "mound", adj: "heaped", verb: "heap_up(vt)", verb_i: "pile up", verb_t: "heap up" },
  ],
  [
    { noun: "capacity" },
    {
      noun: "emptiness",
      adj: "empty",
      verb: "empty(vt)",
      verb_i: "empty out",
      verb_t: "empty",
      adverb: "emptily",
    },
    {
      noun: "fullness",
      adj: "full",
      verb: "fill_up(vi)",
      verb_i: "fill up",
      verb_t: "fill",
      adverb: "fully",
    },
  ],
  [
    { noun: "intellect" },
    {
      noun: "stupidity",
      adj: "stupid",
      verb: "stupefy(vt)",
      verb_i: "grow stupid",
      verb_t: "stupefy",
      adverb: "stupidly",
    },
    {
      noun: "intelligence",
      adj: "smart",
      verb: "educate(vt)",
      verb_i: "wise up",
      verb_t: "educate",
      adverb: "cleverly",
    },
  ],
  [
    {},
    {
      noun: "obliqueness",
      adj: "oblique",
      verb: "veer(vi)",
      verb_i: "veer",
      verb_t: "slant",
      adverb: "obliquely",
    },
    {
      noun: "directness",
      adj: "direct",
      verb: "aim(vt)",
      verb_i: "go straight",
      verb_t: "aim",
      adverb: "directly",
    },
  ],
  [
    {
      noun: "cohesion",
      notes:
        "Parts and wholes: a whole is a group at its fullest, and disintegrating is dividing at its fullest. Break and mend (integrity) are related but separate",
      steps: {
        max_positive: {
          noun: "whole",
          adj: "entire",
          verb: "unify(vt)",
          verb_i: "unite",
          verb_t: "unify",
          adverb: "wholly",
        },
        max_negative: {
          adj: "disintegrated",
          verb: "disintegrate(vi)",
          verb_i: "disintegrate",
          verb_t: "disintegrate",
          adverb: "separately",
        },
      },
    },
    {
      noun: "part",
      adj: "partial",
      verb: "split(vi)",
      verb_i: "split",
      verb_t: "split",
      adverb: "partly",
    },
    {
      noun: "group",
      adj: "united",
      verb: "group(vt)",
      verb_i: "gather",
      verb_t: "group",
      adverb: "together",
    },
  ],
  [
    { noun: "price" },
    {
      noun: "cheapness",
      adj: "cheap",
      verb: "cheapen(vt)",
      verb_i: "get cheaper",
      verb_t: "cheapen",
      adverb: "cheaply",
    },
    {
      noun: "expense",
      adj: "expensive",
      verb: "mark_up(vt)",
      verb_i: "get pricier",
      verb_t: "mark up",
      adverb: "expensively",
    },
  ],
  [
    { noun: "significance" },
    {
      noun: "triviality",
      adj: "unimportant",
      verb: "trivialize(vt)",
      verb_i: "lose importance",
      verb_t: "trivialize",
      adverb: "trivially",
    },
    {
      noun: "importance",
      adj: "important",
      verb: "emphasize(vt)",
      verb_i: "gain importance",
      verb_t: "emphasize",
      adverb: "importantly",
    },
  ],
  [
    {
      noun: "integrity",
      notes:
        "There's some relationship between break - mend, part - whole, and divide - group. I'm not yet sure what it is.",
    },
    { noun: "breakage", adj: "broken", verb: "break(vi)", verb_i: "break", verb_t: "break" },
    { noun: "repair", adj: "intact", verb: "mend(vt)", verb_i: "heal", verb_t: "mend" },
  ],
  [
    { noun: "holiness" },
    {
      noun: "profanity",
      adj: "profane",
      verb: "desecrate(vt)",
      verb_i: "become profane",
      verb_t: "desecrate",
      adverb: "profanely",
    },
    {
      noun: "sanctity",
      adj: "sacred",
      verb: "sanctify(vt)",
      verb_i: "become sacred",
      verb_t: "sanctify",
      adverb: "sacredly",
    },
  ],
  [
    {
      notes:
        "negative verb forms: to release; positive verb forms: to contain; also container; negative noun liberator (no positive noun)",
    },
    {
      noun: "release",
      adj: "released",
      verb: "release(vt)",
      verb_i: "break loose",
      verb_t: "release",
    },
    {
      noun: "containment",
      adj: "contained",
      verb: "close_in(vi)",
      verb_i: "close in",
      verb_t: "enclose",
    },
  ],
  [
    {
      noun: "connectivity",
      notes:
        'nouns: cyclic graph - dag - tree - list - node / alternatively, maybe it is better to have a "node" and use magnitude to raise it to list, tree, dag, cyclic graph; negative verb forms: to connect; positive verb forms: to disconnect',
    },
    {
      noun: "connection",
      adj: "connected",
      verb: "connect(vi)",
      verb_i: "connect",
      verb_t: "attach",
    },
    {
      noun: "disconnection",
      adj: "disconnected",
      verb: "disconnect(vt)",
      verb_i: "come apart",
      verb_t: "disconnect",
    },
  ],
  [
    {},
    { noun: "start", adj: "started", verb: "start(vi)", verb_i: "start", verb_t: "start" },
    { noun: "stop", adj: "stopped", verb: "stop(vi)", verb_i: "stop", verb_t: "stop" },
  ],
  [
    {
      noun: "obligation",
      notes:
        "What one is entitled to and what one is bound to. It doesn't say whose duty answers whose right: a right to speak may ask of others only that they not interfere, and the sentence says so. How required an act is, from forbidden to obligatory, is permissibility",
    },
    {
      noun: "duty",
      adj: "obliged",
      verb: "be_bound_to(vt)",
      verb_t: "be bound to",
      adverb: "dutifully",
    },
    {
      noun: "right",
      adj: "entitled",
      verb: "be_entitled_to(vt)",
      verb_t: "be entitled to",
      adverb: "rightfully",
    },
  ],
  [
    {
      noun: "modality",
      notes:
        "How many cases something holds in, as in modal logic. Possible is not impossible, possibly not is not necessary, and contingent is neutral. Separate from the truth axis, which is likelihood: a conjecture is necessary or impossible while its truth is still neutral",
    },
    {
      noun: "impossibility",
      adj: "impossible",
      verb: "rule_out(vt)",
      verb_i: "become impossible",
      verb_t: "rule out",
      adverb: "impossibly",
    },
    {
      noun: "necessity",
      adj: "necessary",
      verb: "necessitate(vt)",
      verb_i: "become necessary",
      verb_t: "necessitate",
      adverb: "necessarily",
    },
  ],
  [
    {
      noun: "cover",
      notes:
        "Covering and exposing, physically or of information. A covering is skin, bark, a shell or cloth (body covering is skin). The surface of a thing is its outside",
      steps: {
        max_positive: { adj: "buried", verb: "bury(vt)", verb_i: "get buried", verb_t: "bury" },
        min_positive: {
          noun: "coating",
          adj: "coated",
          verb: "coat(vt)",
          verb_i: "get coated",
          verb_t: "coat",
        },
        min_negative: { noun: "hint", verb: "show_through(vi)", verb_i: "show through", verb_t: "hint at" },
        max_negative: { adj: "bare", verb: "strip(vt)", verb_i: "be laid bare", verb_t: "strip" },
      },
    },
    { noun: "exposure", adj: "exposed", verb: "expose(vt)", verb_i: "get exposed", verb_t: "expose" },
    { noun: "covering", adj: "covered", verb: "cover(vt)", verb_i: "get covered", verb_t: "cover" },
  ],
  [
    { noun: "security", notes: "Safe from harm or not. Withstanding harm is resilience" },
    {
      noun: "danger",
      adj: "dangerous",
      verb: "endanger(vt)",
      verb_i: "become dangerous",
      verb_t: "endanger",
      adverb: "dangerously",
    },
    { noun: "safety", adj: "safe", verb: "secure(vt)", verb_i: "become safe", verb_t: "secure", adverb: "safely" },
  ],
  [
    {
      noun: "capability",
      notes:
        "Ability, the can of I can swim. Its adverb is the modal and follows the verb like the others: work(vi) ably is can work, incapably can't",
    },
    {
      noun: "inability",
      adj: "unable",
      verb: "disable(vt)",
      verb_i: "lose ability",
      verb_t: "disable",
      adverb: "incapably",
    },
    {
      noun: "ability",
      adj: "able",
      verb: "empower(vt)",
      verb_i: "become able",
      verb_t: "empower",
      adverb: "ably",
    },
  ],
  [
    { noun: "reasoning" },
    {
      noun: "instinct",
      adj: "intuitive",
      verb: "intuit(vi)",
      verb_i: "intuit",
      verb_t: "intuit",
      adverb: "intuitively",
    },
    {
      noun: "analysis",
      adj: "analytical",
      verb: "analyze(vi)",
      verb_i: "analyze",
      verb_t: "analyze",
      adverb: "analytically",
    },
  ],
  [
    {
      noun: "achievement",
      notes:
        "Winning is succeeding at its fullest, against everyone else, and losing is failing completely; progress and setbacks are the lesser steps. To beat someone is exceed(vt)",
      steps: {
        max_positive: {
          noun: "victory",
          adj: "victorious",
          verb: "win(vi)",
          verb_i: "win",
          verb_t: "win",
          adverb: "victoriously",
        },
        min_positive: { noun: "progress", verb: "make_progress(vi)", verb_i: "make progress", verb_t: "further" },
        min_negative: { noun: "setback", verb: "set_back(vt)", verb_i: "slip back", verb_t: "set back" },
        max_negative: { noun: "defeat", adj: "defeated", verb: "lose(vi)", verb_i: "lose", verb_t: "lose" },
      },
    },
    {
      noun: "failure",
      adj: "unsuccessful",
      verb: "fail(vi)",
      verb_i: "fail",
      verb_t: "botch",
      adverb: "unsuccessfully",
    },
    {
      noun: "success",
      adj: "successful",
      verb: "succeed(vi)",
      verb_i: "succeed",
      verb_t: "accomplish",
      adverb: "successfully",
    },
  ],
  [
    {},
    {
      noun: "consumption",
      adj: "consuming",
      verb: "consume(vi)",
      verb_i: "consume",
      verb_t: "consume",
    },
    {
      noun: "production",
      adj: "productive",
      verb: "produce(vi)",
      verb_i: "produce",
      verb_t: "produce",
      adverb: "productively",
    },
  ],
  [
    {
      noun: "transmission",
      notes:
        "Something going across a distance or a medium to a destination, without the sender going along: messages, packages, requests, signals, light and heat. Giving and taking, a change of hands, is transfer",
    },
    {
      noun: "receipt",
      adj: "received",
      verb: "receive(vi)",
      verb_i: "receive",
      verb_t: "receive",
      synonyms: { verb: ["absorb", "get"], noun: ["reception", "absorption"] },
    },
    {
      noun: "dispatch",
      adj: "sent",
      verb: "send(vi)",
      verb_i: "send",
      verb_t: "send",
      synonyms: { verb: ["transmit", "emit"], noun: ["transmission", "emission"] },
    },
  ],
  [
    { noun: "expectation" },
    {
      noun: "fear",
      adj: "fearful",
      verb: "fear(vt)",
      verb_i: "be afraid",
      verb_t: "fear",
      adverb: "fearfully",
    },
    {
      noun: "hope",
      adj: "hopeful",
      verb: "hope(vi)",
      verb_i: "hope",
      verb_t: "hope for",
      adverb: "hopefully",
    },
  ],
  [
    { noun: "credence", notes: "negative adverb “doubtfully” needs a positive adverb" },
    { noun: "doubt", adj: "doubtful", verb: "doubt(vi)", verb_i: "doubt", verb_t: "doubt" },
    {
      noun: "belief",
      adj: "believing",
      verb: "believe(vi)",
      verb_i: "believe",
      verb_t: "believe",
    },
  ],
  [
    {
      noun: "leadership",
      steps: {
        max_positive: { noun: "sovereignty", adj: "sovereign", verb: "rule(vi)", verb_i: "rule", verb_t: "rule over" },
        min_positive: { noun: "guidance", verb: "guide(vi)", verb_i: "guide", verb_t: "guide" },
      },
    },
    {
      noun: "service",
      adj: "subservient",
      verb: "serve(vi)",
      verb_i: "serve",
      verb_t: "serve",
      adverb: "servilely",
    },
    {
      noun: "authority",
      adj: "in_charge",
      verb: "lead(vi)",
      verb_i: "lead",
      verb_t: "lead",
      adverb: "authoritatively",
    },
  ],
  [
    { noun: "activity" },
    {
      noun: "idleness",
      adj: "idle",
      verb: "rest(vi)",
      verb_i: "rest",
      verb_t: "rest",
      adverb: "idly",
    },
    {
      noun: "work",
      adj: "busy",
      verb: "work(vi)",
      verb_i: "work",
      verb_t: "work",
      adverb: "busily",
    },
  ],
  [
    { notes: 'Maybe the opposite of "search" should be "lose"?' },
    {
      noun: "hiding",
      adj: "hidden",
      verb: "hide(vi)",
      verb_i: "hide",
      verb_t: "conceal",
      adverb: "secretly",
    },
    {
      noun: "search",
      adj: "searching",
      verb: "search(vi)",
      verb_i: "search",
      verb_t: "seek",
      adverb: "searchingly",
    },
  ],
  [
    { noun: "memory" },
    {
      noun: "oblivion",
      adj: "forgotten",
      verb: "forget(vi)",
      verb_i: "forget",
      verb_t: "forget",
    },
    { noun: "learning", adj: "learned", verb: "learn(vi)", verb_i: "learn", verb_t: "learn" },
  ],
  [
    {
      noun: "cultivation",
      notes: "Planting and harvesting, and the same of anything: you reap what you sow, as with doubt, effort or money",
    },
    {
      noun: "harvest",
      adj: "reaped",
      verb: "reap(vi)",
      verb_i: "reap",
      verb_t: "reap",
      synonyms: { verb: ["harvest", "gain from", "profit from"], noun: ["return", "yield", "profit"] },
    },
    {
      noun: "sowing",
      adj: "sown",
      verb: "sow(vi)",
      verb_i: "sow",
      verb_t: "sow",
      synonyms: { verb: ["plant", "invest"], noun: ["planting", "investment"] },
    },
  ],
  [
    {
      noun: "transfer",
      notes:
        "Which way things flow, and how much comes back: selling is a lesser giving (you're paid) and buying a lesser taking (you pay), exchange is the neutral, and the max steps get nothing back",
      steps: {
        max_positive: {
          noun: "sacrifice",
          adj: "sacrificed",
          verb: "sacrifice(vi)",
          verb_i: "sacrifice",
          verb_t: "sacrifice",
        },
        min_positive: { noun: "sale", adj: "sold", verb: "sell(vi)", verb_i: "sell", verb_t: "sell" },
        neutral: { noun: "trade", verb: "exchange(vt)", verb_i: "trade", verb_t: "exchange" },
        min_negative: { noun: "purchase", adj: "bought", verb: "buy(vt)", verb_i: "shop", verb_t: "buy" },
        max_negative: { noun: "seizure", adj: "seized", verb: "seize(vi)", verb_i: "seize", verb_t: "seize" },
      },
    },
    { noun: "taking", adj: "taken", verb: "take(vi)", verb_i: "take", verb_t: "take" },
    {
      noun: "gift",
      adj: "given",
      verb: "give(vi)",
      verb_i: "give",
      verb_t: "give",
      adverb: "generously",
    },
  ],
  [
    {},
    {
      noun: "war",
      adj: "warlike",
      verb: "fight(vi)",
      verb_i: "fight",
      verb_t: "fight",
      adverb: "belligerently",
    },
    {
      noun: "peace",
      adj: "peaceful",
      verb: "make_peace(vi)",
      verb_i: "make peace",
      verb_t: "make peace with",
      adverb: "peacefully",
    },
  ],
  [
    {},
    {
      noun: "attack",
      adj: "offensive",
      verb: "attack(vi)",
      verb_i: "attack",
      verb_t: "attack",
      adverb: "offensively",
    },
    {
      noun: "defense",
      adj: "defensive",
      verb: "defend(vi)",
      verb_i: "defend",
      verb_t: "defend",
      adverb: "defensively",
    },
  ],
  [
    { noun: "care" },
    {
      noun: "neglect",
      adj: "neglected",
      verb: "neglect(vi)",
      verb_i: "neglect",
      verb_t: "neglect",
      adverb: "negligently",
    },
    {
      noun: "stewardship",
      adj: "tended",
      verb: "tend(vi)",
      verb_i: "tend",
      verb_t: "tend",
      adverb: "carefully",
    },
  ],
  [
    {
      noun: "control",
      notes:
        "How hard one pushes another to act, from persuading to forcing, and the other's side, from acquiescing to giving in. Ruling is <max_positive> lead(vi)",
      steps: {
        max_positive: {
          noun: "coercion",
          adj: "coercive",
          verb: "force(vt)",
          verb_i: "use force",
          verb_t: "force",
        },
        min_positive: {
          noun: "persuasion",
          adj: "persuasive",
          verb: "persuade(vi)",
          verb_i: "persuade",
          verb_t: "persuade",
        },
        min_negative: {
          noun: "acquiescence",
          adj: "acquiescent",
          verb: "acquiesce(vi)",
          verb_i: "acquiesce",
          verb_t: "acquiesce to",
        },
        max_negative: { adj: "forced", verb: "give_in(vi)", verb_i: "give in", verb_t: "give in to" },
      },
    },
    { noun: "obedience", adj: "obedient", verb: "obey(vi)", verb_i: "obey", verb_t: "obey" },
    {
      noun: "command",
      adj: "commanding",
      verb: "command(vt)",
      verb_i: "give orders",
      verb_t: "command",
    },
  ],
  [
    { noun: "fortitude", notes: "Are these fundamental enough?" },
    {
      noun: "vulnerability",
      adj: "vulnerable",
      verb: "succumb(vi)",
      verb_i: "succumb",
      verb_t: "succumb to",
    },
    {
      noun: "resilience",
      adj: "resilient",
      verb: "withstand(vt)",
      verb_i: "endure",
      verb_t: "withstand",
      adverb: "resiliently",
    },
  ],
  [
    {
      noun: "permissibility",
      notes:
        "How required an act is, the deontic scale: forbidden, discouraged, permitted, recommended, obligatory. The adverbs are the modals: obligatorily is must, advisably should, permissibly may, inadvisably shouldn't, impermissibly must not",
      steps: {
        max_positive: {
          noun: "requirement",
          adj: "obligatory",
          verb: "require(vt)",
          verb_i: "require",
          verb_t: "require",
          adverb: "obligatorily",
        },
        neutral: {
          noun: "permission",
          adj: "permitted",
          verb: "allow(vi)",
          verb_i: "allow",
          verb_t: "allow",
          adverb: "permissibly",
        },
        max_negative: {
          noun: "prohibition",
          adj: "forbidden",
          verb: "forbid(vi)",
          verb_i: "forbid",
          verb_t: "forbid",
          adverb: "impermissibly",
        },
      },
    },
    {
      noun: "discouragement",
      adj: "discouraged",
      verb: "discourage(vt)",
      verb_i: "discourage",
      verb_t: "discourage",
      adverb: "inadvisably",
    },
    {
      noun: "recommendation",
      adj: "recommended",
      verb: "recommend(vi)",
      verb_i: "recommend",
      verb_t: "recommend",
      adverb: "advisably",
    },
  ],
  [
    {
      noun: "visibility",
      notes:
        "Showing and watching, as saying and listening: attending to what's shown. Seeing, which just happens, is sense(vt) light. Appearing is emerge(vi) and disappearing vanish(vi); disguising is show(vt) falsely",
      steps: {
        max_positive: { noun: "display", verb: "display(vi)", verb_i: "display", verb_t: "display" },
        min_negative: { noun: "glimpse", verb: "glimpse(vt)", verb_i: "glance", verb_t: "glimpse" },
      },
    },
    { noun: "observation", adj: "watched", verb: "watch(vt)", verb_i: "look", verb_t: "watch", adverb: "observantly" },
    {
      noun: "demonstration",
      adj: "visible",
      verb: "show(vi)",
      verb_i: "show",
      verb_t: "show",
      adverb: "visibly",
    },
  ],
  [
    { noun: "conversation" },
    { noun: "listening", adj: "heeded", verb: "listen(vi)", verb_i: "listen", verb_t: "listen to" },
    { noun: "speech", adj: "spoken", verb: "say(vt)", verb_i: "speak", verb_t: "say", adverb: "aloud" },
  ],
  [
    {
      noun: "literacy",
      notes: "<min_positive> write is mark, a lesser writing; <min_negative> write is skim, a lesser reading",
      steps: {
        max_negative: { verb: "study(vi)", verb_i: "study", verb_t: "study" },
        min_negative: { verb: "skim(vi)", verb_i: "skim", verb_t: "skim" },
        neutral: { verb: "copy(vi)", verb_i: "copy", verb_t: "copy" },
        min_positive: { verb: "mark(vt)", verb_i: "make a mark", verb_t: "mark" },
        max_positive: { verb: "compose(vi)", verb_i: "compose", verb_t: "compose" },
      },
    },
    { noun: "reading", adj: "read", verb: "read(vi)", verb_i: "read", verb_t: "read" },
    { noun: "writing", adj: "written", verb: "write(vi)", verb_i: "write", verb_t: "write" },
  ],
  [
    { noun: "attention" },
    { noun: "oversight", adj: "unnoticed", verb: "overlook(vt)", verb_i: "miss", verb_t: "overlook" },
    { noun: "perception", adj: "perceptive", verb: "sense(vt)", verb_i: "perceive", verb_t: "sense" },
  ],
  [
    { noun: "utility" },
    { noun: "disposal", adj: "discarded", verb: "discard(vi)", verb_i: "discard", verb_t: "discard" },
    { noun: "usage", adj: "used", verb: "use(vi)", verb_i: "use", verb_t: "use" },
  ],
  [
    { noun: "action", notes: "negative do is undo: reversing an action" },
    { noun: "reversal", adj: "undone", verb: "undo(vi)", verb_i: "undo", verb_t: "undo" },
    { noun: "deed", adj: "done", verb: "do(vt)", verb_i: "act", verb_t: "do" },
  ],
  [
    { noun: "tactility" },
    { noun: "avoidance", adj: "avoided", verb: "avoid(vt)", verb_i: "keep away", verb_t: "avoid" },
    { noun: "contact", adj: "touching", verb: "touch(vi)", verb_i: "touch", verb_t: "touch" },
  ],
  [
    {
      noun: "arithmetic",
      notes:
        "Rank gives the operation, each repeating the one below (the hyperoperations): bare count is counting, <rank_1> add, <rank_2> multiply, <rank_3> raise to a power. The negative end is the inverse: count down, subtract, divide, take a root. The object is the number acted on and <by> gives the amount. A logarithm is rank: the rank of 1000 is 3",
    },
    { noun: "countdown", verb: "count_down(vi)", verb_i: "count down", verb_t: "count down" },
    { noun: "counting", adj: "counted", verb: "count(vi)", verb_i: "count", verb_t: "count" },
  ],
  [
    {
      noun: "locomotion",
      notes:
        "Moving by the medium moved through, from thinnest to densest: space, air, a leap, the ground, shallow water, water, solid ground. The verb names the medium, so a boat swims and a plane flies, as Russian plyt' is to swim and to sail; vehicles are <tool> + the verb",
      steps: {
        max_positive: {
          noun: "spaceflight",
          adj: "spacefaring",
          verb: "spacefly(vi)",
          verb_i: "spacefly",
          verb_t: "spacefly",
        },
        min_positive: { noun: "leap", verb: "leap(vi)", verb_i: "leap", verb_t: "leap over" },
        neutral: { noun: "walk", adj: "pedestrian", verb: "walk(vi)", verb_i: "walk", verb_t: "walk" },
        min_negative: { verb: "wade(vi)", verb_i: "wade", verb_t: "wade through" },
        max_negative: { noun: "burrow", verb: "burrow(vi)", verb_i: "burrow", verb_t: "burrow through" },
      },
    },
    {
      noun: "swim",
      adj: "swimming",
      verb: "swim(vi)",
      verb_i: "swim",
      verb_t: "swim across",
      adverb: "by_water",
    },
    { noun: "flight", adj: "flying", verb: "fly(vi)", verb_i: "fly", verb_t: "fly", adverb: "by_air" },
  ],
  [
    {
      noun: "logic",
      notes:
        "From premises to conclusions: assuming at the negative end, inferring at the positive, axioms and theorems at the ends. Reason, the faculty, is <tool> infer(vt); a reason for believing something is a premise, as a reason something happened is a cause",
      steps: {
        max_positive: { noun: "theorem", adj: "derived", verb: "derive(vt)", verb_i: "derive", verb_t: "derive" },
        max_negative: { noun: "axiom", adj: "axiomatic", verb: "posit(vt)", verb_i: "posit", verb_t: "posit" },
      },
    },
    {
      noun: "premise",
      adj: "assumed",
      verb: "assume(vt)",
      verb_i: "assume",
      verb_t: "assume",
      adverb: "hypothetically",
    },
    { noun: "conclusion", adj: "inferred", verb: "infer(vt)", verb_i: "reason", verb_t: "infer", adverb: "logically" },
  ],
  [
    {
      noun: "selection",
      notes: "Preferring is leaning toward choosing: prefer(vt) X exceed(vt) Y is to prefer X to Y",
      steps: {
        min_positive: { noun: "preference", adj: "preferred", verb: "prefer(vt)", verb_i: "prefer", verb_t: "prefer" },
      },
    },
    { noun: "rejection", adj: "rejected", verb: "reject(vt)", verb_i: "refuse", verb_t: "reject" },
    { noun: "choice", adj: "chosen", verb: "choose(vi)", verb_i: "choose", verb_t: "choose" },
  ],
  [
    {
      noun: "accountability",
      notes:
        "Credit and blame. Acknowledging, the neutral step, attributes without judging. The adjectives are about who deserves it: culpable is to blame. Thank you is thanks to you, and sorry blame to me",
      steps: {
        max_positive: { noun: "praise", verb: "praise(vt)", verb_i: "praise", verb_t: "praise" },
        neutral: {
          noun: "acknowledgment",
          verb: "acknowledge(vt)",
          verb_i: "acknowledge",
          verb_t: "acknowledge",
        },
        max_negative: { noun: "condemnation", verb: "condemn(vt)", verb_i: "condemn", verb_t: "condemn" },
      },
    },
    {
      noun: "blame",
      adj: "culpable",
      verb: "blame(vt)",
      verb_i: "lay blame",
      verb_t: "blame",
      adverb: "reproachfully",
    },
    {
      noun: "thanks",
      adj: "creditable",
      verb: "thank(vt)",
      verb_i: "give thanks",
      verb_t: "thank",
      adverb: "gratefully",
    },
  ],
  [
    { noun: "ownership" },
    { noun: "lack", adj: "lacking", verb: "lack(vt)", verb_t: "lack" },
    {
      noun: "possession",
      adj: "owned",
      verb: "possess(vt)",
      verb_t: "possess",
      adverb: "possessively",
    },
  ],
  [
    {},
    {
      notes:
        "be(vt) takes a <complement>: what the subject is. be(vi), with no complement, is existing or being somewhere: water be(vi) at this, there's water here. The one relation verb with a meaning without an object",
    },
    {
      noun: "characteristic",
      adj: "intrinsic",
      verb: "be(vt)",
      verb_i: "be",
      verb_t: "be",
      adverb: "characteristically",
    },
  ],
  [
    {
      noun: "similarity",
      notes: "Equal is the fullest similarity. Opposite is the fullest difference, as people use the word",
      steps: {
        max_positive: { noun: "equality", adj: "same", verb: "equal(vt)", verb_t: "equal", adverb: "identically" },
        max_negative: {
          noun: "antithesis",
          adj: "opposite",
          verb: "contrast_with(vt)",
          verb_t: "contrast with",
          adverb: "conversely",
        },
      },
    },
    {
      noun: "difference",
      adj: "different",
      verb: "differ_from(vt)",
      verb_t: "differ from",
      adverb: "differently",
    },
    {
      noun: "resemblance",
      adj: "similar",
      verb: "resemble(vt)",
      verb_t: "resemble",
      adverb: "similarly",
    },
  ],
  [
    {
      noun: "causality",
      notes:
        "The subject of result_from is the effect, and of cause the cause. Change verbs with an object already mean making something happen directly (melt(vt) is to make melt); cause(vt) is for causes that are things or events: the storm caused the flood",
    },
    { noun: "cause", adj: "causal", verb: "cause(vt)", verb_t: "cause", adverb: "causally" },
    {
      noun: "result",
      adj: "resulting",
      verb: "result_from(vt)",
      verb_t: "result from",
      adverb: "consequently",
    },
  ],
  [
    {
      noun: "affection",
      steps: {
        max_positive: { noun: "worship", adj: "devoted", verb: "worship(vt)", verb_t: "worship", adverb: "devotedly" },
        min_positive: { noun: "liking", adj: "fond", verb: "like(vt)", verb_t: "like", adverb: "fondly" },
        min_negative: { noun: "dislike", adj: "averse", verb: "dislike(vt)", verb_t: "dislike" },
        max_negative: { noun: "loathing", verb: "abominate(vt)", verb_t: "abominate" },
      },
    },
    { noun: "hatred", adj: "hateful", verb: "hate(vt)", verb_t: "hate", adverb: "hatefully" },
    { noun: "love", adj: "loving", verb: "love(vt)", verb_t: "love", adverb: "lovingly" },
  ],
  [
    { noun: "awareness" },
    {
      noun: "ignorance",
      adj: "ignorant",
      verb: "ignore(vt)",
      verb_t: "ignore",
      adverb: "ignorantly",
    },
    {
      noun: "knowledge",
      adj: "knowledgeable",
      verb: "know(vt)",
      verb_t: "know",
      adverb: "knowingly",
    },
  ],
  [
    {
      noun: "appetite",
      notes: "axis.csv also had revulsion / desire; positive verb forms: to desire",
    },
    { noun: "abhorrence", adj: "abhorrent", verb: "abhor(vt)", verb_t: "abhor" },
    { noun: "desire", adj: "desirable", verb: "desire(vt)", verb_t: "desire", adverb: "eagerly" },
  ],
  [
    {},
    { noun: "back_side", adj: "back", adverb: "at_the_back" },
    { noun: "front_side", adj: "front", verb: "face(vt)", verb_t: "face", adverb: "in_front" },
  ],
  [
    {
      noun: "scope(inclusion)",
      notes: "Participating is including oneself: <subject> I <verb> include(vt) <object> self in game. Abstaining is exclude(vt) self",
    },
    {
      noun: "exclusion",
      adj: "exclusive",
      verb: "exclude(vt)",
      verb_t: "exclude",
      adverb: "exclusively",
    },
    {
      noun: "inclusion",
      adj: "inclusive",
      verb: "include(vt)",
      verb_t: "include",
      adverb: "inclusively",
    },
  ],
  [
    { noun: "magnetism" },
    {
      noun: "repulsion",
      adj: "repellent",
      verb: "repel(vt)",
      verb_t: "repel",
      adverb: "repulsively",
    },
    {
      noun: "attraction",
      adj: "attractive",
      verb: "attract(vt)",
      verb_t: "attract",
      adverb: "attractively",
    },
  ],
  [
    {
      noun: "comparison",
      notes:
        "Comparison is a verb: X exceed Y <in> big is X is bigger than Y. Negative is fall short of (smaller), equal(vt) is as big as, exceed all is the biggest, and the scale grades it: <max_positive> exceed is much bigger",
    },
    { noun: "inferiority", adj: "lesser", verb: "fall_short_of(vt)", verb_t: "fall short of" },
    { noun: "superiority", adj: "greater", verb: "exceed(vt)", verb_t: "exceed" },
  ],
  [
    {
      noun: "seriality",
      notes:
        "Order in a sequence, counted from a reference point: now in a main clause, the main clause's time in a subclause. time <rank_3> next is tomorrow and time <rank_3> previous yesterday. Rank counts steps, as for generations: next <rank_2> is the one after next. Bare words are one step",
    },
    {
      noun: "precedence",
      adj: "previous",
      verb: "precede(vt)",
      verb_t: "precede",
      adverb: "before",
    },
    {
      noun: "succession",
      adj: "next",
      verb: "follow(vt)",
      verb_t: "follow",
      adverb: "afterwards",
    },
  ],
  [
    { noun: "sex", notes: "Female and male. Mating is joining them: mate(vi) is connect(vi) sex" },
    { noun: "femininity", adj: "female" },
    { noun: "masculinity", adj: "male" },
  ],
  [
    {
      noun: "lineage",
      notes:
        "Rank counts generations: child <rank_2> is a grandchild, negative child <rank_2> a grandparent, and neutral child <rank_2> a first cousin (a shared grandparent). Bare words are <rank_1>, and <rank_0> is oneself",
      steps: {
        max_negative: { noun: "ancestor" },
        min_negative: { noun: "aunt_or_uncle" },
        neutral: { noun: "sibling" },
        min_positive: { noun: "niece_or_nephew" },
        max_positive: { noun: "descendant" },
      },
    },
    { noun: "parent", adj: "parental" },
    { noun: "child", adj: "filial", verb: "bear(vt)", verb_i: "be born", verb_t: "bear" },
  ],
  [
    {
      noun: "provenance",
      notes:
        "Making something new or following what exists: inventing at the positive end, imitating at the negative. At the ends, the source others derive from and a copy of it: source of truth, information canonical. Where a thing comes from is come(vi) from. Copying a text is copy(vi), on literacy",
      steps: {
        max_positive: { noun: "source", adj: "canonical", synonyms: { noun: ["origin"], adj: ["authoritative"] } },
        max_negative: { noun: "copy", adj: "copied" },
      },
    },
    {
      noun: "imitation",
      adj: "derivative",
      verb: "imitate(vt)",
      verb_i: "imitate",
      verb_t: "imitate",
      adverb: "derivatively",
    },
    {
      noun: "originality",
      adj: "original",
      verb: "invent(vt)",
      verb_i: "innovate",
      verb_t: "invent",
      adverb: "originally",
    },
  ],
];

// Grammar markers, which are also domain words: they mark the role of what follows and its noun
// or verb form. The adjective and adverb forms come from position instead (a modifier trailing a
// noun or verb).
{
  section("marker");
  const marker: Tag[] = [T.grammar_helper, T.part_of_speech_specifier, T.domain_specifier];
  const verb_marker: Tag[] = [...marker, T.verb_specifier];
  cr("<subject>", { t: marker });
  cr("<object>", { t: marker });
  cr("<gerund>", { t: verb_marker });
  cr("<verb>", { t: verb_marker });
  cr("<verb_prescriptive>", { t: verb_marker, gloss: "verb (prescriptive / imperative)" });
  cr("<verb_interrogative>", { t: verb_marker });
  cr("<er>", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "the subject of a verb, as a noun: <er> eat = eater",
  });
  cr("<ee>", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "the object of a verb, as a noun: <ee> eat = what is eaten",
  });
  cr("<tool>", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "what a verb is done with, as a noun: <tool> open = key",
  });
  cr("<place>", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "where a verb is done, as a noun: <place> sleep = bed",
  });
  cr("<to>", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "who or where a verb goes to, as a noun: <to> send = addressee, <to> go = destination",
  });
  cr("<from>", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "who or where a verb comes from, as a noun: <from> come = origin, <from> receive = sender",
  });
  cr("<complement>", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "a subject complement, after is: what the subject is",
    notes:
      "What follows describes the subject, so it reads as a modifier: the adjective where there is one (is <complement> hot), otherwise the noun (is <complement> matter <rank_1>)",
  });
  cr("<foreign>", { t: marker });
}

// Number helpers: ordinals, and denominators for fractions, rates and ratios
{
  section("number_helper");
  cr("<ordinal>", {
    t: [T.grammar_helper],
    gloss: "makes a number an ordinal: <ordinal> number 3 is third",
    notes: "Before number: dimension <ordinal> number 4 is the fourth dimension, while person number 3 is three people",
  });
  cr("<per>", {
    t: [T.grammar_helper],
    gloss: "per / divided by: what follows is the denominator",
    notes:
      "a/b is a per b, so one word gives fractions, rates and ratios. <per> number 3 is a third, number 2 <per> number 3 two thirds, money <per> person money per person, <per> time <rank_2> per hour, number 3 <per> number 1 three to one. Denominators are whole numbers, so fractions are exact in any base",
  });
}

{
  section("grammar");
  cr("not", {
    t: [T.grammar_helper],
    gloss: "complement / negative / not",
    notes: "Complement: use for axis words. Always a prefix, applying to the one word after it",
  });
  cr("or", { t: [T.grammar_helper], notes: '"xor" through "or-exclusive"' });
  cr("and", { t: [T.grammar_helper] });
  cr("but", { t: [T.grammar_helper], gloss: "but / however" });
  cr("only", {
    t: [T.grammar_helper],
    notes: "A prefix, like not, applying to the one word after it: only you, <verb> only sleep(vi)",
  });
  cr("also", {
    t: [T.grammar_helper],
    gloss: "also / too",
    notes: "A prefix on the word it adds: also you is you too",
  });
  cr("even", {
    t: [T.grammar_helper],
    notes: "A prefix on the word that's surprising to include: even child, even the children",
  });
  cr("become", {
    t: [T.grammar_helper],
    gloss: "come to, begin to",
    notes:
      "A prefix on a verb that isn't a change verb, for coming into its state: <verb> become possess(vt) is gain, become know(vt) come to know. Like Toki Pona's kama jo, come to have. Change verbs have becoming of their own",
  });
  cr("if", { t: [T.grammar_helper], notes: '"iff" through "if-exclusive"' });
  cr("again", {
    t: [T.grammar_helper],
    gloss: "again, re-",
    notes:
      "Follows the verb, with the aspects: open(vt) again is reopen. With the negative end it undoes, implying the thing was done: <negative> cover(vt) again is uncover",
  });
  cr("<filler>", {
    t: [T.grammar_helper],
    gloss: "a hesitation, like um or pues",
    notes: "Means nothing and goes anywhere, even mid-phrase; the grammar carries on as if it weren't there",
  });
  cr("<regroup>", {
    t: [T.grammar_helper],
    gloss: "groups the modifiers after it into one, like Toki Pona's pi",
    notes:
      "Each modifier applies to the head by default: rock red yellow is a rock that's red and yellow. After <regroup>, the modifiers form one group that modifies the head together: rock <regroup> red yellow is an orange rock. The group runs to the end of the noun phrase",
  });
  cr("<clause_start>", {
    gloss: "clause start",
    notes:
      "Needed only after a noun. After if, a preposition, <subject>, <object> or <complement>, a clause starting with <subject> or a verb marker can only be a subclause, so the bracket is left out",
  });
  cr("<clause_end>", { gloss: "clause end" });
  cr("<continuous_tense_aspect>");
  cr("<perfect_tense_aspect>");
}

{
  section("preposition");
  cr("with", {
    t: [T.preposition],
    notes: "Company: open(vt) with mother. The means is by: open(vt) by <tool> open(vt), with a key",
  });
  cr("to", { t: [T.preposition] });
  cr("from", { t: [T.preposition] });
  cr("by", {
    t: [T.preposition],
    gloss: "by / by means of",
    notes: "The means: by hand, by boat, by law. In arithmetic, the amount: divide 6 by 3",
  });
  cr("for", {
    t: [T.preposition],
    notes: "With a noun, on behalf of: for mother. With a clause, the purpose: for <subject> you ..., so that you ...",
  });
  cr("in", { t: [T.preposition] });
  cr("of", { t: [T.preposition] });
  cr("about", { t: [T.preposition] });
  cr("at", { t: [T.preposition] });
  cr("as", {
    t: [T.preposition],
    gloss: "as / like",
    notes: "In the role of, or in the manner of: <as> person is as a person, and like a person",
  });
  cr("between", { t: [T.preposition], notes: "between X and Y: the and joins the two" });
}

{
  section("pronoun");
  cr("<pronoun_first_person>", {
    t: [T.pronoun],
    notes:
      '"me" through "first_person-singular", "we" through "first_person-plural"; also "first_person-plural-inclusive" and "first_person-plural-exclusive"',
  });
  cr("<pronoun_second_person>", {
    t: [T.pronoun],
    notes: '"you" through "second_person-singular", "y\'all" through "second_person-plural"',
  });
  cr("<pronoun_third_person>", {
    t: [T.pronoun],
    notes: "Plural and gender/sex can be specified optionally",
  });
  cr("<blank>", {
    t: [T.pronoun],
    gloss: "what a question asks about",
    notes:
      "Was interrogative_blank. With <verb_interrogative>: <subject> soldier <verb_interrogative> kill(vt) <object> <blank> = who does the soldier kill?",
  });
  cr("this", { t: [T.pronoun], notes: 'Could this be "it-near"?' });
  cr("that", { t: [T.pronoun], notes: 'Could this be "it-far"?' });
}

// axis helpers: axis_of plus a seven-step scale
{
  section("axis_helper");
  cr("<axis_of>", { t: [T.axis_helper] });
  cr("<max_negative>", { t: [T.axis_helper] });
  cr("<negative>", { t: [T.axis_helper], notes: 'Also called "very-neg"' });
  cr("<min_negative>", { t: [T.axis_helper], gloss: "minor negative" });
  cr("<neutral>", { t: [T.axis_helper] });
  cr("<min_positive>", { t: [T.axis_helper], gloss: "minor positive" });
  cr("<positive>", { t: [T.axis_helper], notes: 'Also called "very-pos"' });
  cr("<max_positive>", { t: [T.axis_helper] });
}

{
  // Higher dimensions go through the number domain: dimension <ordinal> number 4
  section("dimension");
  cr("<dimension_0>", { gloss: "no dimension" });
  cr("<dimension_x>", { gloss: "the first dimension (x)" });
  cr("<dimension_y>", { gloss: "the second dimension (y)" });
  cr("<dimension_z>", { gloss: "the third dimension (z)" });
}

{
  // After a digit, rank_N puts that digit at place N (worth base^N)
  section("rank");
  for (let i = 0; i < 16; i++) {
    cr(`<rank_${i}>`);
  }
}

{
  section("content");
  // General nouns
  cr("thing", {
    gloss: "thing / something",
    notes:
      "Bare, it's something. Everything and nothing are the completeness axis's nouns, one root and two; thing all and thing none say the same. thing <blank> is what",
  });
  cr("person");
  cr("place");
  cr("self", {
    gloss: "self / oneself / own",
    notes: "As an object it's reflexive: I know self is I know myself. family of self is one's own family",
  });
  cr("other", {
    gloss: "other / another",
    notes: "person other is another person. With a plural subject, <object> other or <to> other is each other",
  });
  cr("singular");
  cr("plural");

  // Living things and the body
  cr("animal");
  cr("plant");
  cr("fungus");
  cr("family", { gloss: "family / kin / relative" });
  cr("body", { gloss: "body / organ" });
  cr("head");
  cr("mouth");
  cr("arm", {
    gloss: "arm / limb",
    notes: "Rank counts segments out from the body, as Toki Pona's luka is arm and hand: <rank_2> hand, <rank_3> finger. Bare, it's <rank_1>",
  });
  cr("leg", {
    notes: "Rank counts segments out from the body, as Toki Pona's noka is leg and foot: <rank_2> foot, <rank_3> toe. Bare, it's <rank_1>",
  });
  cr("torso");

  // Nature and matter
  cr("water");
  cr("land");
  cr("rock");
  cr("matter", {
    gloss: "matter / substance",
    notes:
      "Rank gives the phase, rising in energy: <rank_0> solid, <rank_1> liquid, <rank_2> gas, <rank_3> plasma. As a modifier it gives a substance's phase: water matter <rank_0> is ice, water matter <rank_2> steam",
  });
  cr("celestial", {
    gloss: "celestial body",
    notes:
      "Rank gives the level in the orbital hierarchy, each orbiting the next: <rank_1> moon, <rank_2> planet, <rank_3> star, <rank_4> galaxy, <rank_5> galaxy cluster, <rank_6> supercluster. <rank_0> is a small body, too small to be round, told apart by modifiers: <rank_0> rock is an asteroid, <rank_0> ice a comet. Bare, it's any celestial body. With this, it's ours: celestial <rank_3> this is the Sun, celestial <rank_2> this Earth, celestial <rank_1> this the Moon",
  });
  cr("element", {
    gloss: "chemical element",
    t: [T.domain_specifier],
    notes:
      "Marks the element domain: the digit after it is an atomic number, so element 6 is carbon. The elements are written as one word, carbon for element 6, as phrases with a settled meaning are. Bare, it's any element. With matter it gives the phase: gold matter <rank_0> is solid gold",
  });

  // Senses and color
  cr("sound");
  cr("color");
  cr("red", {
    notes:
      "Two hues together are an even blend, in either order: red yellow is orange, yellow blue green, red blue purple. On a noun, group them: rock <regroup> red yellow is an orange rock. Lightness comes from the brightness axis: red bright is pink, and white and black are bright and dark. Brown is the neutral color, color <neutral>",
  });
  cr("yellow");
  cr("blue");
  cr("taste", { gloss: "taste / flavor" });
  cr("odor", { gloss: "odor / smell / scent" });

  // Made things and society
  cr("path");
  cr("building", { notes: "A house is building family, a room part building" });
  cr("money");
  cr("container");
  cr("wall");
  cr("rod");
  cr("symbol");
  cr("information", { gloss: "information / data" });

  // Abstract structure and number
  cr("number", {
    t: [T.domain_specifier],
    notes:
      "Marks the number domain: what follows reads the domain receivers as digits. The base comes from context",
  });
  cr("rank", {
    t: [T.domain_specifier],
    notes:
      "For places past <rank_15>: takes a subclause holding the place, as in number 3 rank <clause_start> number 1 3 9 <clause_end> (3e139)",
  });
  cr("dimension", {
    t: [T.domain_specifier],
  });
  cr("geometry", {
    gloss: "geometric figure",
    notes:
      "Rank gives a bounded figure of that many dimensions: <rank_0> point, <rank_1> line segment, <rank_2> shape, <rank_3> form (a 3D structure). A dimension helper gives the unbounded space up through that dimension: <dimension_x> a line, <dimension_y> a plane, <dimension_z> space. Modifiers say which figure: <rank_2> round is a circle, <rank_2> angular a polygon",
  });
  cr("node", {
    notes:
      "Rank lifts it to more general networks: <rank_1> sequence, <rank_2> tree, <rank_3> DAG, <rank_4> graph, <rank_5> hypergraph, <rank_6> higher-order network. Each takes 3 syllables",
  });
  cr("edge");
  cr("cardinal", {
    gloss: "cardinal direction",
    notes:
      "Rank counts quarter turns clockwise from north: <rank_0> north, <rank_1> east, <rank_2> south, <rank_3> west. Two ranks name the direction between them, north or south first as in English: cardinal <rank_0> <rank_1> is northeast, <rank_2> <rank_3> southwest. to cardinal <rank_0> is northward. Rank here numbers points on a circle rather than levels, unlike its other uses; kept for now",
  });
  cr("meta", {
    gloss: "meta / about itself",
    notes:
      "As a modifier, X about X: merit meta is metaethics, knowledge meta knowing what one knows. Not rank, which many nouns already use for their levels",
  });

  candidate("net", { gloss: "net / graph" });
  candidate("image", { gloss: "image / projection" });
  candidate("turn");
  candidate("direction", {
    notes:
      "Should this be a domain specifier? up - down, forward - back, left - right, north - south, east - west, in - out, future - past",
  });
  candidate("value");

  // Groups of related concepts
  for (const group of [
    ["number", "symbol"],
    ["width", "height", "depth"], // all nouns of axes, which are built after this
    ["sound", "taste"],
    ["animal", "plant", "fungus"],
  ]) {
    for (const word of group) {
      if (dictionary.has(word) || ["height", "width", "depth"].includes(word)) continue; // already a word
      candidate(word, group.length > 1 ? { notes: `Group: ${group.join(", ")}` } : {});
    }
  }
}

// digits: the number domain reads the domain receivers
{
  section("digit");
  for (let i = 0; i < 128; i++) {
    cr(`digit_${i}`, { domain: "number" });
  }
}

// axis words

// One cell of an axis's word matrix. Both verb cells hold the side's one verb word, with what it
// means without an object (verb_i) and with one (verb_t).
export type AxisCell = { word?: Word; gloss?: string };
export type AxisSide = Record<"adj" | "noun" | "verb_i" | "verb_t" | "adverb", AxisCell>;
export type Axis = {
  id: number;
  name: AxisCell; // axis_of + the positive noun
  positive: AxisSide;
  negative: AxisSide; // negative + the positive form
  steps: Record<MinorStep, AxisSide>; // each step helper + the positive form, where named
  notes?: string;
  verb_type?: VerbType; // from verb_types, for axes with a verb
};

// What an axis's verb means without and with an object depends on its type, and both sides of an
// axis share one. Listed by positive verb.
export type VerbType = "change" | "action" | "relation";

export const VERB_TYPE_RULES: Record<VerbType, { no_object: string; with_object: string }> = {
  change: { no_object: "undergo it: become, or move", with_object: "cause it: make, or move something" },
  action: { no_object: "do it", with_object: "do it to something" },
  relation: { no_object: "doesn't apply", with_object: "relate the subject to the object" },
};

export const verb_types: Record<VerbType, string[]> = {
  change: [
    "grow(vi)", "accelerate(vt)", "change(vi)", "simplify(vt)", "strengthen(vi)", "increase(vi)",
    "organize(vt)", "activate(vt)", "demarcate(vt)", "complete(vt)", "open(vi)", "smooth(vt)", "free(vt)",
    "abstract(vt)", "absolutize(vt)", "melt(vi)", "make_explicit(vt)", "externalize(vt)",
    "perpetuate(vt)", "become_essential(vi)", "idealize(vt)", "nest(vi)",
    "enumerate(vt)", "curl(vt)", "emerge(vi)", "distance(vt)", "quiet(vt)", "sharpen(vt)", "wet(vt)",
    "thicken(vi)", "lift(vt)", "stand(vi)", "bear(vt)", "heat(vt)", "brighten(vi)", "harden(vi)", "get_heavier(vi)", "prove(vt)",
    "postpone(vt)", "come_to_life(vi)", "eat(vt)", "sink(vi)", "veer_right(vi)",
    "withdraw(vt)", "spread(vi)", "stir(vi)", "persist(vi)", "make_artificial(vt)",
    "spread_out(vi)", "straighten(vi)", "improve(vi)", "entertain(vt)",
    "materialize(vi)", "enable(vt)", "angle(vt)", "rejuvenate(vt)", "wake(vi)", "create(vt)",
    "beautify(vt)", "go(vi)", "heap_up(vt)", "fill_up(vi)", "educate(vt)",
    "aim(vt)", "group(vt)", "mark_up(vt)", "emphasize(vt)", "mend(vt)",
    "sanctify(vt)", "close_in(vi)", "disconnect(vt)", "stop(vi)",
    "necessitate(vt)", "cover(vt)", "empower(vt)", "secure(vt)",
  ],
  action: [
    "analyze(vi)", "succeed(vi)", "produce(vi)", "send(vi)", "hope(vi)",
    "believe(vi)", "lead(vi)", "work(vi)", "search(vi)", "learn(vi)", "sow(vi)", "give(vi)",
    "make_peace(vi)", "defend(vi)", "tend(vi)", "command(vt)", "withstand(vt)",
    "recommend(vi)", "say(vt)", "write(vi)", "sense(vt)", "use(vi)",
    "do(vt)", "touch(vi)", "count(vi)", "thank(vt)", "invent(vt)", "show(vi)", "fly(vi)", "choose(vi)", "infer(vt)",
  ],
  relation: [
    "possess(vt)", "be(vt)", "be_entitled_to(vt)", "resemble(vt)", "result_from(vt)", "love(vt)", "know(vt)", "desire(vt)", "face(vt)", "include(vt)",
    "attract(vt)", "exceed(vt)", "follow(vt)",
  ],
};

const verb_type_of = new Map(
  (Object.entries(verb_types) as [VerbType, string[]][]).flatMap(([type, verbs]) =>
    verbs.map((verb) => [verb, type] as const),
  ),
);

// The axis words' subsections of the domain receivers, whole rows of 16: relations, then actions,
// then changes. Axes with no verb yet go with the relations
export const AXIS_SUBSECTIONS = [
  { type: "relation", label: "Relation axes", size: 16 },
  { type: "action", label: "Action axes", size: 32 },
  { type: "change", label: "Change axes", size: 80 },
] as const satisfies readonly { type: VerbType; label: string; size: number }[];

export function axis_subsections() {
  let start = receivers.start;
  return AXIS_SUBSECTIONS.map((s) => {
    const subsection = { ...s, start, end: start + s.size };
    start += s.size;
    return subsection;
  });
}

export const axes: Axis[] = [];
export const axis_by_word = new Map<Word, Axis>();


// Verbs first, so an axis's root is listed and labelled by its verb
const AXIS_FORMS = [
  ["verb", "verb"],
  ["noun", "noun"],
  ["adj", "adjective"],
  ["adverb", "adverb"],
] as const;
type FormKey = (typeof AXIS_FORMS)[number][0];

function empty_side(): AxisSide {
  return {
    adj: {},
    noun: {},
    verb_i: {},
    verb_t: {},
    adverb: {},
  };
}

function fill_cells(side: AxisSide, key: FormKey, word: Word, forms: AxisWordForms) {
  if (key !== "verb") {
    side[key] = { word };
    return;
  }
  const { verb_i: intransitive, verb_t: transitive } = forms;
  side.verb_i = { word, gloss: intransitive };
  side.verb_t = { word, gloss: transitive };
  name_verb(word, intransitive, transitive);
}

// A verb has a name for each meaning, gloss(vi) without an object and gloss(vt) with one, like
// grow(vi) and enlarge(vt). The word is named by one, and the other names it too.
export function verb_name(gloss: string, transitive: boolean): string {
  return `${gloss.trim().replace(/\s+/g, "_")}(${transitive ? "vt" : "vi"})`;
}

function name_verb(word: Word, intransitive?: string, transitive?: string) {
  const names = [
    intransitive && verb_name(intransitive, false),
    transitive && verb_name(transitive, true),
  ].filter((name): name is string => !!name);
  if (!names.includes(word.word)) {
    throw new Error(`Verb ${word.word} should be named for one of its meanings: ${names.join(" or ")}`);
  }
  for (const name of names) {
    if (name === word.word) continue;
    if (dictionary.has(name)) throw new Error(`Duplicate word: ${name}`);
    dictionary.set(name, word);
  }
  word.data.gloss = [
    intransitive && `${intransitive} (without an object)`,
    transitive && `${transitive} (with an object)`,
  ]
    .filter(is_defined)
    .filter(Boolean)
    .join(" / ");
}

{
  section("axis");

  const axis_of_word = dictionary.get("<axis_of>");
  const negative_word = dictionary.get("<negative>");
  const positive_word = dictionary.get("<positive>");
  const max_negative_word = dictionary.get("<max_negative>");
  const min_negative_word = dictionary.get("<min_negative>");
  const neutral_word = dictionary.get("<neutral>");
  const min_positive_word = dictionary.get("<min_positive>");
  const max_positive_word = dictionary.get("<max_positive>");

  if (!is_defined(axis_of_word)) throw new Error(`Missing axis_of word`);
  if (!is_defined(negative_word)) throw new Error(`Missing negative word`);
  if (!is_defined(positive_word)) throw new Error(`Missing positive word`);
  if (!is_defined(max_negative_word)) throw new Error(`Missing max_negative word`);
  if (!is_defined(min_negative_word)) throw new Error(`Missing min_negative word`);
  if (!is_defined(neutral_word)) throw new Error(`Missing neutral word`);
  if (!is_defined(min_positive_word)) throw new Error(`Missing min_positive word`);
  if (!is_defined(max_positive_word)) throw new Error(`Missing max_positive word`);

  const step_words: Record<MinorStep, Word> = {
    max_negative: max_negative_word,
    min_negative: min_negative_word,
    neutral: neutral_word,
    min_positive: min_positive_word,
    max_positive: max_positive_word,
  };

  function positive_of(positive: Word | undefined, word: string): Word {
    if (!is_defined(positive)) throw new Error(`Axis word ${word} has no positive counterpart`);
    return positive;
  }

  // Each subsection fills from its own start
  const next_id = {} as Record<VerbType, number>;
  for (const { type, start } of axis_subsections()) next_id[type] = start;

  for (const [axis, negative, positive] of axis_words_config) {
    const verb_type = positive.verb ? verb_type_of.get(positive.verb) : undefined;
    const type = verb_type ?? "relation";
    const id = next_id[type]++;
    const subsection = axis_subsections().find((s) => s.type === type)!;
    if (id >= subsection.end) {
      throw new Error(`No room for ${axis.noun} in ${subsection.label}, which holds ${subsection.size} axes`);
    }
    const entry: Axis = {
      id,
      name: {},
      positive: empty_side(),
      negative: empty_side(),
      steps: Object.fromEntries(MINOR_STEPS.map((step) => [step, empty_side()])) as Axis["steps"],
      notes: axis.notes,
      verb_type,
    };
    const positive_words: Partial<Record<FormKey, Word>> = {};

    for (const [key, domain] of AXIS_FORMS) {
      const name = positive[key];
      if (!name) continue;
      const word = cr(name, { t: [T.axis_word], domain, id, synonyms: positive.synonyms?.[key] });
      positive_words[key] = word;
      fill_cells(entry.positive, key, word, positive);
    }
    for (const [key, domain] of AXIS_FORMS) {
      const name = negative[key];
      if (!name) continue;
      const parts = [negative_word, positive_of(positive_words[key], name)];
      const word = cw(name, { t: [T.axis_word], domain, parts, synonyms: negative.synonyms?.[key] });
      fill_cells(entry.negative, key, word, negative);
    }
    for (const step of MINOR_STEPS) {
      const forms = axis.steps?.[step];
      if (!forms) continue;
      for (const [key, domain] of AXIS_FORMS) {
        const name = forms[key];
        if (!name) continue;
        const parts = [step_words[step], positive_of(positive_words[key], name)];
        const word = cw(name, { t: [T.axis_word], domain, parts, synonyms: forms.synonyms?.[key] });
        fill_cells(entry.steps[step], key, word, forms);
      }
    }

    const axis_name = axis.noun;
    if (axis_name) {
      const parts = [axis_of_word, positive_of(positive_words.noun, axis_name)];
      const word = cw(axis_name, {
        t: [T.axis_word],
        domain: "noun",
        notes: axis.notes,
        parts,
      });
      entry.name = { word };
    } else if (axis.notes) {
      // Without an axis noun, the notes go on the axis's first positive word
      const first =
        positive_words.verb ?? positive_words.noun ?? positive_words.adj ?? positive_words.adverb;
      if (first) first.data.notes = axis.notes;
    }

    axes.push(entry);
    for (const cell of [
      entry.name,
      ...Object.values(entry.positive),
      ...Object.values(entry.negative),
      ...Object.values(entry.steps).flatMap((side) => Object.values(side)),
    ]) {
      if (cell.word) axis_by_word.set(cell.word, entry);
    }
  }
}

// Named phrases: compounds common enough to want their own entry, like an axis verb with a rank
{
  const words_of = (name: string, parts: string[]) =>
    parts.map((part) => {
      const word = dictionary.get(part);
      if (!word) throw new Error(`Missing ${part} for ${name}`);
      return word;
    });
  function phrase(name: string, parts: string[], verb_i: string, verb_t: string) {
    const word = cw(name, { domain: "verb", parts: words_of(name, parts), verb_i, verb_t });
    name_verb(word, verb_i, verb_t);
  }
  function noun(name: string, parts: string[], data: Pick<WordData, "gloss" | "notes" | "synonyms"> = {}) {
    cw(name, { domain: "noun", parts: words_of(name, parts), ...data });
  }
  // Set expressions said on their own, like greetings, which have no part of speech
  function idiom(name: string, parts: string[], data: Pick<WordData, "gloss" | "notes" | "synonyms"> = {}) {
    cw(name, { parts: words_of(name, parts), ...data });
  }
  // Phase changes, by target phase
  phrase("evaporate(vi)", ["melt(vi)", "<rank_2>"], "evaporate", "vaporize");
  phrase("ionize(vi)", ["melt(vi)", "<rank_3>"], "ionize", "ionize");
  phrase("condense(vi)", ["freeze(vi)", "<rank_1>"], "condense", "condense");
  phrase("solidify(vi)", ["freeze(vi)", "<rank_0>"], "solidify", "solidify");

  // Saying or showing what isn't so
  phrase("tell_a_lie(vi)", ["say(vt)", "falsely"], "tell a lie", "lie about");
  phrase("pretend(vi)", ["show(vi)", "falsely"], "pretend", "disguise");
  // Saying or writing exactly: the clause is verbatim, so its pronouns are whoever first said it.
  // With meta, the words are someone else's, repeated: quoting
  phrase("reproduce(vi)", ["bear(vt)", "child"], "reproduce", "reproduce");
  phrase("feed(vi)", ["give(vi)", "<ee>", "eat(vt)"], "feed", "feed");
  phrase("mate(vi)", ["connect(vi)", "sex"], "mate", "mate with");

  // The senses: perceiving each one's medium. Feelings are perceived too: sense(vt) pain
  phrase("see(vi)", ["sense(vt)", "light"], "see", "see");
  phrase("hear(vi)", ["sense(vt)", "sound"], "hear", "hear");
  phrase("feel(vi)", ["sense(vt)", "contact"], "feel", "feel");
  phrase("taste(vi)", ["sense(vt)", "taste"], "taste", "taste");
  phrase("smell(vi)", ["sense(vt)", "odor"], "smell", "smell");

  // Computing is working data, as German Datenverarbeitung is data processing
  phrase("compute(vi)", ["work(vi)", "information"], "compute", "compute");
  phrase("say_verbatim(vi)", ["say(vt)", "identically"], "say verbatim", "say verbatim");
  phrase("quote(vi)", ["say(vt)", "identically", "meta"], "quote", "quote");
  phrase("write_verbatim(vi)", ["write(vi)", "identically"], "write verbatim", "write verbatim");
  phrase("quote_in_writing(vi)", ["write(vi)", "identically", "meta"], "quote in writing", "quote in writing");

  // Arithmetic, by rank; count_down is the inverse
  phrase("add(vi)", ["count(vi)", "<rank_1>"], "add", "add");
  phrase("multiply(vi)", ["count(vi)", "<rank_2>"], "multiply", "multiply");
  phrase("exponentiate(vt)", ["count(vi)", "<rank_3>"], "raise to a power", "exponentiate");
  phrase("subtract(vi)", ["count_down(vi)", "<rank_1>"], "subtract", "subtract");
  phrase("divide(vi)", ["count_down(vi)", "<rank_2>"], "divide", "divide");
  phrase("root(vt)", ["count_down(vi)", "<rank_3>"], "take a root", "root");

  // Networks, by how general the links are. Direction is a modifier, so a directed graph is a
  // graph with a word for directed (none yet)
  // Bounded figures by rank, unbounded spaces by dimension
  noun("point", ["geometry", "<rank_0>"]);
  noun("line_segment", ["geometry", "<rank_1>"], { gloss: "line segment" });
  noun("shape", ["geometry", "<rank_2>"]);
  noun("form", ["geometry", "<rank_3>"], { gloss: "form (3D structure)" });
  noun("curve", ["geometry", "<rank_1>", "round"]);
  noun("polyline", ["geometry", "<rank_1>", "angular"]);
  noun("circle", ["geometry", "<rank_2>", "round"]);
  noun("polygon", ["geometry", "<rank_2>", "angular"]);
  noun("sphere", ["geometry", "<rank_3>", "round"]);
  noun("polyhedron", ["geometry", "<rank_3>", "angular"]);
  noun("infinite_line", ["geometry", "<dimension_x>"], { gloss: "line (infinite)" });
  noun("plane", ["geometry", "<dimension_y>"]);
  noun("space", ["geometry", "<dimension_z>"], { gloss: "space (3D Euclidean)" });

  // Phases by rank, and substances in a phase. The phase axis (rigid, fluid) is how something
  // behaves, not its phase: glass is rigid, and sand pours
  noun("solid", ["matter", "<rank_0>"]);
  noun("liquid", ["matter", "<rank_1>"]);
  noun("gas", ["matter", "<rank_2>"], { notes: "Usually enough for air; gas this when it needs saying" });
  noun("plasma", ["matter", "<rank_3>"]);
  noun("air", ["matter", "<rank_2>", "this"], { gloss: "air (our gas)" });
  noun("ice", ["water", "matter", "<rank_0>"]);
  noun("steam", ["water", "matter", "<rank_2>"]);
  noun("lava", ["rock", "matter", "<rank_1>"], { gloss: "lava / magma" });

  // Celestial bodies by orbital level; this makes one ours
  noun("small_body", ["celestial", "<rank_0>"], { gloss: "small body (too small to be round)" });
  noun("asteroid", ["celestial", "<rank_0>", "rock"]);
  noun("comet", ["celestial", "<rank_0>", "ice"]);
  noun("moon", ["celestial", "<rank_1>"]);
  noun("planet", ["celestial", "<rank_2>"]);
  noun("star", ["celestial", "<rank_3>"]);
  noun("galaxy", ["celestial", "<rank_4>"]);
  noun("galaxy_cluster", ["celestial", "<rank_5>"], { gloss: "galaxy cluster" });
  noun("supercluster", ["celestial", "<rank_6>"]);
  noun("the_moon", ["celestial", "<rank_1>", "this"], { gloss: "the Moon" });
  noun("earth", ["celestial", "<rank_2>", "this"], { gloss: "Earth / the world" });
  noun("sun", ["celestial", "<rank_3>", "this"], { gloss: "the Sun" });
  noun("milky_way", ["celestial", "<rank_4>", "this"], { gloss: "the Milky Way" });
  noun("universe", ["everything"]);

  // The compass, by quarter turns clockwise from north; two ranks are the direction between
  noun("north", ["cardinal", "<rank_0>"]);
  noun("east", ["cardinal", "<rank_1>"]);
  noun("south", ["cardinal", "<rank_2>"]);
  noun("west", ["cardinal", "<rank_3>"]);
  noun("northeast", ["cardinal", "<rank_0>", "<rank_1>"]);
  noun("southeast", ["cardinal", "<rank_2>", "<rank_1>"]);
  noun("southwest", ["cardinal", "<rank_2>", "<rank_3>"]);
  noun("northwest", ["cardinal", "<rank_0>", "<rank_3>"]);

  // Units of time, a step up a ladder per rank; this, next and previous count from now
  noun("second", ["time", "<rank_0>"]);
  noun("minute", ["time", "<rank_1>"]);
  noun("hour", ["time", "<rank_2>"]);
  noun("day", ["time", "<rank_3>"]);
  noun("week", ["time", "<rank_4>"]);
  noun("month", ["time", "<rank_5>"]);
  noun("year", ["time", "<rank_6>"]);
  noun("decade", ["time", "<rank_7>"]);
  noun("century", ["time", "<rank_8>"]);
  noun("millennium", ["time", "<rank_9>"]);
  noun("today", ["time", "<rank_3>", "this"]);
  noun("tomorrow", ["time", "<rank_3>", "next"]);
  noun("yesterday", ["time", "<rank_3>", "previous"]);
  noun("daytime", ["time", "bright"]);
  noun("night", ["time", "dark"]);

  // Family: lineage steps and generations, gendered by modifier; a spouse is family by union
  noun("mother", ["parent", "female"]);
  noun("father", ["parent", "male"]);
  noun("daughter", ["child", "female"]);
  noun("son", ["child", "male"]);
  noun("sister", ["sibling", "female"]);
  noun("brother", ["sibling", "male"]);
  noun("aunt", ["aunt_or_uncle", "female"]);
  noun("uncle", ["aunt_or_uncle", "male"]);
  noun("grandparent", ["parent", "<rank_2>"]);
  noun("grandchild", ["child", "<rank_2>"]);
  noun("cousin", ["sibling", "<rank_2>"], { gloss: "first cousin" });
  noun("second_cousin", ["sibling", "<rank_3>"], { gloss: "second cousin" });
  noun("spouse", ["family", "united"], {
    gloss: "spouse / partner",
    notes: "Family by union rather than descent. In-laws are family of spouse",
  });

  // Colors: two hues are an even blend, lightness is the brightness axis
  noun("orange", ["red", "yellow"]);
  noun("green", ["yellow", "blue"]);
  noun("purple", ["red", "blue"]);
  noun("pink", ["red", "bright"]);
  noun("maroon", ["red", "dark"]);
  noun("white", ["color", "bright"]);
  noun("black", ["color", "dark"]);
  noun("gray", ["color", "<neutral>", "bright"]);
  noun("brown", ["color", "<neutral>"], {
    notes: "The neutral color. Since <neutral> steps a following axis word, put it after any axis words: rock big brown, not rock brown big",
  });

  // What arithmetic gives: the result of the operation
  noun("sum", ["result", "of", "<gerund>", "add(vi)"]);
  noun("arithmetic_difference", ["result", "of", "<gerund>", "subtract(vi)"], { gloss: "difference (of numbers)" });
  noun("product", ["result", "of", "<gerund>", "multiply(vi)"]);
  noun("quotient", ["result", "of", "<gerund>", "divide(vi)"]);
  noun("power", ["result", "of", "<gerund>", "exponentiate(vt)"]);

  // The correlatives: thing, person, place and time with all, none and <blank>. Everything is the
  // completeness axis's noun, and nothing its negative
  noun("nothing", ["nothingness"], { notes: "thing none says the same" });
  noun("what", ["thing", "<blank>"]);
  noun("everyone", ["person", "all"]);
  noun("no_one", ["person", "none"], { gloss: "no one" });
  noun("who", ["person", "<blank>"]);
  noun("everywhere", ["place", "all"]);
  noun("nowhere", ["place", "none"]);
  noun("where", ["place", "<blank>"]);
  noun("always", ["time", "all"]);
  noun("never", ["time", "none"]);
  noun("when", ["time", "<blank>"]);

  noun("quotation", ["<ee>", "quote(vi)"], { gloss: "quotation / quote", notes: "What's quoted" });
  noun("quoter", ["<er>", "quote(vi)"], { notes: "Whoever quotes" });
  noun("machine", ["<er>", "work(vi)", "artificial"], { gloss: "machine / robot", notes: "An artificial worker" });
  noun("computation", ["<gerund>", "work(vi)", "information"], {
    notes: "Working data. Working a material is crafting it, as German werken: work(vt) rock is stonework",
  });
  noun("computer", ["<tool>", "work(vi)", "information"], {
    notes: "What works data. A computer was first a person who computed, and <er> work(vt) information still is",
  });
  noun("reason", ["<tool>", "infer(vt)"], { gloss: "reason (the faculty)", notes: "What one reasons with" });
  noun("mind", ["<er>", "sense(vt)", "self"], { notes: "What perceives itself" });
  noun("model", ["<er>", "resemble(vt)"], {
    gloss: "model / likeness",
    notes: "What resembles something",
    synonyms: ["simulation"],
  });
  noun("conscience", ["<tool>", "blame(vt)", "self"], {
    notes: "What one blames oneself with, and by the same axis credits oneself: a clear conscience",
  });
  noun("law", ["command", "abstract"], {
    gloss: "law / rule",
    notes:
      "A general command: one that says nothing of particular people or ends, unlike a command, which is an order to someone. Whose law is said with of",
  });

  // Conversation
  idiom("yes", ["true"], { notes: "That's so" });
  idiom("no", ["false"], { notes: "That's not so" });
  idiom("hello", ["good"]);
  idiom("goodbye", ["go(vi)", "well"]);
  idiom("thank_you", ["thanks", "to", "<pronoun_second_person>"], { gloss: "thank you", notes: "Thanks to you: the credit goes to you" });
  idiom("sorry", ["blame", "to", "<pronoun_first_person>"], { notes: "Blame to me: my fault" });
  idiom("please", ["if", "<verb>", "desire(vt)"], {
    notes:
      "If you want, as French s'il vous plaît is if it pleases you. A set phrase, so it needs neither clause bracket, before or after the request: if only takes a clause, and listeners know where it stops. Its subclause takes the request's subject, you",
  });

  // Limbs by segment, counting out from the body, and their joints
  noun("hand", ["arm", "<rank_2>"]);
  noun("finger", ["arm", "<rank_3>"]);
  noun("foot", ["leg", "<rank_2>"]);
  noun("toe", ["leg", "<rank_3>"]);
  noun("elbow", ["node", "arm"]);
  noun("wrist", ["node", "hand"]);
  noun("ankle", ["node", "foot"]);

  // Parts of things, head first: the kind of part, then the whole. Organs are <tool> + what
  // they do, where there's a verb; a body part names the like part of another whole
  noun("skin", ["covering", "body"]);
  noun("hair", ["covering", "head"]);
  noun("fur", ["covering", "animal"]);
  noun("bark", ["covering", "plant"]);
  noun("horn", ["rod", "head"]);
  noun("tail", ["rod", "back"]);
  noun("tongue", ["rod", "mouth"]);
  noun("tooth", ["rock", "mouth"]);
  noun("bone", ["rock", "body"]);
  noun("knee", ["node", "leg"]);
  noun("neck", ["node", "head"]);
  noun("claw", ["finger", "sharp"]);
  noun("eye", ["<tool>", "see(vt)"]);
  noun("ear", ["<tool>", "hear(vt)"]);
  noun("nose", ["<tool>", "smell(vt)"]);
  noun("brain", ["<tool>", "know(vt)"]);
  noun("heart", ["center", "body"]);
  noun("blood", ["liquid", "body"]);
  noun("flesh", ["matter", "body"]);
  noun("sap", ["liquid", "plant"]);
  noun("egg", ["container", "child"]);
  noun("food", ["<ee>", "eat(vt)"], { notes: "What's eaten" });
  noun("seed", ["<ee>", "sow(vi)"], { notes: "What's sown" });
  noun("fruit", ["food", "seed"], { notes: "Food with seed in it" });
  noun("filter", ["<tool>", "separate(vi)"], { synonyms: ["sieve"] });
  noun("liver", ["filter", "body"], { notes: "The body's filter" });
  noun("bug", ["animal", "<max_negative>", "big"], { gloss: "bug / insect", notes: "A very small animal", synonyms: ["insect"] });
  noun("louse", ["bug", "hair"], { notes: "The bug of hair" });
  noun("animal_noise", ["speech", "animal"], { gloss: "animal noise / call", notes: "An animal's speech", synonyms: ["call", "cry"] });
  noun("ash", ["result", "fire"], { notes: "What fire leaves: the result of burning" });
  noun("smoke", ["ash", "gas"], { notes: "The result of burning, as a gas" });
  noun("house", ["building", "family"], { gloss: "house / home" });
  noun("room", ["part", "building"]);
  noun("grease", ["<tool>", "slip(vi)"], { gloss: "grease / lubricant" });
  noun("glue", ["<tool>", "stick(vi)"]);
  noun("tree", ["plant", "big"]);
  noun("sky", ["place", "high"], { notes: "The high place, as Toki Pona's sewi is up, sky and heaven" });
  noun("rain", ["water", "sky"]);
  noun("cloud", ["covering", "sky"], { notes: "The sky's covering" });
  noun("root", ["foot", "plant"], { gloss: "root (of a plant)" });
  noun("trunk", ["torso", "plant"]);
  noun("branch", ["arm", "plant"]);
  noun("leaf", ["finger", "plant"]);

  // Animals and vehicles by how they move
  noun("bird", ["animal", "flying"]);
  noun("fish", ["animal", "swimming"]);
  noun("feather", ["covering", "bird"]);
  noun("boat", ["<tool>", "swim(vi)"], { gloss: "boat / ship" });
  noun("aircraft", ["<tool>", "fly(vi)"]);
  noun("spacecraft", ["<tool>", "spacefly(vi)"]);

  // The elements: element and the digit of the atomic number, a phrase settled into a word
  elements.forEach((name, i) => noun(name, ["element", `digit_${i + 1}`], { gloss: `${name} (element ${i + 1})` }));

  noun("sequence", ["node", "<rank_1>"], { gloss: "sequence / chain / list" });
  // Sequences by how they're laid out, and through more dimensions
  noun("array", ["sequence", "continuous"], { notes: "An unbroken sequence, stored contiguously" });
  noun("linked_list", ["sequence", "discrete"], { gloss: "linked list", notes: "A sequence of separate pieces, each linked to the next" });
  noun("grid", ["sequence", "<dimension_y>"], {
    gloss: "table / grid / matrix (of data)",
    notes: "A sequence through two dimensions; sequence <dimension_z> is through three. A table to sit at is <place> eat(vt)",
  });
  // Furniture is the place for doing something, as a bed is the place for sleeping
  noun("bed", ["<place>", "sleep(vi)"]);
  noun("chair", ["<place>", "sit(vi)"], { gloss: "chair / seat" });
  noun("table", ["<place>", "eat(vt)"], { gloss: "table (furniture)", notes: "A data table is a grid" });
  noun("desk", ["<place>", "work(vi)"], { gloss: "desk / workbench" });
  noun("tree_graph", ["node", "<rank_2>"], { gloss: "tree (graph)" });
  noun("dag", ["node", "<rank_3>"], { gloss: "directed acyclic graph" });
  noun("graph", ["node", "<rank_4>"], { gloss: "graph / network" });
  noun("hypergraph", ["node", "<rank_5>"]);
  noun("higher_order_network", ["node", "<rank_6>"], { gloss: "higher-order network" });
}

// Toki Pona words and their meanings, for comparison
export const toki_pona_reference: [toki_pona: string, english: string][] = [
  ["a/kin", "[emphasis]"],
  ["kule", "color"],
  ["mute", "many, very"],
  ["sewi", "top, high, holy"],
  ["akesi", "reptile, amphibian"],
  ["kulupu", "group"],
  ["nanpa", "number"],
  ["sijelo", "body"],
  ["ala", "no, nothing"],
  ["kute", "listen, ear"],
  ["nasa", "strange, weird"],
  ["sike", "circle"],
  ["alasa", "hunt, search"],
  ["la", "[context]"],
  ["nasin", "way, path"],
  ["sin", "new, again"],
  ["ale", "all, everything"],
  ["lape", "sleep"],
  ["nena", "bump, nose"],
  ["sina", "you"],
  ["anpa", "low"],
  ["laso", "blue, green"],
  ["ni", "this, that"],
  ["sinpin", "face, wall"],
  ["ante", "different"],
  ["lawa", "head, rule"],
  ["nimi", "name, word"],
  ["sitelen", "picture, write"],
  ["anu", "or"],
  ["len", "clothing, cover"],
  ["noka", "leg, foot"],
  ["sona", "know"],
  ["awen", "keep, stay"],
  ["lete", "cold"],
  ["o", "[wish/command]"],
  ["soweli", "animal"],
  ["e", "[direct object]"],
  ["li", "[predicate]"],
  ["olin", "love"],
  ["suli", "big, important"],
  ["en", "[and]"],
  ["lili", "small"],
  ["ona", "he/she/it/they"],
  ["suno", "sun, light"],
  ["esun", "shop, trade"],
  ["linja", "line"],
  ["open", "start, open"],
  ["supa", "surface, table"],
  ["ijo", "thing"],
  ["lipu", "flat, page, book"],
  ["pakala", "broken"],
  ["suwi", "sweet, cute"],
  ["ike", "bad"],
  ["loje", "red"],
  ["pali", "do, make, work"],
  ["tan", "from, because"],
  ["ilo", "tool"],
  ["lon", "in/at; true"],
  ["palisa", "stick, rod"],
  ["taso", "but; only"],
  ["insa", "inside"],
  ["luka", "hand, arm"],
  ["pan", "bread, grain"],
  ["tawa", "go, move; to"],
  ["jaki", "gross, trash"],
  ["lukin", "see, eye; try to"],
  ["pana", "give"],
  ["telo", "water, liquid"],
  ["jan", "person"],
  ["lupa", "hole"],
  ["pi", "[regrouper]"],
  ["tenpo", "time"],
  ["jelo", "yellow"],
  ["ma", "land"],
  ["pilin", "heart, feel"],
  ["toki", "talk, language"],
  ["jo", "have"],
  ["mama", "parent"],
  ["pimeja", "dark, black"],
  ["tomo", "house, room"],
  ["kala", "fish"],
  ["mani", "money"],
  ["pini", "end, finish"],
  ["tu", "two"],
  ["kalama", "sound"],
  ["meli", "female"],
  ["pipi", "bug, insect"],
  ["unpa", "sex"],
  ["kama", "come"],
  ["mi", "I, me, we, us"],
  ["poka", "side, vicinity"],
  ["uta", "mouth"],
  ["kasi", "plant"],
  ["mije", "male"],
  ["poki", "box, container"],
  ["utala", "fight, battle"],
  ["ken", "can; possible"],
  ["moku", "eat, food"],
  ["pona", "good, simple"],
  ["walo", "white"],
  ["kepeken", "using, with (tool)"],
  ["moli", "dead, kill"],
  ["pu", "(toki pona book)"],
  ["wan", "one"],
  ["kili", "fruit"],
  ["monsi", "back"],
  ["sama", "same; like"],
  ["waso", "bird"],
  ["kiwen", "hard, rock"],
  ["mu", "[animal noise]"],
  ["seli", "hot, fire"],
  ["wawa", "strong, energy"],
  ["ko", "paste, powder"],
  ["mun", "moon, star"],
  ["selo", "layer, skin"],
  ["weka", "away"],
  ["kon", "air, spirit, essence"],
  ["musi", "entertaining"],
  ["seme", "[what]"],
  ["wile", "want, need"],
];

// A verb is in the dictionary under both its names, but is one word
export const words = Array.from(new Set(dictionary.values()));

export const data_errors = words.map(validate_word).filter(is_defined);
data_errors.forEach((error) => console.error(error));

export const domains: Record<string, Map<string, Word>> = {};
words.forEach((word) => {
  if (word.data.domain) {
    let map = domains[word.data.domain];
    if (!map) {
      map = new Map();
      domains[word.data.domain] = map;
    }
    map.set(word.word, word);
  }
  // Populate uses
  (word.data.parts ?? []).forEach((part) => {
    if (!part.data.uses.includes(word)) part.data.uses.push(word);
  });
  // Populate homonyms
  const id = word.data.id;
  if (id > -1) {
    words.forEach((w) => {
      if (id === w.data.id && w !== word) {
        word.data.homonyms.push(w);
      }
    });
  }
});
