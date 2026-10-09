import type { Placement, Solved, SolvedRing, SolveOptions } from "./circle_solver";
import type { CircleItem, Point } from "./script_drawings";

// Lays the line script out round circles by relaxation: lay everything out, find the words that
// overlap, make room where they do, and lay out again, until nothing overlaps. Every sentence's
// ring is spaced a band from the next, plus whatever spread it's been given; every subclause's
// circle is the smallest its writing fits round, with whatever room it's been given either side.

// Where a word or period sits once laid out, as a chain of discs along it wide enough to cover
// its marks above and below the line, and where it belongs: its sentence, and the subclauses down
// to the ring it's on (the same ring as another footprint when ring is the same array)
type Footprint = { points: Point[]; sentence: number; chain: CircleItem[]; ring: CircleItem[]; item: CircleItem };

export function relax_circles({
  rings,
  style,
  size,
  period_width,
  footprint,
}: Omit<SolveOptions, "start">): Solved & { placed: Placement } {
  const gap = size * 0.25;
  const clear = size * 0.3; // kept clear either side of a subclause's circle on its parent's ring
  const band = Math.max(size * 1.35, 2 * footprint); // between sentences' rings, to start with
  // What the layout adjusts until no two words overlap: more room for a subclause on its parent's
  // ring, and more room between two sentences' rings
  const room = new Map<CircleItem, number>();
  const spread = rings.map(() => 0);
  // More room before an item on a sentence's ring, taken from the ring's room to spare, which
  // slides it (and what follows) along the ring
  const slide = new Map<CircleItem, number>();

  // A subclause's circle crosses its parent's ring at right angles, which it does exactly when the
  // distance between their centres is the square root of the sum of their radii squared: there,
  // each one's radius is the other's tangent. Its centre is that far out from the parent's, so a
  // little outside the ring, and between the crossings it covers an arc of 2R atan(r / R).
  const covered = (R: number, r: number) => (Number.isFinite(R) ? 2 * R * Math.atan2(r, R) : 2 * r);

  // One pass of laying the text out, with the room and spread as they stand
  const lay_out = () => {
    // An item's width along a ring of radius R: a subclause takes the arc its circle covers, so no
    // writing on the ring falls inside it, plus any room it's been given
    const width_of = (item: CircleItem, R: number): number =>
      "geometry" in item
        ? item.geometry.width
        : "period" in item
          ? period_width
          : "blank" in item
            ? item.blank
            : covered(R, radius_of(item.clause)) + 2 * (clear + (room.get(item) ?? 0));
    const length_of = (items: CircleItem[], R: number) =>
      items.reduce((n, item) => n + width_of(item, R) + gap + (slide.get(item) ?? 0), 0);
    // A subclause's circle is the smallest its own writing fits round, including the arcs its own
    // subclauses' circles cover, which depend on its size, so it's found by a few rounds of refining
    const radii_found = new Map<CircleItem[], number>();
    function radius_of(items: CircleItem[]): number {
      const known = radii_found.get(items);
      if (known) return known;
      let r = Math.max(size * 0.5, length_of(items, Infinity) / (2 * Math.PI));
      for (let round = 0; round < 8; round++) r = Math.max(r, length_of(items, r) / (2 * Math.PI));
      radii_found.set(items, r);
      return r;
    }

    // Sentences' rings: a line apart, plus any spread, each big enough for its sentence. A
    // sentence's ring is big beside its subclauses' circles, so each covers about its diameter.
    const lengths = rings.map((items) => length_of(items, Infinity));
    const offsets = rings.map((_, k) => spread.slice(0, k).reduce((n, extra) => n + band + extra, 0));
    const last = rings.length - 1;
    const radii =
      style.grow === "in"
        ? (() => {
            const outer = Math.max(size * 0.8 + offsets[last]!, ...lengths.map((l, k) => l / (2 * Math.PI) + offsets[k]!));
            return offsets.map((o) => outer - o);
          })()
        : (() => {
            const inner = Math.max(size * 0.8, ...lengths.map((l, k) => l / (2 * Math.PI) - offsets[k]!));
            return offsets.map((o) => inner + o);
          })();

    const solved: SolvedRing[] = [];
    const footprints: Footprint[] = [];
    // Where each ring's items were put: its radius, and each item's centre along it
    const placed: Placement = new Map();

    // One ring of items round (cx, cy), starting at an angle and read clockwise. A sentence's ring
    // starts at the top and places its period; a subclause's starts where it crosses its parent.
    const lay_ring = (items: CircleItem[], cx: number, cy: number, R: number, start: number, sentence: number, chain: CircleItem[]) => {
      const circumference = 2 * Math.PI * R;
      const length = length_of(items, R);
      const ring_gap = style.spacing === "even" ? gap + (circumference - length) / items.length : gap;
      const centres = new Map<CircleItem, number>();
      placed.set(items, { R, centres });
      const ring: SolvedRing = { cx, cy, R, start, items: [], sentence, chain };
      solved.push(ring);
      // With the period at the top, the sentence starts just clockwise of it and any room to spare is
      // left between its last word and the period; otherwise it starts at the top and the period
      // follows its last word
      const is_sentence = chain.length === 0;
      const period_at_top = is_sentence && (style.spacing === "even" || style.period_position === "top");
      const last = items.at(-1)!;
      const half_period = "period" in last ? width_of(last, R) / 2 : 0;
      // Where a point on the line goes, x along it from the start
      const angle_at = (x: number) => start + x / R;
      const place = (x: number): Point => [cx + R * Math.cos(angle_at(x)), cy + R * Math.sin(angle_at(x))];
      // A footprint's discs, along the line from x for a width
      const discs = (x: number, width: number): Point[] => {
        const n = Math.max(1, Math.ceil(width / (footprint * 0.7)));
        return Array.from({ length: n + 1 }, (_, i) => place(x + (width * i) / n));
      };
      // A subclause starts just clockwise of where it crosses its parent, which is its top
      let x = period_at_top ? half_period + ring_gap : is_sentence ? ring_gap / 2 : gap;
      for (const item of items) {
        const width = width_of(item, R);
        x += slide.get(item) ?? 0;
        const centre = "period" in item && period_at_top ? circumference : x + width / 2;
        centres.set(item, centre);
        ring.items.push({ item, x: centre, width });
        if ("geometry" in item) footprints.push({ points: discs(x, width), sentence, chain, ring: items, item });
        else if ("period" in item) footprints.push({ points: [place(centre)], sentence, chain, ring: items, item });
        else if ("clause" in item) {
          // The subclause's circle crosses this ring at right angles either side of where the clause
          // comes; its text starts at the first crossing, going clockwise, and goes once round
          const r = radius_of(item.clause);
          const angle = angle_at(centre);
          const d = Math.hypot(R, r);
          const px = cx + d * Math.cos(angle);
          const py = cy + d * Math.sin(angle);
          const before = angle - Math.atan2(r, R); // the first crossing, on this ring
          const sub_start = Math.atan2(cy + R * Math.sin(before) - py, cx + R * Math.cos(before) - px);
          lay_ring(item.clause, px, py, r, sub_start, sentence, [...chain, item]);
        }
        x += width + ring_gap;
      }
    };
    rings.forEach((items, k) => lay_ring(items, 0, 0, radii[k]!, -Math.PI / 2, k, []));
    // How much room each sentence's ring has to spare
    const spare = rings.map((items, k) => 2 * Math.PI * radii[k]! - length_of(items, radii[k]!));
    return { solved, footprints, spare, placed };
  };

  // Two footprints on different rings overlap if any of their discs do, by as much as the deepest
  // pair of discs overlaps. Discs are bucketed by a grid as big as a disc's reach, so each is only
  // checked against its neighbours.
  type Overlap = { a: Footprint; b: Footprint; depth: number; at_a: Point; at_b: Point };
  const overlaps = (footprints: Footprint[]): Overlap[] => {
    const cell = 2 * footprint;
    const grid = new Map<string, { f: number; p: Point }[]>();
    footprints.forEach((f, i) =>
      f.points.forEach((p) => {
        const k = `${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)}`;
        const bucket = grid.get(k);
        if (bucket) bucket.push({ f: i, p });
        else grid.set(k, [{ f: i, p }]);
      }),
    );
    const found = new Map<string, Overlap>();
    for (const [k, here] of grid) {
      const [gx, gy] = k.split(",").map(Number) as [number, number];
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (const b of grid.get(`${gx + dx},${gy + dy}`) ?? [])
            for (const a of here) {
              if (a.f >= b.f) continue;
              const fa = footprints[a.f]!;
              const fb = footprints[b.f]!;
              if (fa.ring === fb.ring) continue; // words along one ring are laid out apart already
              const depth = 2 * footprint - Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1]);
              if (depth <= 0) continue;
              const key = `${a.f},${b.f}`;
              const seen = found.get(key);
              if (!seen || depth > seen.depth) found.set(key, { a: fa, b: fb, depth, at_a: a.p, at_b: b.p });
            }
    }
    return [...found.values()];
  };

  // Lay out, then for each pair of words that overlap make room by as much as they overlap. In one
  // sentence, the subclause each is in gets more room on the ring where they part, so their circles
  // move apart along it. Between sentences, a word on a sentence's own ring slides along it away
  // from the other, backward if the other is ahead of it and forward if behind, taking room its ring
  // has to spare; only when that can't work (no room to spare, or neither word on a sentence's own
  // ring) do the two sentences' rings move apart. Repeat until nothing overlaps (or give up).
  let result = lay_out();
  let found = overlaps(result.footprints);
  let rounds = 0;
  for (; rounds < 80 && found.length > 0; rounds++) {
    const least = size * 0.05;
    const grow_gaps = new Map<number, number>();
    const grow_room = new Map<CircleItem, number>();
    const grow_slide = new Map<CircleItem, number>();
    const spare_used = new Map<number, number>();
    const more = <K>(map: Map<K, number>, key: K, by: number) => map.set(key, Math.max(map.get(key) ?? 0, by));
    for (const { a, b, depth, at_a, at_b } of found) {
      const by = depth + least;
      if (a.sentence !== b.sentence) {
        // The word on a sentence's own ring, and which way the other lies along that ring
        const [word, here, there] = a.chain.length === 0 ? [a, at_a, at_b] : [b, at_b, at_a];
        const next = word.ring[word.ring.indexOf(word.item) + 1];
        let ahead = Math.atan2(there[1], there[0]) - Math.atan2(here[1], here[0]);
        ahead = Math.atan2(Math.sin(ahead), Math.cos(ahead));
        // Moving it back means more room after it, before the next item; forward, more before it
        const target = ahead > 0 ? next : word.item;
        const used = spare_used.get(word.sentence) ?? 0;
        if (word.chain.length === 0 && target && rounds < 40 && used + by <= result.spare[word.sentence]!) {
          more(grow_slide, target, by);
          spare_used.set(word.sentence, used + by);
        } else more(grow_gaps, Math.min(a.sentence, b.sentence), by);
        continue;
      }
      let p = 0;
      while (p < a.chain.length && p < b.chain.length && a.chain[p] === b.chain[p]) p++;
      // Room is added on both sides of a subclause, so half the depth moves it far enough
      if (a.chain[p]) more(grow_room, a.chain[p]!, by / 2);
      if (b.chain[p]) more(grow_room, b.chain[p]!, by / 2);
    }
    for (const [k, by] of grow_gaps) spread[k] = spread[k]! + by;
    for (const [c, by] of grow_room) room.set(c, (room.get(c) ?? 0) + by);
    for (const [item, by] of grow_slide) slide.set(item, (slide.get(item) ?? 0) + by);
    result = lay_out();
    found = overlaps(result.footprints);
  }
  // Making room overshoots (a ring that grows re-spaces its words, which can move a circle into a
  // fresh collision), so each gap that was widened is narrowed again as far as it can go with
  // nothing overlapping, found by halving
  if (found.length === 0) {
    for (let k = 0; k < spread.length; k++) {
      if (spread[k]! <= 0) continue;
      let enough = spread[k]!;
      let too_little = 0;
      for (let step = 0; step < 6; step++) {
        const middle = (enough + too_little) / 2;
        spread[k] = middle;
        if (overlaps(lay_out().footprints).length === 0) enough = middle;
        else too_little = middle;
      }
      spread[k] = enough;
    }
    result = lay_out();
    found = overlaps(result.footprints);
  }
  return { rings: result.solved, overlaps: found.length, rounds, footprint, placed: result.placed };
}
