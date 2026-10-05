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
        Since most people don't count in base 128, <W w="finger_number" /> (base 10),{" "}
        <W w="hex_number" /> (base 16) and <W w="simple_number" /> (base 2) are planned, along with{" "}
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
        object. Every draft so far is in subject–verb–object order.
      </p>
      <Example meaning="Everyone has the right to life, liberty and security of person.">
        &lt;subject&gt; person all &lt;verb&gt; possess &lt;object&gt; right of life and freedom and
        safety.
      </Example>
      <p>
        <b>Transitivity.</b> A transitive verb always takes <W w="_object" />, even when nothing
        about the object is said. Without an object, the verb is intransitive. For an axis verb,
        which means changing toward the axis's state, that's the difference between causing the
        change and undergoing it, so <W w="kill(v)" /> is “kill” with an object and “die” without
        one.
      </p>
      <Example meaning="A soldier kills.">
        &lt;subject&gt; soldier &lt;verb&gt; kill &lt;object&gt;
      </Example>
      <Example meaning="A soldier dies.">&lt;subject&gt; soldier &lt;verb&gt; kill</Example>
      <p>
        Relation verbs are transitive too, so they always take an object, and the complement is read
        as a noun. Their verb is the relation itself rather than a change: <W w="is(v)" /> relates a
        thing to a characteristic, <W w="equal(v)" /> relates two things, and <W w="possess(v)" />{" "}
        relates an owner to what they own.
      </p>
      <Example meaning="The sky is blue.">
        &lt;subject&gt; sky &lt;verb&gt; is &lt;object&gt; blueness
      </Example>
      <Open>
        Becoming, for relation verbs: maybe a helper, <W w="_become" /> (<i>_become possess</i>,
        “gain”).
      </Open>
      <p>
        <W w="_verb(prescriptive)" /> makes a verb prescriptive or imperative (should, shall), and{" "}
        <W w="_verb(interrogative)" /> makes it a question. In a question, <W w="_blank" /> stands
        for what's being asked about; without it, the question is yes or no.
      </p>
      <Example meaning="No one shall be held in slavery.">
        &lt;subject&gt; person none &lt;verb (prescriptive)&gt; is &lt;object&gt; slave.
      </Example>
      <Example meaning="Who does the soldier kill?">
        &lt;subject&gt; soldier &lt;verb (interrogative)&gt; kill &lt;object&gt; _blank
      </Example>
      <Example meaning="Does the soldier kill the enemy?">
        &lt;subject&gt; soldier &lt;verb (interrogative)&gt; kill &lt;object&gt; enemy
      </Example>

      <H2>Tense and aspect</H2>
      <p>
        Verbs aren't marked for tense. As in Mandarin, a sentence's time comes from context, and
        once a time is set it carries over to the sentences after it. To be explicit, a time adverb
        follows the verb: <W w="henceforth" /> for the future and <W w="formerly" /> for the past.
        The axis scale grades them: <i>max_negative henceforth</i> is long ago,{" "}
        <i>min_negative henceforth</i> recently, <i>neutral henceforth</i> now,{" "}
        <i>min_positive henceforth</i> soon and <i>max_positive henceforth</i> the far future.
      </p>
      <p className="mt-2">
        <W w="continuous_tense_aspect" /> marks something as ongoing and{" "}
        <W w="perfect_tense_aspect" /> as done, with a result that still holds. They also follow the
        verb, before any time adverb, so the two combine like English's tenses. With both,
        continuous comes first, and perfect applies to the ongoing action: <i>work
        continuous_tense_aspect perfect_tense_aspect</i> is “have been working”.
      </p>
      <Example meaning="I was sleeping.">
        &lt;subject&gt; I &lt;verb&gt; sleep continuous_tense_aspect formerly
      </Example>
      <Example meaning="The person will have learned the way.">
        &lt;subject&gt; person &lt;verb&gt; learn perfect_tense_aspect henceforth &lt;object&gt;
        path
      </Example>
      <Open>
        In a subclause, is time relative to now or to the main clause's time? Mandarin reads it
        relative to the main clause.
      </Open>

      <H2>Truth and possibility</H2>
      <p>
        The truth axis grades likelihood. Its adverb follows the verb, after any aspect or time
        words: <i>max_negative truly</i> is “certainly not”, <W w="falsely" /> “not so”,{" "}
        <i>min_negative truly</i> “probably not”, <i>neutral truly</i> “maybe”,{" "}
        <i>min_positive truly</i> “probably”, <W w="truly" /> “so” and <i>max_positive truly</i>{" "}
        “certainly”. A plain statement claims something is true, not that it's certain, so it sits
        one step below the top. Proof is how something is known, not how likely it is:{" "}
        <W w="prove(v)" /> with <W w="perfect_tense_aspect" /> is “has proved”.
      </p>
      <Example meaning="The person probably died.">
        &lt;subject&gt; person &lt;verb&gt; kill min_positive truly
      </Example>
      <p className="mt-2">
        Necessity is a separate axis, <W w="modality" />: how many cases something holds in, from{" "}
        <W w="impossible" /> to <W w="necessary" />. Its middle, <i>neutral necessary</i>, is
        contingent. Possible is <i>not impossible</i> and “possibly not” is <i>not necessary</i>,
        using <W w="not" />. The two axes stay apart because they can disagree: an unproved
        conjecture is necessary or impossible, while its likelihood is still neutral. A third axis,
        belief (<W w="doubt(v)" /> to <W w="believe(v)" />), is how strongly someone believes
        something.
      </p>
      <Example meaning="Everyone necessarily dies.">
        &lt;subject&gt; person all &lt;verb&gt; kill necessarily
      </Example>
      <Example meaning="I believe the person probably left.">
        &lt;subject&gt; I &lt;verb&gt; believe &lt;object&gt; clause_start &lt;subject&gt; person
        &lt;verb&gt; go min_positive truly clause_end
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
        The prepositions are <W w="with" />, <W w="to" />, <W w="from" />, <W w="by" />,{" "}
        <W w="for" />, <W w="in" />, <W w="of" />, <W w="about" /> and <W w="at" />. A preposition
        opens a phrase, and there's no word to close it: the phrase ends at the next grammar
        marker, preposition, clause-level conjunction or <W w="clause_end" />. Within a phrase,
        modifiers come before prepositional phrases, so <i>person big &lt;with&gt; rod</i> is a big
        person with a rod. Stacked prepositional phrases can be ambiguous, as in most languages;
        bracket one with <W w="clause_start" /> and <W w="clause_end" /> when it matters.
      </p>
      <Example meaning="…equal in dignity and rights.">
        free and equal &lt;in&gt; value and privilege
      </Example>

      <H2>Conjunctions and clauses</H2>
      <p>
        <W w="and" />, <W w="or" /> and <W w="if" />. Exclusive forms are compounds: xor is
        “or-exclusive” and iff is “if-exclusive”. Planned: <W w="clause_and" /> and{" "}
        <W w="list_and" /> to tell joining clauses from joining list items. <W w="clause_start" />{" "}
        and <W w="clause_end" /> mark where a clause starts and ends.
      </p>

      <H2>Pronouns</H2>
      <p>
        <W w="pronoun(first_person)" />, <W w="pronoun(second_person)" /> and{" "}
        <W w="pronoun(third_person)" />, with number made by compounds: “me” is
        first_person-singular, “we” first_person-plural (also -inclusive and -exclusive), “y'all”
        second_person-plural. The third person can optionally specify plural and gender or sex.{" "}
        <W w="this" /> and <W w="that" /> might become “it-near” and “it-far”. <W w="_blank" /> is
        the question word: what a question asks about.
      </p>

      <H2>Numbers</H2>
      <p>
        A number is a domain word followed by digits, most significant first. A rank after a digit
        gives that digit's place: <W w="rank_3" /> puts it at base³, and the digits after it carry on
        down from there. Places a rank jumps over are zeros, so <i>finger number 1 rank_3 3</i> is
        1003 and <i>finger number 1 rank_6</i> is 1,000,000. Negative ranks give fractions and
        percents: <i>finger number 2 3 negative rank_2</i> is 23%.
      </p>
      <p className="mt-2">
        Ranks don't depend on the base: <W w="rank_3" /> is “thousands” in base 10, but “eights” in
        base 2. By convention ranks work like commas: a base 10 number past <W w="rank_3" /> says{" "}
        <W w="rank_3" /> somewhere, one past <W w="rank_6" /> says <W w="rank_6" />, and so on up
        to <W w="rank_15" />, skipping any group that's all zeros. 34,103,487 is{" "}
        <i>finger number 3 4 rank_6 1 0 3 rank_3 4 8 7 rank_0</i>. Bases 2 and 16 group every four
        places instead (<W w="rank_4" />, <W w="rank_8" />, <W w="rank_12" />), so the groups are
        4 bits and 16 bits. Past{" "}
        <W w="rank_15" />, <W w="rank" /> takes a subclause holding the place. See the Examples
        page.
      </p>
      <p className="mt-2">
        A number ends at its first rank of zero or below, <W w="rank_0" /> or a negative rank. Digits
        share their sounds with the axis words, so the ending tells a listener the next word isn't a
        digit. The final <W w="rank_0" /> can be dropped unless an axis word comes next, since only
        axis words can be mistaken for digits: <i>person finger number 3</i>, but{" "}
        <i>person finger number 3 rank_0 big</i>. Long numbers usually keep it anyway, to make the
        end easy to hear.
      </p>
      <Open>
        Long fractions. Since the first rank of zero or below ends the number, every digit from the
        ones place down falls in one group: 3.14159 has to be{" "}
        <i>finger number 3 1 4 1 5 9 negative rank_5</i>, with no comma-like ranks inside.
      </Open>

      <H2>Other grammar words</H2>
      <p>
        <W w="_foreign" /> marks a foreign word or name. Planned: <W w="possession_indicator" />.
      </p>
    </div>
  );
}
