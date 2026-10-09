import { expect, test } from "bun:test";
import { default_phonology } from "./phonology";
import {
  clashes,
  default_line,
  default_stems,
  default_syllabics,
  layout_values,
  script_tokens,
  syllabics_glyphs,
} from "./scripts";

const ids = Array.from({ length: 256 }, (_, id) => id);

test("the default stems and line marks give every syllable its own drawing", () => {
  for (const layout of [default_stems, default_line]) {
    const drawings = ids.map((id) => layout_values(id, default_phonology, layout).join(""));
    expect(new Set(drawings).size).toBe(256);
    for (const mark of layout.order) {
      expect(clashes(layout.values[mark], mark, default_phonology)).toEqual([]);
    }
  }
});

test("the default syllabics gives every syllable its own pair of glyphs", () => {
  const pairs = ids.map((id) => syllabics_glyphs(id, default_phonology, default_syllabics));
  expect(new Set(pairs).size).toBe(256);
  expect(pairs.every((p) => [...p].length === 2)).toBe(true);
  // ka: velar unvoiced onset, then a with no final, both the first value of every mark
  expect(pairs[0]).toBe("ᐯᐯ");
});

test("a transliteration becomes root IDs word by word, foreign names included", () => {
  const tokens = script_tokens("<subject> person <foreign> adam.", default_phonology);
  expect(tokens.map((t) => ("punctuation" in t ? t.punctuation : t.ids?.length))).toEqual([1, 1, 1, 2, "."]);
});
