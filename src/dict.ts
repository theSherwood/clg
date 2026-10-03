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
  verb?: string;
  adverb?: string;
  notes?: string;
};

// [axis, negative, positive]
const axis_words_config: [AxisWordForms, AxisWordForms, AxisWordForms][] = [
  [
    {
      noun: "size",
      notes:
        "From axis.csv: positive noun giant; positive verb to grow something (transitive), to grow (intransitive)",
    },
    { adj: "small", noun: "smallness", verb: "shrink(v)", adverb: "slightly" },
    { adj: "big", noun: "bigness", verb: "grow(v)", adverb: "hugely" },
  ],
  [
    { noun: "speed", notes: "From axis.csv: positive verb to accelerate (transitive)" },
    { adj: "slow", noun: "slowness", verb: "decelerate(v)", adverb: "slowly" },
    { adj: "fast", noun: "fastness", verb: "accelerate(v)", adverb: "quickly" },
  ],
  [
    {
      noun: "adaptability",
      notes: "From axis.csv (as dynamism: static / dynamic): positive verb change? (transitive)",
    },
    { adj: "static", noun: "stability", verb: "stabilize(v)", adverb: "statically" },
    { adj: "dynamic", noun: "dynamism", verb: "adapt(v)", adverb: "dynamically" },
  ],
  [
    { noun: "complexity(axis)", notes: "From axis.csv: positive verb simplify (transitive)" },
    { adj: "complex", noun: "complexity(state)", verb: "complicate(v)", adverb: "complexly" },
    { adj: "simple", noun: "simplicity", verb: "simplify(v)", adverb: "simply" },
  ],
  [
    { noun: "strength(axis)", notes: "From axis.csv: positive verb strengthen (transitive)" },
    { adj: "weak", noun: "weakness", verb: "weaken(v)", adverb: "weakly" },
    { adj: "strong", noun: "strength(state)", verb: "strengthen(v)", adverb: "strongly" },
  ],
  [
    {
      noun: "quantity",
      notes:
        "From axis.csv (as quantity?): negative noun poverty, negative verb to decrease (transitive); positive noun abundance, positive verb to increase (transitive)",
    },
    { adj: "less", noun: "scarcity", verb: "decrease(v)", adverb: "barely" },
    { adj: "more", noun: "abundance", verb: "increase(v)", adverb: "abundantly" },
  ],
  [
    {
      noun: "orderliness",
      notes:
        "From axis.csv (as orderliness?: chaos / order): positive noun order, positive verb organize (transitive), positive adjective organized",
    },
    { adj: "chaotic", noun: "chaos", verb: "disorganize(v)", adverb: "chaotically" },
    { adj: "organized", noun: "order", verb: "organize(v)", adverb: "orderly" },
  ],
  [
    { noun: "initiative", notes: "From axis.csv (as passivity?: passive / agentic)" },
    { adj: "passive", noun: "passivity", verb: "lull(v)", adverb: "passively" },
    { adj: "agentic", noun: "agency", verb: "act(v)", adverb: "agentically" },
  ],
  [
    {
      noun: "continuity",
      notes: "From axis.csv: positive verb discretize (transitive); positive adjective discrete?",
    },
    { adj: "continuous", noun: "continuum", verb: "smear(v)", adverb: "continuously" },
    { adj: "discrete", noun: "discreteness", verb: "demarcate(v)", adverb: "choppily" },
  ],
  [
    { noun: "completeness" },
    { adj: "none", noun: "nothingness", verb: "erase(v)", adverb: "none(adverb)" },
    { adj: "all", noun: "everything", verb: "fill(v)", adverb: "completely" },
  ],
  [
    { noun: "openness(axis)", notes: "From axis.csv: positive verb to open (transitive)" },
    { adj: "closed", noun: "closure", verb: "close(v)", adverb: "tightly" },
    { adj: "open", noun: "openness(state)", verb: "open(v)", adverb: "loosely" },
  ],
  [
    {
      noun: "granularity",
      notes: "From axis.csv (as rough / smooth): positive verb to smooth (transitive)",
    },
    { adj: "coarse", noun: "coarseness", verb: "roughen(v)", adverb: "roughly" },
    { adj: "smooth", noun: "smoothness", verb: "smooth(v)", adverb: "smoothly" },
  ],
  [
    {
      noun: "coercion(axis)",
      notes:
        "From axis.csv (as force / choose): positive verb choose? (transitive); positive adjective selected",
    },
    { adj: "forced", noun: "coercion(state)", verb: "force(v)", adverb: "under_duress" },
    { adj: "free", noun: "freedom", verb: "free(v)", adverb: "freely" },
  ],
  [
    {
      noun: "abstraction(axis)",
      notes:
        "From axis.csv: positive noun abstraction, positive verb generalize (transitive), positive adjective general",
    },
    { adj: "concrete", noun: "concreteness", verb: "reify(v)", adverb: "concretely" },
    { adj: "abstract", noun: "abstraction(state)", verb: "abstract(v)", adverb: "in_general" },
  ],
  [
    { noun: "relativity(axis)", notes: "Overlap with concrete/abstract" },
    { adj: "relative", noun: "relativity(state)", verb: "", adverb: "relatively" },
    { adj: "absolute", noun: "absolute(state)", verb: "", adverb: "absolutely" },
  ],
  [
    { noun: "rigidity(axis)" },
    { adj: "rigid", noun: "rigidity(state)", verb: "stiffen(v)", adverb: "stiffly" },
    { adj: "fluid", noun: "fluidity", verb: "flow(v)", adverb: "fluidly" },
  ],
  [
    { noun: "explicitness(axis)" },
    { adj: "implicit", noun: "implicitness", verb: "imply(v)", adverb: "implicitly" },
    {
      adj: "explicit",
      noun: "explicitness(state)",
      verb: "make_explicit(v)",
      adverb: "explicitly",
    },
  ],
  [
    { noun: "internality(axis)", notes: "Duplicate of in/out" },
    { adj: "internal", noun: "internality(state)", verb: "internalize(v)", adverb: "internally" },
    { adj: "external", noun: "externality", verb: "externalize(v)", adverb: "externally" },
  ],
  [
    { noun: "finiteness(axis)" },
    { adj: "finite", noun: "finitude(state)", verb: "", adverb: "finitely" },
    { adj: "infinite", noun: "infinity", verb: "", adverb: "infinitely" },
  ],
  [{}, {}, { noun: "possession", verb: "possess(v)", adverb: "possessively" }],
  [
    {},
    {},
    { adj: "intrinsic", noun: "characteristic", verb: "is(v)", adverb: "characteristically" },
  ],
  [
    {},
    { adj: "different", noun: "difference", verb: "differ(v)", adverb: "differently" },
    { adj: "same", noun: "equality", verb: "equal(v)", adverb: "identically" },
  ],
  [{}, { adj: "accidental" }, { adj: "essential" }],
  [{}, { adj: "pragmatic" }, { adj: "ideal" }],
  [{ notes: "negative verb flatten(v) (no positive verb)" }, { adj: "flat" }, { adj: "nested" }],
  [
    {},
    { adj: "intuitive", noun: "instinct", verb: "intuit(v)" },
    { adj: "analytical", noun: "analysis", verb: "analyze(v)" },
  ],
  [
    { notes: "negative verb randomize(v) (no positive verb)" },
    { adj: "random" },
    { adj: "determined" },
  ],
  [{}, { adj: "qualitative" }, { adj: "quantitative", verb: "enumerate(v)" }],
  [
    {},
    { adj: "linear", noun: "line", verb: "linearize(v)" },
    { adj: "cyclical", noun: "cycle", verb: "curl(v)" },
  ],
  [{}, { adj: "reductionist", noun: "reduction" }, { adj: "holistic", noun: "emergence" }],
  [{}, { adj: "near" }, { adj: "far" }],
  [{}, { adj: "loud" }, { adj: "quiet" }],
  [
    {
      notes:
        "negative intransitive verb: to become dull; positive intransitive verb: to become sharp",
    },
    { adj: "dull", verb: "dull(v)" },
    { adj: "sharp", verb: "sharpen(v)" },
  ],
  [{}, { adj: "dry" }, { adj: "wet" }],
  [{}, { adj: "thin" }, { adj: "thick" }],
  [
    {
      notes:
        "negative intransitive verb: to lower oneself / to bow / to crouch / to postrate oneself / to descend; positive intransitive verb: to rise",
    },
    { adj: "low", noun: "deep", verb: "lower(v)" },
    { adj: "high", noun: "height", verb: "lift(v)" },
  ],
  [
    {
      notes: "negative intransitive verb: to get colder; positive intransitive verb: to get warmer",
    },
    { adj: "cold", verb: "chill(v)" },
    { adj: "hot", verb: "heat(v)" },
  ],
  [
    {},
    { adj: "dark", noun: "darkness", verb: "darken(v)" },
    { adj: "bright", noun: "light", verb: "brighten(v)" },
  ],
  [{}, { adj: "soft" }, { adj: "hard" }],
  [{}, { adj: "light(weight)" }, { adj: "heavy" }],
  [{}, { verb: "hate(v)" }, { verb: "love(v)" }],
  [{}, { adj: "false" }, { adj: "true" }],
  [{}, { adj: "past" }, { adj: "future" }],
  [{}, { verb: "lose(v)" }, { verb: "win(v)" }],
  [{}, { verb: "fail(v)" }, { verb: "succeed(v)" }],
  [{}, { verb: "consume(v)" }, { verb: "produce(v)" }],
  [{}, { verb: "sell(v)" }, { verb: "buy(v)" }],
  [{ notes: "duplicate of come/go" }, { verb: "receive(v)" }, { verb: "send(v)" }],
  [{}, { verb: "fear(v)" }, { verb: "hope(v)" }],
  [{}, { verb: "doubt(v)" }, { verb: "believe(v)" }],
  [
    { notes: "negative intransitive verb: to die; positive intransitive verb: to live" },
    { adj: "dead", verb: "kill(v)" },
    { adj: "alive", verb: "make_alive(v)" },
  ],
  [{ notes: "duplicate of come/go in the verb forms?" }, { adverb: "here" }, { adverb: "there" }],
  [
    { notes: "negative intransitive verb: to go inside; positive intransitive verb: to emerge" },
    { verb: "ingest(v)", adverb: "in" },
    { verb: "eject(v)", adverb: "out" },
  ],
  [{}, { adverb: "above" }, { adverb: "below" }],
  [{}, { adj: "left(side)" }, { adj: "right(side)" }],
  [{}, { adverb: "down" }, { adverb: "up" }],
  [{ notes: "duplicate of back/front?" }, { adverb: "behind" }, { adverb: "ahead" }],
  [{ notes: "duplicate of behind/ahead?" }, { adverb: "aft" }, { adverb: "fore" }],
  [{}, { verb: "insert(v)" }, { verb: "withdraw(v)" }],
  [{}, { verb: "serve(v)" }, { verb: "be_in_command(v)" }],
  [{}, { adj: "uncommon" }, { adj: "common" }],
  [{}, { adj: "inanimate" }, { adj: "animate" }],
  [{}, { noun: "idleness" }, { noun: "work" }],
  [{}, { adj: "fleeting" }, { adj: "persistent" }],
  [
    { notes: "duplicate of low/high? Expressible as max-low and max-high?" },
    { adj: "top" },
    { adj: "bottom" },
  ],
  [{}, { adj: "natural" }, { adj: "artificial" }],
  [
    { notes: 'Maybe the opposite of "search" should be "lose"?' },
    { verb: "hide(v)" },
    { verb: "search(v)" },
  ],
  [{}, { noun: "center" }, { noun: "frontier" }],
  [
    {},
    { adj: "ignorant", noun: "ignorance", verb: "ignore(v)" },
    { adj: "knowledgeable", noun: "knowledge", verb: "know(v)" },
  ],
  [{}, { verb: "forget(v)" }, { verb: "learn(v)" }],
  [{ notes: "none - very few - few - some - many - most - all" }, { adj: "few" }, { adj: "many" }],
  [{}, { adj: "female" }, { adj: "male" }],
  [{}, { adj: "wonky" }, { adj: "plumb" }],
  [{}, { adj: "bad" }, { adj: "good" }],
  [
    {},
    { noun: "pain", verb: "torment(v)" },
    { adj: "fun", noun: "pleasure", verb: "entertain(v)" },
  ],
  [
    { notes: "axis.csv also had revulsion / desire; positive verb forms: to desire" },
    { verb: "abhor(v)" },
    { adj: "desirable", verb: "desire(v)" },
  ],
  [
    {},
    { adj: "immaterial", verb: "dissolve(v)" },
    { adj: "material", noun: "physical_stuff", verb: "materialize(v)" },
  ],
  [{}, { adj: "difficult" }, { adj: "easy", verb: "enable(v)" }],
  [{}, { adj: "back" }, { adj: "front" }],
  [{}, { verb: "reap(v)" }, { verb: "sow(v)" }],
  [{}, { adj: "normal" }, { adj: "rare" }],
  [{ notes: "negative verb round(v) (no positive verb)" }, { adj: "round" }, { adj: "angle" }],
  [{}, { adj: "old", verb: "age(v)" }, { adj: "new", verb: "rejuvenate(v)" }],
  [
    { notes: "negative verb forms: take; positive verb forms: give" },
    { verb: "take(v)" },
    { noun: "gift", verb: "give(v)" },
  ],
  [{ notes: "negative verb forms: sleep" }, { verb: "sleep(v)" }, { verb: "wake(v)" }],
  [{}, { adj: "short", verb: "shorten(v)" }, { adj: "long", verb: "lengthen(v)" }],
  [{}, { adj: "narrow" }, { adj: "wide" }],
  [
    { notes: "negative verb internalize(v) (no positive verb)" },
    { noun: "interior" },
    { noun: "surface" },
  ],
  [
    { notes: "positive verb forms: to create; to self-actualize? / to become" },
    { verb: "destroy(v)" },
    { verb: "create(v)" },
  ],
  [{}, { adj: "ugly", verb: "uglify(v)" }, { adj: "beautiful", verb: "beautify(v)" }],
  [
    {
      notes:
        "come - stay - go; negative verb forms: to bring; to come; positive verb forms: to send; to go",
    },
    { noun: "departure", verb: "come(v)" },
    { noun: "arrival", verb: "go(v)" },
  ],
  [
    { notes: "hole - flat - mound / to dig - to flatten - to heap" },
    { noun: "hole", verb: "dig(v)" },
    { noun: "mound", verb: "heap_up(v)" },
  ],
  [
    { notes: "also fill(v); negative verb empty(v) (no positive verb)" },
    { adj: "empty" },
    { adj: "full" },
  ],
  [
    {
      notes:
        "negative verb forms: to disguise / to encrypt; positive verb forms: to show / to demonstrate; to appear",
    },
    { verb: "disguise(v)" },
    { noun: "demonstration", verb: "show(v)" },
  ],
  [
    {},
    { adj: "warlike", noun: "war", verb: "fight(v)" },
    { adj: "peaceful", noun: "peace", verb: "make_peace(v)" },
  ],
  [{}, { verb: "deflate(v)" }, { verb: "inflate(v)" }],
  [{}, { adj: "exclusive" }, { adj: "inclusive" }],
  [{}, { adj: "stupid" }, { adj: "smart" }],
  [{}, { adj: "oblique" }, { adj: "direct" }],
  [{}, { verb: "repel(v)" }, { verb: "attract(v)" }],
  [
    {
      notes:
        "There's some relationship between break - mend, part - whole, and divide - group. I'm not yet sure what it is.; negative verb forms: to divide / to partition; positive verb forms: to gather / to group / to collect",
    },
    { adj: "atomized", verb: "divide(v)" },
    { adj: "united", noun: "group", verb: "group(v)" },
  ],
  [{}, { adj: "cheap" }, { adj: "expensive" }],
  [{}, { verb: "attack(v)" }, { verb: "defend(v)" }],
  [{}, { verb: "neglect(v)" }, { verb: "steward(v)" }],
  [{}, { adj: "unimportant" }, { adj: "important" }],
  [
    {
      notes:
        "There's some relationship between break - mend, part - whole, and divide - group. I'm not yet sure what it is.",
    },
    { verb: "break(v)" },
    { verb: "mend(v)" },
  ],
  [
    {
      notes:
        "There's some relationship between break - mend, part - whole, and divide - group. I'm not yet sure what it is.",
    },
    { noun: "part" },
    { noun: "whole" },
  ],
  [
    { notes: "ancestor - parent - ? - child - descendent" },
    { noun: "ancestor" },
    { noun: "descendant" },
  ],
  [
    { notes: '"free" is already the positive adjective of the coercion axis' },
    { adj: "free(unbound)", verb: "liberate(v)" },
    { adj: "bound", verb: "constrain(v)" },
  ],
  [{}, { adj: "profane" }, { adj: "sacred" }],
  [{}, { adj: "south" }, { adj: "north" }],
  [{}, { adj: "west" }, { adj: "east" }],
  [
    {
      notes: "negative verb forms: to obey; positive verb forms: to command / to rule / to govern",
    },
    { verb: "obey(v)" },
    { verb: "command(v)" },
  ],
  [
    {
      notes:
        "negative verb forms: to conduct / to submit; positive verb forms: to resist / to thwart",
    },
    { verb: "submit(v)" },
    { verb: "resist(v)" },
  ],
  [
    {
      notes:
        "negative verb forms: to release; positive verb forms: to contain; also container; negative noun liberator (no positive noun)",
    },
    { verb: "release(v)" },
    { verb: "contain(v)" },
  ],
  [
    { notes: "exception - irregular - ? - regular - exemplar" },
    { adj: "irregular", verb: "irregulate(v)" },
    { adj: "regular", verb: "regulate(v)" },
  ],
  [{ notes: "Are these fundamental enough?" }, { verb: "succumb(v)" }, { verb: "withstand(v)" }],
  [
    {
      notes:
        'nouns: cyclic graph - dag - tree - list - node / alternatively, maybe it is better to have a "node" and use magnitude to raise it to list, tree, dag, cyclic graph; negative verb forms: to connect; positive verb forms: to disconnect',
    },
    { verb: "connect(v)" },
    { verb: "disconnect(v)" },
  ],
  [{ notes: "axis.csv had allow / force" }, { verb: "allow(v)" }, { verb: "compel(v)" }],
  [{}, { verb: "abstain(v)" }, { verb: "participate(v)" }],
  [{}, { verb: "start(v)" }, { verb: "stop(v)" }],
  [
    { notes: "axis.csv had privilege, right / obligation, duty" },
    { noun: "privilege" },
    { noun: "duty" },
  ],
  [{}, { verb: "forbid(v)" }, { verb: "recommend(v)" }],
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
    ["width", "height", "depth"], // height is the noun of the low/high axis
    ["yellow", "red", "blue"],
    ["sound", "taste", "touch"],
    ["animal", "plant", "fungus"],
  ]) {
    for (const word of group) {
      if (dictionary.has(word) || word === "height") continue; // already a word
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

  // prettier-ignore
  for (let word_set of axis_words_config) {
    const [axis, negative, positive] = word_set;

    const { noun: axis_noun, notes: axis_notes } = axis ?? {}
    const {
      noun: negative_noun,
      adj: negative_adj,
      verb: negative_verb,
      adverb: negative_adverb,
    } = negative ?? {};
    const {
      noun: positive_noun,
      adj: positive_adj,
      verb: positive_verb,
      adverb: positive_adverb,
    } = positive ?? {};

    let id = root_index++;

    let positive_noun_word: Word | undefined;
    let positive_adj_word: Word | undefined;
    let positive_verb_word: Word | undefined;
    let positive_adverb_word: Word | undefined;


    if (positive_noun)   positive_noun_word = cr(positive_noun, { t: [T.axis_word], domain: "noun", id });
    if (positive_adj)    positive_adj_word = cr(positive_adj, { t: [T.axis_word], domain: "adjective", id });
    if (positive_verb)   positive_verb_word = cr(positive_verb, { t: [T.axis_word], domain: "verb", id });
    if (positive_adverb) positive_adverb_word = cr(positive_adverb, { t: [T.axis_word], domain: "adverb", id });

    if (negative_noun)   cw(negative_noun, { t: [T.axis_word], domain: "noun", parts: [negative_word, positive_of(positive_noun_word, negative_noun)] });
    if (negative_adj)    cw(negative_adj, { t: [T.axis_word], domain: "adjective", parts: [negative_word, positive_of(positive_adj_word, negative_adj)] });
    if (negative_verb)   cw(negative_verb, { t: [T.axis_word], domain: "verb", parts: [negative_word, positive_of(positive_verb_word, negative_verb)] });
    if (negative_adverb) cw(negative_adverb, { t: [T.axis_word], domain: "adverb", parts: [negative_word, positive_of(positive_adverb_word, negative_adverb)] });

    if (axis_noun)       cw(axis_noun, { t: [T.axis_word], domain: "noun", notes: axis_notes, parts: [axis_of_word, positive_of(positive_noun_word, axis_noun)] });

    // Without an axis noun, the notes go on the axis's first positive word
    const first_positive = positive_adj_word ?? positive_noun_word ?? positive_verb_word ?? positive_adverb_word;
    if (!axis_noun && axis_notes && first_positive) first_positive.data.notes = axis_notes;
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
