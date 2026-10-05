import { type Word, toki_pona_reference } from "./dict";
import { tokenize } from "./examples";

// How the language compares with Toki Pona: the Swadesh 100, and Toki Pona's own words. An
// equivalent is a transliteration, like the examples; "" means there's no way to say it yet.
// Loose equivalents are near misses, counted but flagged.

export type Comparison = {
  english: string;
  ours: string;
  toki_pona: string; // what a Toki Pona speaker would usually say; "" for Toki Pona's own gaps
  loose?: boolean;
};

// [english, ours, toki pona, loose?]
type Row = [string, string, string, "loose"?];

const swadesh_rows: Row[] = [
  ["I", "I", "mi"],
  ["you", "you", "sina"],
  ["we", "I plural", "mi mute"],
  ["this", "this", "ni"],
  ["that", "that", "ni"],
  ["who", "person _blank", "jan seme"],
  ["what", "_blank", "seme"],
  ["not", "not", "ala"],
  ["all", "all", "ale"],
  ["many", "many", "mute"],
  ["one", "number 1", "wan"],
  ["two", "number 2", "tu"],
  ["big", "big", "suli"],
  ["long", "dimension_x big", "suli"],
  ["small", "small", "lili"],
  ["woman", "person female", "meli"],
  ["man", "person male", "mije"],
  ["person", "person", "jan"],
  ["fish", "", "kala"],
  ["bird", "", "waso"],
  ["dog", "", "soweli"],
  ["louse", "", "pipi"],
  ["tree", "", "kasi suli"],
  ["seed", "_ee sow(v)", "pan"],
  ["leaf", "", "lipu kasi"],
  ["root", "", "noka kasi"],
  ["bark", "", "selo kasi"],
  ["skin", "body surface", "selo"],
  ["flesh", "", "sijelo"],
  ["blood", "", "telo loje"],
  ["bone", "body rigid", "kiwen", "loose"],
  ["grease", "", "ko"],
  ["egg", "", "sike mama"],
  ["horn", "head rod", "palisa lawa", "loose"],
  ["tail", "tail", "palisa monsi", "loose"],
  ["feather", "", "len waso"],
  ["hair", "", "linja"],
  ["head", "head", "lawa"],
  ["ear", "body sound", "kute"],
  ["eye", "body light", "lukin"],
  ["nose", "", "nena"],
  ["mouth", "mouth", "uta"],
  ["tooth", "mouth rock", "kiwen uta"],
  ["tongue", "", "palisa uta"],
  ["claw", "finger sharp", "kiwen luka"],
  ["foot", "feet", "noka"],
  ["knee", "leg node", "noka"],
  ["hand", "hand", "luka"],
  ["belly", "torso", "insa", "loose"],
  ["neck", "", "anpa lawa"],
  ["breasts", "", "nena"],
  ["heart", "", "pilin"],
  ["liver", "", "insa"],
  ["drink", "", "moku"],
  ["eat", "eat", "moku"],
  ["bite", "mouth attack(v)", "moku"],
  ["see", "feel light", "lukin"],
  ["hear", "feel sound", "kute"],
  ["know", "know(v)", "sona"],
  ["sleep", "sleep(v)", "lape"],
  ["die", "kill(v)", "moli"],
  ["kill", "kill(v)", "moli"],
  ["swim", "", "tawa lon telo"],
  ["fly", "", "tawa lon kon"],
  ["walk", "go(v) feet", "tawa"],
  ["come", "come(v)", "kama"],
  ["lie (recline)", "", "lon supa"],
  ["sit", "", "lon supa monsi"],
  ["stand", "plumb", "lon noka", "loose"],
  ["give", "give(v)", "pana"],
  ["say", "saying", "toki"],
  ["sun", "", "suno"],
  ["moon", "", "mun"],
  ["star", "", "mun"],
  ["water", "", "telo"],
  ["rain", "", "telo sewi"],
  ["stone", "rock", "kiwen"],
  ["sand", "rock coarse", "ko", "loose"],
  ["earth", "land", "ma"],
  ["cloud", "", "ko sewi"],
  ["smoke", "", "kon seli"],
  ["fire", "", "seli"],
  ["ash", "", "ko seli"],
  ["burn", "heat(v)", "seli", "loose"],
  ["path", "path", "nasin"],
  ["mountain", "land mound", "nena"],
  ["red", "red", "loje"],
  ["green", "yellow blue", "laso"],
  ["yellow", "yellow", "jelo"],
  ["white", "bright", "walo", "loose"],
  ["black", "dark", "pimeja", "loose"],
  ["night", "time dark", "tenpo pimeja"],
  ["hot", "hot", "seli"],
  ["cold", "cold", "lete"],
  ["full", "full", "ale"],
  ["new", "new", "sin"],
  ["good", "good", "pona"],
  ["round", "round", "sike"],
  ["dry", "dry", "telo ala"],
  ["name", "symbol", "nimi", "loose"],
];

// Toki Pona word → our equivalent, for every word in toki_pona_reference except pu (the book)
export const toki_pona_equivalents: Record<string, [ours: string, loose?: "loose"]> = {
  "a/kin": [""],
  kule: ["color"],
  mute: ["many"],
  sewi: ["high"],
  akesi: [""],
  kulupu: ["group"],
  nanpa: ["number"],
  sijelo: ["body"],
  ala: ["not"],
  kute: ["feel sound"],
  nasa: ["rare", "loose"],
  sike: ["round"],
  alasa: ["search(v)"],
  la: [""],
  nasin: ["path"],
  sin: ["new"],
  ale: ["all"],
  lape: ["sleep(v)"],
  nena: ["mound"],
  sina: ["you"],
  anpa: ["low"],
  laso: ["blue"],
  ni: ["this"],
  sinpin: ["wall"],
  ante: ["different"],
  lawa: ["head"],
  nimi: ["symbol", "loose"],
  sitelen: ["mark"],
  anu: ["or"],
  len: [""],
  noka: ["leg"],
  sona: ["know(v)"],
  awen: ["persist(v)"],
  lete: ["cold"],
  o: ["<verb (prescriptive)>"],
  soweli: [""],
  e: ["<object>"],
  li: ["<verb>"],
  olin: ["love(v)"],
  suli: ["big"],
  en: ["and"],
  lili: ["small"],
  ona: ["it"],
  suno: ["light"],
  esun: ["trade"],
  linja: ["line"],
  open: ["open"],
  supa: ["surface"],
  ijo: [""],
  lipu: ["flat"],
  pakala: ["broken"],
  suwi: [""],
  ike: ["bad"],
  loje: ["red"],
  pali: ["do"],
  tan: ["from"],
  ilo: ["_tool do"],
  lon: ["at"],
  palisa: ["rod"],
  taso: [""],
  insa: ["inside"],
  luka: ["hand"],
  pan: [""],
  tawa: ["go(v)"],
  jaki: ["abhorrent", "loose"],
  lukin: ["feel light"],
  pana: ["give(v)"],
  telo: [""],
  jan: ["person"],
  lupa: ["hole"],
  pi: [""],
  tenpo: ["time"],
  jelo: ["yellow"],
  ma: ["land"],
  pilin: ["feel"],
  toki: ["saying"],
  jo: ["possess(v)"],
  mama: ["parent"],
  pimeja: ["dark"],
  tomo: [""],
  kala: [""],
  mani: ["money"],
  pini: ["stop(v)"],
  tu: ["number 2"],
  kalama: ["sound"],
  meli: ["female"],
  pipi: [""],
  unpa: [""],
  kama: ["come(v)"],
  mi: ["I"],
  poka: ["edge", "loose"],
  uta: ["mouth"],
  kasi: [""],
  mije: ["male"],
  poki: ["container"],
  utala: ["fight(v)"],
  ken: ["not impossible"],
  moku: ["eat"],
  pona: ["good"],
  walo: ["bright", "loose"],
  kepeken: ["with"],
  moli: ["dead"],
  wan: ["number 1"],
  kili: [""],
  monsi: ["back"],
  sama: ["same"],
  waso: [""],
  kiwen: ["rock"],
  mu: [""],
  seli: ["hot"],
  wawa: ["strong"],
  ko: [""],
  mun: [""],
  selo: ["surface"],
  weka: ["away"],
  kon: [""],
  musi: ["fun"],
  seme: ["_blank"],
  wile: ["desire(v)"],
};

export const swadesh: Comparison[] = swadesh_rows.map(([english, ours, toki_pona, loose]) => ({
  english,
  ours,
  toki_pona,
  loose: loose === "loose",
}));

export const toki_pona_words: Comparison[] = toki_pona_reference
  .filter(([word]) => word !== "pu")
  .map(([word, english]) => {
    const [ours, loose] = toki_pona_equivalents[word] ?? [""];
    return { english, ours, toki_pona: word, loose: loose === "loose" };
  });

function word_syllables(word: Word): number {
  return word.data.parts.length > 0
    ? word.data.parts.reduce((sum, part) => sum + word_syllables(part), 0)
    : 1;
}

// Syllables in our transliteration, or undefined if any word in it has no root yet
export function our_syllables(transliteration: string): number | undefined {
  if (!transliteration) return undefined;
  let total = 0;
  for (const token of tokenize(transliteration)) {
    if (token.kind !== "word") continue;
    if (!token.word) return undefined;
    total += word_syllables(token.word);
  }
  return total;
}

// Toki Pona syllables are (C)V(n), so each vowel is one syllable
export function toki_pona_syllables(phrase: string): number | undefined {
  return phrase ? (phrase.match(/[aeiou]/g) ?? []).length : undefined;
}

export type Tally = {
  total: number;
  covered: number; // we have an equivalent
  loose: number;
  shorter: number; // both have one, and ours is shorter
  same: number;
  longer: number;
  our_syllables: number; // over the concepts both can say
  their_syllables: number;
};

export function tally(rows: Comparison[]): Tally {
  const t: Tally = {
    total: rows.length,
    covered: 0,
    loose: 0,
    shorter: 0,
    same: 0,
    longer: 0,
    our_syllables: 0,
    their_syllables: 0,
  };
  for (const row of rows) {
    const ours = our_syllables(row.ours);
    const theirs = toki_pona_syllables(row.toki_pona);
    if (ours === undefined) continue;
    t.covered++;
    if (row.loose) t.loose++;
    if (theirs === undefined) continue;
    if (ours < theirs) t.shorter++;
    else if (ours === theirs) t.same++;
    else t.longer++;
    t.our_syllables += ours;
    t.their_syllables += theirs;
  }
  return t;
}
