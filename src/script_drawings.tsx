import React from "react";
import { solve_circles } from "./circle_solver";
import { T, type Word } from "./dict";
import { type Phonology } from "./phonology";
import {
  type MarkLayout,
  type SyllabicsSettings,
  default_line,
  default_stems,
  default_syllabics,
  layout_values,
  type ScriptToken,
  syllabics_glyphs,
} from "./scripts";

// Drawing the candidate scripts, for the script playground and the word popups

export const SYLLABICS_FONT = "'Euphemia UCAS', 'Noto Sans Canadian Aboriginal', sans-serif";

// A saved setting, if it's still the same kind of value; saved settings objects are merged into
// the defaults, so ones saved before a field was added still work
export function load<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const value: unknown = JSON.parse(saved);
    if (typeof fallback === "object" && fallback !== null) {
      return typeof value === "object" && value !== null && !Array.isArray(value)
        ? { ...fallback, ...value }
        : fallback;
    }
    return typeof value === typeof fallback ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

// A word in the stem script: one stem per syllable, a rung per row (none, left, right, across)
export function Stems({ rows, size }: { rows: number[][]; size: number }) {
  const column = size * 0.62;
  const height = size * 1.1;
  const pad = size * 0.08;
  const row_height = (height - 2 * pad) / 4;
  const rung = column * 0.38;
  return (
    <svg
      width={rows.length * column}
      height={height}
      viewBox={`0 0 ${rows.length * column} ${height}`}
      className="inline-block align-middle"
      stroke="currentColor"
      strokeWidth={Math.max(1.5, size / 16)}
      strokeLinecap="round"
    >
      {rows.map((states, i) => {
        const x = i * column + column / 2;
        return (
          <g key={i}>
            <line x1={x} y1={pad} x2={x} y2={height - pad} />
            {states.map((state, r) => {
              const y = pad + (r + 0.5) * row_height;
              return (
                <React.Fragment key={r}>
                  {state & 1 ? <line x1={x - rung} y1={y} x2={x} y2={y} /> : null}
                  {state & 2 ? <line x1={x} y1={y} x2={x + rung} y2={y} /> : null}
                </React.Fragment>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// The line script: each syllable is four marks along a midline, left to right, each a dash or a
// loop, above or below it. Every position is the same width. How the marks join, and whether the
// midline is straight or a circle, are settings (LineStyle, below).
const LINE_SLOT = 0.32;

export type Point = [number, number];

// A centripetal Catmull-Rom spline through the points, as cubic Béziers
export function spline(points: Point[]): string {
  const p = [points[0]!, ...points, points.at(-1)!];
  const dist = (a: Point, b: Point) => Math.max(1e-6, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5);
  let path = `M ${points[0]![0]} ${points[0]![1]}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1]!, p[i]!, p[i + 1]!, p[i + 2]!];
    const d1 = dist(p0, p1);
    const d2 = dist(p1, p2);
    const d3 = dist(p2, p3);
    const c1 = [0, 1].map(
      (k) => (d1 * d1 * p2[k]! - d2 * d2 * p0[k]! + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[k]!) / (3 * d1 * (d1 + d2)),
    );
    const c2 = [0, 1].map(
      (k) => (d3 * d3 * p1[k]! - d2 * d2 * p3[k]! + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[k]!) / (3 * d3 * (d3 + d2)),
    );
    path += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return path;
}

// How marks join: cursive (one stroke, as a hand would write it), angular (one straight line at
// the marks' level, stepping straight across where the side changes, with each loop's mark threaded
// on it), dashes (only neighbouring dashes on one side join) or separate. curves applies to
// cursive; loop_mark is how the other ways draw a loop. The midline is straight, or a circle with a
// sentence to each ring, nested one inside another (grow "in") or outside (grow "out").
export const LINE_JOINS = ["cursive", "angular", "dashes", "separate"] as const;
export type LineJoin = (typeof LINE_JOINS)[number];
export const LOOP_MARKS = ["circle", "diamond", "square", "tick"] as const;
export type LoopMark = (typeof LOOP_MARKS)[number];

export type LineStyle = {
  join: LineJoin;
  curves: boolean;
  loop_mark: LoopMark;
  midline: boolean;
  midline_color: string;
  midline_shape: "straight" | "circle";
  grow: "in" | "out";
  spacing: "even" | "condensed";
  period_position: "top" | "after"; // where a condensed sentence's period goes
  subclauses: "inline" | "circles"; // on circles, whether subclauses get circles of their own
  clause_words: "hide" | "show"; // with subclause circles, whether <clause_start> and <clause_end> are written
  solver: "relax" | "constraints"; // how the circles are laid out: see circle_layout and circle_solver.ts
};
export const default_line_style: LineStyle = {
  join: "cursive",
  curves: true,
  loop_mark: "circle",
  midline: false,
  midline_color: "#4b5563",
  midline_shape: "straight",
  grow: "in",
  spacing: "even",
  period_position: "top",
  subclauses: "inline",
  clause_words: "hide",
  solver: "relax",
};

// The midline is ruled like lined paper: thinner than the writing, in its own colour
export function midline_width(size: number): number {
  return Math.max(1, size / 24);
}

// A word in the line script as geometry: x is how far along the midline from the word's start,
// and y how far below the midline (negative is above). The strokes are what the pen draws, smooth
// (a spline through the points) or straight from point to point, and the marks are loops drawn as
// a circle, diamond, square or tick. Drawing a word straight or round a circle is then only a
// matter of where each point goes.
type Stroke = { points: Point[]; smooth: boolean };
type Mark = { shape: LoopMark; x: number; y: number; r: number };
export type LineGeometry = { strokes: Stroke[]; marks: Mark[]; width: number };

const LINE_LEVEL = 0.2; // how far above or below the midline the marks run
const SYLLABLE_GAP = 0.4; // between syllables, when marks are separate

// How far a mark reaches either side along the line, so a line threading it can stop at its edge
// (a tick is crossed, so the line runs on through it)
function mark_reach(shape: LoopMark, r: number): number {
  return shape === "circle" ? r : shape === "square" ? r * 0.9 : shape === "tick" ? 0 : r * 1.2;
}

function draw_mark(shape: LoopMark, x: number, y: number, r: number, key?: string): React.ReactNode {
  if (shape === "circle") return <circle key={key} cx={x} cy={y} r={r} />;
  if (shape === "square") return <rect key={key} x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} />;
  if (shape === "tick") return <line key={key} x1={x} y1={y - r * 1.3} x2={x} y2={y + r * 1.3} />;
  return <path key={key} d={`M ${x} ${y - r * 1.2} L ${x + r * 1.2} ${y} L ${x} ${y + r * 1.2} L ${x - r * 1.2} ${y} Z`} />;
}

// Cursive: one stroke through the word. A loop next to the other side leaves out its level start
// or end, so the pen sweeps straight between the loop and the crossing, and a word that starts or
// ends with a loop starts or ends at it.
function cursive_geometry(marks: number[][], size: number, curves: boolean): LineGeometry {
  const slot = size * LINE_SLOT;
  const level = size * LINE_LEVEL;
  const loop_height = size * 0.17;
  const loop_width = slot * 0.5;
  const flat = marks.flat();
  const side = flat.map((mark) => (mark & 1 ? 1 : -1));
  const points: Point[] = flat[0]! & 2 ? [] : [[0, side[0]! * level]];
  flat.forEach((mark, k) => {
    const left = k * slot;
    const s = side[k]!;
    const y = s * level;
    if (mark & 2) {
      const a = left + (slot - loop_width) / 2;
      const w = loop_width;
      if (k === 0 || side[k - 1] === s) points.push([a, y]);
      points.push(
        [a + w, y + s * loop_height * 0.5],
        [a + w * 0.5, y + s * loop_height * 1.15],
        [a, y + s * loop_height * 0.5],
      );
      if (k === flat.length - 1 || side[k + 1] === s) points.push([a + w, y]);
    } else {
      points.push([left + slot * 0.2, y], [left + slot * 0.8, y]);
    }
  });
  if (!(flat.at(-1)! & 2)) points.push([flat.length * slot, side.at(-1)! * level]);
  return { strokes: [{ points, smooth: curves }], marks: [], width: flat.length * slot };
}

// Separate marks above or below the line, with a gap between syllables (a separate mark can't run
// into the next, so a gap can't be taken for one). With join_dashes, neighbouring dashes on one
// side within a syllable are one line.
function separate_geometry(marks: number[][], size: number, loop: LoopMark, join_dashes: boolean): LineGeometry {
  const slot = size * LINE_SLOT;
  const gap = size * SYLLABLE_GAP;
  const level = size * LINE_LEVEL;
  const r = slot * 0.2;
  const dash = slot * 0.22; // half a dash's length
  const strokes: Stroke[] = [];
  const shapes: Mark[] = [];
  marks.forEach((syllable, i) => {
    let run: Point[] | undefined;
    const end_run = () => {
      if (run) strokes.push({ points: run, smooth: false });
      run = undefined;
    };
    syllable.forEach((mark, j) => {
      const x = i * (4 * slot + gap) + (j + 0.5) * slot;
      const y = mark & 1 ? level : -level;
      if (mark & 2) {
        end_run();
        shapes.push({ shape: loop, x, y, r });
      } else if (join_dashes && run && run[0]![1] === y) {
        run[1] = [x + dash, y];
      } else {
        end_run();
        run = [
          [x - dash, y],
          [x + dash, y],
        ];
      }
    });
    end_run();
  });
  return { strokes, marks: shapes, width: marks.length * 4 * slot + (marks.length - 1) * gap };
}

// Angular: one straight line along the word at each mark's level, stepping straight up or down at
// the boundary where the side changes. A dash is the line itself and a loop its mark threaded on
// it; a word that starts or ends with a mark starts or ends there.
function angular_geometry(marks: number[][], size: number, loop: LoopMark): LineGeometry {
  const slot = size * LINE_SLOT;
  const level = size * LINE_LEVEL;
  const r = slot * 0.24;
  const flat = marks.flat();
  const y = flat.map((mark) => (mark & 1 ? 1 : -1) * level);
  const strokes: Stroke[] = [];
  const shapes: Mark[] = [];
  let current: Point[] = [];
  flat.forEach((mark, k) => {
    const left = k * slot;
    const right = left + slot;
    const x = left + slot / 2;
    const yk = y[k]!;
    if (mark & 2) {
      shapes.push({ shape: loop, x, y: yk, r });
      const reach = mark_reach(loop, r);
      if (k === 0) current = [[x + reach, yk]];
      else if (reach > 0) {
        current.push([x - reach, yk]);
        strokes.push({ points: current, smooth: false });
        current = [[x + reach, yk]];
      } else current.push([x, yk]);
      if (k === flat.length - 1) {
        if (reach > 0) current = [];
        return;
      }
    } else if (k === 0) {
      current = [[left, yk]];
    }
    current.push([right, yk]);
    if (y[k + 1] !== undefined && y[k + 1] !== yk) current.push([right, y[k + 1]!]);
  });
  if (current.length > 1) strokes.push({ points: current, smooth: false });
  return { strokes, marks: shapes, width: flat.length * slot };
}

export function line_geometry(marks: number[][], size: number, style: LineStyle): LineGeometry {
  if (style.join === "cursive") return cursive_geometry(marks, size, style.curves);
  if (style.join === "angular") return angular_geometry(marks, size, style.loop_mark);
  return separate_geometry(marks, size, style.loop_mark, style.join === "dashes");
}

const polyline = (points: Point[]) => `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")}`;

function svg_props(size: number, style: LineStyle) {
  return {
    stroke: "currentColor",
    strokeWidth: Math.max(1.5, size / 16),
    strokeLinecap: "round" as const,
    strokeLinejoin: style.join === "angular" ? ("miter" as const) : ("round" as const),
    fill: "none",
  };
}

export function Line({ marks, size, style = default_line_style }: { marks: number[][]; size: number; style?: LineStyle }) {
  const stroke = Math.max(1.5, size / 16);
  const geometry = line_geometry(marks, size, style);
  const height = size * 1.0;
  const width = geometry.width + 2 * stroke;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block align-middle" {...svg_props(size, style)}>
      {style.midline && (
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={style.midline_color}
          strokeWidth={midline_width(size)}
          strokeLinecap="butt"
        />
      )}
      <g transform={`translate(${stroke} ${height / 2})`}>
        {geometry.strokes.map((s, i) => (
          <path key={i} d={s.smooth ? spline(s.points) : polyline(s.points)} />
        ))}
        {geometry.marks.map((m, i) => draw_mark(m.shape, m.x, m.y, m.r, `m${i}`))}
      </g>
    </svg>
  );
}

// The line script round circles: each sentence is a ring, read clockwise, with the marks above the
// line outside it and those below inside. A sentence ends at the top, so the periods line up,
// unless a condensed sentence puts its period right after it instead. Rings are a line apart, and
// all are as big as the longest sentence for its place needs, so the writing stays one size. With
// even spacing a sentence shorter than its ring has its gaps widened until it closes the circle;
// condensed, it keeps its gaps, and either starts just after its period at the top, leaving the
// room to spare before the period, or starts at the top with its period right after it. The first
// sentence is the outer ring when growing in, and the inner one when growing out.
export type CircleItem =
  | { geometry: LineGeometry; word?: Word }
  | { period: true }
  | { blank: number }
  | { clause: CircleItem[] };

const VERB_MARKERS = ["<verb>", "<verb_prescriptive>", "<verb_interrogative>"];
const PHRASE_MARKERS = ["<subject>", "<object>", "<complement>"];

// Whether a word opens an unbracketed subclause: after if, a preposition, or a role marker that
// needs a phrase, a clause starting with <subject> or a verb marker can only be a subclause, so the
// grammar leaves its bracket out
function opens_clause(previous: Word | undefined, word: Word | undefined): boolean {
  if (!previous || !word) return false;
  const starts = word.word === "<subject>" || VERB_MARKERS.includes(word.word);
  const before =
    PHRASE_MARKERS.includes(previous.word) || previous.word === "if" || previous.data.t.includes(T.preposition);
  return starts && before;
}

// A text as sentences, each a list of items. With subclauses as circles, a clause is an item of
// its own, holding its words: <clause_start> and <clause_end> become the circle, and are written at
// its start and end only with show_brackets. An unbracketed subclause is found by the grammar's
// rule. A <clause_end> closes the innermost
// bracket and any unbracketed clauses inside it, or with no bracket open, the innermost
// unbracketed clause; anything still open closes at the end of the sentence.
export function circle_sentences(
  tokens: ScriptToken[],
  geometry: (ids: number[]) => LineGeometry,
  size: number,
  subclauses: boolean,
  show_brackets = false,
): CircleItem[][] {
  const sentences: CircleItem[][] = [];
  let stack: { items: CircleItem[]; bracketed: boolean }[] = [];
  const top = () => stack.at(-1)!.items;
  const close = () => {
    const done = stack.pop()!;
    if (done.items.length > 0) top().push({ clause: done.items });
  };
  const end_sentence = () => {
    while (stack.length > 1) close();
    if (stack[0]!.items.length > 0) sentences.push(stack[0]!.items);
    stack = [{ items: [], bracketed: false }];
  };
  stack = [{ items: [], bracketed: false }];
  let previous: Word | undefined;
  for (const t of tokens) {
    if ("punctuation" in t) {
      if (t.punctuation === ".") {
        top().push({ period: true });
        // The period belongs to the sentence, not any clause still open
        const period = top().pop()!;
        while (stack.length > 1) close();
        top().push(period);
        end_sentence();
      }
      previous = undefined;
      continue;
    }
    const name = t.word?.word;
    const item = (): CircleItem => (t.ids ? { geometry: geometry(t.ids), word: t.word } : { blank: size * 0.5 });
    if (subclauses && name === "<clause_start>") {
      stack.push({ items: show_brackets ? [item()] : [], bracketed: true });
    } else if (subclauses && name === "<clause_end>") {
      if (stack.some((c, i) => i > 0 && c.bracketed)) {
        while (!stack.at(-1)!.bracketed) close();
        if (show_brackets) top().push(item());
        close();
      } else if (stack.length > 1) {
        if (show_brackets) top().push(item());
        close();
      }
    } else {
      if (subclauses && opens_clause(previous, t.word)) stack.push({ items: [], bracketed: false });
      top().push(item());
    }
    previous = t.word;
  }
  end_sentence();
  return sentences;
}

// Where a word or period sits once laid out, as a chain of discs along it wide enough to cover
// its marks above and below the line, and where it belongs: its sentence, and the subclauses down
// to the ring it's on (the same ring as another footprint when ring is the same array)
type Footprint = { points: Point[]; sentence: number; chain: CircleItem[]; ring: CircleItem[]; item: CircleItem };

type CircleLayoutArgs = {
  tokens: ScriptToken[];
  phonology: Phonology;
  layout: MarkLayout;
  style: LineStyle;
  period: PeriodStyle;
  size: number;
  wrap: (word: Word, node: React.ReactElement) => React.ReactNode;
};

export function LineCircles(args: CircleLayoutArgs) {
  const laid_out = args.style.solver === "constraints" ? best_layout(args) : circle_layout(args);
  if (!laid_out) return null;
  const centre = laid_out.extent + args.size * 0.3;
  const side = 2 * centre;
  return (
    <svg width={side} height={side} viewBox={`0 0 ${side} ${side}`} className="block" {...svg_props(args.size, args.style)}>
      <g transform={`translate(${centre} ${centre})`}>{laid_out.nodes}</g>
    </svg>
  );
}

// The constraint solver's layout where it settles with nothing overlapping and comes out smaller,
// and otherwise the relaxation's, which always settles
export function best_layout(args: CircleLayoutArgs) {
  const relaxed = circle_layout(args);
  const solved = constraint_layout(args);
  if (!relaxed || !solved) return relaxed ?? solved;
  return solved.overlaps === 0 && solved.extent < relaxed.extent
    ? { ...solved, solver: "constraints" as const }
    : { ...relaxed, solver: "relax" as const };
}

// The circles laid out by the constraint solver (circle_solver.ts), drawn round (0, 0), with how
// far it all reaches, how many rounds it took and how many overlaps were left
export function constraint_layout({ tokens, phonology, layout, style, period, size, wrap }: CircleLayoutArgs) {
  const stroke = Math.max(1.5, size / 16);
  const rings = circle_sentences(
    tokens,
    (ids) => line_geometry(ids.map((id) => layout_values(id, phonology, layout)), size, style),
    size,
    style.subclauses === "circles",
    style.clause_words === "show",
  );
  if (rings.length === 0) return undefined;
  const period_width = size * 0.3 * period.scale;
  const solved = solve_circles({ rings, style, size, period_width });
  const step = size * 0.08; // straight lines are cut this fine so they bend with the ring
  const nodes: React.ReactNode[] = [];
  let extent = 0;
  const reach = (x: number, y: number, by = 0) => (extent = Math.max(extent, Math.abs(x) + by, Math.abs(y) + by));
  solved.rings.forEach((ring, k) => {
    const place = (x: number, y: number): Point => {
      const angle = ring.start + x / ring.R;
      const r = ring.R - y;
      return [ring.cx + r * Math.cos(angle), ring.cy + r * Math.sin(angle)];
    };
    const turn = (x: number) => ((ring.start + x / ring.R) * 180) / Math.PI + 90;
    const bend = (points: Point[], at: number): Point[] =>
      points.flatMap(([x, y], i): Point[] => {
        if (i === 0) return [place(at + x, y)];
        const [px, py] = points[i - 1]!;
        const pieces = Math.max(1, Math.ceil(Math.hypot(x - px, y - py) / step));
        return Array.from({ length: pieces }, (_, n): Point => {
          const t = (n + 1) / pieces;
          return place(at + px + (x - px) * t, py + (y - py) * t);
        });
      });
    if (style.midline) {
      nodes.push(<circle key={`mid${k}`} cx={ring.cx} cy={ring.cy} r={ring.R} stroke={style.midline_color} strokeWidth={midline_width(size)} />);
      reach(ring.cx, ring.cy, ring.R);
    }
    ring.items.forEach(({ item, x: centre, width }, i) => {
      const x = centre - width / 2;
      const key = `${k}-${i}`;
      if ("geometry" in item) {
        const g = item.geometry;
        const word = (
          <g key={key}>
            {/* An invisible band along the word, so it's easy to hover */}
            <path d={polyline(bend([[0, 0], [width, 0]], x))} stroke="transparent" strokeWidth={size * 0.9} />
            {g.strokes.map((s, j) => (
              <path key={j} d={s.smooth ? spline(s.points.map(([px, py]) => place(x + px, py))) : polyline(bend(s.points, x))} />
            ))}
            {g.marks.map((m, j) => {
              const [mx, my] = place(x + m.x, m.y);
              return (
                <g key={`m${j}`} transform={`translate(${mx} ${my}) rotate(${turn(x + m.x)})`}>
                  {draw_mark(m.shape, 0, 0, m.r)}
                </g>
              );
            })}
          </g>
        );
        nodes.push(item.word ? <React.Fragment key={key}>{wrap(item.word, word)}</React.Fragment> : word);
        for (let t = 0; t <= 1; t += 0.25) {
          const [px, py] = place(x + width * t, 0);
          reach(px, py, solved.footprint);
        }
      } else if ("period" in item) {
        const [px, py] = place(centre, 0);
        nodes.push(
          <g key={key} transform={`translate(${px} ${py}) rotate(${turn(centre)})`}>
            {draw_mark(period.shape, 0, 0, Math.max(width / 2 - stroke, stroke))}
          </g>,
        );
        reach(px, py, solved.footprint);
      }
    });
  });
  return { nodes, extent, rounds: solved.rounds, overlaps: solved.overlaps };
}

// The circles laid out round (0, 0): what to draw, how far it reaches, and how many rounds of
// making room it took and how many overlaps were left (none, unless it gave up)
export function circle_layout({ tokens, phonology, layout, style, period, size, wrap }: CircleLayoutArgs) {
  const stroke = Math.max(1.5, size / 16);
  const rings = circle_sentences(
    tokens,
    (ids) => line_geometry(ids.map((id) => layout_values(id, phonology, layout)), size, style),
    size,
    style.subclauses === "circles",
    style.clause_words === "show",
  );
  if (rings.length === 0) return undefined;

  const gap = size * 0.25;
  const period_width = size * 0.3 * period.scale;
  const clear = size * 0.3; // kept clear either side of a subclause's circle on its parent's ring
  const band = size * 1.35; // between sentences' rings, to start with
  const footprint = size * 0.38; // the radius of the discs a footprint is made of
  const step = size * 0.08; // straight lines are cut this fine so they bend with the ring
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

    const nodes: React.ReactNode[] = [];
    const footprints: Footprint[] = [];
    let extent = 0; // how far anything reaches from the centre
    const reach = (x: number, y: number, by = 0) => (extent = Math.max(extent, Math.hypot(x, y) + by));

    // One ring of items round (cx, cy), starting at an angle and read clockwise. A sentence's ring
    // starts at the top and places its period; a subclause's starts where it crosses its parent.
    const draw_ring = (
      items: CircleItem[],
      cx: number,
      cy: number,
      R: number,
      start: number,
      sentence: number,
      chain: CircleItem[],
      key: string,
    ) => {
      const circumference = 2 * Math.PI * R;
      const length = length_of(items, R);
      const ring_gap = style.spacing === "even" ? gap + (circumference - length) / items.length : gap;
      // With the period at the top, the sentence starts just clockwise of it and any room to spare is
      // left between its last word and the period; otherwise it starts at the top and the period
      // follows its last word
      const is_sentence = chain.length === 0;
      const period_at_top = is_sentence && (style.spacing === "even" || style.period_position === "top");
      const last = items.at(-1)!;
      const half_period = "period" in last ? width_of(last, R) / 2 : 0;
      // Where a point along the ring goes: x along it from the start, y below the line inward
      const angle_at = (x: number) => start + (2 * Math.PI * x) / circumference;
      const place = (x: number, y: number): Point => {
        const angle = angle_at(x);
        const r = R - y;
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
      };
      const turn = (x: number) => (angle_at(x) * 180) / Math.PI + 90;
      const bend = (points: Point[], at: number): Point[] =>
        points.flatMap(([x, y], i): Point[] => {
          if (i === 0) return [place(at + x, y)];
          const [px, py] = points[i - 1]!;
          const pieces = Math.max(1, Math.ceil(Math.hypot(x - px, y - py) / step));
          return Array.from({ length: pieces }, (_, n): Point => {
            const t = (n + 1) / pieces;
            return place(at + px + (x - px) * t, py + (y - py) * t);
          });
        });
      // A footprint's discs, along the line from x for a width
      const discs = (x: number, width: number): Point[] => {
        const n = Math.max(1, Math.ceil(width / (footprint * 0.7)));
        return Array.from({ length: n + 1 }, (_, i) => place(x + (width * i) / n, 0));
      };
      if (style.midline) {
        nodes.push(<circle key={`mid${key}`} cx={cx} cy={cy} r={R} stroke={style.midline_color} strokeWidth={midline_width(size)} />);
        reach(cx, cy, R);
      }
      // A subclause starts just clockwise of where it crosses its parent, which is its top
      let x = period_at_top ? half_period + ring_gap : is_sentence ? ring_gap / 2 : gap;
      items.forEach((item, i) => {
        const width = width_of(item, R);
        x += slide.get(item) ?? 0;
        if ("geometry" in item) {
          const g = item.geometry;
          const word = (
            <g key={`${key}-${i}`}>
              {/* An invisible band along the word, so it's easy to hover */}
              <path d={polyline(bend([[0, 0], [width, 0]], x))} stroke="transparent" strokeWidth={size * 0.9} />
              {g.strokes.map((s, j) => (
                <path
                  key={j}
                  d={s.smooth ? spline(s.points.map(([px, py]) => place(x + px, py))) : polyline(bend(s.points, x))}
                />
              ))}
              {g.marks.map((m, j) => {
                const [mx, my] = place(x + m.x, m.y);
                return (
                  <g key={`m${j}`} transform={`translate(${mx} ${my}) rotate(${turn(x + m.x)})`}>
                    {draw_mark(m.shape, 0, 0, m.r)}
                  </g>
                );
              })}
            </g>
          );
          nodes.push(item.word ? <React.Fragment key={`${key}-${i}`}>{wrap(item.word, word)}</React.Fragment> : word);
          const points = discs(x, width);
          footprints.push({ points, sentence, chain, ring: items, item });
          for (const [px, py] of points) reach(px, py, footprint);
        } else if ("period" in item) {
          const at = period_at_top ? circumference : x + width / 2;
          const [px, py] = place(at, 0);
          nodes.push(
            <g key={`${key}-${i}`} transform={`translate(${px} ${py}) rotate(${turn(at)})`}>
              {draw_mark(period.shape, 0, 0, Math.max(width / 2 - stroke, stroke))}
            </g>,
          );
          footprints.push({ points: [[px, py]], sentence, chain, ring: items, item });
          reach(px, py, footprint);
        } else if ("clause" in item) {
          // The subclause's circle crosses this ring at right angles either side of where the clause
          // comes; its text starts at the first crossing, going clockwise, and goes once round
          const r = radius_of(item.clause);
          const angle = angle_at(x + width / 2);
          const d = Math.hypot(R, r);
          const px = cx + d * Math.cos(angle);
          const py = cy + d * Math.sin(angle);
          const before = angle - Math.atan2(r, R); // the first crossing, on this ring
          const sub_start = Math.atan2(cy + R * Math.sin(before) - py, cx + R * Math.cos(before) - px);
          draw_ring(item.clause, px, py, r, sub_start, sentence, [...chain, item], `${key}-${i}`);
        }
        x += width + ring_gap;
      });
    };
    rings.forEach((items, k) => draw_ring(items, 0, 0, radii[k]!, -Math.PI / 2, k, [], `${k}`));
    // How much room each sentence's ring has to spare
    const spare = rings.map((items, k) => 2 * Math.PI * radii[k]! - length_of(items, radii[k]!));
    return { nodes, footprints, extent, spare };
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
    const more = <K,>(map: Map<K, number>, key: K, by: number) => map.set(key, Math.max(map.get(key) ?? 0, by));
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
  const left = found.length;
  return { nodes: result.nodes, extent: result.extent, rounds, overlaps: left };
}

// A word in cursive stems. The stems are one stroke for the whole word: the pen writes one stem
// down and the next up, joining them with a small arch at the foot or the top. Rungs are strokes
// of their own, written top to bottom, and only a rung meets the stem. A join is a U-turn from one
// rung's outer end to the next one's, on the same side, so it never comes near the stem. A rung
// that starts a stroke is written out from the stem, ready to join on; one that's joined into is
// written in to the stem, where the stroke ends; a rung across carries the stroke to its other side.
function rung_strokes(states: number[], x: number, top: number, row_height: number, reach: number): string[] {
  const turn = reach * 0.35; // how far a U-turn bulges past the ends
  const rungs = states.flatMap((state, r) =>
    state === 0 ? [] : [{ y: top + (r + 0.5) * row_height, left: (state & 1) > 0, right: (state & 2) > 0 }],
  );
  const reaches = (rung: (typeof rungs)[number], side: number) => (side < 0 ? rung.left : rung.right);
  const strokes: string[] = [];
  let current = "";
  let pen = 0; // the side the pen is on, -1 left or 1 right, or 0 when the stroke has ended
  rungs.forEach((rung, k) => {
    const { y, left, right } = rung;
    if (pen !== 0 && reaches(rung, pen)) {
      const end = x + pen * reach;
      const previous_y = rungs[k - 1]!.y;
      current += ` C ${end + pen * turn} ${previous_y} ${end + pen * turn} ${y} ${end} ${y}`;
      if (left && right) {
        current += ` L ${x - pen * reach} ${y}`;
        pen = -pen;
      } else {
        current += ` L ${x} ${y}`;
        strokes.push(current);
        current = "";
        pen = 0;
      }
      return;
    }
    if (current) strokes.push(current);
    if (left && right) {
      // Write it toward the side the next rung can be joined from
      const next = rungs[k + 1];
      pen = next && !next.right && next.left ? -1 : 1;
      current = `M ${x - pen * reach} ${y} L ${x + pen * reach} ${y}`;
    } else {
      pen = left ? -1 : 1;
      current = `M ${x} ${y} L ${x + pen * reach} ${y}`;
    }
  });
  if (current) strokes.push(current);
  return strokes;
}

export function CursiveStems({ rows, size }: { rows: number[][]; size: number }) {
  const column = size * 0.72;
  const height = size * 1.2;
  const pad = size * 0.14; // room for the arches between stems
  const row_height = (height - 2 * pad) / 4;
  const reach = column * 0.32;
  const stroke = Math.max(1.5, size / 16);
  const stems: Point[] = [];
  rows.forEach((_, i) => {
    const x = i * column + column / 2;
    const down = i % 2 === 0;
    if (i > 0) stems.push([x - column / 2, down ? pad * 0.35 : height - pad * 0.35]);
    const ys = [0, 0.25, 0.5, 0.75, 1].map((t) => pad + t * 4 * row_height);
    stems.push(...(down ? ys : ys.reverse()).map((y): Point => [x, y]));
  });
  return (
    <svg
      width={rows.length * column}
      height={height}
      viewBox={`0 0 ${rows.length * column} ${height}`}
      className="inline-block align-middle"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d={spline(stems)} />
      {rows.flatMap((states, i) =>
        rung_strokes(states, i * column + column / 2, pad, row_height, reach).map((d, j) => (
          <path key={`${i}-${j}`} d={d} />
        )),
      )}
    </svg>
  );
}

// The period in every script: a small mark on the midline, level with the words' middles, a
// circle, tick, square or diamond, scaled from its usual size
export type PeriodStyle = { shape: LoopMark; scale: number };
export const default_period: PeriodStyle = { shape: "circle", scale: 1 };

export function Period({ size, style = default_period }: { size: number; style?: PeriodStyle }) {
  const d = size * 0.3 * style.scale;
  const stroke = Math.max(1.5, size / 16);
  const c = d / 2;
  const r = c - stroke; // keeps the stroke inside the box
  const mark =
    style.shape === "circle" ? (
      <circle cx={c} cy={c} r={r} />
    ) : style.shape === "square" ? (
      <rect x={c - r * 0.85} y={c - r * 0.85} width={r * 1.7} height={r * 1.7} />
    ) : style.shape === "tick" ? (
      <line x1={c} y1={stroke} x2={c} y2={d - stroke} strokeLinecap="round" />
    ) : (
      <path d={`M ${c} ${c - r} L ${c + r} ${c} L ${c} ${c + r} L ${c - r} ${c} Z`} />
    );
  return (
    <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} className="block" fill="none" stroke="currentColor" strokeWidth={stroke}>
      {mark}
    </svg>
  );
}

// The settings the script playground keeps in this browser, read fresh, so popups follow it
export type ScriptSettings = {
  stems: MarkLayout;
  line: MarkLayout;
  line_style: LineStyle;
  syllabics: SyllabicsSettings;
  period: PeriodStyle;
};

export const SCRIPT_KEYS = {
  stems: "script_stems",
  line: "script_line",
  line_style: "script_line_style",
  period: "script_period",
  syllabics: "script_syllabics",
} as const;

export function stored_script_settings(): ScriptSettings {
  return {
    stems: load(SCRIPT_KEYS.stems, default_stems),
    line: load(SCRIPT_KEYS.line, default_line),
    line_style: load(SCRIPT_KEYS.line_style, default_line_style),
    period: load(SCRIPT_KEYS.period, default_period),
    syllabics: load(SCRIPT_KEYS.syllabics, default_syllabics),
  };
}

// rule: in running text, a midline ruled across the whole text, under every row of words.
// whole_text: a script that lays out a whole text itself rather than word by word (the line script
// round circles); wrap makes a word hoverable.
export type ScriptRenderer = {
  name: string;
  note: string;
  render: (ids: number[]) => React.ReactNode;
  style?: React.CSSProperties;
  rule?: { color: string; size: number };
  whole_text?: (tokens: ScriptToken[], wrap: (word: Word, node: React.ReactElement) => React.ReactNode) => React.ReactNode;
};

// Each script, as a way to write a word's root IDs
// In running text (in_text), the line script's midline is ruled across the text rather than drawn
// under each word, so it doesn't break between words
export function script_renderers(
  phonology: Phonology,
  settings: ScriptSettings,
  size: number,
  in_text = false,
): ScriptRenderer[] {
  const { stems, line, line_style, syllabics, period } = settings;
  const circles = in_text && line_style.midline_shape === "circle";
  return [
    {
      name: "Stems",
      note: "A stem per syllable, with a rung for each mark",
      render: (ids) => <Stems rows={ids.map((id) => layout_values(id, phonology, stems))} size={size} />,
    },
    {
      name: "Cursive stems",
      note: "The same stems joined into one stroke per word; rungs joined by U-turns between their outer ends",
      render: (ids) => <CursiveStems rows={ids.map((id) => layout_values(id, phonology, stems))} size={size} />,
    },
    {
      name: "Line",
      note: "Four marks per syllable along a line: a dash or a loop, above or below",
      render: (ids) => (
        <Line
          marks={ids.map((id) => layout_values(id, phonology, line))}
          size={size}
          style={in_text ? { ...line_style, midline: false } : line_style}
        />
      ),
      rule: in_text && !circles && line_style.midline ? { color: line_style.midline_color, size } : undefined,
      whole_text: circles
        ? (tokens, wrap) => (
            <LineCircles
              tokens={tokens}
              phonology={phonology}
              layout={line}
              style={line_style}
              period={period}
              size={size}
              wrap={wrap}
            />
          )
        : undefined,
    },
    {
      name: "Syllabics",
      note: "Two glyphs per syllable, each a shape turned one of four ways",
      render: (ids) => ids.map((id) => syllabics_glyphs(id, phonology, syllabics)).join(""),
      style: { fontSize: size * 0.8, fontFamily: SYLLABICS_FONT },
    },
  ];
}

// A word in every script, for its popup
export function Writings({ ids, phonology }: { ids: number[]; phonology: Phonology }) {
  const renderers = script_renderers(phonology, stored_script_settings(), 26);
  return (
    <table className="text-xs">
      <tbody>
        {renderers.map((r) => (
          <tr key={r.name}>
            <td className="pr-2 py-0.5 text-gray-500 whitespace-nowrap align-middle">{r.name}</td>
            <td className="py-0.5 text-gray-900" style={r.style}>
              {r.render(ids)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
