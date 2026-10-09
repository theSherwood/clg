import { covered, type Solved, type SolvedRing } from "./circle_solver";
import type { CircleItem, LineStyle, Point } from "./script_drawings";

// Lays the line script out round circles by flowing each ring's writing round what's already
// there, from the innermost ring out. Each sentence's ring starts a band outside the one inside it,
// at the least, and its items go round it in order, each taking the first place where it's clear of
// every word already placed. A ring that runs out of room grows a little and is laid out again.
// With even spacing each item aims for its evenly spaced place first; condensed, items pack from
// the start.
//
// A subclause is laid out once, on its own: its circle, crossing its parent's ring at right angles,
// with its words and its own subclauses flowed round it as if nothing else were there. That whole
// shape then moves round the parent's ring, unchanged, to the first place where none of it touches
// anything already placed; if there's none, its circle grows a little and it's laid out again.
// Since everything is checked as it's placed, nothing overlaps; the count is checked again at the
// end all the same.
//
// That leaves every ring as small as it can be. Unless the style asks for tight rings, a second
// pass then makes the inner rings as big as they can be: from the second outermost in, each ring is
// taken out and laid out again as near the ring around it as it fits, clear of everything else and
// within the bounds the first pass reached.

export type FlowOptions = {
  rings: CircleItem[][];
  style: LineStyle;
  size: number;
  period_width: number;
  footprint: number; // the radius of the discs a word's footprint is made of (see circle_footprint)
};

type Geometry = { cx: number; cy: number; R: number; start: number };
type Disc = { x: number; y: number; ring: number };
const CAP = 3_000_000; // discs checked before the thorough layout is given up on

type Placed = { ring: SolvedRing; discs: Disc[] }; // a ring laid out, with its words' footprints

// Footprints placed so far, in a grid as big as a disc's reach, so only near ones are compared.
// Placing can be undone, last first.
class Grid {
  private cells = new Map<number, Disc[]>();
  private log: number[] = [];
  constructor(
    private cell: number,
    private reach: number,
    private work: { checks: number }, // how many discs have been checked, a measure of the work done
  ) {}
  get mark() {
    return this.log.length;
  }
  add(d: Disc) {
    const k = (Math.floor(d.x / this.cell) + 2048) * 4096 + (Math.floor(d.y / this.cell) + 2048);
    const bucket = this.cells.get(k);
    if (bucket) bucket.push(d);
    else this.cells.set(k, [d]);
    this.log.push(k);
  }
  undo_to(mark: number) {
    while (this.log.length > mark) this.cells.get(this.log.pop()!)!.pop();
  }
  // Whether a disc touches one on another ring
  clashes(d: Disc) {
    this.work.checks++;
    const gx = Math.floor(d.x / this.cell);
    const gy = Math.floor(d.y / this.cell);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const o of this.cells.get((gx + dx + 2048) * 4096 + (gy + dy + 2048)) ?? []) {
          if (o.ring === d.ring) continue;
          const ex = o.x - d.x;
          const ey = o.y - d.y;
          if (ex * ex + ey * ey < this.reach) return true;
        }
    return false;
  }
}

export function flow_circles({ rings: sentences, style, size, period_width, footprint }: FlowOptions): Solved {
  const gap = size * 0.25;
  const clear = size * 0.3; // kept clear either side of a subclause's circle on its parent's ring
  const band = Math.max(size * 1.35, 2 * footprint); // between sentences' rings, at the least
  const step = size * 0.15; // how far an item moves on when its place isn't clear
  const even = style.spacing === "even";
  const new_grid = (work = { checks: 0 }) => new Grid(2 * footprint, (2 * footprint) ** 2, work);

  const place = (g: Geometry, x: number): Point => {
    const angle = g.start + x / g.R;
    return [g.cx + g.R * Math.cos(angle), g.cy + g.R * Math.sin(angle)];
  };
  // A word's footprint: discs along it, wide enough to cover its marks above and below the line
  const footprint_of = (g: Geometry, centre: number, width: number, ring: number): Disc[] => {
    const n = Math.max(1, Math.ceil(width / (footprint * 0.7)));
    return Array.from({ length: n + 1 }, (_, i) => {
      const [x, y] = place(g, centre - width / 2 + (width * i) / n);
      return { x, y, ring };
    });
  };
  // A subclause's circle, crossing its parent's ring at right angles where the clause is centred
  const child_geometry = (p: Geometry, centre: number, r: number): Geometry => {
    const angle = p.start + centre / p.R;
    const d = Math.hypot(p.R, r);
    const cx = p.cx + d * Math.cos(angle);
    const cy = p.cy + d * Math.sin(angle);
    const before = angle - Math.atan2(r, p.R);
    return { cx, cy, R: r, start: Math.atan2(p.cy + p.R * Math.sin(before) - cy, p.cx + p.R * Math.cos(before) - cx) };
  };

  // The natural length of a list of items, and so the smallest circle it fits round
  const natural = (items: CircleItem[]): number =>
    items.reduce(
      (n, item) =>
        n +
        gap +
        ("geometry" in item
          ? item.geometry.width
          : "period" in item
            ? period_width
            : "blank" in item
              ? item.blank
              : 2 * smallest(item.clause) + 2 * clear),
      0,
    );
  const smallest = (items: CircleItem[]) => Math.max(size * 0.5, natural(items) / (2 * Math.PI));

  // Whether a circle has clear room for its own words, a quick check before flowing them round
  // it: its line, sampled finely, splits into clear stretches, and its words, in order, must pack
  // into them (a little leniently, since the samples are only so fine)
  const room = (g: Geometry, items: CircleItem[], grid: Grid): boolean => {
    const fine = footprint * 0.5;
    const circumference = 2 * Math.PI * g.R;
    const stretches: number[] = [];
    let run = 0;
    for (let x = gap; x < circumference; x += fine) {
      const [px, py] = place(g, x);
      if (grid.clashes({ x: px, y: py, ring: -1 })) {
        if (run > 0) stretches.push(run);
        run = 0;
      } else run += fine;
    }
    if (run > 0) stretches.push(run);
    let k = 0;
    let left = stretches[0] ?? 0;
    for (const item of items) {
      if (!("geometry" in item)) continue;
      const width = item.geometry.width * 0.9;
      while (left < width) {
        if (++k >= stretches.length) return false;
        left = stretches[k]!;
      }
      left -= width + gap;
    }
    return true;
  };

  // How far rings reach from the centre, across or down, as they're drawn
  const extent = (from: Placed[]) => {
    let reach = 0;
    for (const { ring, discs } of from) {
      if (style.midline) reach = Math.max(reach, Math.abs(ring.cx) + ring.R, Math.abs(ring.cy) + ring.R);
      for (const d of discs) reach = Math.max(reach, Math.abs(d.x) + footprint, Math.abs(d.y) + footprint);
    }
    return reach;
  };

  // One go at the whole layout, giving each subclause so many tries at flowing its words round
  // what's in its way (at the top level, and nested), for each size of its circle; or null if it
  // takes more than cap discs checked
  const too_long = new Error("too long");
  let attempts = 0;
  const run = (budgets: [number, number], cap: number): Placed[] | null => {
    let next_ring = 0;
    const work = { checks: 0 };

    // A subclause laid out on its own, centred where a parent ring of radius R round (0, 0) starts,
    // at angle 0; or null if it doesn't fit its circle. Cached, since a parent may be laid out more
    // than once.
    const subtrees = new Map<CircleItem, Map<string, Placed[] | null>>();
    const subtree = (item: { clause: CircleItem[] }, R: number, r: number, sentence: number, chain: CircleItem[]) => {
      const cache = subtrees.get(item) ?? new Map<string, Placed[] | null>();
      subtrees.set(item, cache);
      const key = `${R}:${r}`;
      if (!cache.has(key)) {
        const out: Placed[] = [];
        const g = child_geometry({ cx: 0, cy: 0, R, start: 0 }, 0, r);
        const fits = flow(item.clause, g, sentence, [...chain, item], false, false, new_grid(work), out);
        cache.set(key, fits ? out : null);
      }
      return cache.get(key)!;
    };

    // Flow a ring's items round it, placing their footprints in the grid and adding the ring (and
    // its subclauses' rings) to out; false if they don't fit, in which case whatever it placed is
    // left for the caller to undo
    const flow = (
      items: CircleItem[],
      g: Geometry,
      sentence: number,
      chain: CircleItem[],
      is_sentence: boolean,
      spread: boolean,
      grid: Grid,
      out: Placed[],
    ): boolean => {
      attempts++;
      if (work.checks > cap) throw too_long;
      const id = next_ring++;
      const circumference = 2 * Math.PI * g.R;
      const period_at_top = is_sentence && (even || style.period_position === "top") && "period" in (items.at(-1) ?? {});
      const ordered = period_at_top ? [items.at(-1)!, ...items.slice(0, -1)] : items;
      const ring: SolvedRing = { ...g, items: [], sentence, chain };
      const discs: Disc[] = [];
      const put = (d: Disc) => {
        grid.add(d);
        discs.push(d);
      };
      // With even spacing, where each item would sit if evenly spaced
      const widths = ordered.map((item) =>
        "geometry" in item ? item.geometry.width : "period" in item ? period_width : "blank" in item ? item.blank : 0,
      );
      const slot = spread ? circumference / ordered.length : 0;
      let x = is_sentence ? gap / 2 : gap; // a subclause starts just past where it crosses its parent
      // The end of the ring: the period at the top, or for anything else the start again
      const end = period_at_top ? circumference - period_width / 2 - gap : circumference - gap / 2;
      for (const [i, item] of ordered.entries()) {
        if (period_at_top && i === 0) {
          // The period is fixed at the top
          const own = footprint_of(g, 0, period_width, id);
          if (own.some((d) => grid.clashes(d))) return false;
          own.forEach(put);
          ring.items.push({ item, x: 0, width: period_width });
          x = period_width / 2 + gap;
          continue;
        }
        if (spread) x = Math.max(x, i * slot - widths[i]! / 2);
        if ("clause" in item) {
          // The clause, laid out on its own, moves along until none of it touches anything; if it
          // can't, its circle grows and it tries again from where it was
          let r = smallest(item.clause);
          let placed = false;
          const budget = chain.length === 0 ? budgets[0] : budgets[1];
          for (let grow = 0; grow < 6 && !placed; grow++, r *= 1.15) {
            const shape = subtree(item, g.R, r, sentence, chain);
            if (!shape) continue;
            const width = covered(g.R, r) + 2 * clear;
            let tries = 0;
            for (let at = x; at + width <= end; at += step) {
              const centre = at + width / 2;
              // Turned to where the clause is centred, and moved to the parent's centre
              const angle = g.start + centre / g.R;
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              const to = (x: number, y: number): Point => [g.cx + x * cos - y * sin, g.cy + x * sin + y * cos];
              const moved = shape.map((p) => ({
                p,
                discs: p.discs.map((d) => {
                  const [mx, my] = to(d.x, d.y);
                  return { x: mx, y: my, ring: d.ring };
                }),
              }));
              if (moved.some(({ discs }) => discs.some((d) => grid.clashes(d)))) {
                // Where the shape doesn't fit as it is, the clause's words may still flow round
                // what's in the way, a few times for each size of circle
                if (tries >= budget) continue;
                const child = child_geometry(g, centre, r);
                if (!room(child, item.clause, grid)) continue;
                tries++;
                const mark = grid.mark;
                const count = out.length;
                if (flow(item.clause, child, sentence, [...chain, item], false, false, grid, out)) {
                  ring.items.push({ item, x: centre, width });
                  x = centre + width / 2 + gap;
                  placed = true;
                  break;
                }
                grid.undo_to(mark);
                out.length = count;
                continue;
              }
              for (const { p, discs } of moved) {
                discs.forEach((d) => grid.add(d));
                const [cx, cy] = to(p.ring.cx, p.ring.cy);
                out.push({ ring: { ...p.ring, cx, cy, start: p.ring.start + angle }, discs });
              }
              ring.items.push({ item, x: centre, width });
              x = centre + width / 2 + gap;
              placed = true;
              break;
            }
          }
          if (!placed) return false;
          continue;
        }
        const width = widths[i]!;
        let fitted = false;
        for (; x + width <= end; x += step) {
          const own = "blank" in item ? [] : footprint_of(g, x + width / 2, width, id);
          if (own.some((d) => grid.clashes(d))) continue;
          own.forEach(put);
          ring.items.push({ item, x: x + width / 2, width });
          x += width + gap;
          fitted = true;
          break;
        }
        if (!fitted) return false;
      }
      out.push({ ring, discs });
      return true;
    };

    const grid = new_grid(work);
    const placed: Placed[] = [];
    // Lay a sentence round its ring: evenly spaced if it fits that way, else packed
    const lay_sentence = (items: CircleItem[], k: number, R: number): boolean => {
      const g = { cx: 0, cy: 0, R, start: -Math.PI / 2 };
      for (const spread of even ? [true, false] : [false]) {
        const mark = grid.mark;
        const count = placed.length;
        if (flow(items, g, k, [], true, spread, grid, placed)) return true;
        grid.undo_to(mark);
        placed.length = count;
      }
      return false;
    };

    // From the innermost ring out: the last sentence when growing in, the first when growing out.
    // A ring that can't be laid out grows a little.
    const inside_out = sentences.map((items, k) => ({ items, k }));
    if (style.grow === "in") inside_out.reverse();
    const radius: number[] = [];
    let inner = 0;
    for (const { items, k } of inside_out) {
      let R = Math.max(inner ? inner + band : 0, size * 0.8, natural(items) / (2 * Math.PI));
      while (!lay_sentence(items, k, R)) R += size * 0.5;
      radius[k] = inner = R;
    }

    // Inner rings as big as they can be, from the second outermost in
    if (style.ring_sizing !== "tight") {
      const bounds = extent(placed);
      for (let j = inside_out.length - 2; j >= 0; j--) {
        const { items, k } = inside_out[j]!;
        const own = placed.filter((p) => p.ring.sentence === k);
        const others = placed.filter((p) => p.ring.sentence !== k);
        grid.undo_to(0);
        others.forEach((p) => p.discs.forEach((d) => grid.add(d)));
        placed.length = 0;
        placed.push(...others);
        let grown = false;
        for (let R = radius[inside_out[j + 1]!.k]! - band; R > radius[k]! + size * 0.25; R -= size * 0.5) {
          const mark = grid.mark;
          if (!lay_sentence(items, k, R)) continue;
          if (extent(placed.slice(others.length)) <= bounds) {
            radius[k] = R;
            grown = true;
            break;
          }
          grid.undo_to(mark);
          placed.length = others.length;
        }
        if (!grown) placed.push(...own);
      }
    }
    return placed;
  };
  const attempt = (budgets: [number, number], cap: number) => {
    try {
      return run(budgets, cap);
    } catch (e) {
      if (e === too_long) return null;
      throw e;
    }
  };

  // Flowing words round everything in a subclause's way finds the tightest layouts, but it can take
  // a long time where subclauses nest deeply; a few tries each always finishes quickly. Both are
  // tried, the first only so far, and the smaller kept.
  const layouts = [attempt([Infinity, Infinity], CAP), attempt([8, 2], Infinity)!].filter((l) => l !== null);
  const placed = layouts.reduce((a, b) => (extent(b) < extent(a) ? b : a));

  // Check it: no two footprints on different rings overlap
  const check = new_grid();
  let overlaps = 0;
  placed.forEach(({ ring }, id) =>
    ring.items.forEach((it) => {
      if ("clause" in it.item || "blank" in it.item) return;
      for (const d of footprint_of(ring, it.x, it.width, id)) {
        if (check.clashes(d)) overlaps++;
        check.add(d);
      }
    }),
  );
  return { rings: placed.map((p) => p.ring), overlaps, rounds: attempts, footprint };
}
