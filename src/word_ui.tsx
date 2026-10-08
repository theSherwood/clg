import React, { useContext } from "react";
import {
  type Axis,
  type AxisCell,
  type AxisSide,
  type VerbType,
  VERB_TYPE_RULES,
  Word,
  axes,
  axis_by_word,
  candidates,
  words,
  dictionary,
  is_root,
  sections,
} from "./dict";
import { tokenize } from "./examples";
import { type Phonology, default_phonology, pronounce, syllable_of } from "./phonology";
import Tippy, { type TippyProps } from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Default tippy styling
import "tippy.js/themes/light.css"; // Optional: a light theme

export const PhonologyContext = React.createContext<Phonology>(default_phonology);

// Export own set of props (even if they are the same for now) to enable clients to be more future-proof
export type LazyTippyProps = TippyProps;

export const LazyTippy = (props: LazyTippyProps) => {
  const [mounted, setMounted] = React.useState(false);

  const lazyPlugin = {
    fn: () => ({
      onMount: () => setMounted(true),
      onHidden: () => setMounted(false),
    }),
  };

  // Wide enough for an axis's word matrix, but never wider than the window. A popup nested in
  // another goes in that popup's root, outside its scrolling boxes so they can't clip it, and
  // still inside it so moving into the nested one keeps the outer one open. A popup slides as far
  // as it needs to, even off its reference, to stay in the window.
  const computedProps: TippyProps = {
    maxWidth: "min(960px, calc(100vw - 16px))",
    appendTo: (reference) => reference.closest("[data-tippy-root]") ?? document.body,
    popperOptions: {
      modifiers: [
        { name: "preventOverflow", options: { padding: 8, altAxis: true, tether: false } },
        {
          name: "flip",
          options: {
            padding: 8,
            ...(props.placement === "right-start" && {
              fallbackPlacements: ["left-start", "bottom-start", "top-start"],
            }),
          },
        },
      ],
    },
    ...props,
  };

  computedProps.plugins = [lazyPlugin, ...(props.plugins || [])];

  if (props.render) {
    const render = props.render; // let TypeScript safely derive that render is not undefined
    computedProps.render = (...args) => (mounted ? render(...args) : "");
  } else {
    computedProps.content = mounted ? props.content : "";
  }

  return <Tippy {...computedProps} />;
};

// A form is a sequence of root IDs, so one sound. Several English words can share a form (a
// root's homonyms, or compounds built the same way, like small and shrink), and a popup shows
// the form, with every meaning it has.
function root_ids(word: Word): number[] {
  return is_root(word) ? [word.data.id] : word.data.parts.flatMap(root_ids);
}

export function form_key(word: Word): string {
  return root_ids(word).join("-");
}

const DOMAIN_ORDER = ["verb", "noun", "adjective", "adverb"];

let forms: Map<string, Word[]> | undefined;

// Every word with the same form as this one, verbs first
export function words_of_form(word: Word): Word[] {
  if (!forms) {
    forms = new Map();
    for (const w of words) {
      const key = form_key(w);
      forms.set(key, [...(forms.get(key) ?? []), w]);
    }
    const rank = (w: Word) => {
      const i = DOMAIN_ORDER.indexOf(w.data.domain ?? "");
      return i < 0 ? DOMAIN_ORDER.length : i;
    };
    for (const list of forms.values()) list.sort((a, b) => rank(a) - rank(b));
  }
  return forms.get(form_key(word)) ?? [word];
}

const NESTED_TIPPY: Partial<TippyProps> = {
  placement: "right-start",
  interactive: true,
  delay: [150, 0],
  theme: "light",
};

// A popup is never taller than the window; past that, it scrolls
const POPUP_STYLE: React.CSSProperties = { maxHeight: "calc(100vh - 16px)", overflowY: "auto" };

// Opens another form's popup on hover; children default to the form's sound and meanings
function FormHover({
  word,
  depth,
  children,
}: {
  word: Word;
  depth: number;
  children?: React.ReactNode;
}) {
  const phonology = useContext(PhonologyContext);
  const names = words_of_form(word).map((w) => w.word);
  return (
    <LazyTippy content={<FormPopoverContent word={word} depth={depth + 1} />} {...NESTED_TIPPY}>
      <span className="cursor-pointer hover:underline">
        {children ?? (
          <span className="whitespace-nowrap">
            <span className="font-mono text-indigo-700">{pronounce(word, phonology)}</span>{" "}
            <span className="text-gray-700">
              {names.slice(0, 3).join(" / ")}
              {names.length > 3 && " …"}
            </span>
          </span>
        )}
      </span>
    </LazyTippy>
  );
}

// Verbs first: the language is verb-centric
const AXIS_COLUMNS = [
  ["verb_i", "vi (no object)"],
  ["verb_t", "vt (with object)"],
  ["noun", "noun"],
  ["adj", "adjective"],
  ["adverb", "adverb"],
] as const;

// The side of its axis a word is on
export function side_of(word: Word): AxisSide | undefined {
  const axis = axis_by_word.get(word);
  if (!axis) return undefined;
  return [axis.positive, axis.negative, ...Object.values(axis.steps)].find((side) =>
    Object.values(side).some((cell) => cell.word === word),
  );
}

function side_name(side: AxisSide): string | undefined {
  return (side.adj.word ?? side.noun.word ?? side.adverb.word ?? side.verb_i.word)?.word;
}

// A side's verb, without and with an object; missing forms are what to fill in next
export const VERB_TYPE_STYLES: Record<VerbType, string> = {
  change: "bg-sky-100 text-sky-800",
  action: "bg-amber-100 text-amber-800",
  relation: "bg-violet-100 text-violet-800",
};

// short: just the first letter, for tight spaces like the Roots grid
export function VerbTypeBadge({ type, short = false }: { type: VerbType; short?: boolean }) {
  const rules = VERB_TYPE_RULES[type];
  return (
    <span
      className={`inline-block rounded px-1 text-[10px] font-semibold ${VERB_TYPE_STYLES[type]}`}
      title={`${type} verb · no object: ${rules.no_object} · with an object: ${rules.with_object}`}
    >
      {short ? type[0]!.toUpperCase() : type}
    </span>
  );
}

// A side's verb without and with an object, as its axis's type defines them
export function SideVerbs({ side, type }: { side: AxisSide; type?: VerbType }) {
  const form = (label: string, title: string, gloss?: string, applies = true) => (
    <div title={title}>
      <span className="text-gray-500">{label} </span>
      {gloss ? (
        <span className="font-semibold text-gray-800">{gloss}</span>
      ) : applies ? (
        <span className="text-red-600">missing</span>
      ) : (
        <span className="text-gray-400">n/a</span>
      )}
    </div>
  );
  if (!side.verb_i.word) {
    return <div className="text-xs mt-1 text-red-600">no verb</div>;
  }
  return (
    <div className="text-xs mt-1">
      {type && <VerbTypeBadge type={type} />}
      {form("vi", "verb without an object", side.verb_i.gloss, type !== "relation")}
      {form("vt", "verb with an object", side.verb_t.gloss)}
    </div>
  );
}

// Every axis verb, grouped by type, plus the axes that have no verb yet
export function VerbsByType() {
  const by_type = (type: VerbType) => axes.filter((a) => a.verb_type === type);
  const verbless = axes.filter((a) => !a.positive.verb_i.word);
  const verbs = (axis: Axis) =>
    [axis.positive, axis.negative]
      .map((side) => side.verb_t.gloss ?? side.verb_i.gloss)
      .filter(Boolean)
      .join(" / ");
  return (
    <details className="px-4 pt-3 text-sm">
      <summary className="cursor-pointer font-semibold">
        Axis verbs by type: {axes.length - verbless.length} axes with verbs,{" "}
        <span className="text-red-600">{verbless.length} without</span>
      </summary>
      <div className="mt-2 space-y-2">
        {(Object.keys(VERB_TYPE_RULES) as VerbType[]).map((type) => (
          <p key={type}>
            <VerbTypeBadge type={type} />{" "}
            <span className="text-gray-500">
              no object: {VERB_TYPE_RULES[type].no_object}; with an object:{" "}
              {VERB_TYPE_RULES[type].with_object} ({by_type(type).length}):
            </span>{" "}
            {by_type(type).map(verbs).join(", ")}
          </p>
        ))}
        <p>
          <span className="font-semibold text-red-600">No verb ({verbless.length}):</span>{" "}
          {verbless
            .map((a) => [a.positive, a.negative].map(side_name).filter(Boolean).join(" / "))
            .join(", ")}
        </p>
      </div>
    </details>
  );
}

// Missing verbs are red, since they're the gaps that matter most. On the minor steps nothing is
// required, so their gaps are just gray.
function MatrixCell({
  cell,
  form,
  depth,
  verb,
  applies = true,
  optional = false,
}: {
  cell: AxisCell;
  form: string;
  depth: number;
  verb: boolean;
  applies?: boolean;
  optional?: boolean;
}) {
  if (verb && cell.word && !cell.gloss && !applies) {
    return (
      <td className="px-1.5 py-0.5 border border-gray-200 text-center text-gray-400">n/a</td>
    );
  }
  if (!cell.word || (verb && !cell.gloss)) {
    return (
      <td
        className={`px-1.5 py-0.5 border border-gray-200 text-center ${
          verb && !optional ? "bg-red-50 text-red-400" : "text-gray-300"
        }`}
      >
        —
      </td>
    );
  }
  const text = cell.gloss ?? cell.word.word;
  const here = form_key(cell.word) === form;
  return (
    <td
      className={`px-1.5 py-0.5 border border-gray-200 whitespace-nowrap
        ${here ? "font-semibold" : ""}
        text-gray-800`}
    >
      {here ? (
        text
      ) : (
        <FormHover word={cell.word} depth={depth}>
          {text}
        </FormHover>
      )}
    </td>
  );
}

// A step's sound in the matrix opens that step's form. A step with no words yet still has
// parts, the step helper and the root, so its popup shows those.
function StepSound({
  sound,
  side,
  helper,
  axis,
  form,
  depth,
}: {
  sound: string;
  side: AxisSide;
  helper?: string;
  axis: Axis;
  form: string;
  depth: number;
}) {
  const named = Object.values(side).find((cell) => cell.word)?.word;
  if (named) {
    if (form_key(named) === form) return <>{sound}</>;
    return (
      <FormHover word={named} depth={depth}>
        {sound}
      </FormHover>
    );
  }
  const helper_word = helper ? dictionary.get(`<${helper}>`) : undefined;
  const root_word = Object.values(axis.positive).find((cell) => cell.word)?.word;
  if (!helper_word || !root_word) return <>{sound}</>;
  return (
    <LazyTippy
      content={
        <div
          className="p-3 bg-white shadow-lg rounded-md border border-gray-200 text-sm font-sans font-normal text-left whitespace-normal"
          style={POPUP_STYLE}
        >
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-indigo-700">{sound}</span>
            <span className="text-xs font-semibold text-blue-600">COMPOUND</span>
            <span className="text-xs text-gray-500">no words yet</span>
          </div>
          <p className="text-xs mt-0.5">
            <FormHover word={helper_word} depth={depth + 1} />
            <span className="text-gray-400"> + </span>
            <FormHover word={root_word} depth={depth + 1} />
          </p>
        </div>
      }
      {...NESTED_TIPPY}
    >
      <span className="cursor-pointer hover:underline">{sound}</span>
    </LazyTippy>
  );
}

// Opposite steps share a tint, so the scale reads as mirrored around neutral
const STEP_TINTS: Record<string, string> = {
  max_positive: "bg-amber-50",
  positive: "bg-emerald-50",
  min_positive: "bg-sky-50",
  min_negative: "bg-sky-50",
  negative: "bg-emerald-50",
  max_negative: "bg-amber-50",
};

// The whole axis a word belongs to: every form at every step of the scale, from max_positive down
// to max_negative. The bare root is the positive step. Cells of the form being shown are
// highlighted, and the others open their own popups.
function AxisMatrix({ axis, form, depth }: { axis: Axis; form: string; depth: number }) {
  const phonology = useContext(PhonologyContext);
  const root_sound = syllable_of(axis.id, phonology);
  const step_sound = (helper: string) => {
    const word = dictionary.get(`<${helper}>`);
    return word ? `${pronounce(word, phonology)}${root_sound}` : "";
  };
  const rows: [label: string, sound: string, side: AxisSide, optional: boolean][] = [
    ["max_positive", step_sound("max_positive"), axis.steps.max_positive, true],
    ["positive", root_sound, axis.positive, false],
    ["min_positive", step_sound("min_positive"), axis.steps.min_positive, true],
    ["neutral", step_sound("neutral"), axis.steps.neutral, true],
    ["min_negative", step_sound("min_negative"), axis.steps.min_negative, true],
    ["negative", step_sound("negative"), axis.negative, false],
    ["max_negative", step_sound("max_negative"), axis.steps.max_negative, true],
  ];
  return (
    <div className="mt-2 mb-2">
      <div className="text-xs mb-1">
        <span className="font-semibold">Axis</span>
        {axis.name.word && (
          <span>
            {" "}
            {form_key(axis.name.word) === form ? (
              axis.name.word.word
            ) : (
              <FormHover word={axis.name.word} depth={depth}>
                {axis.name.word.word}
              </FormHover>
            )}
          </span>
        )}
        {axis.verb_type && (
          <span className="ml-1.5">
            <VerbTypeBadge type={axis.verb_type} />
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th />
              <th />
              {AXIS_COLUMNS.map(([key, label]) => (
                <th key={key} className="px-1.5 pb-0.5 font-normal text-gray-500 text-left">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, sound, side, optional]) => (
              <tr
                key={label}
                className={`${STEP_TINTS[label] ?? ""} ${
                  Object.values(side).some((cell) => cell.word && form_key(cell.word) === form)
                    ? "border-2 border-indigo-600"
                    : ""
                }`}
              >
                <th
                  className={`pr-1.5 font-normal text-left whitespace-nowrap ${
                    optional ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {label}
                </th>
                <td className="pr-1.5 font-mono text-indigo-700 whitespace-nowrap">
                  <StepSound
                    sound={sound}
                    side={side}
                    helper={label === "positive" ? undefined : label}
                    axis={axis}
                    form={form}
                    depth={depth}
                  />
                </td>
                {AXIS_COLUMNS.map(([key]) => (
                  <MatrixCell
                    key={key}
                    cell={side[key]}
                    form={form}
                    depth={depth}
                    verb={key === "verb_i" || key === "verb_t"}
                    applies={!(key === "verb_i" && axis.verb_type === "relation")}
                    optional={optional}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {axis.notes && <p className="text-xs text-gray-600 mt-1 max-w-md">{axis.notes}</p>}
    </div>
  );
}

// A verb's meanings without and with an object, each marked; other words show their gloss
function Meaning({ word }: { word: Word }) {
  const side = word.data.domain === "verb" ? side_of(word) : undefined;
  const on_axis = side?.verb_i.word === word;
  if (!on_axis && !word.data.verb_i && !word.data.verb_t) {
    return word.data.gloss ? <span className="italic">{word.data.gloss}</span> : null;
  }
  const verb_i = on_axis ? side!.verb_i.gloss : word.data.verb_i;
  const verb_t = on_axis ? side!.verb_t.gloss : word.data.verb_t;
  const relation = axis_by_word.get(word)?.verb_type === "relation";
  const line = (mark: string, gloss?: string, applies = true) => (
    <span className="block">
      <span className="text-gray-500">{mark} </span>
      {gloss ? (
        <span className="text-gray-800">{gloss}</span>
      ) : applies ? (
        <span className="text-red-500">missing</span>
      ) : (
        <span className="text-gray-400">n/a</span>
      )}
    </span>
  );
  return (
    <>
      {line("vi", verb_i, !relation)}
      {line("vt", verb_t)}
    </>
  );
}

// Everything one form means: each English word it stands for, its axis, its parts and the
// compounds that use it. current marks the word the popup was opened from, if any.
export function FormPopoverContent({
  word,
  current,
  depth,
}: {
  word: Word;
  current?: Word;
  depth: number;
}) {
  const phonology = useContext(PhonologyContext);
  const form = form_key(word);
  const meanings = words_of_form(word);
  const root = is_root(word);
  const section_labels = [...new Set(meanings.map((w) => w.data.section))].map(
    (key) => sections.find((s) => s.key === key)?.label,
  );
  const form_axes = [...new Set(meanings.flatMap((w) => axis_by_word.get(w) ?? []))];
  const axis_notes = new Set(form_axes.map((a) => a.notes));

  // Compounds built on this form, one entry per form
  const uses = new Map<string, Word>();
  for (const w of meanings) {
    for (const use of w.data.uses) {
      const key = form_key(use);
      if (!uses.has(key)) uses.set(key, use);
    }
  }

  return (
    <div
      className="p-3 bg-white shadow-lg rounded-md border border-gray-200 text-sm font-sans font-normal text-left whitespace-normal"
      style={POPUP_STYLE}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-mono text-lg font-bold text-indigo-700">
          {pronounce(word, phonology)}
        </span>
        <span className={`text-xs font-semibold ${root ? "text-green-600" : "text-blue-600"}`}>
          {root ? `ROOT · ID ${word.data.id}` : "COMPOUND"}
        </span>
        <span className="text-xs text-gray-500">{section_labels.join(", ")}</span>
      </div>
      {!root && (
        <p className="text-xs mt-0.5">
          {word.data.parts.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-400"> + </span>}
              <FormHover word={part} depth={depth} />
            </React.Fragment>
          ))}
        </p>
      )}

      <table className="mt-2 text-xs border-collapse">
        <tbody>
          {meanings.map((w) => (
            <tr
              key={w.word}
              className={`align-top ${w === current ? "bg-indigo-50" : ""}`}
            >
              <td className="pr-2 py-0.5 font-semibold text-gray-800 whitespace-nowrap">
                {w.word}
              </td>
              <td className="pr-2 py-0.5 text-gray-500 whitespace-nowrap">{w.data.domain}</td>
              <td className="py-0.5 text-gray-700 max-w-md">
                <Meaning word={w} />
                {w.data.synonyms && (
                  <span className="block text-gray-500">Also: {w.data.synonyms.join(", ")}</span>
                )}
                {w.data.notes && !axis_notes.has(w.data.notes) && (
                  <span className="block text-gray-600">{w.data.notes}</span>
                )}
                {w.data.t.length > 0 && (
                  <span className="text-gray-400"> {w.data.t.join(", ")}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {form_axes.map((axis) => (
        <AxisMatrix key={axis.id} axis={axis} form={form} depth={depth} />
      ))}

      {uses.size > 0 && (
        <div className="mt-2">
          <span className="font-semibold text-xs">Used in {uses.size}:</span>
          <div className="mt-0.5 max-h-40 overflow-y-auto text-xs flex flex-wrap gap-x-3 gap-y-0.5">
            {[...uses.values()].map((use) => (
              <FormHover key={form_key(use)} word={use} depth={depth} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Opens a word's popup on hover, from anywhere outside a popup
export function WordHover({ word, children }: { word: Word; children: React.ReactElement }) {
  return (
    <LazyTippy
      content={<FormPopoverContent word={word} current={word} depth={0} />}
      interactive={true}
      delay={[200, 0]}
      theme="light"
    >
      {children}
    </LazyTippy>
  );
}

// An inline reference to a word, showing its current pronunciation. Candidates (no root yet)
// are marked in amber.
export function W(props: { w: string }) {
  const phonology = useContext(PhonologyContext);
  const word = dictionary.get(props.w);
  if (!word) {
    const is_candidate = candidates.some((c) => c.word === props.w);
    return (
      <span
        className={`font-mono text-sm ${is_candidate ? "text-amber-700" : "text-red-600"}`}
        title={is_candidate ? "Candidate: no root yet" : "Not in the dictionary"}
      >
        {props.w}
      </span>
    );
  }
  return (
    <WordHover word={word}>
      <span className="font-mono text-sm whitespace-nowrap cursor-default">
        {word.word} <span className="text-indigo-700">{pronounce(word, phonology)}</span>
      </span>
    </WordHover>
  );
}

// A transliteration as written, with each word opening its popup. Candidates are amber; anything
// else (placeholders like X or …) is left as plain text.
export function Phrase({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  tokenize(text).forEach((token, i) => {
    const start = text.indexOf(token.text, at);
    if (start < 0) return;
    if (start > at) parts.push(text.slice(at, start));
    at = start + token.text.length;
    if (token.kind === "word" && token.word) {
      parts.push(
        <WordHover key={i} word={token.word}>
          <span className="cursor-default hover:underline decoration-dotted">{token.text}</span>
        </WordHover>,
      );
    } else if (token.kind === "word" && token.candidate) {
      parts.push(
        <span key={i} className="text-amber-700" title="Candidate: no root yet">
          {token.text}
        </span>,
      );
    } else {
      parts.push(token.text);
    }
  });
  parts.push(text.slice(at));
  return <>{parts}</>;
}

// An inline transliteration in running text
export function T({ children }: { children: React.ReactNode }) {
  return (
    <i>
      <Phrase text={React.Children.toArray(children).join("")} />
    </i>
  );
}
