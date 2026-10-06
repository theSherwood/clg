import React, { useContext, useMemo } from "react";
import {
  type Example,
  type Token,
  number_examples,
  arithmetic_examples,
  conversation_examples,
  more_grammar_examples,
  clause_examples,
  color_examples,
  comparison_examples,
  direction_examples,
  family_examples,
  geometry_examples,
  pointing_examples,
  question_examples,
  role_examples,
  self_other_examples,
  sky_examples,
  tense_examples,
  time_examples,
  thing_examples,
  tokenize,
  truth_examples,
  udhr_articles,
  water_fire_examples,
  udhr_preamble,
} from "./examples";
import { swadesh, toki_pona_words } from "./comparison";
import { ComparisonTable, TallyLine } from "./comparison_view";
import { pronounce } from "./phonology";
import { FormPopoverContent, LazyTippy, PhonologyContext } from "./word_ui";

type WordToken = Extract<Token, { kind: "word" }>;

const TokenBox: React.FC<{ token: WordToken }> = ({ token }) => {
  const phonology = useContext(PhonologyContext);
  const { word, candidate } = token;
  const box = (
    <span
      className={`inline-flex flex-col items-center px-1 rounded border text-xs leading-tight
        ${word ? "border-gray-200" : candidate ? "border-dashed border-amber-400 bg-amber-50" : "border-dashed border-red-300 bg-red-50"}`}
    >
      <span className="text-gray-700">{token.text}</span>
      <span
        className={`font-mono ${word ? "text-indigo-700" : candidate ? "text-amber-700" : "text-red-600"}`}
      >
        {word ? pronounce(word, phonology) : candidate ? "candidate" : "missing"}
      </span>
    </span>
  );
  if (!word) return box;
  return (
    <LazyTippy
      content={<FormPopoverContent word={word} current={word} depth={0} />}
      interactive={true}
      delay={[200, 0]}
      theme="light"
    >
      {box}
    </LazyTippy>
  );
};

// Each word over its sound, then the whole thing as it would be spoken, with gaps for words that
// don't have roots yet
function Interlinear({ transliteration }: { transliteration: string }) {
  const phonology = useContext(PhonologyContext);
  const tokens = useMemo(() => tokenize(transliteration), [transliteration]);
  const spoken = tokens
    .map((t) => (t.kind === "punctuation" ? t.text : t.word ? pronounce(t.word, phonology) : "___"))
    .join(" ")
    .replace(/ ([.,;])/g, "$1");
  return (
    <div>
      <div className="flex flex-wrap gap-1 items-end">
        {tokens.map((t, i) =>
          t.kind === "punctuation" ? (
            <span key={i} className="text-gray-500 px-0.5">
              {t.text}
            </span>
          ) : (
            <TokenBox key={i} token={t} />
          ),
        )}
      </div>
      <p className="mt-1 font-mono text-sm text-indigo-800">{spoken}</p>
    </div>
  );
}

// A section that collapses to its heading, closed to start with; open, its body is boxed
function Section({
  title,
  level = 2,
  children,
}: {
  title: string;
  level?: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <details className="mb-1 [&[open]]:mb-4 [&[open]>summary]:mb-2">
      <summary
        className={`cursor-pointer ${
          level === 2 ? "text-lg font-semibold" : "font-semibold text-gray-700"
        }`}
      >
        {title}
      </summary>
      <div className="rounded border border-gray-200 p-3">{children}</div>
    </details>
  );
}

function ExampleList({ examples }: { examples: Example[] }) {
  return (
    <div className="space-y-4">
      {examples.map((e) => (
        <div key={e.title}>
          <h4 className="font-semibold text-sm">
            {e.title} <span className="font-normal text-gray-500">· {e.english}</span>
          </h4>
          <Interlinear transliteration={e.transliteration} />
        </div>
      ))}
    </div>
  );
}

const all_transliterations = [
  ...number_examples.flatMap((b) => b.examples.map((e) => e.transliteration)),
  ...tense_examples.map((e) => e.transliteration),
  ...time_examples.map((e) => e.transliteration),
  ...truth_examples.map((e) => e.transliteration),
  ...family_examples.map((e) => e.transliteration),
  ...color_examples.map((e) => e.transliteration),
  ...role_examples.map((e) => e.transliteration),
  ...question_examples.map((e) => e.transliteration),
  ...self_other_examples.map((e) => e.transliteration),
  ...water_fire_examples.map((e) => e.transliteration),
  ...sky_examples.map((e) => e.transliteration),
  ...comparison_examples.map((e) => e.transliteration),
  ...geometry_examples.map((e) => e.transliteration),
  ...thing_examples.map((e) => e.transliteration),
  ...pointing_examples.map((e) => e.transliteration),
  ...clause_examples.map((e) => e.transliteration),
  ...direction_examples.map((e) => e.transliteration),
  ...arithmetic_examples.map((e) => e.transliteration),
  ...more_grammar_examples.map((e) => e.transliteration),
  ...conversation_examples.map((e) => e.transliteration),
  ...udhr_articles.flatMap((a) => (a.transliteration ? [a.transliteration] : [])),
];

// Words the examples need that have no root, most used first
function coverage() {
  const tokens = all_transliterations.flatMap(tokenize).filter((t) => t.kind === "word");
  const count = (list: WordToken[]) => {
    const counts = new Map<string, number>();
    for (const t of list) {
      const key = t.candidate?.word ?? t.text.replace(/\?$/, "");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };
  return {
    total: tokens.length,
    rooted: tokens.filter((t) => t.word).length,
    candidates: count(tokens.filter((t) => !t.word && t.candidate)),
    missing: count(tokens.filter((t) => !t.word && !t.candidate)),
  };
}

export function ExamplesView() {
  const { total, rooted, candidates, missing } = useMemo(coverage, []);
  const translated = udhr_articles.filter((a) => a.transliteration);
  const untranslated = udhr_articles.filter((a) => !a.transliteration);
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Worked examples</h1>
      <p className="text-sm text-gray-600 mb-3">
        Each word shows its current sound, so these follow the phonology playground.{" "}
        <span className="text-amber-700">Candidates</span> have no root yet, and{" "}
        <span className="text-red-600">missing</span> words aren't in the dictionary at all.
      </p>
      <div className="mb-6 p-3 rounded border border-gray-200 bg-gray-50 text-sm">
        <p>
          <span className="font-semibold">{rooted}</span> of {total} words in these examples have
          roots.
        </p>
        <p className="mt-1">
          <span className="font-semibold text-amber-700">Candidates used:</span>{" "}
          {candidates.map(([w, n]) => `${w}${n > 1 ? ` ×${n}` : ""}`).join(", ")}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-red-600">Missing:</span>{" "}
          {missing.map(([w, n]) => `${w}${n > 1 ? ` ×${n}` : ""}`).join(", ")}
        </p>
      </div>

      <Section title="Compared with Toki Pona">
        <p className="text-sm text-gray-600 mb-3">
          The goal is to be at least as convenient as Toki Pona. Syllable counts are green where
          ours is shorter and red where it's longer. Toki Pona often covers several of these
          concepts with one broad word (noka for foot, leg and knee), so shorter here isn't always
          like for like. <span className="text-amber-700">Loose</span> equivalents are near
          misses.
        </p>
        <Section title="Swadesh 100" level={3}>
          <TallyLine rows={swadesh} />
          <ComparisonTable rows={swadesh} />
        </Section>
        <Section title="Toki Pona's words" level={3}>
          <TallyLine rows={toki_pona_words} />
          <ComparisonTable rows={toki_pona_words} />
        </Section>
      </Section>

      <Section title="Numbers">
        {number_examples.map((base) => (
          <Section key={base.title} title={base.title} level={3}>
            <ExampleList examples={base.examples} />
          </Section>
        ))}
      </Section>

      {[
        { title: "Tense and aspect", examples: tense_examples },
        { title: "Units of time and order", examples: time_examples },
        { title: "Truth and possibility", examples: truth_examples },
        { title: "Family", examples: family_examples },
        { title: "Colors", examples: color_examples },
        { title: "Nouns from verbs", examples: role_examples },
        { title: "Questions", examples: question_examples },
        { title: "Here and there", examples: pointing_examples },
        { title: "Clauses", examples: clause_examples },
        { title: "Being, ability, again and ordinals", examples: more_grammar_examples },
        { title: "Conversation", examples: conversation_examples },
        { title: "Self and other", examples: self_other_examples },
        { title: "Water and fire", examples: water_fire_examples },
        { title: "Sky", examples: sky_examples },
        { title: "Directions", examples: direction_examples },
        { title: "Arithmetic", examples: arithmetic_examples },
        { title: "Comparison", examples: comparison_examples },
        { title: "Geometry", examples: geometry_examples },
        { title: "Things, animals and matter", examples: thing_examples },
      ].map((group) => (
        <Section key={group.title} title={group.title}>
          <ExampleList examples={group.examples} />
        </Section>
      ))}

      <Section title="Universal Declaration of Human Rights">
        <div className="space-y-5">
          {translated.map((a) => (
            <div key={a.title}>
              <h3 className="font-semibold text-sm">{a.title}</h3>
              {a.english.map((p) => (
                <p key={p} className="text-sm text-gray-600 mb-1">
                  {p}
                </p>
              ))}
              <Interlinear transliteration={a.transliteration!} />
            </div>
          ))}
        </div>
        <details className="mt-6 text-sm">
          <summary className="cursor-pointer font-semibold">
            Not translated yet: preamble and {untranslated.length} articles
          </summary>
          <div className="mt-2 space-y-3 text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800">Preamble</h3>
              {udhr_preamble.map((p) => (
                <p key={p} className="mb-1">
                  {p}
                </p>
              ))}
            </div>
            {untranslated.map((a) => (
              <div key={a.title}>
                <h3 className="font-semibold text-gray-800">{a.title}</h3>
                {a.english.map((p) => (
                  <p key={p} className="mb-1">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </details>
      </Section>
    </div>
  );
}
