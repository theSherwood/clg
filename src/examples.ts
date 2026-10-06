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
    transliteration: "<subject> I <verb> sleep_vi",
  },
  {
    title: "Past",
    english: "I slept",
    transliteration: "<subject> I <verb> sleep_vi formerly",
  },
  {
    title: "Future",
    english: "I will sleep",
    transliteration: "<subject> I <verb> sleep_vi henceforth",
  },
  {
    title: "Hesitation",
    english: "I, um, slept",
    transliteration: "<subject> I <verb> <filler> sleep_vi formerly",
  },
  {
    title: "Continuous",
    english: "I'm sleeping (or was, or will be)",
    transliteration: "<subject> I <verb> sleep_vi <continuous_tense_aspect>",
  },
  {
    title: "Past continuous",
    english: "I was sleeping",
    transliteration: "<subject> I <verb> sleep_vi <continuous_tense_aspect> formerly",
  },
  {
    title: "Perfect",
    english: "The person has learned the way",
    transliteration: "<subject> person <verb> learn_vt <perfect_tense_aspect> <object> path",
  },
  {
    title: "Future perfect",
    english: "The person will have learned the way",
    transliteration: "<subject> person <verb> learn_vt <perfect_tense_aspect> henceforth <object> path",
  },
  {
    title: "Perfect continuous",
    english: "I have been working",
    transliteration: "<subject> I <verb> work_vi <continuous_tense_aspect> <perfect_tense_aspect>",
  },
  {
    title: "Remote past",
    english: "The person died long ago",
    transliteration: "<subject> person <verb> die_vi <max_negative> henceforth",
  },
  {
    title: "Recent past",
    english: "The person just left",
    transliteration: "<subject> person <verb> go_vi <min_negative> henceforth",
  },
  {
    title: "Near future",
    english: "I'll give you money soon",
    transliteration: "<subject> I <verb> give_vt <min_positive> henceforth <object> money to you",
  },
  {
    title: "Now",
    english: "Right now, I'm sleeping",
    transliteration: "<subject> I <verb> sleep_vi <continuous_tense_aspect> <neutral> henceforth",
  },
  {
    title: "Time carries over",
    english: "Long ago, a person gave money. They left. (both past)",
    transliteration:
      "<subject> person <verb> give_vt <max_negative> henceforth <object> money. <subject> it <verb> go_vi.",
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
  { title: "Year", english: "A year", transliteration: "time <rank_6>" },
  { title: "Counted", english: "Three days", transliteration: "time <rank_3> number 3" },
  { title: "Today", english: "Today", transliteration: "time <rank_3> this" },
  {
    title: "Yesterday",
    english: "I slept yesterday",
    transliteration: "<subject> I <verb> sleep_vi at time <rank_3> previous",
  },
  {
    title: "Tomorrow",
    english: "I will work tomorrow",
    transliteration: "<subject> I <verb> work_vi at time <rank_3> next",
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
      "<subject> it <verb> say_vt formerly <object> <clause_start> <verb> come_vi at time <rank_3> next",
  },
  {
    title: "Precede",
    english: "Eating comes before sleeping",
    transliteration: "<subject> <gerund> eat_vt <verb> precede_vt <object> <gerund> sleep_vi",
  },
  {
    title: "Follow",
    english: "I'm after you (in line)",
    transliteration: "<subject> I <verb> follow_vt <object> you",
  },
  {
    title: "The next one",
    english: "The next person came",
    transliteration: "<subject> person next <verb> come_vi formerly",
  },
];

export const truth_examples: Example[] = [
  {
    title: "Certainly",
    english: "The person certainly died",
    transliteration: "<subject> person <verb> die_vi <max_positive> truly",
  },
  {
    title: "Plain",
    english: "The person died",
    transliteration: "<subject> person <verb> die_vi",
  },
  {
    title: "Probably",
    english: "The person probably died",
    transliteration: "<subject> person <verb> die_vi <min_positive> truly",
  },
  {
    title: "Maybe",
    english: "Maybe the person left",
    transliteration: "<subject> person <verb> go_vi <neutral> truly",
  },
  {
    title: "Probably not",
    english: "The person probably didn't leave",
    transliteration: "<subject> person <verb> go_vi <min_negative> truly",
  },
  {
    title: "Proved",
    english: "The person has proved it",
    transliteration: "<subject> person <verb> prove_vt <perfect_tense_aspect> <object> it",
  },
  {
    title: "Belief and likelihood",
    english: "I believe the person probably left",
    transliteration:
      "<subject> I <verb> believe_vt <object> <clause_start> <subject> person <verb> go_vi <min_positive> truly <clause_end>",
  },
  {
    title: "Necessary",
    english: "Everyone necessarily dies",
    transliteration: "<subject> person all <verb> die_vi necessarily",
  },
  {
    title: "Possible",
    english: "A person can learn: it's not impossible",
    transliteration: "<subject> person <verb> learn_vi not impossibly",
  },
  {
    title: "Contingent",
    english: "The person dies, but not necessarily",
    transliteration: "<subject> person <verb> die_vi <neutral> necessarily",
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
      "<subject> parent <rank_2> of me <verb> possess_vt <object> <max_positive> child many",
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
    transliteration: "<subject> rock <verb> be_vt <complement> red yellow",
  },
];

// Nouns from verbs: who does it, what it's done to, what it's done with, and where
export const role_examples: Example[] = [
  { title: "Teacher", english: "whoever teaches", transliteration: "<er> educate_vt" },
  { title: "Food", english: "what's eaten", transliteration: "<ee> eat_vt" },
  { title: "Seed", english: "what's sown", transliteration: "<ee> sow_vt" },
  { title: "Key", english: "what you open with", transliteration: "<tool> open_vt" },
  { title: "Weapon", english: "what you fight with", transliteration: "<tool> fight_vt" },
  { title: "Shovel", english: "what you dig with", transliteration: "<tool> dig_vt" },
  { title: "Tool", english: "what you do things with", transliteration: "<tool> do_vt" },
  { title: "Ear", english: "what you hear with", transliteration: "<tool> hear_vt" },
  { title: "Eye", english: "what you sense light with", transliteration: "<tool> sense_vt light" },
  { title: "Word", english: "what's said", transliteration: "<ee> say_vt" },
  { title: "Text", english: "what's written", transliteration: "<ee> write_vt" },
  { title: "Reader", english: "whoever reads", transliteration: "<er> read_vi" },
  { title: "Mark", english: "a lesser writing", transliteration: "<min_positive> write_vi" },
  { title: "Bed", english: "where you sleep", transliteration: "<place> sleep_vi" },
  { title: "Birthplace", english: "where you came to life", transliteration: "<place> come_to_life_vi" },
  { title: "School", english: "where you learn", transliteration: "<place> learn_vi" },
  { title: "Shop", english: "where you buy", transliteration: "<place> shop_vi" },
  { title: "Workplace", english: "where you work", transliteration: "<place> work_vi" },
  { title: "Sender", english: "whoever sends", transliteration: "<er> send_vi" },
  { title: "Package", english: "what's sent", transliteration: "<ee> send_vt" },
  { title: "Addressee", english: "whom it's sent to", transliteration: "<to> send_vt" },
  { title: "Recipient", english: "whom it's given to", transliteration: "<to> give_vt" },
  { title: "Destination", english: "where you go", transliteration: "<to> go_vi" },
  { title: "Origin", english: "where you come from", transliteration: "<from> come_vi" },
  { title: "Source", english: "what you learn from", transliteration: "<from> learn_vt" },
  { title: "Material", english: "what something is created from", transliteration: "<from> create_vt" },
  {
    title: "A sentence",
    english: "I send you money",
    transliteration: "<subject> I <verb> send_vt <object> money to you",
  },
];

// Questions: <blank> stands for what's asked, in whatever role or phrase it's asked about
export const question_examples: Example[] = [
  { title: "Yes or no", english: "Do you sleep?", transliteration: "<subject> you <verb_interrogative> sleep_vi" },
  {
    title: "Who",
    english: "Who killed the person?",
    transliteration: "<subject> person <blank> <verb_interrogative> kill_vt <object> person",
  },
  {
    title: "What",
    english: "What do you eat?",
    transliteration: "<subject> you <verb_interrogative> eat_vt <object> <blank>",
  },
  {
    title: "Where",
    english: "Where do you sleep?",
    transliteration: "<subject> you <verb_interrogative> sleep_vi at <blank>",
  },
  {
    title: "Where to",
    english: "Where are you going?",
    transliteration: "<subject> you <verb_interrogative> go_vi to <blank>",
  },
  {
    title: "Where from",
    english: "Where do you come from?",
    transliteration: "<subject> you <verb_interrogative> come_vi from <blank>",
  },
  {
    title: "When",
    english: "When did the person die?",
    transliteration: "<subject> person <verb_interrogative> die_vi at time <blank>",
  },
  {
    title: "Why",
    english: "Why do you fight?",
    transliteration: "<subject> you <verb_interrogative> fight_vi for <blank>",
  },
  {
    title: "How",
    english: "How do you open it?",
    transliteration: "<subject> you <verb_interrogative> open_vt <object> it with <blank>",
  },
  {
    title: "How many",
    english: "How many children do you have?",
    transliteration: "<subject> you <verb_interrogative> possess_vt <object> child number <blank>",
  },
];

// self and other, and joining clauses with but
export const self_other_examples: Example[] = [
  { title: "Myself", english: "I know myself", transliteration: "<subject> I <verb> know_vt <object> self" },
  {
    title: "Each other",
    english: "They love each other",
    transliteration: "<subject> it plural <verb> love_vt <object> other",
  },
  {
    title: "One another",
    english: "Everyone should act towards one another",
    transliteration: "<subject> person all <verb_prescriptive> act_vi to other",
  },
  { title: "One's own", english: "one's own family", transliteration: "family of self" },
  { title: "Another", english: "another person", transliteration: "person other" },
  {
    title: "But",
    english: "I sleep, but you work",
    transliteration: "<subject> I <verb> sleep_vi but <subject> you <verb> work_vi",
  },
];

// Water, and fire: burn and quench are the max steps of heat
export const water_fire_examples: Example[] = [
  { title: "Water", english: "water", transliteration: "water" },
  { title: "Fire", english: "heat at its fullest (max_positive heat)", transliteration: "fire" },
  { title: "Drink", english: "I drink water", transliteration: "<subject> I <verb> eat_vt <object> water" },
  { title: "Burn", english: "The land is burning", transliteration: "<subject> land <verb> burn_vi <continuous_tense_aspect>" },
  {
    title: "Set on fire",
    english: "The person burns the rod",
    transliteration: "<subject> person <verb> burn_vt <object> rod",
  },
  {
    title: "Put out",
    english: "Water puts out fire",
    transliteration: "<subject> water <verb> quench_vt <object> fire",
  },
  {
    title: "Go out, but",
    english: "The fire went out, but the rock is hot",
    transliteration:
      "<subject> fire <verb> go_out_vi formerly but <subject> rock <verb> be_vt <complement> hot",
  },
];

// One celestial root; rank picks the level of the orbital hierarchy, and this makes it ours
export const sky_examples: Example[] = [
  { title: "Celestial body", english: "any body in the sky", transliteration: "celestial" },
  { title: "Asteroid or comet", english: "rank 0: debris", transliteration: "celestial <rank_0>" },
  { title: "Moon", english: "rank 1: orbits a planet", transliteration: "celestial <rank_1>" },
  { title: "Planet", english: "rank 2: orbits a star", transliteration: "celestial <rank_2>" },
  { title: "Star", english: "rank 3", transliteration: "celestial <rank_3>" },
  { title: "Galaxy", english: "rank 4", transliteration: "celestial <rank_4>" },
  { title: "The Moon", english: "our moon", transliteration: "celestial <rank_1> this" },
  { title: "Earth", english: "our planet", transliteration: "celestial <rank_2> this" },
  { title: "The Sun", english: "our star", transliteration: "celestial <rank_3> this" },
  { title: "The Milky Way", english: "our galaxy", transliteration: "celestial <rank_4> this" },
  { title: "Many stars", english: "many stars", transliteration: "celestial <rank_3> many" },
  {
    title: "A sentence",
    english: "The Sun is bright",
    transliteration: "<subject> celestial <rank_3> this <verb> be_vt <complement> bright",
  },
];

// Comparison is a relation verb, exceed; in names the quality compared
export const comparison_examples: Example[] = [
  {
    title: "Bigger than",
    english: "The rock is bigger than the person",
    transliteration: "<subject> rock <verb> exceed_vt <object> person in big",
  },
  {
    title: "Smaller than",
    english: "The person is smaller than the rock",
    transliteration: "<subject> person <verb> fall_short_of_vt <object> rock in big",
  },
  {
    title: "As big as",
    english: "The rock is as big as the person",
    transliteration: "<subject> rock <verb> equal_vt <object> person in big",
  },
  {
    title: "Biggest",
    english: "The Sun is the biggest",
    transliteration: "<subject> celestial <rank_3> this <verb> exceed_vt <object> all in big",
  },
  {
    title: "Much bigger",
    english: "The Sun is much bigger than Earth",
    transliteration:
      "<subject> celestial <rank_3> this <verb> <max_positive> exceed_vt <object> celestial <rank_2> this in big",
  },
  {
    title: "Slightly faster",
    english: "You are slightly faster than me",
    transliteration: "<subject> you <verb> <min_positive> exceed_vt <object> me in fast",
  },
  {
    title: "More than",
    english: "I have more money than you",
    transliteration: "<subject> money of me <verb> exceed_vt <object> money of you",
  },
  {
    title: "Question",
    english: "Who is the strongest?",
    transliteration: "<subject> person <blank> <verb_interrogative> exceed_vt <object> all in strong",
  },
];

// One geometry root; rank counts dimensions
export const geometry_examples: Example[] = [
  { title: "Point", english: "no dimensions", transliteration: "geometry <rank_0>" },
  { title: "Line", english: "one dimension", transliteration: "geometry <rank_1>" },
  { title: "Shape", english: "two dimensions", transliteration: "geometry <rank_2>" },
  { title: "Form", english: "three dimensions: a solid", transliteration: "geometry <rank_3>" },
  { title: "Straight line", english: "a plumb line", transliteration: "geometry <rank_1> plumb" },
  { title: "Curve", english: "a round line", transliteration: "geometry <rank_1> round" },
  { title: "Circle", english: "a round shape", transliteration: "geometry <rank_2> round" },
  { title: "Polygon", english: "an angled shape", transliteration: "geometry <rank_2> angle" },
  { title: "Sphere", english: "a round form", transliteration: "geometry <rank_3> round" },
  {
    title: "A sentence",
    english: "Earth is a sphere",
    transliteration: "<subject> celestial <rank_2> this <verb> be_vt <complement> geometry <rank_3> round",
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
    transliteration: "<subject> you <verb_interrogative> desire <object> thing <blank>",
  },
  { title: "Animal", english: "an animal", transliteration: "animal" },
  { title: "Young animal", english: "an animal's child", transliteration: "animal child" },
  {
    title: "Animals eat",
    english: "The animal eats food",
    transliteration: "<subject> animal <verb> eat_vt <object> <ee> eat_vt",
  },
  { title: "Solid", english: "rank 0", transliteration: "matter <rank_0>" },
  { title: "Liquid", english: "rank 1", transliteration: "matter <rank_1>" },
  { title: "Gas", english: "rank 2", transliteration: "matter <rank_2>" },
  { title: "Plasma", english: "rank 3", transliteration: "matter <rank_3>" },
  { title: "Ice", english: "solid water", transliteration: "water matter <rank_0>" },
  { title: "Steam", english: "water as a gas", transliteration: "water matter <rank_2>" },
  {
    title: "A sentence",
    english: "Water is a liquid",
    transliteration: "<subject> water <verb> be_vt <complement> matter <rank_1>",
  },
  { title: "Melt", english: "The ice melts", transliteration: "<subject> water matter <rank_0> <verb> melt_vi" },
  {
    title: "Up a phase",
    english: "The water evaporated (melt, said of a liquid)",
    transliteration: "<subject> water <verb> melt_vi formerly",
  },
  {
    title: "Target phase",
    english: "The water evaporated, explicitly",
    transliteration: "<subject> water <verb> evaporate_vi formerly",
  },
  {
    title: "Condense",
    english: "Steam condenses on the wall",
    transliteration: "<subject> water matter <rank_2> <verb> condense_vi at wall",
  },
  {
    title: "With an object",
    english: "The sun melts the ice",
    transliteration: "<subject> celestial <rank_3> this <verb> melt_vt <object> water matter <rank_0>",
  },
  { title: "Freeze", english: "Freeze the water", transliteration: "<verb_prescriptive> freeze_vt <object> water" },
];

// Pointing words: this, that and <blank> with a preposition or a general noun
export const pointing_examples: Example[] = [
  { title: "Here", english: "I sleep here", transliteration: "<subject> I <verb> sleep_vi at this" },
  { title: "There", english: "You work there", transliteration: "<subject> you <verb> work_vi at that" },
  { title: "Where", english: "Where do you sleep?", transliteration: "<subject> you <verb_interrogative> sleep_vi at <blank>" },
  { title: "Come here", english: "Come here!", transliteration: "<verb_prescriptive> come_vi to this" },
  { title: "From there", english: "I came from there", transliteration: "<subject> I <verb> come_vi formerly from that" },
  { title: "This place", english: "This place is big", transliteration: "<subject> place this <verb> be_vt <complement> big" },
  { title: "That person", english: "that person", transliteration: "person that" },
  { title: "Which person", english: "Which person left?", transliteration: "<subject> person <blank> <verb_interrogative> go_vi" },
  { title: "This thing", english: "I want this thing", transliteration: "<subject> I <verb> desire <object> thing this" },
];

// Subclauses: one bracket, <clause_start> ... <clause_end>, as an object, after a preposition, or
// after a noun with <blank> marking the noun's place
export const clause_examples: Example[] = [
  {
    title: "That…",
    english: "I believe the person left",
    transliteration: "<subject> I <verb> believe_vt <object> <clause_start> <subject> person <verb> go_vi",
  },
  {
    title: "To…",
    english: "I want to sleep (the subclause takes my subject)",
    transliteration: "<subject> I <verb> desire <object> <clause_start> <verb> sleep_vi",
  },
  {
    title: "Because",
    english: "I'm tired because I worked",
    transliteration:
      "<subject> I <verb> be_vt <complement> weak from <clause_start> <subject> I <verb> work_vi formerly",
  },
  {
    title: "When",
    english: "When you slept, I worked",
    transliteration:
      "at time <clause_start> <subject> you <verb> sleep_vi <clause_end> <subject> I <verb> work_vi formerly",
  },
  {
    title: "So that",
    english: "I work so that you can sleep",
    transliteration:
      "<subject> I <verb> work_vi for <clause_start> <subject> you <verb> sleep_vi not impossibly",
  },
  {
    title: "Until",
    english: "Work until the Sun rises",
    transliteration:
      "<verb_prescriptive> work_vi to time <clause_start> <subject> celestial <rank_3> this <verb> rise_vi",
  },
  {
    title: "If",
    english: "If it burns, put it out",
    transliteration:
      "if <clause_start> <subject> it <verb> burn_vi <clause_end> <verb_prescriptive> quench_vt <object> it",
  },
  {
    title: "Who",
    english: "the person who defended me",
    transliteration: "person <clause_start> <subject> <blank> <verb> defend_vt <object> me <clause_end>",
  },
  {
    title: "That (object)",
    english: "the rock that I burned",
    transliteration: "rock <clause_start> <subject> I <verb> burn_vt formerly <object> <blank> <clause_end>",
  },
  {
    title: "Where",
    english: "the place where I sleep",
    transliteration: "place <clause_start> <subject> I <verb> sleep_vi at <blank> <clause_end>",
  },
  {
    title: "To whom",
    english: "the person I gave money to",
    transliteration:
      "person <clause_start> <subject> I <verb> give_vt formerly <object> money to <blank> <clause_end>",
  },
  {
    title: "In a sentence",
    english: "The person who defended me is strong",
    transliteration:
      "<subject> person <clause_start> <subject> <blank> <verb> defend_vt <object> me <clause_end> <verb> be_vt <complement> strong",
  },
];

// One cardinal root; rank counts quarter turns clockwise from north
export const direction_examples: Example[] = [
  { title: "North", english: "rank 0", transliteration: "cardinal <rank_0>" },
  { title: "East", english: "rank 1: a quarter turn", transliteration: "cardinal <rank_1>" },
  { title: "South", english: "rank 2: a half turn", transliteration: "cardinal <rank_2>" },
  { title: "West", english: "rank 3", transliteration: "cardinal <rank_3>" },
  {
    title: "Northward",
    english: "Go north",
    transliteration: "<verb_prescriptive> go_vi to cardinal <rank_0>",
  },
  {
    title: "In the east",
    english: "The Sun rises in the east",
    transliteration: "<subject> celestial <rank_3> this <verb> rise_vi at cardinal <rank_1>",
  },
  {
    title: "Where from",
    english: "I came from the south",
    transliteration: "<subject> I <verb> come_vi formerly from cardinal <rank_2>",
  },
];

// Arithmetic: count takes rank for the operation and negative for its inverse; by gives the amount
export const arithmetic_examples: Example[] = [
  { title: "Count", english: "Count to ten", transliteration: "<verb_prescriptive> count_vi to number 1 0" },
  { title: "Count down", english: "Count down from ten", transliteration: "<verb_prescriptive> count_down_vi from number 1 0" },
  { title: "Add", english: "Add 2 to 5", transliteration: "<verb_prescriptive> count_vt <rank_1> <object> number 5 by number 2" },
  {
    title: "Subtract",
    english: "Subtract 2 from 5",
    transliteration: "<verb_prescriptive> count_down_vt <rank_1> <object> number 5 by number 2",
  },
  { title: "Multiply", english: "Multiply 5 by 2", transliteration: "<verb_prescriptive> count_vt <rank_2> <object> number 5 by number 2" },
  { title: "Divide", english: "Divide 6 by 3", transliteration: "<verb_prescriptive> count_down_vt <rank_2> <object> number 6 by number 3" },
  { title: "Power", english: "Square 5", transliteration: "<verb_prescriptive> count_vt <rank_3> <object> number 5 by number 2" },
  {
    title: "Root",
    english: "Take the square root of 9",
    transliteration: "<verb_prescriptive> count_down_vt <rank_3> <object> number 9 by number 2",
  },
  {
    title: "Logarithm",
    english: "The rank of 1000 is 3",
    transliteration: "<subject> rank of number 1 <rank_3> <verb> equal_vt <object> number 3",
  },
  {
    title: "A sentence",
    english: "If you add 2 to 3, you get 5",
    transliteration:
      "if <clause_start> <subject> you <verb> count_vt <rank_1> <object> number 3 by number 2 <clause_end> <subject> you <verb> possess_vt <object> number 5",
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
      "<subject> person all <verb?> be_vt <complement> free and equal_vt in value and privilege. <subject> it all <verb> possess_vt <object> reason and conscience? and <verb_prescriptive> act_vi for other and in manner family?. ??",
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
      "<subject> person all <verb> possess_vt <object> right of life and freedom and safety.",
  },
  {
    title: "Article 4",
    english: [
      "No one shall be held in slavery or servitude; slavery and the slave trade shall be prohibited in all their forms.",
    ],
    transliteration:
      "<subject> person none <verb_prescriptive> be_vt <complement> <ee> force_vt. <object> <gerund> use_force_vi and trade <ee> force_vt in geometry <rank_2> all <verb_prescriptive> forbid_vi.",
  },
  {
    title: "Article 5",
    english: [
      "No one shall be subjected to torture or to cruel, inhuman or degrading treatment or punishment.",
    ],
    transliteration:
      "<object> person none <verb_prescriptive> suffer_vi or lose_importance_vi.",
  },
  {
    title: "Article 6",
    english: ["Everyone has the right to recognition everywhere as a person before the law."],
    transliteration:
      "<subject> person all <verb> possess_vt <object> right of <gerund> know_vt as person by law.",
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
      "<object> person none <verb_prescriptive> get_stuck_vi or exit_vi randomly.",
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
  // A verb goes by either meaning, marked _vi without an object or _vt with one: die_vi, kill_vt
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
