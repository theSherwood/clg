import React, { useContext } from "react";
import {
  type Axis,
  type AxisCell,
  type AxisSide,
  type Scale,
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

  // Wide enough for an axis's word matrix
  const computedProps = { maxWidth: 640, ...props };

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
  ["verb_i", "verb, no object"],
  ["verb_t", "verb, with object"],
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
export function SideVerbs({ side }: { side: AxisSide }) {
  const form = (label: string, title: string, gloss?: string) => (
    <div title={title}>
      <span className="text-gray-500">{label} </span>
      {gloss ? (
        <span className="font-semibold text-gray-800">{gloss}</span>
      ) : (
        <span className="text-red-600">missing</span>
      )}
    </div>
  );
  return (
    <div className="text-xs mt-1">
      {form("intr.", "verb without an object", side.verb_i.gloss)}
      {form("tr.", "verb with an object", side.verb_t.gloss)}
    </div>
  );
}

// Axis sides missing a verb, or one of its two forms
export function VerbGaps() {
  const sides = axes.flatMap((axis) =>
    [axis.positive, axis.negative].filter((side) => Object.values(side).some((c) => c.word)),
  );
  const groups = [
    ["No verb", sides.filter((s) => !s.verb_i.word)],
    ["No intransitive (without an object)", sides.filter((s) => s.verb_i.word && !s.verb_i.gloss)],
    ["No transitive (with an object)", sides.filter((s) => s.verb_t.word && !s.verb_t.gloss)],
  ] as const;
  const complete = sides.filter((s) => s.verb_i.gloss && s.verb_t.gloss).length;
  return (
    <details className="px-4 pt-3 text-sm">
      <summary className="cursor-pointer font-semibold">
        Axis verb gaps: {complete} of {sides.length} axis sides have both verb forms
      </summary>
      <div className="mt-2 space-y-2">
        {groups.map(([label, list]) => (
          <p key={label}>
            <span className="font-semibold text-red-600">
              {label} ({list.length}):
            </span>{" "}
            {list.map(side_name).join(", ")}
          </p>
        ))}
      </div>
    </details>
  );
}

// Missing verbs are red, since they're the gaps that matter most
function MatrixCell({ cell, current, verb }: { cell: AxisCell; current: Word; verb: boolean }) {
  if (!cell.word || (verb && !cell.gloss)) {
    return (
      <td
        className={`px-1.5 py-0.5 border border-gray-200 text-center ${
          verb ? "bg-red-50 text-red-400" : "text-gray-300"
        }`}
      >
        —
      </td>
    );
  }
  return (
    <td
      className={`px-1.5 py-0.5 border border-gray-200 whitespace-nowrap
        ${cell.word === current ? "bg-indigo-50 font-semibold" : ""}
        text-gray-800`}
    >
      {cell.gloss ?? cell.word.word}
    </td>
  );
}

const SCALE_STEPS = ["max_negative", "negative", "min_negative", "neutral", "min_positive", "positive", "max_positive"];

// What each step of the scale means for an axis, from max_negative to max_positive
function ScaleRow({ scale }: { scale: Scale }) {
  return (
    <table className="mt-1.5 text-xs border-collapse">
      <thead>
        <tr>
          {SCALE_STEPS.map((step) => (
            <th key={step} className="px-1.5 pb-0.5 font-normal text-gray-500 text-left">
              {step}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {scale.map((gloss, i) => (
            <td key={i} className="px-1.5 py-0.5 border border-gray-200 whitespace-nowrap text-gray-800">
              {gloss}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

// The whole axis a word belongs to: every form at both ends
function AxisMatrix({ axis, current }: { axis: Axis; current: Word }) {
  const phonology = useContext(PhonologyContext);
  const root_sound = syllable_of(axis.id, phonology);
  const negative = dictionary.get("negative");
  const negative_sound = negative ? `${pronounce(negative, phonology)}.${root_sound}` : "";
  return (
    <div className="mt-2 mb-2">
      <div className="text-xs mb-1">
        <span className="font-semibold">Axis</span>
        {axis.name.word && <span> {axis.name.word.word}</span>}
      </div>
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th />
            {AXIS_COLUMNS.map(([key, label]) => (
              <th key={key} className="px-1.5 pb-0.5 font-normal text-gray-500 text-left">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(
            [
              ["root", root_sound, axis.positive],
              ["negative", negative_sound, axis.negative],
            ] as const
          ).map(([label, sound, side]) => (
            <tr key={label}>
              <th className="pr-1.5 font-normal text-gray-500 text-left whitespace-nowrap">
                {label} <span className="font-mono text-indigo-700">{sound}</span>
              </th>
              {AXIS_COLUMNS.map(([key]) => (
                <MatrixCell
                  key={key}
                  cell={side[key]}
                  current={current}
                  verb={key === "verb_i" || key === "verb_t"}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {axis.scale && <ScaleRow scale={axis.scale} />}
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
