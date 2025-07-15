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

type WordData = {
  id: number;
  t: (keyof typeof T)[]; // tags

  uses: Word[];
  parts?: number[];
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
  const parts_length = word.data.parts?.length ?? 0;
  const id = word.data.id;
  if (id >= 0 && parts_length > 0) {
    throw new Error(`Word ${word.word} has root ID and parts`);
  }
  if (id < 0 && parts_length === 0) {
    throw new Error(`Word ${word.word} has negative ID and no parts`);
  }
  return id >= 0;
}

let root_index = 0;

function r(word: string, data: Partial<WordData> = {}): Word {
  let d: WordData = {
    id: -1,
    t: [],
    uses: [],
    ...data,
  };
  if (!is_defined(data.id)) {
    d.id = root_index++;
  }
  if (is_defined(data.id) && data.id > 255) {
    throw new Error(`Word ID ${d.id} is greater than 255`);
  }
  return new Word(word, d);
}

function c(word: string, data: Partial<WordData> & { parts: Required<WordData["parts"]> }): Word {
  let d: WordData = {
    id: -1,
    t: [],
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

const axis_words_config = [
  [
    { noun: "size" },
    { adj: "small", noun: "smallness", verb: "shrink(v)", adverb: "slightly" },
    { adj: "big", noun: "bigness", verb: "grow(v)", adverb: "hugely" },
  ],
  [
    { noun: "speed" },
    { adj: "slow", noun: "slowness", verb: "decelerate(v)", adverb: "slowly" },
    { adj: "fast", noun: "fastness", verb: "accelerate(v)", adverb: "quickly" },
  ],
  [
    { noun: "adaptability" },
    { adj: "static", noun: "stability", verb: "stabilize(v)", adverb: "statically" },
    { adj: "dynamic", noun: "dynamism", verb: "adapt(v)", adverb: "dynamically" },
  ],
  [
    { noun: "complexity(axis)" },
    { adj: "complex", noun: "complexity(state)", verb: "complicate(v)", adverb: "complexly" },
    { adj: "simple", noun: "simplicity", verb: "simplify(v)", adverb: "simply" },
  ],
  [
    { noun: "strength(axis)" },
    { adj: "weak", noun: "weakness", verb: "weaken(v)", adverb: "weakly" },
    { adj: "strong", noun: "strength(state)", verb: "strengthen(v)", adverb: "strongly" },
  ],
  [
    { noun: "quantity" },
    { adj: "less", noun: "scarcity", verb: "decrease(v)", adverb: "barely" },
    { adj: "more", noun: "abundance", verb: "increase(v)", adverb: "abundantly" },
  ],
  [
    { noun: "orderliness" },
    { adj: "chaotic", noun: "chaos", verb: "disorganize(v)", adverb: "chaotically" },
    { adj: "organized", noun: "order", verb: "organize(v)", adverb: "orderly" },
  ],
  [
    { noun: "initiative" },
    { adj: "passive", noun: "passivity", verb: "lull(v)", adverb: "passively" },
    { adj: "agentic", noun: "agency", verb: "act(v)", adverb: "agentically" },
  ],
  [
    { noun: "continuity" },
    { adj: "continuous", noun: "continuum", verb: "smear(v)", adverb: "continuously" },
    { adj: "discrete", noun: "discreteness", verb: "demarcate(v)", adverb: "choppily" },
  ],
  [
    { noun: "completeness" },
    { adj: "none", noun: "nothingness", verb: "erase(v)", adverb: "none(adverb)" },
    { adj: "all", noun: "everything", verb: "fill(v)", adverb: "completely" },
  ],
  [
    { noun: "openness(axis)" },
    { adj: "closed", noun: "closure", verb: "close(v)", adverb: "tightly" },
    { adj: "open", noun: "openness(state)", verb: "open(v)", adverb: "loosely" },
  ],
  [
    { noun: "granularity" },
    { adj: "coarse", noun: "coarseness", verb: "roughen(v)", adverb: "roughly" },
    { adj: "smooth", noun: "smoothness", verb: "smooth(v)", adverb: "smoothly" },
  ],
  [
    { noun: "coercion(axis)" },
    { adj: "forced", noun: "coercion(state)", verb: "force(v)", adverb: "under_duress" },
    { adj: "free", noun: "freedom", verb: "free(v)", adverb: "freely" },
  ],
  [
    { noun: "abstraction(axis)" },
    { adj: "concrete", noun: "concreteness", verb: "reify(v)", adverb: "concretely" },
    { adj: "abstract", noun: "abstraction(state)", verb: "abstract(v)", adverb: "in_general" },
  ],
  [
    { noun: "relativity(axis)" },
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
    { noun: "internality(axis)" },
    { adj: "internal", noun: "internality(state)", verb: "internalize(v)", adverb: "internally" },
    { adj: "external", noun: "externality", verb: "externalize(v)", adverb: "externally" },
  ],
  [
    { noun: "finiteness(axis)" },
    { adj: "finite", noun: "finitude(state)", verb: "", adverb: "finitely" },
    { adj: "infinite", noun: "infinity", verb: "", adverb: "infinitely" },
  ],
];

// prettier-ignore
const axis_words = [
  // axis_of           negative,        positive,        max_negative,   min_negative,       neutral,          min_positive,    max_positive,
  [             ,      "rigid",         "fluid",         ],
  [             ,      "implicit",      "explicit",      ],
  [             ,      "internal",      "external",      ],
  [             ,      "finite",        "infinite",      ],
  [             ,      "accidental",    "essential",     ],
  [             ,      "pragmatic",     "ideal",         ],
  [             ,      "flat",          "nested",        ],
  [             ,      "intuitive",     "analytical",    ],
  [             ,      "random",        "determined",    ],
  [             ,      "qualitative",   "quantitative",  ],
  [             ,      "linear",        "cyclical",      ],
  [             ,      "reductionist",  "holistic",      ],
  [             ,      "near",          "far",           ],
  [             ,      "loud",          "quiet",         ],
  [             ,      "dull",          "sharp",         ],
  [             ,      "dry",           "wet",           ],
  [             ,      "thin",          "thick",         ],
  [             ,      "low",           "high",          ],
  [             ,      "cold",          "hot",           ],
  [             ,      "dark",          "bright",        ],
  [             ,      "soft",          "hard",          ],
  [             ,      "light",         "heavy",         ],
  [             ,      "hate",          "love",          ],
  [             ,      "false",         "true",          ],
  [             ,      "past",          "future",        ],
  [             ,      "lose",          "win",           ],
  [             ,      "fail",          "succeed",       ],
  [             ,      "consume",       "produce",       ],
  [             ,      "sell",          "buy",           ],
  [             ,      "receive",       "send",          ],
  [             ,      "fear",          "hope",          ],
  [             ,      "doubt",         "believe",       ],
  [             ,      "dead",          "alive",         ],
  [             ,      "here",          "there",         ],
  [             ,      "in",            "out",           ],
  [             ,      "above",         "below",         ],
  [             ,      "left",          "right",         ],
  [             ,      "down",          "up",            ],
  [             ,      "behind",        "ahead",         ],
  [             ,      "aft",           "fore",          ],
  [             ,      "insert",        "withdraw",      ],
  [             ,      "serve",         "be_in_command", ],
  [             ,      "uncommon",      "common",        ],
  [             ,      "inanimate",     "animate",       ],
  [             ,      "idleness",      "work",          ],
  [             ,      "fleeting",      "persistent",    ],
  [             ,      "top",           "bottom",        ],
  [             ,      "natural",       "artificial",    ],
  [             ,      "hide",          "search",        ],
  [             ,      "same",          "different",     ],
  [             ,      "center",        "frontier",      ],
  [             ,      "ignorance",     "knowledge",     ],
  [             ,      "forget",        "learn",         ],
  [             ,      "few",           "many",          ],
  [             ,      "female",        "male",          ],
  [             ,      "wonky",         "plumb",         ],
  [             ,      "bad",           "good",          ],
  [             ,      "pain",          "pleasure",      ],
  [             ,      "abhor",         "desire",        ],
  [             ,      "immaterial",    "material",      ],
  [             ,      "difficult",     "easy",          ],
  [             ,      "back",          "front",         ],
  [             ,      "reap",          "sow",           ],
  [             ,      "normal",        "rare",          ],
  [             ,      "round",         "angle",         ],
  [             ,      "old",           "new",           ],
  [             ,      "take",          "give",          ],
  [             ,      "sleep",         "wake",          ],
  [             ,      "short",         "long",          ],
  [             ,      "narrow",        "wide",          ],
  [             ,      "interior",      "surface",       ],
  [             ,      "destroy",       "create",        ],
  [             ,      "ugly",          "beautiful",     ],
  [             ,      "come",          "go",            ],
  [             ,      "hole",          "mound",         ],
  [             ,      "empty",         "full",          ],
  [             ,      "disguise",      "show",          ],
  [             ,      "war",           "peace",         ],
  [             ,      "deflate",       "inflate",       ],
  [             ,      "exclusive",     "inclusive",     ],
  [             ,      "stupid",        "smart",         ],
  [             ,      "obique",        "direct",        ],
  [             ,      "repel",         "attract",       ],
  [             ,      "divide",        "group",         ],
  [             ,      "cheap",         "expensive",     ],
  [             ,      "attack",        "defend",        ],
  [             ,      "neglect",       "steward",       ],
  [             ,      "unimportant",   "important",     ],
  [             ,      "break",         "mend",          ],
  [             ,      "part",          "whole",         ],
  [             ,      "ancestor",      "descendent",    ],
  [             ,      "free",          "bound",         ],
  [             ,      "profane",       "sacred",        ],
  [             ,      "south",         "north",         ],
  [             ,      "west",          "east",          ],
  [             ,      "obey",          "command",       ],
  [             ,      "submit",        "resist",        ],
  [             ,      "release",       "contain",       ],
  [             ,      "irregular",     "regular",       ],
  [             ,      "succumb",       "withstand",     ],
  [             ,      "connect",       "disconnect",    ],
  [             ,      "allow",         "compel",        ],
  [             ,      "abstain",       "participate",   ],
  [             ,      "start",         "stop",          ],
  [             ,      "privilege",     "duty",          ],
  [             ,      "forbid",        "recommend",     ],
] as const;

// prettier-ignore
type ExtractLeaf<T> =
  // Case: Array (recursively flatten)
    T extends readonly (infer U)[]    ? ExtractLeaf<U>
  // Case: Object with "word" key
  : T extends { word: infer W }       ? ExtractLeaf<W>
  // Case: String
  : T extends string                  ? T
  // Exclude undefined
  : T extends undefined               ? never
  :                                     Exclude<T, undefined>;

type AxisWordString = ExtractLeaf<typeof axis_words>;

{
  cr("_subject", { t: [T.grammar_helper] });
  cr("_object", { t: [T.grammar_helper] });
  cr("_verb", { t: [T.grammar_helper] });
  cr("_verb(prescriptive)", { t: [T.grammar_helper] });
  cr("_verb(interrogative)", { t: [T.grammar_helper] });
  cr("_gerund", { t: [T.grammar_helper] });
}

// prepositions
{
  cr("with", { t: [T.preposition] });
  cr("to", { t: [T.preposition] });
  cr("from", { t: [T.preposition] });
  cr("by", { t: [T.preposition] });
  cr("for", { t: [T.preposition] });
  cr("in_of_about", { t: [T.preposition] });
}

// pronouns
{
  cr("pronoun(first_person)", { t: [T.pronoun] });
  cr("pronoun(second_person)", { t: [T.pronoun] });
  cr("pronoun(third_person)", { t: [T.pronoun] });
  cr("this", { t: [T.pronoun] });
  cr("that", { t: [T.pronoun] });
}

{
  cr("not", { t: [T.grammar_helper] });
  cr("and", { t: [T.grammar_helper] });
  cr("or", { t: [T.grammar_helper] });
  cr("if", { t: [T.grammar_helper] });
}

// axis helpers
{
  cr("axis_of", { t: [T.axis_helper] });
  cr("max_negative", { t: [T.axis_helper] });
  cr("negative", { t: [T.axis_helper] });
  cr("min_negative", { t: [T.axis_helper] });
  cr("neutral", { t: [T.axis_helper] });
  cr("min_positive", { t: [T.axis_helper] });
  cr("positive", { t: [T.axis_helper] });
  cr("max_positive", { t: [T.axis_helper] });
}

// misc
{
  cr("singular");
  cr("plural");
  cr("land");
  cr("wall");
  cr("rod");
  cr("person");
  cr("saying");
  cr("feel");
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
  cr("body");
  cr("mark");
  cr("symbol");
  cr("hand");
  cr("finger");
  cr("feet");
  cr("head");
  cr("torso");
  cr("arm");
  cr("leg");
}

// digit domain
{
  root_index = 128;
  for (let i = 0; i < 128; i++) {
    cr(`digit_${i}`, { domain: "number" });
  }
}

// axis words
{
  root_index = 128;

  const axis_of_id: number = dictionary.get("axis_of")?.data.id!;
  const negative_id: number = dictionary.get("negative")?.data.id!;
  const positive_id: number = dictionary.get("positive")?.data.id!;
  const max_negative_id: number = dictionary.get("max_negative")?.data.id!;
  const min_negative_id: number = dictionary.get("min_negative")?.data.id!;
  const neutral_id: number = dictionary.get("neutral")?.data.id!;
  const min_positive_id: number = dictionary.get("min_positive")?.data.id!;
  const max_positive_id: number = dictionary.get("max_positive")?.data.id!;

  if (!is_defined(axis_of_id)) throw new Error(`Missing axis_of word`);
  if (!is_defined(negative_id)) throw new Error(`Missing negative word`);
  if (!is_defined(positive_id)) throw new Error(`Missing positive word`);
  if (!is_defined(max_negative_id)) throw new Error(`Missing max_negative word`);
  if (!is_defined(min_negative_id)) throw new Error(`Missing min_negative word`);
  if (!is_defined(neutral_id)) throw new Error(`Missing neutral word`);
  if (!is_defined(min_positive_id)) throw new Error(`Missing min_positive word`);
  if (!is_defined(max_positive_id)) throw new Error(`Missing max_positive word`);

  // prettier-ignore
  for (let word_set of axis_words_config) {
    const [axis, negative, positive] = word_set;

    const { noun: axis_noun } = axis ?? {}
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

    if (positive_noun)   cr(positive_noun, { t: [T.axis_word], domain: "noun", id });
    if (positive_adj)    cr(positive_adj, { t: [T.axis_word], domain: "adjective", id });
    if (positive_verb)   cr(positive_verb, { t: [T.axis_word], domain: "verb", id });
    if (positive_adverb) cr(positive_adverb, { t: [T.axis_word], domain: "adverb", id });

    if (negative_noun)   cw(negative_noun, { t: [T.axis_word], domain: "noun", parts: [negative_id, id] });
    if (negative_adj)    cw(negative_adj, { t: [T.axis_word], domain: "adjective", parts: [negative_id, id] });
    if (negative_verb)   cw(negative_verb, { t: [T.axis_word], domain: "verb", parts: [negative_id, id] });
    if (negative_adverb) cw(negative_adverb, { t: [T.axis_word], domain: "adverb", parts: [negative_id, id] });

    if (axis_noun)       cw(axis_noun, { t: [T.axis_word], domain: "noun", parts: [axis_of_id, id] });
  }
}

console.log("Dictionary:", dictionary);

console.log(dictionary.size);

export const words = Array.from(dictionary.values());

// Helper to get Word object from its ID (assuming IDs are unique in WordData)
export const get_word_from_part_id = (part_id: number, domain?: string): Word | undefined => {
  if (is_defined(domain)) {
    const domain_word = words.find((w) => w.data.id === part_id && w.data.domain === domain);
    if (is_defined(domain_word)) return domain_word;
  }
  return words.find((w) => w.data.id === part_id);
};

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
});
