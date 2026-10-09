import type { CircleItem, LineStyle, Point } from "./script_drawings";

// Where a layout put things, for another to start from: each ring (by its list of items), its
// radius and each item's centre along it
export type Placement = Map<CircleItem[], { R: number; centres: Map<CircleItem, number> }>;

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
  footprint: number; // the radius of the discs a word's footprint is made of (see circle_footprint)
  // A layout with nothing overlapping to start from: then the solver improves it in steps, keeping
  // each only if nothing overlaps and the whole is smaller, so the result can't be worse
  start?: Placement;
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

export function solve_circles({ rings: sentences, style, size, period_width, footprint, start }: SolveOptions): Solved {
  const gap = size * 0.25;
  const clear = size * 0.3; // kept clear either side of a subclause's circle on its parent's ring
  const band = Math.max(size * 1.35, 2 * footprint); // between sentences' rings, at the least
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
    const was = start?.get(items);
    const ring: Ring = {
      sentence,
      items: [],
      radius: parent
        ? variable(was?.R ?? Math.max(size * 0.5, length / (2 * Math.PI)), SUB_FREE, size * 0.5)
        : variable(was?.R ?? Math.max(size * 0.8, length / (2 * Math.PI)), RING_FREE, size * 0.8),
      cy: parent ? undefined : variable(0, RING_FREE),
      parent,
      chain,
      period_at_top,
    };
    let x = 0;
    ordered.forEach((item, i) => {
      const fixed = period_at_top && i === 0;
      const it: Item = { item, x: variable(fixed ? 0 : (was?.centres.get(item) ?? x), fixed ? 0 : 1) };
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
  if (!start)
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

  // The rules that hold the layout together, each a function to be at least zero and the variables
  // it depends on. Along each ring: items in order and a gap apart, round to the first again (so
  // the ring is long enough), and the first item clear of the ring's top. And each sentence's ring
  // inside the one around it, a band apart even where their centres differ.
  type Rule = { vars: number[]; f: () => number };
  const rules: Rule[] = [];
  for (const ring of all) {
    const n = ring.items.length;
    ring.items.forEach((a, i) => {
      if (i + 1 < n) {
        const b = ring.items[i + 1]!;
        rules.push({ vars: [a.x, b.x], f: () => q[b.x]! - q[a.x]! - (width_of(ring, a) + width_of(ring, b)) / 2 - gap });
      }
    });
    const first = ring.items[0]!;
    const last = ring.items[n - 1]!;
    if (n > 1)
      rules.push({
        vars: [first.x, last.x, ring.radius],
        f: () => q[first.x]! + 2 * Math.PI * q[ring.radius]! - q[last.x]! - (width_of(ring, first) + width_of(ring, last)) / 2 - gap,
      });
    else rules.push({ vars: [ring.radius], f: () => 2 * Math.PI * q[ring.radius]! - width_of(ring, first) - gap });
    if (!ring.period_at_top)
      rules.push({ vars: [first.x], f: () => q[first.x]! - width_of(ring, first) / 2 - (ring.parent ? gap : gap / 2) });
  }
  for (let k = 0; k + 1 < order.length; k++) {
    const outer = order[k]!;
    const inner = order[k + 1]!;
    rules.push({
      vars: [outer.radius, inner.radius, outer.cy!, inner.cy!],
      f: () => q[outer.radius]! - q[inner.radius]! - Math.abs(q[outer.cy!]! - q[inner.cy!]!) - band,
    });
  }
  const keep_rules = () => rules.forEach((r) => project(r.vars, r.f));
  const rules_hold = () => rules.every((r) => r.f() >= -size * 0.01);

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
    // Cells keyed by a small whole number (column and row, each offset to stay positive), which
    // keeps the lookups fast
    const key = (gx: number, gy: number) => (gx + 2048) * 4096 + (gy + 2048);
    const grid = new Map<number, number[]>();
    const cells = new Int32Array(all_discs.length * 2);
    all_discs.forEach((d, i) => {
      const gx = Math.floor(d.p[0] / cell);
      const gy = Math.floor(d.p[1] / cell);
      cells[2 * i] = gx;
      cells[2 * i + 1] = gy;
      const k = key(gx, gy);
      const bucket = grid.get(k);
      if (bucket) bucket.push(i);
      else grid.set(k, [i]);
    });
    const pairs: [Disc, Disc][] = [];
    const reach = (2 * footprint) ** 2;
    for (let i = 0; i < all_discs.length; i++) {
      const a = all_discs[i]!;
      const gx = cells[2 * i]!;
      const gy = cells[2 * i + 1]!;
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const bucket = grid.get(key(gx + dx, gy + dy));
          if (!bucket) continue;
          for (const j of bucket) {
            // Each pair once, and only across rings
            if (j <= i) continue;
            const b = all_discs[j]!;
            if (a.ring === b.ring) continue;
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
  // How rings are sized. "tight": every ring as small as it can be. "full": only the outermost
  // sentence's ring is pulled in, squeezing the whole layout, and each ring inside it is pulled out
  // to a band inside the one around it, so it uses all the room it has and its words can slide
  // aside rather than push rings apart. Subclauses' circles are as small as they can be either way.
  const full = style.ring_sizing !== "tight";
  const outermost = order[0]!;
  const prefer = (strength: number) => {
    if (full)
      for (let k = 0; k + 1 < order.length; k++) {
        const outer = order[k]!;
        const inner = order[k + 1]!;
        const room = q[outer.radius]! - Math.abs(q[outer.cy!]! - q[inner.cy!]!) - band;
        if (room > q[inner.radius]!) q[inner.radius] = q[inner.radius]! + (room - q[inner.radius]!) * 0.3 * strength;
      }
    for (const ring of all) {
      if (!full || ring.parent || ring === outermost)
        q[ring.radius] = Math.max(low[ring.radius]!, q[ring.radius]! - size * 0.02 * strength);
      const n = ring.items.length;
      const total = 2 * Math.PI * q[ring.radius]!;
      const widths = ring.items.map((it) => width_of(ring, it));
      const spare = Math.max(0, total - widths.reduce((s, w) => s + w, 0) - n * gap);
      const spacing = even ? gap + spare / n : gap;
      // Where each item would be, evenly spaced (or packed) counting from the ring's first item, so
      // the pull reaches all the way round at once rather than a neighbour at a time
      let wanted = q[ring.items[0]!.x]!;
      ring.items.forEach((it, i) => {
        if (i > 0) wanted += (widths[i - 1]! + widths[i]!) / 2 + spacing;
        if (i === 0 || free[it.x] === 0) return;
        q[it.x] = q[it.x]! + (wanted - q[it.x]!) * 0.5 * strength;
      });
      if (ring.cy !== undefined) q[ring.cy] = q[ring.cy]! * (1 - 0.05 * strength);
    }
  };

  // The preferences fade out over the first rounds, then the rules alone settle it, for a while.
  // Projection can trade one push for another and never quite settle, in which case some overlaps
  // are left, and the caller falls back to another layout.
  // A round of settling: the rules, then words apart, twice. Returns how many overlaps the last
  // pass found.
  const settle = () => {
    keep_rules();
    keep_apart();
    keep_rules();
    const n = keep_apart();
    keep_rules();
    return n;
  };
  let rounds = 0;
  let left = 0;
  if (!start) {
    for (; rounds < FADE + SETTLE; rounds++) {
      const strength = Math.max(0, 1 - rounds / FADE);
      if (strength > 0) prefer(strength);
      left = settle();
      if (strength === 0 && left === 0) break;
    }
  } else {
    // From a layout with nothing overlapping: try a move, let the rules settle it, and keep it only
    // if everything holds, nothing overlaps and the whole is smaller; otherwise undo it and try a
    // smaller one. Every kept state is checked, so the result is never worse than the start.
    const clean = () => rules_hold() && overlapping(discs()).length === 0;
    const settles = (most: number) => {
      for (let r = 0; r < most; r++) {
        rounds++;
        // Only worth checking it's clean once the last pass found nothing overlapping
        if (settle() === 0 && clean()) return true;
      }
      return clean();
    };
    // How far the whole reaches from the centre, either way: the bounding box to squeeze
    const extent = () => {
      let e = 0;
      for (const d of discs()) e = Math.max(e, Math.abs(d.p[0]) + footprint, Math.abs(d.p[1]) + footprint);
      if (style.midline)
        for (const ring of all) {
          const g = geometry(ring);
          e = Math.max(e, Math.abs(g.cx) + g.R, Math.abs(g.cy) + g.R);
        }
      return e;
    };
    if (!clean()) settles(60);
    let best = q.slice();
    let best_extent = clean() ? extent() : Infinity;
    const keep = () => {
      best = q.slice();
      best_extent = extent();
    };
    const undo = () => best.forEach((v, i) => (q[i] = v));
    // Squeeze: pull the outermost ring in (or every ring, when tight), with inner rings filling
    // the room they have when full
    let step = size * 2;
    for (let tries = 0; tries < 40 && step > size * 0.1; tries++) {
      if (full) q[outermost.radius] = q[outermost.radius]! - step;
      else for (const ring of order) q[ring.radius] = Math.max(low[ring.radius]!, q[ring.radius]! - step);
      if (settles(12) && extent() < best_extent - size * 0.01) {
        keep();
        step *= 1.5;
      } else {
        undo();
        step /= 2;
      }
    }
    // Then even out the spacing along rings (or pack it, when condensed), and fill inner rings,
    // where that stays clean and no bigger
    for (let pass = 0; pass < 3; pass++) {
      prefer(1);
      q[outermost.radius] = best[outermost.radius]!;
      if (settles(12) && extent() <= best_extent + size * 0.01) keep();
      else undo();
    }
    undo();
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
