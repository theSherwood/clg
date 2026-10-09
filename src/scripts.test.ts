import { expect, test } from "bun:test";
import { default_phonology } from "./phonology";
import type { StaveStyle } from "./script_drawings";
import {
  clashes,
  default_stave,
  default_stems,
  default_gates,
  fret_path,
  FRET_TALL,
  FRET_WIDE,
  gate_lines,
  meander_lines,
  default_syllabics,
  layout_values,
  script_tokens,
  syllabics_glyphs,
} from "./scripts";

const ids = Array.from({ length: 256 }, (_, id) => id);

test("the default stems, gates and stave marks give every syllable its own drawing", () => {
  for (const layout of [default_stems, default_gates, default_stave]) {
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
  const { all_routes, best_route, possible_turns, ranked_routes, rungs_of, turn_depths } = await import("./stem_routes");
  type Ranked = import("./stem_routes").Ranked;
  const { default_stems } = await import("./scripts");
  const { syllable_of } = await import("./phonology");
  const rules = (["next", "clear", "nest", "cross"] as const).flatMap((turns) =>
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
      const { routes } = ranked_routes(states, rule);
      const most = Math.max(...routes.map((r) => r.turns.length));
      expect(strokes.length).toBe(rungs.length - most);
      // A turn clears what it passes: one level out past any free rung end on its side, and at a
      // depth of its own beside any turn on its side it overlaps; and it goes no further out than
      // those need
      for (const r of routes) {
        const depths = turn_depths(rungs, r.turns);
        r.turns.forEach((t, i) => {
          const joined = (k: number) => r.turns.some((u) => u.side === t.side && (u.a === k || u.b === k));
          const pins = rungs.some((x, k) => k > t.a && k < t.b && (t.side < 0 ? x.left : x.right) && !joined(k));
          if (pins) expect(depths[i]).toBeGreaterThanOrEqual(2);
          const inside = r.turns.filter((u, j) => j !== i && u.side === t.side && t.a < u.b && u.a < t.b && depths[j]! < depths[i]!);
          expect(depths[i]).toBe(1 + Math.max(pins ? 1 : 0, ...inside.map((u) => depths[r.turns.indexOf(u)]!)));
          r.turns.forEach((u, j) => {
            if (j !== i && u.side === t.side && t.a < u.b && u.a < t.b) expect(depths[j]).not.toBe(depths[i]);
          });
        });
      }
      // Nesting never crosses; only crossing does
      if (rule.turns !== "cross") expect(routes.every((r) => r.crossings === 0)).toBe(true);
      if (rule.turns === "next" || rule.turns === "clear") expect(routes.every((r) => r.nests === 0)).toBe(true);
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
  // phor's four right-hand rungs make two strokes one way skipping clear rows, two nesting, three crossing
  for (const [turns, n] of [["clear", 1], ["nest", 2], ["cross", 3]] as const) {
    const { routes } = ranked_routes(of("phor"), { turns, direction: "any", prefer: "short" });
    expect(routes.filter((r) => r.strokes.length === 2).length).toBe(n);
  }
  // Four rungs across: five ways to turn on each side, less the eight that close a loop
  expect(all_routes(rungs_of([3, 3, 3, 3]), { turns: "clear", direction: "any", prefer: "short" }).length).toBe(17);
});

test("cursive stem widths: fixed glyphs are all one width, balanced ones never narrower than tight", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { CursiveStems, fixed_glyph_width, default_stems_style } = await import("./script_drawings");
  const { default_stems } = await import("./scripts");
  const markup = (ids: number[], width: "tight" | "balanced" | "fixed", turns: "clear" | "cross") =>
    renderToStaticMarkup(
      createElement(CursiveStems, {
        rows: ids.map((id) => layout_values(id, default_phonology, default_stems)),
        size: 40,
        routing: { ...default_stems_style, turns },
        width,
      }),
    );
  const width_of = (ids: number[], width: "tight" | "balanced" | "fixed", turns: "clear" | "cross") => {
    const svg = markup(ids, width, turns);
    const total = Number(/width="([\d.]+)"/.exec(svg)![1]);
    // Everything drawn stays inside the glyph: the paths' points alternate x and y
    for (const [, d] of svg.matchAll(/ d="([^"]+)"/g)) {
      const xs = d!.match(/-?[\d.]+(e-?\d+)?/g)!.map(Number).filter((_, i) => i % 2 === 0);
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(-1e-6);
      expect(Math.max(...xs)).toBeLessThanOrEqual(total + 1e-6);
    }
    return total;
  };
  for (const turns of ["clear", "cross"] as const) {
    const glyph = fixed_glyph_width(40, { ...default_stems_style, turns });
    for (let id = 0; id < 256; id++) {
      expect(width_of([id], "fixed", turns)).toBeCloseTo(glyph, 6);
      expect(width_of([id], "balanced", turns)).toBeGreaterThanOrEqual(width_of([id], "tight", turns) - 1e-9);
      expect(width_of([id], "balanced", turns)).toBeLessThanOrEqual(glyph + 1e-9);
    }
    // Words of several syllables: so many glyphs wide
    for (const word of [[3, 77, 200], [255, 0, 128, 64], [170, 85]]) expect(width_of(word, "fixed", turns)).toBeCloseTo(word.length * glyph, 6);
  }
});

test("stem blocks: every stroke on the grid stays inside its block, at any width, joins and reach", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { StemBlocks, default_stems_style, default_period } = await import("./script_drawings");
  const { default_stems } = await import("./scripts");
  const words = [[0], [255], [170, 85], [3, 77, 200, 64], ...Array.from({ length: 64 }, (_, i) => [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3])];
  const tokens = words.map((ids) => ({ ids, text: "" }));
  for (const width of ["tight", "balanced", "fixed"] as const)
    for (const block_joins of ["joined", "apart"] as const)
      for (const block_reach of [1, 2, 3])
        for (const turns of ["clear", "cross"] as const) {
          const style = { ...default_stems_style, width, block_joins, block_reach, turns, block_pitch: 10, block_weight: 0.8, curve: 0 };
          const html = renderToStaticMarkup(
            createElement(StemBlocks, { tokens, phonology: default_phonology, layout: default_stems, style, period: default_period, wrap: (_: unknown, n: unknown) => n as never }),
          );
          const half = 4; // half the stroke: 0.8 of a 10px pitch, halved
          const blocks = [...html.matchAll(/<svg width="([\d.]+)" height="([\d.]+)"[^>]*>(.*?)<\/svg>/g)];
          expect(blocks.length).toBe(words.length);
          for (const [, w, h, body] of blocks) {
            for (const [, d] of body!.matchAll(/ d="([^"]+)"/g)) {
              const n = d!.match(/-?[\d.]+(e-?\d+)?/g)!.map(Number);
              const xs = n.filter((_, i) => i % 2 === 0);
              const ys = n.filter((_, i) => i % 2 === 1);
              expect(xs.every((x) => !Number.isNaN(x) && x >= half - 1e-6 && x <= Number(w) - half + 1e-6)).toBe(true);
              expect(ys.every((y) => y >= half - 1e-6 && y <= Number(h) - half + 1e-6)).toBe(true);
            }
          }
        }
});

test("gates: every syllable is five full bars, its own drawing, and the 256 are every way to bridge them", () => {
  const drawings = ids.map((id) => gate_lines(layout_values(id, default_phonology, default_gates)));
  for (const lines of drawings) {
    // The five bars, top to bottom, always
    for (const x of [0, 1, 2, 3, 4]) expect(lines).toContainEqual([x, 0, x, 4]);
    // Every other line a bridge between neighbouring bars at the top or the bottom
    for (const [x1, y1, x2, y2] of lines.slice(5)) {
      expect(y1).toBe(y2);
      expect([0, 4]).toContain(y1);
      expect(x2 - x1).toBe(1);
    }
  }
  const keys = drawings.map((lines) => JSON.stringify(lines.slice(5)));
  expect(new Set(keys).size).toBe(256);
  // Eight bridges can each be there or not, and every one of those 2^8 drawings is a syllable
  expect(new Set(drawings.map((lines) => lines.slice(5).length)).size).toBe(9);
});

test("the stave as a meander: five full bars, one bridge in each gap, and every syllable its own drawing", () => {
  const drawings = ids.map((id) => meander_lines(layout_values(id, default_phonology, default_stave)));
  for (const lines of drawings) {
    for (const x of [0, 1, 2, 3, 4]) expect(lines).toContainEqual([x, 0, x, 4]);
    // A bridge across each gap: top or bottom, flush or set in a pitch
    expect(lines.slice(5).map(([x1]) => x1)).toEqual([0, 1, 2, 3]);
    for (const [x1, y1, x2, y2] of lines.slice(5)) {
      expect(x2 - x1).toBe(1);
      expect(y1).toBe(y2);
      expect([0, 1, 3, 4]).toContain(y1);
    }
  }
  expect(new Set(drawings.map((lines) => JSON.stringify(lines))).size).toBe(256);
});

test("gates as a fret: every syllable one stroke through every point of the 7×7 grid, top left to top right", () => {
  const paths = ids.map((id) => fret_path(layout_values(id, default_phonology, default_gates)));
  for (const path of paths) {
    expect(path.length).toBe(49);
    expect(new Set(path.map((p) => p.join())).size).toBe(49);
    for (const [x, y] of path) expect(x >= 0 && x <= 6 && y >= 0 && y <= 6).toBe(true);
    // One stroke: each point a step of one pitch from the last
    path.slice(1).forEach(([x, y], i) => expect(Math.abs(x - path[i]![0]) + Math.abs(y - path[i]![1])).toBe(1));
    expect(path[0]).toEqual([0, 0]);
    expect(path.at(-1)).toEqual([6, 0]);
  }
  expect(new Set(paths.map((p) => JSON.stringify(p))).size).toBe(256);
});

test("the fret's blocks: exactly four paths through every point between their corners, and the fret draws all four", () => {
  // Paths through every point of a w×h block from one point to another
  const count = (w: number, h: number, from: number[], to: number[], seen = new Set([from.join()])): number => {
    if (seen.size === w * h) return from.join() === to.join() ? 1 : 0;
    let n = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const [x, y] = [from[0]! + dx!, from[1]! + dy!];
      if (x < 0 || x >= w || y < 0 || y >= h || seen.has(`${x},${y}`)) continue;
      seen.add(`${x},${y}`);
      n += count(w, h, [x, y], to, seen);
      seen.delete(`${x},${y}`);
    }
    return n;
  };
  expect(count(3, 4, [0, 0], [0, 3])).toBe(4);
  expect(count(4, 3, [0, 0], [3, 2])).toBe(4);
  for (const [paths, w, h] of [[FRET_TALL, 3, 4], [FRET_WIDE, 4, 3]] as const) {
    expect(new Set(paths.map((p) => JSON.stringify(p))).size).toBe(4);
    for (const path of paths) {
      expect(new Set(path.map((p) => p.join())).size).toBe(w * h);
      for (const [x, y] of path) expect(x < w && y < h).toBe(true);
    }
  }
});

test("the fret joined: a word is one stroke, each syllable running on from the last along their tops", async () => {
  const { Gates, default_gates_style } = await import("./script_drawings");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const rows = [[0, 1, 2, 3], [3, 2, 1, 0], [1, 1, 1, 1]];
  const svg = (joins: "joined" | "apart") =>
    renderToStaticMarkup(createElement(Gates, { rows, size: 64, style: { ...default_gates_style, form: "fret", joins } }));
  expect(svg("apart").match(/<polyline/g)!.length).toBe(3);
  expect(svg("joined").match(/<polyline/g)!.length).toBe(1);
  const points = /points="([^"]+)"/.exec(svg("joined"))![1]!.split(" ").map((p) => p.split(",").map(Number));
  expect(points.length).toBe(3 * 49);
  // Where one syllable ends and the next begins, a step along the top
  for (const i of [49, 98]) {
    expect(points[i]![1]).toBe(points[i - 1]![1]!);
    expect(points[i]![1]).toBe(points[0]![1]!);
  }
});

test("bar scripts and the fret on a grid: every word, and every period after one, moves the next word on by whole units", async () => {
  const { bar_spacing, Gates, default_gates_style, gates_span } = await import("./script_drawings");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  for (const form of ["bars", "fret"] as const)
    for (const size of [16, 32, 57])
      for (const weight of [0.2, 0.6, 0.9]) {
        const style = { ...default_gates_style, weight, form, spacing: "grid" as const };
        const { gap, cell, glyph } = bar_spacing(size, weight, gates_span(style), "grid");
        for (const n of [1, 2, 3, 5]) {
          const svg = renderToStaticMarkup(createElement(Gates, { rows: Array.from({ length: n }, () => [0, 1, 2, 3]), size, style }));
          const width = Number(/width="([\d.]+)"/.exec(svg)![1]);
          // On to the next word, and on past a period's cell to the next word
          for (const advance of [width + gap, width + cell + gap]) expect(Math.abs(advance / cell - Math.round(advance / cell))).toBeLessThan(1e-9);
          if (n === 1) expect(width).toBeCloseTo(glyph, 9);
        }
      }
});

test("the fret spaced close: a word's syllables as far apart as the strokes in them, and words a stroke apart", async () => {
  const { bar_spacing, Gates, default_gates_style, gates_span } = await import("./script_drawings");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  for (const weight of [0.2, 0.6, 0.9]) {
    const style = { ...default_gates_style, weight, form: "fret" as const, spacing: "close" as const };
    const size = 64;
    const span = gates_span(style);
    const pitch = (size * 0.8) / (span + weight);
    const w = weight * pitch;
    const width = (n: number) =>
      Number(/width="([\d.]+)"/.exec(renderToStaticMarkup(createElement(Gates, { rows: Array.from({ length: n }, () => [0, 1, 2, 3]), size, style })))![1]);
    const glyph = width(1);
    // The white between syllables, the same as between two strokes
    expect(width(2) - 2 * glyph).toBeCloseTo(pitch - w, 9);
    const { gap, row } = bar_spacing(size, weight, span, "close");
    // Room for one more stroke, with the usual white either side of it
    expect(gap).toBeCloseTo(2 * (pitch - w) + w, 9);
    expect(row).toBe(gap);
    // Joined, everything a pitch apart, and punctuation a square of its own
    const joined = bar_spacing(size, weight, span, "close", undefined, true);
    expect(joined.gap).toBeCloseTo(pitch - w, 9);
    expect(joined.row).toBe(joined.gap);
    expect(joined.cell).toBeCloseTo(glyph, 9);
    expect(joined.slot).toBe(true);
  }
});
