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
  dictionary,
  is_root,
  sections,
} from "./dict";
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

  // Wide enough for an axis's word matrix, but never wider than the window
  const computedProps = { maxWidth: "min(960px, calc(100vw - 16px))", ...props };

  computedProps.plugins = [lazyPlugin, ...(props.plugins || [])];

  if (props.render) {
    const render = props.render; // let TypeScript safely derive that render is not undefined
    computedProps.render = (...args) => (mounted ? render(...args) : "");
  } else {
    computedProps.content = mounted ? props.content : "";
  }

  return <Tippy {...computedProps} />;
};

interface WordPopoverContentProps {
  word: Word;
  depth: number; // To manage potential z-index or for debugging
}

export function WordPopoverList(props: { label: string; list: Word[]; depth: number }) {
  const { list, depth, label } = props;
  return (
    <div>
      <span className="font-semibold text-xs">{label}</span>
      <ul className="list-disc list-inside ml-1">
        {list.map((list_word, i) => (
          <li key={`${i}:${list_word.word}`} className="my-0.5">
            <LazyTippy
              content={<WordPopoverContent word={list_word} depth={depth + 1} />}
              placement="right-start"
              interactive={true}
              delay={[100, 0]}
              theme="light"
              popperOptions={{
                strategy: "fixed", // Better for complex layouts
                modifiers: [
                  { name: "preventOverflow", options: { boundary: "clippingParents" } },
                  {
                    name: "flip",
                    options: {
                      fallbackPlacements: ["left-start", "top-start", "bottom-start"],
                    },
                  },
                ],
              }}
            >
              <span className="cursor-pointer hover:underline text-blue-700">{list_word.word}</span>
            </LazyTippy>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Verbs first: the language is verb-centric
const AXIS_COLUMNS = [
  ["verb_i", "intr. verb (no object)"],
  ["verb_t", "tr. verb (with object)"],
  ["noun", "noun"],
  ["adj", "adjective"],
  ["adverb", "adverb"],
] as const;

// The side of its axis a word is on
export function side_of(word: Word): AxisSide | undefined {
  const axis = axis_by_word.get(word);
  if (!axis) return undefined;
  return [axis.positive, axis.negative].find((side) =>
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
      {form("intr.", "verb without an object", side.verb_i.gloss, type !== "relation")}
      {form("tr.", "verb with an object", side.verb_t.gloss)}
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
  current,
  verb,
  applies = true,
  optional = false,
}: {
  cell: AxisCell;
  current: Word;
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
  return (
    <td
      className={`px-1.5 py-0.5 border border-gray-200 whitespace-nowrap
        ${cell.word === current ? "bg-indigo-100 font-semibold" : ""}
        text-gray-800`}
    >
      {cell.gloss ?? cell.word.word}
    </td>
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
// to max_negative. The bare root is the positive step.
function AxisMatrix({ axis, current }: { axis: Axis; current: Word }) {
  const phonology = useContext(PhonologyContext);
  const root_sound = syllable_of(axis.id, phonology);
  const step_sound = (helper: string) => {
    const word = dictionary.get(helper);
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
        {axis.name.word && <span> {axis.name.word.word}</span>}
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
              <tr key={label} className={STEP_TINTS[label] ?? ""}>
                <th
                  className={`pr-1.5 font-normal text-left whitespace-nowrap ${
                    optional ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {label}
                </th>
                <td className="pr-1.5 font-mono text-indigo-700 whitespace-nowrap">{sound}</td>
                {AXIS_COLUMNS.map(([key]) => (
                  <MatrixCell
                    key={key}
                    cell={side[key]}
                    current={current}
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

export const WordPopoverContent: React.FC<WordPopoverContentProps> = ({ word, depth }) => {
  const phonology = useContext(PhonologyContext);
  const is_root_word = is_root(word);
  const { parts, uses, homonyms } = word.data;

  return (
    <div className="p-3 bg-white shadow-lg rounded-md border border-gray-200 text-sm">
      <h3 className="font-bold text-lg">{word.word}</h3>
      <p className="font-mono text-indigo-700 mb-1">{pronounce(word, phonology)}</p>
      {word.data.gloss && <p className="text-xs italic text-gray-600 mb-1">{word.data.gloss}</p>}
      {word.data.notes && <p className="text-xs text-gray-600 mb-1 max-w-xs">{word.data.notes}</p>}
      <p className="text-xs text-gray-500 mb-1">
        Section: {sections.find((s) => s.key === word.data.section)?.label}
      </p>
      {parts.length > 0 ? null : <p className="text-xs text-gray-500 mb-1">ID: {word.data.id}</p>}
      <p
        className={`text-xs font-semibold mb-1 ${
          is_root_word ? "text-green-600" : "text-blue-600"
        }`}
      >
        {is_root_word ? "ROOT" : "COMPOUND"}
      </p>
      {word.data.domain && (
        <p className="text-xs mb-1">
          <span className="font-semibold">Domain:</span> {word.data.domain}
        </p>
      )}
      {word.data.t.length > 0 && (
        <div className="mb-2">
          <span className="font-semibold text-xs">Tags: </span>
          {word.data.t.map((tag) => (
            <span
              key={tag}
              className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 mr-1 mb-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {axis_by_word.has(word) && <AxisMatrix axis={axis_by_word.get(word)!} current={word} />}
      {!is_root_word && parts.length > 0 && (
        <WordPopoverList label="Parts:" list={parts} depth={depth} />
      )}
      {uses.length > 0 && <WordPopoverList label="Uses:" list={uses} depth={depth} />}
      {homonyms.length > 0 && <WordPopoverList label="Homonyms:" list={homonyms} depth={depth} />}
    </div>
  );
};

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
    <LazyTippy
      content={<WordPopoverContent word={word} depth={0} />}
      interactive={true}
      delay={[200, 0]}
      theme="light"
    >
      <span className="font-mono text-sm whitespace-nowrap cursor-default">
        {word.word} <span className="text-indigo-700">{pronounce(word, phonology)}</span>
      </span>
    </LazyTippy>
  );
}
