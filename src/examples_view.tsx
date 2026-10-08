import React, { useContext, useMemo } from "react";
import {
  type Article,
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
  posture_examples,
  moving_examples,
  part_examples,
  sight_examples,
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
  babel_verses,
  north_wind_sentences,
  lords_prayer,
} from "./examples";
import { swadesh, toki_pona_words } from "./comparison";
import { ComparisonTable, TallyLine } from "./comparison_view";
import { adapt_foreign, pronounce } from "./phonology";
import { WithContents } from "./contents";
import { PhonologyContext, Spoken, WordHover } from "./word_ui";

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
  return <WordHover word={word}>{box}</WordHover>;
};

// A foreign name or borrowing, respelled in our syllables
const ForeignBox: React.FC<{ text: string }> = ({ text }) => {
  const phonology = useContext(PhonologyContext);
  return (
    <span className="inline-flex flex-col items-center px-1 rounded border border-gray-200 text-xs leading-tight">
      <span className="text-gray-700 italic">{text}</span>
      <span className="font-mono text-indigo-700">{adapt_foreign(text, phonology).join("-")}</span>
    </span>
  );
};

// Each word over its sound, then the whole thing as it would be spoken, with gaps for words that
// don't have roots yet
function Interlinear({ transliteration }: { transliteration: string }) {
  const tokens = useMemo(() => tokenize(transliteration), [transliteration]);
  return (
    <div>
      <div className="flex flex-wrap gap-1 items-end mb-1">
        {tokens.map((t, i) =>
          t.kind === "punctuation" ? (
            <span key={i} className="text-gray-500 px-0.5">
              {t.text}
            </span>
          ) : t.kind === "foreign" ? (
            <ForeignBox key={i} text={t.text} />
          ) : (
            <TokenBox key={i} token={t} />
          ),
        )}
      </div>
      <Spoken transliteration={transliteration} />
    </div>
  );
}

// A heading the contents column lists; level 4 headings are left out of it
function Section({
  title,
  level = 2,
  children,
}: {
  title: string;
  level?: 2 | 3 | 4;
  children: React.ReactNode;
}) {
  const heading =
    level === 2 ? (
      <h2 data-toc className="text-xl font-bold mt-10 mb-3 pb-1 border-b border-gray-200">
        {title}
      </h2>
    ) : level === 3 ? (
      <h3 data-toc className="text-lg font-semibold mt-6 mb-2">
        {title}
      </h3>
    ) : (
      <h4 className="font-semibold text-gray-700 mt-4 mb-2">{title}</h4>
    );
  return (
    <section>
      {heading}
      {children}
    </section>
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

// Passages of a longer text, each in English over its translation
function ArticleList({ articles }: { articles: Article[] }) {
  return (
    <div className="space-y-5">
      {articles.map((a) => (
        <div key={a.title}>
          <h3 className="font-semibold text-sm">{a.title}</h3>
          {a.english.map((p) => (
            <p key={p} className="text-sm text-gray-600 mb-1">
              {p}
            </p>
          ))}
          {a.transliteration && <Interlinear transliteration={a.transliteration} />}
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
  ...posture_examples.map((e) => e.transliteration),
  ...moving_examples.map((e) => e.transliteration),
  ...part_examples.map((e) => e.transliteration),
  ...sight_examples.map((e) => e.transliteration),
  ...clause_examples.map((e) => e.transliteration),
  ...direction_examples.map((e) => e.transliteration),
  ...arithmetic_examples.map((e) => e.transliteration),
  ...more_grammar_examples.map((e) => e.transliteration),
  ...conversation_examples.map((e) => e.transliteration),
  ...[...udhr_preamble, ...udhr_articles, ...babel_verses, ...north_wind_sentences, ...lords_prayer].flatMap(
    (a) => (a.transliteration ? [a.transliteration] : []),
  ),
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

const topics: { title: string; examples: Example[] }[] = [
  { title: "Tense and aspect", examples: tense_examples },
  { title: "Units of time and order", examples: time_examples },
  { title: "Truth and possibility", examples: truth_examples },
  { title: "Family", examples: family_examples },
  { title: "Colors", examples: color_examples },
  { title: "Nouns from verbs", examples: role_examples },
  { title: "Questions", examples: question_examples },
  { title: "Here and there", examples: pointing_examples },
  { title: "Clauses", examples: clause_examples },
  { title: "Being, ability, must and may, rights, choice, reasoning, again, ordinals and per", examples: more_grammar_examples },
  { title: "Conversation", examples: conversation_examples },
  { title: "Self and other", examples: self_other_examples },
  { title: "Posture", examples: posture_examples },
  { title: "Moving", examples: moving_examples },
  { title: "Parts of things", examples: part_examples },
  { title: "Seeing and showing", examples: sight_examples },
  { title: "Water and fire", examples: water_fire_examples },
  { title: "Sky", examples: sky_examples },
  { title: "Directions", examples: direction_examples },
  { title: "Arithmetic", examples: arithmetic_examples },
  { title: "Comparison", examples: comparison_examples },
  { title: "Geometry", examples: geometry_examples },
  { title: "Things, animals and matter", examples: thing_examples },
];

export function ExamplesView() {
  const { total, rooted, candidates, missing } = useMemo(coverage, []);
  const translated = [...udhr_preamble, ...udhr_articles].filter((a) => a.transliteration);
  const untranslated = [...udhr_preamble, ...udhr_articles].filter((a) => !a.transliteration);
  const tally = (list: [string, number][]) => list.map(([w, n]) => `${w}${n > 1 ? ` ×${n}` : ""}`).join(", ");
  return (
    <WithContents view="examples">
      <div className="p-4 max-w-5xl mx-auto">
        <h1 className="text-xl font-bold mb-1">Worked examples</h1>
        <p className="text-sm text-gray-600 mb-3">
          Each word shows its current sound, so these follow the phonology playground; hover a word
          or a sound for details. <span className="text-amber-700">Candidates</span> have no root
          yet, and <span className="text-red-600">missing</span> words aren't in the dictionary at
          all.
        </p>
        <div className="p-3 rounded border border-gray-200 bg-gray-50 text-sm">
          <p>
            <span className="font-semibold">{rooted}</span> of {total} words in these examples
            have roots.
          </p>
          {candidates.length > 0 && (
            <p className="mt-1">
              <span className="font-semibold text-amber-700">Candidates used:</span> {tally(candidates)}
            </p>
          )}
          {missing.length > 0 && (
            <p className="mt-1">
              <span className="font-semibold text-red-600">Missing:</span> {tally(missing)}
            </p>
          )}
        </div>

        <Section title="Standard texts">
          <Section title="The Tower of Babel" level={3}>
            <p className="text-sm text-gray-600 mb-3">
              Genesis 11:1–9 in the King James Version, the text conlangs are traditionally
              compared on.
            </p>
            <ArticleList articles={babel_verses} />
          </Section>

          <Section title="The North Wind and the Sun" level={3}>
            <p className="text-sm text-gray-600 mb-3">
              Aesop's fable as the Handbook of the International Phonetic Association tells it, the
              passage used to illustrate every language.
            </p>
            <ArticleList articles={north_wind_sentences} />
          </Section>

          <Section title="The Lord's Prayer" level={3}>
            <p className="text-sm text-gray-600 mb-3">
              In the Book of Common Prayer's words, the traditional text for comparing languages.
            </p>
            <ArticleList articles={lords_prayer} />
          </Section>

          <Section title="Universal Declaration of Human Rights" level={3}>
            <ArticleList articles={translated} />
            {untranslated.length > 0 && (
              <div className="mt-6 text-sm">
                <h4 className="font-semibold">Not translated yet: {untranslated.length}</h4>
                <div className="mt-2 space-y-3 text-gray-600">
                  {untranslated.map((a) => (
                    <div key={a.title}>
                      <h5 className="font-semibold text-gray-800">{a.title}</h5>
                      {a.english.map((p) => (
                        <p key={p} className="mb-1">
                          {p}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </Section>

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

        <Section title="Topics">
          <Section title="Numbers" level={3}>
            {number_examples.map((base) => (
              <Section key={base.title} title={base.title} level={4}>
                <ExampleList examples={base.examples} />
              </Section>
            ))}
          </Section>
          {topics.map((group) => (
            <Section key={group.title} title={group.title} level={3}>
              <ExampleList examples={group.examples} />
            </Section>
          ))}
        </Section>
      </div>
    </WithContents>
  );
}
