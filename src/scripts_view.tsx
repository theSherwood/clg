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
import {
  CursiveStems,
  Line,
  type LineStyle,
  Period,
  type PeriodStyle,
  default_line_style,
  default_period,
  LINE_JOINS,
  LOOP_MARKS,
  midline_width,
  SCRIPT_KEYS,
  SYLLABICS_FONT,
  Stems,
  load,
  script_renderers,
} from "./script_drawings";
import { WordHover } from "./word_ui";

// Tries out candidate scripts on real text: stems with a rung per mark, a line with a mark per
// mark, and syllabics shapes turned four ways. Settings are kept in this browser only.

// Only a value that differs from the default is kept, so a changed default reaches everyone who
// hasn't set their own
function useStored<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, set_value] = useState<T>(() => load(key, fallback));
  useEffect(() => {
    try {
      const json = JSON.stringify(value);
      if (json === JSON.stringify(fallback)) localStorage.removeItem(key);
      else localStorage.setItem(key, json);
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

// A text in one script. With a size, it's written in a script, whose period is a circle on the
// midline; without, it's the sounds, punctuated as usual
// rule: a midline ruled under every row, like lined paper, at the middle of the words (each row
// is the words' height, and rows are ROW_GAP apart)
const ROW_GAP = 4;

function Written({
  tokens,
  render,
  size,
  rule,
  period,
}: {
  tokens: ScriptToken[];
  render: (ids: number[]) => React.ReactNode;
  size?: number;
  period?: PeriodStyle;
  rule?: { color: string; size: number };
}) {
  const ruled: React.CSSProperties | undefined = rule && {
    lineHeight: 1,
    backgroundImage: (() => {
      const half = midline_width(rule.size) / 2;
      const middle = rule.size / 2;
      return `repeating-linear-gradient(to bottom, transparent 0 ${middle - half}px, ${rule.color} ${middle - half}px ${middle + half}px, transparent ${middle + half}px ${rule.size + ROW_GAP}px)`;
    })(),
  };
  return (
    <div className="flex flex-wrap items-center gap-x-[0.5em]" style={{ rowGap: ROW_GAP, ...ruled }}>
      {tokens.map((t, i) =>
        "punctuation" in t && t.punctuation === "." && size ? (
          <span key={i} className="flex items-center">
            <Period size={size} style={period} />
          </span>
        ) : "punctuation" in t ? (
          <span key={i} className="-ml-[0.4em] text-gray-500">
            {t.punctuation}
          </span>
        ) : t.ids && t.word ? (
          <WordHover key={i} word={t.word}>
            <span className="cursor-default flex items-center">{render(t.ids)}</span>
          </WordHover>
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

// Two or more choices side by side, one of them selected
function Toggle({ options, value, on_change }: { options: string[]; value: number; on_change: (i: number) => void }) {
  return (
    <div className="inline-flex rounded border border-gray-300 overflow-hidden">
      {options.map((label, i) => (
        <button
          key={label}
          onClick={() => on_change(i)}
          className={`px-1.5 py-0.5 ${i === value ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
        >
          {label}
        </button>
      ))}
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
  line_style,
  syllabics,
  size,
}: {
  phonology: Phonology;
  stems: MarkLayout;
  line: MarkLayout;
  line_style: LineStyle;
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
                    {/* Two by two: stems and cursive stems, then the line and syllabics */}
                    <div className="grid grid-cols-2 items-center justify-items-center gap-x-1">
                      <Stems rows={[layout_values(id, phonology, stems)]} size={size * 0.7} />
                      <CursiveStems rows={[layout_values(id, phonology, stems)]} size={size * 0.7} />
                      <Line marks={[layout_values(id, phonology, line)]} size={size * 0.6} style={line_style} />
                      <div style={{ fontSize: size * 0.5, fontFamily: SYLLABICS_FONT }} className="leading-tight whitespace-nowrap">
                        {syllabics_glyphs(id, phonology, syllabics)}
                      </div>
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
  const [stems, set_stems] = useStored<MarkLayout>(SCRIPT_KEYS.stems, default_stems);
  const [line, set_line] = useStored<MarkLayout>(SCRIPT_KEYS.line, default_line);
  const [line_style, set_line_style] = useStored<LineStyle>(SCRIPT_KEYS.line_style, default_line_style);
  const [period, set_period] = useStored<PeriodStyle>(SCRIPT_KEYS.period, default_period);
  const [syllabics, set_syllabics] = useStored<SyllabicsSettings>(SCRIPT_KEYS.syllabics, default_syllabics);
  const [size, set_size] = useStored("script_size", 32);
  const [text, set_text] = useStored("script_text", PRESETS[0]!.text);
  const tokens = useMemo(() => script_tokens(text, phonology), [text, phonology]);
  const sounds = (ids: number[]) => ids.map((id) => syllable_of(id, phonology)).join("");

  const scripts = script_renderers(phonology, { stems, line, line_style, syllabics, period }, size, true);

  return (
    <div className="mb-4 p-3 rounded border border-gray-200 bg-gray-50 text-sm">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <h2 className="font-semibold">Script playground</h2>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1">
            Size
            <input type="range" min={16} max={72} value={size} onChange={(e) => set_size(Number(e.target.value))} />
          </label>
          <span className="flex items-center gap-1">
            Period
            <Toggle
              options={[...LOOP_MARKS]}
              value={LOOP_MARKS.indexOf(period.shape)}
              on_change={(i) => set_period({ ...period, shape: LOOP_MARKS[i]! })}
            />
            <input
              type="range"
              min={0.3}
              max={2}
              step={0.1}
              value={period.scale}
              onChange={(e) => set_period({ ...period, scale: Number(e.target.value) })}
              title={`Period size: ${period.scale}×`}
              className="w-20"
            />
          </span>
          <button
            onClick={() => {
              set_stems(default_stems);
              set_line(default_line);
              set_line_style(default_line_style);
              set_syllabics(default_syllabics);
              set_period(default_period);
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
            {s.whole_text ? (
              <div className="overflow-x-auto">
                {s.whole_text(tokens, (word, node) => <WordHover word={word}>{node}</WordHover>)}
              </div>
            ) : (
              <Written tokens={tokens} render={s.render} size={size} rule={s.rule} period={period} />
            )}
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
          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
            <span className="w-14 font-semibold text-gray-500">style</span>
            <Toggle
              options={[...LINE_JOINS]}
              value={LINE_JOINS.indexOf(line_style.join)}
              on_change={(i) => set_line_style({ ...line_style, join: LINE_JOINS[i]! })}
            />
            {line_style.join === "cursive" ? (
              <Toggle
                options={["curves", "angles"]}
                value={line_style.curves ? 0 : 1}
                on_change={(i) => set_line_style({ ...line_style, curves: i === 0 })}
              />
            ) : (
              <Toggle
                options={[...LOOP_MARKS]}
                value={LOOP_MARKS.indexOf(line_style.loop_mark)}
                on_change={(i) => set_line_style({ ...line_style, loop_mark: LOOP_MARKS[i]! })}
              />
            )}
            <Toggle
              options={["midline", "no midline"]}
              value={line_style.midline ? 0 : 1}
              on_change={(i) => set_line_style({ ...line_style, midline: i === 0 })}
            />
            <Toggle
              options={["straight", "circle"]}
              value={line_style.midline_shape === "circle" ? 1 : 0}
              on_change={(i) => set_line_style({ ...line_style, midline_shape: i === 1 ? "circle" : "straight" })}
            />
            {line_style.midline_shape === "circle" && (
              <>
                <Toggle
                  options={["grow in", "grow out"]}
                  value={line_style.grow === "out" ? 1 : 0}
                  on_change={(i) => set_line_style({ ...line_style, grow: i === 1 ? "out" : "in" })}
                />
                <Toggle
                  options={["even", "condensed"]}
                  value={line_style.spacing === "condensed" ? 1 : 0}
                  on_change={(i) => set_line_style({ ...line_style, spacing: i === 1 ? "condensed" : "even" })}
                />
                <Toggle
                  options={["subclauses inline", "subclause circles"]}
                  value={line_style.subclauses === "circles" ? 1 : 0}
                  on_change={(i) => set_line_style({ ...line_style, subclauses: i === 1 ? "circles" : "inline" })}
                />
                <Toggle
                  options={["relax", "constraint solver", "flow"]}
                  value={["relax", "constraints", "flow"].indexOf(line_style.solver)}
                  on_change={(i) => set_line_style({ ...line_style, solver: (["relax", "constraints", "flow"] as const)[i]! })}
                />
                {line_style.solver !== "relax" && (
                  <Toggle
                    options={["rings full", "rings tight"]}
                    value={line_style.ring_sizing === "tight" ? 1 : 0}
                    on_change={(i) => set_line_style({ ...line_style, ring_sizing: i === 1 ? "tight" : "full" })}
                  />
                )}
                <label className="flex items-center gap-1" title="Room kept clear between words on different rings">
                  clearance
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={line_style.clearance}
                    onChange={(e) => set_line_style({ ...line_style, clearance: Number(e.target.value) })}
                    className="w-20"
                  />
                  <span className="tabular-nums w-8">{line_style.clearance.toFixed(2)}</span>
                </label>
                {line_style.subclauses === "circles" && (
                  <Toggle
                    options={["hide clause words", "show clause words"]}
                    value={line_style.clause_words === "show" ? 1 : 0}
                    on_change={(i) => set_line_style({ ...line_style, clause_words: i === 1 ? "show" : "hide" })}
                  />
                )}
                {line_style.spacing === "condensed" && (
                  <Toggle
                    options={["period at top", "period after"]}
                    value={line_style.period_position === "after" ? 1 : 0}
                    on_change={(i) => set_line_style({ ...line_style, period_position: i === 1 ? "after" : "top" })}
                  />
                )}
              </>
            )}
            <label className="flex items-center gap-1" title="Midline colour">
              colour
              <input
                type="color"
                value={line_style.midline_color}
                onChange={(e) => set_line_style({ ...line_style, midline_color: e.target.value })}
                className="w-6 h-5 p-0 border border-gray-300 rounded bg-white"
              />
            </label>
          </div>
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
        <AllSyllables
          phonology={phonology}
          stems={stems}
          line={line}
          line_style={line_style}
          syllabics={syllabics}
          size={size}
        />
      </details>
    </div>
  );
}
