import { flow_circles } from "./circle_flow";
import { relax_circles } from "./circle_relax";
import { type Solved, type SolveOptions, solve_circles } from "./circle_solver";
import type { CircleItem, StaveStyle } from "./script_drawings";

// Laying the stave script out round circles with whichever solver the style asks for: pure
// geometry, so it can run in a worker (circle_worker.ts) as well as on the page

export type LayoutOptions = Omit<SolveOptions, "start">;
export type Laid = Solved & { solver: StaveStyle["solver"] };

// How far a layout reaches from the centre, across or down, as it's drawn: the rings, if the
// midline is drawn, and every word and period with its footprint round it
export function solved_extent(solved: Solved, style: StaveStyle): number {
  let extent = 0;
  const reach = (x: number, y: number, by: number) => (extent = Math.max(extent, Math.abs(x) + by, Math.abs(y) + by));
  for (const ring of solved.rings) {
    const place = (x: number) => {
      const angle = ring.start + x / ring.R;
      return [ring.cx + ring.R * Math.cos(angle), ring.cy + ring.R * Math.sin(angle)] as const;
    };
    if (style.midline) reach(ring.cx, ring.cy, ring.R);
    for (const { item, x, width } of ring.items) {
      if ("geometry" in item) for (let t = 0; t <= 1; t += 0.25) reach(...place(x - width / 2 + width * t), solved.footprint);
      else if ("period" in item) reach(...place(x), solved.footprint);
    }
  }
  return extent;
}

export function solve_layout(options: LayoutOptions): Laid {
  const { style } = options;
  if (style.solver === "flow") return { ...flow_circles(options), solver: "flow" };
  const relaxed = relax_circles(options);
  if (style.solver === "relax") return { ...relaxed, solver: "relax" };
  // The constraint solver starts from the relaxation's layout and keeps only improvements on it;
  // its layout is used where nothing overlaps and it comes out smaller
  const solved = solve_circles({ ...options, start: relaxed.placed });
  return solved.overlaps === 0 && solved_extent(solved, style) < solved_extent(relaxed, style)
    ? { ...solved, solver: "constraints" }
    : { ...relaxed, solver: "relax" };
}

// Every item in the rings, subclauses' items after the subclause, in an order both sides of a
// worker agree on, so a layout can name its items by number
export function items_in(rings: CircleItem[][]): CircleItem[] {
  const all: CircleItem[] = [];
  const visit = (items: CircleItem[]) =>
    items.forEach((item) => {
      all.push(item);
      if ("clause" in item) visit(item.clause);
    });
  rings.forEach(visit);
  return all;
}

// A layout as sent from the worker, with items by number
export type Wire = Omit<Laid, "rings"> & {
  rings: (Omit<Solved["rings"][number], "items" | "chain"> & { items: { i: number; x: number; width: number }[]; chain: number[] })[];
};

export function to_wire(laid: Laid, rings: CircleItem[][]): Wire {
  const number = new Map(items_in(rings).map((item, i) => [item, i]));
  return {
    ...laid,
    rings: laid.rings.map((ring) => ({
      ...ring,
      items: ring.items.map(({ item, x, width }) => ({ i: number.get(item)!, x, width })),
      chain: ring.chain.map((item) => number.get(item)!),
    })),
  };
}

export function from_wire(wire: Wire, rings: CircleItem[][]): Laid {
  const all = items_in(rings);
  return {
    ...wire,
    rings: wire.rings.map((ring) => ({
      ...ring,
      items: ring.items.map(({ i, x, width }) => ({ item: all[i]!, x, width })),
      chain: ring.chain.map((i) => all[i]!),
    })),
  };
}
