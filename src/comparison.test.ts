import { expect, test } from "bun:test";
import { swadesh, toki_pona_equivalents, toki_pona_words } from "./comparison";
import { toki_pona_reference } from "./dict";
import { tokenize } from "./examples";

test("every equivalent is made of words in the dictionary", () => {
  const unresolved = [...swadesh, ...toki_pona_words].flatMap((row) =>
    tokenize(row.ours)
      .filter((t) => t.kind === "word" && !t.word)
      .map((t) => `${row.english}: ${t.kind === "word" ? t.text : ""}`),
  );
  expect(unresolved).toEqual([]);
});

test("the Swadesh list has all 100 concepts", () => {
  expect(new Set(swadesh.map((row) => row.english)).size).toBe(100);
});

test("every Toki Pona word but pu has an entry, and no entry is for another word", () => {
  const words = toki_pona_reference.map(([word]) => word).filter((w) => w !== "pu");
  expect(words.filter((w) => !(w in toki_pona_equivalents))).toEqual([]);
  expect(Object.keys(toki_pona_equivalents).filter((w) => !words.includes(w))).toEqual([]);
});
