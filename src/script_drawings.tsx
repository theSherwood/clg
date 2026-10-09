import React, { useEffect, useMemo, useRef, useState } from "react";
import { type Laid, type LayoutOptions, type Wire, from_wire, solve_layout, solved_extent } from "./circle_layouts";
import { type Solved, solve_circles } from "./circle_solver";
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
  solver: "relax" | "constraints" | "flow"; // how the circles are laid out: see circle_layout, circle_solver.ts and circle_flow.ts
  ring_sizing: "full" | "tight"; // with the constraint solver or flow: inner rings as big as they can be, or every ring as small
  clearance: number; // on circles, the room kept clear between words on different rings, as a fraction of the size
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
  solver: "flow",
  ring_sizing: "full",
  clearance: 0.15,
};

// Where a subclause's circle starts, crossing its parent's ring: a small open circle, drawn like
// the midline
function crossing_mark(x: number, y: number, size: number, style: LineStyle, key: string): React.ReactNode {
  return (
    <circle key={key} cx={x} cy={y} r={size * 0.15} fill="none" stroke={style.midline_color} strokeWidth={midline_width(size)} />
  );
}

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

// The radius of the discs a word's footprint on a circle is made of: as far as the tallest word in
// the text reaches from its line (with its stroke), and half the clearance kept between words
export function circle_footprint(rings: CircleItem[][], size: number, style: LineStyle): number {
  let reach = 0;
  const visit = (items: CircleItem[]) =>
    items.forEach((item) => {
      if ("clause" in item) visit(item.clause);
      if (!("geometry" in item)) return;
      for (const s of item.geometry.strokes) for (const [, y] of s.points) reach = Math.max(reach, Math.abs(y));
      for (const m of item.geometry.marks) reach = Math.max(reach, Math.abs(m.y) + m.r);
    });
  rings.forEach(visit);
  return Math.max(reach, size * 0.2) + Math.max(1.5, size / 16) / 2 + (style.clearance * size) / 2;
}

type CircleLayoutArgs = {
  tokens: ScriptToken[];
  phonology: Phonology;
  layout: MarkLayout;
  style: LineStyle;
  period: PeriodStyle;
  size: number;
  wrap: (word: Word, node: React.ReactElement) => React.ReactNode;
};

// What a circle layout starts from: the sentences as rings of items, and the solver's options
function circle_options({ tokens, phonology, layout, style, period, size }: CircleLayoutArgs): LayoutOptions {
  const rings = circle_sentences(
    tokens,
    (ids) => line_geometry(ids.map((id) => layout_values(id, phonology, layout)), size, style),
    size,
    style.subclauses === "circles",
    style.clause_words === "show",
  );
  return { rings, style, size, period_width: size * 0.3 * period.scale, footprint: circle_footprint(rings, size, style) };
}

// A laid out text drawn round (0, 0), with how far it all reaches
export function draw_circles(laid: Solved, { style, period, size, wrap }: CircleLayoutArgs) {
  const stroke = Math.max(1.5, size / 16);
  const step = size * 0.08; // straight lines are cut this fine so they bend with the ring
  const nodes: React.ReactNode[] = [];
  const crossings: React.ReactNode[] = []; // drawn last, over every ring
  laid.rings.forEach((ring, k) => {
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
    }
    if (ring.chain.length > 0) crossings.push(crossing_mark(...place(0, 0), size, style, `cross${k}`));
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
      } else if ("period" in item) {
        const [px, py] = place(centre, 0);
        nodes.push(
          <g key={key} transform={`translate(${px} ${py}) rotate(${turn(centre)})`}>
            {draw_mark(period.shape, 0, 0, Math.max(width / 2 - stroke, stroke))}
          </g>,
        );
      }
    });
  });
  return { nodes: [...nodes, ...crossings], extent: solved_extent(laid, style) };
}

// Laid out and drawn here and now, by the solver the style asks for, or another
function laid_out_now(args: CircleLayoutArgs, solver = args.style.solver) {
  const options = circle_options({ ...args, style: { ...args.style, solver } });
  if (options.rings.length === 0) return undefined;
  const laid = solve_layout(options);
  return { ...draw_circles(laid, args), rounds: laid.rounds, overlaps: laid.overlaps, solver: laid.solver };
}
export const circle_layout = (args: CircleLayoutArgs) => laid_out_now(args, "relax");
export const flow_layout = (args: CircleLayoutArgs) => laid_out_now(args, "flow");
// The constraint solver from the relaxation's layout, where it does better
export const best_layout = (args: CircleLayoutArgs) => laid_out_now(args, "constraints");
// The constraint solver on its own, from its own start
export function constraint_layout(args: CircleLayoutArgs) {
  const options = circle_options(args);
  if (options.rings.length === 0) return undefined;
  const laid = solve_circles(options);
  return { ...draw_circles(laid, args), rounds: laid.rounds, overlaps: laid.overlaps };
}

// Recent layouts, by what they were laid out from, so going back to a setting is instant
type Remembered = { options: LayoutOptions; period: PeriodStyle; laid: Laid };
const laid_cache = new Map<string, Remembered>();
const remember = (key: string, value: Remembered) => {
  laid_cache.delete(key);
  laid_cache.set(key, value);
  if (laid_cache.size > 24) laid_cache.delete(laid_cache.keys().next().value!);
};

// A layout worked out off the page's thread, in a worker of the component's own, so the page stays
// responsive however long it takes. Until it's ready, the last layout stays up. A change while the
// worker is busy stops it and starts afresh. Without workers, it's laid out here.
function useLaidOut(args: CircleLayoutArgs) {
  const { tokens, phonology, layout, style, period, size } = args;
  const key = JSON.stringify([tokens.map((t) => ("punctuation" in t ? t.punctuation : t.ids)), phonology, layout, style, period, size]);
  const [shown, set_shown] = useState<({ key: string } & Remembered) | null>(() => {
    const cached = laid_cache.get(key);
    return cached ? { key, ...cached } : null;
  });
  const worker = useRef<{ worker: Worker; busy: boolean } | null>(null);
  useEffect(
    () => () => {
      worker.current?.worker.terminate();
      worker.current = null;
    },
    [],
  );
  useEffect(() => {
    const cached = laid_cache.get(key);
    if (cached) return set_shown({ key, ...cached });
    const options = circle_options(args);
    const done = (laid: Laid) => {
      remember(key, { options, period, laid });
      set_shown({ key, options, period, laid });
    };
    if (options.rings.length === 0) return set_shown(null);
    if (typeof Worker === "undefined") return done(solve_layout(options));
    if (worker.current?.busy) {
      worker.current.worker.terminate();
      worker.current = null;
    }
    if (!worker.current) worker.current = { worker: new Worker("/circle_worker.js", { type: "module" }), busy: false };
    const current = worker.current;
    current.busy = true;
    current.worker.onmessage = (event: MessageEvent<{ laid: Wire }>) => {
      current.busy = false;
      done(from_wire(event.data.laid, options.rings));
    };
    // If the worker can't run, lay it out here after all
    current.worker.onerror = (event) => {
      event.preventDefault();
      current.busy = false;
      done(solve_layout(options));
    };
    current.worker.postMessage({ id: 0, options: { ...options, rings: without_words(options.rings) } });
  }, [key]);
  return { shown, pending: shown?.key !== key };
}

// Rings as sent to a worker: words stay behind, since only their shapes matter to the layout
const without_words = (rings: CircleItem[][]): CircleItem[][] =>
  rings.map((items) =>
    items.map((item) =>
      "geometry" in item ? { geometry: item.geometry } : "clause" in item ? { clause: without_words([item.clause])[0]! } : item,
    ),
  );

export function LineCircles(args: CircleLayoutArgs) {
  const { shown, pending } = useLaidOut(args);
  // Drawn as it was laid out, which may be a setting or two behind while the next is worked out,
  // and only again once there's a new layout
  const drawn = useMemo(
    () => shown && draw_circles(shown.laid, { ...args, style: shown.options.style, size: shown.options.size, period: shown.period }),
    [shown],
  );
  if (!shown || !drawn) return pending ? <div className="text-xs text-gray-400">Laying out…</div> : null;
  const { style, size } = shown.options;
  const centre = drawn.extent + size * 0.3;
  const side = 2 * centre;
  return (
    <svg
      width={side}
      height={side}
      viewBox={`0 0 ${side} ${side}`}
      className={`block transition-opacity ${pending ? "opacity-40" : ""}`}
      {...svg_props(size, style)}
    >
      <g transform={`translate(${centre} ${centre})`}>{drawn.nodes}</g>
    </svg>
  );
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
// round circles); wrap makes a word hoverable. settings: what the script's drawing depends on, so
// text in it is drawn again only when they change.
export type ScriptRenderer = {
  name: string;
  settings: string;
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
      settings: JSON.stringify([phonology, stems, size]),
      note: "A stem per syllable, with a rung for each mark",
      render: (ids) => <Stems rows={ids.map((id) => layout_values(id, phonology, stems))} size={size} />,
    },
    {
      name: "Cursive stems",
      settings: JSON.stringify([phonology, stems, size]),
      note: "The same stems joined into one stroke per word; rungs joined by U-turns between their outer ends",
      render: (ids) => <CursiveStems rows={ids.map((id) => layout_values(id, phonology, stems))} size={size} />,
    },
    {
      name: "Line",
      settings: JSON.stringify([phonology, line, line_style, period, size, in_text]),
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
      settings: JSON.stringify([phonology, syllabics, period, size]),
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
