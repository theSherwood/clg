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
// The first 128 IDs are core words, and domain words must be among them so they're never
// ambiguous. The last 128 are shared by partial domains (the digits, in the number domain) and
// the axis words, which are told apart by domain.
export const sections = [
  { key: "marker", label: "Grammar markers", start: 0, end: 6 },
  { key: "grammar", label: "Grammar helpers", start: 6, end: 32 },
  { key: "preposition", label: "Prepositions", start: 32, end: 40 },
  { key: "pronoun", label: "Pronouns", start: 40, end: 48 },
  { key: "axis_helper", label: "Axis helpers", start: 48, end: 56 },
  { key: "content", label: "Content roots", start: 56, end: 128 },
  { key: "axis", label: "Axis words", start: 128, end: 256 },
  { key: "digit", label: "Digits", start: 128, end: 256 },
] as const; // end is exclusive

export type Section = (typeof sections)[number];
export type SectionKey = Section["key"];

type WordData = {
  id: number;
  t: Tag[]; // tags
  section: SectionKey;
  gloss?: string; // fuller English meaning, when the word name is a shorthand
  notes?: string;

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

let current_section: Section = sections[0];
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
};

// [axis, negative, positive]. The axis noun is axis_of + the positive noun; each negative form is
// negative + the positive form.
const axis_words_config: [AxisWordForms, AxisWordForms, AxisWordForms][] = [
  [
    {
      noun: "size",
      notes:
        "From axis.csv: positive noun giant; positive verb to grow something (transitive), to grow (intransitive)",
    },
    {
      noun: "smallness",
      adj: "small",
      verb: "shrink(v)",
      verb_i: "shrink",
      verb_t: "shrink",
      adverb: "slightly",
    },
    {
      noun: "bigness",
      adj: "big",
      verb: "grow(v)",
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
      verb: "decelerate(v)",
      verb_i: "slow down",
      verb_t: "slow down",
      adverb: "slowly",
    },
    {
      noun: "fastness",
      adj: "fast",
      verb: "accelerate(v)",
      verb_i: "speed up",
      verb_t: "accelerate",
      adverb: "quickly",
    },
  ],
  [
    {
      noun: "adaptability",
      notes: "From axis.csv (as dynamism: static / dynamic): positive verb change? (transitive)",
    },
    {
      noun: "stability",
      adj: "static",
      verb: "stabilize(v)",
      verb_i: "settle",
      verb_t: "stabilize",
      adverb: "statically",
    },
    {
      noun: "dynamism",
      adj: "dynamic",
      verb: "adapt(v)",
      verb_i: "adapt",
      verb_t: "make adaptable",
      adverb: "dynamically",
    },
  ],
  [
    { noun: "complexity(axis)", notes: "From axis.csv: positive verb simplify (transitive)" },
    {
      noun: "complexity(state)",
      adj: "complex",
      verb: "complicate(v)",
      verb_i: "become complicated",
      verb_t: "complicate",
      adverb: "complexly",
    },
    {
      noun: "simplicity",
      adj: "simple",
      verb: "simplify(v)",
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
      verb: "weaken(v)",
      verb_i: "weaken",
      verb_t: "weaken",
      adverb: "weakly",
    },
    {
      noun: "strength(state)",
      adj: "strong",
      verb: "strengthen(v)",
      verb_i: "strengthen",
      verb_t: "strengthen",
      adverb: "strongly",
    },
  ],
  [
    {
      noun: "quantity",
      notes:
        "From axis.csv (as quantity?): negative noun poverty, negative verb to decrease (transitive); positive noun abundance, positive verb to increase (transitive)",
    },
    {
      noun: "scarcity",
      adj: "less",
      verb: "decrease(v)",
      verb_i: "decrease",
      verb_t: "decrease",
      adverb: "barely",
    },
    {
      noun: "abundance",
      adj: "more",
      verb: "increase(v)",
      verb_i: "increase",
      verb_t: "increase",
      adverb: "abundantly",
    },
  ],
  [
    {
      noun: "orderliness",
      notes:
        "From axis.csv (as orderliness?: chaos / order): positive noun order, positive verb organize (transitive), positive adjective organized",
    },
    {
      noun: "chaos",
      adj: "chaotic",
      verb: "disorganize(v)",
      verb_i: "fall into chaos",
      verb_t: "disorganize",
      adverb: "chaotically",
    },
    {
      noun: "order",
      adj: "organized",
      verb: "organize(v)",
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
      verb: "lull(v)",
      verb_i: "subside",
      verb_t: "lull",
      adverb: "passively",
    },
    {
      noun: "agency",
      adj: "agentic",
      verb: "act(v)",
      verb_i: "act",
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
      verb: "smear(v)",
      verb_i: "merge",
      verb_t: "smear",
      adverb: "continuously",
    },
    {
      noun: "discreteness",
      adj: "discrete",
      verb: "demarcate(v)",
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
      verb: "erase(v)",
      verb_i: "vanish",
      verb_t: "erase",
      adverb: "none(adverb)",
    },
    {
      noun: "everything",
      adj: "all",
      verb: "fill(v)",
      verb_i: "fill up",
      verb_t: "fill",
      adverb: "completely",
    },
  ],
  [
    { noun: "openness(axis)", notes: "From axis.csv: positive verb to open (transitive)" },
    {
      noun: "closure",
      adj: "closed",
      verb: "close(v)",
      verb_i: "close",
      verb_t: "close",
      adverb: "tightly",
    },
    {
      noun: "openness(state)",
      adj: "open",
      verb: "open(v)",
      verb_i: "open",
      verb_t: "open",
      adverb: "loosely",
    },
  ],
  [
    {
      noun: "granularity",
      notes: "From axis.csv (as rough / smooth): positive verb to smooth (transitive)",
    },
    {
      noun: "coarseness",
      adj: "coarse",
      verb: "roughen(v)",
      verb_i: "roughen",
      verb_t: "roughen",
      adverb: "roughly",
    },
    {
      noun: "smoothness",
      adj: "smooth",
      verb: "smooth(v)",
      verb_i: "become smooth",
      verb_t: "smooth",
      adverb: "smoothly",
    },
  ],
  [
    {
      noun: "coercion(axis)",
      notes:
        "From axis.csv (as force / choose): positive verb choose? (transitive); positive adjective selected",
    },
    {
      noun: "coercion(state)",
      adj: "forced",
      verb: "force(v)",
      verb_i: "give in",
      verb_t: "force",
      adverb: "under_duress",
    },
    {
      noun: "freedom",
      adj: "free",
      verb: "free(v)",
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
      verb: "reify(v)",
      verb_i: "take shape",
      verb_t: "reify",
      adverb: "concretely",
    },
    {
      noun: "abstraction(state)",
      adj: "abstract",
      verb: "abstract(v)",
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
      verb: "relativize(v)",
      verb_i: "become relative",
      verb_t: "relativize",
      adverb: "relatively",
    },
    {
      noun: "absolute(state)",
      adj: "absolute",
      verb: "absolutize(v)",
      verb_i: "become absolute",
      verb_t: "absolutize",
      adverb: "absolutely",
    },
  ],
  [
    { noun: "rigidity(axis)" },
    {
      noun: "rigidity(state)",
      adj: "rigid",
      verb: "stiffen(v)",
      verb_i: "stiffen",
      verb_t: "stiffen",
      adverb: "stiffly",
    },
    {
      noun: "fluidity",
      adj: "fluid",
      verb: "flow(v)",
      verb_i: "flow",
      verb_t: "liquefy",
      adverb: "fluidly",
    },
  ],
  [
    { noun: "explicitness(axis)" },
    {
      noun: "implicitness",
      adj: "implicit",
      verb: "imply(v)",
      verb_i: "become implicit",
      verb_t: "imply",
      adverb: "implicitly",
    },
    {
      noun: "explicitness(state)",
      adj: "explicit",
      verb: "make_explicit(v)",
      verb_i: "become explicit",
      verb_t: "make explicit",
      adverb: "explicitly",
    },
  ],
  [
    { noun: "internality(axis)", notes: "Duplicate of in/out" },
    {
      noun: "internality(state)",
      adj: "internal",
      verb: "internalize(v)",
      verb_i: "go inward",
      verb_t: "internalize",
      adverb: "internally",
    },
    {
      noun: "externality",
      adj: "external",
      verb: "externalize(v)",
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
      verb: "end(v)",
      verb_i: "end",
      verb_t: "limit",
      adverb: "finitely",
    },
    {
      noun: "infinity",
      adj: "infinite",
      verb: "perpetuate(v)",
      verb_i: "go on forever",
      verb_t: "perpetuate",
      adverb: "infinitely",
    },
  ],
  [
    { noun: "ownership" },
    { noun: "lack", adj: "lacking", verb: "lack(v)", verb_t: "lack" },
    {
      noun: "possession",
      adj: "owned",
      verb: "possess(v)",
      verb_t: "possess",
      adverb: "possessively",
    },
  ],
  [
    {},
    {},
    {
      noun: "characteristic",
      adj: "intrinsic",
      verb: "is(v)",
      verb_t: "be",
      adverb: "characteristically",
    },
  ],
  [
    { noun: "similarity" },
    {
      noun: "difference",
      adj: "different",
      verb: "differ(v)",
      verb_t: "differ from",
      adverb: "differently",
    },
    { noun: "equality", adj: "same", verb: "equal(v)", verb_t: "equal", adverb: "identically" },
  ],
  [
    { noun: "essentiality" },
    {
      noun: "accident",
      adj: "accidental",
      verb: "become_incidental(v)",
      verb_i: "become incidental",
      verb_t: "make incidental",
      adverb: "accidentally",
    },
    {
      noun: "essence",
      adj: "essential",
      verb: "become_essential(v)",
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
      verb: "become_practical(v)",
      verb_i: "become practical",
      verb_t: "make practical",
      adverb: "pragmatically",
    },
    {
      noun: "idealism",
      adj: "ideal",
      verb: "idealize(v)",
      verb_i: "become idealistic",
      verb_t: "idealize",
      adverb: "ideally",
    },
  ],
  [
    { noun: "hierarchy", notes: "negative verb flatten(v) (no positive verb)" },
    {
      noun: "flatness",
      adj: "flat",
      verb: "flatten(v)",
      verb_i: "flatten",
      verb_t: "flatten",
      adverb: "flatly",
    },
    {
      noun: "nestedness",
      adj: "nested",
      verb: "nest(v)",
      verb_i: "nest",
      verb_t: "embed",
      adverb: "recursively",
    },
  ],
  [
    { noun: "reasoning" },
    {
      noun: "instinct",
      adj: "intuitive",
      verb: "intuit(v)",
      verb_i: "intuit",
      verb_t: "intuit",
      adverb: "intuitively",
    },
    {
      noun: "analysis",
      adj: "analytical",
      verb: "analyze(v)",
      verb_i: "analyze",
      verb_t: "analyze",
      adverb: "analytically",
    },
  ],
  [
    { noun: "predictability", notes: "negative verb randomize(v) (no positive verb)" },
    {
      noun: "randomness",
      adj: "random",
      verb: "randomize(v)",
      verb_i: "become random",
      verb_t: "randomize",
      adverb: "randomly",
    },
    {
      noun: "determinacy",
      adj: "determined",
      verb: "determine(v)",
      verb_i: "become fixed",
      verb_t: "determine",
      adverb: "deterministically",
    },
  ],
  [
    { noun: "measurability" },
    {
      noun: "quality",
      adj: "qualitative",
      verb: "characterize(v)",
      verb_i: "become qualitative",
      verb_t: "characterize",
      adverb: "qualitatively",
    },
    {
      noun: "quantification",
      adj: "quantitative",
      verb: "enumerate(v)",
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
      verb: "linearize(v)",
      verb_i: "straighten",
      verb_t: "linearize",
      adverb: "linearly",
    },
    {
      noun: "cycle",
      adj: "cyclical",
      verb: "curl(v)",
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
      verb: "reduce(v)",
      verb_i: "reduce",
      verb_t: "reduce",
      adverb: "reductively",
    },
    {
      noun: "emergence",
      adj: "holistic",
      verb: "emerge(v)",
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
      verb: "approach(v)",
      verb_i: "approach",
      verb_t: "bring near",
      adverb: "nearby",
    },
    {
      noun: "remoteness",
      adj: "far",
      verb: "distance(v)",
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
      verb: "amplify(v)",
      verb_i: "get louder",
      verb_t: "amplify",
      adverb: "loudly",
    },
    {
      noun: "quietness",
      adj: "quiet",
      verb: "quiet(v)",
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
      verb: "dull(v)",
      verb_i: "become dull",
      verb_t: "dull",
      adverb: "dully",
    },
    {
      noun: "sharpness(state)",
      adj: "sharp",
      verb: "sharpen(v)",
      verb_i: "become sharp",
      verb_t: "sharpen",
      adverb: "sharply",
    },
  ],
  [
    { noun: "moisture", notes: "negative adverb “dryly” needs a positive adverb" },
    { noun: "dryness", adj: "dry", verb: "dry(v)", verb_i: "dry out", verb_t: "dry" },
    { noun: "wetness", adj: "wet", verb: "wet(v)", verb_i: "get wet", verb_t: "wet" },
  ],
  [
    { noun: "thickness" },
    {
      noun: "thinness",
      adj: "thin",
      verb: "thin(v)",
      verb_i: "thin out",
      verb_t: "thin",
      adverb: "thinly",
    },
    {
      noun: "thickness(state)",
      adj: "thick",
      verb: "thicken(v)",
      verb_i: "thicken",
      verb_t: "thicken",
      adverb: "thickly",
    },
  ],
  [
    {
      noun: "elevation",
      notes:
        "negative intransitive verb: to lower oneself / to bow / to crouch / to postrate oneself / to descend; positive intransitive verb: to rise",
    },
    { noun: "deep", adj: "low", verb: "lower(v)", verb_i: "descend", verb_t: "lower" },
    {
      noun: "height",
      adj: "high",
      verb: "lift(v)",
      verb_i: "rise",
      verb_t: "lift",
      adverb: "aloft",
    },
  ],
  [
    {
      noun: "temperature",
      notes: "negative intransitive verb: to get colder; positive intransitive verb: to get warmer",
    },
    {
      noun: "coldness",
      adj: "cold",
      verb: "chill(v)",
      verb_i: "cool down",
      verb_t: "chill",
      adverb: "coldly",
    },
    {
      noun: "heat",
      adj: "hot",
      verb: "heat(v)",
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
      verb: "darken(v)",
      verb_i: "darken",
      verb_t: "darken",
      adverb: "darkly",
    },
    {
      noun: "light",
      adj: "bright",
      verb: "brighten(v)",
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
      verb: "soften(v)",
      verb_i: "soften",
      verb_t: "soften",
      adverb: "softly",
    },
    {
      noun: "hardness",
      adj: "hard",
      verb: "harden(v)",
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
      verb: "lighten(v)",
      verb_i: "get lighter",
      verb_t: "lighten",
      adverb: "lightly",
    },
    {
      noun: "heaviness",
      adj: "heavy",
      verb: "get_heavier(v)",
      verb_i: "get heavier",
      verb_t: "weigh down",
      adverb: "heavily",
    },
  ],
  [
    { noun: "affection" },
    { noun: "hatred", adj: "hateful", verb: "hate(v)", verb_t: "hate", adverb: "hatefully" },
    { noun: "love", adj: "loving", verb: "love(v)", verb_t: "love", adverb: "lovingly" },
  ],
  [
    { noun: "truth" },
    {
      noun: "falsehood",
      adj: "false",
      verb: "falsify(v)",
      verb_i: "turn out false",
      verb_t: "falsify",
      adverb: "falsely",
    },
    {
      noun: "truth(state)",
      adj: "true",
      verb: "prove(v)",
      verb_i: "come true",
      verb_t: "prove",
      adverb: "truly",
    },
  ],
  [
    { noun: "time" },
    { noun: "history", adj: "past", verb: "pass(v)", verb_i: "pass", adverb: "formerly" },
    {
      noun: "futurity",
      adj: "future",
      verb: "postpone(v)",
      verb_t: "postpone",
      adverb: "henceforth",
    },
  ],
  [
    { noun: "contest" },
    { noun: "defeat", adj: "defeated", verb: "lose(v)", verb_i: "lose", verb_t: "lose" },
    {
      noun: "victory",
      adj: "victorious",
      verb: "win(v)",
      verb_i: "win",
      verb_t: "win",
      adverb: "victoriously",
    },
  ],
  [
    { noun: "achievement" },
    {
      noun: "failure",
      adj: "unsuccessful",
      verb: "fail(v)",
      verb_i: "fail",
      verb_t: "botch",
      adverb: "unsuccessfully",
    },
    {
      noun: "success",
      adj: "successful",
      verb: "succeed(v)",
      verb_i: "succeed",
      verb_t: "accomplish",
      adverb: "successfully",
    },
  ],
  [
    {},
    { noun: "consumption", adj: "consuming", verb: "consume(v)", verb_t: "consume" },
    {
      noun: "production",
      adj: "productive",
      verb: "produce(v)",
      verb_t: "produce",
      adverb: "productively",
    },
  ],
  [
    { noun: "trade" },
    { noun: "sale", adj: "sold", verb: "sell(v)", verb_t: "sell" },
    { noun: "purchase", adj: "bought", verb: "buy(v)", verb_i: "shop", verb_t: "buy" },
  ],
  [
    { noun: "transmission", notes: "duplicate of come/go" },
    { noun: "receipt", adj: "received", verb: "receive(v)", verb_t: "receive" },
    { noun: "dispatch", adj: "sent", verb: "send(v)", verb_t: "send" },
  ],
  [
    { noun: "expectation" },
    {
      noun: "fear",
      adj: "fearful",
      verb: "fear(v)",
      verb_i: "be afraid",
      verb_t: "fear",
      adverb: "fearfully",
    },
    {
      noun: "hope",
      adj: "hopeful",
      verb: "hope(v)",
      verb_i: "hope",
      verb_t: "hope for",
      adverb: "hopefully",
    },
  ],
  [
    { noun: "credence", notes: "negative adverb “doubtfully” needs a positive adverb" },
    { noun: "doubt", adj: "doubtful", verb: "doubt(v)", verb_i: "waver", verb_t: "doubt" },
    {
      noun: "belief",
      adj: "believing",
      verb: "believe(v)",
      verb_i: "believe",
      verb_t: "believe",
    },
  ],
  [
    {
      noun: "aliveness",
      notes: "negative intransitive verb: to die; positive intransitive verb: to live",
    },
    { noun: "death", adj: "dead", verb: "kill(v)", verb_i: "die", verb_t: "kill" },
    { noun: "life", adj: "alive", verb: "live(v)", verb_i: "live", verb_t: "bring to life" },
  ],
  [{ notes: "duplicate of come/go in the verb forms?" }, { adverb: "here" }, { adverb: "there" }],
  [
    { notes: "negative intransitive verb: to go inside; positive intransitive verb: to emerge" },
    {
      noun: "inside",
      adj: "inner",
      verb: "ingest(v)",
      verb_i: "enter",
      verb_t: "ingest",
      adverb: "in",
    },
    {
      noun: "outside",
      adj: "outer",
      verb: "eject(v)",
      verb_i: "emerge",
      verb_t: "eject",
      adverb: "out",
    },
  ],
  [
    {},
    {
      noun: "topside",
      adj: "upper",
      verb: "raise(v)",
      verb_i: "rise above",
      verb_t: "raise",
      adverb: "above",
    },
    {
      noun: "underside",
      adj: "lower",
      verb: "sink(v)",
      verb_i: "sink",
      verb_t: "submerge",
      adverb: "below",
    },
  ],
  [
    {},
    {
      adj: "left(side)",
      verb: "veer_left(v)",
      verb_i: "veer left",
      verb_t: "steer left",
      adverb: "leftward",
    },
    {
      adj: "right(side)",
      verb: "veer_right(v)",
      verb_i: "veer right",
      verb_t: "steer right",
      adverb: "rightward",
    },
  ],
  [
    {},
    {
      noun: "descent",
      adj: "downward",
      verb: "go_down(v)",
      verb_i: "go down",
      verb_t: "let down",
      adverb: "down",
    },
    {
      noun: "ascent",
      adj: "upward",
      verb: "hoist(v)",
      verb_i: "go up",
      verb_t: "hoist",
      adverb: "up",
    },
  ],
  [
    { notes: "duplicate of back/front?" },
    {
      noun: "tail",
      adj: "trailing",
      verb: "fall_behind(v)",
      verb_i: "fall behind",
      verb_t: "hold back",
      adverb: "behind",
    },
    {
      noun: "lead",
      adj: "leading",
      verb: "advance(v)",
      verb_i: "advance",
      verb_t: "advance",
      adverb: "ahead",
    },
  ],
  [
    { notes: "duplicate of behind/ahead?" },
    { noun: "stern", adj: "rear", adverb: "aft" },
    { noun: "bow", adj: "forward", adverb: "fore" },
  ],
  [
    {},
    {
      noun: "insertion",
      adj: "inserted",
      verb: "insert(v)",
      verb_i: "penetrate",
      verb_t: "insert",
    },
    {
      noun: "withdrawal",
      adj: "withdrawn",
      verb: "withdraw(v)",
      verb_i: "retreat",
      verb_t: "withdraw",
    },
  ],
  [
    {},
    {
      noun: "service",
      adj: "subservient",
      verb: "serve(v)",
      verb_i: "serve",
      verb_t: "serve",
      adverb: "servilely",
    },
    {
      noun: "authority",
      adj: "in_charge",
      verb: "be_in_command(v)",
      verb_i: "lead",
      verb_t: "direct",
      adverb: "authoritatively",
    },
  ],
  [
    { noun: "prevalence" },
    {
      noun: "uncommonness",
      adj: "uncommon",
      verb: "dwindle(v)",
      verb_i: "dwindle",
      adverb: "uncommonly",
    },
    {
      noun: "commonness",
      adj: "common",
      verb: "spread(v)",
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
      verb: "petrify(v)",
      verb_i: "go still",
      verb_t: "petrify",
    },
    {
      noun: "animation",
      adj: "animate",
      verb: "stir(v)",
      verb_i: "stir",
      verb_t: "animate",
      adverb: "animatedly",
    },
  ],
  [
    { noun: "activity" },
    { noun: "idleness", adj: "idle", verb: "rest(v)", verb_i: "rest", adverb: "idly" },
    {
      noun: "work",
      adj: "busy",
      verb: "work(v)",
      verb_i: "work",
      verb_t: "employ",
      adverb: "busily",
    },
  ],
  [
    { noun: "duration" },
    {
      noun: "transience",
      adj: "fleeting",
      verb: "fade(v)",
      verb_i: "fade",
      adverb: "fleetingly",
    },
    {
      noun: "persistence",
      adj: "persistent",
      verb: "persist(v)",
      verb_i: "persist",
      verb_t: "maintain",
      adverb: "persistently",
    },
  ],
  [
    { notes: "duplicate of low/high? Expressible as max-low and max-high?" },
    {
      noun: "summit",
      adj: "top",
      verb: "peak(v)",
      verb_i: "peak",
      verb_t: "top off",
      adverb: "atop",
    },
    {
      noun: "base",
      adj: "bottom",
      verb: "bottom_out(v)",
      verb_i: "bottom out",
      adverb: "beneath",
    },
  ],
  [
    { noun: "artificiality" },
    {
      noun: "nature",
      adj: "natural",
      verb: "naturalize(v)",
      verb_t: "naturalize",
      adverb: "naturally",
    },
    {
      noun: "artifice",
      adj: "artificial",
      verb: "manufacture(v)",
      verb_t: "manufacture",
      adverb: "artificially",
    },
  ],
  [
    { notes: 'Maybe the opposite of "search" should be "lose"?' },
    {
      noun: "hiding",
      adj: "hidden",
      verb: "hide(v)",
      verb_i: "hide",
      verb_t: "conceal",
      adverb: "secretly",
    },
    {
      noun: "search",
      adj: "searching",
      verb: "search(v)",
      verb_i: "search",
      verb_t: "seek",
      adverb: "searchingly",
    },
  ],
  [
    { noun: "centrality" },
    {
      noun: "center",
      adj: "central",
      verb: "converge(v)",
      verb_i: "converge",
      verb_t: "centralize",
      adverb: "centrally",
    },
    {
      noun: "frontier",
      adj: "peripheral",
      verb: "spread_out(v)",
      verb_i: "spread out",
      adverb: "peripherally",
    },
  ],
  [
    { noun: "awareness" },
    {
      noun: "ignorance",
      adj: "ignorant",
      verb: "ignore(v)",
      verb_t: "ignore",
      adverb: "ignorantly",
    },
    {
      noun: "knowledge",
      adj: "knowledgeable",
      verb: "know(v)",
      verb_t: "know",
      adverb: "knowingly",
    },
  ],
  [
    { noun: "memory" },
    {
      noun: "oblivion",
      adj: "forgotten",
      verb: "forget(v)",
      verb_i: "forget",
      verb_t: "forget",
    },
    { noun: "learning", adj: "learned", verb: "learn(v)", verb_i: "learn", verb_t: "learn" },
  ],
  [
    { noun: "multiplicity", notes: "none - very few - few - some - many - most - all" },
    {
      noun: "paucity",
      adj: "few",
      verb: "diminish(v)",
      verb_i: "dwindle",
      verb_t: "diminish",
      adverb: "sparsely",
    },
    {
      noun: "multitude",
      adj: "many",
      verb: "multiply(v)",
      verb_i: "multiply",
      verb_t: "multiply",
      adverb: "manifold",
    },
  ],
  [{}, { noun: "femininity", adj: "female" }, { noun: "masculinity", adj: "male" }],
  [
    { noun: "alignment" },
    {
      noun: "wonkiness",
      adj: "wonky",
      verb: "warp(v)",
      verb_i: "warp",
      verb_t: "skew",
      adverb: "askew",
    },
    {
      noun: "plumbness",
      adj: "plumb",
      verb: "straighten(v)",
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
      verb: "worsen(v)",
      verb_i: "worsen",
      verb_t: "worsen",
      adverb: "badly",
    },
    {
      noun: "goodness",
      adj: "good",
      verb: "improve(v)",
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
      verb: "torment(v)",
      verb_i: "suffer",
      verb_t: "torment",
      adverb: "painfully",
    },
    {
      noun: "pleasure",
      adj: "fun",
      verb: "entertain(v)",
      verb_i: "enjoy oneself",
      verb_t: "entertain",
      adverb: "pleasantly",
    },
  ],
  [
    {
      noun: "appetite",
      notes: "axis.csv also had revulsion / desire; positive verb forms: to desire",
    },
    { noun: "abhorrence", adj: "abhorrent", verb: "abhor(v)", verb_t: "abhor" },
    { noun: "desire", adj: "desirable", verb: "desire(v)", verb_t: "desire", adverb: "eagerly" },
  ],
  [
    { noun: "substance" },
    {
      noun: "immateriality",
      adj: "immaterial",
      verb: "dissolve(v)",
      verb_i: "dissolve",
      verb_t: "dematerialize",
      adverb: "immaterially",
    },
    {
      noun: "physical_stuff",
      adj: "material",
      verb: "materialize(v)",
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
      verb: "hinder(v)",
      verb_t: "hinder",
      adverb: "with_difficulty",
    },
    {
      noun: "ease",
      adj: "easy",
      verb: "enable(v)",
      verb_i: "ease up",
      verb_t: "enable",
      adverb: "easily",
    },
  ],
  [
    {},
    { noun: "back_side", adj: "back", adverb: "at_the_back" },
    { noun: "front_side", adj: "front", verb: "face(v)", verb_t: "face", adverb: "in_front" },
  ],
  [
    { noun: "cultivation" },
    { noun: "harvest", adj: "reaped", verb: "reap(v)", verb_t: "reap" },
    { noun: "sowing", adj: "sown", verb: "sow(v)", verb_t: "sow" },
  ],
  [
    { noun: "frequency", notes: "negative verb “normalize / normalize” needs a positive verb" },
    { noun: "normality", adj: "normal", adverb: "normally" },
    { noun: "rarity", adj: "rare", adverb: "rarely" },
  ],
  [
    { noun: "curvature", notes: "negative verb round(v) (no positive verb)" },
    { noun: "roundness", adj: "round", verb: "round(v)", verb_t: "round", adverb: "roundly" },
    {
      noun: "angularity",
      adj: "angle",
      verb: "angle(v)",
      verb_t: "angle",
      adverb: "angularly",
    },
  ],
  [
    { noun: "age" },
    { noun: "oldness", adj: "old", verb: "age(v)", verb_i: "age", verb_t: "age" },
    {
      noun: "newness",
      adj: "new",
      verb: "rejuvenate(v)",
      verb_i: "renew",
      verb_t: "rejuvenate",
      adverb: "newly",
    },
  ],
  [
    { notes: "negative verb forms: take; positive verb forms: give" },
    { noun: "taking", adj: "taken", verb: "take(v)", verb_t: "take" },
    { noun: "gift", adj: "given", verb: "give(v)", verb_t: "give", adverb: "generously" },
  ],
  [
    {
      noun: "consciousness",
      notes: "negative verb forms: sleep; negative adverb “sleepily” needs a positive adverb",
    },
    { noun: "sleep", adj: "asleep", verb: "sleep(v)", verb_i: "sleep", verb_t: "put to sleep" },
    { noun: "wakefulness", adj: "awake", verb: "wake(v)", verb_i: "wake", verb_t: "wake" },
  ],
  [
    { noun: "extent" },
    {
      noun: "shortness",
      adj: "short",
      verb: "shorten(v)",
      verb_i: "shorten",
      verb_t: "shorten",
      adverb: "briefly",
    },
    {
      noun: "length",
      adj: "long",
      verb: "lengthen(v)",
      verb_i: "lengthen",
      verb_t: "lengthen",
      adverb: "lengthily",
    },
  ],
  [
    { noun: "breadth" },
    {
      noun: "narrowness",
      adj: "narrow",
      verb: "narrow(v)",
      verb_i: "narrow",
      verb_t: "narrow",
      adverb: "narrowly",
    },
    {
      noun: "width",
      adj: "wide",
      verb: "widen(v)",
      verb_i: "widen",
      verb_t: "widen",
      adverb: "widely",
    },
  ],
  [
    { notes: "negative verb internalize(v) (no positive verb)" },
    { noun: "interior", adj: "inward", adverb: "inwardly" },
    { noun: "surface", adj: "superficial", adverb: "superficially" },
  ],
  [
    { notes: "positive verb forms: to create; to self-actualize? / to become" },
    {
      noun: "destruction",
      adj: "destructive",
      verb: "destroy(v)",
      verb_i: "perish",
      verb_t: "destroy",
      adverb: "destructively",
    },
    {
      noun: "creation",
      adj: "creative",
      verb: "create(v)",
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
      verb: "uglify(v)",
      verb_i: "become ugly",
      verb_t: "uglify",
      adverb: "hideously",
    },
    {
      noun: "beauty",
      adj: "beautiful",
      verb: "beautify(v)",
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
      noun: "departure",
      adj: "incoming",
      verb: "come(v)",
      verb_i: "come",
      verb_t: "bring",
      adverb: "hither",
    },
    {
      noun: "arrival",
      adj: "outgoing",
      verb: "go(v)",
      verb_i: "go",
      verb_t: "take away",
      adverb: "away",
    },
  ],
  [
    { notes: "hole - flat - mound / to dig - to flatten - to heap" },
    { noun: "hole", adj: "hollow", verb: "dig(v)", verb_t: "dig" },
    { noun: "mound", adj: "heaped", verb: "heap_up(v)", verb_i: "pile up", verb_t: "heap up" },
  ],
  [
    { noun: "capacity", notes: "also fill(v); negative verb empty(v) (no positive verb)" },
    {
      noun: "emptiness",
      adj: "empty",
      verb: "empty(v)",
      verb_i: "empty out",
      verb_t: "empty",
      adverb: "emptily",
    },
    {
      noun: "fullness",
      adj: "full",
      verb: "fill_up(v)",
      verb_i: "fill up",
      verb_t: "fill",
      adverb: "fully",
    },
  ],
  [
    {
      noun: "visibility",
      notes:
        "negative verb forms: to disguise / to encrypt; positive verb forms: to show / to demonstrate; to appear",
    },
    {
      noun: "disguise",
      adj: "disguised",
      verb: "disguise(v)",
      verb_t: "disguise",
      adverb: "covertly",
    },
    {
      noun: "demonstration",
      adj: "visible",
      verb: "show(v)",
      verb_i: "appear",
      verb_t: "show",
      adverb: "visibly",
    },
  ],
  [
    {},
    {
      noun: "war",
      adj: "warlike",
      verb: "fight(v)",
      verb_i: "fight",
      verb_t: "fight",
      adverb: "belligerently",
    },
    {
      noun: "peace",
      adj: "peaceful",
      verb: "make_peace(v)",
      verb_i: "make peace",
      verb_t: "pacify",
      adverb: "peacefully",
    },
  ],
  [
    {},
    {
      noun: "deflation",
      adj: "deflated",
      verb: "deflate(v)",
      verb_i: "collapse",
      verb_t: "deflate",
    },
    {
      noun: "inflation",
      adj: "inflated",
      verb: "inflate(v)",
      verb_i: "swell",
      verb_t: "inflate",
    },
  ],
  [
    { noun: "scope(inclusion)" },
    {
      noun: "exclusion",
      adj: "exclusive",
      verb: "exclude(v)",
      verb_t: "exclude",
      adverb: "exclusively",
    },
    {
      noun: "inclusion",
      adj: "inclusive",
      verb: "include(v)",
      verb_t: "include",
      adverb: "inclusively",
    },
  ],
  [
    { noun: "intellect" },
    {
      noun: "stupidity",
      adj: "stupid",
      verb: "stupefy(v)",
      verb_t: "stupefy",
      adverb: "stupidly",
    },
    {
      noun: "intelligence",
      adj: "smart",
      verb: "educate(v)",
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
      verb: "veer(v)",
      verb_i: "veer",
      verb_t: "slant",
      adverb: "obliquely",
    },
    { noun: "directness", adj: "direct", verb: "aim(v)", verb_t: "aim", adverb: "directly" },
  ],
  [
    { noun: "magnetism" },
    {
      noun: "repulsion",
      adj: "repellent",
      verb: "repel(v)",
      verb_t: "repel",
      adverb: "repulsively",
    },
    {
      noun: "attraction",
      adj: "attractive",
      verb: "attract(v)",
      verb_t: "attract",
      adverb: "attractively",
    },
  ],
  [
    {
      noun: "cohesion",
      notes:
        "There's some relationship between break - mend, part - whole, and divide - group. I'm not yet sure what it is.; negative verb forms: to divide / to partition; positive verb forms: to gather / to group / to collect",
    },
    {
      noun: "division",
      adj: "atomized",
      verb: "divide(v)",
      verb_i: "split",
      verb_t: "divide",
      adverb: "separately",
    },
    {
      noun: "group",
      adj: "united",
      verb: "group(v)",
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
      verb: "cheapen(v)",
      verb_t: "cheapen",
      adverb: "cheaply",
    },
    {
      noun: "expense",
      adj: "expensive",
      verb: "mark_up(v)",
      verb_t: "mark up",
      adverb: "expensively",
    },
  ],
  [
    {},
    {
      noun: "attack",
      adj: "offensive",
      verb: "attack(v)",
      verb_t: "attack",
      adverb: "offensively",
    },
    {
      noun: "defense",
      adj: "defensive",
      verb: "defend(v)",
      verb_t: "defend",
      adverb: "defensively",
    },
  ],
  [
    { noun: "care" },
    {
      noun: "neglect",
      adj: "neglected",
      verb: "neglect(v)",
      verb_t: "neglect",
      adverb: "negligently",
    },
    {
      noun: "stewardship",
      adj: "tended",
      verb: "steward(v)",
      verb_t: "tend",
      adverb: "carefully",
    },
  ],
  [
    { noun: "significance" },
    {
      noun: "triviality",
      adj: "unimportant",
      verb: "trivialize(v)",
      verb_t: "trivialize",
      adverb: "trivially",
    },
    {
      noun: "importance",
      adj: "important",
      verb: "matter(v)",
      verb_i: "matter",
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
    { noun: "breakage", adj: "broken", verb: "break(v)", verb_i: "break", verb_t: "break" },
    { noun: "repair", adj: "intact", verb: "mend(v)", verb_i: "heal", verb_t: "mend" },
  ],
  [
    {
      noun: "entirety",
      notes:
        "There's some relationship between break - mend, part - whole, and divide - group. I'm not yet sure what it is.",
    },
    {
      noun: "part",
      adj: "partial",
      verb: "partition(v)",
      verb_t: "partition",
      adverb: "partly",
    },
    { noun: "whole", adj: "entire", verb: "unify(v)", verb_t: "unify", adverb: "wholly" },
  ],
  [
    { noun: "lineage", notes: "ancestor - parent - ? - child - descendent" },
    { noun: "ancestor", adj: "ancestral" },
    { noun: "descendant", adj: "descended" },
  ],
  [
    {
      noun: "restraint",
      notes:
        '"free" is already the positive adjective of the coercion axis; negative adverb “unrestrainedly” needs a positive adverb',
    },
    { noun: "liberty", adj: "free(unbound)", verb: "liberate(v)", verb_t: "liberate" },
    { noun: "bondage", adj: "bound", verb: "constrain(v)", verb_t: "constrain" },
  ],
  [
    { noun: "holiness" },
    {
      noun: "profanity",
      adj: "profane",
      verb: "desecrate(v)",
      verb_t: "desecrate",
      adverb: "profanely",
    },
    {
      noun: "sanctity",
      adj: "sacred",
      verb: "sanctify(v)",
      verb_t: "sanctify",
      adverb: "sacredly",
    },
  ],
  [
    { notes: "axis name “latitude” needs a positive noun" },
    { adj: "south", adverb: "southward" },
    { adj: "north", adverb: "northward" },
  ],
  [
    { notes: "axis name “longitude” needs a positive noun" },
    { adj: "west", adverb: "westward" },
    { adj: "east", adverb: "eastward" },
  ],
  [
    {
      notes:
        "negative verb forms: to obey; positive verb forms: to command / to rule / to govern; negative adverb “obediently” needs a positive adverb",
    },
    { noun: "obedience", adj: "obedient", verb: "obey(v)", verb_i: "obey", verb_t: "obey" },
    { noun: "command", adj: "commanding", verb: "command(v)", verb_t: "command" },
  ],
  [
    {
      noun: "compliance",
      notes:
        "negative verb forms: to conduct / to submit; positive verb forms: to resist / to thwart; negative adverb “submissively” needs a positive adverb",
    },
    {
      noun: "submission",
      adj: "submissive",
      verb: "submit(v)",
      verb_i: "submit",
      verb_t: "subdue",
    },
    {
      noun: "resistance",
      adj: "resistant",
      verb: "resist(v)",
      verb_i: "resist",
      verb_t: "resist",
    },
  ],
  [
    {
      notes:
        "negative verb forms: to release; positive verb forms: to contain; also container; negative noun liberator (no positive noun)",
    },
    { noun: "release", adj: "released", verb: "release(v)", verb_t: "release" },
    { noun: "containment", adj: "contained", verb: "contain(v)", verb_t: "contain" },
  ],
  [
    { noun: "consistency", notes: "exception - irregular - ? - regular - exemplar" },
    {
      noun: "irregularity",
      adj: "irregular",
      verb: "irregulate(v)",
      verb_t: "disrupt",
      adverb: "irregularly",
    },
    {
      noun: "regularity",
      adj: "regular",
      verb: "regulate(v)",
      verb_t: "regulate",
      adverb: "regularly",
    },
  ],
  [
    { noun: "fortitude", notes: "Are these fundamental enough?" },
    { noun: "vulnerability", adj: "vulnerable", verb: "succumb(v)", verb_i: "succumb" },
    {
      noun: "resilience",
      adj: "resilient",
      verb: "withstand(v)",
      verb_i: "endure",
      verb_t: "withstand",
      adverb: "resiliently",
    },
  ],
  [
    {
      noun: "connectivity",
      notes:
        'nouns: cyclic graph - dag - tree - list - node / alternatively, maybe it is better to have a "node" and use magnitude to raise it to list, tree, dag, cyclic graph; negative verb forms: to connect; positive verb forms: to disconnect',
    },
    { noun: "connection", adj: "connected", verb: "connect(v)", verb_t: "connect" },
    { noun: "disconnection", adj: "disconnected", verb: "disconnect(v)", verb_t: "disconnect" },
  ],
  [
    { notes: "axis.csv had allow / force" },
    {
      noun: "permission",
      adj: "permitted",
      verb: "allow(v)",
      verb_t: "allow",
      adverb: "permissively",
    },
    {
      noun: "compulsion",
      adj: "compulsory",
      verb: "compel(v)",
      verb_t: "compel",
      adverb: "compulsorily",
    },
  ],
  [
    { noun: "involvement" },
    { noun: "abstention", adj: "abstinent", verb: "abstain(v)", verb_i: "abstain" },
    {
      noun: "participation",
      adj: "participating",
      verb: "participate(v)",
      verb_i: "participate",
    },
  ],
  [
    {},
    { noun: "start", adj: "started", verb: "start(v)", verb_i: "start", verb_t: "start" },
    { noun: "stop", adj: "stopped", verb: "stop(v)", verb_i: "stop", verb_t: "stop" },
  ],
  [
    { noun: "obligation", notes: "axis.csv had privilege, right / obligation, duty" },
    { noun: "privilege", adj: "privileged", verb: "entitle(v)", verb_t: "entitle" },
    {
      noun: "duty",
      adj: "dutiful",
      verb: "obligate(v)",
      verb_t: "obligate",
      adverb: "dutifully",
    },
  ],
  [
    { noun: "permissibility" },
    { noun: "prohibition", adj: "forbidden", verb: "forbid(v)", verb_t: "forbid" },
    { noun: "recommendation", adj: "recommended", verb: "recommend(v)", verb_t: "recommend" },
  ],
];

// Grammar markers, which are also domain words: they mark the role of what follows and its noun
// or verb form. The adjective and adverb forms come from position instead (a modifier trailing a
// noun or verb).
{
  section("marker");
  const marker: Tag[] = [T.grammar_helper, T.part_of_speech_specifier, T.domain_specifier];
  const verb_marker: Tag[] = [...marker, T.verb_specifier];
  cr("_subject", { t: marker });
  cr("_object", { t: marker });
  cr("_verb", { t: verb_marker });
  cr("_verb(prescriptive)", { t: verb_marker, gloss: "verb (prescriptive / imperative)" });
  cr("_verb(interrogative)", { t: verb_marker });
  cr("_gerund", { t: verb_marker });
}

{
  section("grammar");
  cr("not", {
    t: [T.grammar_helper],
    gloss: "complement / negative / not",
    notes: "Complement: use for axis words",
  });
  cr("and", { t: [T.grammar_helper] });
  cr("or", { t: [T.grammar_helper], notes: '"xor" through "or-exclusive"' });
  cr("if", { t: [T.grammar_helper], notes: '"iff" through "if-exclusive"' });
  cr("_er", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "the subject of a verb, as a noun: _er eat = eater",
    notes: 'Was "subject of (verb)"',
  });
  cr("_ee", {
    t: [T.grammar_helper, T.part_of_speech_specifier],
    gloss: "the object of a verb, as a noun: _ee eat = what is eaten",
    notes: 'Was "object of (verb)"',
  });

  candidate("open_paren", { gloss: "clause start" });
  candidate("close_paren", { gloss: "clause end" });
  candidate("preposition_ender", {
    notes: "Closes a prepositional phrase: <in> value and privilege </in>",
  });
  candidate("clause_and", { notes: "And between clauses, as opposed to list_and" });
  candidate("list_and", { notes: "And between list items, as opposed to clause_and" });
  candidate("foreign_word", { gloss: "foreign word or name" });
  candidate("possession_indicator");
  candidate("_become", {
    gloss: "come to, begin to: _become possess(v) = gain",
    notes:
      'Like Toki Pona\'s "kama jo" (come to have = get). Not sure yet whether this should be a helper',
  });
}

{
  section("preposition");
  cr("with", {
    t: [T.preposition],
    notes: 'Is it worth splitting this into "instrumentality" and "comingling"?',
  });
  cr("to", { t: [T.preposition] });
  cr("from", { t: [T.preposition] });
  cr("by", { t: [T.preposition] });
  cr("for", {
    t: [T.preposition],
    notes: 'Is it worth splitting this into "on behalf of" and "for the purpose of"?',
  });
  cr("in_of_about", {
    t: [T.preposition],
    gloss: "in / of / about / with regards to / in terms of",
  });
}

{
  section("pronoun");
  cr("pronoun(first_person)", {
    t: [T.pronoun],
    notes:
      '"me" through "first_person-singular", "we" through "first_person-plural"; also "first_person-plural-inclusive" and "first_person-plural-exclusive"',
  });
  cr("pronoun(second_person)", {
    t: [T.pronoun],
    notes: '"you" through "second_person-singular", "y\'all" through "second_person-plural"',
  });
  cr("pronoun(third_person)", {
    t: [T.pronoun],
    notes: "Plural and gender/sex can be specified optionally",
  });
  cr("this", { t: [T.pronoun], notes: 'Could this be "it-near"?' });
  cr("that", { t: [T.pronoun], notes: 'Could this be "it-far"?' });
  cr("_blank", {
    t: [T.pronoun],
    gloss: "what a question asks about",
    notes:
      "Was interrogative_blank. With _verb(interrogative): <subject> soldier <verb (interrogative)> kill <object> _blank = who does the soldier kill?",
  });
}

// axis helpers: axis_of plus a seven-step scale
{
  section("axis_helper");
  cr("axis_of", { t: [T.axis_helper] });
  cr("max_negative", { t: [T.axis_helper] });
  cr("negative", { t: [T.axis_helper], notes: 'Also called "very-neg"' });
  cr("min_negative", { t: [T.axis_helper], gloss: "minor negative" });
  cr("neutral", { t: [T.axis_helper] });
  cr("min_positive", { t: [T.axis_helper], gloss: "minor positive" });
  cr("positive", { t: [T.axis_helper], notes: 'Also called "very-pos"' });
  cr("max_positive", { t: [T.axis_helper] });
}

{
  section("content");
  cr("singular");
  cr("plural");
  cr("land");
  cr("wall");
  cr("rod");
  cr("person");
  cr("saying");
  cr("feel", { gloss: "feel / sense" });
  cr("money");
  cr("place");
  cr("container");
  cr("mouth");
  cr("use");
  cr("rock");
  cr("attach");
  cr("path");
  cr("sound");
  cr("touch");
  cr("do");
  cr("body", { gloss: "body / organ" });
  cr("mark");
  cr("symbol");
  cr("hand");
  cr("finger");
  cr("feet");
  cr("head");
  cr("torso");
  cr("arm");
  cr("leg");
  cr("number", {
    t: [T.domain_specifier],
    notes: "For now, also marks the number domain: what follows reads roots 128-255 as digits",
  });

  candidate("magnitude", {
    notes:
      "Scales a number like scientific notation: finger number 2 magnitude 3 is 2000. Takes one argument. Base-agnostic",
  });
  candidate("color");
  candidate("finger_number", { gloss: "number (base 10)", notes: "Partial domain" });
  candidate("simple_number", { gloss: "number (base 2)", notes: "Partial domain" });

  candidate("prehensile?");
  candidate("information", { gloss: "information / data" });
  candidate("net", { gloss: "net / graph" });
  candidate("image", { gloss: "image / projection" });
  candidate("simulation", { gloss: "simulation / model" });
  candidate("original");
  candidate("un-", { notes: "?" });
  candidate("re-", { notes: "?" });
  candidate("meta-", { notes: 'Can this be achieved with "magnitude"?' });
  candidate("mind");
  candidate("machine");
  candidate("node", {
    notes:
      'Use "magnitude" to lift "node" to list, tree, dag, cyclic graph. The downside is that it takes 3 syllables to say each of those',
  });
  candidate("sex");
  candidate("choose");
  candidate("turn");
  candidate("direction", {
    notes:
      "Should this be a domain specifier? up - down, forward - back, left - right, north - south, east - west, in - out, future - past",
  });
  candidate("shape");
  candidate("count");
  candidate("earth");
  candidate("sun");
  candidate("moon");
  candidate("star");
  candidate("planet");
  candidate("hour");
  candidate("minute");
  candidate("second");
  candidate("week");
  candidate("month");
  candidate("year");
  candidate("exchange", { notes: "Maybe possible on a buy/sell spectrum" });
  candidate("value");

  // Groups of related concepts
  for (const group of [
    ["plasma", "gas", "liquid", "solid"],
    ["number", "symbol"],
    ["thing"],
    ["width", "height", "depth"], // height and width are nouns of the low/high and narrow/wide axes
    ["yellow", "red", "blue"],
    ["sound", "taste", "touch"],
    ["animal", "plant", "fungus"],
  ]) {
    for (const word of group) {
      if (dictionary.has(word) || word === "height" || word === "width") continue; // already a word
      candidate(word, group.length > 1 ? { notes: `Group: ${group.join(", ")}` } : {});
    }
  }
}

// digits: the number domain reuses the last 128 IDs
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
  notes?: string;
};

export const axes: Axis[] = [];
export const axis_by_word = new Map<Word, Axis>();

// Axis verbs by their English glosses, like "die" and "kill", for looking up words by meaning
export const verb_glosses = new Map<string, Word>();

const AXIS_FORMS = [
  ["adj", "adjective"],
  ["noun", "noun"],
  ["verb", "verb"],
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
  word.data.gloss = [
    intransitive && `${intransitive} (without an object)`,
    transitive && `${transitive} (with an object)`,
  ]
    .filter(is_defined)
    .filter(Boolean)
    .join(" / ");
  for (const gloss of [intransitive, transitive]) {
    const key = gloss?.replace(/\s+/g, "_");
    if (key && !verb_glosses.has(key)) verb_glosses.set(key, word);
  }
}

{
  section("axis");

  const axis_of_word = dictionary.get("axis_of");
  const negative_word = dictionary.get("negative");
  const positive_word = dictionary.get("positive");
  const max_negative_word = dictionary.get("max_negative");
  const min_negative_word = dictionary.get("min_negative");
  const neutral_word = dictionary.get("neutral");
  const min_positive_word = dictionary.get("min_positive");
  const max_positive_word = dictionary.get("max_positive");

  if (!is_defined(axis_of_word)) throw new Error(`Missing axis_of word`);
  if (!is_defined(negative_word)) throw new Error(`Missing negative word`);
  if (!is_defined(positive_word)) throw new Error(`Missing positive word`);
  if (!is_defined(max_negative_word)) throw new Error(`Missing max_negative word`);
  if (!is_defined(min_negative_word)) throw new Error(`Missing min_negative word`);
  if (!is_defined(neutral_word)) throw new Error(`Missing neutral word`);
  if (!is_defined(min_positive_word)) throw new Error(`Missing min_positive word`);
  if (!is_defined(max_positive_word)) throw new Error(`Missing max_positive word`);

  function positive_of(positive: Word | undefined, word: string): Word {
    if (!is_defined(positive)) throw new Error(`Axis word ${word} has no positive counterpart`);
    return positive;
  }

  for (const [axis, negative, positive] of axis_words_config) {
    const id = root_index++;
    const entry: Axis = {
      id,
      name: {},
      positive: empty_side(),
      negative: empty_side(),
      notes: axis.notes,
    };
    const positive_words: Partial<Record<FormKey, Word>> = {};

    for (const [key, domain] of AXIS_FORMS) {
      const name = positive[key];
      if (!name) continue;
      const word = cr(name, { t: [T.axis_word], domain, id });
      positive_words[key] = word;
      fill_cells(entry.positive, key, word, positive);
    }
    for (const [key, domain] of AXIS_FORMS) {
      const name = negative[key];
      if (!name) continue;
      const parts = [negative_word, positive_of(positive_words[key], name)];
      const word = cw(name, { t: [T.axis_word], domain, parts });
      fill_cells(entry.negative, key, word, negative);
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
        positive_words.adj ?? positive_words.noun ?? positive_words.verb ?? positive_words.adverb;
      if (first) first.data.notes = axis.notes;
    }

    axes.push(entry);
    for (const cell of [
      entry.name,
      ...Object.values(entry.positive),
      ...Object.values(entry.negative),
    ]) {
      if (cell.word) axis_by_word.set(cell.word, entry);
    }
  }
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

export const words = Array.from(dictionary.values());

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
