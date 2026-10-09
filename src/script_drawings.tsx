import React, { useEffect, useMemo, useRef, useState } from "react";
import { type Laid, type LayoutOptions, type Wire, from_wire, solve_layout, solved_extent } from "./circle_layouts";
import { type Solved, solve_circles } from "./circle_solver";
import { type Rung, type Side, type Step, type StemRouting, best_route, default_stem_routing, reaches } from "./stem_routes";
import { T, type Word } from "./dict";
import { type Phonology } from "./phonology";
import {
  type MarkLayout,
  type SyllabicsSettings,
  default_stave,
  default_stems,
  default_gates,
  fret_path,
  gate_lines,
  type GridLine,
  type GridPoint,
  meander_lines,
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

// The stem script's modes: each syllable a stem of its own, or a word's stems joined into one stroke
export const STEM_JOINS = ["separate", "cursive"] as const;
// With cursive stems: curve, how far their joins and U-turns are rounded, from 0 (square) to 1;
// routing, how a syllable's rungs are joined into strokes (see stem_routes.ts); and width, how
// wide each syllable's glyph is: as tight as its turns allow; the same either side of its stem; or
// the same for every syllable (fixed: two units each, with a unit between words). Balanced and
// fixed glyphs fill out their width: see route_points.
export const STEM_WIDTHS = ["tight", "balanced", "fixed"] as const;
// form: in running text, cursive stems drawn with a pen (as everywhere else), or as blocks: a
// calligraphic form on a grid of pitches, heavy strokes and slits of white between them (see
// StemBlocks), at a scale of its own. block_weight: the stroke, as a fraction of the pitch;
// block_reach: a rung's length, in pitches; block_joins: whether a word's stems are joined into one
// stroke or each syllable stands apart; block_pitch: the pitch, in pixels.
export const STEM_FORMS = ["pen", "block"] as const;
export const BLOCK_JOINS = ["joined", "apart"] as const;
export type StemsStyle = {
  join: (typeof STEM_JOINS)[number];
  curve: number;
  width: (typeof STEM_WIDTHS)[number];
  form: (typeof STEM_FORMS)[number];
  block_weight: number;
  block_reach: number;
  block_joins: (typeof BLOCK_JOINS)[number];
  block_pitch: number;
} & StemRouting;
export const default_stems_style: StemsStyle = {
  join: "cursive",
  curve: 1,
  width: "tight",
  form: "pen",
  block_weight: 0.8,
  block_reach: 1,
  block_joins: "joined",
  block_pitch: 8,
  ...default_stem_routing,
};

// A word in the stem script, in whichever mode the style asks for
export function StemsWord({ rows, size, style }: { rows: number[][]; size: number; style: StemsStyle }) {
  return style.join === "cursive" ? <CursiveStems rows={rows} size={size} curve={style.curve} routing={style} width={style.width} /> : <Stems rows={rows} size={size} />;
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

// The stave script: each syllable is four marks along a midline, left to right, each a dash or a
// loop, above or below it. Every position is the same width. How the marks join, and whether the
// midline is straight or a circle, are settings (StaveStyle, below).
const STAVE_SLOT = 0.32;

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
export const STAVE_JOINS = ["cursive", "angular", "dashes", "separate"] as const;
export type StaveJoin = (typeof STAVE_JOINS)[number];
export const LOOP_MARKS = ["circle", "diamond", "square", "tick"] as const;
export type LoopMark = (typeof LOOP_MARKS)[number];

export type StaveStyle = {
  join: StaveJoin;
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
  crossing_shape: CrossingShape; // with subclause circles, the mark where each starts, crossing its parent
  crossing_scale: number; // and its size, 1 being the usual
  form: "line" | "meander"; // the stave along a line, or as a meander of five bars a syllable (see meander_lines)
  meander_weight: number; // the meander's strokes, as a share of the pitch between bars
};
export const CROSSING_SHAPES = ["circle", "square", "diamond"] as const;
export type CrossingShape = (typeof CROSSING_SHAPES)[number];
export const default_stave_style: StaveStyle = {
  join: "cursive",
  curves: true,
  loop_mark: "circle",
  midline: false,
  midline_color: "#4b5563",
  midline_shape: "straight",
  grow: "in",
  spacing: "condensed",
  period_position: "top",
  subclauses: "inline",
  clause_words: "hide",
  solver: "flow",
  ring_sizing: "full",
  clearance: 0.6,
  crossing_shape: "circle",
  crossing_scale: 1,
  form: "line",
  meander_weight: 0.6,
};

// Where a subclause's circle starts, crossing its parent's ring: a small open mark, drawn like the
// midline and turned with the rings, so a square's sides run along them both
function crossing_mark(x: number, y: number, turn: number, size: number, style: StaveStyle, key: string): React.ReactNode {
  return (
    <g
      key={key}
      transform={`translate(${x} ${y}) rotate(${turn})`}
      stroke={style.midline_color}
      strokeWidth={midline_width(size)}
      strokeLinejoin="miter"
    >
      {draw_mark(style.crossing_shape, 0, 0, size * 0.15 * style.crossing_scale)}
    </g>
  );
}

// The midline is ruled like lined paper: thinner than the writing, in its own colour
export function midline_width(size: number): number {
  return Math.max(1, size / 24);
}

// A word in the stave script as geometry: x is how far along the midline from the word's start,
// and y how far below the midline (negative is above). The strokes are what the pen draws, smooth
// (a spline through the points) or straight from point to point, and the marks are loops drawn as
// a circle, diamond, square or tick. Drawing a word straight or round a circle is then only a
// matter of where each point goes.
type Stroke = { points: Point[]; smooth: boolean };
type Mark = { shape: LoopMark; x: number; y: number; r: number };
export type StaveGeometry = { strokes: Stroke[]; marks: Mark[]; width: number };

const STAVE_LEVEL = 0.2; // how far above or below the midline the marks run
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
function cursive_geometry(marks: number[][], size: number, curves: boolean): StaveGeometry {
  const slot = size * STAVE_SLOT;
  const level = size * STAVE_LEVEL;
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
  // A loop that starts or ends the stroke starts or ends where the stroke crosses itself, half way
  // across the loop, so nothing sticks out past it: on its way out for the first, on its way in for
  // the last
  const across = (from: Point, to: Point, x: number): Point => {
    const t = (x - from[0]) / (to[0] - from[0]);
    return [x, from[1] + (to[1] - from[1]) * t];
  };
  const middle = (k: number) => k * slot + slot / 2;
  if (flat[0]! & 2) points[0] = across(points[3]!, points[4]!, middle(0));
  if (flat.at(-1)! & 2) points[points.length - 1] = across(points.at(-5)!, points.at(-4)!, middle(flat.length - 1));
  return { strokes: [{ points, smooth: curves }], marks: [], width: flat.length * slot };
}

// Separate marks above or below the line, with a gap between syllables (a separate mark can't run
// into the next, so a gap can't be taken for one). With join_dashes, neighbouring dashes on one
// side within a syllable are one line.
function separate_geometry(marks: number[][], size: number, loop: LoopMark, join_dashes: boolean): StaveGeometry {
  const slot = size * STAVE_SLOT;
  const gap = size * SYLLABLE_GAP;
  const level = size * STAVE_LEVEL;
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
function angular_geometry(marks: number[][], size: number, loop: LoopMark): StaveGeometry {
  const slot = size * STAVE_SLOT;
  const level = size * STAVE_LEVEL;
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

export function stave_geometry(marks: number[][], size: number, style: StaveStyle): StaveGeometry {
  if (style.join === "cursive") return cursive_geometry(marks, size, style.curves);
  if (style.join === "angular") return angular_geometry(marks, size, style.loop_mark);
  return separate_geometry(marks, size, style.loop_mark, style.join === "dashes");
}

const polyline = (points: Point[]) => `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")}`;

function svg_props(size: number, style: StaveStyle) {
  return {
    stroke: "currentColor",
    strokeWidth: Math.max(1.5, size / 16),
    strokeLinecap: "round" as const,
    strokeLinejoin: style.join === "angular" ? ("miter" as const) : ("round" as const),
    fill: "none",
  };
}

export function Stave({ marks, size, style = default_stave_style }: { marks: number[][]; size: number; style?: StaveStyle }) {
  const stroke = Math.max(1.5, size / 16);
  const geometry = stave_geometry(marks, size, style);
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

// The stave script round circles: each sentence is a ring, read clockwise, with the marks above the
// line outside it and those below inside. A sentence ends at the top, so the periods line up,
// unless a condensed sentence puts its period right after it instead. Rings are a line apart, and
// all are as big as the longest sentence for its place needs, so the writing stays one size. With
// even spacing a sentence shorter than its ring has its gaps widened until it closes the circle;
// condensed, it keeps its gaps, and either starts just after its period at the top, leaving the
// room to spare before the period, or starts at the top with its period right after it. The first
// sentence is the outer ring when growing in, and the inner one when growing out.
export type CircleItem =
  | { geometry: StaveGeometry; word?: Word }
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
  geometry: (ids: number[]) => StaveGeometry,
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
export function circle_footprint(rings: CircleItem[][], size: number, style: StaveStyle): number {
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
  style: StaveStyle;
  period: PeriodStyle;
  size: number;
  wrap: (word: Word, node: React.ReactElement) => React.ReactNode;
};

// What a circle layout starts from: the sentences as rings of items, and the solver's options
function circle_options({ tokens, phonology, layout, style, period, size }: CircleLayoutArgs): LayoutOptions {
  const rings = circle_sentences(
    tokens,
    (ids) => stave_geometry(ids.map((id) => layout_values(id, phonology, layout)), size, style),
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
    if (ring.chain.length > 0) crossings.push(crossing_mark(...place(0, 0), turn(0), size, style, `cross${k}`));
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

export function StaveCircles(args: CircleLayoutArgs) {
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
// How far a route's turns reach out on each side, in levels beyond the first
function route_extra(strokes: Step[][]): { left: number; right: number } {
  const steps = strokes.flat();
  const deepest = (side: number) => Math.max(1, ...steps.filter((s) => s.from === side && s.depth).map((s) => s.depth!)) - 1;
  return { left: deepest(-1), right: deepest(1) };
}

// The most any syllable's turns reach out on a side under some routing, in levels beyond the
// first: over every set of rung states, as any mapping without look-alikes uses them all
const widest = new Map<string, number>();
function widest_extra(routing: StemRouting): number {
  const key = `${routing.turns}|${routing.direction}|${routing.prefer}`;
  if (!widest.has(key)) {
    let most = 0;
    for (let n = 0; n < 256; n++) {
      const extra = route_extra(best_route([n & 3, (n >> 2) & 3, (n >> 4) & 3, (n >> 6) & 3], routing).strokes);
      most = Math.max(most, extra.left, extra.right);
    }
    widest.set(key, most);
  }
  return widest.get(key)!;
}

// How far a syllable's glyph reaches out either side of its usual column, by the width setting,
// and how deep each side is filled out to (none when tight)
function glyph_extra(strokes: Step[][], style: Pick<StemsStyle, "width"> & StemRouting) {
  const own = route_extra(strokes);
  if (style.width !== "balanced" && style.width !== "fixed") return { ...own, fill: 0 };
  const both = style.width === "fixed" ? widest_extra(style) : Math.max(own.left, own.right);
  const deepest = Math.max(0, ...strokes.flat().map((s) => s.depth ?? 0));
  return { left: both, right: both, fill: style.width === "fixed" ? both + 1 : deepest };
}

// A cursive stem glyph's width when every one is the same (fixed), two units of the grid a fixed
// text is set on, a space between words being one
export function fixed_glyph_width(size: number, style: StemsStyle): number {
  const { column, level } = stem_measures(size);
  return column + 2 * widest_extra(style) * level;
}

// A route's strokes as lines of horizontal and vertical runs, for rounding. Each U-turn reaches out
// past the rungs' ends by a bulge, and a level further for each depth it's nested or crossed at.
// With fill, each side of the glyph is filled out to that depth: a turn with none further out on
// its side moves out to it, and a free rung end (a nub) that no turn wraps round reaches out as
// far; what's inside another turn stays put, so nothing runs into it.
function route_points(
  rungs: Rung[],
  strokes: Step[][],
  x: number,
  top: number,
  { row_height, reach, bulge, level }: { row_height: number; reach: number; bulge: number; level: number },
  fill = 0,
): Point[][] {
  const y = (r: number) => top + (rungs[r]!.row + 0.5) * row_height;
  const out_to = (depth: number) => reach + bulge + (depth - 1) * level; // how far out a turn at a depth is
  // Every turn, with the rows it spans and how deep it is
  const turns = strokes.flatMap((steps) =>
    steps.slice(1).map((step, i) => {
      const [a, b] = [rungs[steps[i]!.rung]!.row, rungs[step.rung]!.row];
      return { step, side: step.from, lo: Math.min(a, b), hi: Math.max(a, b), depth: step.depth ?? 1 };
    }),
  );
  const outermost = (t: (typeof turns)[number]) =>
    !turns.some((u) => u !== t && u.side === t.side && u.lo < t.hi && t.lo < u.hi && u.depth > t.depth);
  const wrapped = (side: number, row: number) => turns.some((t) => t.side === side && t.lo < row && row < t.hi);
  const depth_of = new Map(turns.map((t) => [t.step, fill > 0 && outermost(t) ? Math.max(t.depth, fill) : t.depth]));
  // A rung's end on a side (or at the stem, for 0); a free one reaching out to the fill
  const end = (side: number, row: number, free: boolean) =>
    x + side * (free && side !== 0 && fill > 0 && !wrapped(side, row) ? out_to(fill) : reach);
  return strokes.map((steps) =>
    steps.flatMap((step, i): Point[] => {
      const { rung, from, to } = step;
      const row = rungs[rung]!.row;
      // The first rung starts where the pen comes in; each after it starts with the U-turn from
      // the rung before, out past both their ends and back in
      const out = x + from * out_to(depth_of.get(step) ?? 1);
      const lead: Point[] =
        i === 0
          ? [[end(from, row, true), y(rung)]]
          : [
              [out, y(steps[i - 1]!.rung)],
              [out, y(rung)],
            ];
      return [...lead, [end(to, row, i === steps.length - 1), y(rung)]];
    }),
  );
}

// The sizes cursive stems are drawn at
function stem_measures(size: number) {
  const column = size * 0.72;
  const height = size * 1.2;
  const pad = size * 0.14; // room for the joins between stems
  const reach = column * 0.32;
  const stroke = Math.max(1.5, size / 16);
  // A U-turn reaches a bulge past the rungs' ends, and a level further for each depth
  return { column, height, pad, row_height: (height - 2 * pad) / 4, reach, stroke, bulge: reach * 0.26, level: stroke * 2.2 };
}

const ROUTE_COLOURS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea"];

// One syllable in cursive stems drawn by a given route, for exploring routes: each stroke in a
// colour of its own, numbered in the order it's written at the point it starts, with an arrowhead
// where it ends. The stem, part of the word's own stroke, is grey.
export function StemRoute({ rungs, strokes, size, curve }: { rungs: Rung[]; strokes: Step[][]; size: number; curve: number }) {
  const measures = stem_measures(size);
  const { column, height, pad, reach, stroke, level } = measures;
  // Room for the turns, however deep, and a start mark at either end
  const extra = route_extra(strokes);
  const width = column * 1.5 + 2 * Math.max(extra.left, extra.right) * level;
  const x = width / 2;
  const lines = route_points(rungs, strokes, x, pad, measures);
  const dot = size * 0.075;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" fill="none" strokeWidth={stroke}>
      <line x1={x} y1={pad} x2={x} y2={height - pad} stroke="#d1d5db" strokeLinecap="round" />
      {lines.map((points, i) => {
        const colour = ROUTE_COLOURS[i % ROUTE_COLOURS.length];
        const [ex, ey] = points.at(-1)!;
        const [px, py] = points.at(-2)!;
        const angle = Math.atan2(ey - py, ex - px);
        const head = size * 0.07;
        const barb = (turn: number): Point => [ex - head * Math.cos(angle + turn), ey - head * Math.sin(angle + turn)];
        return (
          <g key={i} stroke={colour}>
            <path d={rounded_path(points, curve, { horizontal: measures.bulge, vertical: Infinity })} strokeLinecap="round" strokeLinejoin="round" />
            <path d={polyline([barb(0.6), [ex, ey], barb(-0.6)])} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={points[0]![0]} cy={points[0]![1]} r={dot} fill={colour} stroke="none" />
            <text
              x={points[0]![0]}
              y={points[0]![1]}
              fill="white"
              stroke="none"
              fontSize={dot * 1.5}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// A line of horizontal and vertical runs with its corners rounded: each corner is cut back along
// both its runs, by curve (0 to 1) times as far as each allows, and the two cuts joined by a curve
// through the corner. A run may give up to its axis's most, and no more than half of itself where
// it has a corner at each end.
function rounded_path(points: Point[], curve: number, most: { horizontal: number; vertical: number }): string {
  const turns = points.filter((p, i) => {
    if (i === 0 || i === points.length - 1) return true;
    const [a, b] = [points[i - 1]!, points[i + 1]!];
    return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
  });
  if (curve <= 0 || turns.length < 3) return polyline(turns);
  const allowed = (a: Point, b: Point, shared: boolean) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return Math.min(a[1] === b[1] ? most.horizontal : most.vertical, shared ? length / 2 : length);
  };
  const toward = (from: Point, to: Point, by: number): Point => {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    return [from[0] + ((to[0] - from[0]) * by) / length, from[1] + ((to[1] - from[1]) * by) / length];
  };
  let d = `M ${turns[0]![0]} ${turns[0]![1]}`;
  for (let i = 1; i < turns.length - 1; i++) {
    const [a, c, b] = [turns[i - 1]!, turns[i]!, turns[i + 1]!];
    const into = toward(c, a, curve * allowed(a, c, i > 1));
    const out = toward(c, b, curve * allowed(c, b, i < turns.length - 2));
    d += ` L ${into[0]} ${into[1]} Q ${c[0]} ${c[1]} ${out[0]} ${out[1]}`;
  }
  const last = turns.at(-1)!;
  return `${d} L ${last[0]} ${last[1]}`;
}

export function CursiveStems({
  rows,
  size,
  curve = 1,
  routing = default_stem_routing,
  width = "tight",
}: {
  rows: number[][];
  size: number;
  curve?: number;
  routing?: StemRouting;
  width?: StemsStyle["width"];
}) {
  const measures = stem_measures(size);
  const { column, height, pad, stroke, bulge, level } = measures;
  // Each syllable's column, widened on either side by however deep its turns go there
  const routes = rows.map((states) => best_route(states, routing));
  const extras = routes.map((route) => glyph_extra(route.strokes, { ...routing, width }));
  const starts = extras.map((_, i) => extras.slice(0, i).reduce((n, e) => n + column + (e.left + e.right) * level, 0));
  const total = starts.at(-1)! + column + (extras.at(-1)!.left + extras.at(-1)!.right) * level;
  const middle = (i: number) => starts[i]! + extras[i]!.left * level + column / 2;
  // Down the first stem, then under or over to the next and along it, and so on; each join runs
  // a little past the stems' ends
  const dip = pad * 0.65;
  const [top, bottom] = [pad, height - pad];
  const stems: Point[] = [[middle(0), top]];
  rows.forEach((_, i) => {
    if (i === 0) return;
    const edge = (i - 1) % 2 === 0 ? bottom + dip : top - dip;
    stems.push([middle(i - 1), edge], [middle(i), edge]);
  });
  stems.push([middle(rows.length - 1), (rows.length - 1) % 2 === 0 ? bottom : top]);
  return (
    <svg
      width={total}
      height={height}
      viewBox={`0 0 ${total} ${height}`}
      className="inline-block align-middle"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin={curve > 0 ? "round" : "miter"}
      fill="none"
    >
      <path d={rounded_path(stems, curve, { horizontal: column / 2, vertical: dip })} />
      {routes.flatMap(({ rungs, strokes }, i) =>
        route_points(rungs, strokes, middle(i), pad, measures, extras[i]!.fill).map((points, j) => (
          <path key={`${i}-${j}`} d={rounded_path(points, curve, { horizontal: bulge, vertical: Infinity })} />
        )),
      )}
    </svg>
  );
}

// Cursive stems as blocks, a calligraphic form after Genji-kō patterns: everything on a grid of
// pitches, so rows are a pitch apart, each turn level a pitch further out than the last, and the
// joins between stems a pitch above or below the rows; with strokes heavy enough (block_weight) that
// what's left between them is slits of white. Routes, curve and widths work as they do for the pen.
// A word's syllables are a pitch apart (their outermost lines, that is), joined or not, so only a
// slit of white parts them; words are two more.
function block_measures(style: StemsStyle) {
  const p = style.block_pitch;
  const w = style.block_weight * p;
  const joined = style.block_joins === "joined";
  const syllable_gap = 1;
  // Rows 0 to 3, with a pitch above and below for the joins, and half a stroke beyond that
  const top = p + w / 2;
  return { p, w, joined, syllable_gap, word_gap: syllable_gap + 2, top, height: 5 * p + w };
}

function StemBlockWord({ rows, style }: { rows: number[][]; style: StemsStyle }) {
  const { p, w, joined, syllable_gap, top, height } = block_measures(style);
  const R = style.block_reach;
  const routes = rows.map((states) => best_route(states, style));
  const widest = widest_extra(style) + 1;
  // Each glyph's reach either side of its stem, in pitches, and how far its sides are filled out
  const glyphs = routes.map(({ rungs, strokes }) => {
    const deepest = (side: number) => Math.max(0, ...strokes.flat().filter((s) => s.from === side && s.depth).map((s) => s.depth!));
    const own = (side: Side) => (deepest(side) > 0 ? R + deepest(side) : rungs.some((r) => reaches(r, side)) ? R : 0);
    if (style.width === "fixed") return { left: R + widest, right: R + widest, fill: widest };
    if (style.width === "balanced") {
      const both = Math.max(own(-1), own(1));
      return { left: both, right: both, fill: Math.max(deepest(-1), deepest(1)) };
    }
    return { left: own(-1), right: own(1), fill: 0 };
  });
  const centres: number[] = [];
  glyphs.forEach((g, i) => centres.push(i === 0 ? g.left : centres[i - 1]! + glyphs[i - 1]!.right + syllable_gap + g.left));
  const last = glyphs.length - 1;
  const width = (centres[last]! + glyphs[last]!.right) * p + w;
  const x = (c: number) => c * p + w / 2;
  const y = (row: number) => top + row * p;
  // The stems: one stroke for the word, down, a pitch under, up, a pitch over, and so on; or apart
  const stems: Point[][] = joined
    ? [
        [
          [x(centres[0]!), y(0)],
          ...centres.slice(1).flatMap((c, i): Point[] => {
            const edge = i % 2 === 0 ? y(4) : y(-1);
            return [
              [x(centres[i]!), edge],
              [x(c), edge],
            ];
          }),
          [x(centres[last]!), last % 2 === 0 ? y(3) : y(0)],
        ],
      ]
    : centres.map((c): Point[] => [
        [x(c), y(0)],
        [x(c), y(3)],
      ]);
  const measures = { row_height: p, reach: R * p, bulge: p, level: p };
  const square = style.curve === 0;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap={square ? "square" : "round"}
      strokeLinejoin={square ? "miter" : "round"}
    >
      {stems.map((points, i) => (
        <path key={`s${i}`} d={rounded_path(points, style.curve, { horizontal: p, vertical: p })} />
      ))}
      {routes.flatMap(({ rungs, strokes }, i) =>
        route_points(rungs, strokes, x(centres[i]!), top - p / 2, measures, glyphs[i]!.fill).map((points, j) => (
          <path key={`${i}-${j}`} d={rounded_path(points, style.curve, { horizontal: p, vertical: Infinity })} />
        )),
      )}
    </svg>
  );
}

// A whole text in stem blocks, word by word, wrapping like text; a period a block of its own
export function StemBlocks({
  tokens,
  phonology,
  layout,
  style,
  period,
  wrap,
}: {
  tokens: ScriptToken[];
  phonology: Phonology;
  layout: MarkLayout;
  style: StemsStyle;
  period: PeriodStyle;
  wrap: (word: Word, node: React.ReactElement) => React.ReactNode;
}) {
  const { p, w, syllable_gap, word_gap, top, height } = block_measures(style);
  const r = (p / 2) * period.scale;
  return (
    <div className="flex flex-wrap items-start" style={{ columnGap: word_gap * p, rowGap: 1.5 * p }}>
      {tokens.map((t, i) => {
        if ("punctuation" in t) {
          if (t.punctuation !== ".") return null;
          const side = 2 * r + w;
          return (
            <svg
              key={i}
              width={side}
              height={height}
              viewBox={`0 0 ${side} ${height}`}
              className="block"
              style={{ marginLeft: (syllable_gap - word_gap) * p }}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={w}
            >
              {draw_mark(period.shape, side / 2, top + 1.5 * p, Math.max(r, w / 2))}
            </svg>
          );
        }
        if (!t.ids)
          return (
            <span key={i} className="text-red-500 text-sm" title="No root yet">
              {t.text}?
            </span>
          );
        const word = <StemBlockWord rows={t.ids.map((id) => layout_values(id, phonology, layout))} style={style} />;
        return t.word ? <React.Fragment key={i}>{wrap(t.word, <span className="cursor-default">{word}</span>)}</React.Fragment> : <React.Fragment key={i}>{word}</React.Fragment>;
      })}
    </div>
  );
}

// Gates' style: weight, the strokes as a share of the pitch between bars; form, the gates as bars
// and bridges, or as a fret in one stroke (see fret_path); spacing, for the fret, close or on a
// grid (see bar_spacing). Bars are always on the grid: open gates leave a syllable's ends open, so
// only the room between squares tells syllables apart. joins: the fret's syllables joined along
// their tops, so a word is one stroke, or apart.
export const GATES_FORMS = ["bars", "fret"] as const;
export const GATES_SPACINGS = ["close", "grid"] as const;
export const GATES_JOINS = ["joined", "apart"] as const;
export type GatesStyle = {
  weight: number;
  form: (typeof GATES_FORMS)[number];
  spacing: (typeof GATES_SPACINGS)[number];
  joins: (typeof GATES_JOINS)[number];
};
export const default_gates_style: GatesStyle = { weight: 0.6, form: "bars", spacing: "close", joins: "joined" };

// A word in a script of square syllables on a grid of pitches (gates, as bars or a fret, or the
// stave as a meander): each syllable span pitches square, drawn by strokes_of as lines through
// points of the grid; a syllable's square stands a little further from the next than its strokes
// do from each other, so a word's syllables are told apart
const BAR_APART = 2; // pitches from one syllable's last bar to the next one's first
const BARS = 4; // five bars, four pitches across
const FRET = 6; // a 7×7 grid of points
const bar_measures = (size: number, weight: number, span: number) => {
  const pitch = (size * 0.8) / (span + weight);
  return { pitch, w: weight * pitch };
};

// How these scripts are spaced. On a grid, a word's syllables are BAR_APART pitches apart, and the
// text is set on a grid of units of half a syllable and the pitches to the next (three pitches for
// bars, four for the fret): a syllable takes two units, a space between words one, and a period or
// other punctuation one, so the words in every row start on the grid; rows are two units apart, as
// far as a word's syllables, so the syllables sit on a grid of squares down the page as well as
// across it. Close, a word's syllables are a pitch apart, as much white between them as between
// two strokes, and words and rows are a stroke apart, as if one stroke were left out; a period takes
// its own width and a stroke's room more. Close with the fret's syllables joined, so the joins tell
// words apart, everything is a pitch apart, syllables, words and rows alike, and a period or other
// punctuation takes a syllable's square of its own. A word's drawing reaches half a stroke past its
// outer points, so the spaces are a stroke short of their pitches.
export function bar_apart(spacing: GatesStyle["spacing"]) {
  return spacing === "grid" ? BAR_APART : 1;
}
export function bar_spacing(
  size: number,
  weight: number,
  span = BARS,
  spacing: GatesStyle["spacing"] = "grid",
  period = default_period,
  joined = false,
): Spacing {
  const { pitch, w } = bar_measures(size, weight, span);
  const glyph = span * pitch + w;
  if (spacing === "close" && joined) return { gap: pitch - w, cell: glyph, glyph, row: pitch - w, slot: true };
  if (spacing === "close") {
    const gap = 2 * pitch - w;
    return { gap, cell: size * 0.3 * period.scale + gap, glyph, row: gap };
  }
  const unit = (span + BAR_APART) / 2;
  return { gap: (BAR_APART + unit) * pitch - w, cell: unit * pitch, glyph, row: BAR_APART * pitch - w };
}

const as_strokes = (lines: GridLine[]): GridPoint[][] => lines.map(([x1, y1, x2, y2]) => [[x1, y1], [x2, y2]]);
const gates_strokes = (marks: number[]) => as_strokes(gate_lines(marks));
const meander_strokes = (marks: number[]) => as_strokes(meander_lines(marks));
const fret_strokes = (marks: number[]) => [fret_path(marks)];

function BarWord({
  rows,
  size,
  weight,
  span = BARS,
  apart = BAR_APART,
  strokes_of,
  joined = false,
}: {
  rows: number[][];
  size: number;
  weight: number;
  span?: number;
  apart?: number; // pitches from one syllable's last stroke to the next one's first
  strokes_of: (marks: number[]) => GridPoint[][];
  joined?: boolean; // each syllable's strokes run on from the last's, so a word is one stroke
}) {
  const { pitch, w } = bar_measures(size, weight, span);
  const strokes = rows.flatMap((marks, i) => strokes_of(marks).map((points) => points.map(([x, y]): GridPoint => [i * (span + apart) + x, y])));
  const drawn = joined ? [strokes.flat()] : strokes;
  const width = (rows.length * span + (rows.length - 1) * apart) * pitch + w;
  const height = span * pitch + w;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      {drawn.map((points, i) => (
        <polyline key={i} points={points.map(([x, y]) => `${x * pitch + w / 2},${y * pitch + w / 2}`).join(" ")} />
      ))}
    </svg>
  );
}

// A word in the stave, along its line or as a meander, as the style asks
export function StaveWord({ marks, size, style }: { marks: number[][]; size: number; style: StaveStyle }) {
  return style.form === "meander" ? (
    <BarWord rows={marks} size={size} weight={style.meander_weight} strokes_of={meander_strokes} />
  ) : (
    <Stave marks={marks} size={size} style={style} />
  );
}

export const gates_span = (style: GatesStyle) => (style.form === "fret" ? FRET : BARS);
const gates_spacing = (style: GatesStyle) => (style.form === "fret" ? style.spacing : "grid");
const gates_joined = (style: GatesStyle) => style.form === "fret" && style.joins === "joined";

// The fret's period: a small square ring of strokes in the middle of a syllable's square, on the
// same grid of points, so it reads as a stop, mostly white, among the full squares
export function FretPeriod({ size, weight }: { size: number; weight: number }) {
  const { pitch, w } = bar_measures(size, weight, FRET);
  const side = FRET * pitch + w;
  const at = (v: number) => v * pitch + w / 2;
  return (
    <svg width={side} height={side} viewBox={`0 0 ${side} ${side}`} className="block" fill="none" stroke="currentColor" strokeWidth={w} strokeLinejoin="miter">
      <rect x={at(2)} y={at(2)} width={2 * pitch} height={2 * pitch} />
    </svg>
  );
}

export function Gates({ rows, size, style }: { rows: number[][]; size: number; style: GatesStyle }) {
  const fret = style.form === "fret";
  return (
    <BarWord
      rows={rows}
      size={size}
      weight={style.weight}
      span={gates_span(style)}
      apart={bar_apart(gates_spacing(style))}
      strokes_of={fret ? fret_strokes : gates_strokes}
      joined={gates_joined(style)}
    />
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
  stems_style: StemsStyle;
  gates: MarkLayout;
  gates_style: GatesStyle;
  stave: MarkLayout;
  stave_style: StaveStyle;
  syllabics: SyllabicsSettings;
  period: PeriodStyle;
};

export const SCRIPT_KEYS = {
  stems: "script_stems",
  stems_style: "script_stems_style",
  gates: "script_gates",
  gates_style: "script_gates_style",
  stave: "script_line",
  stave_style: "script_line_style",
  period: "script_period",
  syllabics: "script_syllabics",
} as const;

export function stored_script_settings(): ScriptSettings {
  return {
    stems: load(SCRIPT_KEYS.stems, default_stems),
    stems_style: load(SCRIPT_KEYS.stems_style, default_stems_style),
    gates: load(SCRIPT_KEYS.gates, default_gates),
    gates_style: load(SCRIPT_KEYS.gates_style, default_gates_style),
    stave: load(SCRIPT_KEYS.stave, default_stave),
    stave_style: load(SCRIPT_KEYS.stave_style, default_stave_style),
    period: load(SCRIPT_KEYS.period, default_period),
    syllabics: load(SCRIPT_KEYS.syllabics, default_syllabics),
  };
}

// rule: in running text, a midline ruled across the whole text, under every row of words.
// whole_text: a script that lays out a whole text itself rather than word by word (the stave script
// round circles); wrap makes a word hoverable. settings: what the script's drawing depends on, so
// text in it is drawn again only when they change.
export type ScriptRenderer = {
  name: string;
  settings: string;
  note: string;
  render: (ids: number[]) => React.ReactNode;
  style?: React.CSSProperties;
  rule?: { color: string; size: number };
  spacing?: Spacing;
  whole_text?: (tokens: ScriptToken[], wrap: (word: Word, node: React.ReactElement) => React.ReactNode) => React.ReactNode;
};

// A script's own spacing in running text, in pixels: the space between words, the cell a period or
// other punctuation takes in place of the space before it, a one-syllable word's width (which a
// word with no root yet takes, as a ?), and the space between rows, if not the usual. Set on a
// grid, every word starts on it.
// slot: punctuation takes a cell of its own, spaced like a word, rather than the space before it.
// period: the script's own period, if not the usual.
export type Spacing = { gap: number; cell: number; glyph: number; row?: number; slot?: boolean; period?: React.ReactNode };

// Each script, as a way to write a word's root IDs
// In running text (in_text), the stave script's midline is ruled across the text rather than drawn
// under each word, so it doesn't break between words
export function script_renderers(
  phonology: Phonology,
  settings: ScriptSettings,
  size: number,
  in_text = false,
): ScriptRenderer[] {
  const { stems, stems_style, gates, gates_style, stave, stave_style, syllabics, period } = settings;
  const meander = stave_style.form === "meander";
  const circles = in_text && !meander && stave_style.midline_shape === "circle";
  return [
    {
      name: "Stems",
      settings: JSON.stringify([phonology, stems, stems_style, size]),
      note:
        stems_style.join === "cursive"
          ? "A stem per syllable, with a rung for each mark; a word's stems joined into one stroke, its rungs by U-turns between their outer ends"
          : "A stem per syllable, with a rung for each mark",
      render: (ids) => <StemsWord rows={ids.map((id) => layout_values(id, phonology, stems))} size={size} style={stems_style} />,
      // Fixed stems: each glyph two units, a space or a period one
      spacing:
        stems_style.join === "cursive" && stems_style.width === "fixed"
          ? { gap: fixed_glyph_width(size, stems_style) / 2, cell: fixed_glyph_width(size, stems_style) / 2, glyph: fixed_glyph_width(size, stems_style) }
          : undefined,
      whole_text:
        in_text && stems_style.join === "cursive" && stems_style.form === "block"
          ? (tokens, wrap) => <StemBlocks tokens={tokens} phonology={phonology} layout={stems} style={stems_style} period={period} wrap={wrap} />
          : undefined,
    },
    {
      name: "Gates",
      settings: JSON.stringify([phonology, gates, gates_style, period, size]),
      note:
        gates_style.form === "fret"
          ? "A syllable in one stroke through every point of a 7×7 grid, top left to top right: four blocks round the centre, a mark each, each one of the four paths through every point of it"
          : "Five bars a syllable, always all there; each gap between them a gate: open, bridged at the top, at the bottom, or closed",
      render: (ids) => <Gates rows={ids.map((id) => layout_values(id, phonology, gates))} size={size} style={gates_style} />,
      spacing: {
        ...bar_spacing(size, gates_style.weight, gates_span(gates_style), gates_spacing(gates_style), period, gates_joined(gates_style)),
        period: gates_style.form === "fret" ? <FretPeriod size={size} weight={gates_style.weight} /> : undefined,
      },
    },
    {
      name: "Stave",
      settings: JSON.stringify([phonology, stave, stave_style, period, size, in_text]),
      note: meander
        ? "Four marks per syllable as bridges between five bars: at the top for above the line, the bottom for below; flush for a dash, set in for a loop"
        : "Four marks per syllable along a ruled line: a dash or a loop, above or below",
      render: (ids) => (
        <StaveWord
          marks={ids.map((id) => layout_values(id, phonology, stave))}
          size={size}
          style={in_text ? { ...stave_style, midline: false } : stave_style}
        />
      ),
      rule: in_text && !circles && !meander && stave_style.midline ? { color: stave_style.midline_color, size } : undefined,
      spacing: meander ? bar_spacing(size, stave_style.meander_weight) : undefined,
      whole_text: circles
        ? (tokens, wrap) => (
            <StaveCircles
              tokens={tokens}
              phonology={phonology}
              layout={stave}
              style={stave_style}
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
