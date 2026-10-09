import React from "react";
import { type Phonology } from "./phonology";
import {
  type MarkLayout,
  type SyllabicsSettings,
  default_line,
  default_stems,
  default_syllabics,
  layout_values,
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

// A word in the line script, as one smooth stroke. The pen never returns to the line itself: it
// travels above or below it, at the level of the mark it's on. A dash is the pen running along
// that level, so neighbouring dashes on one side join into a longer line, and a loop is a small
// curl outward from it. Every position is the same width, and syllables follow on without a gap
// (a gap would read as a longer dash), so a word is counted off four positions at a time.
//
// The stroke is a list of points the pen passes through, joined by one smooth spline, so changes
// of side and the joins into and out of loops have no corners. A loop next to the other side
// leaves out its level start or end, so the pen sweeps straight between the loop and the crossing.
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

function line_path(marks: number[][], size: number, middle: number, start: number, curves: boolean): string {
  const slot = size * LINE_SLOT;
  const level = size * 0.2; // how far above or below the line the marks run, as for separate marks
  const loop_height = size * 0.17;
  const loop_width = slot * 0.5;
  const flat = marks.flat();
  const side = flat.map((mark) => (mark & 1 ? 1 : -1));
  // A word that starts or ends with a loop starts or ends at it, with no line beyond
  const points: Point[] = flat[0]! & 2 ? [] : [[start, middle + side[0]! * level]];
  flat.forEach((mark, k) => {
    const left = start + k * slot;
    const right = left + slot;
    const s = side[k]!;
    const y = middle + s * level;
    if (mark & 2) {
      const a = left + (slot - loop_width) / 2;
      const w = loop_width;
      const same_before = k === 0 || side[k - 1] === s;
      const same_after = k === flat.length - 1 || side[k + 1] === s;
      if (same_before) points.push([a, y]);
      points.push(
        [a + w, y + s * loop_height * 0.5],
        [a + w * 0.5, y + s * loop_height * 1.15],
        [a, y + s * loop_height * 0.5],
      );
      if (same_after) points.push([a + w, y]);
    } else {
      points.push([left + slot * 0.2, y], [right - slot * 0.2, y]);
    }
  });
  if (!(flat.at(-1)! & 2)) points.push([start + flat.length * slot, middle + side.at(-1)! * level]);
  return curves ? spline(points) : `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")}`;
}

// How the line script is drawn: one stroke per word or each mark on its own, curves or straight
// lines, and whether the midline itself is drawn
// How marks join: cursive (one stroke, as a hand would write it), angular (one straight line at
// the marks' level, stepping straight across where the side changes, with each loop's mark threaded
// on it), dashes (only neighbouring dashes on one side join) or separate. curves applies to
// cursive; loop_mark is how the other ways draw a loop.
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
};
export const default_line_style: LineStyle = {
  join: "cursive",
  curves: true,
  loop_mark: "circle",
  midline: false,
  midline_color: "#4b5563",
};

// The midline is ruled like lined paper: thinner than the writing, in its own colour
export function midline_width(size: number): number {
  return Math.max(1, size / 24);
}

// A loop's mark centred at x, y, and how far it reaches either side along the line, so a line
// threading it can stop at its edge (a tick is crossed, so the line runs on through it)
function loop_mark(loop: LoopMark, x: number, y: number, r: number, key: string): [React.ReactNode, number] {
  if (loop === "circle") return [<circle key={key} cx={x} cy={y} r={r} />, r];
  if (loop === "square") return [<rect key={key} x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} />, r * 0.9];
  if (loop === "tick") return [<line key={key} x1={x} y1={y - r * 1.3} x2={x} y2={y + r * 1.3} />, 0];
  return [<path key={key} d={`M ${x} ${y - r * 1.2} L ${x + r * 1.2} ${y} L ${x} ${y + r * 1.2} L ${x - r * 1.2} ${y} Z`} />, r * 1.2];
}

// Marks drawn on their own, above or below the line, with a gap between syllables (a separate
// mark can't run into the next, so a gap can't be taken for one). With join_dashes, neighbouring
// dashes on one side within a syllable are one line.
function line_marks(
  marks: number[][],
  size: number,
  middle: number,
  start: number,
  loop: LoopMark,
  join_dashes: boolean,
): React.ReactNode[] {
  const slot = size * LINE_SLOT;
  const gap = size * 0.4;
  const offset = size * 0.2;
  const r = slot * 0.2;
  const dash = slot * 0.22; // half a dash's length
  return marks.flatMap((syllable, i) => {
    const nodes: React.ReactNode[] = [];
    let run: { x1: number; x2: number; y: number } | undefined;
    const end_run = () => {
      if (run) nodes.push(<line key={`${i}-${nodes.length}`} x1={run.x1} y1={run.y} x2={run.x2} y2={run.y} />);
      run = undefined;
    };
    syllable.forEach((mark, j) => {
      const x = start + i * (4 * slot + gap) + (j + 0.5) * slot;
      const y = mark & 1 ? middle + offset : middle - offset;
      if (mark & 2) {
        end_run();
        nodes.push(loop_mark(loop, x, y, r, `${i}-${j}`)[0]);
      } else if (join_dashes && run && run.y === y) {
        run.x2 = x + dash;
      } else {
        end_run();
        run = { x1: x - dash, x2: x + dash, y };
      }
    });
    end_run();
    return nodes;
  });
}

// One straight line along the word at each mark's level, stepping straight up or down at the
// boundary where the side changes; a dash is the line itself and a loop its mark threaded on it
function angular_line(marks: number[][], size: number, middle: number, start: number, loop: LoopMark): React.ReactNode[] {
  const slot = size * LINE_SLOT;
  const offset = size * 0.2;
  const r = slot * 0.24;
  const flat = marks.flat();
  const y = flat.map((mark) => middle + (mark & 1 ? 1 : -1) * offset);
  const shapes: React.ReactNode[] = [];
  let path = "";
  flat.forEach((mark, k) => {
    const left = start + k * slot;
    const right = left + slot;
    const x = left + slot / 2;
    const yk = y[k]!;
    if (mark & 2) {
      const [shape, reach] = loop_mark(loop, x, yk, r, `m${k}`);
      shapes.push(shape);
      // The line meets the mark's edge (a tick it crosses); a word's first or last mark is its end
      if (k === 0) path = `M ${x + reach} ${yk}`;
      else path += ` L ${x - reach} ${yk}` + (reach > 0 ? ` M ${x + reach} ${yk}` : "");
      if (k === flat.length - 1) return;
    } else if (k === 0) {
      path = `M ${left} ${yk}`;
    }
    path += ` L ${right} ${yk}`;
    if (y[k + 1] !== undefined && y[k + 1] !== yk) path += ` L ${right} ${y[k + 1]}`;
  });
  return [<path key="line" d={path} />, ...shapes];
}

export function Line({ marks, size, style = default_line_style }: { marks: number[][]; size: number; style?: LineStyle }) {
  const stroke = Math.max(1.5, size / 16);
  const height = size * 1.0;
  const slot = size * LINE_SLOT;
  const gapped = style.join === "dashes" || style.join === "separate";
  const syllables = marks.length * 4 * slot + (gapped ? (marks.length - 1) * size * 0.4 : 0);
  const width = syllables + 2 * stroke;
  const middle = height / 2;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin={style.join === "angular" ? "miter" : "round"}
      fill="none"
    >
      {style.midline && (
        <line
          x1={0}
          y1={middle}
          x2={width}
          y2={middle}
          stroke={style.midline_color}
          strokeWidth={midline_width(size)}
          strokeLinecap="butt"
        />
      )}
      {style.join === "cursive" ? (
        <path d={line_path(marks, size, middle, stroke, style.curves)} />
      ) : style.join === "angular" ? (
        angular_line(marks, size, middle, stroke, style.loop_mark)
      ) : (
        line_marks(marks, size, middle, stroke, style.loop_mark, style.join === "dashes")
      )}
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
    syllabics: load(SCRIPT_KEYS.syllabics, default_syllabics),
  };
}

// rule: in running text, a midline ruled across the whole text, under every row of words
export type ScriptRenderer = {
  name: string;
  note: string;
  render: (ids: number[]) => React.ReactNode;
  style?: React.CSSProperties;
  rule?: { color: string; size: number };
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
  const { stems, line, line_style, syllabics } = settings;
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
      rule: in_text && line_style.midline ? { color: line_style.midline_color, size } : undefined,
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
