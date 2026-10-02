import React, { useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  dictionary,
  words as all_words, // Renamed to avoid conflict
  data_errors,
  Word,
  T, // Importing T for tag names
  is_root,
} from "./dict";

import Tippy, { type TippyProps } from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Default tippy styling
import "tippy.js/themes/light.css"; // Optional: a light theme

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
  const is_root_word = is_root(word);
  const { parts, uses, homonyms } = word.data;

  return (
    <div className="p-3 bg-white shadow-lg rounded-md border border-gray-200 text-sm">
      <h3 className="font-bold text-lg mb-1">{word.word}</h3>
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

function DictionaryView() {
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
    <div className="font-sans">
      <header className="p-4 bg-indigo-600 text-white text-center">
        <h1 className="text-2xl font-bold">Constructed Language Dictionary</h1>
      </header>
      {data_errors.length > 0 && (
        <ul className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-700 list-disc list-inside">
          {data_errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
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
    </div>
  );
}

const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <DictionaryView />
  </React.StrictMode>,
);
