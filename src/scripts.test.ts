import { expect, test } from "bun:test";
import { default_phonology } from "./phonology";
import type { StaveStyle } from "./script_drawings";
import {
  clashes,
  default_stave,
  default_stems,
  default_syllabics,
  layout_values,
  script_tokens,
  syllabics_glyphs,
} from "./scripts";

const ids = Array.from({ length: 256 }, (_, id) => id);

test("the default stems and stave marks give every syllable its own drawing", () => {
  for (const layout of [default_stems, default_stave]) {
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

test("on circles with subclause circles, no two words overlap", async () => {
  const { circle_layout, default_stave_style, default_period } = await import("./script_drawings");
  const { default_stave } = await import("./scripts");
  const { lords_prayer, babel_verses } = await import("./examples");
  for (const articles of [lords_prayer, babel_verses])
    for (const clause_words of ["hide", "show"] as const) {
      const text = articles.map((a) => a.transliteration).join(" ");
      const style = { ...default_stave_style, midline_shape: "circle" as const, subclauses: "circles" as const, clause_words };
      const laid_out = circle_layout({
        tokens: script_tokens(text, default_phonology),
        phonology: default_phonology,
        layout: default_stave,
        style,
        period: default_period,
        size: 28,
        wrap: (_, node) => node,
      });
      expect(laid_out?.overlaps).toBe(0);
    }
});

test("clause words are written on their circle only when asked", async () => {
  const { circle_sentences } = await import("./script_drawings");
  const words = (show: boolean) =>
    JSON.stringify(
      circle_sentences(
        script_tokens("<subject> person <clause_start> <subject> <blank> <verb> sleep(vi) <clause_end> <verb> come(vi).", default_phonology),
        () => ({ strokes: [], marks: [], width: 1 }),
        30,
        true,
        show,
      ),
      (key, value) => (key === "geometry" ? undefined : key === "word" ? value.word : value),
    );
  expect(words(false)).not.toContain("<clause_start>");
  expect(words(true)).toContain("<clause_start>");
  expect(words(true)).toContain("<clause_end>");
});

test("condensed, the constraint solver lays the Lord's Prayer out tighter than the relaxation, with no overlaps", async () => {
  const { circle_layout, constraint_layout, best_layout, default_stave_style, default_period } = await import("./script_drawings");
  const { default_stave } = await import("./scripts");
  const { lords_prayer, babel_verses } = await import("./examples");
  const args = (text: string, spacing: "even" | "condensed") => ({
    tokens: script_tokens(text, default_phonology),
    phonology: default_phonology,
    layout: default_stave,
    style: { ...default_stave_style, midline_shape: "circle" as const, subclauses: "circles" as const, spacing, solver: "constraints" as const },
    period: default_period,
    size: 28,
    wrap: (_: unknown, node: unknown) => node as never,
  });
  const lords = lords_prayer.map((a) => a.transliteration).join(" ");
  const solved = constraint_layout(args(lords, "condensed"))!;
  expect(solved.overlaps).toBe(0);
  expect(solved.extent).toBeLessThan(circle_layout(args(lords, "condensed"))!.extent);
  // Where it can't settle, the best layout falls back to the relaxation, so nothing overlaps
  const babel = babel_verses.map((a) => a.transliteration).join(" ");
  expect(best_layout(args(babel, "even"))!.overlaps).toBe(0);
});

test("flowing the circles lays the texts out with no overlaps, tighter than the relaxation", async () => {
  const { circle_layout, flow_layout, default_stave_style, default_period } = await import("./script_drawings");
  const { default_stave } = await import("./scripts");
  const { lords_prayer, babel_verses } = await import("./examples");
  const args = (text: string, spacing: "even" | "condensed") => ({
    tokens: script_tokens(text, default_phonology),
    phonology: default_phonology,
    layout: default_stave,
    style: { ...default_stave_style, midline_shape: "circle" as const, subclauses: "circles" as const, spacing, solver: "flow" as const },
    period: default_period,
    size: 28,
    wrap: (_: unknown, node: unknown) => node as never,
  });
  for (const text of [lords_prayer, babel_verses].map((t) => t.map((a) => a.transliteration).join(" ")))
    for (const spacing of ["even", "condensed"] as const) {
      const flowed = flow_layout(args(text, spacing))!;
      expect(flowed.overlaps).toBe(0);
      expect(flowed.extent).toBeLessThan(circle_layout(args(text, spacing))!.extent);
    }
});

test("flowing the circles keeps the clearance asked for, and full rings are no bigger overall than tight ones", async () => {
  const { flow_layout, default_stave_style, default_period } = await import("./script_drawings");
  const { default_stave } = await import("./scripts");
  const { lords_prayer } = await import("./examples");
  const text = lords_prayer.map((a) => a.transliteration).join(" ");
  const layout = (style: Partial<StaveStyle>) =>
    flow_layout({
      tokens: script_tokens(text, default_phonology),
      phonology: default_phonology,
      layout: default_stave,
      style: { ...default_stave_style, midline_shape: "circle", subclauses: "circles", solver: "flow", ...style },
      period: default_period,
      size: 28,
      wrap: (_: unknown, node: unknown) => node as never,
    })!;
  // Overlaps are counted with the clearance included in each word's footprint
  for (const clearance of [0, 0.5, 1]) expect(layout({ clearance }).overlaps).toBe(0);
  expect(layout({ clearance: 1 }).extent).toBeGreaterThan(layout({ clearance: 0 }).extent);
  expect(layout({ ring_sizing: "full" }).extent).toBeLessThanOrEqual(layout({ ring_sizing: "tight" }).extent);
});

test("a layout sent back from the circle worker names the same items it was laid out with", async () => {
  const { circle_sentences, circle_footprint, stave_geometry, default_stave_style } = await import("./script_drawings");
  const { solve_layout, to_wire, from_wire } = await import("./circle_layouts");
  const { default_stave } = await import("./scripts");
  const { babel_verses } = await import("./examples");
  const style = { ...default_stave_style, midline_shape: "circle" as const, subclauses: "circles" as const, solver: "flow" as const };
  const tokens = script_tokens(babel_verses.map((a) => a.transliteration).join(" "), default_phonology);
  const rings = circle_sentences(tokens, (ids) => stave_geometry(ids.map((id) => layout_values(id, default_phonology, default_stave)), 28, style), 28, true, false);
  const options = { rings, style, size: 28, period_width: 28 * 0.3, footprint: circle_footprint(rings, 28, style) };
  const here = solve_layout(options);
  // As the worker sees it: a copy of the rings, laid out there and sent back
  const copy = structuredClone(options);
  const back = from_wire(structuredClone(to_wire(solve_layout(copy), copy.rings)), rings);
  expect(back.rings.map((r) => r.items.map((it) => [it.item, it.x]))).toEqual(here.rings.map((r) => r.items.map((it) => [it.item, it.x])));
  expect(back.rings.flatMap((r) => r.items).every((it) => rings.some(function has(items): boolean {
    return items.some((item) => item === it.item || ("clause" in item && has(item.clause)));
  }))).toBe(true);
});

test("the built-in script presets all differ, and settings compare whatever their fields' order", async () => {
  const { BUILTIN_PRESETS, same_settings } = await import("./script_presets");
  const names = new Set(BUILTIN_PRESETS.map((p) => p.name));
  expect(names.size).toBe(BUILTIN_PRESETS.length);
  for (const [i, a] of BUILTIN_PRESETS.entries())
    for (const b of BUILTIN_PRESETS.slice(i + 1)) expect(same_settings(a.settings, b.settings)).toBe(false);
  const { settings } = BUILTIN_PRESETS[0]!;
  const reordered = Object.fromEntries(Object.entries(settings).reverse().map(([k, v]) => [k, Object.fromEntries(Object.entries(v).reverse())]));
  expect(same_settings(settings, reordered as typeof settings)).toBe(true);
});

test("cursive stem routes: every rung once, only turns the rules allow, and the fewest strokes", async () => {
  const { all_routes, best_route, possible_turns, ranked_routes, rungs_of } = await import("./stem_routes");
  type Ranked = import("./stem_routes").Ranked;
  const { default_stems } = await import("./scripts");
  const { syllable_of } = await import("./phonology");
  const rules = (["next", "clear"] as const).flatMap((turns) =>
    (["down", "any"] as const).flatMap((direction) => (["short", "skips"] as const).map((prefer) => ({ turns, direction, prefer }))),
  );
  for (let id = 0; id < 256; id++) {
    const states = layout_values(id, default_phonology, default_stems);
    const rungs = rungs_of(states);
    for (const rule of rules) {
      const { strokes } = best_route(states, rule);
      // Each rung drawn once
      expect(strokes.flatMap((s) => s.map((step) => step.rung)).sort()).toEqual(rungs.map((_, i) => i));
      // Each turn between neighbours in a stroke is one the rules allow, on the side the pen leaves by
      const allowed = possible_turns(rungs, rule);
      for (const stroke of strokes)
        stroke.slice(1).forEach((step, i) => {
          const [a, b] = [stroke[i]!.rung, step.rung].sort((x, y) => x - y);
          expect(stroke[i]!.to).toBe(step.from);
          expect(allowed.some((t) => t.side === step.from && t.a === a && t.b === b)).toBe(true);
          if (rule.direction === "down") expect(rungs[step.rung]!.row).toBeGreaterThan(rungs[stroke[i]!.rung]!.row);
        });
      // The fewest strokes any route allows: rungs less the most turns
      const most = Math.max(...all_routes(rungs, rule).map((r) => r.length));
      expect(strokes.length).toBe(rungs.length - most);
    }
    // Preferring skips never costs a stroke, and skips at least as many rungs
    const [short, skips] = (["short", "skips"] as const).map((prefer) => ranked_routes(states, { turns: "clear", direction: "any", prefer }).routes[0]!) as [Ranked, Ranked];
    expect(skips.strokes.length).toBe(short.strokes.length);
    expect(skips.skips).toBeGreaterThanOrEqual(short.skips);
  }
  const of = (sound: string) => layout_values(Array.from({ length: 256 }, (_, i) => i).find((i) => syllable_of(i, default_phonology) === sound)!, default_phonology, default_stems);
  // dhei takes one stroke when turns may skip clear rows and go up, two otherwise
  expect(best_route(of("dhei"), { turns: "clear", direction: "any", prefer: "short" }).strokes.length).toBe(1);
  expect(best_route(of("dhei"), { turns: "next", direction: "down", prefer: "short" }).strokes.length).toBe(2);
  // Four rungs across: five ways to turn on each side, less the eight that close a loop
  expect(all_routes(rungs_of([3, 3, 3, 3]), { turns: "clear", direction: "any", prefer: "short" }).length).toBe(17);
});
