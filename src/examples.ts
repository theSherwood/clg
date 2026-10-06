import { type Candidate, type Word, candidates, dictionary, verb_glosses } from "./dict";

// Worked examples: English with a draft transliteration. Transliterations are written in English
// glosses; <...> marks grammar words, e.g. <subject>, <verb (prescriptive)>, <in>.

export type Example = { title: string; english: string; transliteration: string };

export type Article = { title: string; english: string[]; transliteration?: string };

// Numbers in each base. The base comes from context; here, the heading. A rank after a digit
// gives that digit's place. By convention the ranks
// work like commas, every three places in base 10 and every four in bases 2 and 16: a base 10
// number past rank_3 says rank_3, one past rank_6 says rank_6, and so on, skipping groups that are
// all zeros. Long numbers end with rank_0 even where it could be dropped.
export type NumberBase = { title: string; examples: Example[] };

export const number_examples: NumberBase[] = [
  {
    title: "Base 10",
    examples: [
      {
        title: "7",
        english: "A lone number drops its final rank_0",
        transliteration: "number 7",
      },
      {
        title: "1003",
        english: "Places a rank jumps over are zeros",
        transliteration: "number 1 rank_3 3",
      },
      { title: "10,000", english: "Like “ten thousand”", transliteration: "number 1 0 rank_3" },
      {
        title: "120,034",
        english: "120 thousand 34",
        transliteration: "number 1 2 0 rank_3 3 4",
      },
      {
        title: "34,103,487",
        english: "34 million 103 thousand 487",
        transliteration: "number 3 4 rank_6 1 0 3 rank_3 4 8 7 rank_0",
      },
      {
        title: "1,000,000",
        english: "The empty thousands group is skipped",
        transliteration: "number 1 rank_6",
      },
      {
        title: "2,004,000",
        english: "2 million 4 thousand",
        transliteration: "number 2 rank_6 4 rank_3",
      },
      {
        title: "three big people",
        english: "rank_0 is needed here: big shares its sound with a digit",
        transliteration: "person number 3 rank_0 big",
      },
      {
        title: "three small people",
        english: "rank_0 is needed here too: negative could start a negative rank",
        transliteration: "person number 3 rank_0 small",
      },
      {
        title: "0.3",
        english: "A negative rank ends the number too",
        transliteration: "number 3 negative rank_1",
      },
      { title: "23%", english: "0.23", transliteration: "number 2 3 negative rank_2" },
      {
        title: "3e139",
        english: "Past rank_15, rank takes a subclause holding the place",
        transliteration: "number 3 rank clause_start number 1 3 9 clause_end",
      },
    ],
  },
  {
    title: "Base 16",
    examples: [
      { title: "1003", english: "3EB", transliteration: "number 3 14 11" },
      {
        title: "34,103,487",
        english: "208,60BF",
        transliteration: "number 2 0 8 rank_4 6 0 11 15 rank_0",
      },
      { title: "65,535", english: "FFFF", transliteration: "number 15 15 15 15" },
      { title: "65,536", english: "1,0000", transliteration: "number 1 rank_4" },
      {
        title: "4,294,967,295",
        english: "FFFF,FFFF: the largest 32-bit number",
        transliteration: "number 15 15 15 15 rank_4 15 15 15 15 rank_0",
      },
      { title: "1/16", english: "0.1", transliteration: "number 1 negative rank_1" },
    ],
  },
  {
    title: "Base 2",
    examples: [
      { title: "5", english: "101", transliteration: "number 1 0 1" },
      {
        title: "1003",
        english: "11,1110,1011",
        transliteration: "number 1 1 rank_8 1 1 1 0 rank_4 1 0 1 1 rank_0",
      },
      { title: "1024", english: "100,0000,0000", transliteration: "number 1 0 0 rank_8" },
      {
        title: "65,535",
        english: "1111,1111,1111,1111: the largest number the rank roots reach in base 2",
        transliteration:
          "number 1 1 1 1 rank_12 1 1 1 1 rank_8 1 1 1 1 rank_4 1 1 1 1 rank_0",
      },
      { title: "1/2", english: "0.1", transliteration: "number 1 negative rank_1" },
    ],
  },
];

// Tense is unmarked by default. A time adverb after the verb places it in time, graded by the
// axis scale, and the aspect words say whether it's ongoing or done.
export const tense_examples: Example[] = [
  {
    title: "No tense",
    english: "I sleep / I slept / I will sleep, from context",
    transliteration: "<subject> I <verb> sleep(v)",
  },
  {
    title: "Past",
    english: "I slept",
    transliteration: "<subject> I <verb> sleep(v) formerly",
  },
  {
    title: "Future",
    english: "I will sleep",
    transliteration: "<subject> I <verb> sleep(v) henceforth",
  },
  {
    title: "Continuous",
    english: "I'm sleeping (or was, or will be)",
    transliteration: "<subject> I <verb> sleep(v) continuous_tense_aspect",
  },
  {
    title: "Past continuous",
    english: "I was sleeping",
    transliteration: "<subject> I <verb> sleep(v) continuous_tense_aspect formerly",
  },
  {
    title: "Perfect",
    english: "The person has learned the way",
    transliteration: "<subject> person <verb> learn(v) perfect_tense_aspect <object> path",
  },
  {
    title: "Future perfect",
    english: "The person will have learned the way",
    transliteration: "<subject> person <verb> learn(v) perfect_tense_aspect henceforth <object> path",
  },
  {
    title: "Perfect continuous",
    english: "I have been working",
    transliteration: "<subject> I <verb> work(v) continuous_tense_aspect perfect_tense_aspect",
  },
  {
    title: "Remote past",
    english: "The person died long ago",
    transliteration: "<subject> person <verb> kill(v) max_negative henceforth",
  },
  {
    title: "Recent past",
    english: "The person just left",
    transliteration: "<subject> person <verb> go(v) min_negative henceforth",
  },
  {
    title: "Near future",
    english: "I'll give you money soon",
    transliteration: "<subject> I <verb> give(v) min_positive henceforth <object> money <to> you",
  },
  {
    title: "Now",
    english: "Right now, I'm sleeping",
    transliteration: "<subject> I <verb> sleep(v) continuous_tense_aspect neutral henceforth",
  },
  {
    title: "Time carries over",
    english: "Long ago, a person gave money. They left. (both past)",
    transliteration:
      "<subject> person <verb> give(v) max_negative henceforth <object> money. <subject> it <verb> go(v).",
  },
];

// The truth axis grades likelihood, as an adverb after the verb. The modality axis is separate:
// how many cases something holds in.
export const truth_examples: Example[] = [
  {
    title: "Certainly",
    english: "The person certainly died",
    transliteration: "<subject> person <verb> kill(v) max_positive truly",
  },
  {
    title: "Plain",
    english: "The person died",
    transliteration: "<subject> person <verb> kill(v)",
  },
  {
    title: "Probably",
    english: "The person probably died",
    transliteration: "<subject> person <verb> kill(v) min_positive truly",
  },
  {
    title: "Maybe",
    english: "Maybe the person left",
    transliteration: "<subject> person <verb> go(v) neutral truly",
  },
  {
    title: "Probably not",
    english: "The person probably didn't leave",
    transliteration: "<subject> person <verb> go(v) min_negative truly",
  },
  {
    title: "Proved",
    english: "The person has proved it",
    transliteration: "<subject> person <verb> prove(v) perfect_tense_aspect <object> it",
  },
  {
    title: "Belief and likelihood",
    english: "I believe the person probably left",
    transliteration:
      "<subject> I <verb> believe(v) <object> clause_start <subject> person <verb> go(v) min_positive truly clause_end",
  },
  {
    title: "Necessary",
    english: "Everyone necessarily dies",
    transliteration: "<subject> person all <verb> kill(v) necessarily",
  },
  {
    title: "Possible",
    english: "A person can learn: it's not impossible",
    transliteration: "<subject> person <verb> learn(v) not impossibly",
  },
  {
    title: "Contingent",
    english: "The person dies, but not necessarily",
    transliteration: "<subject> person <verb> kill(v) neutral necessarily",
  },
];

// Kinship is the lineage axis: the scale gives the relation, and rank counts generations.
export const family_examples: Example[] = [
  { title: "Parent", english: "negative child", transliteration: "parent" },
  {
    title: "Mother",
    english: "parent, female",
    transliteration: "parent female",
  },
  { title: "Aunt or uncle", english: "a lesser parent", transliteration: "min_negative child" },
  { title: "Sibling", english: "the same generation", transliteration: "neutral child" },
  { title: "Niece or nephew", english: "a lesser child", transliteration: "min_positive child" },
  { title: "Descendants", english: "the whole line down", transliteration: "max_positive child" },
  { title: "Ancestors", english: "the whole line up", transliteration: "max_negative child" },
  { title: "Grandchild", english: "two generations down", transliteration: "child rank_2" },
  { title: "Grandparent", english: "two generations up", transliteration: "parent rank_2" },
  {
    title: "First cousin",
    english: "a shared grandparent, two generations up",
    transliteration: "neutral child rank_2",
  },
  {
    title: "Second cousin",
    english: "a shared great-grandparent",
    transliteration: "neutral child rank_3",
  },
  {
    title: "First cousin once removed",
    english: "a parent's first cousin",
    transliteration: "neutral child rank_2 <of> parent",
  },
  {
    title: "A family sentence",
    english: "My grandparent has many descendants",
    transliteration:
      "<subject> parent rank_2 <of> me <verb> possess <object> max_positive child many",
  },
];

// Three hue roots; other hues mix by modifying, and lightness comes from the brightness axis
export const color_examples: Example[] = [
  { title: "Orange", english: "a yellowish red", transliteration: "red yellow" },
  { title: "Green", english: "a bluish yellow", transliteration: "yellow blue" },
  { title: "Purple", english: "a bluish red", transliteration: "red blue" },
  { title: "Pink", english: "a light red", transliteration: "red bright" },
  { title: "Maroon", english: "a dark red", transliteration: "red dark" },
  { title: "White", english: "the bright end of the brightness axis", transliteration: "bright" },
  { title: "Black", english: "the dark end", transliteration: "dark" },
  {
    title: "A sentence",
    english: "The rock is orange",
    transliteration: "<subject> rock <verb> is <object> red yellow",
  },
];

// Nouns from verbs: who does it, what it's done to, what it's done with, and where
export const role_examples: Example[] = [
  { title: "Teacher", english: "whoever teaches", transliteration: "_er educate(v)" },
  { title: "Food", english: "what's eaten", transliteration: "_ee eat" },
  { title: "Seed", english: "what's sown", transliteration: "_ee sow(v)" },
  { title: "Key", english: "what you open with", transliteration: "_tool open(v)" },
  { title: "Weapon", english: "what you fight with", transliteration: "_tool fight(v)" },
  { title: "Shovel", english: "what you dig with", transliteration: "_tool dig(v)" },
  { title: "Tool", english: "what you do things with", transliteration: "_tool do" },
  { title: "Ear", english: "what you hear with", transliteration: "_tool hear(v)" },
  { title: "Eye", english: "what you sense light with", transliteration: "_tool sense(v) light" },
  { title: "Word", english: "what's said", transliteration: "_ee say(v)" },
  { title: "Text", english: "what's written", transliteration: "_ee write(v)" },
  { title: "Reader", english: "whoever reads", transliteration: "_er read(v)" },
  { title: "Mark", english: "a lesser writing", transliteration: "min_positive write(v)" },
  { title: "Bed", english: "where you sleep", transliteration: "_place sleep(v)" },
  { title: "Birthplace", english: "where you came to life", transliteration: "_place come_alive(v)" },
  { title: "School", english: "where you learn", transliteration: "_place learn(v)" },
  { title: "Shop", english: "where you buy", transliteration: "_place buy(v)" },
  { title: "Workplace", english: "where you work", transliteration: "_place work(v)" },
  { title: "Sender", english: "whoever sends", transliteration: "_er send(v)" },
  { title: "Package", english: "what's sent", transliteration: "_ee send(v)" },
  { title: "Addressee", english: "whom it's sent to", transliteration: "_to send(v)" },
  { title: "Recipient", english: "whom it's given to", transliteration: "_to give(v)" },
  { title: "Destination", english: "where you go", transliteration: "_to go(v)" },
  { title: "Origin", english: "where you come from", transliteration: "_from come(v)" },
  { title: "Source", english: "what you learn from", transliteration: "_from learn(v)" },
  { title: "Material", english: "what something is created from", transliteration: "_from create(v)" },
  {
    title: "A sentence",
    english: "I send you money",
    transliteration: "<subject> I <verb> send(v) <object> money <to> you",
  },
];

// Questions: _blank stands for what's asked, in whatever role or phrase it's asked about
export const question_examples: Example[] = [
  { title: "Yes or no", english: "Do you sleep?", transliteration: "<subject> you <verb (interrogative)> sleep(v)" },
  {
    title: "Who",
    english: "Who killed the person?",
    transliteration: "<subject> person _blank <verb (interrogative)> kill(v) <object> person",
  },
  {
    title: "What",
    english: "What do you eat?",
    transliteration: "<subject> you <verb (interrogative)> eat <object> _blank",
  },
  {
    title: "Where",
    english: "Where do you sleep?",
    transliteration: "<subject> you <verb (interrogative)> sleep(v) <at> _blank",
  },
  {
    title: "Where to",
    english: "Where are you going?",
    transliteration: "<subject> you <verb (interrogative)> go(v) <to> _blank",
  },
  {
    title: "Where from",
    english: "Where do you come from?",
    transliteration: "<subject> you <verb (interrogative)> come(v) <from> _blank",
  },
  {
    title: "When",
    english: "When did the person die?",
    transliteration: "<subject> person <verb (interrogative)> kill(v) <at> time _blank",
  },
  {
    title: "Why",
    english: "Why do you fight?",
    transliteration: "<subject> you <verb (interrogative)> fight(v) <for> _blank",
  },
  {
    title: "How",
    english: "How do you open it?",
    transliteration: "<subject> you <verb (interrogative)> open(v) <object> it <with> _blank",
  },
  {
    title: "How many",
    english: "How many children do you have?",
    transliteration: "<subject> you <verb (interrogative)> possess <object> child number _blank",
  },
];

// self and other, and joining clauses with but
export const self_other_examples: Example[] = [
  { title: "Myself", english: "I know myself", transliteration: "<subject> I <verb> know(v) <object> self" },
  {
    title: "Each other",
    english: "They love each other",
    transliteration: "<subject> it plural <verb> love(v) <object> other",
  },
  {
    title: "One another",
    english: "Everyone should act towards one another",
    transliteration: "<subject> person all <verb (prescriptive)> do <to> other",
  },
  { title: "One's own", english: "one's own family", transliteration: "family <of> self" },
  { title: "Another", english: "another person", transliteration: "person other" },
  {
    title: "But",
    english: "I sleep, but you work",
    transliteration: "<subject> I <verb> sleep(v) but <subject> you <verb> work(v)",
  },
];

// Water, and fire from the combustion axis: burn is a change verb
export const water_fire_examples: Example[] = [
  { title: "Water", english: "water", transliteration: "water" },
  { title: "Fire", english: "the burning end of the combustion axis", transliteration: "fire" },
  { title: "Drink", english: "I drink water", transliteration: "<subject> I <verb> eat <object> water" },
  { title: "Burn", english: "The land is burning", transliteration: "<subject> land <verb> burn(v) continuous_tense_aspect" },
  {
    title: "Set on fire",
    english: "The person burns the rod",
    transliteration: "<subject> person <verb> burn(v) <object> rod",
  },
  {
    title: "Put out",
    english: "Water puts out fire",
    transliteration: "<subject> water <verb> extinguish(v) <object> fire",
  },
  {
    title: "Go out, but",
    english: "The fire went out, but the rock is hot",
    transliteration:
      "<subject> fire <verb> extinguish(v) formerly but <subject> rock <verb> is <object> hot",
  },
];

// One celestial root; rank picks the level of the orbital hierarchy, and this makes it ours
export const sky_examples: Example[] = [
  { title: "Celestial body", english: "any body in the sky", transliteration: "celestial" },
  { title: "Asteroid or comet", english: "rank 0: debris", transliteration: "celestial rank_0" },
  { title: "Moon", english: "rank 1: orbits a planet", transliteration: "celestial rank_1" },
  { title: "Planet", english: "rank 2: orbits a star", transliteration: "celestial rank_2" },
  { title: "Star", english: "rank 3", transliteration: "celestial rank_3" },
  { title: "Galaxy", english: "rank 4", transliteration: "celestial rank_4" },
  { title: "The Moon", english: "our moon", transliteration: "celestial rank_1 this" },
  { title: "Earth", english: "our planet", transliteration: "celestial rank_2 this" },
  { title: "The Sun", english: "our star", transliteration: "celestial rank_3 this" },
  { title: "The Milky Way", english: "our galaxy", transliteration: "celestial rank_4 this" },
  { title: "Many stars", english: "many stars", transliteration: "celestial rank_3 many" },
  {
    title: "A sentence",
    english: "The Sun is bright",
    transliteration: "<subject> celestial rank_3 this <verb> is <object> bright",
  },
];

// Comparison is a relation verb, exceed; <in> names the quality compared
export const comparison_examples: Example[] = [
  {
    title: "Bigger than",
    english: "The rock is bigger than the person",
    transliteration: "<subject> rock <verb> exceed <object> person <in> big",
  },
  {
    title: "Smaller than",
    english: "The person is smaller than the rock",
    transliteration: "<subject> person <verb> fall_short(v) <object> rock <in> big",
  },
  {
    title: "As big as",
    english: "The rock is as big as the person",
    transliteration: "<subject> rock <verb> equal <object> person <in> big",
  },
  {
    title: "Biggest",
    english: "The Sun is the biggest",
    transliteration: "<subject> celestial rank_3 this <verb> exceed <object> all <in> big",
  },
  {
    title: "Much bigger",
    english: "The Sun is much bigger than Earth",
    transliteration:
      "<subject> celestial rank_3 this <verb> max_positive exceed <object> celestial rank_2 this <in> big",
  },
  {
    title: "Slightly faster",
    english: "You are slightly faster than me",
    transliteration: "<subject> you <verb> min_positive exceed <object> me <in> fast",
  },
  {
    title: "More than",
    english: "I have more money than you",
    transliteration: "<subject> money <of> me <verb> exceed <object> money <of> you",
  },
  {
    title: "Question",
    english: "Who is the strongest?",
    transliteration: "<subject> person _blank <verb (interrogative)> exceed <object> all <in> strong",
  },
];

// One geometry root; rank counts dimensions
export const geometry_examples: Example[] = [
  { title: "Point", english: "no dimensions", transliteration: "geometry rank_0" },
  { title: "Line", english: "one dimension", transliteration: "geometry rank_1" },
  { title: "Shape", english: "two dimensions", transliteration: "geometry rank_2" },
  { title: "Form", english: "three dimensions: a solid", transliteration: "geometry rank_3" },
  { title: "Straight line", english: "a plumb line", transliteration: "geometry rank_1 plumb" },
  { title: "Curve", english: "a round line", transliteration: "geometry rank_1 round" },
  { title: "Circle", english: "a round shape", transliteration: "geometry rank_2 round" },
  { title: "Polygon", english: "an angled shape", transliteration: "geometry rank_2 angle" },
  { title: "Sphere", english: "a round form", transliteration: "geometry rank_3 round" },
  {
    title: "A sentence",
    english: "Earth is a sphere",
    transliteration: "<subject> celestial rank_2 this <verb> is <object> geometry rank_3 round",
  },
];

// thing, the general noun; animal; and matter, whose rank is its phase
export const thing_examples: Example[] = [
  { title: "Something", english: "something", transliteration: "thing" },
  { title: "Everything", english: "everything", transliteration: "thing all" },
  { title: "Nothing", english: "nothing", transliteration: "thing none" },
  {
    title: "What thing",
    english: "What thing do you want?",
    transliteration: "<subject> you <verb (interrogative)> desire <object> thing _blank",
  },
  { title: "Animal", english: "an animal", transliteration: "animal" },
  { title: "Young animal", english: "an animal's child", transliteration: "animal child" },
  {
    title: "Animals eat",
    english: "The animal eats food",
    transliteration: "<subject> animal <verb> eat <object> _ee eat",
  },
  { title: "Solid", english: "rank 0", transliteration: "matter rank_0" },
  { title: "Liquid", english: "rank 1", transliteration: "matter rank_1" },
  { title: "Gas", english: "rank 2", transliteration: "matter rank_2" },
  { title: "Plasma", english: "rank 3", transliteration: "matter rank_3" },
  { title: "Ice", english: "solid water", transliteration: "water matter rank_0" },
  { title: "Steam", english: "water as a gas", transliteration: "water matter rank_2" },
  {
    title: "A sentence",
    english: "Water is a liquid",
    transliteration: "<subject> water <verb> is <object> matter rank_1",
  },
];

// Pointing words: this, that and _blank with a preposition or a general noun
export const pointing_examples: Example[] = [
  { title: "Here", english: "I sleep here", transliteration: "<subject> I <verb> sleep(v) <at> this" },
  { title: "There", english: "You work there", transliteration: "<subject> you <verb> work(v) <at> that" },
  { title: "Where", english: "Where do you sleep?", transliteration: "<subject> you <verb (interrogative)> sleep(v) <at> _blank" },
  { title: "Come here", english: "Come here!", transliteration: "<verb (prescriptive)> come(v) <to> this" },
  { title: "From there", english: "I came from there", transliteration: "<subject> I <verb> come(v) formerly <from> that" },
  { title: "This place", english: "This place is big", transliteration: "<subject> place this <verb> is <object> big" },
  { title: "That person", english: "that person", transliteration: "person that" },
  { title: "Which person", english: "Which person left?", transliteration: "<subject> person _blank <verb (interrogative)> go(v)" },
  { title: "This thing", english: "I want this thing", transliteration: "<subject> I <verb> desire <object> thing this" },
];

// Subclauses: one bracket, clause_start ... clause_end, as an object, after a preposition, or
// after a noun with _blank marking the noun's place
export const clause_examples: Example[] = [
  {
    title: "That…",
    english: "I believe the person left",
    transliteration: "<subject> I <verb> believe <object> clause_start <subject> person <verb> go(v)",
  },
  {
    title: "To…",
    english: "I want to sleep (the subclause takes my subject)",
    transliteration: "<subject> I <verb> desire <object> clause_start <verb> sleep(v)",
  },
  {
    title: "Because",
    english: "I'm tired because I worked",
    transliteration:
      "<subject> I <verb> is <object> weak <from> clause_start <subject> I <verb> work(v) formerly",
  },
  {
    title: "When",
    english: "When you slept, I worked",
    transliteration:
      "<at> time clause_start <subject> you <verb> sleep(v) clause_end <subject> I <verb> work(v) formerly",
  },
  {
    title: "So that",
    english: "I work so that you can sleep",
    transliteration:
      "<subject> I <verb> work(v) <for> clause_start <subject> you <verb> sleep(v) not impossibly",
  },
  {
    title: "Until",
    english: "Work until the Sun rises",
    transliteration:
      "<verb (prescriptive)> work(v) <to> time clause_start <subject> celestial rank_3 this <verb> lift(v)",
  },
  {
    title: "If",
    english: "If it burns, put it out",
    transliteration:
      "if clause_start <subject> it <verb> burn(v) clause_end <verb (prescriptive)> extinguish(v) <object> it",
  },
  {
    title: "Who",
    english: "the person who defended me",
    transliteration: "person clause_start <subject> _blank <verb> defend(v) <object> me clause_end",
  },
  {
    title: "That (object)",
    english: "the rock that I burned",
    transliteration: "rock clause_start <subject> I <verb> burn(v) formerly <object> _blank clause_end",
  },
  {
    title: "Where",
    english: "the place where I sleep",
    transliteration: "place clause_start <subject> I <verb> sleep(v) <at> _blank clause_end",
  },
  {
    title: "To whom",
    english: "the person I gave money to",
    transliteration:
      "person clause_start <subject> I <verb> give(v) formerly <object> money <to> _blank clause_end",
  },
  {
    title: "In a sentence",
    english: "The person who defended me is strong",
    transliteration:
      "<subject> person clause_start <subject> _blank <verb> defend(v) <object> me clause_end <verb> is <object> strong",
  },
];

// One cardinal root; rank counts quarter turns clockwise from north
export const direction_examples: Example[] = [
  { title: "North", english: "rank 0", transliteration: "cardinal rank_0" },
  { title: "East", english: "rank 1: a quarter turn", transliteration: "cardinal rank_1" },
  { title: "South", english: "rank 2: a half turn", transliteration: "cardinal rank_2" },
  { title: "West", english: "rank 3", transliteration: "cardinal rank_3" },
  {
    title: "Northward",
    english: "Go north",
    transliteration: "<verb (prescriptive)> go(v) <to> cardinal rank_0",
  },
  {
    title: "In the east",
    english: "The Sun rises in the east",
    transliteration: "<subject> celestial rank_3 this <verb> lift(v) <at> cardinal rank_1",
  },
  {
    title: "Where from",
    english: "I came from the south",
    transliteration: "<subject> I <verb> come(v) formerly <from> cardinal rank_2",
  },
];

// Arithmetic: count takes rank for the operation and negative for its inverse; <by> gives the amount
export const arithmetic_examples: Example[] = [
  { title: "Count", english: "Count to ten", transliteration: "<verb (prescriptive)> count(v) <to> number 1 0" },
  { title: "Count down", english: "Count down from ten", transliteration: "<verb (prescriptive)> count_down(v) <from> number 1 0" },
  { title: "Add", english: "Add 2 to 5", transliteration: "<verb (prescriptive)> count(v) rank_1 <object> number 5 <by> number 2" },
  {
    title: "Subtract",
    english: "Subtract 2 from 5",
    transliteration: "<verb (prescriptive)> count_down(v) rank_1 <object> number 5 <by> number 2",
  },
  { title: "Multiply", english: "Multiply 5 by 2", transliteration: "<verb (prescriptive)> count(v) rank_2 <object> number 5 <by> number 2" },
  { title: "Divide", english: "Divide 6 by 3", transliteration: "<verb (prescriptive)> count_down(v) rank_2 <object> number 6 <by> number 3" },
  { title: "Power", english: "Square 5", transliteration: "<verb (prescriptive)> count(v) rank_3 <object> number 5 <by> number 2" },
  {
    title: "Root",
    english: "Take the square root of 9",
    transliteration: "<verb (prescriptive)> count_down(v) rank_3 <object> number 9 <by> number 2",
  },
  {
    title: "Logarithm",
    english: "The rank of 1000 is 3",
    transliteration: "<subject> rank <of> number 1 rank_3 <verb> equal <object> number 3",
  },
  {
    title: "A sentence",
    english: "If you add 2 to 3, you get 5",
    transliteration:
      "if clause_start <subject> you <verb> count(v) rank_1 <object> number 3 <by> number 2 clause_end <subject> you <verb> possess <object> number 5",
  },
];

// Universal Declaration of Human Rights

export const udhr_preamble: string[] = [
  "Whereas recognition of the inherent dignity and of the equal and inalienable rights of all members of the human family is the foundation of freedom, justice and peace in the world,",
  "Whereas disregard and contempt for human rights have resulted in barbarous acts which have outraged the conscience of mankind, and the advent of a world in which human beings shall enjoy freedom of speech and belief and freedom from fear and want has been proclaimed as the highest aspiration of the common people,",
  "Whereas it is essential, if man is not to be compelled to have recourse, as a last resort, to rebellion against tyranny and oppression, that human rights should be protected by the rule of law,",
  "Whereas it is essential to promote the development of friendly relations between nations,",
  "Whereas the peoples of the United Nations have in the Charter reaffirmed their faith in fundamental human rights, in the dignity and worth of the human person and in the equal rights of men and women and have determined to promote social progress and better standards of life in larger freedom,",
  "Whereas Member States have pledged themselves to achieve, in co-operation with the United Nations, the promotion of universal respect for and observance of human rights and fundamental freedoms,",
  "Whereas a common understanding of these rights and freedoms is of the greatest importance for the full realization of this pledge,",
  "Now, therefore,",
  "The General Assembly,",
  "Proclaims this Universal Declaration of Human Rights as a common standard of achievement for all peoples and all nations, to the end that every individual and every organ of society, keeping this Declaration constantly in mind, shall strive by teaching and education to promote respect for these rights and freedoms and by progressive measures, national and international, to secure their universal and effective recognition and observance, both among the peoples of Member States themselves and among the peoples of territories under their jurisdiction.",
];

export const udhr_articles: Article[] = [
  {
    title: "Article 1",
    english: [
      "All human beings are born free and equal in dignity and rights. They are endowed with reason and conscience and should act towards one another in a spirit of brotherhood.",
    ],
    transliteration:
      "<subject> person all <verb?> is <predicate adj> free and equal <in> value and privilege. <subject> it all <verb> possess <object> reason and conscience? and <verb (prescriptive)> do <for> other and <in> manner family?. ??",
  },
  {
    title: "Article 2",
    english: [
      "Everyone is entitled to all the rights and freedoms set forth in this Declaration, without distinction of any kind, such as race, colour, sex, language, religion, political or other opinion, national or social origin, property, birth or other status. Furthermore, no distinction shall be made on the basis of the political, jurisdictional or international status of the country or territory to which a person belongs, whether it be independent, trust, non-self-governing or under any other limitation of sovereignty.",
    ],
  },
  {
    title: "Article 3",
    english: ["Everyone has the right to life, liberty and security of person."],
    transliteration:
      "<subject> person all <verb> possess <object> right of life and freedom and safety.",
  },
  {
    title: "Article 4",
    english: [
      "No one shall be held in slavery or servitude; slavery and the slave trade shall be prohibited in all their forms.",
    ],
    transliteration:
      "<subject> person none <verb (prescriptive)> is <object> _ee force(v). <object> _gerund force(v) and trade _ee force(v) <in> geometry rank_2 all <verb (prescriptive)> forbid.",
  },
  {
    title: "Article 5",
    english: [
      "No one shall be subjected to torture or to cruel, inhuman or degrading treatment or punishment.",
    ],
    transliteration:
      "<object> person none <verb (prescriptive)> torment(v) or trivialize(v).",
  },
  {
    title: "Article 6",
    english: ["Everyone has the right to recognition everywhere as a person before the law."],
    transliteration:
      "<subject> person all <verb> possess <object> right of _gerund know(v) <as> person by law.",
  },
  {
    title: "Article 7",
    english: [
      "All are equal before the law and are entitled without any discrimination to equal protection of the law. All are entitled to equal protection against any discrimination in violation of this Declaration and against any incitement to such discrimination.",
    ],
  },
  {
    title: "Article 8",
    english: [
      "Everyone has the right to an effective remedy by the competent national tribunals for acts violating the fundamental rights granted him by the constitution or by law.",
    ],
  },
  {
    title: "Article 9",
    english: ["No one shall be subjected to arbitrary arrest, detention or exile."],
    transliteration:
      "<object> person none <verb (prescriptive)> constrain(v) or eject(v) randomly.",
  },
  {
    title: "Article 10",
    english: [
      "Everyone is entitled in full equality to a fair and public hearing by an independent and impartial tribunal, in the determination of his rights and obligations and of any criminal charge against him.",
    ],
  },
  {
    title: "Article 11",
    english: [
      "Everyone charged with a penal offence has the right to be presumed innocent until proved guilty according to law in a public trial at which he has had all the guarantees necessary for his defence.",
      "No one shall be held guilty of any penal offence on account of any act or omission which did not constitute a penal offence, under national or international law, at the time when it was committed. Nor shall a heavier penalty be imposed than the one that was applicable at the time the penal offence was committed.",
    ],
  },
  {
    title: "Article 12",
    english: [
      "No one shall be subjected to arbitrary interference with his privacy, family, home or correspondence, nor to attacks upon his honour and reputation. Everyone has the right to the protection of the law against such interference or attacks.",
    ],
  },
  {
    title: "Article 13",
    english: [
      "Everyone has the right to freedom of movement and residence within the borders of each state.",
      "Everyone has the right to leave any country, including his own, and to return to his country.",
    ],
  },
  {
    title: "Article 14",
    english: [
      "Everyone has the right to seek and to enjoy in other countries asylum from persecution.",
      "This right may not be invoked in the case of prosecutions genuinely arising from non-political crimes or from acts contrary to the purposes and principles of the United Nations.",
    ],
  },
  {
    title: "Article 15",
    english: [
      "Everyone has the right to a nationality.",
      "No one shall be arbitrarily deprived of his nationality nor denied the right to change his nationality.",
    ],
  },
  {
    title: "Article 16",
    english: [
      "Men and women of full age, without any limitation due to race, nationality or religion, have the right to marry and to found a family. They are entitled to equal rights as to marriage, during marriage and at its dissolution.",
      "Marriage shall be entered into only with the free and full consent of the intending spouses.",
      "The family is the natural and fundamental group unit of society and is entitled to protection by society and the State.",
    ],
  },
  {
    title: "Article 17",
    english: [
      "Everyone has the right to own property alone as well as in association with others.",
      "No one shall be arbitrarily deprived of his property.",
    ],
  },
  {
    title: "Article 18",
    english: [
      "Everyone has the right to freedom of thought, conscience and religion; this right includes freedom to change his religion or belief, and freedom, either alone or in community with others and in public or private, to manifest his religion or belief in teaching, practice, worship and observance.",
    ],
  },
  {
    title: "Article 19",
    english: [
      "Everyone has the right to freedom of opinion and expression; this right includes freedom to hold opinions without interference and to seek, receive and impart information and ideas through any media and regardless of frontiers.",
    ],
  },
  {
    title: "Article 20",
    english: [
      "Everyone has the right to freedom of peaceful assembly and association.",
      "No one may be compelled to belong to an association.",
    ],
  },
  {
    title: "Article 21",
    english: [
      "Everyone has the right to take part in the government of his country, directly or through freely chosen representatives.",
      "Everyone has the right of equal access to public service in his country.",
      "The will of the people shall be the basis of the authority of government; this will shall be expressed in periodic and genuine elections which shall be by universal and equal suffrage and shall be held by secret vote or by equivalent free voting procedures.",
    ],
  },
  {
    title: "Article 22",
    english: [
      "Everyone, as a member of society, has the right to social security and is entitled to realization, through national effort and international co-operation and in accordance with the organization and resources of each State, of the economic, social and cultural rights indispensable for his dignity and the free development of his personality.",
    ],
  },
  {
    title: "Article 23",
    english: [
      "Everyone has the right to work, to free choice of employment, to just and favourable conditions of work and to protection against unemployment.",
      "Everyone, without any discrimination, has the right to equal pay for equal work.",
      "Everyone who works has the right to just and favourable remuneration ensuring for himself and his family an existence worthy of human dignity, and supplemented, if necessary, by other means of social protection.",
      "Everyone has the right to form and to join trade unions for the protection of his interests.",
    ],
  },
  {
    title: "Article 24",
    english: [
      "Everyone has the right to rest and leisure, including reasonable limitation of working hours and periodic holidays with pay.",
    ],
  },
  {
    title: "Article 25",
    english: [
      "Everyone has the right to a standard of living adequate for the health and well-being of himself and of his family, including food, clothing, housing and medical care and necessary social services, and the right to security in the event of unemployment, sickness, disability, widowhood, old age or other lack of livelihood in circumstances beyond his control.",
      "Motherhood and childhood are entitled to special care and assistance. All children, whether born in or out of wedlock, shall enjoy the same social protection.",
    ],
  },
  {
    title: "Article 26",
    english: [
      "Everyone has the right to education. Education shall be free, at least in the elementary and fundamental stages. Elementary education shall be compulsory. Technical and professional education shall be made generally available and higher education shall be equally accessible to all on the basis of merit.",
      "Education shall be directed to the full development of the human personality and to the strengthening of respect for human rights and fundamental freedoms. It shall promote understanding, tolerance and friendship among all nations, racial or religious groups, and shall further the activities of the United Nations for the maintenance of peace.",
      "Parents have a prior right to choose the kind of education that shall be given to their children.",
    ],
  },
  {
    title: "Article 27",
    english: [
      "Everyone has the right freely to participate in the cultural life of the community, to enjoy the arts and to share in scientific advancement and its benefits.",
      "Everyone has the right to the protection of the moral and material interests resulting from any scientific, literary or artistic production of which he is the author.",
    ],
  },
  {
    title: "Article 28",
    english: [
      "Everyone is entitled to a social and international order in which the rights and freedoms set forth in this Declaration can be fully realized.",
    ],
  },
  {
    title: "Article 29",
    english: [
      "Everyone has duties to the community in which alone the free and full development of his personality is possible.",
      "In the exercise of his rights and freedoms, everyone shall be subject only to such limitations as are determined by law solely for the purpose of securing due recognition and respect for the rights and freedoms of others and of meeting the just requirements of morality, public order and the general welfare in a democratic society.",
      "These rights and freedoms may in no case be exercised contrary to the purposes and principles of the United Nations.",
    ],
  },
  {
    title: "Article 30",
    english: [
      "Nothing in this Declaration may be interpreted as implying for any State, group or person any right to engage in any activity or to perform any act aimed at the destruction of any of the rights and freedoms set forth herein.",
    ],
  },
];

export type Token =
  | { kind: "punctuation"; text: string }
  | {
      kind: "word";
      text: string; // as written in the transliteration
      uncertain: boolean; // marked with "?" in the transliteration
      word?: Word;
      candidate?: Candidate;
    };

// Transliteration spellings that don't match a dictionary name directly
const ALIASES: Record<string, string> = {
  i: "pronoun(first_person)",
  me: "pronoun(first_person)",
  you: "pronoun(second_person)",
  it: "pronoun(third_person)",
};

function lookup(name: string): Pick<Extract<Token, { kind: "word" }>, "word" | "candidate"> {
  const key = ALIASES[name] ?? name;
  // Verbs are named with a (v) suffix, e.g. possess(v), and can be found by either gloss (die, kill)
  const word =
    dictionary.get(key) ??
    dictionary.get(`_${key}`) ??
    dictionary.get(`${key}(v)`) ??
    verb_glosses.get(key);
  if (word) return { word };
  if (/^\d+$/.test(key)) return { word: dictionary.get(`digit_${key}`) };
  const candidate = candidates.find((c) => c.word === key || c.word === `_${key}`);
  return candidate ? { candidate } : {};
}

// Splits a transliteration into words, grammar markers and punctuation, and looks each one up.
// Two-word names (number) are tried before single words.
export function tokenize(transliteration: string): Token[] {
  const raw = transliteration.match(/<[^>]+>|[\w'()-]+\??|\?\?|[.,;]/g) ?? [];
  const tokens: Token[] = [];
  for (let i = 0; i < raw.length; i++) {
    const text = raw[i]!;
    if (/^[.,;]$/.test(text) || text === "??") {
      tokens.push({ kind: "punctuation", text });
      continue;
    }
    const uncertain = /\?>?$/.test(text);
    const name = text
      .replace(/^<|>$/g, "")
      .replace(/\?$/, "")
      .toLowerCase()
      .replace(/\s*\(\s*/, "(")
      .replace(/\s*\)/, ")")
      .replace(/\s+/g, "_");
    const next = raw[i + 1];
    if (next && /^[\w-]+$/.test(next) && !text.startsWith("<")) {
      const pair = lookup(`${name}_${next.toLowerCase()}`);
      if (pair.word || pair.candidate) {
        tokens.push({ kind: "word", text: `${text} ${next}`, uncertain, ...pair });
        i++;
        continue;
      }
    }
    tokens.push({ kind: "word", text, uncertain, ...lookup(name) });
  }
  return tokens;
}
