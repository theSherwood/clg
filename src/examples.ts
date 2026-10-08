import { type Candidate, type Word, candidates, dictionary } from "./dict";

// Worked examples: English with a draft transliteration. Transliterations are written in English
// glosses; <...> marks grammar markers, e.g. <subject>, <verb_prescriptive>, <ee>. Prepositions
// are written bare: to, in, at.

export type Example = { title: string; english: string; transliteration: string };

export type Article = { title: string; english: string[]; transliteration?: string };

// Numbers in each base. The base comes from context; here, the heading. A rank after a digit
// gives that digit's place. By convention the ranks
// work like commas, every three places in base 10 and every four in bases 2 and 16: a base 10
// number past <rank_3> says <rank_3>, one past <rank_6> says <rank_6>, and so on, skipping groups that are
// all zeros. Long numbers end with <rank_0> even where it could be dropped.
export type NumberBase = { title: string; examples: Example[] };

export const number_examples: NumberBase[] = [
  {
    title: "Base 10",
    examples: [
      {
        title: "7",
        english: "A lone number drops its final <rank_0>",
        transliteration: "number 7",
      },
      {
        title: "1003",
        english: "Places a rank jumps over are zeros",
        transliteration: "number 1 <rank_3> 3",
      },
      { title: "10,000", english: "Like “ten thousand”", transliteration: "number 1 0 <rank_3>" },
      {
        title: "120,034",
        english: "120 thousand 34",
        transliteration: "number 1 2 0 <rank_3> 3 4",
      },
      {
        title: "34,103,487",
        english: "34 million 103 thousand 487",
        transliteration: "number 3 4 <rank_6> 1 0 3 <rank_3> 4 8 7 <rank_0>",
      },
      {
        title: "1,000,000",
        english: "The empty thousands group is skipped",
        transliteration: "number 1 <rank_6>",
      },
      {
        title: "2,004,000",
        english: "2 million 4 thousand",
        transliteration: "number 2 <rank_6> 4 <rank_3>",
      },
      {
        title: "three big people",
        english: "<rank_0> is needed here: big shares its sound with a digit",
        transliteration: "person number 3 <rank_0> big",
      },
      {
        title: "three small people",
        english: "<rank_0> is needed here too: negative could start a negative rank",
        transliteration: "person number 3 <rank_0> small",
      },
      {
        title: "0.3",
        english: "A negative rank ends the number too",
        transliteration: "number 3 <negative> <rank_1>",
      },
      { title: "23%", english: "0.23", transliteration: "number 2 3 <negative> <rank_2>" },
      {
        title: "3e139",
        english: "Past <rank_15>, rank takes a subclause holding the place",
        transliteration: "number 3 rank <clause_start> number 1 3 9 <clause_end>",
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
        transliteration: "number 2 0 8 <rank_4> 6 0 11 15 <rank_0>",
      },
      { title: "65,535", english: "FFFF", transliteration: "number 15 15 15 15" },
      { title: "65,536", english: "1,0000", transliteration: "number 1 <rank_4>" },
      {
        title: "4,294,967,295",
        english: "FFFF,FFFF: the largest 32-bit number",
        transliteration: "number 15 15 15 15 <rank_4> 15 15 15 15 <rank_0>",
      },
      { title: "1/16", english: "0.1", transliteration: "number 1 <negative> <rank_1>" },
    ],
  },
  {
    title: "Base 2",
    examples: [
      { title: "5", english: "101", transliteration: "number 1 0 1" },
      {
        title: "1003",
        english: "11,1110,1011",
        transliteration: "number 1 1 <rank_8> 1 1 1 0 <rank_4> 1 0 1 1 <rank_0>",
      },
      { title: "1024", english: "100,0000,0000", transliteration: "number 1 0 0 <rank_8>" },
      {
        title: "65,535",
        english: "1111,1111,1111,1111: the largest number the rank roots reach in base 2",
        transliteration:
          "number 1 1 1 1 <rank_12> 1 1 1 1 <rank_8> 1 1 1 1 <rank_4> 1 1 1 1 <rank_0>",
      },
      { title: "1/2", english: "0.1", transliteration: "number 1 <negative> <rank_1>" },
    ],
  },
];

// Tense is unmarked by default. A time adverb after the verb places it in time, graded by the
// axis scale, and the aspect words say whether it's ongoing or done.
export const tense_examples: Example[] = [
  {
    title: "No tense",
    english: "I sleep / I slept / I will sleep, from context",
    transliteration: "<subject> I <verb> sleep(vi)",
  },
  {
    title: "Past",
    english: "I slept",
    transliteration: "<subject> I <verb> sleep(vi) formerly",
  },
  {
    title: "Future",
    english: "I will sleep",
    transliteration: "<subject> I <verb> sleep(vi) henceforth",
  },
  {
    title: "Hesitation",
    english: "I, um, slept",
    transliteration: "<subject> I <verb> <filler> sleep(vi) formerly",
  },
  {
    title: "Continuous",
    english: "I'm sleeping (or was, or will be)",
    transliteration: "<subject> I <verb> sleep(vi) <continuous_tense_aspect>",
  },
  {
    title: "Past continuous",
    english: "I was sleeping",
    transliteration: "<subject> I <verb> sleep(vi) <continuous_tense_aspect> formerly",
  },
  {
    title: "Perfect",
    english: "The person has learned the way",
    transliteration: "<subject> person <verb> learn(vt) <perfect_tense_aspect> <object> path",
  },
  {
    title: "Future perfect",
    english: "The person will have learned the way",
    transliteration: "<subject> person <verb> learn(vt) <perfect_tense_aspect> henceforth <object> path",
  },
  {
    title: "Perfect continuous",
    english: "I have been working",
    transliteration: "<subject> I <verb> work(vi) <continuous_tense_aspect> <perfect_tense_aspect>",
  },
  {
    title: "Remote past",
    english: "The person died long ago",
    transliteration: "<subject> person <verb> die(vi) <max_negative> henceforth",
  },
  {
    title: "Recent past",
    english: "The person just left",
    transliteration: "<subject> person <verb> go(vi) <min_negative> henceforth",
  },
  {
    title: "Near future",
    english: "I'll give you money soon",
    transliteration: "<subject> I <verb> give(vt) <min_positive> henceforth <object> money to you",
  },
  {
    title: "Now",
    english: "Right now, I'm sleeping",
    transliteration: "<subject> I <verb> sleep(vi) <continuous_tense_aspect> <neutral> henceforth",
  },
  {
    title: "Time carries over",
    english: "Long ago, a person gave money. They left. (both past)",
    transliteration:
      "<subject> person <verb> give(vt) <max_negative> henceforth <object> money. <subject> it <verb> go(vi).",
  },
];

// The truth axis grades likelihood, as an adverb after the verb. The modality axis is separate:
// how many cases something holds in.
// Units of time are rungs of a ladder on time's rank; next and previous count steps from now
export const time_examples: Example[] = [
  { title: "Second", english: "A second", transliteration: "time <rank_0>" },
  { title: "Hour", english: "An hour", transliteration: "time <rank_2>" },
  { title: "Day", english: "A day (24 hours)", transliteration: "time <rank_3>" },
  { title: "Daytime", english: "Daytime, as against night", transliteration: "time bright" },
  { title: "Night", english: "Night", transliteration: "time dark" },
  { title: "Year", english: "A year", transliteration: "time <rank_6>" },
  { title: "Counted", english: "Three days", transliteration: "time <rank_3> number 3" },
  { title: "Today", english: "Today", transliteration: "time <rank_3> this" },
  {
    title: "Yesterday",
    english: "I slept yesterday",
    transliteration: "<subject> I <verb> sleep(vi) at yesterday",
  },
  {
    title: "Tomorrow",
    english: "I will work tomorrow",
    transliteration: "<subject> I <verb> work(vi) at tomorrow",
  },
  {
    title: "Two steps",
    english: "The day after tomorrow",
    transliteration: "time <rank_3> next <rank_2>",
  },
  { title: "Next year", english: "Next year", transliteration: "time <rank_6> next" },
  { title: "Every day", english: "Every day", transliteration: "time <rank_3> all" },
  {
    title: "Relative",
    english: "She said she would come the next day",
    transliteration:
      "<subject> it <verb> say(vt) formerly <object> <verb> come(vi) at tomorrow",
  },
  {
    title: "Precede",
    english: "Eating comes before sleeping",
    transliteration: "<subject> <gerund> eat(vt) <verb> precede(vt) <object> <gerund> sleep(vi)",
  },
  {
    title: "Follow",
    english: "I'm after you (in line)",
    transliteration: "<subject> I <verb> follow(vt) <object> you",
  },
  {
    title: "The next one",
    english: "The next person came",
    transliteration: "<subject> person next <verb> come(vi) formerly",
  },
];

export const truth_examples: Example[] = [
  {
    title: "Certainly",
    english: "The person certainly died",
    transliteration: "<subject> person <verb> die(vi) <max_positive> truly",
  },
  {
    title: "Plain",
    english: "The person died",
    transliteration: "<subject> person <verb> die(vi)",
  },
  {
    title: "Probably",
    english: "The person probably died",
    transliteration: "<subject> person <verb> die(vi) <min_positive> truly",
  },
  {
    title: "Maybe",
    english: "Maybe the person left",
    transliteration: "<subject> person <verb> go(vi) <neutral> truly",
  },
  {
    title: "Probably not",
    english: "The person probably didn't leave",
    transliteration: "<subject> person <verb> go(vi) <min_negative> truly",
  },
  {
    title: "Proved",
    english: "The person has proved it",
    transliteration: "<subject> person <verb> prove(vt) <perfect_tense_aspect> <object> it",
  },
  {
    title: "Belief and likelihood",
    english: "I believe the person probably left",
    transliteration:
      "<subject> I <verb> believe(vt) <object> <subject> person <verb> go(vi) <min_positive> truly <clause_end>",
  },
  {
    title: "Necessary",
    english: "Everyone necessarily dies",
    transliteration: "<subject> everyone <verb> die(vi) necessarily",
  },
  {
    title: "Possible",
    english: "A person can learn: it's not impossible",
    transliteration: "<subject> person <verb> learn(vi) not impossibly",
  },
  {
    title: "Contingent",
    english: "The person dies, but not necessarily",
    transliteration: "<subject> person <verb> die(vi) <neutral> necessarily",
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
  { title: "Aunt or uncle", english: "a lesser parent", transliteration: "<min_negative> child" },
  { title: "Sibling", english: "the same generation", transliteration: "<neutral> child" },
  { title: "Niece or nephew", english: "a lesser child", transliteration: "<min_positive> child" },
  { title: "Descendants", english: "the whole line down", transliteration: "<max_positive> child" },
  { title: "Ancestors", english: "the whole line up", transliteration: "<max_negative> child" },
  { title: "Grandchild", english: "two generations down", transliteration: "child <rank_2>" },
  { title: "Born", english: "I was born", transliteration: "<subject> I <verb> be_born(vi) formerly" },
  { title: "Reproduce", english: "Animals reproduce", transliteration: "<subject> animal <verb> reproduce(vi)" },
  { title: "Spouse", english: "family by union", transliteration: "family united" },
  { title: "Mother-in-law", english: "a spouse's mother", transliteration: "parent female of spouse" },
  { title: "Grandparent", english: "two generations up", transliteration: "parent <rank_2>" },
  {
    title: "First cousin",
    english: "a shared grandparent, two generations up",
    transliteration: "<neutral> child <rank_2>",
  },
  {
    title: "Second cousin",
    english: "a shared great-grandparent",
    transliteration: "<neutral> child <rank_3>",
  },
  {
    title: "First cousin once removed",
    english: "a parent's first cousin",
    transliteration: "<neutral> child <rank_2> of parent",
  },
  {
    title: "A family sentence",
    english: "My grandparent has many descendants",
    transliteration:
      "<subject> grandparent of me <verb> possess(vt) <object> <max_positive> child many",
  },
];

// Three hue roots; other hues mix by modifying, and lightness comes from the brightness axis
export const color_examples: Example[] = [
  { title: "Orange", english: "red and yellow, evenly", transliteration: "red yellow" },
  { title: "Green", english: "yellow and blue, evenly", transliteration: "yellow blue" },
  { title: "Purple", english: "red and blue, evenly", transliteration: "red blue" },
  { title: "Pink", english: "a light red", transliteration: "red bright" },
  { title: "Maroon", english: "a dark red", transliteration: "red dark" },
  { title: "White", english: "the bright end of the brightness axis", transliteration: "bright" },
  { title: "Black", english: "the dark end", transliteration: "dark" },
  { title: "Gray", english: "the color between", transliteration: "color <neutral> bright" },
  { title: "Brown", english: "the neutral color", transliteration: "color <neutral>" },
  { title: "A brown rock", english: "a big brown rock", transliteration: "rock big color <neutral>" },
  {
    title: "A sentence",
    english: "The rock is orange",
    transliteration: "<subject> rock <verb> be(vt) <complement> orange",
  },
];

// Nouns from verbs: who does it, what it's done to, what it's done with, and where
export const role_examples: Example[] = [
  { title: "Teacher", english: "whoever teaches", transliteration: "<er> educate(vt)" },
  { title: "Food", english: "what's eaten", transliteration: "<ee> eat(vt)" },
  { title: "Seed", english: "what's sown", transliteration: "<ee> sow(vt)" },
  { title: "Key", english: "what you open with", transliteration: "<tool> open(vt)" },
  { title: "Weapon", english: "what you fight with", transliteration: "<tool> fight(vt)" },
  { title: "Shovel", english: "what you dig with", transliteration: "<tool> dig(vt)" },
  { title: "Tool", english: "what you do things with", transliteration: "<tool> do(vt)" },
  { title: "Ear", english: "what you hear with", transliteration: "<tool> hear(vt)" },
  { title: "Eye", english: "what you see with", transliteration: "<tool> see(vt)" },
  { title: "Word", english: "what's said", transliteration: "<ee> say(vt)" },
  { title: "Quotation", english: "what's quoted", transliteration: "<ee> quote(vt)" },
  { title: "Text", english: "what's written", transliteration: "<ee> write(vt)" },
  { title: "Reader", english: "whoever reads", transliteration: "<er> read(vi)" },
  { title: "Mark", english: "a lesser writing", transliteration: "<min_positive> write(vi)" },
  { title: "Bed", english: "where you sleep", transliteration: "<place> sleep(vi)" },
  { title: "Birthplace", english: "where you came to life", transliteration: "<place> come_to_life(vi)" },
  { title: "School", english: "where you learn", transliteration: "<place> learn(vi)" },
  { title: "Shop", english: "where you buy", transliteration: "<place> shop(vi)" },
  { title: "Desk", english: "where you work: a desk, or a workplace", transliteration: "<place> work(vi)" },
  { title: "Chair", english: "where you sit", transliteration: "<place> sit(vi)" },
  { title: "Table", english: "where you eat", transliteration: "<place> eat(vt)" },
  { title: "Sender", english: "whoever sends", transliteration: "<er> send(vi)" },
  { title: "Package", english: "what's sent", transliteration: "<ee> send(vt)" },
  { title: "Addressee", english: "whom it's sent to", transliteration: "<to> send(vt)" },
  { title: "Recipient", english: "whom it's given to", transliteration: "<to> give(vt)" },
  { title: "Destination", english: "where you go", transliteration: "<to> go(vi)" },
  { title: "Origin", english: "where you come from", transliteration: "<from> come(vi)" },
  { title: "Source", english: "what you learn from", transliteration: "<from> learn(vt)" },
  { title: "Material", english: "what something is created from", transliteration: "<from> create(vt)" },
  {
    title: "A sentence",
    english: "I send you money",
    transliteration: "<subject> I <verb> send(vt) <object> money to you",
  },
];

// Questions: <blank> stands for what's asked, in whatever role or phrase it's asked about
export const question_examples: Example[] = [
  { title: "Yes or no", english: "Do you sleep?", transliteration: "<subject> you <verb_interrogative> sleep(vi)" },
  {
    title: "Who",
    english: "Who killed the person?",
    transliteration: "<subject> who <verb_interrogative> kill(vt) <object> person",
  },
  {
    title: "What",
    english: "What do you eat?",
    transliteration: "<subject> you <verb_interrogative> eat(vt) <object> <blank>",
  },
  {
    title: "Where",
    english: "Where do you sleep?",
    transliteration: "<subject> you <verb_interrogative> sleep(vi) at <blank>",
  },
  {
    title: "Where to",
    english: "Where are you going?",
    transliteration: "<subject> you <verb_interrogative> go(vi) to <blank>",
  },
  {
    title: "Where from",
    english: "Where do you come from?",
    transliteration: "<subject> you <verb_interrogative> come(vi) from <blank>",
  },
  {
    title: "When",
    english: "When did the person die?",
    transliteration: "<subject> person <verb_interrogative> die(vi) at when",
  },
  {
    title: "Why",
    english: "Why do you fight?",
    transliteration: "<subject> you <verb_interrogative> fight(vi) for <blank>",
  },
  {
    title: "How",
    english: "How do you open it?",
    transliteration: "<subject> you <verb_interrogative> open(vt) <object> it by <blank>",
  },
  {
    title: "How many",
    english: "How many children do you have?",
    transliteration: "<subject> you <verb_interrogative> possess(vt) <object> child number <blank>",
  },
];

// self and other, and joining clauses with but
export const self_other_examples: Example[] = [
  { title: "Myself", english: "I know myself", transliteration: "<subject> I <verb> know(vt) <object> self" },
  {
    title: "Each other",
    english: "They love each other",
    transliteration: "<subject> they <verb> love(vt) <object> each_other",
  },
  {
    title: "One another",
    english: "Everyone should act towards one another",
    transliteration: "<subject> everyone <verb_prescriptive> act(vi) to each_other",
  },
  { title: "One's own", english: "one's own family", transliteration: "family of self" },
  { title: "Another", english: "another person", transliteration: "person other" },
  {
    title: "But",
    english: "I sleep, but you work",
    transliteration: "<subject> I <verb> sleep(vi) but <subject> you <verb> work(vi)",
  },
];

// Water, and fire: burn and quench are the max steps of heat
export const water_fire_examples: Example[] = [
  { title: "Water", english: "water", transliteration: "water" },
  { title: "Fire", english: "heat at its fullest (max_positive heat)", transliteration: "fire" },
  { title: "Drink", english: "I drink water", transliteration: "<subject> I <verb> eat(vt) <object> water" },
  { title: "Burn", english: "The land is burning", transliteration: "<subject> land <verb> burn(vi) <continuous_tense_aspect>" },
  {
    title: "Set on fire",
    english: "The person burns the rod",
    transliteration: "<subject> person <verb> burn(vt) <object> rod",
  },
  {
    title: "Put out",
    english: "Water puts out fire",
    transliteration: "<subject> water <verb> quench(vt) <object> fire",
  },
  {
    title: "Go out, but",
    english: "The fire went out, but the rock is hot",
    transliteration:
      "<subject> fire <verb> go_out(vi) formerly but <subject> rock <verb> be(vt) <complement> hot",
  },
];

// One celestial root; rank picks the level of the orbital hierarchy, and this makes it ours
export const sky_examples: Example[] = [
  { title: "Celestial body", english: "any body in the sky", transliteration: "celestial" },
  { title: "Small body", english: "rank 0: too small to be round", transliteration: "celestial <rank_0>" },
  { title: "Asteroid", english: "a rocky small body", transliteration: "celestial <rank_0> rock" },
  { title: "Comet", english: "an icy small body", transliteration: "celestial <rank_0> ice" },
  { title: "Moon", english: "rank 1: orbits a planet", transliteration: "celestial <rank_1>" },
  { title: "Planet", english: "rank 2: orbits a star", transliteration: "celestial <rank_2>" },
  { title: "Star", english: "rank 3", transliteration: "celestial <rank_3>" },
  { title: "Galaxy", english: "rank 4", transliteration: "celestial <rank_4>" },
  { title: "The Moon", english: "our moon", transliteration: "celestial <rank_1> this" },
  { title: "Earth", english: "our planet", transliteration: "celestial <rank_2> this" },
  { title: "The Sun", english: "our star", transliteration: "celestial <rank_3> this" },
  { title: "The Milky Way", english: "our galaxy", transliteration: "celestial <rank_4> this" },
  { title: "Sky", english: "the high place", transliteration: "place high" },
  { title: "Rain", english: "It's raining", transliteration: "<subject> rain <verb> sink(vi) <continuous_tense_aspect>" },
  { title: "Cloud", english: "the sky's covering", transliteration: "covering sky" },
  { title: "Many stars", english: "many stars", transliteration: "celestial <rank_3> many" },
  {
    title: "A sentence",
    english: "The Sun is bright",
    transliteration: "<subject> sun <verb> be(vt) <complement> bright",
  },
];

// Comparison is a relation verb, exceed; in names the quality compared
export const comparison_examples: Example[] = [
  {
    title: "Resemble",
    english: "The Moon resembles a rock",
    transliteration: "<subject> the_moon <verb> resemble(vt) <object> rock",
  },
  { title: "Same", english: "the same color", transliteration: "color same" },
  { title: "Opposite", english: "the opposite direction", transliteration: "cardinal opposite" },
  {
    title: "Cause",
    english: "The Sun causes daytime",
    transliteration: "<subject> sun <verb> cause(vt) <object> daytime",
  },
  {
    title: "Result",
    english: "Daytime results from the Sun",
    transliteration: "<subject> daytime <verb> result_from(vt) <object> sun",
  },
  {
    title: "Bigger than",
    english: "The rock is bigger than the person",
    transliteration: "<subject> rock <verb> exceed(vt) <object> person in big",
  },
  {
    title: "Smaller than",
    english: "The person is smaller than the rock",
    transliteration: "<subject> person <verb> fall_short_of(vt) <object> rock in big",
  },
  {
    title: "As big as",
    english: "The rock is as big as the person",
    transliteration: "<subject> rock <verb> equal(vt) <object> person in big",
  },
  {
    title: "Biggest",
    english: "The Sun is the biggest",
    transliteration: "<subject> sun <verb> exceed(vt) <object> all in big",
  },
  {
    title: "Much bigger",
    english: "The Sun is much bigger than Earth",
    transliteration:
      "<subject> sun <verb> <max_positive> exceed(vt) <object> earth in big",
  },
  {
    title: "Slightly faster",
    english: "You are slightly faster than me",
    transliteration: "<subject> you <verb> <min_positive> exceed(vt) <object> me in fast",
  },
  {
    title: "More than",
    english: "I have more money than you",
    transliteration: "<subject> money of me <verb> exceed(vt) <object> money of you",
  },
  {
    title: "Question",
    english: "Who is the strongest?",
    transliteration: "<subject> who <verb_interrogative> exceed(vt) <object> all in strong",
  },
];

// One geometry root; rank counts dimensions
export const geometry_examples: Example[] = [
  { title: "Point", english: "no dimensions", transliteration: "geometry <rank_0>" },
  { title: "Line segment", english: "one dimension, bounded", transliteration: "geometry <rank_1>" },
  { title: "Shape", english: "two dimensions", transliteration: "geometry <rank_2>" },
  { title: "Form", english: "three dimensions: a 3D structure", transliteration: "geometry <rank_3>" },
  { title: "Straight segment", english: "a plumb line segment", transliteration: "geometry <rank_1> plumb" },
  { title: "Curve", english: "a round line", transliteration: "geometry <rank_1> round" },
  { title: "Circle", english: "a round shape", transliteration: "geometry <rank_2> round" },
  { title: "Polygon", english: "an angular shape", transliteration: "geometry <rank_2> angular" },
  { title: "Infinite line", english: "a line through the first dimension", transliteration: "geometry <dimension_x>" },
  { title: "Plane", english: "space up through the second dimension", transliteration: "geometry <dimension_y>" },
  { title: "Space", english: "3D Euclidean space", transliteration: "geometry <dimension_z>" },
  { title: "Sphere", english: "a round form", transliteration: "geometry <rank_3> round" },
  { title: "Sequence", english: "nodes in a line", transliteration: "node <rank_1>" },
  { title: "Array", english: "an unbroken sequence", transliteration: "sequence continuous" },
  { title: "Linked list", english: "a sequence of separate, linked pieces", transliteration: "sequence discrete" },
  { title: "Grid", english: "a data table: a sequence in two dimensions", transliteration: "sequence <dimension_y>" },
  { title: "Tree", english: "a tree, as a graph", transliteration: "node <rank_2>" },
  { title: "Network", english: "a graph", transliteration: "node <rank_4>" },
  {
    title: "A sentence",
    english: "Earth is a sphere",
    transliteration: "<subject> earth <verb> be(vt) <complement> sphere",
  },
];

// thing, the general noun; animal; matter, whose rank is its phase; and the elements
export const thing_examples: Example[] = [
  { title: "Something", english: "something", transliteration: "thing" },
  { title: "Everything", english: "everything", transliteration: "thing all" },
  { title: "Nothing", english: "nothing", transliteration: "thing none" },
  {
    title: "What thing",
    english: "What thing do you want?",
    transliteration: "<subject> you <verb_interrogative> desire(vt) <object> what",
  },
  { title: "Animal", english: "an animal", transliteration: "animal" },
  { title: "Young animal", english: "an animal's child", transliteration: "animal child" },
  {
    title: "Animals eat",
    english: "The animal eats food",
    transliteration: "<subject> animal <verb> eat(vt) <object> food",
  },
  { title: "Solid", english: "rank 0", transliteration: "matter <rank_0>" },
  { title: "Liquid", english: "rank 1", transliteration: "matter <rank_1>" },
  { title: "Gas", english: "rank 2", transliteration: "matter <rank_2>" },
  { title: "Plasma", english: "rank 3", transliteration: "matter <rank_3>" },
  { title: "Ice", english: "solid water", transliteration: "water matter <rank_0>" },
  { title: "Steam", english: "water as a gas", transliteration: "water matter <rank_2>" },
  { title: "Lava", english: "molten rock", transliteration: "rock matter <rank_1>" },
  { title: "Air", english: "our gas", transliteration: "matter <rank_2> this" },
  {
    title: "A sentence",
    english: "Water is a liquid",
    transliteration: "<subject> water <verb> be(vt) <complement> liquid",
  },
  { title: "Melt", english: "The ice melts", transliteration: "<subject> ice <verb> melt(vi)" },
  {
    title: "Up a phase",
    english: "The water evaporated (melt, said of a liquid)",
    transliteration: "<subject> water <verb> melt(vi) formerly",
  },
  {
    title: "Target phase",
    english: "The water evaporated, explicitly",
    transliteration: "<subject> water <verb> evaporate(vi) formerly",
  },
  { title: "Element", english: "element 6, as a phrase", transliteration: "element 6" },
  { title: "Carbon", english: "the same, settled into one word", transliteration: "carbon" },
  { title: "Gold metal", english: "solid gold", transliteration: "gold matter <rank_0>" },
  {
    title: "Made of",
    english: "Water is from hydrogen and oxygen",
    transliteration: "<subject> water <verb> be(vt) <complement> from hydrogen and oxygen",
  },
  {
    title: "Condense",
    english: "Steam condenses on the wall",
    transliteration: "<subject> steam <verb> condense(vi) at wall",
  },
  {
    title: "With an object",
    english: "The sun melts the ice",
    transliteration: "<subject> sun <verb> melt(vt) <object> ice",
  },
  { title: "Freeze", english: "Freeze the water", transliteration: "<verb_prescriptive> freeze(vt) <object> water" },
];

// Pointing words: this, that and <blank> with a preposition or a general noun
export const pointing_examples: Example[] = [
  { title: "Here", english: "I sleep here", transliteration: "<subject> I <verb> sleep(vi) at this" },
  { title: "There", english: "You work there", transliteration: "<subject> you <verb> work(vi) at that" },
  { title: "Where", english: "Where do you sleep?", transliteration: "<subject> you <verb_interrogative> sleep(vi) at <blank>" },
  { title: "Come here", english: "Come here!", transliteration: "<verb_prescriptive> come(vi) to this" },
  { title: "From there", english: "I came from there", transliteration: "<subject> I <verb> come(vi) formerly from that" },
  { title: "This place", english: "This place is big", transliteration: "<subject> place this <verb> be(vt) <complement> big" },
  { title: "That person", english: "that person", transliteration: "person that" },
  { title: "Which person", english: "Which person left?", transliteration: "<subject> who <verb_interrogative> go(vi)" },
  { title: "This thing", english: "I want this thing", transliteration: "<subject> I <verb> desire(vt) <object> thing this" },
];

// Subclauses: one bracket, <clause_start> ... <clause_end>, as an object, after a preposition, or
// after a noun with <blank> marking the noun's place
export const clause_examples: Example[] = [
  {
    title: "A question inside",
    english: "I know who came",
    transliteration: "<subject> I <verb> know(vt) <object> <subject> <blank> <verb_interrogative> come(vi) formerly",
  },
  {
    title: "Between",
    english: "The child sleeps between the mother and the father",
    transliteration: "<subject> child <verb> sleep(vi) between mother and father",
  },
  {
    title: "With and by",
    english: "I opened it with my mother, with a key",
    transliteration: "<subject> I <verb> open(vt) formerly <object> it with mother of me by <tool> open(vt)",
  },
  {
    title: "Indirect speech",
    english: "She said she was weak",
    transliteration: "<subject> it <verb> say(vt) formerly <object> <subject> it <verb> be(vt) <complement> weak",
  },
  {
    title: "A quote",
    english: "She quoted her mother: “I'm weak”",
    transliteration: "<subject> it <verb> quote(vt) formerly from mother of it <object> <clause_start> <subject> I <verb> be(vt) <complement> weak <clause_end>",
  },
  {
    title: "Direct speech",
    english: "She said, “I'm weak”",
    transliteration: "<subject> it <verb> say_verbatim(vt) formerly <object> <clause_start> <subject> I <verb> be(vt) <complement> weak <clause_end>",
  },
  {
    title: "That…",
    english: "I believe the person left",
    transliteration: "<subject> I <verb> believe(vt) <object> <subject> person <verb> go(vi)",
  },
  {
    title: "To…",
    english: "I want to sleep (the subclause takes my subject)",
    transliteration: "<subject> I <verb> desire(vt) <object> <verb> sleep(vi)",
  },
  {
    title: "Because",
    english: "I'm tired because I worked",
    transliteration:
      "<subject> I <verb> be(vt) <complement> weak from <subject> I <verb> work(vi) formerly",
  },
  {
    title: "When",
    english: "When you slept, I worked",
    transliteration:
      "at time <clause_start> <subject> you <verb> sleep(vi) <clause_end> <subject> I <verb> work(vi) formerly",
  },
  {
    title: "So that",
    english: "I work so that you can sleep",
    transliteration:
      "<subject> I <verb> work(vi) for <subject> you <verb> sleep(vi) not impossibly",
  },
  {
    title: "Until",
    english: "Work until the Sun rises",
    transliteration:
      "<verb_prescriptive> work(vi) to time <clause_start> <subject> sun <verb> rise(vi)",
  },
  {
    title: "If",
    english: "If it burns, put it out",
    transliteration:
      "if <subject> it <verb> burn(vi) <clause_end> <verb_prescriptive> quench(vt) <object> it",
  },
  {
    title: "Who",
    english: "the person who defended me",
    transliteration: "person <clause_start> <subject> <blank> <verb> defend(vt) <object> me <clause_end>",
  },
  {
    title: "That (object)",
    english: "the rock that I burned",
    transliteration: "rock <clause_start> <subject> I <verb> burn(vt) formerly <object> <blank> <clause_end>",
  },
  {
    title: "Where",
    english: "the place where I sleep",
    transliteration: "place <clause_start> <subject> I <verb> sleep(vi) at <blank> <clause_end>",
  },
  {
    title: "To whom",
    english: "the person I gave money to",
    transliteration:
      "person <clause_start> <subject> I <verb> give(vt) formerly <object> money to <blank> <clause_end>",
  },
  {
    title: "In a sentence",
    english: "The person who defended me is strong",
    transliteration:
      "<subject> person <clause_start> <subject> <blank> <verb> defend(vt) <object> me <clause_end> <verb> be(vt) <complement> strong",
  },
];

// One cardinal root; rank counts quarter turns clockwise from north
export const direction_examples: Example[] = [
  { title: "North", english: "rank 0", transliteration: "cardinal <rank_0>" },
  { title: "East", english: "rank 1: a quarter turn", transliteration: "cardinal <rank_1>" },
  { title: "South", english: "rank 2: a half turn", transliteration: "cardinal <rank_2>" },
  { title: "West", english: "rank 3", transliteration: "cardinal <rank_3>" },
  { title: "Northeast", english: "between north and east", transliteration: "cardinal <rank_0> <rank_1>" },
  { title: "Southwest", english: "between south and west", transliteration: "cardinal <rank_2> <rank_3>" },
  {
    title: "Northward",
    english: "Go north",
    transliteration: "<verb_prescriptive> go(vi) to north",
  },
  {
    title: "In the east",
    english: "The Sun rises in the east",
    transliteration: "<subject> sun <verb> rise(vi) at east",
  },
  {
    title: "Where from",
    english: "I came from the south",
    transliteration: "<subject> I <verb> come(vi) formerly from south",
  },
];

// Arithmetic: count takes rank for the operation and negative for its inverse; by gives the amount
export const arithmetic_examples: Example[] = [
  { title: "Count", english: "Count to ten", transliteration: "<verb_prescriptive> count(vi) to number 1 0" },
  { title: "Count down", english: "Count down from ten", transliteration: "<verb_prescriptive> count_down(vi) from number 1 0" },
  { title: "Add", english: "Add 2 to 5", transliteration: "<verb_prescriptive> add(vt) <object> number 5 by number 2" },
  {
    title: "Subtract",
    english: "Subtract 2 from 5",
    transliteration: "<verb_prescriptive> subtract(vt) <object> number 5 by number 2",
  },
  { title: "Multiply", english: "Multiply 5 by 2", transliteration: "<verb_prescriptive> multiply(vt) <object> number 5 by number 2" },
  {
    title: "Equals",
    english: "2 + 3 = 5",
    transliteration: "<subject> <gerund> add(vt) <object> number 2 by number 3 <verb> equal(vt) <object> number 5",
  },
  { title: "Sum", english: "the sum", transliteration: "result of <gerund> add(vt)" },
  { title: "Divide", english: "Divide 6 by 3", transliteration: "<verb_prescriptive> divide(vt) <object> number 6 by number 3" },
  { title: "Power", english: "Square 5", transliteration: "<verb_prescriptive> exponentiate(vt) <object> number 5 by number 2" },
  {
    title: "Root",
    english: "Take the square root of 9",
    transliteration: "<verb_prescriptive> root(vt) <object> number 9 by number 2",
  },
  {
    title: "Logarithm",
    english: "The rank of 1000 is 3",
    transliteration: "<subject> rank of number 1 <rank_3> <verb> equal(vt) <object> number 3",
  },
  {
    title: "A sentence",
    english: "If you add 2 to 3, you get 5",
    transliteration:
      "if <subject> you <verb> add(vt) <object> number 3 by number 2 <clause_end> <subject> you <verb> possess(vt) <object> number 5",
  },
];

// Posture: how upright a body is
export const posture_examples: Example[] = [
  { title: "Stand up", english: "Stand up!", transliteration: "<verb_prescriptive> stand(vi)" },
  { title: "Sitting", english: "I'm sitting", transliteration: "<subject> I <verb> sit(vi) <continuous_tense_aspect>" },
  { title: "Seat", english: "Seat the child", transliteration: "<verb_prescriptive> seat(vt) <object> child" },
  { title: "Crouch", english: "The animal crouches", transliteration: "<subject> animal <verb> crouch(vi)" },
  { title: "Crawl", english: "The child crawls", transliteration: "<subject> child <verb> crawl(vi)" },
  { title: "Lie down", english: "I lay down", transliteration: "<subject> I <verb> lie(vi) formerly" },
  {
    title: "Lay down",
    english: "Lay the child down",
    transliteration: "<verb_prescriptive> lay_down(vt) <object> child",
  },
  { title: "Slouch", english: "You stand with a slouch", transliteration: "<subject> you <verb> stand(vi) slouchingly" },
  { title: "Sit up straight", english: "Sit up straight!", transliteration: "<verb_prescriptive> sit(vi) uprightly" },
];

// Moving: the verb names the medium
export const moving_examples: Example[] = [
  { title: "Bird", english: "a flying animal", transliteration: "animal flying" },
  { title: "Fish", english: "a swimming animal", transliteration: "animal swimming" },
  { title: "Feather", english: "a bird's covering", transliteration: "covering animal flying" },
  { title: "Walk", english: "I walk to the water", transliteration: "<subject> I <verb> walk(vi) to water" },
  { title: "Wade", english: "Wade across the water", transliteration: "<verb_prescriptive> wade_through(vt) <object> water" },
  { title: "Sail", english: "The boat sails north", transliteration: "<subject> boat <verb> swim(vi) to north" },
  { title: "Fly", english: "We flew", transliteration: "<subject> we <verb> fly(vi) formerly" },
  { title: "Space", english: "The spacecraft travels to the Moon", transliteration: "<subject> spacecraft <verb> spacefly(vi) to the_moon" },
  { title: "Burrow", english: "The animal burrows", transliteration: "<subject> animal <verb> burrow(vi)" },
];

// Parts of things: the kind of part, then the whole
export const part_examples: Example[] = [
  { title: "Hand", english: "the arm's second segment", transliteration: "arm <rank_2>" },
  { title: "Toe", english: "the leg's third segment", transliteration: "leg <rank_3>" },
  { title: "Wrist", english: "the hand's joint", transliteration: "node hand" },
  { title: "Skin", english: "the body's covering", transliteration: "covering body" },
  { title: "Bark", english: "the plant's covering", transliteration: "covering plant" },
  { title: "Tooth", english: "the mouth's rock", transliteration: "rock mouth" },
  { title: "Eye", english: "what you see with", transliteration: "<tool> see(vt)" },
  { title: "Heart", english: "the body's center", transliteration: "center body" },
  { title: "Blood", english: "the body's liquid", transliteration: "liquid body" },
  { title: "Leaf", english: "a plant's finger", transliteration: "finger plant" },
  { title: "Grease", english: "what you make things slip with", transliteration: "<tool> slip(vi)" },
  { title: "Fruit", english: "food with seed in it", transliteration: "food seed" },
  { title: "Liver", english: "the body's filter", transliteration: "filter body" },
  { title: "Animal noise", english: "an animal's speech", transliteration: "speech animal" },
  { title: "Bug", english: "a very small animal", transliteration: "animal <max_negative> big" },
  { title: "Smoke", english: "The fire makes smoke", transliteration: "<subject> fire <verb> create(vt) <object> smoke" },
  { title: "House", english: "a family's building", transliteration: "building family" },
  { title: "Glue", english: "what you stick things with", transliteration: "<tool> stick(vi)" },
  { title: "Root", english: "a plant's foot", transliteration: "foot plant" },
  {
    title: "A sentence",
    english: "The tree's leaves are red",
    transliteration: "<subject> leaf plural of tree <verb> be(vt) <complement> red",
  },
];

// Seeing and showing, and saying or showing what isn't so
export const sight_examples: Example[] = [
  { title: "See", english: "I see you", transliteration: "<subject> I <verb> see(vt) <object> you" },
  { title: "Look", english: "Look!", transliteration: "<verb_prescriptive> look(vi)" },
  { title: "Watch", english: "Watch the bird", transliteration: "<verb_prescriptive> watch(vt) <object> bird" },
  { title: "Listen", english: "Listen to me", transliteration: "<verb_prescriptive> listen_to(vt) <object> me" },
  { title: "Hear", english: "I hear rain", transliteration: "<subject> I <verb> hear(vt) <object> rain" },
  { title: "Taste", english: "Taste the water", transliteration: "<verb_prescriptive> taste(vt) <object> water" },
  { title: "Smell", english: "I smell smoke", transliteration: "<subject> I <verb> smell(vt) <object> smoke" },
  { title: "Feel", english: "Feel the rock", transliteration: "<verb_prescriptive> feel(vt) <object> rock" },
  { title: "Sweet", english: "The fruit is sweet", transliteration: "<subject> fruit <verb> be(vt) <complement> taste fun" },
  { title: "Feel pain", english: "I feel pain", transliteration: "<subject> I <verb> sense(vt) <object> pain" },
  { title: "Show", english: "Show me the rock", transliteration: "<verb_prescriptive> show(vt) <object> rock to me" },
  { title: "Glimpse", english: "I glimpsed an animal", transliteration: "<subject> I <verb> glimpse(vt) formerly <object> animal" },
  { title: "Lie", english: "You lied", transliteration: "<subject> you <verb> say(vt) formerly falsely" },
  { title: "Pretend", english: "The child is pretending", transliteration: "<subject> child <verb> show(vi) falsely <continuous_tense_aspect>" },
  { title: "Feign", english: "The child pretends to sleep", transliteration: "<subject> child <verb> show(vt) falsely <object> <gerund> sleep(vi)" },
  { title: "Disguise", english: "Disguise yourself", transliteration: "<verb_prescriptive> show(vt) falsely <object> self" },
];

// Existence and location, ordinals and per, ability, again, manner and counterfactuals
export const more_grammar_examples: Example[] = [
  {
    title: "Somewhere",
    english: "There's water here",
    transliteration: "<subject> water <verb> be(vi) at this",
  },
  { title: "Location", english: "The rock is in the water", transliteration: "<subject> rock <verb> be(vi) in water" },
  { title: "Existence", english: "Animals exist", transliteration: "<subject> animal <verb> be(vi)" },
  { title: "Ordinal", english: "the third person", transliteration: "person <ordinal> number 3" },
  { title: "Cardinal", english: "three people", transliteration: "person number 3" },
  { title: "A third", english: "1/3", transliteration: "<per> number 3" },
  { title: "Two thirds", english: "2/3", transliteration: "number 2 <per> number 3" },
  { title: "A thousandth", english: "1/1000", transliteration: "<per> number 1 <rank_3>" },
  { title: "Half the money", english: "a share", transliteration: "money <per> number 2" },
  { title: "Per person", english: "money per person", transliteration: "money <per> person" },
  {
    title: "Rate",
    english: "I sleep eight hours a day",
    transliteration: "<subject> I <verb> sleep(vi) hour number 8 <per> day",
  },
  { title: "Ratio", english: "three to one", transliteration: "number 3 <per> number 1" },
  { title: "Can", english: "I can work", transliteration: "<subject> I <verb> work(vi) ably" },
  { title: "Must", english: "You must work", transliteration: "<subject> you <verb> work(vi) obligatorily" },
  { title: "Should", english: "You should sleep", transliteration: "<subject> you <verb> sleep(vi) advisably" },
  { title: "May", english: "You may go", transliteration: "<subject> you <verb> go(vi) permissibly" },
  { title: "Must not", english: "You must not kill", transliteration: "<subject> you <verb> kill(vt) impermissibly" },
  {
    title: "A right",
    english: "Everyone has the right to speak",
    transliteration: "<subject> everyone <verb> be_entitled_to(vt) <object> <gerund> say(vt)",
  },
  { title: "Prefer", english: "I prefer water", transliteration: "<subject> I <verb> prefer(vt) <object> water" },
  { title: "Choose", english: "Choose one", transliteration: "<verb_prescriptive> choose(vt) <object> thing number 1" },
  { title: "Safe", english: "The child is safe", transliteration: "<subject> child <verb> be(vt) <complement> safe" },
  { title: "Infer", english: "I infer that you slept", transliteration: "<subject> I <verb> infer(vt) <object> <subject> you <verb> sleep(vi) formerly" },
  { title: "Assume", english: "Assume it's true", transliteration: "<verb_prescriptive> assume(vt) <object> <verb> be(vt) <complement> true" },
  { title: "Reason", english: "the faculty: what you reason with", transliteration: "<tool> infer(vt)" },
  { title: "Compute", english: "The computer computes", transliteration: "<subject> computer <verb> compute(vi)" },
  { title: "Machine", english: "an artificial worker", transliteration: "<er> work(vi) artificial" },
  { title: "Invent", english: "She invented a machine", transliteration: "<subject> it <verb> invent(vt) formerly <object> machine" },
  { title: "Imitate", english: "The child imitates the mother", transliteration: "<subject> child <verb> imitate(vt) <object> mother" },
  { title: "Source of truth", english: "the canonical source others derive from", transliteration: "source of truth" },
  { title: "Canonical data", english: "the canonical information", transliteration: "information canonical" },
  // "Derived from" in its senses, each with its own word
  { title: "Derived: comes from", english: "The bird came from the south", transliteration: "<subject> bird <verb> come(vi) formerly from south" },
  { title: "Derived: made from", english: "Glue is made from plants", transliteration: "<object> glue <verb> create(vt) from plant" },
  { title: "Derived: results from", english: "The harvest results from the sowing", transliteration: "<subject> harvest <verb> result_from(vt) <object> sowing" },
  { title: "Derived: deduced from", english: "The theorem is derived from the axioms", transliteration: "<object> theorem <verb> derive(vt) from axiom plural" },
  { title: "Derived: modelled on", english: "The copy is derivative of the original", transliteration: "<subject> copy <verb> be(vt) <complement> derivative of thing original" },
  { title: "Computation", english: "working data", transliteration: "<gerund> work(vt) information" },
  { title: "Computer", english: "what works data", transliteration: "<tool> work(vt) information" },
  { title: "Craft", english: "to work stone", transliteration: "<verb_prescriptive> work(vt) <object> rock" },
  { title: "Mind", english: "what perceives itself", transliteration: "<er> sense(vt) self" },
  { title: "Conscience", english: "what you blame yourself with", transliteration: "<tool> blame(vt) self" },
  { title: "Model", english: "what resembles something", transliteration: "<er> resemble(vt)" },
  { title: "Metaethics", english: "ethics about ethics", transliteration: "merit meta" },
  { title: "Grouped", english: "a rock of the color red yellow: an orange rock", transliteration: "rock <regroup> red yellow" },
  { title: "Not grouped", english: "a rock that's red and yellow", transliteration: "rock red yellow" },
  { title: "Only", english: "Only you sleep", transliteration: "<subject> only you <verb> sleep(vi)" },
  { title: "Also", english: "You sleep too", transliteration: "<subject> also you <verb> sleep(vi)" },
  { title: "Even", english: "Even the child knows", transliteration: "<subject> even child <verb> know(vt)" },
  { title: "Law", english: "a general command: law, or a rule", transliteration: "command abstract" },
  {
    title: "Obey the law",
    english: "Everyone obeys the law",
    transliteration: "<subject> everyone <verb> obey(vt) <object> law",
  },
  {
    title: "A duty",
    english: "I'm bound not to interfere",
    transliteration: "<subject> I <verb> be_bound_to(vt) <object> <gerund> not touch(vi)",
  },
  { title: "Can't", english: "I can't sleep", transliteration: "<subject> I <verb> sleep(vi) incapably" },
  { title: "Become", english: "I gained a house", transliteration: "<subject> I <verb> become possess(vt) formerly <object> house" },
  { title: "Again", english: "Open it again", transliteration: "<verb_prescriptive> open(vt) again <object> it" },
  {
    title: "Undo",
    english: "The ice froze again (it had melted)",
    transliteration: "<subject> water <verb> freeze(vi) again formerly",
  },
  {
    title: "How",
    english: "How do you work?",
    transliteration: "<subject> you <verb_interrogative> work(vi) <blank>",
  },
  {
    title: "Counterfactual",
    english: "If you had slept, you would be strong",
    transliteration:
      "if <subject> you <verb> sleep(vi) formerly falsely <clause_end> <subject> you <verb> be(vt) <complement> strong",
  },
];

// Conversation: no special words, just axis words used as answers and greetings
export const conversation_examples: Example[] = [
  { title: "Yes", english: "Yes (that's so)", transliteration: "true" },
  { title: "No", english: "No (that's not so)", transliteration: "false" },
  { title: "Hello", english: "Hello", transliteration: "good" },
  { title: "Goodbye", english: "Goodbye", transliteration: "go(vi) well" },
  { title: "Thank you", english: "Thanks to you", transliteration: "thanks to you" },
  { title: "Sorry", english: "My fault", transliteration: "blame to me" },
  {
    title: "Please",
    english: "Sit, please",
    transliteration: "<verb_prescriptive> sit(vi) please",
  },
  { title: "Please, first", english: "Please sit", transliteration: "please <verb_prescriptive> sit(vi)" },
  {
    title: "Thank you, in full",
    english: "I thank you",
    transliteration: "<subject> I <verb> thank(vt) <object> you",
  },
  {
    title: "I'm to blame",
    english: "I'm sorry",
    transliteration: "<subject> I <verb> be(vt) <complement> culpable",
  },
  {
    title: "Acknowledge",
    english: "I acknowledge your work",
    transliteration: "<subject> I <verb> acknowledge(vt) <object> work of you",
  },
  {
    title: "Praise",
    english: "They praised the person",
    transliteration: "<subject> they <verb> praise(vt) formerly <object> person",
  },
  {
    title: "A question",
    english: "Are you sleeping? Yes.",
    transliteration: "<subject> you <verb_interrogative> sleep(vi) <continuous_tense_aspect>. true.",
  },
];

// Universal Declaration of Human Rights

// The preamble is one long sentence of whereas-clauses; the translation states each as its own
// sentence and ends with consequently, as "so" is said
export const udhr_preamble: Article[] = [
  {
    title: "Preamble",
    english: [
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
    ],
    transliteration:
      "<subject> everyone <verb> possess(vt) <object> dignity and right same <clause_start> <subject> no_one <verb> take(vt) ably <object> <blank> <clause_end>. <subject> <gerund> acknowledge(vt) this <verb> be(vt) <complement> source of freedom and impartiality and peace at earth. <subject> <gerund> ignore(vt) and hate(vt) right of person <verb> cause(vt) <perfect_tense_aspect> <object> deed <max_negative> good <clause_start> <subject> conscience of everyone <verb> condemn(vt) <object> <blank> <clause_end>. <subject> everyone <verb> desire(vt) <max_positive> eagerly <object> earth <clause_start> <subject> everyone <verb> speak(vi) and believe(vi) freely and <verb> be(vt) <complement> free from fear and lack in <blank> <clause_end>. <object> right of person <verb_prescriptive> defend(vt) necessarily by law for <subject> person <verb> not oppose(vt) by coercion <object> <gerund> rule_over(vt) cruelly if <subject> nothing other <verb> help_out(vi). <subject> <gerund> increase(vt) liking between country plural <verb> be(vt) <complement> necessary. <subject> society plural of group of country all <verb> again say(vt) <perfect_tense_aspect> in constitution of it <object> <subject> they <verb> believe(vt) <object> right of person and dignity and value of person and right same of person. <subject> they <verb> choose(vt) <perfect_tense_aspect> <object> <verb> improve(vt) <object> society and life in freedom many. <subject> country member <verb> promise(vt) <perfect_tense_aspect> by <gerund> cooperate(vi) with group of country all <object> <verb> increase(vt) at everywhere <object> acknowledgment and <gerund> obey(vt) of right and freedom of person. <subject> knowledge mutual of right and freedom this <verb> be(vt) <complement> <max_positive> important for <gerund> do(vt) promise this fully. <subject> group of country all <verb> say(vt) consequently <object> this as purpose of society all and country all. <subject> everyone and group all of society <verb_prescriptive> think(vt) always <object> this and <verb_prescriptive> attempt(vt) <object> <verb> increase(vt) by education <object> acknowledgment of right and freedom this. <subject> they <verb_prescriptive> secure(vt) at everywhere by deed in country and between country plural <object> acknowledgment and <gerund> obey(vt) of it in society of country member and of land <clause_start> <subject> country member <verb> govern(vt) <object> <blank> <clause_end>.",
  },
];

export const udhr_articles: Article[] = [
  {
    title: "Article 1",
    english: [
      "All human beings are born free and equal in dignity and rights. They are endowed with reason and conscience and should act towards one another in a spirit of brotherhood.",
    ],
    transliteration:
      "<subject> everyone <verb> be_born(vi) <complement> free and same in dignity and right. <subject> it all <verb> possess(vt) <object> reason and conscience and <verb_prescriptive> act(vi) to each_other as sibling.",
  },
  {
    title: "Article 2",
    english: [
      "Everyone is entitled to all the rights and freedoms set forth in this Declaration, without distinction of any kind, such as race, colour, sex, language, religion, political or other opinion, national or social origin, property, birth or other status. Furthermore, no distinction shall be made on the basis of the political, jurisdictional or international status of the country or territory to which a person belongs, whether it be independent, trust, non-self-governing or under any other limitation of sovereignty.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> right and freedom all of this. <object> no_one <verb_prescriptive> discriminate_against(vt) by lineage or color or sex or language or religion or belief or country or society or possession or <gerund> be_born(vi) or type other. <object> no_one <verb_prescriptive> discriminate_against(vt) by government or sovereignty of country of it.",
  },
  {
    title: "Article 3",
    english: ["Everyone has the right to life, liberty and security of person."],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> life and freedom and safety.",
  },
  {
    title: "Article 4",
    english: [
      "No one shall be held in slavery or servitude; slavery and the slave trade shall be prohibited in all their forms.",
    ],
    transliteration:
      "<subject> no_one <verb_prescriptive> be(vt) <complement> owned or forced. <object> <gerund> possess(vt) person and <gerund> exchange(vt) person <verb_prescriptive> forbid(vt) in type all.",
  },
  {
    title: "Article 5",
    english: [
      "No one shall be subjected to torture or to cruel, inhuman or degrading treatment or punishment.",
    ],
    transliteration:
      "<object> no_one <verb_prescriptive> torment(vt) or punish(vt) cruelly or use(vt) as thing.",
  },
  {
    title: "Article 6",
    english: ["Everyone has the right to recognition everywhere as a person before the law."],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <clause_start> <object> self <verb> know(vt) as person by law at everywhere <clause_end>.",
  },
  {
    title: "Article 7",
    english: [
      "All are equal before the law and are entitled without any discrimination to equal protection of the law. All are entitled to equal protection against any discrimination in violation of this Declaration and against any incitement to such discrimination.",
    ],
    transliteration:
      "<subject> everyone <verb> be(vt) <complement> same in law and <verb> be_entitled_to(vt) <object> defense same of law. <subject> everyone <verb> be_entitled_to(vt) <object> defense same from discrimination and from <gerund> persuade(vt) to discrimination.",
  },
  {
    title: "Article 8",
    english: [
      "Everyone has the right to an effective remedy by the competent national tribunals for acts violating the fundamental rights granted him by the constitution or by law.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <subject> court of country of it <verb> mend(vt) well <object> deed <clause_start> <subject> <blank> <verb> break(vt) <object> right of it from constitution or law <clause_end>.",
  },
  {
    title: "Article 9",
    english: ["No one shall be subjected to arbitrary arrest, detention or exile."],
    transliteration:
      "<object> no_one <verb_prescriptive> constrain(vt) or eject(vt) for nothing.",
  },
  {
    title: "Article 10",
    english: [
      "Everyone is entitled in full equality to a fair and public hearing by an independent and impartial tribunal, in the determination of his rights and obligations and of any criminal charge against him.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <subject> court free impartial <verb> judge(vt) visibly <object> it as everyone about right and duty of it and about <gerund> blame(vt) it.",
  },
  {
    title: "Article 11",
    english: [
      "Everyone charged with a penal offence has the right to be presumed innocent until proved guilty according to law in a public trial at which he has had all the guarantees necessary for his defence.",
      "No one shall be held guilty of any penal offence on account of any act or omission which did not constitute a penal offence, under national or international law, at the time when it was committed. Nor shall a heavier penalty be imposed than the one that was applicable at the time the penal offence was committed.",
    ],
    transliteration:
      "<subject> law <verb_prescriptive> assume(vt) <object> <ee> blame(vt) as not culpable. <subject> only trial visible <verb_prescriptive> prove(vt) <object> it as culpable by law. <subject> it <verb_prescriptive> defend(vt) <object> self ably in trial. <object> no_one <verb_prescriptive> judge(vt) as culpable about deed <clause_start> <subject> law <verb> not forbid(vt) <object> <blank> at time of it <clause_end>. <subject> <gerund> punish(vt) <verb_prescriptive> not exceed(vt) <object> <gerund> punish(vt) of law at time of crime.",
  },
  {
    title: "Article 12",
    english: [
      "No one shall be subjected to arbitrary interference with his privacy, family, home or correspondence, nor to attacks upon his honour and reputation. Everyone has the right to the protection of the law against such interference or attacks.",
    ],
    transliteration:
      "<subject> no_one <verb_prescriptive> enter(vi) for nothing in privacy and family and house and message of other and <verb_prescriptive> worsen(vt) <object> reputation of other. <subject> everyone <verb> be_entitled_to(vt) <object> defense of law from this.",
  },
  {
    title: "Article 13",
    english: [
      "Everyone has the right to freedom of movement and residence within the borders of each state.",
      "Everyone has the right to leave any country, including his own, and to return to his country.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> go(vi) and <verb> be(vi) at everywhere in country of self. <subject> everyone <verb> be_entitled_to(vt) <object> <verb> exit(vi) from country all and <verb> come(vi) to country of self.",
  },
  {
    title: "Article 14",
    english: [
      "Everyone has the right to seek and to enjoy in other countries asylum from persecution.",
      "This right may not be invoked in the case of prosecutions genuinely arising from non-political crimes or from acts contrary to the purposes and principles of the United Nations.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> seek(vt) <object> safety in country other from <gerund> hurt(vt). <subject> right this <verb> not include(vt) <object> person <clause_start> <object> <blank> <verb> judge(vt) about crime not politics or about deed <clause_start> <subject> <blank> <verb> oppose(vt) <object> purpose of group of country all <clause_end> <clause_end>.",
  },
  {
    title: "Article 15",
    english: [
      "Everyone has the right to a nationality.",
      "No one shall be arbitrarily deprived of his nationality nor denied the right to change his nationality.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> be(vt) <complement> citizen. <object> country of self <verb_prescriptive> take(vt) from no_one for nothing and <subject> everyone <verb> be_entitled_to(vt) <object> <verb> alter(vt) <object> country of self.",
  },
  {
    title: "Article 16",
    english: [
      "Men and women of full age, without any limitation due to race, nationality or religion, have the right to marry and to found a family. They are entitled to equal rights as to marriage, during marriage and at its dissolution.",
      "Marriage shall be entered into only with the free and full consent of the intending spouses.",
      "The family is the natural and fundamental group unit of society and is entitled to protection by society and the State.",
    ],
    transliteration:
      "<subject> adult all <verb> be_entitled_to(vt) <object> <verb> marry(vi) and <verb> start(vt) <object> family. <object> no_one <verb_prescriptive> discriminate_against(vt) in marriage by lineage or country or religion. <subject> spouse plural <verb> be(vt) <complement> same in right at start of marriage and in it and at stop of it. <object> marriage <verb_prescriptive> start(vt) only if <subject> spouse plural <verb> allow(vt) <object> it freely fully. <subject> family <verb> be(vt) <complement> group natural and source of society and <verb> be_entitled_to(vt) <object> defense by society and government.",
  },
  {
    title: "Article 17",
    english: [
      "Everyone has the right to own property alone as well as in association with others.",
      "No one shall be arbitrarily deprived of his property.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> possess(vt) <object> thing with no_one or with person other. <object> thing <verb_prescriptive> take(vt) from no_one for nothing.",
  },
  {
    title: "Article 18",
    english: [
      "Everyone has the right to freedom of thought, conscience and religion; this right includes freedom to change his religion or belief, and freedom, either alone or in community with others and in public or private, to manifest his religion or belief in teaching, practice, worship and observance.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> freedom in thought and conscience and religion. <subject> everyone <verb> be_entitled_to(vt) <object> <verb> alter(vt) <object> religion or belief of self. <subject> everyone <verb> be_entitled_to(vt) <object> <verb> show(vt) visibly or secretly <object> it with no_one or with society by education and <gerund> do(vt) and worship and <gerund> obey(vt).",
  },
  {
    title: "Article 19",
    english: [
      "Everyone has the right to freedom of opinion and expression; this right includes freedom to hold opinions without interference and to seek, receive and impart information and ideas through any media and regardless of frontiers.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> believe(vi) freely and <verb> speak(vi) freely. <subject> everyone <verb> be_entitled_to(vt) <object> <verb> seek(vt) and receive(vt) and send(vt) <object> information and idea by everything at everywhere.",
  },
  {
    title: "Article 20",
    english: [
      "Everyone has the right to freedom of peaceful assembly and association.",
      "No one may be compelled to belong to an association.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> gather(vi) peacefully and <verb> be(vi) in group. <subject> no_one <verb_prescriptive> be(vi) in group by coercion.",
  },
  {
    title: "Article 21",
    english: [
      "Everyone has the right to take part in the government of his country, directly or through freely chosen representatives.",
      "Everyone has the right of equal access to public service in his country.",
      "The will of the people shall be the basis of the authority of government; this will shall be expressed in periodic and genuine elections which shall be by universal and equal suffrage and shall be held by secret vote or by equivalent free voting procedures.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> act(vi) in government of country of self by self or by representative <clause_start> <object> <blank> <verb> vote_for(vt) freely <clause_end>. <subject> everyone <verb> be_entitled_to(vt) <object> <verb> serve(vt) <object> country of self as everyone. <subject> desire of society <verb_prescriptive> be(vt) <complement> source of government. <subject> society <verb_prescriptive> show(vt) <object> it by vote cyclical true. <subject> everyone <verb_prescriptive> vote(vi) secretly and <subject> vote of everyone <verb_prescriptive> be(vt) <complement> same.",
  },
  {
    title: "Article 22",
    english: [
      "Everyone, as a member of society, has the right to social security and is entitled to realization, through national effort and international co-operation and in accordance with the organization and resources of each State, of the economic, social and cultural rights indispensable for his dignity and the free development of his personality.",
    ],
    transliteration:
      "<subject> everyone <verb> be(vt) <complement> member of society and <verb> be_entitled_to(vt) <object> safety by society. <subject> everyone <verb> be_entitled_to(vt) <object> right about money and society and culture <clause_start> <subject> <blank> <verb> be(vt) <complement> necessary for dignity of it and <gerund> grow(vi) freely of it <clause_end> by effort of country and <gerund> cooperate(vi) between country plural if <subject> possession of country <verb> allow(vt) <object> it.",
  },
  {
    title: "Article 23",
    english: [
      "Everyone has the right to work, to free choice of employment, to just and favourable conditions of work and to protection against unemployment.",
      "Everyone, without any discrimination, has the right to equal pay for equal work.",
      "Everyone who works has the right to just and favourable remuneration ensuring for himself and his family an existence worthy of human dignity, and supplemented, if necessary, by other means of social protection.",
      "Everyone has the right to form and to join trade unions for the protection of his interests.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> work(vi) and <verb> choose(vt) freely <object> work of self. <subject> everyone <verb> be_entitled_to(vt) <object> work good impartial and defense from <gerund> lack(vt) work. <subject> everyone <verb> be_entitled_to(vt) impartially <object> wage same for work same. <subject> worker all <verb> be_entitled_to(vt) <object> wage good impartial. <subject> it <verb_prescriptive> be(vt) <complement> enough for life of dignity of worker and family of worker. if <subject> it <verb> be(vt) <complement> not enough <clause_end> <subject> society <verb_prescriptive> defend(vt) <object> worker by thing other. <subject> everyone <verb> be_entitled_to(vt) <object> <verb> start(vt) <object> union and <verb> enter(vi) in union for defense of self.",
  },
  {
    title: "Article 24",
    english: [
      "Everyone has the right to rest and leisure, including reasonable limitation of working hours and periodic holidays with pay.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> rest(vi) and <verb> enjoy_oneself(vi). <object> hour of work <verb_prescriptive> limit(vt). <subject> everyone <verb_prescriptive> rest(vi) cyclically and <verb_prescriptive> receive(vt) <object> wage in <gerund> rest(vi).",
  },
  {
    title: "Article 25",
    english: [
      "Everyone has the right to a standard of living adequate for the health and well-being of himself and of his family, including food, clothing, housing and medical care and necessary social services, and the right to security in the event of unemployment, sickness, disability, widowhood, old age or other lack of livelihood in circumstances beyond his control.",
      "Motherhood and childhood are entitled to special care and assistance. All children, whether born in or out of wedlock, shall enjoy the same social protection.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> life enough for health and goodness of self and of family of self. <subject> it <verb> include(vt) <object> food and clothing and house and medicine and service necessary of society. <subject> everyone <verb> be_entitled_to(vt) <object> safety if <subject> it <verb> lack(vt) <object> work or ability or spouse or money from not self or <verb> be(vt) <complement> sick or old. <subject> mother and youth <verb> be_entitled_to(vt) <object> care particular. <subject> child of marriage and child of not marriage <verb_prescriptive> possess(vt) <object> defense same by society.",
  },
  {
    title: "Article 26",
    english: [
      "Everyone has the right to education. Education shall be free, at least in the elementary and fundamental stages. Elementary education shall be compulsory. Technical and professional education shall be made generally available and higher education shall be equally accessible to all on the basis of merit.",
      "Education shall be directed to the full development of the human personality and to the strengthening of respect for human rights and fundamental freedoms. It shall promote understanding, tolerance and friendship among all nations, racial or religious groups, and shall further the activities of the United Nations for the maintenance of peace.",
      "Parents have a prior right to choose the kind of education that shall be given to their children.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> education. <subject> education juvenile <verb_prescriptive> be(vt) <complement> gratis and obligatory. <object> education about work <verb_prescriptive> open(vt) to everyone and <object> education mature <verb_prescriptive> open(vt) impartially to everyone by merit. <subject> education <verb_prescriptive> bring_to_maturity(vt) fully <object> person and <verb_prescriptive> strengthen(vt) <object> acknowledgment of right and freedom. <subject> it <verb_prescriptive> increase(vt) <object> knowledge and acknowledgment and <gerund> like(vt) between country all and lineage all and religion all and <verb_prescriptive> enable(vt) <object> work of group of country all for peace. <subject> parent plural <verb> be_entitled_to(vt) <object> <verb> choose(vt) <object> type of education of child of it. <subject> right this <verb> exceed(vt) <object> right of other.",
  },
  {
    title: "Article 27",
    english: [
      "Everyone has the right freely to participate in the cultural life of the community, to enjoy the arts and to share in scientific advancement and its benefits.",
      "Everyone has the right to the protection of the moral and material interests resulting from any scientific, literary or artistic production of which he is the author.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> <verb> act(vi) freely in culture of society and <verb> enjoy_oneself(vi) by art and <verb> possess(vt) <object> part of <gerund> improve(vi) of science and of good of it. <subject> everyone <verb> be_entitled_to(vt) <object> defense of thanks and money from science and <ee> write(vt) and art <clause_start> <subject> it <verb> be(vt) <complement> source of <blank> <clause_end>.",
  },
  {
    title: "Article 28",
    english: [
      "Everyone is entitled to a social and international order in which the rights and freedoms set forth in this Declaration can be fully realized.",
    ],
    transliteration:
      "<subject> everyone <verb> be_entitled_to(vt) <object> order <clause_start> <subject> right and freedom of this <verb> come_true(vi) fully ably in <blank> <clause_end> in society and between country plural.",
  },
  {
    title: "Article 29",
    english: [
      "Everyone has duties to the community in which alone the free and full development of his personality is possible.",
      "In the exercise of his rights and freedoms, everyone shall be subject only to such limitations as are determined by law solely for the purpose of securing due recognition and respect for the rights and freedoms of others and of meeting the just requirements of morality, public order and the general welfare in a democratic society.",
      "These rights and freedoms may in no case be exercised contrary to the purposes and principles of the United Nations.",
    ],
    transliteration:
      "<subject> everyone <verb> possess(vt) <object> duty to society <clause_start> <subject> it <verb> mature(vi) freely fully ably only in <blank> <clause_end>. <object> right and freedom of everyone <verb_prescriptive> limit(vt) only by law and only for acknowledgment of right and freedom of other and for merit and order of society and goodness of everyone in society democracy. <object> right and freedom this <verb_prescriptive> use(vt) never for <gerund> oppose(vt) purpose and axiom of group of country all.",
  },
  {
    title: "Article 30",
    english: [
      "Nothing in this Declaration may be interpreted as implying for any State, group or person any right to engage in any activity or to perform any act aimed at the destruction of any of the rights and freedoms set forth herein.",
    ],
    transliteration:
      "<subject> group none and no_one <verb> be_entitled_to(vt) by this <object> <verb> break(vt) <object> right and freedom of this.",
  },
];

// The Tower of Babel (Genesis 11:1-9, King James Version), the conlang community's standard text.
// Verses 6 and 7 are one quote, so they're translated together
export const babel_verses: Article[] = [
  {
    title: "Genesis 11:1",
    english: ["And the whole earth was of one language, and of one speech."],
    transliteration:
      "<subject> everyone at earth <verb> possess(vt) formerly <object> language number 1 and word plural same.",
  },
  {
    title: "Genesis 11:2",
    english: [
      "And it came to pass, as they journeyed from the east, that they found a plain in the land of Shinar; and they dwelt there.",
    ],
    transliteration:
      "at time <clause_start> <subject> they <verb> go(vi) <continuous_tense_aspect> from east <clause_end> <subject> they <verb> find(vt) formerly <object> land flat at land <foreign> shinar. <subject> they <verb> stay(vi) formerly at that.",
  },
  {
    title: "Genesis 11:3",
    english: [
      "And they said one to another, Go to, let us make brick, and burn them thoroughly. And they had brick for stone, and slime had they for morter.",
    ],
    transliteration:
      "<subject> they <verb> say_verbatim(vt) formerly to each_other <object> <clause_start> <subject> we <verb_prescriptive> create(vt) <object> brick and <verb_prescriptive> burn(vt) completely <object> it <clause_end>. <subject> they <verb> use(vt) formerly <object> brick as rock and <verb> use(vt) <object> liquid dark as glue.",
  },
  {
    title: "Genesis 11:4",
    english: [
      "And they said, Go to, let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name, lest we be scattered abroad upon the face of the whole earth.",
    ],
    transliteration:
      "<subject> they <verb> say_verbatim(vt) formerly <object> <clause_start> <subject> we <verb_prescriptive> create(vt) <object> city and tower <clause_start> <subject> top of <blank> <verb> touch(vt) <object> sky <clause_end> and <verb_prescriptive> create(vt) <object> reputation of self for <clause_start> <object> we <verb> not disperse(vt) to everywhere at earth <clause_end> <clause_end>.",
  },
  {
    title: "Genesis 11:5",
    english: ["And the LORD came down to see the city and the tower, which the children of men builded."],
    transliteration:
      "<subject> god <verb> descend(vi) formerly for <verb> see(vt) <object> city and tower <clause_start> <subject> person plural <verb> create(vt) formerly <object> <blank> <clause_end>.",
  },
  {
    title: "Genesis 11:6–7",
    english: [
      "And the LORD said, Behold, the people is one, and they have all one language; and this they begin to do: and now nothing will be restrained from them, which they have imagined to do.",
      "Go to, let us go down, and there confound their language, that they may not understand one another's speech.",
    ],
    transliteration:
      "<subject> god <verb> say_verbatim(vt) formerly <object> <clause_start> <verb_prescriptive> see(vi). if <subject> they <verb> be(vt) <complement> society united and <verb> possess(vt) <object> language number 1 and <verb> start(vt) <perfect_tense_aspect> <object> <gerund> do(vt) this <clause_end> <subject> they <verb> do(vt) ably henceforth <object> everything <clause_start> <subject> they <verb> aim(vt) <object> <blank> <clause_end>. <subject> we <verb_prescriptive> descend(vi) and <verb_prescriptive> disorganize(vt) at that <object> language of they for <subject> they <verb> not know(vt) <object> language of each_other <clause_end>.",
  },
  {
    title: "Genesis 11:8",
    english: [
      "So the LORD scattered them abroad from thence upon the face of all the earth: and they left off to build the city.",
    ],
    transliteration:
      "<subject> god <verb> disperse(vt) consequently formerly from that to everywhere at earth <object> they. <subject> they <verb> stop(vt) formerly <object> <gerund> create(vt) city.",
  },
  {
    title: "Genesis 11:9",
    english: [
      "Therefore is the name of it called Babel; because the LORD did there confound the language of all the earth: and from thence did the LORD scatter them abroad upon the face of all the earth.",
    ],
    transliteration:
      "<subject> name of city <verb> be(vt) consequently <complement> <foreign> babel from <subject> god <verb> disorganize(vt) formerly at that <object> language of everyone and <verb> disperse(vt) formerly from that to everywhere at earth <object> they.",
  },
];

// The North Wind and the Sun, the passage the IPA's Handbook uses to illustrate every language
export const north_wind_sentences: Article[] = [
  {
    title: "Sentence 1",
    english: [
      "The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak.",
    ],
    transliteration:
      "at time <clause_start> <subject> traveler <verb> come(vi) formerly <complement> covered by cloak warm <clause_end> <subject> wind north and sun <verb> argue(vi) <continuous_tense_aspect> formerly about <subject> <blank> <verb_interrogative> exceed(vt) <object> other in strong.",
  },
  {
    title: "Sentence 2",
    english: [
      "They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other.",
    ],
    transliteration:
      "<subject> they <verb> agree_on(vt) formerly <object> <subject> they <verb_prescriptive> believe(vt) <object> <subject> thing <ordinal> number 1 <clause_start> <subject> <blank> <verb> cause(vt) <object> <subject> traveler <verb> take_away(vt) <object> cloak of self <clause_end> <verb> exceed(vt) <object> other in strong.",
  },
  {
    title: "Sentence 3",
    english: [
      "Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler fold his cloak around him; and at last the North Wind gave up the attempt.",
    ],
    transliteration:
      "<subject> wind north <verb> blow(vi) formerly afterwards <max_positive> strongly but <subject> traveler <verb> enclose(vt) formerly tightly by cloak <object> self and <subject> closure of cloak <verb> increase(vi) formerly with <gerund> blow(vi) of wind. <subject> wind north <verb> stop(vt) formerly afterwards <object> attempt of self.",
  },
  {
    title: "Sentence 4",
    english: ["Then the Sun shone out warmly, and immediately the traveler took off his cloak."],
    transliteration:
      "<subject> sun <verb> shine(vi) formerly afterwards warmly and <subject> traveler <verb> take_away(vt) formerly quickly <object> cloak of self.",
  },
  {
    title: "Sentence 5",
    english: ["And so the North Wind was obliged to confess that the Sun was the stronger of the two."],
    transliteration:
      "<subject> wind north <verb> be_bound_to(vt) formerly consequently <object> <verb> acknowledge(vt) <object> <subject> sun <verb> exceed(vt) <object> other in strong.",
  },
];

// The Lord's Prayer (Book of Common Prayer), the traditional sample text for comparing languages
export const lords_prayer: Article[] = [
  {
    title: "Address",
    english: ["Our Father, which art in heaven, hallowed be thy Name."],
    transliteration:
      "<clause_start> <subject> father of we at heaven <clause_end> <object> name of you <verb_prescriptive> sanctify(vt).",
  },
  {
    title: "Kingdom",
    english: ["Thy Kingdom come."],
    transliteration: "<subject> sovereignty of you <verb_prescriptive> come(vi).",
  },
  {
    title: "Will",
    english: ["Thy will be done, in earth as it is in heaven."],
    transliteration: "<object> desire of you <verb_prescriptive> do(vt) at earth as at heaven.",
  },
  {
    title: "Bread",
    english: ["Give us this day our daily bread."],
    transliteration: "<verb_prescriptive> give(vt) today to we <object> food <per> day.",
  },
  {
    title: "Forgiveness",
    english: ["And forgive us our trespasses, as we forgive them that trespass against us."],
    transliteration:
      "<verb_prescriptive> forgive(vt) for wrong of we <object> we as <subject> we <verb> forgive(vt) <object> person plural <clause_start> <subject> <blank> <verb> hurt(vt) <object> we <clause_end>.",
  },
  {
    title: "Temptation",
    english: ["And lead us not into temptation, but deliver us from evil."],
    transliteration:
      "<verb_prescriptive> not lead(vt) to temptation <object> we but <verb_prescriptive> free(vt) from <max_negative> goodness <object> we.",
  },
  {
    title: "Doxology",
    english: ["For thine is the kingdom, the power, and the glory, for ever and ever."],
    transliteration: "<subject> you <verb> possess(vt) always <object> sovereignty and ability and praise.",
  },
  {
    title: "Amen",
    english: ["Amen."],
    transliteration: "certainly.",
  },
];

export type Token =
  | { kind: "punctuation"; text: string }
  | { kind: "foreign"; text: string } // the word after <foreign>: a name or borrowing, said as written
  | {
      kind: "word";
      text: string; // as written in the transliteration
      uncertain: boolean; // marked with "?" in the transliteration
      word?: Word;
      candidate?: Candidate;
    };

// Transliteration spellings that don't match a dictionary name directly
const ALIASES: Record<string, string> = {
  i: "<pronoun_first_person>",
  me: "<pronoun_first_person>",
  you: "<pronoun_second_person>",
  it: "<pronoun_third_person>",
};

// A bracketed name is a grammar marker, named <subject>, <verb_prescriptive> and so on; anything
// else is an ordinary word, so <to> is the marker and to the preposition
function lookup(
  name: string,
  bracketed = false,
): Pick<Extract<Token, { kind: "word" }>, "word" | "candidate"> {
  if (bracketed) {
    const marker = `<${name}>`;
    const word = dictionary.get(marker);
    if (word) return { word };
    const candidate = candidates.find((c) => c.word === marker);
    return candidate ? { candidate } : {};
  }
  const key = ALIASES[name] ?? name;
  // A verb goes by either meaning, marked (vi) without an object or (vt) with one: die(vi), kill(vt)
  const word = dictionary.get(key);
  if (word) return { word };
  if (/^\d+$/.test(key)) return { word: dictionary.get(`digit_${key}`) };
  const candidate = candidates.find((c) => c.word === key);
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
    if (/^<foreign>$/i.test(raw[i - 1] ?? "") && /^[\w'-]+$/.test(text)) {
      tokens.push({ kind: "foreign", text });
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
    tokens.push({ kind: "word", text, uncertain, ...lookup(name, text.startsWith("<")) });
  }
  return tokens;
}
