import React from "react";
import { sections } from "./dict";
import { W } from "./word_ui";

// Grammar and syntax, as decided so far. Word references use <W>, so they show each word's
// current sound and follow the phonology playground.

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-lg font-semibold mt-6 mb-2">{children}</h2>
);

const Open: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="my-2 px-2 py-1 border-l-4 border-amber-400 bg-amber-50 text-sm">
    <span className="font-semibold text-amber-800">Open: </span>
    {children}
  </p>
);

const Example: React.FC<{ children: React.ReactNode; meaning: string }> = ({
  children,
  meaning,
}) => (
  <div className="my-2 pl-3 border-l-2 border-gray-200 text-sm">
    <div className="font-mono">{children}</div>
    <div className="text-gray-600">“{meaning}”</div>
  </div>
);

export function GrammarView() {
  return (
    <div className="p-4 max-w-3xl mx-auto text-gray-800 leading-relaxed">
      <h1 className="text-xl font-bold">Grammar and syntax</h1>
      <p className="text-sm text-gray-600">
        A working draft. Words are shown with their current sound; hover one for details. Amber
        words are candidates with no root yet.
      </p>

      <H2>Words and sounds</H2>
      <p>
        Every root is one syllable, written as one glyph. A glyph has four marks with four states
        each, so there are 4⁴ = 256 roots and 256 possible syllables; no other syllables exist.
      </p>
      <p className="mt-2">
        A syllable is <b>C M V N</b>: a consonant, its manner (unvoiced, voiced, fricative, voiced
        fricative), a vowel (a, e, o, u) and a final (none, n/m, r/l, y). Onsets and finals share no
        sounds, so the boundary between syllables is always audible, even when a syllable has no
        final. n/m and r/l are each a single sound; speakers can use either. The exact inventory and
        the order that maps IDs to syllables are set in the playground on the Roots page.
      </p>
      <p className="mt-2">
        Compounds work like Toki Pona's: a sequence of roots read as one word. Unusually, the
        syllables in a compound never change each other's sounds; a compound sounds exactly like its
        roots said in a row.
      </p>
      <Open>Stress. There's no stress rule yet; the plan is a simple one.</Open>

      <H2>The root space</H2>
      <p>
        IDs 0–127 are core words. IDs 128–255 are shared: they're read by domain, as digits in the
        number domain or as axis words otherwise. Domain words must be in 0–127 so they're never
        ambiguous. Each kind of word has a section with room to grow:
      </p>
      <table className="mt-2 text-sm">
        <tbody>
          {sections.map((s) => (
            <tr key={s.key}>
              <td className="pr-4 font-mono text-gray-500">
                {s.start}–{s.end - 1}
              </td>
              <td>{s.label}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H2>Domains</H2>
      <p>
        Noun and verb are full domains, marked by domain words. Adjective and adverb are implicit: a
        word in modifier position, trailing a noun or verb, is read as an adjective or adverb.
      </p>
      <p className="mt-2">
        The first six roots are special grammar markers, and they're also domain words:{" "}
        <W w="_subject" />, <W w="_object" />, <W w="_verb" />, <W w="_verb(prescriptive)" />,{" "}
        <W w="_verb(interrogative)" /> and <W w="_gerund" />.
      </p>
      <p className="mt-2">
        Partial domains reuse a restricted part of the root space. For now the content root{" "}
        <W w="number" /> marks the number domain, reading the roots 128–255 as the digits 0–127.
        Since most people don't count in base 128, <W w="finger_number" /> (base 10) and{" "}
        <W w="simple_number" /> (base 2) are planned, along with <W w="magnitude" /> and{" "}
        <W w="color" />.
      </p>
      <p className="mt-2">
        <W w="_er" /> and <W w="_ee" /> turn a verb into a noun for its subject or object, after
        English employer and employee: <i>_er eat</i> is “eater”, <i>_ee eat</i> is “what is eaten”.
      </p>
      <Open>
        Should <W w="direction" /> be a domain specifier?
      </Open>

      <H2>Sentences</H2>
      <p>
        Role markers come before their phrases: <W w="_subject" /> before the subject,{" "}
        <W w="_verb" /> (or another verb specifier) before the verb, <W w="_object" /> before the
        object. Every draft so far is in subject–verb–object order. State verbs like <W w="is" />{" "}
        and <W w="possess" /> are ordinary verbs, marked with <W w="_verb" /> like any other.
      </p>
      <Example meaning="Everyone has the right to life, liberty and security of person.">
        &lt;subject&gt; person all &lt;verb&gt; possess &lt;object&gt; right of life and freedom and
        safety.
      </Example>
      <p>
        <W w="_verb(prescriptive)" /> makes a verb prescriptive or imperative (should, shall), and{" "}
        <W w="_verb(interrogative)" /> makes it a question.
      </p>
      <Example meaning="No one shall be held in slavery.">
        &lt;subject&gt; person none &lt;verb (prescriptive)&gt; is &lt;object&gt; slave.
      </Example>

      <H2>Modifiers</H2>
      <p>
        Modifiers follow what they modify: <i>person all</i> is “everyone”, <i>person none</i> is
        “no one”.
      </p>
      <p className="mt-2">
        Opposites and scales come from <b>axes</b>. Each axis has one root for its positive end,
        used across the noun, adjective, verb and adverb domains (<W w="big" />, <W w="bigness" />,{" "}
        <W w="grow(v)" />, <W w="hugely" />
        ). The negative end is <W w="negative" /> plus the positive (<W w="small" />
        ), and the axis itself is <W w="axis_of" /> plus the positive noun (<W w="size" />
        ). A seven-step scale grades axis words: <W w="max_negative" />, <W w="negative" />,{" "}
        <W w="min_negative" />, <W w="neutral" />, <W w="min_positive" />, <W w="positive" />,{" "}
        <W w="max_positive" />. <W w="not" /> is the complement, for axis words too.
      </p>
      <Open>
        Order in compounds. Axis compounds put the operator first (<i>negative big</i>,{" "}
        <i>axis_of bigness</i>), while phrases put modifiers after the head (<i>person all</i>).
      </Open>

      <H2>Prepositions</H2>
      <p>
        A preposition opens a phrase and <W w="preposition_ender" /> closes it. The prepositions are{" "}
        <W w="with" />, <W w="to" />, <W w="from" />, <W w="by" />, <W w="for" /> and{" "}
        <W w="in_of_about" />, which covers in, of, about, with regards to and in terms of.
      </p>
      <Example meaning="…equal in dignity and rights.">
        free and equal &lt;in&gt; value and privilege &lt;/in&gt;
      </Example>

      <H2>Conjunctions and clauses</H2>
      <p>
        <W w="and" />, <W w="or" /> and <W w="if" />. Exclusive forms are compounds: xor is
        “or-exclusive” and iff is “if-exclusive”. Planned: <W w="clause_and" /> and{" "}
        <W w="list_and" /> to tell joining clauses from joining list items, and <W w="open_paren" />{" "}
        / <W w="close_paren" /> to mark where a clause starts and ends.
      </p>

      <H2>Pronouns</H2>
      <p>
        <W w="pronoun(first_person)" />, <W w="pronoun(second_person)" /> and{" "}
        <W w="pronoun(third_person)" />, with number made by compounds: “me” is
        first_person-singular, “we” first_person-plural (also -inclusive and -exclusive), “y'all”
        second_person-plural. The third person can optionally specify plural and gender or sex.{" "}
        <W w="this" /> and <W w="that" /> might become “it-near” and “it-far”.
      </p>

      <H2>Numbers</H2>
      <p>
        A number is a domain word followed by digits, most significant first. <W w="magnitude" />{" "}
        works like scientific notation: <i>finger number 2 magnitude 3</i> is 2 × 10³ = 2000. It
        takes exactly one argument, normally a single digit root; a larger magnitude needs a
        subclause with its own number. Negative magnitudes give fractions and percents (
        <i>finger number 2 3 magnitude negative 2</i> is 23%).
      </p>
      <p className="mt-2">
        Magnitude doesn't depend on the base: <i>magnitude 3</i> is “thousands” in base 10 but
        “eights” in base 2. It needn't follow every digit; base 10 might state it every three places
        (thousands, millions), base 2 every four (sixteens). Without magnitudes, a number is just a
        run of digits, hard to follow unless the scale is clear from context. See the Examples page.
      </p>

      <H2>Other grammar words</H2>
      <p>
        Planned: <W w="foreign_word" /> to mark a foreign word or name,{" "}
        <W w="possession_indicator" />, and <W w="interrogative_blank" /> for questions.
      </p>
    </div>
  );
}
