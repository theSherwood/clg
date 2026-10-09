import React from "react";
import { type Word } from "./dict";
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
};
export const default_line_style: LineStyle = {
  join: "cursive",
  curves: true,
  loop_mark: "circle",
  midline: false,
  midline_color: "#4b5563",
  midline_shape: "straight",
  grow: "in",
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

// The line script round circles: each sentence is a ring, read clockwise from the top, with the
// marks above the line outside it and those below inside. Rings are a line apart, and all are as
// big as the longest sentence for its place needs, so the writing stays one size; a sentence
// shorter than its ring has its gaps widened until it closes the circle. The first sentence is the
// outer ring when growing in, and the inner one when growing out.
type CircleItem = { geometry: LineGeometry; word?: Word } | { period: true } | { blank: number };

export function LineCircles({
  tokens,
  phonology,
  layout,
  style,
  period,
  size,
  wrap,
}: {
  tokens: ScriptToken[];
  phonology: Phonology;
  layout: MarkLayout;
  style: LineStyle;
  period: PeriodStyle;
  size: number;
  wrap: (word: Word, node: React.ReactElement) => React.ReactNode;
}) {
  const stroke = Math.max(1.5, size / 16);
  const sentences: CircleItem[][] = [[]];
  for (const t of tokens) {
    const sentence = sentences.at(-1)!;
    if ("punctuation" in t) {
      if (t.punctuation === ".") {
        sentence.push({ period: true });
        sentences.push([]);
      }
    } else if (t.ids) {
      sentence.push({ geometry: line_geometry(t.ids.map((id) => layout_values(id, phonology, layout)), size, style), word: t.word });
    } else {
      sentence.push({ blank: size * 0.5 });
    }
  }
  const rings = sentences.filter((s) => s.length > 0);
  if (rings.length === 0) return null;

  const gap = size * 0.25;
  const period_width = size * 0.3 * period.scale;
  const width_of = (item: CircleItem) =>
    "geometry" in item ? item.geometry.width : "period" in item ? period_width : item.blank;
  const lengths = rings.map((items) => items.reduce((n, item) => n + width_of(item) + gap, 0));
  const spacing = size * 1.35; // between rings, so neighbouring rings' marks keep apart
  const smallest = size * 0.8;
  const radii =
    style.grow === "in"
      ? (() => {
          const outer = Math.max(
            smallest + (rings.length - 1) * spacing,
            ...lengths.map((l, k) => l / (2 * Math.PI) + k * spacing),
          );
          return lengths.map((_, k) => outer - k * spacing);
        })()
      : (() => {
          const inner = Math.max(smallest, ...lengths.map((l, k) => l / (2 * Math.PI) - k * spacing));
          return lengths.map((_, k) => inner + k * spacing);
        })();
  const outer = Math.max(...radii);
  const margin = size * 0.75;
  const centre = outer + margin;
  const step = size * 0.08; // straight lines are cut this fine so they bend with the ring

  const nodes: React.ReactNode[] = [];
  rings.forEach((items, k) => {
    const R = radii[k]!;
    const circumference = 2 * Math.PI * R;
    const ring_gap = gap + (circumference - lengths[k]!) / items.length;
    // Where a point along the ring goes: x along the circle from the top, y below the line inward
    const place = (x: number, y: number): Point => {
      const angle = -Math.PI / 2 + (2 * Math.PI * x) / circumference;
      const r = R - y;
      return [centre + r * Math.cos(angle), centre + r * Math.sin(angle)];
    };
    const turn = (x: number) => (360 * x) / circumference;
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
      nodes.push(
        <circle key={`mid${k}`} cx={centre} cy={centre} r={R} stroke={style.midline_color} strokeWidth={midline_width(size)} />,
      );
    }
    let x = ring_gap / 2;
    items.forEach((item, i) => {
      const width = width_of(item);
      if ("geometry" in item) {
        const g = item.geometry;
        const word = (
          <g key={`${k}-${i}`}>
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
        nodes.push(item.word ? <React.Fragment key={`${k}-${i}`}>{wrap(item.word, word)}</React.Fragment> : word);
      } else if ("period" in item) {
        const [px, py] = place(x + width / 2, 0);
        nodes.push(
          <g key={`${k}-${i}`} transform={`translate(${px} ${py}) rotate(${turn(x + width / 2)})`}>
            {draw_mark(period.shape, 0, 0, Math.max(width / 2 - stroke, stroke))}
          </g>,
        );
      }
      x += width + ring_gap;
    });
  });
  const side = 2 * centre;
  return (
    <svg width={side} height={side} viewBox={`0 0 ${side} ${side}`} className="block" {...svg_props(size, style)}>
      {nodes}
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
