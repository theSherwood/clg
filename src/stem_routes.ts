// Routing a syllable's rungs in cursive stems into strokes. A rung is a horizontal line from the
// stem out to the left, to the right, or across it. Rungs join into one stroke by U-turns between
// their outer ends on the same side, outside the stem; a rung's stem end can't be joined from, so
// a one-sided rung always starts or ends its stroke there.
//
// The math: every turn joins two strokes into one, so a route takes rungs − turns strokes, and
// the fewest strokes come from the most turns that can be made together. A route is a set of
// turns with no end used twice and no closed loop (two rungs joined on both sides would make a
// ring with no start or end). Which turns can be made depends on the rules:
//   turns "next": only between rungs with no rung between them;
//   turns "clear": past rows whose rungs don't reach that side. Then a free end can only turn to
//     the nearest free end above or below it on its side, as any between would be in the way, so
//     each side's possible turns form a chain, and two turns on a side can never overlap;
//   direction "down": every stroke's turns go down the stem, so its rows only increase;
//   direction "any": turns may go up as well.
// Among the routes with the fewest strokes, the one drawn has the fewest turns upward, then the
// shortest turns, then the earliest found (which favours the top); or, preferring skips, the most
// rungs skipped over by its turns first.

export type StemRouting = { turns: "next" | "clear"; direction: "down" | "any"; prefer: "short" | "skips" };
export const default_stem_routing: StemRouting = { turns: "clear", direction: "any", prefer: "short" };

export type Side = -1 | 1;
export type Rung = { row: number; left: boolean; right: boolean };
export type Turn = { side: Side; a: number; b: number }; // between rungs a and b (indexes, a above b)
// A stroke as drawn: its rungs in order, each with the side the pen comes in from and goes out to,
// 0 being the stem (a one-sided rung that starts a stroke comes out of it, one that ends goes in)
export type Step = { rung: number; from: Side | 0; to: Side | 0 };

export const reaches = (rung: Rung, side: Side) => (side < 0 ? rung.left : rung.right);

export function rungs_of(states: number[]): Rung[] {
  return states.flatMap((state, row) => (state === 0 ? [] : [{ row, left: (state & 1) > 0, right: (state & 2) > 0 }]));
}

// Every turn the rules allow, on its own
export function possible_turns(rungs: Rung[], rules: StemRouting): Turn[] {
  const turns: Turn[] = [];
  for (const side of [-1, 1] as Side[])
    for (let a = 0; a < rungs.length; a++)
      for (let b = a + 1; b < rungs.length; b++) {
        if (!reaches(rungs[a]!, side) || !reaches(rungs[b]!, side)) continue;
        const between = rungs.slice(a + 1, b);
        if (rules.turns === "next" ? between.length > 0 : between.some((r) => reaches(r, side))) continue;
        turns.push({ side, a, b });
      }
  return turns;
}

// A route's strokes, each a run of rungs joined by its turns, or null if the turns close a loop
function strokes_of(rungs: Rung[], turns: Turn[]): number[][] | null {
  const links = rungs.map(() => [] as number[]);
  for (const t of turns) {
    links[t.a]!.push(t.b);
    links[t.b]!.push(t.a);
  }
  const seen = rungs.map(() => false);
  const strokes: number[][] = [];
  // Walk each stroke from an end: a rung with fewer than two turns
  rungs.forEach((_, start) => {
    if (seen[start] || links[start]!.length > 1) return;
    const stroke = [start];
    seen[start] = true;
    for (let at = start, next = links[start]![0]; next !== undefined; ) {
      stroke.push(next);
      seen[next] = true;
      const after = links[next]!.find((n) => n !== at);
      [at, next] = [next, after!];
    }
    strokes.push(stroke);
  });
  return seen.every(Boolean) ? strokes : null; // what's left unwalked is a loop
}

// Every route the rules allow: the sets of turns with no end used twice, no loop, and, going down
// only, every stroke's rows in one direction
export function all_routes(rungs: Rung[], rules: StemRouting): Turn[][] {
  const possible = possible_turns(rungs, rules);
  const routes: Turn[][] = [];
  for (let mask = 0; mask < 1 << possible.length; mask++) {
    const turns = possible.filter((_, i) => mask & (1 << i));
    const ends = turns.flatMap((t) => [`${t.a}${t.side}`, `${t.b}${t.side}`]);
    if (new Set(ends).size < ends.length) continue;
    const strokes = strokes_of(rungs, turns);
    if (!strokes) continue;
    if (rules.direction === "down" && !strokes.every((s) => monotonic(s.map((r) => rungs[r]!.row)))) continue;
    routes.push(turns);
  }
  return routes;
}

const monotonic = (rows: number[]) =>
  rows.every((row, i) => i === 0 || row > rows[i - 1]!) || rows.every((row, i) => i === 0 || row < rows[i - 1]!);

// A route's strokes as drawn: each written the way with fewer turns upward, and otherwise from the
// top; with how many turns go up
export function draw_route(rungs: Rung[], turns: Turn[]): { strokes: Step[][]; upward: number } {
  const side_between = (a: number, b: number) => turns.find((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a))!.side;
  let upward = 0;
  const strokes = strokes_of(rungs, turns)!.map((order) => {
    const ups = (o: number[]) => o.filter((r, i) => i > 0 && rungs[r]!.row < rungs[o[i - 1]!]!.row).length;
    const reversed = [...order].reverse();
    const forward =
      ups(order) !== ups(reversed) ? ups(order) < ups(reversed) : rungs[order[0]!]!.row <= rungs[reversed[0]!]!.row;
    const path = forward ? order : reversed;
    upward += ups(path);
    return path.map((r, i): Step => {
      const rung = rungs[r]!;
      const across = rung.left && rung.right;
      const into = i > 0 ? side_between(path[i - 1]!, r) : null;
      const out = i < path.length - 1 ? side_between(r, path[i + 1]!) : null;
      // A one-sided rung's other end is the stem; an across rung's ends are opposite each other.
      // On its own, an across rung is written left to right.
      const own: Side = rung.left ? -1 : 1;
      if (!across) return into !== null ? { rung: r, from: into, to: 0 } : { rung: r, from: 0, to: out ?? own };
      const from: Side = into ?? (out !== null ? (-out as Side) : -1);
      return { rung: r, from, to: -from as Side };
    });
  });
  // Written from the top stroke down
  strokes.sort((a, b) => rungs[a[0]!.rung]!.row - rungs[b[0]!.rung]!.row);
  return { strokes, upward };
}

// Whether one list of numbers comes before another, comparing the first that differ
const before = (x: number[], y: number[]) => {
  const i = x.findIndex((v, j) => v !== y[j]);
  return i >= 0 && x[i]! < y[i]!;
};

// A route, as drawn, with what ranks it: its turns upward, how far its turns reach in all, and how
// many rungs they pass over
export type Ranked = { turns: Turn[]; strokes: Step[][]; upward: number; span: number; skips: number };

// Every route the rules allow, best first: the fewest strokes, then (preferring skips) the most
// rungs skipped, then the fewest turns upward, then the shortest turns. The first is the one drawn.
const ranked = new Map<string, { rungs: Rung[]; routes: Ranked[] }>();
export function ranked_routes(states: number[], rules: StemRouting): { rungs: Rung[]; routes: Ranked[] } {
  const key = `${states.join()}|${rules.turns}|${rules.direction}|${rules.prefer}`;
  const known = ranked.get(key);
  if (known) return known;
  const rungs = rungs_of(states);
  const routes = all_routes(rungs, rules).map((turns): Ranked => {
    const { strokes, upward } = draw_route(rungs, turns);
    const span = turns.reduce((n, t) => n + rungs[t.b]!.row - rungs[t.a]!.row, 0);
    const skips = turns.reduce((n, t) => n + t.b - t.a - 1, 0);
    return { turns, strokes, upward, span, skips };
  });
  const rank = (r: Ranked) => [r.strokes.length, rules.prefer === "skips" ? -r.skips : 0, r.upward, r.span];
  // A stable sort keeps the earliest found first among equals
  routes.sort((a, b) => (before(rank(a), rank(b)) ? -1 : before(rank(b), rank(a)) ? 1 : 0));
  const result = { rungs, routes };
  ranked.set(key, result);
  return result;
}

// The route drawn
export function best_route(states: number[], rules: StemRouting): { rungs: Rung[]; strokes: Step[][] } {
  const { rungs, routes } = ranked_routes(states, rules);
  return { rungs, strokes: routes[0]?.strokes ?? [] };
}
