import React, { useEffect, useMemo, useState } from "react";
import { babel_verses, lords_prayer, north_wind_sentences, siduri_advice, udhr_articles } from "./examples";
import { MARKS, type Mark, type Phonology, syllable_of } from "./phonology";
import {
  type Assignment,
  LINE_MARKS,
  type MarkLayout,
  RUNGS,
  MARK_NAMES,
  SHAPES,
  SHAPE_KEYS,
  type ScriptToken,
  type ShapeKey,
  type SyllabicsSettings,
  TURNS,
  clashes,
  default_line,
  default_stems,
  default_syllabics,
  script_tokens,
  layout_values,
  syllabics_glyphs,
  value_labels,
} from "./scripts";

// Tries out candidate scripts on real text: stems with a rung per mark, a line with a mark per
// mark, and syllabics shapes turned four ways. Settings are kept in this browser only.

const SYLLABICS_FONT = "'Euphemia UCAS', 'Noto Sans Canadian Aboriginal', sans-serif";

// A saved setting, if it's still the same kind of value; saved settings objects are merged into
// the defaults, so ones saved before a field was added still work
function load<T>(key: string, fallback: T): T {
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

function useStored<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, set_value] = useState<T>(() => load(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, set_value];
}

const PRESETS: { label: string; text: string }[] = [
  { label: "The Lord's Prayer", articles: lords_prayer },
  { label: "Siduri's advice", articles: siduri_advice },
  { label: "The Tower of Babel, 11:1–4", articles: babel_verses.slice(0, 4) },
  { label: "The North Wind and the Sun", articles: north_wind_sentences },
  { label: "UDHR, Article 1", articles: udhr_articles.slice(0, 1) },
].map(({ label, articles }) => ({
  label,
  text: articles.flatMap((a) => (a.transliteration ? [a.transliteration] : [])).join(" "),
}));

// A word in the stem script: one stem per syllable, a rung per row (none, left, right, across)
function Stems({ rows, size }: { rows: number[][]; size: number }) {
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

// A word in the line script, as one stroke: the pen runs along the line, and each mark is an
// excursion from it, above or below, a flat-topped bump for a dash or a small loop for a circle.
// Syllables are a little further apart than their marks.
function line_path(marks: number[][], size: number, middle: number, start: number): string {
  const slot = size * 0.32;
  const gap = size * 0.4;
  const w = slot * 0.72; // a mark's width; the rest of the slot is line
  const h = size * 0.2; // how far a mark rises or falls
  let path = `M ${start} ${middle}`;
  marks.forEach((syllable, i) =>
    syllable.forEach((mark, j) => {
      const x = start + i * (4 * slot + gap) + j * slot + (slot - w) / 2;
      const s = mark & 1 ? 1 : -1; // below or above
      path += ` L ${x} ${middle}`;
      if (mark & 2) {
        // Out and up the far side, over the top, then back down across itself
        path +=
          ` C ${x + w * 1.05} ${middle + s * h * 0.1} ${x + w * 1.0} ${middle + s * h * 1.3} ${x + w * 0.5} ${middle + s * h * 1.3}` +
          ` C ${x} ${middle + s * h * 1.3} ${x - w * 0.05} ${middle + s * h * 0.1} ${x + w} ${middle}`;
      } else {
        const ramp = w * 0.25;
        path += ` L ${x + ramp} ${middle + s * h} L ${x + w - ramp} ${middle + s * h} L ${x + w} ${middle}`;
      }
    }),
  );
  const end = start + marks.length * 4 * slot + (marks.length - 1) * gap;
  return path + ` L ${end} ${middle}`;
}

function Line({ marks, size }: { marks: number[][]; size: number }) {
  const stroke = Math.max(1.5, size / 16);
  const height = size * 0.75;
  const width = marks.length * 4 * size * 0.32 + (marks.length - 1) * size * 0.4 + 2 * stroke;
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

function Written({
  tokens,
  render,
}: {
  tokens: ScriptToken[];
  render: (ids: number[]) => React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-[0.5em] gap-y-1">
      {tokens.map((t, i) =>
        "punctuation" in t ? (
          <span key={i} className="-ml-[0.4em] text-gray-500">
            {t.punctuation}
          </span>
        ) : t.ids ? (
          <span key={i} title={t.text}>
            {render(t.ids)}
          </span>
        ) : (
          <span key={i} className="text-red-500 text-sm" title="No root yet">
            {t.text}?
          </span>
        ),
      )}
    </div>
  );
}

// A select for each of a mark's values; choices are labelled by what they look like
function AssignmentRow({
  mark,
  phonology,
  assignment,
  options,
  on_change,
}: {
  mark: Mark;
  phonology: Phonology;
  assignment: Assignment;
  options: React.ReactNode[];
  on_change: (assignment: Assignment) => void;
}) {
  const labels = value_labels(mark, phonology);
  const clash = clashes(assignment, mark, phonology);
  return (
    <div className="mb-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-14 text-xs font-semibold text-gray-500">{MARK_NAMES[mark]}</span>
        {labels.map((label, v) => (
          <label key={label} className="flex items-center gap-1 text-xs">
            {label}
            <select
              value={assignment[label] ?? v}
              onChange={(e) => on_change({ ...assignment, [label]: Number(e.target.value) })}
              className="px-0.5 py-0 border border-gray-300 rounded bg-white"
            >
              {options.map((option, i) => (
                <option key={i} value={i}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {clash.length > 0 && (
        <div className="ml-16 text-xs text-red-600">Look alike: {clash.join("; ")}</div>
      )}
    </div>
  );
}

// The order a layout puts the marks in, and how each value is drawn
function LayoutControls({
  phonology,
  layout,
  set_layout,
  positions,
  options,
}: {
  phonology: Phonology;
  layout: MarkLayout;
  set_layout: (l: MarkLayout) => void;
  positions: string;
  options: string[];
}) {
  const missing = MARKS.filter((m) => !layout.order.includes(m));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
        <span className="w-14 font-semibold text-gray-500">{positions}</span>
        {layout.order.map((mark, i) => (
          <label key={i} className="flex items-center gap-1">
            {i + 1}
            <select
              value={mark}
              onChange={(e) => {
                const order = [...layout.order];
                order[i] = e.target.value as Mark;
                set_layout({ ...layout, order });
              }}
              className="px-0.5 border border-gray-300 rounded bg-white"
            >
              {MARKS.map((m) => (
                <option key={m} value={m}>
                  {MARK_NAMES[m]}
                </option>
              ))}
            </select>
          </label>
        ))}
        {missing.length > 0 && (
          <span className="text-red-600">Missing: {missing.map((m) => MARK_NAMES[m]).join(", ")}</span>
        )}
      </div>
      {MARKS.map((mark) => (
        <AssignmentRow
          key={mark}
          mark={mark}
          phonology={phonology}
          assignment={layout.values[mark]}
          options={options}
          on_change={(values) => set_layout({ ...layout, values: { ...layout.values, [mark]: values } })}
        />
      ))}
    </div>
  );
}

function SyllabicsControls({
  phonology,
  settings,
  set_settings,
}: {
  phonology: Phonology;
  settings: SyllabicsSettings;
  set_settings: (s: SyllabicsSettings) => void;
}) {
  const shape_options = settings.shapes.map((s) => `${SHAPES[s].join("")} ${s}`);
  const turn_options = TURNS.map((t, i) => `${SHAPES[settings.shapes[0]!][i]} ${t}`);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
        <span className="w-14 font-semibold text-gray-500">shapes</span>
        {settings.shapes.map((shape, i) => (
          <select
            key={i}
            value={shape}
            onChange={(e) => {
              const shapes = [...settings.shapes];
              shapes[i] = e.target.value as ShapeKey;
              set_settings({ ...settings, shapes });
            }}
            className="px-0.5 border border-gray-300 rounded bg-white"
            style={{ fontFamily: SYLLABICS_FONT }}
          >
            {SHAPE_KEYS.map((k) => (
              <option key={k} value={k}>
                {SHAPES[k].join("")} {k}
              </option>
            ))}
          </select>
        ))}
        {new Set(settings.shapes).size < 4 && <span className="text-red-600">A shape is used twice</span>}
      </div>
      <p className="text-xs text-gray-500 mb-1">Onset glyph: shape is the manner, turn the place</p>
      <AssignmentRow
        mark="M"
        phonology={phonology}
        assignment={settings.onset_shapes}
        options={shape_options}
        on_change={(onset_shapes) => set_settings({ ...settings, onset_shapes })}
      />
      <AssignmentRow
        mark="C"
        phonology={phonology}
        assignment={settings.place_turns}
        options={turn_options}
        on_change={(place_turns) => set_settings({ ...settings, place_turns })}
      />
      <p className="text-xs text-gray-500 mb-1">Rime glyph: shape is the final, turn the vowel</p>
      <AssignmentRow
        mark="N"
        phonology={phonology}
        assignment={settings.rime_shapes}
        options={shape_options}
        on_change={(rime_shapes) => set_settings({ ...settings, rime_shapes })}
      />
      <AssignmentRow
        mark="V"
        phonology={phonology}
        assignment={settings.vowel_turns}
        options={turn_options}
        on_change={(vowel_turns) => set_settings({ ...settings, vowel_turns })}
      />
    </div>
  );
}

// Every syllable in each script, laid out like the Roots grid: 16 IDs to a row
function AllSyllables({
  phonology,
  stems,
  line,
  syllabics,
  size,
}: {
  phonology: Phonology;
  stems: MarkLayout;
  line: MarkLayout;
  syllabics: SyllabicsSettings;
  size: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <tbody>
          {Array.from({ length: 16 }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: 16 }, (_, col) => {
                const id = row * 16 + col;
                return (
                  <td key={col} className="border border-gray-200 px-1 text-center align-top">
                    <div className="text-[10px] font-mono text-indigo-700">{syllable_of(id, phonology)}</div>
                    <Stems rows={[layout_values(id, phonology, stems)]} size={size * 0.7} />
                    <div>
                      <Line marks={[layout_values(id, phonology, line)]} size={size * 0.6} />
                    </div>
                    <div style={{ fontSize: size * 0.55, fontFamily: SYLLABICS_FONT }} className="leading-tight">
                      {syllabics_glyphs(id, phonology, syllabics)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScriptPlayground({ phonology }: { phonology: Phonology }) {
  const [stems, set_stems] = useStored<MarkLayout>("script_stems", default_stems);
  const [line, set_line] = useStored<MarkLayout>("script_line", default_line);
  const [syllabics, set_syllabics] = useStored<SyllabicsSettings>("script_syllabics", default_syllabics);
  const [size, set_size] = useStored("script_size", 32);
  const [text, set_text] = useStored("script_text", PRESETS[0]!.text);
  const tokens = useMemo(() => script_tokens(text, phonology), [text, phonology]);
  const sounds = (ids: number[]) => ids.map((id) => syllable_of(id, phonology)).join("");

  const scripts: { name: string; note: string; render: (ids: number[]) => React.ReactNode; style?: React.CSSProperties }[] = [
    {
      name: "Stems",
      note: "A stem per syllable, with a rung for each mark",
      render: (ids) => <Stems rows={ids.map((id) => layout_values(id, phonology, stems))} size={size} />,
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

  return (
    <div className="mb-4 p-3 rounded border border-gray-200 bg-gray-50 text-sm">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <h2 className="font-semibold">Script playground</h2>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1">
            Size
            <input type="range" min={16} max={72} value={size} onChange={(e) => set_size(Number(e.target.value))} />
          </label>
          <button
            onClick={() => {
              set_stems(default_stems);
              set_line(default_line);
              set_syllabics(default_syllabics);
            }}
            className="px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100"
          >
            Reset mappings
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-1 text-xs">
        <span className="text-gray-600">Text</span>
        <select
          value={PRESETS.find((p) => p.text === text)?.label ?? ""}
          onChange={(e) => {
            const preset = PRESETS.find((p) => p.label === e.target.value);
            if (preset) set_text(preset.text);
          }}
          className="px-1 border border-gray-300 rounded bg-white"
        >
          <option value="">Your own</option>
          {PRESETS.map((p) => (
            <option key={p.label}>{p.label}</option>
          ))}
        </select>
      </div>
      <textarea
        value={text}
        onChange={(e) => set_text(e.target.value)}
        rows={2}
        className="w-full p-1.5 mb-2 border border-gray-300 rounded font-mono text-xs bg-white"
      />
      <div className="mb-3 font-mono text-xs text-indigo-800">
        <Written tokens={tokens} render={sounds} />
      </div>

      {scripts.map((s) => (
        <div key={s.name} className="mb-3">
          <h3 className="text-xs font-semibold text-gray-600">
            {s.name} <span className="font-normal text-gray-400">{s.note}</span>
          </h3>
          <div style={s.style} className="text-gray-900">
            <Written tokens={tokens} render={s.render} />
          </div>
        </div>
      ))}

      <div className="grid gap-4 md:grid-cols-2 mt-2">
        <div>
          <h3 className="text-xs font-semibold text-gray-600 mb-1">Stems: a rung per row</h3>
          <LayoutControls
            phonology={phonology}
            layout={stems}
            set_layout={set_stems}
            positions="rows"
            options={RUNGS.map((r, i) => `${["│", "┤", "├", "┼"][i]} ${r}`)}
          />
          <h3 className="text-xs font-semibold text-gray-600 mt-3 mb-1">Line: a mark per position</h3>
          <LayoutControls
            phonology={phonology}
            layout={line}
            set_layout={set_line}
            positions="left to right"
            options={LINE_MARKS.map((m, i) => `${["⁻", "₋", "ᵒ", "ₒ"][i]} ${m}`)}
          />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-600 mb-1">Syllabics: shapes and turns</h3>
          <SyllabicsControls phonology={phonology} settings={syllabics} set_settings={set_syllabics} />
        </div>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-semibold text-gray-600">All 256 syllables</summary>
        <AllSyllables phonology={phonology} stems={stems} line={line} syllabics={syllabics} size={size} />
      </details>
    </div>
  );
}
