import { expect, test } from "bun:test";
import { candidates, dictionary } from "./dict";
import { tokenize } from "./examples";

const resolved = (transliteration: string) =>
  tokenize(transliteration).map((t) =>
    t.kind === "punctuation" ? t.text : (t.word?.word ?? t.candidate?.word ?? `?${t.text}`),
  );

test("bracketed names resolve to grammar markers, bare ones to ordinary words", () => {
  expect(resolved("<subject> person <verb_prescriptive> act(vi) in value.")).toEqual([
    "<subject>",
    "person",
    "<verb_prescriptive>",
    "do(vt)",
    "in",
    "value",
    ".",
  ]);
  // <to> is the noun marker (the addressee of send), to the preposition
  expect(resolved("<to> send(vt) to")).toEqual(["<to>", "send(vi)", "to"]);
  expect(resolved("<in>")).toEqual(["?<in>"]);
});

test("a verb goes by either meaning's name, and only by those", () => {
  const word = dictionary.get("kill(vt)")!;
  expect(resolved("die(vi) kill(vt) kill")).toEqual(["kill(vt)", "kill(vt)", "?kill"]);
  expect(dictionary.get("die(vi)")).toBe(word);
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

// A noun that shares a verb's name (sleep, desire) would otherwise slip in where the verb belongs
test("every verb marker is followed by a verb", async () => {
  const examples = await import("./examples");
  const transliterations = (Object.values(examples) as unknown[])
    .filter(Array.isArray)
    .flat()
    .flatMap((e: any) => [e?.transliteration, ...(e?.examples ?? []).map((x: any) => x.transliteration)])
    .filter((t): t is string => typeof t === "string");
  const markers = ["<verb>", "<verb_prescriptive>", "<verb_interrogative>", "<er>", "<ee>", "<tool>", "<place>", "<to>", "<from>", "<gerund>"];
  const skip = (t: any) => t?.word?.data.t.includes("axis_helper") || t?.text === "not" || t?.text === "<filler>";
  const broken = transliterations.flatMap((transliteration) => {
    const tokens = tokenize(transliteration);
    return tokens.flatMap((token, i) => {
      if (token.kind !== "word" || !markers.includes(token.text.replace("?", "").toLowerCase())) return [];
      let j = i + 1;
      while (skip(tokens[j])) j++;
      const next = tokens[j];
      return next?.kind === "word" && next.word && next.word.data.domain !== "verb"
        ? [`${token.text} ${next.text}: ${transliteration}`]
        : [];
    });
  });
  expect(broken).toEqual([]);
});

