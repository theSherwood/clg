import { afterEach, describe, expect, test } from "bun:test";
import { dictionary } from "./dict";
import {
  type Phonology,
  check_phonology,
  default_phonology,
  is_phonology,
  load_phonology,
  marks_of,
  phonology_to_json,
  pronounce,
  save_phonology,
  syllable_of,
} from "./phonology";

// A fixed phonology, so these tests don't change when the defaults do
const fixture: Phonology = {
  places: ["labial", "velar", "coronal", "sibilant"],
  manners: ["unvoiced", "voiced", "fricative", "voiced fricative"],
  onsets: [
    ["p", "k", "t", "s"],
    ["b", "g", "d", "z"],
    ["f", "kh", "th", "sh"],
    ["v", "gh", "dh", "zh"],
  ],
  vowels: ["a", "e", "o", "u"],
  finals: ["", "n/m", "r/l", "y"],
  order: ["C", "M", "V", "N"],
};

describe("syllables", () => {
  test("each digit of the ID selects one mark, fastest first", () => {
    expect(marks_of(0, fixture)).toEqual({ C: 0, M: 0, V: 0, N: 0 });
    expect(marks_of(1 + 4 * 2 + 16 * 3 + 64 * 1, fixture)).toEqual({ C: 1, M: 2, V: 3, N: 1 });
    expect(marks_of(1, { ...fixture, order: ["N", "V", "M", "C"] })).toEqual({
      C: 0,
      M: 0,
      V: 0,
      N: 1,
    });
  });

  test("a syllable is onset + vowel + final, spelled with the first variant", () => {
    expect([0, 1, 4, 16, 64, 255].map((id) => syllable_of(id, fixture))).toEqual([
      "pa",
      "ka",
      "ba",
      "pe",
      "pan",
      "zhuy",
    ]);
  });

  test("a compound is its roots' syllables in sequence, unchanged", () => {
    const small = dictionary.get("small")!;
    const parts = small.data.parts.map((part) => pronounce(part, fixture));
    expect(pronounce(small, fixture)).toBe(parts.join(""));
  });
});

describe("checks", () => {
  test("the defaults pass", () => {
    expect(is_phonology(default_phonology)).toBe(true);
    expect(check_phonology(default_phonology)).toEqual({
      duplicates: [],
      onset_final_overlap: [],
      ambiguous_pairs: [],
      ambiguous_pair_count: 0,
    });
  });

  test("catch duplicate syllables", () => {
    const report = check_phonology({ ...fixture, vowels: ["a", "a", "o", "u"] });
    expect(report.duplicates.length).toBe(64);
  });

  test("catch a sound that is an onset and a final, in any variant", () => {
    expect(
      check_phonology({ ...fixture, finals: ["", "n/m", "r/l", "y/s"] }).onset_final_overlap,
    ).toEqual(["s"]);
  });

  test("catch sequences that split two ways", () => {
    const h = {
      ...fixture,
      onsets: fixture.onsets.map((row) => row.map((o) => (o === "kh" ? "h" : o))),
    };
    const report = check_phonology({ ...h, finals: ["", "n/m", "r/l", "s"] });
    expect(report.ambiguous_pairs).toContain("pa.sha = pas.ha");
  });

  test("is_phonology rejects malformed settings", () => {
    expect(is_phonology(null)).toBe(false);
    expect(is_phonology({ ...fixture, order: ["C", "C", "V", "N"] })).toBe(false);
    expect(is_phonology({ ...fixture, vowels: ["a", "e", "o"] })).toBe(false);
  });

  test("JSON round-trips", () => {
    expect(JSON.parse(phonology_to_json(fixture))).toEqual(fixture);
  });
});

describe("storage", () => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  } as Storage;
  afterEach(() => store.clear());

  test("only edited groups are stored", () => {
    save_phonology(default_phonology);
    expect(store.size).toBe(0);
    save_phonology({ ...default_phonology, finals: ["", "n/m", "r/l", "w"] });
    expect(JSON.parse([...store.values()][0]!)).toEqual({ finals: ["", "n/m", "r/l", "w"] });
    expect(load_phonology()).toEqual({ ...default_phonology, finals: ["", "n/m", "r/l", "w"] });
  });

  test("older saved copies are discarded", () => {
    store.set("clg.phonology.v2", JSON.stringify(fixture));
    expect(load_phonology()).toEqual(default_phonology);
    expect(store.has("clg.phonology.v2")).toBe(false);
  });
});
