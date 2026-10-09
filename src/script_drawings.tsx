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

function line_path(marks: number[][], size: number, middle: number, start: number): string {
  const slot = size * LINE_SLOT;
  const level = size * 0.16; // how far above or below the line the marks run
  const loop_height = size * 0.17;
  const loop_width = slot * 0.5;
  const flat = marks.flat();
  const side = flat.map((mark) => (mark & 1 ? 1 : -1));
  const points: Point[] = [[start, middle + side[0]! * level]];
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
  points.push([start + flat.length * slot, middle + side.at(-1)! * level]);
  return spline(points);
}

export function Line({ marks, size }: { marks: number[][]; size: number }) {
  const stroke = Math.max(1.5, size / 16);
  const height = size * 0.9;
  const width = marks.length * 4 * size * LINE_SLOT + 2 * stroke;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d={line_path(marks, size, height / 2, stroke)} />
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

// The settings the script playground keeps in this browser, read fresh, so popups follow it
export type ScriptSettings = { stems: MarkLayout; line: MarkLayout; syllabics: SyllabicsSettings };

export const SCRIPT_KEYS = { stems: "script_stems", line: "script_line", syllabics: "script_syllabics" } as const;

export function stored_script_settings(): ScriptSettings {
  return {
    stems: load(SCRIPT_KEYS.stems, default_stems),
    line: load(SCRIPT_KEYS.line, default_line),
    syllabics: load(SCRIPT_KEYS.syllabics, default_syllabics),
  };
}

export type ScriptRenderer = {
  name: string;
  note: string;
  render: (ids: number[]) => React.ReactNode;
  style?: React.CSSProperties;
};

// Each script, as a way to write a word's root IDs
export function script_renderers(phonology: Phonology, settings: ScriptSettings, size: number): ScriptRenderer[] {
  const { stems, line, syllabics } = settings;
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
      note: "Each word one stroke along a line, with four marks per syllable: a dash or a loop, above or below",
      render: (ids) => <Line marks={ids.map((id) => layout_values(id, phonology, line))} size={size} />,
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
