import React, { useContext, useDeferredValue, useMemo, useState } from "react";
import { type Candidate, T, type Word, candidates, is_root, sections, words } from "./dict";
import { WithContents } from "./contents";
import { pronounce } from "./phonology";
import { PhonologyContext, VerbsByType, WordHover, meaning_line, syllable_count } from "./word_ui";

// Every word, grouped: roots by section, then the axis steps and the other compounds by domain.
// Filters narrow it by text, length, domain and tag; the groups and the contents follow.

const LENGTHS = ["1", "2", "3", "4", "5+"] as const;
type Length = (typeof LENGTHS)[number];

const DOMAINS = [
  ["verb", "Verbs"],
  ["noun", "Nouns"],
  ["adjective", "Adjectives"],
  ["adverb", "Adverbs"],
  ["other", "Other"],
] as const;
type Domain = (typeof DOMAINS)[number][0];

const TAGS = Object.keys(T);

type Sort = "dictionary" | "az" | "short";

// What filtering needs to know about a word, worked out once
type Entry = {
  word: Word;
  text: string; // name, gloss, synonyms and verb meanings, lowercased, for search
  meaning: string;
  syllables: number;
  length: Length;
  domain: Domain;
  group: string; // section key for roots; "axis_step" or "compound" otherwise
};

const entries: Entry[] = words.map((word) => {
  // Without a gloss, a word's synonyms say what it means
  const meaning = meaning_line(word) || (word.data.synonyms ?? []).join(", ");
  const syllables = syllable_count(word);
  const domain = (DOMAINS.find(([d]) => d === word.data.domain)?.[0] ?? "other") as Domain;
  return {
    word,
    text: [word.word, meaning, ...(word.data.synonyms ?? [])].join(" ").toLowerCase(),
    meaning,
    syllables,
    length: syllables >= 5 ? "5+" : (String(syllables) as Length),
    domain,
    group: is_root(word) ? word.data.section : word.data.t.includes(T.axis_word) ? "axis_step" : "compound",
  };
});

type Filters = {
  query: string;
  lengths: Set<Length>;
  domains: Set<Domain>;
  tags: Set<string>;
};

// A query starting with / searches sounds instead: /kan finds words that start with kan
function matcher(query: string, sounds: Map<Word, string>) {
  const q = query.trim().toLowerCase();
  if (!q) return () => true;
  if (q.startsWith("/")) {
    const sound = q.slice(1).replace(/\s+/g, "");
    return (e: Entry) => sounds.get(e.word)!.startsWith(sound);
  }
  return (e: Entry) => e.text.includes(q);
}

// Matches every filter, leaving out one so its chips can count what choosing them would show
function passes(e: Entry, f: Filters, match: (e: Entry) => boolean, skip?: "lengths" | "domains" | "tags") {
  return (
    (skip === "lengths" || f.lengths.size === 0 || f.lengths.has(e.length)) &&
    (skip === "domains" || f.domains.size === 0 || f.domains.has(e.domain)) &&
    (skip === "tags" || f.tags.size === 0 || e.word.data.t.some((t) => f.tags.has(t))) &&
    match(e)
  );
}

const SORTS: Record<Sort, (a: Entry, b: Entry) => number> = {
  dictionary: () => 0,
  az: (a, b) => a.word.word.localeCompare(b.word.word),
  short: (a, b) => a.syllables - b.syllables || a.word.word.localeCompare(b.word.word),
};

type Group = { title: string; entries: Entry[] };
type Part = { title: string; groups: Group[] };

function by_domain(list: Entry[]): Group[] {
  return DOMAINS.map(([d, title]) => ({ title, entries: list.filter((e) => e.domain === d) }));
}

function arrange(list: Entry[]): Part[] {
  return [
    {
      title: "Roots",
      groups: sections.map((s) => ({ title: s.label, entries: list.filter((e) => e.group === s.key) })),
    },
    { title: "Axis steps", groups: by_domain(list.filter((e) => e.group === "axis_step")) },
    { title: "Compounds", groups: by_domain(list.filter((e) => e.group === "compound")) },
  ]
    .map((p) => ({ ...p, groups: p.groups.filter((g) => g.entries.length > 0) }))
    .filter((p) => p.groups.length > 0);
}

function load_view(): "cards" | "list" {
  try {
    return localStorage.getItem("words_view") === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
}

export function WordsView() {
  const phonology = useContext(PhonologyContext);
  const [query, set_query] = useState("");
  const [lengths, set_lengths] = useState<Set<Length>>(new Set());
  const [domains, set_domains] = useState<Set<Domain>>(new Set());
  const [tags, set_tags] = useState<Set<string>>(new Set());
  const [sort, set_sort] = useState<Sort>("dictionary");
  const [view, set_view_state] = useState(load_view);
  const set_view = (v: "cards" | "list") => {
    set_view_state(v);
    try {
      localStorage.setItem("words_view", v);
    } catch {}
  };

  const sounds = useMemo(() => new Map(words.map((w) => [w, pronounce(w, phonology)])), [phonology]);

  // Typing stays responsive: the list catches up with the filters when it can
  const filters = useDeferredValue<Filters>(
    useMemo(() => ({ query, lengths, domains, tags }), [query, lengths, domains, tags]),
  );
  const match = useMemo(() => matcher(filters.query, sounds), [filters.query, sounds]);

  const shown = useMemo(
    () => entries.filter((e) => passes(e, filters, match)).sort(SORTS[sort]),
    [filters, match, sort],
  );
  const parts = useMemo(() => arrange(shown), [shown]);
  const counts = useMemo(() => {
    const tally = <K extends string>(skip: "lengths" | "domains" | "tags", key: (e: Entry) => K[]) => {
      const n = new Map<K, number>();
      for (const e of entries) {
        if (passes(e, filters, match, skip)) for (const k of key(e)) n.set(k, (n.get(k) ?? 0) + 1);
      }
      return n;
    };
    return {
      lengths: tally("lengths", (e) => [e.length]),
      domains: tally("domains", (e) => [e.domain]),
      tags: tally("tags", (e) => e.word.data.t),
    };
  }, [filters, match]);
  const shown_candidates = useMemo(
    () =>
      filters.lengths.size === 0 && filters.domains.size === 0 && filters.tags.size === 0
        ? candidates.filter((c) => [c.word, c.gloss ?? ""].join(" ").toLowerCase().includes(filters.query.trim().toLowerCase()))
        : [],
    [filters],
  );

  const toggle = <K,>(set: (f: (s: Set<K>) => Set<K>) => void, key: K) =>
    set((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const filtered = query !== "" || lengths.size > 0 || domains.size > 0 || tags.size > 0;
  const clear = () => {
    set_query("");
    set_lengths(new Set());
    set_domains(new Set());
    set_tags(new Set());
  };

  const controls = (
    <div className="space-y-3 mb-4 text-sm">
      <input
        type="search"
        placeholder="Search, or /sound"
        value={query}
        onChange={(e) => set_query(e.target.value)}
        className="w-full px-2 py-1 border border-gray-300 rounded"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-gray-600 tabular-nums">
          {shown.length} {shown.length === 1 ? "word" : "words"}
        </span>
        {filtered && (
          <button onClick={clear} className="text-xs text-indigo-700 hover:underline">
            Clear filters
          </button>
        )}
      </div>
      <div className="flex gap-1">
        <Segmented
          options={[
            ["cards", "Cards"],
            ["list", "List"],
          ]}
          value={view}
          on_change={set_view}
        />
        <select
          value={sort}
          onChange={(e) => set_sort(e.target.value as Sort)}
          className="ml-auto px-1 py-0.5 border border-gray-300 rounded text-xs bg-white"
        >
          <option value="dictionary">Dictionary order</option>
          <option value="az">A–Z</option>
          <option value="short">Shortest first</option>
        </select>
      </div>
      <ChipRow
        label="Syllables"
        options={LENGTHS.map((l) => [l, l === "1" ? "1 (roots)" : l])}
        selected={lengths}
        counts={counts.lengths}
        on_toggle={(k) => toggle(set_lengths, k)}
      />
      <ChipRow
        label="Domain"
        options={DOMAINS.map(([d, title]) => [d, title.toLowerCase()])}
        selected={domains}
        counts={counts.domains}
        on_toggle={(k) => toggle(set_domains, k)}
      />
      <ChipRow
        label="Tags"
        options={TAGS.map((t) => [t, t.replace(/_/g, " ")])}
        selected={tags}
        counts={counts.tags}
        on_toggle={(k) => toggle(set_tags, k)}
      />
    </div>
  );

  // The list, made again only when what it shows changes: typing in the search box shouldn't have
  // to go through every word before the box shows what was typed
  const list = useMemo(
    () => (
      <>
        {parts.length === 0 && shown_candidates.length === 0 && (
          <p className="p-4 text-center text-gray-500">No words match.</p>
        )}
        {parts.map((part) => (
          <section key={part.title}>
            <h2
              data-toc={part.title}
              data-count={part.groups.reduce((n, g) => n + g.entries.length, 0)}
              className="text-xl font-bold mt-8 mb-2 pb-1 border-b border-gray-200"
            >
              {part.title}
            </h2>
            {part.groups.map((group) => (
              <section key={group.title}>
                <h3
                  data-toc={group.title}
                  data-count={group.entries.length}
                  className="font-semibold text-gray-700 mt-4 mb-1.5"
                >
                  {group.title} <span className="font-normal text-gray-400">{group.entries.length}</span>
                </h3>
                {view === "cards" ? (
                  <div className="grid gap-1.5 grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
                    {group.entries.map((e) => (
                      <WordCard key={e.word.word} entry={e} sound={sounds.get(e.word)!} />
                    ))}
                  </div>
                ) : (
                  <WordTable entries={group.entries} sounds={sounds} />
                )}
              </section>
            ))}
          </section>
        ))}
        {shown_candidates.length > 0 && (
          <section>
            <h2
              data-toc="Candidates"
              data-count={shown_candidates.length}
              className="text-xl font-bold mt-8 mb-2 pb-1 border-b border-gray-200"
            >
              Candidates <span className="text-sm font-normal text-gray-500">no root yet</span>
            </h2>
            <div className="grid gap-1.5 grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
              {shown_candidates.map((c) => (
                <CandidateCard key={c.word} candidate={c} />
              ))}
            </div>
          </section>
        )}
      </>
    ),
    [parts, shown_candidates, view, sounds],
  );

  const refresh = parts.map((p) => p.title + p.groups.map((g) => g.title + g.entries.length).join()).join();

  return (
    <WithContents view="words" refresh={refresh} sidebar={controls}>
      <div className="p-4">
        <div className="lg:hidden">{controls}</div>
        <div className="-mx-4 -mt-3 mb-2">
          <VerbsByType />
        </div>
        {list}
      </div>
    </WithContents>
  );
}

function Segmented<K extends string>({
  options,
  value,
  on_change,
}: {
  options: [K, string][];
  value: K;
  on_change: (k: K) => void;
}) {
  return (
    <div className="inline-flex rounded border border-gray-300 overflow-hidden text-xs">
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => on_change(k)}
          className={`px-2 py-0.5 ${value === k ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Chips for one filter; each shows how many words choosing it would show, given the other filters
function ChipRow<K extends string>({
  label,
  options,
  selected,
  counts,
  on_toggle,
}: {
  label: string;
  options: (readonly [K, string])[];
  selected: Set<K>;
  counts: Map<K, number>;
  on_toggle: (k: K) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map(([k, text]) => {
          const n = counts.get(k) ?? 0;
          const on = selected.has(k);
          return (
            <button
              key={k}
              onClick={() => on_toggle(k)}
              disabled={n === 0 && !on}
              className={`px-1.5 py-0.5 rounded border text-xs disabled:opacity-40 ${
                on
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {text} <span className={on ? "text-indigo-200" : "text-gray-400"}>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Roots have a green edge and compounds a blue one
const WordCard = React.memo(function WordCard({ entry, sound }: { entry: Entry; sound: string }) {
  const root = entry.syllables === 1;
  return (
    <WordHover word={entry.word} placement="right-start">
      <div
        className={`min-w-0 px-1.5 py-1 rounded border border-gray-200 border-l-4 cursor-default hover:bg-gray-50 ${
          root ? "border-l-green-400" : "border-l-blue-400"
        }`}
      >
        <div className="font-semibold text-sm truncate">{entry.word.word}</div>
        <div className="text-xs truncate" title={entry.meaning}>
          <span className="font-mono text-indigo-700">{sound}</span>
          {entry.meaning && <span className="text-gray-500"> {entry.meaning}</span>}
        </div>
      </div>
    </WordHover>
  );
});

function WordTable({ entries, sounds }: { entries: Entry[]; sounds: Map<Word, string> }) {
  return (
    <table className="w-full table-fixed text-sm border-collapse break-words">
      <thead>
        <tr className="text-left text-xs text-gray-500">
          <th className="font-normal pr-3 w-48">English</th>
          <th className="font-normal pr-3 w-44">Sound</th>
          <th className="font-normal pr-3 w-12 text-right">Syl.</th>
          <th className="font-normal pr-3 w-24">Domain</th>
          <th className="font-normal pr-3 w-64">Parts</th>
          <th className="font-normal">Meaning</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <WordRow key={e.word.word} entry={e} sound={sounds.get(e.word)!} />
        ))}
      </tbody>
    </table>
  );
}

const WordRow = React.memo(function WordRow({ entry, sound }: { entry: Entry; sound: string }) {
  return (
    <tr className="border-t border-gray-100 align-top">
      <td className="pr-3 py-0.5">
        <WordHover word={entry.word} placement="right-start">
          <span className="font-semibold cursor-default hover:underline decoration-dotted">{entry.word.word}</span>
        </WordHover>
      </td>
      <td className="pr-3 py-0.5 font-mono text-indigo-700 break-all">{sound}</td>
      <td className="pr-3 py-0.5 text-right tabular-nums text-gray-500">{entry.syllables}</td>
      <td className="pr-3 py-0.5 text-gray-500">{entry.word.data.domain ?? ""}</td>
      <td className="pr-3 py-0.5 text-gray-600">{entry.word.data.parts.map((p) => p.word).join(" + ")}</td>
      <td className="py-0.5 text-gray-600">{entry.meaning}</td>
    </tr>
  );
});

const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
  <div className="px-1.5 py-1 rounded border border-dashed border-amber-300 bg-amber-50">
    <div className="font-semibold text-sm">{candidate.word}</div>
    <div className="text-xs text-amber-700">{sections.find((s) => s.key === candidate.section)?.label}</div>
    {candidate.gloss && <div className="text-xs italic text-gray-600">{candidate.gloss}</div>}
    {candidate.notes && <div className="text-xs text-gray-600 mt-0.5">{candidate.notes}</div>}
  </div>
);
