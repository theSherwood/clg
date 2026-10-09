import React, { useEffect, useMemo, useState } from "react";
import { babel_verses, lords_prayer, north_wind_sentences, siduri_advice, udhr_articles } from "./examples";
import { MARKS, type Mark, type Phonology, syllable_of } from "./phonology";
import {
  type Assignment,
  STAVE_MARKS,
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
  default_stave,
  default_stems,
  default_syllabics,
  script_tokens,
  layout_values,
  syllabics_glyphs,
  value_labels,
} from "./scripts";
import {
  CursiveStems,
  Stave,
  type StaveStyle,
  Period,
  type PeriodStyle,
  type ScriptRenderer,
  type ScriptSettings,
  default_stave_style,
  default_period,
  STAVE_JOINS,
  CROSSING_SHAPES,
  LOOP_MARKS,
  midline_width,
  SCRIPT_KEYS,
  SYLLABICS_FONT,
  Stems,
  load,
  script_renderers,
} from "./script_drawings";
import { BUILTIN_PRESETS, type Preset, load_saved_presets, same_settings, store_saved_presets } from "./script_presets";
import { WordHover } from "./word_ui";

// Tries out candidate scripts on real text: stems with a rung per mark, a stave with a mark per
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

// The text in one script, drawn again only when the text or that script's settings change, so
// changing one script's settings doesn't redraw the others
const ScriptText = React.memo(
  function ScriptText({ script: s, tokens, size, period }: { script: ScriptRenderer; tokens: ScriptToken[]; size: number; period: PeriodStyle }) {
    return (
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-gray-600">
          {s.name} <span className="font-normal text-gray-400">{s.note}</span>
        </h3>
        <div style={s.style} className="text-gray-900">
          {s.whole_text ? (
            <div className="overflow-x-auto">{s.whole_text(tokens, (word, node) => <WordHover word={word}>{node}</WordHover>)}</div>
          ) : (
            <Written tokens={tokens} render={s.render} size={size} rule={s.rule} period={period} />
          )}
        </div>
      </div>
    );
  },
  (a, b) => a.script.settings === b.script.settings && a.tokens === b.tokens && a.size === b.size && a.period === b.period,
);

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
const SELECT = "w-full min-w-0 px-0.5 py-0 border border-gray-300 rounded bg-white";

// A row of a mapping: its name, then its values two to a line, each with its name before it
function MappingRow({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex gap-2 text-xs ${className}`}>
      <span className="w-14 shrink-0 pt-0.5 font-semibold text-gray-500">{label}</span>
      <div className="flex-1 grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-1.5 gap-y-1">{children}</div>
    </div>
  );
}

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
      <MappingRow label={MARK_NAMES[mark]}>
        {labels.map((label, v) => (
          <React.Fragment key={label}>
            <span className="text-right text-gray-600" title={label}>
              {label.replace("voiced fricative", "v. fricative")}
            </span>
            <select
              value={assignment[label] ?? v}
              onChange={(e) => on_change({ ...assignment, [label]: Number(e.target.value) })}
              className={SELECT}
            >
              {options.map((option, i) => (
                <option key={i} value={i}>
                  {option}
                </option>
              ))}
            </select>
          </React.Fragment>
        ))}
      </MappingRow>
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
      <MappingRow label={positions} className="mb-1.5">
        {layout.order.map((mark, i) => (
          <React.Fragment key={i}>
            <span className="text-right text-gray-600">{i + 1}</span>
            <select
              value={mark}
              onChange={(e) => {
                const order = [...layout.order];
                order[i] = e.target.value as Mark;
                set_layout({ ...layout, order });
              }}
              className={SELECT}
            >
              {MARKS.map((m) => (
                <option key={m} value={m}>
                  {MARK_NAMES[m]}
                </option>
              ))}
            </select>
          </React.Fragment>
        ))}
      </MappingRow>
      {missing.length > 0 && (
        <div className="ml-16 mb-1.5 text-red-600">Missing: {missing.map((m) => MARK_NAMES[m]).join(", ")}</div>
      )}
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
      <MappingRow label="shapes" className="mb-1.5">
        {settings.shapes.map((shape, i) => (
          <select
            key={i}
            value={shape}
            onChange={(e) => {
              const shapes = [...settings.shapes];
              shapes[i] = e.target.value as ShapeKey;
              set_settings({ ...settings, shapes });
            }}
            className={`${SELECT} col-span-2`}
            style={{ fontFamily: SYLLABICS_FONT }}
          >
            {SHAPE_KEYS.map((k) => (
              <option key={k} value={k}>
                {SHAPES[k].join("")} {k}
              </option>
            ))}
          </select>
        ))}
      </MappingRow>
      {new Set(settings.shapes).size < 4 && <div className="ml-16 mb-1.5 text-red-600">A shape is used twice</div>}
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
// Drawn again only when something it shows changes: of the stave style, only how a word is drawn,
// not how a text is laid out
const word_style = ({ join, curves, loop_mark, midline, midline_color }: StaveStyle) =>
  JSON.stringify([join, curves, loop_mark, midline, midline_color]);
const AllSyllables = React.memo(
  AllSyllablesGrid,
  (a, b) =>
    a.phonology === b.phonology &&
    a.stems === b.stems &&
    a.stave === b.stave &&
    a.syllabics === b.syllabics &&
    a.size === b.size &&
    word_style(a.stave_style) === word_style(b.stave_style),
);

function AllSyllablesGrid({
  phonology,
  stems,
  stave,
  stave_style,
  syllabics,
  size,
}: {
  phonology: Phonology;
  stems: MarkLayout;
  stave: MarkLayout;
  stave_style: StaveStyle;
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
                    {/* Two by two: stems and cursive stems, then the stave and syllabics */}
                    <div className="grid grid-cols-2 items-center justify-items-center gap-x-1">
                      <Stems rows={[layout_values(id, phonology, stems)]} size={size * 0.7} />
                      <CursiveStems rows={[layout_values(id, phonology, stems)]} size={size * 0.7} />
                      <Stave marks={[layout_values(id, phonology, stave)]} size={size * 0.6} style={stave_style} />
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
  const [stave, set_stave] = useStored<MarkLayout>(SCRIPT_KEYS.stave, default_stave);
  const [stave_style, set_stave_style] = useStored<StaveStyle>(SCRIPT_KEYS.stave_style, default_stave_style);
  const [grid_open, set_grid_open] = useState(false);
  const [period, set_period] = useStored<PeriodStyle>(SCRIPT_KEYS.period, default_period);
  const [syllabics, set_syllabics] = useStored<SyllabicsSettings>(SCRIPT_KEYS.syllabics, default_syllabics);
  const [size, set_size] = useStored("script_size", 32);
  const [text, set_text] = useStored("script_text", PRESETS[0]!.text);
  const tokens = useMemo(() => script_tokens(text, phonology), [text, phonology]);
  const sounds = (ids: number[]) => ids.map((id) => syllable_of(id, phonology)).join("");

  const scripts = script_renderers(phonology, { stems, stave, stave_style, syllabics, period }, size, true);

  const set_style = (change: Partial<StaveStyle>) => set_stave_style({ ...stave_style, ...change });
  const circles = stave_style.midline_shape === "circle";
  const subclause_circles = circles && stave_style.subclauses === "circles";

  const settings: ScriptSettings = { stems, stave, stave_style, syllabics, period };
  const apply = (s: ScriptSettings) => {
    set_stems(s.stems);
    set_stave(s.stave);
    set_stave_style(s.stave_style);
    set_syllabics(s.syllabics);
    set_period(s.period);
  };

  const panels: Record<Section, React.ReactNode> = {
    general: (
      <div className="space-y-2">
        <Row label="Size">
          <Slider value={size} min={16} max={72} step={1} on_change={set_size} format={(v) => `${v}px`} />
        </Row>
        <Row label="Period" hint="The mark that ends a sentence, in every script">
          <Toggle
            options={[...LOOP_MARKS]}
            value={LOOP_MARKS.indexOf(period.shape)}
            on_change={(i) => set_period({ ...period, shape: LOOP_MARKS[i]! })}
          />
          <Slider value={period.scale} min={0.3} max={2} step={0.1} on_change={(scale) => set_period({ ...period, scale })} format={(v) => `${v.toFixed(1)}×`} />
        </Row>
      </div>
    ),
    stems: (
      <>
        <p className="text-gray-500 mb-1.5">A stem per syllable, with a rung for each mark, top to bottom</p>
        <LayoutControls
          phonology={phonology}
          layout={stems}
          set_layout={set_stems}
          positions="rows"
          options={RUNGS.map((r, i) => `${["│", "┤", "├", "┼"][i]} ${r}`)}
        />
      </>
    ),
    stave: (
      <div className="space-y-3">
        <div className="space-y-2">
          <Row label="Join">
            <Toggle options={[...STAVE_JOINS]} value={STAVE_JOINS.indexOf(stave_style.join)} on_change={(i) => set_style({ join: STAVE_JOINS[i]! })} />
          </Row>
          {stave_style.join === "cursive" ? (
            <Row label="Turns">
              <Toggle options={["curves", "angles"]} value={stave_style.curves ? 0 : 1} on_change={(i) => set_style({ curves: i === 0 })} />
            </Row>
          ) : (
            <Row label="Loop mark">
              <Toggle
                options={[...LOOP_MARKS]}
                value={LOOP_MARKS.indexOf(stave_style.loop_mark)}
                on_change={(i) => set_style({ loop_mark: LOOP_MARKS[i]! })}
              />
            </Row>
          )}
          <Row label="Midline">
            <Toggle options={["shown", "hidden"]} value={stave_style.midline ? 0 : 1} on_change={(i) => set_style({ midline: i === 0 })} />
            <label className="flex items-center gap-1" title="Midline colour">
              <input
                type="color"
                value={stave_style.midline_color}
                onChange={(e) => set_style({ midline_color: e.target.value })}
                className="w-6 h-5 p-0 border border-gray-300 rounded bg-white"
              />
            </label>
          </Row>
        </div>
        <div>
          <p className="text-gray-500 mb-1.5">A mark per position, left to right</p>
          <LayoutControls
            phonology={phonology}
            layout={stave}
            set_layout={set_stave}
            positions="order"
            options={STAVE_MARKS.map((m, i) => `${["⁻", "₋", "ᵒ", "ₒ"][i]} ${m}`)}
          />
        </div>
      </div>
    ),
    circles: (
      <div className="space-y-2">
        <Row label="Stave script">
          <Toggle
            options={["along lines", "round circles"]}
            value={circles ? 1 : 0}
            on_change={(i) => set_style({ midline_shape: i === 1 ? "circle" : "straight" })}
          />
        </Row>
        <div className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-600">Rings</h4>
            <Row label="Solver" off={!circles && OFF_CIRCLES}>
              <Toggle
                options={["relax", "constraint solver", "flow"]}
                value={SOLVERS.indexOf(stave_style.solver)}
                on_change={(i) => set_style({ solver: SOLVERS[i]! })}
              />
            </Row>
            <Row label="Inner rings" off={(!circles && OFF_CIRCLES) || (stave_style.solver === "relax" && "Not with the relaxation")}>
              <Toggle options={["full", "tight"]} value={stave_style.ring_sizing === "tight" ? 1 : 0} on_change={(i) => set_style({ ring_sizing: i === 1 ? "tight" : "full" })} />
            </Row>
            <Row label="Sentences" off={!circles && OFF_CIRCLES}>
              <Toggle options={["grow in", "grow out"]} value={stave_style.grow === "out" ? 1 : 0} on_change={(i) => set_style({ grow: i === 1 ? "out" : "in" })} />
            </Row>
            <Row label="Spacing" off={!circles && OFF_CIRCLES}>
              <Toggle
                options={["even", "condensed"]}
                value={stave_style.spacing === "condensed" ? 1 : 0}
                on_change={(i) => set_style({ spacing: i === 1 ? "condensed" : "even" })}
              />
            </Row>
            <Row label="Period" off={(!circles && OFF_CIRCLES) || (stave_style.spacing !== "condensed" && "Only with condensed spacing")}>
              <Toggle
                options={["at top", "after"]}
                value={stave_style.period_position === "after" ? 1 : 0}
                on_change={(i) => set_style({ period_position: i === 1 ? "after" : "top" })}
              />
            </Row>
            <Row label="Clearance" hint="Room kept clear between words on different rings" off={!circles && OFF_CIRCLES}>
              <Slider value={stave_style.clearance} min={0} max={1} step={0.05} on_change={(clearance) => set_style({ clearance })} format={(v) => v.toFixed(2)} />
            </Row>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-600">Subclauses</h4>
            <Row label="Written" off={!circles && OFF_CIRCLES}>
              <Toggle
                options={["inline", "on circles"]}
                value={stave_style.subclauses === "circles" ? 1 : 0}
                on_change={(i) => set_style({ subclauses: i === 1 ? "circles" : "inline" })}
              />
            </Row>
            <Row label="Clause words" off={!subclause_circles && OFF_SUBCLAUSES}>
              <Toggle
                options={["hidden", "shown"]}
                value={stave_style.clause_words === "show" ? 1 : 0}
                on_change={(i) => set_style({ clause_words: i === 1 ? "show" : "hide" })}
              />
            </Row>
            <Row label="Crossing" hint="The mark where a subclause's circle starts" off={!subclause_circles && OFF_SUBCLAUSES}>
              <Toggle
                options={[...CROSSING_SHAPES]}
                value={CROSSING_SHAPES.indexOf(stave_style.crossing_shape)}
                on_change={(i) => set_style({ crossing_shape: CROSSING_SHAPES[i]! })}
              />
              <Slider
                value={stave_style.crossing_scale}
                min={0.3}
                max={3}
                step={0.1}
                on_change={(crossing_scale) => set_style({ crossing_scale })}
                format={(v) => `${v.toFixed(1)}×`}
              />
            </Row>
          </div>
        </div>
      </div>
    ),
    syllabics: <SyllabicsControls phonology={phonology} settings={syllabics} set_settings={set_syllabics} />,
  };

  return (
    <div className="mb-4 p-3 rounded border border-gray-200 bg-gray-50 text-sm">
      <h2 className="font-semibold mb-2">Script playground</h2>
      {/* The settings sit beside the writing on wide screens, kept in view while it scrolls, and
          above it otherwise, so a new layout never moves them */}
      <div className="flex flex-col lg:flex-row-reverse gap-3">
        <aside className="lg:w-[26rem] shrink-0 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto rounded border border-gray-200 bg-white text-xs">
          <Presets settings={settings} apply={apply} />
          {SECTIONS.map(([key, title]) => (
            <Panel key={key} id={key} title={title}>
              {panels[key]}
            </Panel>
          ))}
        </aside>

        <div className="min-w-0 flex-1">
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
            <ScriptText key={s.name} script={s} tokens={tokens} size={size} period={period} />
          ))}

          {/* Drawn only while open */}
          <details className="mt-2" onToggle={(e) => set_grid_open(e.currentTarget.open)}>
            <summary className="cursor-pointer text-xs font-semibold text-gray-600">All 256 syllables</summary>
            {grid_open && (
              <AllSyllables
                phonology={phonology}
                stems={stems}
                stave={stave}
                stave_style={stave_style}
                syllabics={syllabics}
                size={size}
              />
            )}
          </details>
        </div>
      </div>
    </div>
  );
}

const SECTIONS = [
  ["general", "General"],
  ["stems", "Stems"],
  ["stave", "Stave"],
  ["circles", "Stave in rings"],
  ["syllabics", "Syllabics"],
] as const;
type Section = (typeof SECTIONS)[number][0];

// A collapsible section of the settings, remembered open or closed
function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const [open, set_open] = useStored(`script_panel_${id}`, id === "stave" || id === "circles");
  return (
    <details open={open} onToggle={(e) => set_open(e.currentTarget.open)} className="border-t border-gray-200 group">
      <summary className="cursor-pointer select-none px-2.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50">{title}</summary>
      <div className="px-2.5 pb-2.5 pt-1">{children}</div>
    </details>
  );
}

// Choosing a preset applies it; the current settings can be saved as a preset of their own, and
// a saved one updated with them or deleted
function Presets({ settings, apply }: { settings: ScriptSettings; apply: (s: ScriptSettings) => void }) {
  const [saved, set_saved_state] = useState(load_saved_presets);
  const [chosen, set_chosen] = useStored("script_preset", "Default");
  const [naming, set_naming] = useState<string | null>(null);
  const set_saved = (presets: Preset[]) => {
    set_saved_state(presets);
    store_saved_presets(presets);
  };
  const all = [...BUILTIN_PRESETS, ...saved];
  const preset = all.find((p) => p.name === chosen);
  const changed = !preset || !same_settings(preset.settings, settings);
  const taken = (name: string) => BUILTIN_PRESETS.some((p) => p.name === name);
  const save = () => {
    const name = naming?.trim();
    if (!name || taken(name)) return;
    set_saved([...saved.filter((p) => p.name !== name), { name, settings }]);
    set_chosen(name);
    set_naming(null);
  };
  const button = "px-1.5 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white";
  return (
    <div className="p-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-700">Preset</span>
        <select
          value={preset ? chosen : ""}
          onChange={(e) => {
            const next = all.find((p) => p.name === e.target.value);
            if (!next) return;
            set_chosen(next.name);
            apply(next.settings);
          }}
          className="min-w-0 flex-1 px-1 py-0.5 border border-gray-300 rounded bg-white"
        >
          {!preset && <option value="">None</option>}
          <optgroup label="Built in">
            {BUILTIN_PRESETS.map((p) => (
              <option key={p.name}>{p.name}</option>
            ))}
          </optgroup>
          {saved.length > 0 && (
            <optgroup label="Saved">
              {saved.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </optgroup>
          )}
        </select>
        {preset && changed && <span className="text-amber-700">changed</span>}
      </div>
      {naming === null ? (
        <div className="flex flex-wrap gap-1.5">
          <button className={button} onClick={() => set_naming(preset && !preset.builtin ? preset.name : "")}>
            Save as…
          </button>
          <button
            className={button}
            disabled={!preset || preset.builtin || !changed}
            title={preset?.builtin ? "Built-in presets can't be changed; save as a new one" : undefined}
            onClick={() => preset && set_saved(saved.map((p) => (p.name === preset.name ? { ...p, settings } : p)))}
          >
            Update
          </button>
          <button className={button} disabled={!preset || !changed} onClick={() => preset && apply(preset.settings)}>
            Revert
          </button>
          <button
            className={button}
            disabled={!preset || preset.builtin}
            onClick={() => {
              if (!preset || !confirm(`Delete the preset "${preset.name}"?`)) return;
              set_saved(saved.filter((p) => p.name !== preset.name));
              set_chosen("Default");
            }}
          >
            Delete
          </button>
        </div>
      ) : (
        <form
          className="flex flex-wrap items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <input
            autoFocus
            value={naming}
            onChange={(e) => set_naming(e.target.value)}
            placeholder="Name"
            className="min-w-0 flex-1 px-1 py-0.5 border border-gray-300 rounded"
          />
          <button type="submit" className={button} disabled={!naming.trim() || taken(naming.trim())}>
            Save
          </button>
          <button type="button" className={button} onClick={() => set_naming(null)}>
            Cancel
          </button>
          {taken(naming.trim()) && <span className="w-full text-red-600">That's a built-in preset's name</span>}
          {saved.some((p) => p.name === naming.trim()) && <span className="w-full text-amber-700">Replaces the saved preset of that name</span>}
        </form>
      )}
    </div>
  );
}
const SOLVERS = ["relax", "constraints", "flow"] as const;
const OFF_CIRCLES = "Only round circles";
const OFF_SUBCLAUSES = "Only with subclauses on circles";

// A labelled row of settings; one that doesn't apply as things stand is greyed out, saying why,
// rather than hidden, so the others stay where they are
function Row({ label, hint, off, children }: { label: string; hint?: string; off?: string | false; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2" title={off || hint}>
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <div className={`flex flex-wrap items-center gap-2 ${off ? "opacity-40 pointer-events-none" : ""}`} aria-disabled={!!off}>
        {children}
      </div>
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  on_change,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  on_change: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on_change(Number(e.target.value))} className="w-24" />
      <span className="tabular-nums w-10 text-gray-600">{format(value)}</span>
    </span>
  );
}
