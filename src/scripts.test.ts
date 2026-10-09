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

test("subclauses become circles: brackets, the grammar's unbracketed clauses, and nesting", async () => {
  const { circle_sentences } = await import("./script_drawings");
  const shape = (items: any[]): string =>
    items.map((i) => ("clause" in i ? `[${shape(i.clause)}]` : "period" in i ? "." : (i.word?.word ?? "?"))).join(" ");
  const read = (t: string) =>
    circle_sentences(script_tokens(t, default_phonology), () => ({ strokes: [], marks: [], width: 1 }), 30, true).map(shape);
  // After a role marker, a clause starting with a verb marker is a subclause without brackets
  expect(read("<subject> I <verb> desire(vt) <object> <verb> sleep(vi).")).toEqual([
    "<subject> <pronoun_first_person> <verb> desire(vt) <object> [<verb> sleep(vi)] .",
  ]);
  // After a preposition, one starting with <subject>
  expect(read("<subject> I <verb> sleep(vi) from <subject> I <verb> be(vt) <complement> weak.")[0]).toBe(
    "<subject> <pronoun_first_person> <verb> sleep(vi) from [<subject> <pronoun_first_person> <verb> be(vt) <complement> weak] .",
  );
  // Brackets aren't written; a bracket's <clause_end> closes the unbracketed clauses inside it
  expect(read("<subject> person <clause_start> <subject> <blank> <verb> say(vt) <object> <verb> sleep(vi) <clause_end> <verb> come(vi).")[0]).toBe(
    "<subject> person [<subject> <blank> <verb> say(vt) <object> [<verb> sleep(vi)]] <verb> come(vi) .",
  );
});
