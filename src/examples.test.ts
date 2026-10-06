import { expect, test } from "bun:test";
import { candidates, dictionary } from "./dict";
import { tokenize } from "./examples";

const resolved = (transliteration: string) =>
  tokenize(transliteration).map((t) =>
    t.kind === "punctuation" ? t.text : (t.word?.word ?? t.candidate?.word ?? `?${t.text}`),
  );

test("bracketed names resolve to grammar markers, bare ones to ordinary words", () => {
  expect(resolved("<subject> person <verb_prescriptive> act_vi in value.")).toEqual([
    "<subject>",
    "person",
    "<verb_prescriptive>",
    "do_vt",
    "in",
    "value",
    ".",
  ]);
  // <to> is the noun marker (the addressee of send), to the preposition
  expect(resolved("<to> send_vt to")).toEqual(["<to>", "send_vi", "to"]);
  expect(resolved("<in>")).toEqual(["?<in>"]);
});

test("a verb goes by either meaning's name, and only by those", () => {
  const word = dictionary.get("kill_vt")!;
  expect(resolved("die_vi kill_vt kill")).toEqual(["kill_vt", "kill_vt", "?kill"]);
  expect(dictionary.get("die_vi")).toBe(word);
});

test("digits, two-word names and unknown words", () => {
  expect(resolved("number 2 <rank_4> 15 <clause_start> blorp")).toEqual([
    "number",
    "digit_2",
    "<rank_4>",
    "digit_15",
    "<clause_start>",
    "?blorp",
  ]);
});

test("a trailing ? marks a word as uncertain", () => {
  const [verb, blorp] = tokenize("<verb?> blorp?");
  expect(verb).toMatchObject({ kind: "word", uncertain: true, word: dictionary.get("<verb>") });
  expect(blorp).toMatchObject({ kind: "word", uncertain: true });
  expect(blorp?.kind === "word" && blorp.word).toBeFalsy();
});

test("every word the Grammar page refers to exists", async () => {
  const source = await Bun.file(`${import.meta.dir}/grammar.tsx`).text();
  const names = [...source.matchAll(/<W w="([^"]+)"/g)].map((m) => m[1]!);
  expect(names.length).toBeGreaterThan(0);
  const unknown = names.filter((n) => !dictionary.has(n) && !candidates.some((c) => c.word === n));
  expect(unknown).toEqual([]);
});
