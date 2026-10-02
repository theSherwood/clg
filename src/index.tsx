import React, { useState, useMemo, useEffect, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  dictionary,
  words as all_words, // Renamed to avoid conflict
  data_errors,
  roots,
  Word,
  T, // Importing T for tag names
  is_root,
} from "./dict";

import Tippy, { type TippyProps } from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Default tippy styling
import "tippy.js/themes/light.css"; // Optional: a light theme
import {
  type Mark,
  type Phonology,
  check_phonology,
  default_phonology,
  describe_marks,
  load_phonology,
  marks_of,
  pronounce,
  save_phonology,
  syllable_of,
} from "./phonology";

const PhonologyContext = React.createContext<Phonology>(default_phonology);

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

  const computedProps = { ...props };

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

function WordPopoverList(props: { label: string; list: Word[]; depth: number }) {
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

const WordPopoverContent: React.FC<WordPopoverContentProps> = ({ word, depth }) => {
  const phonology = useContext(PhonologyContext);
  const is_root_word = is_root(word);
  const { parts, uses, homonyms } = word.data;

  return (
    <div className="p-3 bg-white shadow-lg rounded-md border border-gray-200 text-sm">
      <h3 className="font-bold text-lg">{word.word}</h3>
      <p className="font-mono text-indigo-700 mb-1">{pronounce(word, phonology)}</p>
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
      {!is_root_word && parts.length > 0 && (
        <WordPopoverList label="Parts:" list={parts} depth={depth} />
      )}
      {uses.length > 0 && <WordPopoverList label="Uses:" list={uses} depth={depth} />}
      {homonyms.length > 0 && <WordPopoverList label="Homonyms:" list={homonyms} depth={depth} />}
    </div>
  );
};

interface WordPreviewItemProps {
  word: Word;
}

const WordPreviewItem: React.FC<WordPreviewItemProps> = ({ word }) => {
  const phonology = useContext(PhonologyContext);
  const is_root_word = is_root(word);
  return (
    <LazyTippy
      content={<WordPopoverContent word={word} depth={0} />}
      placement="right-start"
      interactive={true}
      delay={[200, 50]} // delay: [show, hide]
      theme="light"
      popperOptions={{
        // Ensure popper can flip if not enough space
        strategy: "fixed",
        modifiers: [
          { name: "preventOverflow", options: { boundary: "clippingParents" } },
          {
            name: "flip",
            options: { fallbackPlacements: ["left-start", "top-start", "bottom-start"] },
          },
        ],
      }}
    >
      <div
        className={`border-2 p-2 m-1 rounded cursor-default
                    ${
                      is_root_word ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                    }`}
      >
        <div className="font-semibold">{word.word}</div>
        <div className="font-mono text-xs text-indigo-700">{pronounce(word, phonology)}</div>
        <div className="text-xs">{is_root_word ? "ROOT" : "COMPOUND"}</div>
        {word.data.t.length > 0 && (
          <div className="text-xs mt-1">
            {word.data.t.slice(0, 2).map(
              (
                tag, // Show first 2 tags for brevity
              ) => (
                <span
                  key={tag}
                  className="inline-block bg-gray-100 rounded-full px-1.5 py-0.5 text-xs text-gray-600 mr-1"
                >
                  {tag}
                </span>
              ),
            )}
            {word.data.t.length > 2 && <span className="text-xs text-gray-500">...</span>}
          </div>
        )}
      </div>
    </LazyTippy>
  );
};

interface FilterControlsProps {
  search_text: string;
  on_search_text_change: (text: string) => void;
  available_tags: string[];
  selected_tags: Set<string>;
  on_tag_toggle: (tag: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = React.memo(
  ({ search_text, on_search_text_change, available_tags, selected_tags, on_tag_toggle }) => {
    return (
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search words..."
          value={search_text}
          onChange={(e) => on_search_text_change(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {available_tags.map((tag) => (
            <button
              key={tag}
              onClick={() => on_tag_toggle(tag)}
              className={`px-3 py-1 text-sm rounded-full border
                                ${
                                  selected_tags.has(tag)
                                    ? "bg-indigo-500 text-white border-indigo-500"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    );
  },
);

interface WordListDisplayProps {
  words_to_display: Word[];
}

const WordListDisplay: React.FC<WordListDisplayProps> = ({ words_to_display }) => {
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {words_to_display.map((word) => (
        <WordPreviewItem key={word.word + word.data.id} word={word} />
      ))}
    </div>
  );
};

// Roots view: 256 root IDs = 4^4 glyphs, shown as a 16x16 grid (row = high nibble, column = low nibble)

const SLOT_GROUPS = [
  { key: "grammar_helper", label: "Grammar helpers", swatch: "bg-amber-400" },
  { key: "preposition", label: "Prepositions", swatch: "bg-rose-400" },
  { key: "pronoun", label: "Pronouns", swatch: "bg-fuchsia-400" },
  { key: "axis_helper", label: "Axis helpers", swatch: "bg-violet-400" },
  { key: "misc", label: "Misc roots", swatch: "bg-emerald-400" },
  { key: "axis_word", label: "Axis words", swatch: "bg-sky-400" },
  { key: "digit", label: "Digits", swatch: "bg-slate-400" },
] as const;

type SlotGroupKey = (typeof SLOT_GROUPS)[number]["key"];

function slot_group_of(word: Word): SlotGroupKey {
  if (word.data.domain === "number") return "digit";
  for (const group of SLOT_GROUPS) {
    if (word.data.t.includes(group.key as keyof typeof T)) return group.key;
  }
  return "misc";
}

type Slot = { id: number; roots: Word[]; groups: SlotGroupKey[] };

const slots: Slot[] = roots.map((slot_roots, id) => {
  const words = slot_roots ?? [];
  const present = new Set(words.map(slot_group_of));
  return { id, roots: words, groups: SLOT_GROUPS.map((g) => g.key).filter((k) => present.has(k)) };
});

function empty_ranges(): [number, number][] {
  const ranges: [number, number][] = [];
  for (const slot of slots) {
    if (slot.roots.length > 0) continue;
    const last = ranges.at(-1);
    if (last && last[1] === slot.id - 1) last[1] = slot.id;
    else ranges.push([slot.id, slot.id]);
  }
  return ranges;
}

const swatch_of = Object.fromEntries(SLOT_GROUPS.map((g) => [g.key, g.swatch])) as Record<
  SlotGroupKey,
  string
>;

const SlotCell: React.FC<{ slot: Slot; dimmed: boolean }> = ({ slot, dimmed }) => {
  const phonology = useContext(PhonologyContext);
  const { id, roots: slot_roots, groups } = slot;
  const syllable = syllable_of(id, phonology);
  // Prefer a non-digit word as the cell's label, since digits share IDs with axis words
  const label = (slot_roots.find((w) => slot_group_of(w) !== "digit") ?? slot_roots[0])?.word;

  const cell = (
    <div
      className={`relative h-14 rounded border text-[10px] leading-tight overflow-hidden transition-opacity
        ${slot_roots.length > 0 ? "bg-white border-gray-300" : "bg-gray-50 border-dashed border-gray-300"}
        ${dimmed ? "opacity-20" : ""}`}
    >
      <div className="flex h-1.5">
        {groups.map((g) => (
          <div key={g} className={`flex-1 ${swatch_of[g]}`} />
        ))}
      </div>
      <div className="px-1 pt-0.5 flex justify-between gap-1">
        <span className="text-gray-400">{id}</span>
        <span
          className={`font-mono text-xs ${slot_roots.length > 0 ? "text-indigo-700 font-semibold" : "text-gray-400"}`}
        >
          {syllable}
        </span>
      </div>
      {label && <div className="px-1 truncate font-medium text-gray-800">{label}</div>}
      {slot_roots.length > 1 && (
        <div className="absolute bottom-0.5 right-1 text-gray-400">×{slot_roots.length}</div>
      )}
    </div>
  );

  if (slot_roots.length === 0) return cell;

  return (
    <LazyTippy
      content={
        <div className="p-3 bg-white shadow-lg rounded-md border border-gray-200 text-sm">
          <h3 className="font-bold mb-1">
            ID {id} · <span className="font-mono text-indigo-700">{syllable}</span>
          </h3>
          <WordPopoverList label="Roots:" list={slot_roots} depth={0} />
        </div>
      }
      placement="right-start"
      interactive={true}
      delay={[150, 0]}
      theme="light"
    >
      {cell}
    </LazyTippy>
  );
};

function swap<T>(list: T[], i: number, j: number): T[] {
  const result = [...list];
  [result[i], result[j]] = [result[j]!, result[i]!];
  return result;
}

const MoveButtons: React.FC<{
  index: number;
  on_move: (from: number, to: number) => void;
  vertical?: boolean;
}> = ({ index, on_move, vertical }) => (
  <span className="inline-flex text-gray-400">
    <button
      disabled={index === 0}
      onClick={() => on_move(index, index - 1)}
      className="px-0.5 hover:text-gray-800 disabled:opacity-30"
    >
      {vertical ? "▴" : "‹"}
    </button>
    <button
      disabled={index === 3}
      onClick={() => on_move(index, index + 1)}
      className="px-0.5 hover:text-gray-800 disabled:opacity-30"
    >
      {vertical ? "▾" : "›"}
    </button>
  </span>
);

const sound_input_class =
  "w-10 px-1 py-0.5 border border-gray-300 rounded font-mono text-sm text-center";

const MARK_NAMES: Record<Mark, string> = { C: "consonant", M: "manner", V: "vowel", N: "final" };

function PhonologyPanel(props: { phonology: Phonology; set_phonology: (p: Phonology) => void }) {
  const { phonology, set_phonology } = props;
  const update = (changes: Partial<Phonology>) => set_phonology({ ...phonology, ...changes });
  const report = useMemo(() => check_phonology(phonology), [phonology]);
  const problems = [
    ...report.duplicates.map((d) => `Same syllable for several IDs — ${d}`),
    ...report.onset_final_overlap.map((f) => `"${f}" is both an onset and a final`),
    ...(report.ambiguous_pair_count > 0
      ? [
          `${report.ambiguous_pair_count} two-syllable sequences can be heard two ways, e.g. ${report.ambiguous_pairs.join(", ")}`,
        ]
      : []),
  ];

  return (
    <div className="mb-4 p-3 rounded border border-gray-200 bg-gray-50 text-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Phonology playground</h2>
        <button
          onClick={() => set_phonology(default_phonology)}
          className="px-2 py-0.5 text-xs rounded border border-gray-300 bg-white hover:bg-gray-100"
        >
          Reset
        </button>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">
            ID digits, fastest → slowest
          </div>
          <div className="flex gap-1">
            {phonology.order.map((mark, i) => (
              <span
                key={mark}
                className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-300 bg-white"
              >
                <span title={`×${4 ** i}`}>
                  <span className="font-semibold">{mark}</span>{" "}
                  <span className="text-xs text-gray-500">{MARK_NAMES[mark]}</span>
                </span>
                <MoveButtons
                  index={i}
                  on_move={(a, b) => update({ order: swap(phonology.order, a, b) })}
                />
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">Grid columns: first two · rows: last two</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Onsets (C × M)</div>
          <table>
            <thead>
              <tr>
                <th />
                {phonology.places.map((place, c) => (
                  <th key={place} className="px-0.5 text-xs font-normal text-gray-500">
                    <div>{place}</div>
                    <MoveButtons
                      index={c}
                      on_move={(a, b) =>
                        update({
                          places: swap(phonology.places, a, b),
                          onsets: phonology.onsets.map((row) => swap(row, a, b)),
                        })
                      }
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {phonology.onsets.map((row, m) => (
                <tr key={phonology.manners[m]}>
                  <td className="pr-1 text-xs text-gray-500 text-right whitespace-nowrap">
                    {phonology.manners[m]}
                    <MoveButtons
                      vertical
                      index={m}
                      on_move={(a, b) =>
                        update({
                          manners: swap(phonology.manners, a, b),
                          onsets: swap(phonology.onsets, a, b),
                        })
                      }
                    />
                  </td>
                  {row.map((onset, c) => (
                    <td key={c} className="px-0.5 py-0.5 text-center">
                      <input
                        value={onset}
                        onChange={(e) =>
                          update({
                            onsets: phonology.onsets.map((r, mi) =>
                              mi === m ? r.map((o, ci) => (ci === c ? e.target.value : o)) : r,
                            ),
                          })
                        }
                        className={sound_input_class}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(["vowels", "finals"] as const).map((key) => (
          <div key={key}>
            <div className="text-xs font-semibold text-gray-600 mb-1">
              {key === "vowels" ? "Vowels (V)" : "Finals (N): blank = none, a/b = free variants"}
            </div>
            <div className="flex gap-1">
              {phonology[key].map((sound, i) => (
                <div key={i} className="flex flex-col items-center">
                  <input
                    value={sound}
                    placeholder="∅"
                    onChange={(e) =>
                      update({
                        [key]: phonology[key].map((s, j) => (j === i ? e.target.value : s)),
                      })
                    }
                    className={sound_input_class}
                  />
                  <MoveButtons
                    index={i}
                    on_move={(a, b) => update({ [key]: swap(phonology[key], a, b) })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs">
        {problems.length === 0 ? (
          <span className="text-green-700">
            ✓ 256 distinct syllables, onsets and finals don't overlap, and every two-syllable
            sequence splits only one way
          </span>
        ) : (
          <ul className="text-red-700 list-disc list-inside">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RootsView(props: { phonology: Phonology; set_phonology: (p: Phonology) => void }) {
  const { phonology } = props;
  const [highlighted, set_highlighted] = useState<SlotGroupKey | null>(null);

  // A column fixes the two fastest digits of the ID and a row the two slowest,
  // so describe each by the marks those digits select
  const describe_digits = (id: number, digits: number[]) => {
    const values = marks_of(id, phonology);
    const fixed = Object.fromEntries(
      digits.map((d) => [phonology.order[d]!, values[phonology.order[d]!]]),
    );
    return describe_marks(fixed, phonology);
  };
  const describe_column = (col: number) => describe_digits(col, [0, 1]);
  const describe_row = (row: number) => describe_digits(row * 16, [2, 3]);
  const filled = slots.filter((s) => s.roots.length > 0).length;
  const counts = useMemo(() => {
    const result = {} as Record<SlotGroupKey, number>;
    for (const g of SLOT_GROUPS)
      result[g.key] = slots.filter((s) => s.groups.includes(g.key)).length;
    return result;
  }, []);

  return (
    <div className="p-4">
      <PhonologyPanel {...props} />
      <div className="mb-3 text-sm text-gray-700">
        <span className="font-semibold">{filled}</span> of 256 root IDs filled,{" "}
        <span className="font-semibold">{256 - filled}</span> empty (
        {empty_ranges()
          .map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`))
          .join(", ")}
        )
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {SLOT_GROUPS.map((g) => (
          <button
            key={g.key}
            onMouseEnter={() => set_highlighted(g.key)}
            onMouseLeave={() => set_highlighted(null)}
            onClick={() => set_highlighted((h) => (h === g.key ? null : g.key))}
            className="flex items-center gap-1.5 px-2 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100"
          >
            <span className={`inline-block w-3 h-3 rounded-sm ${g.swatch}`} />
            {g.label}
            <span className="text-gray-400">{counts[g.key]}</span>
          </button>
        ))}
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "5rem repeat(16, minmax(0, 1fr))" }}
      >
        <div />
        {Array.from({ length: 16 }, (_, col) => (
          <div key={col} className="text-center text-xs text-gray-400 leading-tight">
            <div>+{col}</div>
            <div className="font-mono text-indigo-700 truncate">{describe_column(col)}</div>
          </div>
        ))}
        {Array.from({ length: 16 }, (_, row) => (
          <React.Fragment key={row}>
            <div className="text-right pr-1 text-xs text-gray-400 self-center leading-tight">
              <div>{row * 16}</div>
              <div className="font-mono text-indigo-700">{describe_row(row)}</div>
            </div>
            {slots.slice(row * 16, row * 16 + 16).map((slot) => (
              <SlotCell
                key={slot.id}
                slot={slot}
                dimmed={highlighted !== null && !slot.groups.includes(highlighted)}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

type View = "words" | "roots";

function view_from_hash(): View {
  return window.location.hash === "#roots" ? "roots" : "words";
}

function DictionaryView() {
  const [view, set_view] = useState<View>(view_from_hash);
  useEffect(() => {
    const on_hash_change = () => set_view(view_from_hash());
    window.addEventListener("hashchange", on_hash_change);
    return () => window.removeEventListener("hashchange", on_hash_change);
  }, []);

  const [phonology, set_phonology] = useState<Phonology>(load_phonology);
  useEffect(() => save_phonology(phonology), [phonology]);

  const [search_text, set_search_text] = useState("");
  const [selected_tags, set_selected_tags] = useState<Set<string>>(new Set());

  const available_tags = useMemo(() => {
    // Extracting keys from the T object, assuming T is like `export const T = { tagA: "tagA", ... }`
    return Object.keys(T);
  }, []);

  const handle_tag_toggle = (tag: string) => {
    set_selected_tags((prev_tags) => {
      const new_tags = new Set(prev_tags);
      if (new_tags.has(tag)) {
        new_tags.delete(tag);
      } else {
        new_tags.add(tag);
      }
      return new_tags;
    });
  };

  const filtered_words = useMemo(() => {
    return all_words.filter((word) => {
      const matches_search_text = word.word.toLowerCase().includes(search_text.toLowerCase());
      const matches_tags =
        selected_tags.size === 0 || word.data.t.some((tag) => selected_tags.has(tag));
      return matches_search_text && matches_tags;
    });
  }, [search_text, selected_tags]);

  return (
    <PhonologyContext.Provider value={phonology}>
      <div className="font-sans">
        <header className="p-4 bg-indigo-600 text-white text-center">
          <h1 className="text-2xl font-bold">Constructed Language Dictionary</h1>
          <nav className="mt-2 flex justify-center gap-2 text-sm">
            {(["words", "roots"] as const).map((v) => (
              <a
                key={v}
                href={`#${v}`}
                className={`px-3 py-1 rounded-full ${
                  view === v ? "bg-white text-indigo-700" : "text-indigo-100 hover:bg-indigo-500"
                }`}
              >
                {v === "words" ? "Words" : "Roots"}
              </a>
            ))}
          </nav>
        </header>
        {data_errors.length > 0 && (
          <ul className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-700 list-disc list-inside">
            {data_errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        {view === "roots" ? (
          <RootsView phonology={phonology} set_phonology={set_phonology} />
        ) : (
          <>
            <FilterControls
              search_text={search_text}
              on_search_text_change={set_search_text}
              available_tags={available_tags}
              selected_tags={selected_tags}
              on_tag_toggle={handle_tag_toggle}
            />
            {filtered_words.length > 0 ? (
              <WordListDisplay words_to_display={filtered_words} />
            ) : (
              <p className="p-4 text-center text-gray-500">No words match your criteria.</p>
            )}
          </>
        )}
      </div>
    </PhonologyContext.Provider>
  );
}

const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <DictionaryView />
  </React.StrictMode>,
);
