import { describe, expect, test } from "bun:test";
import {
  axes,
  candidates,
  data_errors,
  dictionary,
  is_root,
  sections,
  verb_types,
  words,
} from "./dict";

const core = sections.filter((s) => s.start < 128);
const roots = words.filter(is_root);

describe("sections", () => {
  test("core sections fit in IDs 0-127 without overlapping", () => {
    const sorted = [...core].sort((a, b) => a.start - b.start);
    for (const [i, s] of sorted.entries()) {
      expect(s.end).toBeLessThanOrEqual(128);
      if (i > 0) expect(s.start).toBeGreaterThanOrEqual(sorted[i - 1]!.end);
    }
  });

  test("the shared sections (axis words, digits) are in IDs 128-255", () => {
    for (const s of sections.filter((s) => s.start >= 128)) expect(s.end).toBeLessThanOrEqual(256);
  });

  test("every root is inside its section", () => {
    for (const word of roots) {
      const s = sections.find((s) => s.key === word.data.section)!;
      expect(word.data.id, word.word).toBeGreaterThanOrEqual(s.start);
      expect(word.data.id, word.word).toBeLessThan(s.end);
    }
  });

  test("domain words are in the first 128 roots", () => {
    for (const word of roots.filter((w) => w.data.t.includes("domain_specifier"))) {
      expect(word.data.id, word.word).toBeLessThan(128);
    }
  });
});

describe("words", () => {
  test("no data errors", () => {
    expect(data_errors).toEqual([]);
  });

  test("every compound's parts are in the dictionary", () => {
    for (const word of words.filter((w) => !is_root(w))) {
      for (const part of word.data.parts) expect(dictionary.get(part.word), word.word).toBe(part);
    }
  });

  test("candidates are unique and don't duplicate words", () => {
    const names = candidates.map((c) => c.word);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(dictionary.has(name), name).toBe(false);
  });
});

// Root IDs decide sounds, so this catches IDs shifting by accident. After an intended change,
// review the diff and run `bun test --update-snapshots`.
test("root IDs", () => {
  const by_id: Record<number, string> = {};
  for (const word of roots.filter((w) => w.data.section !== "digit")) {
    by_id[word.data.id] = by_id[word.data.id] ? `${by_id[word.data.id]}, ${word.word}` : word.word;
  }
  expect(by_id).toMatchSnapshot();
});

describe("verb types", () => {
  test("every axis verb has a type, and every typed verb is an axis's positive verb", () => {
    const positive_verbs = axes.flatMap((a) => (a.positive.verb_i.word ? [a] : []));
    expect(positive_verbs.filter((a) => !a.verb_type).map((a) => a.positive.verb_i.word!.word)).toEqual([]);
    const names = new Set(positive_verbs.map((a) => a.positive.verb_i.word!.word));
    expect(Object.values(verb_types).flat().filter((v) => !names.has(v))).toEqual([]);
  });

  test("each side's verb forms follow its axis's type", () => {
    const broken = axes.flatMap((axis) =>
      [axis.positive, axis.negative].flatMap((side) => {
        const verb = side.verb_i.word?.word;
        if (!verb) return [];
        const { gloss: no_object } = side.verb_i;
        const { gloss: with_object } = side.verb_t;
        // be(vi), existing or being somewhere, is the one relation verb with a meaning without an object
        const ok =
          axis.verb_type === "relation"
            ? (!no_object || verb === "be(vt)") && !!with_object
            : !!no_object && !!with_object;
        return ok ? [] : [`${verb} (${axis.verb_type})`];
      }),
    );
    expect(broken).toEqual([]);
  });
});
