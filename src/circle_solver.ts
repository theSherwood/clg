import type { CircleItem, LineStyle, Point } from "./script_drawings";

// Lays the line script out round circles by constraint projection, as physics engines and
// force-directed graph layouts do. The layout is a set of variables: each sentence's ring's radius
// and how far its centre sits above or below the middle (rings move only up and down, so the
// periods at their tops stay in one column), each subclause's circle's radius, and each item's
// place along its ring. Each rule is a constraint, a function of the variables that should be at
// least zero (or exactly zero). Over and over, each broken constraint nudges its variables just
// enough to hold, in proportion to how much each one moves it (found by trying a tiny change to
// each). Rules that are only preferences (keep it small, space it evenly) are weak pulls applied
// first in each round. A new rule is one more such function.
//
// What isn't a variable is worked out from them: a subclause's circle crosses its parent's ring at
// right angles, so its centre lies at the square root of the sum of their radii squared from the
// parent's, along the line through where the clause comes.

export type SolveOptions = {
  rings: CircleItem[][]; // the sentences, as laid out by circle_sentences
  style: LineStyle;
  size: number;
  period_width: number;
};

export type SolvedItem = { item: CircleItem; x: number; width: number }; // x: the item's centre along its ring
export type SolvedRing = {
  cx: number;
  cy: number;
  R: number;
  start: number; // the angle where x is 0, read clockwise
  items: SolvedItem[];
  sentence: number;
  chain: CircleItem[]; // the subclauses from the sentence down to this ring
};
export type Solved = { rings: SolvedRing[]; overlaps: number; rounds: number; footprint: number };

type Ring = {
  sentence: number;
  items: Item[];
  radius: number; // variable: R for a sentence, r for a subclause
  cy?: number; // variable, sentences only
  parent?: { ring: Ring; item: Item };
  chain: CircleItem[];
  period_at_top: boolean;
};
type Item = { item: CircleItem; x: number; child?: Ring };
type Geometry = { cx: number; cy: number; R: number; start: number };

// How much of a ring of radius R a circle of radius r crossing it at right angles covers
export const covered = (R: number, r: number) => (Number.isFinite(R) ? 2 * R * Math.atan2(r, R) : 2 * r);

// Tuned on the standard texts: footprints are kept 5% further apart than they need be, so pairs
// settle clear of each other rather than just touching; rings and subclauses' circles move as
// freely as 0.3 against a word's 1; and the preferences fade out over 60 rounds, after which the
// rules alone have 200 more to settle
const MARGIN = 1.05;
const SUB_FREE = 0.3;
const RING_FREE = 0.3;
const FADE = 60;
const SETTLE = 200;

export function solve_circles({ rings: sentences, style, size, period_width }: SolveOptions): Solved {
  const gap = size * 0.25;
  const clear = size * 0.3; // kept clear either side of a subclause's circle on its parent's ring
  const band = size * 1.35; // between sentences' rings, at the least
  const footprint = size * 0.38; // the radius of the discs a word's footprint is made of
  const even = style.spacing === "even";

  // The variables, each with how freely it moves (0 for fixed) and its bounds
  const q: number[] = [];
  const free: number[] = [];
  const low: number[] = [];
  const variable = (value: number, freedom: number, min = -Infinity) => {
    q.push(value);
    free.push(freedom);
    low.push(min);
    return q.length - 1;
  };

  // Natural length of a list of items, for starting sizes
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
              : 2 * (natural(item.clause) / (2 * Math.PI)) + 2 * clear),
      0,
    );

  const all: Ring[] = [];
  const build = (items: CircleItem[], sentence: number, chain: CircleItem[], parent?: Ring["parent"]): Ring => {
    // With the period at the top, it comes first in the ring, fixed at the top, and the sentence
    // follows it round
    const period_at_top = !parent && (even || style.period_position === "top") && "period" in (items.at(-1) ?? {});
    const ordered = period_at_top ? [items.at(-1)!, ...items.slice(0, -1)] : items;
    const length = natural(items);
    const ring: Ring = {
      sentence,
      items: [],
      radius: parent
        ? variable(Math.max(size * 0.5, length / (2 * Math.PI)), SUB_FREE, size * 0.5)
        : variable(Math.max(size * 0.8, length / (2 * Math.PI)), RING_FREE, size * 0.8),
      cy: parent ? undefined : variable(0, RING_FREE),
      parent,
      chain,
      period_at_top,
    };
    let x = 0;
    ordered.forEach((item, i) => {
      const fixed = period_at_top && i === 0;
      const it: Item = { item, x: variable(x, fixed ? 0 : 1) };
      ring.items.push(it);
      x += gap + ("geometry" in item ? item.geometry.width : size);
      if ("clause" in item) it.child = build(item.clause, sentence, [...chain, item], { ring, item: it });
    });
    all.push(ring);
    return ring;
  };
  const tops = sentences.map((items, k) => build(items, k, []));
  // Sentences' rings start nested a band apart, the first outermost when growing in
  const order = style.grow === "in" ? tops : [...tops].reverse();
  for (let k = order.length - 2; k >= 0; k--)
    q[order[k]!.radius] = Math.max(q[order[k]!.radius]!, q[order[k + 1]!.radius]! + band);

  // Where things are, from the variables
  const geometry = (ring: Ring): Geometry => {
    if (!ring.parent) return { cx: 0, cy: q[ring.cy!]!, R: q[ring.radius]!, start: -Math.PI / 2 };
    const p = geometry(ring.parent.ring);
    const r = q[ring.radius]!;
    const angle = p.start + q[ring.parent.item.x]! / p.R;
    const d = Math.hypot(p.R, r);
    const cx = p.cx + d * Math.cos(angle);
    const cy = p.cy + d * Math.sin(angle);
    const before = angle - Math.atan2(r, p.R); // the first crossing, the subclause's top
    return { cx, cy, R: r, start: Math.atan2(p.cy + p.R * Math.sin(before) - cy, p.cx + p.R * Math.cos(before) - cx) };
  };
  const place = (g: Geometry, x: number, y = 0): Point => {
    const angle = g.start + x / g.R;
    const r = g.R - y;
    return [g.cx + r * Math.cos(angle), g.cy + r * Math.sin(angle)];
  };
  const width_of = (ring: Ring, it: Item): number => {
    const item = it.item;
    if ("geometry" in item) return item.geometry.width;
    if ("period" in item) return period_width;
    if ("blank" in item) return item.blank;
    return covered(q[ring.radius]!, q[it.child!.radius]!) + 2 * clear;
  };
  // The variables a ring's place depends on
  const ring_vars = (ring: Ring): number[] =>
    ring.parent ? [ring.radius, ring.parent.item.x, ...ring_vars(ring.parent.ring)] : [ring.radius, ring.cy!];

  // Nudge the variables so that f() is at least zero (or exactly zero), each in proportion to how
  // freely it moves and how much it changes f
  const project = (vars: number[], f: () => number, equal = false, stiffness = 1): boolean => {
    const c = f();
    if (!equal && c >= 0) return false;
    if (equal && Math.abs(c) < 1e-6) return false;
    const unique = [...new Set(vars)].filter((v) => free[v]! > 0);
    const step = size * 1e-3;
    const slopes = unique.map((v) => {
      const old = q[v]!;
      q[v] = old + step;
      const moved = f();
      q[v] = old;
      return (moved - c) / step;
    });
    const denominator = unique.reduce((n, v, i) => n + free[v]! * slopes[i]! ** 2, 0);
    if (denominator < 1e-12) return false;
    const lambda = (-c / denominator) * stiffness;
    unique.forEach((v, i) => (q[v] = Math.max(low[v]!, q[v]! + lambda * free[v]! * slopes[i]!)));
    return true;
  };

  // Along each ring: items in order and a gap apart, round to the first again (so the ring is long
  // enough), and the first item clear of the ring's top
  const keep_order = () => {
    for (const ring of all) {
      const n = ring.items.length;
      ring.items.forEach((a, i) => {
        if (i + 1 < n) {
          const b = ring.items[i + 1]!;
          project([a.x, b.x], () => q[b.x]! - q[a.x]! - (width_of(ring, a) + width_of(ring, b)) / 2 - gap);
        }
      });
      const first = ring.items[0]!;
      const last = ring.items[n - 1]!;
      if (n > 1)
        project(
          [first.x, last.x, ring.radius],
          () => q[first.x]! + 2 * Math.PI * q[ring.radius]! - q[last.x]! - (width_of(ring, first) + width_of(ring, last)) / 2 - gap,
        );
      else project([ring.radius], () => 2 * Math.PI * q[ring.radius]! - width_of(ring, first) - gap);
      if (!ring.period_at_top) project([first.x], () => q[first.x]! - width_of(ring, first) / 2 - (ring.parent ? gap : gap / 2));
    }
  };

  // Each sentence's ring inside the one around it, a band apart even where their centres differ
  const keep_nested = () => {
    for (let k = 0; k + 1 < order.length; k++) {
      const outer = order[k]!;
      const inner = order[k + 1]!;
      project(
        [outer.radius, inner.radius, outer.cy!, inner.cy!],
        () => q[outer.radius]! - q[inner.radius]! - Math.abs(q[outer.cy!]! - q[inner.cy!]!) - band,
      );
    }
  };

  // A word's footprint: discs along it, wide enough to cover its marks above and below the line
  type Disc = { ring: Ring; it: Item; along: number; p: Point; index: number };
  const discs = (): Disc[] => {
    let index = 0;
    return all.flatMap((ring) => {
      const g = geometry(ring);
      return ring.items.flatMap((it): Disc[] => {
        if ("clause" in it.item || "blank" in it.item) return [];
        const width = width_of(ring, it);
        const n = Math.max(1, Math.ceil(width / (footprint * 0.7)));
        return Array.from({ length: n + 1 }, (_, i) => {
          const along = -width / 2 + (width * i) / n;
          return { ring, it, along, p: place(g, q[it.x]! + along), index: index++ };
        });
      });
    });
  };
  // Pairs of discs on different rings that overlap, found through a grid as big as a disc's reach
  const overlapping = (all_discs: Disc[]): [Disc, Disc][] => {
    const cell = 2 * footprint;
    // Cells keyed by a number: column and row, each offset to stay positive
    const key = (gx: number, gy: number) => (gx + 32768) * 65536 + (gy + 32768);
    const grid = new Map<number, Disc[]>();
    for (const d of all_discs) {
      const k = key(Math.floor(d.p[0] / cell), Math.floor(d.p[1] / cell));
      const bucket = grid.get(k);
      if (bucket) bucket.push(d);
      else grid.set(k, [d]);
    }
    const pairs: [Disc, Disc][] = [];
    const reach = (2 * footprint) ** 2;
    for (const a of all_discs) {
      const gx = Math.floor(a.p[0] / cell);
      const gy = Math.floor(a.p[1] / cell);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const bucket = grid.get(key(gx + dx, gy + dy));
          if (!bucket) continue;
          for (const b of bucket) {
            // Each pair once, and only across rings
            if (a.index >= b.index || a.ring === b.ring) continue;
            const ex = a.p[0] - b.p[0];
            const ey = a.p[1] - b.p[1];
            if (ex * ex + ey * ey < reach) pairs.push([a, b]);
          }
        }
    }
    return pairs;
  };
  // No two words on different rings overlap
  const keep_apart = (): number => {
    const pairs = overlapping(discs());
    for (const [a, b] of pairs) {
      const at = (d: Disc) => place(geometry(d.ring), q[d.it.x]! + d.along);
      project(
        [a.it.x, ...ring_vars(a.ring), b.it.x, ...ring_vars(b.ring)],
        () => {
          const pa = at(a);
          const pb = at(b);
          return Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) - 2 * footprint * MARGIN;
        },
      );
    }
    return pairs.length;
  };

  // Preferences: every ring as small as it can be, spaced evenly (or packed from its start when
  // condensed), and centred
  const prefer = (strength: number) => {
    for (const ring of all) {
      q[ring.radius] = Math.max(low[ring.radius]!, q[ring.radius]! - size * 0.02 * strength);
      const n = ring.items.length;
      const total = 2 * Math.PI * q[ring.radius]!;
      const widths = ring.items.map((it) => width_of(ring, it));
      const spare = Math.max(0, total - widths.reduce((s, w) => s + w, 0) - n * gap);
      const spacing = even ? gap + spare / n : gap;
      ring.items.forEach((it, i) => {
        if (i === 0 || free[it.x] === 0) return;
        const before = ring.items[i - 1]!;
        const wanted = q[before.x]! + (widths[i - 1]! + widths[i]!) / 2 + spacing;
        q[it.x] = q[it.x]! + (wanted - q[it.x]!) * 0.2 * strength;
      });
      if (ring.cy !== undefined) q[ring.cy] = q[ring.cy]! * (1 - 0.05 * strength);
    }
  };

  // The preferences fade out over the first rounds, then the rules alone settle it, for a while.
  // Projection can trade one push for another and never quite settle, in which case some overlaps
  // are left, and the caller falls back to another layout.
  const settle = () => {
    keep_order();
    keep_nested();
    let n = keep_apart();
    keep_nested();
    n += keep_apart();
    keep_order();
    return n;
  };
  const fade = FADE;
  let rounds = 0;
  let left = 0;
  for (; rounds < fade + SETTLE; rounds++) {
    const strength = Math.max(0, 1 - rounds / fade);
    if (strength > 0) prefer(strength);
    left = settle();
    if (strength === 0 && left === 0) break;
  }

  left = overlapping(discs()).length;
  const solved: SolvedRing[] = all.map((ring) => {
    const g = geometry(ring);
    return {
      ...g,
      items: ring.items.map((it) => ({ item: it.item, x: q[it.x]!, width: width_of(ring, it) })),
      sentence: ring.sentence,
      chain: ring.chain,
    };
  });
  return { rings: solved, overlaps: left, rounds, footprint };
}
