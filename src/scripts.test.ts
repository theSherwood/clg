import { expect, test } from "bun:test";
import { default_phonology } from "./phonology";
import {
  braille_cell,
  clashes,
  default_braille,
  default_syllabics,
  script_tokens,
  syllabics_glyphs,
} from "./scripts";

const ids = Array.from({ length: 256 }, (_, id) => id);

test("the default braille gives every syllable its own cell, leaving the blank one to unused su", () => {
  const cells = ids.map((id) => braille_cell(id, default_phonology, default_braille));
  expect(new Set(cells).size).toBe(256);
  expect(cells.indexOf("⠀")).toBe(15);
  for (const mark of default_braille.rows) {
    expect(clashes(default_braille.states[mark], mark, default_phonology)).toEqual([]);
  }
});

test("the default syllabics gives every syllable its own pair of glyphs", () => {
  const pairs = ids.map((id) => syllabics_glyphs(id, default_phonology, default_syllabics));
  expect(new Set(pairs).size).toBe(256);
  expect(pairs.every((p) => [...p].length === 2)).toBe(true);
  // ka: velar unvoiced onset, then a with no final
  expect(pairs[0]).toBe("ᐳᐯ");
});

test("a transliteration becomes root IDs word by word, foreign names included", () => {
  const tokens = script_tokens("<subject> person <foreign> adam.", default_phonology);
  expect(tokens.map((t) => ("punctuation" in t ? t.punctuation : t.ids?.length))).toEqual([1, 1, 1, 2, "."]);
});
