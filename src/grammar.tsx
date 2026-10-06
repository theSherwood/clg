import React from "react";
import { type VerbType, VERB_TYPE_RULES, sections } from "./dict";
import { VerbTypeBadge, W } from "./word_ui";

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
        <W w="_subject" />, <W w="_object" />, <W w="_gerund" />, <W w="_verb" />,{" "}
        <W w="_verb(prescriptive)" /> and <W w="_verb(interrogative)" />.
      </p>
      <p className="mt-2">
        Partial domains reuse a restricted part of the root space. The content root{" "}
        <W w="number" /> marks the number domain, reading the roots 128–255 as digits. The base
        comes from context.
      </p>
      <p className="mt-2">
        <W w="_er" /> and <W w="_ee" /> turn a verb into a noun for its subject or object, after
        English employer and employee: <i>_er eat</i> is “eater”, <i>_ee eat</i> is “what is eaten”,
        so food. <W w="_er" /> is whoever or whatever does it, not only a person, like English
        printer or opener. Two more markers name other roles, like the prepositions{" "}
        <W w="with" /> and <W w="at" />: <W w="_tool" /> is what it's done with (<i>_tool open</i>,
        a key) and <W w="_place" /> where it's done (<i>_place sleep</i>, a bed).{" "}
        <W w="_to" /> and <W w="_from" /> follow <W w="to" /> and <W w="from" />: who or where it
        goes to (<i>_to send</i>, the addressee; <i>_to go</i>, the destination) and comes from (
        <i>_from come</i>, someone's origin; <i>_from receive</i>, the sender). Arabic builds
        nouns from roots the same way (<i>kātib</i> writer, <i>maktab</i> office, from k-t-b
        “write”), and so does Esperanto (<i>tranĉilo</i> knife, <i>lernejo</i> school).
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
        about the object is said. Without an object, the verb is intransitive. What each means
        depends on the verb's type, and every axis has one type, shared by both its ends:
      </p>
      <table className="mt-2 text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pr-4 font-normal">Type</th>
            <th className="pr-4 font-normal">No object</th>
            <th className="font-normal">With an object</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(VERB_TYPE_RULES) as VerbType[]).map((type) => (
            <tr key={type} className="border-t border-gray-100">
              <td className="pr-4 py-0.5">
                <VerbTypeBadge type={type} />
              </td>
              <td className="pr-4 py-0.5">{VERB_TYPE_RULES[type].no_object}</td>
              <td className="py-0.5">{VERB_TYPE_RULES[type].with_object}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2">
        So <W w="kill(v)" />, a change verb, is “die” without an object and “kill” with one;{" "}
        <W w="fight(v)" />, an action, is “fight” and “fight someone”; and <W w="possess(v)" />, a
        relation, only takes an object. Being in a state isn't a verb: it's <W w="is(v)" /> with
        an adjective. Staying in one is the absence of change, <i>not change</i>, and keeping
        something going is <W w="persist(v)" /> with an object, “maintain”. The Words view lists
        every axis verb by type.
      </p>
      <Example meaning="A soldier kills.">
        &lt;subject&gt; soldier &lt;verb&gt; kill &lt;object&gt;
      </Example>
      <Example meaning="A soldier dies.">&lt;subject&gt; soldier &lt;verb&gt; kill</Example>
      <p>
        <b>Objects.</b> The object is what the verb acts on: what moves, or what changes. Whoever
        receives it is a <W w="to" /> phrase, and wherever it comes from a <W w="from" /> phrase,
        for every verb, so there's no per-verb list of which slot is which. When nothing moves, the
        one who changes is the object: <W w="educate(v)" />'s object is the student, who becomes
        smart.
      </p>
      <Example meaning="I send you money.">
        &lt;subject&gt; I &lt;verb&gt; send &lt;object&gt; money &lt;to&gt; you
      </Example>
      <p>
        A relation's complement is read as a noun. Its verb is the relation itself rather than a
        change: <W w="is(v)" /> relates a
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
        &lt;subject&gt; person none &lt;verb (prescriptive)&gt; is &lt;object&gt; _ee force.
      </Example>
      <Example meaning="Who does the soldier kill?">
        &lt;subject&gt; soldier &lt;verb (interrogative)&gt; kill &lt;object&gt; _blank
      </Example>
      <Example meaning="Does the soldier kill the enemy?">
        &lt;subject&gt; soldier &lt;verb (interrogative)&gt; kill &lt;object&gt; enemy
      </Example>
      <p>
        Other question words come from where <W w="_blank" /> sits: <i>person _blank</i> is who,{" "}
        <i>&lt;at&gt; _blank</i> where, <i>&lt;to&gt; _blank</i> where to,{" "}
        <i>&lt;from&gt; _blank</i> where from, <i>&lt;at&gt; time _blank</i> when,{" "}
        <i>&lt;for&gt; _blank</i> why, <i>&lt;with&gt; _blank</i> how and <i>number _blank</i> how
        many.
      </p>
      <Example meaning="Why do you fight?">
        &lt;subject&gt; you &lt;verb (interrogative)&gt; fight &lt;for&gt; _blank
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
      <p className="mt-2">
        In a subclause, time is relative to the main clause's time, as in Mandarin, so “he said he
        was sleeping” needs no time word in the subclause.
      </p>

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

      <H2>Family</H2>
      <p>
        <W w="family" /> is a root for family, kin or a relative. Relations come from the lineage
        axis, with <W w="child" /> at the positive end and <W w="parent" /> at the negative. The
        scale's steps name the rest, following the general pattern that the minor steps are a
        lesser version and the max steps the fullest: <i>min_negative child</i> is an aunt or uncle
        (a lesser parent, like Swahili <i>mama mdogo</i>, “small mother”),{" "}
        <i>neutral child</i> a sibling, <i>min_positive child</i> a niece or nephew, and{" "}
        <i>max_negative child</i> / <i>max_positive child</i> all ancestors or descendants.
      </p>
      <p className="mt-2">
        Rank counts generations, as in other families of words: <i>child rank_2</i> is a
        grandchild and <i>parent rank_2</i> a grandparent. For siblings it counts the generations
        up to the shared ancestor, so <i>neutral child rank_2</i> is a first cousin (a shared
        grandparent) and <i>neutral child rank_3</i> a second cousin. Bare words are rank_1, and
        rank_0 is oneself. Marriage isn't a generation step, so in-laws are phrases: family{" "}
        <i>&lt;of&gt;</i> spouse.
      </p>
      <Example meaning="My grandparent has many descendants.">
        &lt;subject&gt; parent rank_2 &lt;of&gt; me &lt;verb&gt; possess &lt;object&gt; max_positive
        child many
      </Example>
      <Open>
        Gendered words are long: “mother” is <i>parent female</i>, which is <i>negative child
        negative male</i>, four syllables for a very common word.
      </Open>

      <H2>Comparison</H2>
      <p>
        Comparison is a relation verb, <W w="exceed(v)" />, and an <W w="in" /> phrase names the
        quality compared, optional when context makes it clear. Its negative is “fall short of”,
        and the rest comes from words that already exist: <W w="equal(v)" /> is “as big as”,{" "}
        <i>exceed &lt;object&gt; all</i> is “the biggest”, and the scale grades it, so{" "}
        <i>max_positive exceed</i> is “much bigger” and <i>min_positive exceed</i> “slightly
        bigger”. Many languages compare this way, like Nigerian Pidgin's “e big pass you”.
      </p>
      <Example meaning="The rock is bigger than the person.">
        &lt;subject&gt; rock &lt;verb&gt; exceed &lt;object&gt; person &lt;in&gt; big
      </Example>
      <Example meaning="The Sun is the biggest.">
        &lt;subject&gt; celestial rank_3 this &lt;verb&gt; exceed &lt;object&gt; all &lt;in&gt; big
      </Example>

      <H2>Geometry</H2>
      <p>
        <W w="geometry" /> is one root for geometric figures, and rank counts their dimensions, as{" "}
        <W w="dimension_0" /> is a point: <i>geometry rank_0</i> is a point, <i>rank_1</i> a line,{" "}
        <i>rank_2</i> a shape and <i>rank_3</i> a form, a solid. Modifiers say which:{" "}
        <i>geometry rank_2 round</i> is a circle and <i>geometry rank_3 round</i> a sphere.
      </p>

      <H2>Matter</H2>
      <p>
        <W w="matter" /> takes rank for its phase, rising in energy: <i>matter rank_0</i> is a
        solid, <i>rank_1</i> a liquid, <i>rank_2</i> a gas and <i>rank_3</i> a plasma. As a
        modifier it gives a substance's phase, so <i>water matter rank_0</i> is ice and{" "}
        <i>water matter rank_2</i> steam.
      </p>

      <H2>Sky</H2>
      <p>
        <W w="celestial" /> is one root for every body in the sky, and rank picks its level in the
        orbital hierarchy, each level orbiting the next: <i>celestial rank_0</i> is debris
        (asteroids, comets), <i>rank_1</i> a moon, <i>rank_2</i> a planet, <i>rank_3</i> a star,{" "}
        <i>rank_4</i> a galaxy. <W w="this" /> makes it ours: <i>celestial rank_3 this</i> is the
        Sun, <i>rank_2 this</i> Earth and <i>rank_1 this</i> the Moon.
      </p>
      <Example meaning="The Sun is bright.">
        &lt;subject&gt; celestial rank_3 this &lt;verb&gt; is &lt;object&gt; bright
      </Example>

      <H2>Colors</H2>
      <p>
        <W w="color" /> is a root, and so are three hues: <W w="red" />, <W w="yellow" /> and{" "}
        <W w="blue" />. Other hues mix by modifying, like any other noun and modifier: <i>red
        yellow</i> is orange (a yellowish red), <i>yellow blue</i> green and <i>red blue</i>{" "}
        purple. Lightness comes from the brightness axis: <i>red bright</i> is pink,{" "}
        <i>red dark</i> maroon, and white and black are just <W w="bright" /> and <W w="dark" />.
      </p>
      <Example meaning="The rock is orange.">
        &lt;subject&gt; rock &lt;verb&gt; is &lt;object&gt; red yellow
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
      <p className="mt-2">
        <b>Order.</b> Two rules do different jobs. Modifiers build phrases and follow their head (
        <i>person all</i>, <i>kill truly</i>). Axis helpers and <W w="not" /> build words and come
        before the word they apply to, like prefixes (<i>negative big</i>,{" "}
        <i>min_positive truly</i>, <i>not impossibly</i>). Spanish splits the same way: adjectives
        follow the noun, but <i>muy</i> comes before the adjective. Each prefix takes exactly the
        one word after it, so stacks read left to right without brackets, like logic:{" "}
        <i>not max_positive true</i> is “not certain”. <W w="not" /> is always a prefix, on content
        words too, so <i>person not big</i> can only be a person who isn't big. And the sign comes
        first, so a listener never has to revise what they've heard: in{" "}
        <i>number 2 3 negative rank_2</i>, the negative comes before the rank.
      </p>

      <H2>Prepositions</H2>
      <p>
        The prepositions are <W w="with" />, <W w="to" />, <W w="from" />, <W w="by" />,{" "}
        <W w="for" />, <W w="in" />, <W w="of" />, <W w="about" />, <W w="at" /> and{" "}
        <W w="as" /> (“as” or “like”, like Toki Pona's <i>sama</i>). A preposition
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
        <W w="and" />, <W w="or" />, <W w="if" /> and <W w="but" />. Exclusive forms are compounds: xor is
        “or-exclusive” and iff is “if-exclusive”. One <W w="and" /> joins both clauses and list
        items: followed by a role marker it joins clauses, and followed by a noun it joins list
        items.
      </p>
      <p className="mt-2">
        <W w="clause_start" /> and <W w="clause_end" /> bracket a clause inside another, and the
        bracket is the one device for every kind of subclause. <W w="clause_end" /> can be dropped
        at the end of a sentence, but not before more of the main clause, whose next role marker
        would otherwise be read as part of the subclause.
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1">
        <li>
          <b>As an object</b>: <i>I believe &lt;object&gt; clause_start … clause_end</i>, I
          believe that….
        </li>
        <li>
          <b>After a preposition</b>, for because, when, so that and until:{" "}
          <i>&lt;from&gt; clause_start …</i> is because…, <i>&lt;at&gt; time clause_start …</i>{" "}
          when…, <i>&lt;for&gt; clause_start …</i> so that… and <i>&lt;to&gt; time clause_start …</i>{" "}
          until…. <W w="if" /> takes one the same way.
        </li>
        <li>
          <b>After a noun</b>, describing it: <W w="_blank" /> marks the noun's place in the
          clause, in any role or after any preposition. A plain verb marker tells it from a
          question, which has <W w="_verb(interrogative)" />, as English uses who and where for
          both.
        </li>
      </ul>
      <Example meaning="the person who defended me">
        person clause_start &lt;subject&gt; _blank &lt;verb&gt; defend &lt;object&gt; me clause_end
      </Example>
      <Example meaning="the place where I sleep">
        place clause_start &lt;subject&gt; I &lt;verb&gt; sleep &lt;at&gt; _blank clause_end
      </Example>
      <p className="mt-2">
        A subclause with no subject takes the main clause's subject: <i>I desire &lt;object&gt;
        clause_start &lt;verb&gt; sleep</i> is “I want to sleep”. A main clause with no subject
        leaves it unspecified, “someone”.
      </p>

      <H2>Pronouns</H2>
      <p>
        <W w="pronoun(first_person)" />, <W w="pronoun(second_person)" /> and{" "}
        <W w="pronoun(third_person)" />, with number made by compounds: “me” is
        first_person-singular, “we” first_person-plural (also -inclusive and -exclusive), “y'all”
        second_person-plural. The third person can optionally specify plural and gender or sex.{" "}
        <W w="this" /> and <W w="that" /> point near and far, and <W w="_blank" /> is the question
        word: what a question asks about.
      </p>
      <p className="mt-2">
        Together they make a table of pointing and question words with a few general nouns, like
        Esperanto's correlatives. There's no word for “here” or “there”: like Toki Pona's{" "}
        <i>lon ni</i>, here is <i>&lt;at&gt; this</i> and there <i>&lt;at&gt; that</i>, with{" "}
        <i>place this</i> when it needs to be a noun.
      </p>
      <table className="mt-2 text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pr-4 font-normal" />
            <th className="pr-4 font-normal">this</th>
            <th className="pr-4 font-normal">that</th>
            <th className="font-normal">_blank</th>
          </tr>
        </thead>
        <tbody>
          {(
            [
              ["place", "here", "there", "where"],
              ["person", "this person", "that person", "who"],
              ["thing", "this thing", "that thing", "what"],
            ] as const
          ).map(([noun, near, far, question]) => (
            <tr key={noun} className="border-t border-gray-100">
              <td className="pr-4 py-0.5">
                <W w={noun} />
              </td>
              <td className="pr-4 py-0.5">{near}</td>
              <td className="pr-4 py-0.5">{far}</td>
              <td className="py-0.5">{question}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Example meaning="I sleep here.">
        &lt;subject&gt; I &lt;verb&gt; sleep &lt;at&gt; this
      </Example>
      <p className="mt-2">
        <W w="thing" /> is the general noun, Toki Pona's <i>ijo</i>: <i>thing all</i> is
        everything, <i>thing none</i> nothing and <i>thing _blank</i> what thing.{" "}
        <W w="self" /> and <W w="other" /> are content roots too. As an object, <W w="self" /> is
        reflexive (<i>I know self</i>, I know myself), and <i>family &lt;of&gt; self</i> is one's
        own family. <i>person other</i> is another person, and with a plural subject,{" "}
        <W w="other" /> is each other.
      </p>
      <Example meaning="They love each other.">
        &lt;subject&gt; it plural &lt;verb&gt; love &lt;object&gt; other
      </Example>

      <H2>Numbers</H2>
      <p>
        A number is <W w="number" /> followed by digits, most significant first. There's one word
        for every base: the base comes from context. A rank after a digit
        gives that digit's place: <W w="rank_3" /> puts it at base³, and the digits after it carry on
        down from there. Places a rank jumps over are zeros, so <i>number 1 rank_3 3</i> is
        1003 and <i>number 1 rank_6</i> is 1,000,000. Negative ranks give fractions and
        percents: <i>number 2 3 negative rank_2</i> is 23%.
      </p>
      <p className="mt-2">
        Ranks don't depend on the base: <W w="rank_3" /> is “thousands” in base 10, but “eights” in
        base 2. By convention ranks work like commas: a base 10 number past <W w="rank_3" /> says{" "}
        <W w="rank_3" /> somewhere, one past <W w="rank_6" /> says <W w="rank_6" />, and so on up
        to <W w="rank_15" />, skipping any group that's all zeros. 34,103,487 is{" "}
        <i>number 3 4 rank_6 1 0 3 rank_3 4 8 7 rank_0</i>. Bases 2 and 16 group every four
        places instead (<W w="rank_4" />, <W w="rank_8" />, <W w="rank_12" />), so the groups are
        4 bits and 16 bits. Past{" "}
        <W w="rank_15" />, <W w="rank" /> takes a subclause holding the place. See the Examples
        page.
      </p>
      <p className="mt-2">
        A number ends at its first rank of zero or below, <W w="rank_0" /> or a negative rank. Digits
        share their sounds with the axis words, so the ending tells a listener the next word isn't a
        digit. The final <W w="rank_0" /> can be dropped unless an axis word or an axis helper comes
        next. Only axis words can be mistaken for digits, and a helper like <W w="negative" /> could
        be starting a negative rank: <i>person number 3</i>, but{" "}
        <i>person number 3 rank_0 big</i> and <i>person number 3 rank_0 small</i>.
        Long numbers usually keep it anyway, to make the end easy to hear.
      </p>
      <Open>
        Long fractions. Since the first rank of zero or below ends the number, every digit from the
        ones place down falls in one group: 3.14159 has to be{" "}
        <i>number 3 1 4 1 5 9 negative rank_5</i>, with no comma-like ranks inside.
      </Open>

      <H2>Other grammar words</H2>
      <p>
        <W w="_foreign" /> marks a foreign word or name. Planned: <W w="possession_indicator" />.
      </p>
    </div>
  );
}
