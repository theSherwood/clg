import { covered, type Solved, type SolvedRing } from "./circle_solver";
import type { CircleItem, LineStyle, Point } from "./script_drawings";

// Lays the line script out round circles by flowing each ring's writing round what's already
// there, from the innermost ring out. Each sentence's ring starts a band outside the one inside it,
// at the least, and its items go round it in order: each takes the first place from which it (and,
// for a subclause, its whole circle with everything on it) is clear of every word already placed.
// A subclause's circle that can't fit grows a little and tries again, and a ring that runs out of
// room grows a little and is laid out again. With even spacing each item aims for its evenly spaced
// place first; condensed, items pack from the start. Since everything is checked as it's placed,
// nothing overlaps; the count is checked again at the end all the same.

export type FlowOptions = {
  rings: CircleItem[][];
  style: LineStyle;
  size: number;
  period_width: number;
};

type Geometry = { cx: number; cy: number; R: number; start: number };
type Disc = { x: number; y: number; ring: number };

export function flow_circles({ rings: sentences, style, size, period_width }: FlowOptions): Solved {
  const gap = size * 0.25;
  const clear = size * 0.3; // kept clear either side of a subclause's circle on its parent's ring
  const band = size * 1.35; // between sentences' rings, at the least
  const footprint = size * 0.38; // the radius of the discs a word's footprint is made of
  const reach = (2 * footprint) ** 2;
  const step = size * 0.15; // how far an item moves on when its place isn't clear
  const clause_step = size * 0.3; // and a subclause, whose circle is tried at each place
  const even = style.spacing === "even";

  // Placed footprints, in a grid as big as a disc's reach. Placing can be undone, last first.
  const cell = 2 * footprint;
  const key = (gx: number, gy: number) => (gx + 2048) * 4096 + (gy + 2048);
  const grid = new Map<number, Disc[]>();
  const log: number[] = [];
  const add = (d: Disc) => {
    const k = key(Math.floor(d.x / cell), Math.floor(d.y / cell));
    const bucket = grid.get(k);
    if (bucket) bucket.push(d);
    else grid.set(k, [d]);
    log.push(k);
  };
  const undo_to = (mark: number) => {
    while (log.length > mark) grid.get(log.pop()!)!.pop();
  };
  const clashes = (d: Disc) => {
    const gx = Math.floor(d.x / cell);
    const gy = Math.floor(d.y / cell);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const o of grid.get(key(gx + dx, gy + dy)) ?? []) {
          if (o.ring === d.ring) continue;
          const ex = o.x - d.x;
          const ey = o.y - d.y;
          if (ex * ex + ey * ey < reach) return true;
        }
    return false;
  };

  const place = (g: Geometry, x: number, y = 0): Point => {
    const angle = g.start + x / g.R;
    const r = g.R - y;
    return [g.cx + r * Math.cos(angle), g.cy + r * Math.sin(angle)];
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
  const room = (g: Geometry, items: CircleItem[]): boolean => {
    const fine = footprint * 0.5;
    const circumference = 2 * Math.PI * g.R;
    const stretches: number[] = [];
    let run = 0;
    for (let x = gap; x < circumference; x += fine) {
      const [px, py] = place(g, x);
      if (clashes({ x: px, y: py, ring: -1 })) {
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

  const solved: SolvedRing[] = [];
  let ring_count = 0;
  let attempts = 0;

  // Flow a ring's items round it, placing (and recording) each; false if they don't fit, in which
  // case whatever it placed is left for the caller to undo
  const flow = (
    items: CircleItem[],
    g: Geometry,
    sentence: number,
    chain: CircleItem[],
    is_sentence: boolean,
    spread: boolean,
  ): boolean => {
    attempts++;
    const id = ring_count++;
    const circumference = 2 * Math.PI * g.R;
    const period_at_top = is_sentence && (even || style.period_position === "top") && "period" in (items.at(-1) ?? {});
    const ordered = period_at_top ? [items.at(-1)!, ...items.slice(0, -1)] : items;
    const out: SolvedRing = { ...g, items: [], sentence, chain };
    // With even spacing, where each item would sit if evenly spaced
    const widths = ordered.map((item) =>
      "geometry" in item ? item.geometry.width : "period" in item ? period_width : "blank" in item ? item.blank : 0,
    );
    const slot = spread ? circumference / ordered.length : 0;
    let x = is_sentence ? gap / 2 : gap; // a subclause starts just past where it crosses its parent
    for (const [i, item] of ordered.entries()) {
      if (period_at_top && i === 0) {
        // The period is fixed at the top
        const discs = footprint_of(g, 0, period_width, id);
        if (discs.some(clashes)) return false;
        discs.forEach(add);
        out.items.push({ item, x: 0, width: period_width });
        x = period_width / 2 + gap;
        continue;
      }
      if (spread) x = Math.max(x, i * slot - widths[i]! / 2);
      // The end of the ring: the period at the top, or for anything else the start again
      const end = period_at_top ? circumference - period_width / 2 - gap : circumference - gap / 2;
      if ("clause" in item) {
        // The clause moves along until its circle, with everything on it, finds clear room; if it
        // can't, its circle grows and it tries again from where it was
        let r = smallest(item.clause);
        let placed = false;
        for (let grow = 0; grow < 6 && !placed; grow++, r *= 1.15) {
          const width = covered(g.R, r) + 2 * clear;
          for (let at = x; at + width <= end; at += clause_step) {
            const mark = log.length;
            const ring_mark = solved.length;
            const centre = at + width / 2;
            const child = child_geometry(g, centre, r);
            if (!room(child, item.clause)) continue;
            if (flow(item.clause, child, sentence, [...chain, item], false, false)) {
              out.items.push({ item, x: centre, width });
              x = centre + width / 2 + gap;
              placed = true;
              break;
            }
            undo_to(mark);
            solved.length = ring_mark;
          }
        }
        if (!placed) return false;
        continue;
      }
      const width = widths[i]!;
      let fitted = false;
      for (; x + width <= end; x += step) {
        const discs = "blank" in item ? [] : footprint_of(g, x + width / 2, width, id);
        if (discs.some(clashes)) continue;
        discs.forEach(add);
        out.items.push({ item, x: x + width / 2, width });
        x += width + gap;
        fitted = true;
        break;
      }
      if (!fitted) return false;
    }
    solved.push(out);
    return true;
  };

  // From the innermost ring out: the last sentence when growing in, the first when growing out
  const inside_out = sentences.map((items, k) => ({ items, k }));
  if (style.grow === "in") inside_out.reverse();
  let inner = 0;
  for (const { items, k } of inside_out) {
    let R = Math.max(inner ? inner + band : 0, size * 0.8, natural(items) / (2 * Math.PI));
    for (;;) {
      const mark = log.length;
      const ring_mark = solved.length;
      const g = { cx: 0, cy: 0, R, start: -Math.PI / 2 };
      // Evenly spaced if it fits that way, else packed; else the ring grows a little
      if (even && flow(items, g, k, [], true, true)) break;
      undo_to(mark);
      solved.length = ring_mark;
      if (flow(items, g, k, [], true, false)) break;
      undo_to(mark);
      solved.length = ring_mark;
      R += size * 0.5;
    }
    inner = R;
  }

  // Check it: no two footprints on different rings overlap
  const all: Disc[] = [];
  solved.forEach((ring, id) =>
    ring.items.forEach((it) => {
      if ("clause" in it.item || "blank" in it.item) return;
      all.push(...footprint_of(ring, it.x, it.width, id));
    }),
  );
  grid.clear();
  let overlaps = 0;
  for (const d of all) {
    if (clashes(d)) overlaps++;
    add(d);
  }
  return { rings: solved, overlaps, rounds: attempts, footprint };
}
