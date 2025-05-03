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
  if (!d.id) {
    d.id = root_index++;
  } else if (d.id < root_index) {
    throw new Error(`Word ID ${d.id} is less than the current root index ${root_index}`);
  } else if (d.id > 255) {
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

// prettier-ignore
const axis_words = [
  // axis_of           negative,        positive,        max_negative,   min_negative,       neutral,          min_positive,    max_positive,
  [  "size",           "small",         "big",           "tiny",         "slightly_small",   "average_sized",  "slightly_big",  "huge",        ],
  [  "speed",          "slow",          "fast",          ],
  [  "dynamism",       "static",        "dynamic",       ],
  [  "complexity",     "complex",       "simple",        ],
  [  "strength",       "weak",          "strong",        ],
  [  "quantity",       "less",          "more",          ],
  [  "orderliness",    "chaos",         "order",         ],
  [  "passivity",      "passive",       "agentic",       ],
  [             ,      "continuous",    "discrete",      ],
  [             ,      "none",          "all",           ],
  [             ,      "closed",        "open",          ],
  [             ,      "rough",         "smooth",        ],
  [             ,      "force",         "choose",        ],
  [             ,      "concrete",      "abstract",      ],
  [             ,      "relative",      "absolute",      ],
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

function create_axis_word_map() {
  // prettier-ignore
  const axis_word_map = axis_words.reduce((acc, word_set) => {
    const [
      axis,
      negative,
      positive,
      max_negative,
      min_negative,
      neutral,
      min_positive,
      max_positive,
    ] = word_set;
    acc[positive] = r(positive, { t: [T.axis_word] });
    if (is_defined(axis))         acc[axis]         = c(axis,         {parts: [w.axis_of,      positive], t: [T.axis_word] });
    if (is_defined(negative))     acc[negative]     = c(negative,     {parts: [w.negative,     positive], t: [T.axis_word] });
    if (is_defined(max_negative)) acc[max_negative] = c(max_negative, {parts: [w.max_negative, positive], t: [T.axis_word] });
    if (is_defined(min_negative)) acc[min_negative] = c(min_negative, {parts: [w.min_negative, positive], t: [T.axis_word] });
    if (is_defined(neutral))      acc[neutral]      = c(neutral,      {parts: [w.neutral,      positive], t: [T.axis_word] });
    if (is_defined(min_positive)) acc[min_positive] = c(min_positive, {parts: [w.min_positive, positive], t: [T.axis_word] });
    if (is_defined(max_positive)) acc[max_positive] = c(max_positive, {parts: [w.max_positive, positive], t: [T.axis_word] });
    return acc;
  }, {} as Record<AxisWordString, Word>);
  return axis_word_map;
}

const words: Record<string, Word> = {
  [w._subject]: r(w._subject, { t: [T.grammar_helper] }),
  [w._object]: r(w._object, { t: [T.grammar_helper] }),
  [w._verb]: r(w._verb, { t: [T.grammar_helper] }),
  [w._verb_prescriptive]: r(w._verb_prescriptive, { t: [T.grammar_helper] }),
  [w._verb_interrogative]: r(w._verb_interrogative, { t: [T.grammar_helper] }),
  [w._gerund]: r(w._gerund, { t: [T.grammar_helper] }),

  // prepositions
  [w.with]: r(w.with, { t: [T.preposition] }),
  [w.to]: r(w.to, { t: [T.preposition] }),
  [w.from]: r(w.from, { t: [T.preposition] }),
  [w.by]: r(w.by, { t: [T.preposition] }),
  [w.for]: r(w.for, { t: [T.preposition] }),
  [w.in_of_about]: r(w.in_of_about, { t: [T.preposition] }),

  // pronouns
  [w.pronoun_first_person]: r(w.pronoun_first_person, { t: [T.pronoun] }),
  [w.pronoun_second_person]: r(w.pronoun_second_person, { t: [T.pronoun] }),
  [w.pronoun_third_person]: r(w.pronoun_third_person, { t: [T.pronoun] }),
  [w.this]: r(w.this, { t: [T.pronoun] }),
  [w.that]: r(w.that, { t: [T.pronoun] }),

  [w.not]: r(w.not, { t: [T.grammar_helper] }),
  [w.and]: r(w.and, { t: [T.grammar_helper] }),
  [w.or]: r(w.or, { t: [T.grammar_helper] }),
  [w.if]: r(w.if, { t: [T.grammar_helper] }),

  // axis helpers
  [w.axis_of]: r(w.axis_of, { t: [T.axis_helper] }),
  [w.max_negative]: r(w.max_negative, { t: [T.axis_helper] }),
  [w.negative]: r(w.negative, { t: [T.axis_helper] }),
  [w.min_negative]: r(w.min_negative, { t: [T.axis_helper] }),
  [w.neutral]: r(w.neutral, { t: [T.axis_helper] }),
  [w.min_positive]: r(w.min_positive, { t: [T.axis_helper] }),
  [w.positive]: r(w.positive, { t: [T.axis_helper] }),
  [w.max_positive]: r(w.max_positive, { t: [T.axis_helper] }),

  // TODO: misc

  // axis words
  ...create_axis_word_map(),
};
