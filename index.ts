enum T {
  // Root tags
  preposition,
  pronoun,
  grammar_helper,
  part_of_speech_specifier,
  domain_specifier,
  verb_specifier,
  axis_helper,
  axis_word,

  //
  root,
  compound,
}

type WordData = {
  id: number;
  t: T[]; // tags

  parts?: (w | string)[];
  noun?: string;
  adjective?: string;
  adverb?: string;
  domain?: string;
};

function is_defined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

class Word {
  value: w | string;
  str: string;
  data: WordData;
  constructor(word: w | string, data: WordData) {
    this.value = word;
    this.str = typeof word === "string" ? word : w[word];
    this.data = data;
  }
}

let root_index = 0;

function r(word: w | string, data: Partial<WordData> = {}): Word {
  let d: WordData = {
    id: -1,
    t: [],
    ...data,
  };
  if (is_defined(data.id) && data.id > 255) {
    throw new Error(`Word ID ${d.id} is greater than 255`);
  }
  d.t.push(T.root);
  return new Word(word, d);
}

function c(
  word: w | string,
  data: Partial<WordData> & { parts: Required<WordData["parts"]> },
): Word {
  let d: WordData = {
    id: -1,
    t: [],
    ...data,
  };
  d.t.push(T.compound);
  return new Word(word, d);
}

const roots: (Word[] | null)[] = Array.from({ length: 256 }, (_) => null);

const dictionary = new Map<string, Word>();

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

// prettier-ignore
enum w {
  _subject, _object, _verb, _verb_prescriptive, _verb_interrogative, _gerund,

  // prepositions
  with, to, from, by, for, in_of_about,

  // pronouns
  pronoun_first_person, pronoun_second_person, pronoun_third_person,
  this, that,

  not, and, or, if,

  // axis helpers
  axis_of, max_negative, negative, min_negative, neutral, min_positive, positive, max_positive,

  // misc
  singular, plural, land, wall, rod, person, saying, feel, money, place, container,
  mouth, use, rock, attach, path, sound, touch, do, body, mark, symbol, hand,
  finger, feet, head, torso, arm, leg,

}

const axis_words_config = [
  [
    { noun: "size" },
    { adj: "small", noun: "smallness", verb: "to shrink", adverb: "slightly" },
    { adj: "big", noun: "bigness", verb: "to grow", adverb: "hugely" },
  ],
  [
    { noun: "speed" },
    { adj: "slow", noun: "slowness", verb: "to decelerate", adverb: "slowly" },
    { adj: "fast", noun: "fastness", verb: "to accelerate", adverb: "quickly" },
  ],
  [
    { noun: "adaptability" },
    { adj: "static", noun: "stability", verb: "to stabilize", adverb: "statically" },
    { adj: "dynamic", noun: "dynamism", verb: "to adapt", adverb: "dynamically" },
  ],
  [
    { noun: "complexity(spectrum)" },
    { adj: "complex", noun: "complexity(state)", verb: "to complicate", adverb: "complexly" },
    { adj: "simple", noun: "simplicity", verb: "to simplify", adverb: "simply" },
  ],
  [
    { noun: "strength(axis)" },
    { adj: "weak", noun: "weakness", verb: "to weaken", adverb: "weakly" },
    { adj: "strong", noun: "strength(state)", verb: "to strengthen", adverb: "strongly" },
  ],
  [
    { noun: "quantity" },
    { adj: "less", noun: "scarcity", verb: "to decrease", adverb: "barely" },
    { adj: "more", noun: "abundance", verb: "to increase", adverb: "abundantly" },
  ],
  [
    { noun: "orderliness" },
    { adj: "chaotic", noun: "chaos", verb: "to disorganize", adverb: "chaotically" },
    { adj: "organized", noun: "order", verb: "to organize", adverb: "orderly" },
  ],
  [
    { noun: "initiative" },
    { adj: "passive", noun: "passivity", verb: "to lull", adverb: "passively" },
    { adj: "agentic", noun: "agency", verb: "to act", adverb: "agentically" },
  ],
  [
    { noun: "continuity" },
    { adj: "continuous", noun: "continuum", verb: "to smear", adverb: "continuously" },
    { adj: "discrete", noun: "discreteness", verb: "to demarcate", adverb: "choppily" },
  ],
  [
    { noun: "completeness" },
    { adj: "none", noun: "nothingness", verb: "to erase", adverb: "none(adverb)" },
    { adj: "all", noun: "everything", verb: "to fill", adverb: "completely" },
  ],
  [
    { noun: "openness(spectrum)" },
    { adj: "closed", noun: "closure", verb: "to close", adverb: "tightly" },
    { adj: "open", noun: "openness(state)", verb: "to open", adverb: "loosely" },
  ],
  [
    { noun: "granularity" },
    { adj: "coarse", noun: "coarseness", verb: "to roughen", adverb: "roughly" },
    { adj: "smooth", noun: "smoothness", verb: "to smooth", adverb: "smoothly" },
  ],
  [
    { noun: "coercion(spectrum)" },
    { adj: "forced", noun: "coercion(state)", verb: "to_force", adverb: "under_duress" },
    { adj: "free", noun: "freedom", verb: "to_free", adverb: "freely" },
  ],
  [
    { noun: "abstraction(spectrum)" },
    { adj: "concrete", noun: "concreteness", verb: "to_reify", adverb: "concretely" },
    { adj: "abstract", noun: "abstraction(state)", verb: "to_abstract", adverb: "in_general" },
  ],
  [
    { noun: "relativity(spectrum)" },
    { adj: "relative", noun: "relativity(state)", verb: "", adverb: "relatively" },
    { adj: "absolute", noun: "absolute(state)", verb: "", adverb: "absolutely" },
  ],
  [
    { noun: "rigidity(spectrum)" },
    { adj: "rigid", noun: "rigidity(state)", verb: "to_stiffen", adverb: "stiffly" },
    { adj: "fluid", noun: "fluidity", verb: "to_flow", adverb: "fluidly" },
  ],
  [
    { noun: "explicitness(spectrum)" },
    { adj: "implicit", noun: "implicitness", verb: "to_make_implicit", adverb: "implicitly" },
    {
      adj: "explicit",
      noun: "explicitness(state)",
      verb: "to_make_explicit",
      adverb: "explicitly",
    },
  ],
  [
    { noun: "internality(spectrum)" },
    { adj: "internal", noun: "internality(state)", verb: "to_internalize", adverb: "internally" },
    { adj: "external", noun: "externality", verb: "to_externalize", adverb: "externally" },
  ],
  [
    { noun: "finiteness(spectrum)" },
    { adj: "finite", noun: "finiteness(state)", verb: "", adverb: "finitely" },
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

function create_digit_map() {
  root_index = 128;

  const number_map = {};
  for (let i = 0; i < 128; i++) {
    const word = `digit_${i}`;
    number_map[word] = r(word, { t: [T.axis_word] });
  }

  return number_map;
}

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

    const { noun: axis_noun } = axis;
    const {
      noun: negative_noun,
      adj: negative_adj,
      verb: negative_verb,
      adverb: negative_adverb,
    } = negative;
    const {
      noun: positive_noun,
      adj: positive_adj,
      verb: positive_verb,
      adverb: positive_adverb,
    } = positive;

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
