import React, { useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  dictionary,
  words as allWords, // Renamed to avoid conflict
  Word,
  T, // Importing T for tag names
  is_root,
} from "./dict";

import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Default tippy styling
import "tippy.js/themes/light.css"; // Optional: a light theme

// Helper to get Word object from its ID (assuming IDs are unique in WordData)
const getWordFromPartId = (partId: number): Word | undefined => {
  return allWords.find((w) => w.data.id === partId);
};

interface WordPopoverContentProps {
  word: Word;
  depth: number; // To manage potential z-index or for debugging
}

const WordPopoverContent: React.FC<WordPopoverContentProps> = ({ word, depth }) => {
  const isRootWord = is_root(word);
  const parts = word.data.parts
    ?.map((partId) => getWordFromPartId(partId))
    .filter((w): w is Word => Boolean(w)); // Get Word objects for parts

  return (
    <div className="p-3 bg-white shadow-lg rounded-md border border-gray-200 text-sm">
      <h3 className="font-bold text-lg mb-1">{word.word}</h3>
      <p className="text-xs text-gray-500 mb-1">ID: {word.data.id}</p>
      <p
        className={`text-xs font-semibold mb-1 ${isRootWord ? "text-green-600" : "text-blue-600"}`}
      >
        {isRootWord ? "ROOT" : "COMPOUND"}
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
      {!isRootWord && parts && parts.length > 0 && (
        <div>
          <span className="font-semibold text-xs">Parts:</span>
          <ul className="list-disc list-inside ml-1">
            {parts.map((partWord) => (
              <li key={partWord.word} className="my-0.5">
                <Tippy
                  content={<WordPopoverContent word={partWord} depth={depth + 1} />}
                  placement="right-start"
                  interactive={true}
                  delay={[100, 0]}
                  theme="light"
                  appendTo={() => document.body} // Important for stacking contexts
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
                  <span className="cursor-pointer hover:underline text-blue-700">
                    {partWord.word}
                  </span>
                </Tippy>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface WordPreviewItemProps {
  word: Word;
}

const WordPreviewItem: React.FC<WordPreviewItemProps> = ({ word }) => {
  const isRootWord = is_root(word);
  return (
    <Tippy
      content={<WordPopoverContent word={word} depth={0} />}
      placement="right-start"
      interactive={true}
      delay={[200, 50]} // delay: [show, hide]
      theme="light"
      appendTo={() => document.body} // Important for stacking contexts and overflow
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
                    ${isRootWord ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}
      >
        <div className="font-semibold">{word.word}</div>
        <div className="text-xs">{isRootWord ? "ROOT" : "COMPOUND"}</div>
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
    </Tippy>
  );
};

interface FilterControlsProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  availableTags: string[];
  selectedTags: Set<string>;
  onTagToggle: (tag: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = React.memo(
  ({ searchText, onSearchTextChange, availableTags, selectedTags, onTagToggle }) => {
    return (
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search words..."
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-1 text-sm rounded-full border
                                ${
                                  selectedTags.has(tag)
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
  wordsToDisplay: Word[];
}

const WordListDisplay: React.FC<WordListDisplayProps> = ({ wordsToDisplay }) => {
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {wordsToDisplay.map((word) => (
        <WordPreviewItem key={word.word + word.data.id} word={word} />
      ))}
    </div>
  );
};

function DictionaryView() {
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const availableTags = useMemo(() => {
    // Extracting keys from the T object, assuming T is like `export const T = { tagA: "tagA", ... }`
    return Object.keys(T);
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prevTags) => {
      const newTags = new Set(prevTags);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  };

  const filteredWords = useMemo(() => {
    return allWords.filter((word) => {
      const matchesSearchText = word.word.toLowerCase().includes(searchText.toLowerCase());
      const matchesTags =
        selectedTags.size === 0 || word.data.t.some((tag) => selectedTags.has(tag));
      return matchesSearchText && matchesTags;
    });
  }, [allWords, searchText, selectedTags]);

  return (
    <React.StrictMode>
      <div className="font-sans">
        <header className="p-4 bg-indigo-600 text-white text-center">
          <h1 className="text-2xl font-bold">Constructed Language Dictionary</h1>
        </header>
        <FilterControls
          searchText={searchText}
          onSearchTextChange={setSearchText}
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
        />
        {filteredWords.length > 0 ? (
          <WordListDisplay wordsToDisplay={filteredWords} />
        ) : (
          <p className="p-4 text-center text-gray-500">No words match your criteria.</p>
        )}
      </div>
    </React.StrictMode>
  );
}

const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(<DictionaryView />);
