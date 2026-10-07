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
        words are candidates with no root yet. In examples, grammar markers are in angle brackets (
        <i>&lt;subject&gt;</i>, <i>&lt;ee&gt;</i>) and prepositions are bare (<i>to</i>,{" "}
        <i>at</i>).
      </p>

      <H2>Words and sounds</H2>
      <p>
        Every root is one syllable, written as one glyph. A glyph has four marks with four states
        each, so there are 4⁴ = 256 roots and 256 possible syllables; no other syllables exist.
      </p>
      <p className="mt-2">
        A syllable is <b>C M V N</b>: a consonant, its manner (unvoiced, voiced, fricative, voiced
        fricative), a vowel (a, e, o, u) and a final (none, n/m, r/l, i). Onsets and finals share no
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
        Half the IDs are core words. The other half, the domain receivers, are shared: they're read
        by domain, as digits in the number domain or as axis words otherwise. Domain words must be
        core words so they're never
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
        Six of the grammar markers are special, since they're also domain words:{" "}
        <W w="<subject>" />, <W w="<object>" />, <W w="<gerund>" />, <W w="<verb>" />,{" "}
        <W w="<verb_prescriptive>" /> and <W w="<verb_interrogative>" />.
      </p>
      <p className="mt-2">
        Partial domains reuse a restricted part of the root space. The content root{" "}
        <W w="number" /> marks the number domain, reading the domain receivers as digits. The base
        comes from context.
      </p>
      <p className="mt-2">
        <W w="<er>" /> and <W w="<ee>" /> turn a verb into a noun for its subject or object, after
        English employer and employee: <i>&lt;er&gt; eat(vt)</i> is “eater”, <i>&lt;ee&gt; eat(vt)</i> is “what is eaten”,
        so food. <W w="<er>" /> is whoever or whatever does it, not only a person, like English
        printer or opener. Two more markers name other roles, like the prepositions{" "}
        <W w="with" /> and <W w="at" />: <W w="<tool>" /> is what it's done with (<i>&lt;tool&gt; open(vt)</i>,
        a key) and <W w="<place>" /> where it's done (<i>&lt;place&gt; sleep(vi)</i>, a bed). Furniture is
        named this way: <W w="chair" /> is <i>&lt;place&gt; sit(vi)</i>, <W w="table" />{" "}
        <i>&lt;place&gt; eat(vt)</i> and <W w="desk" /> <i>&lt;place&gt; work(vi)</i>. The same words can
        be a room or a building, a restaurant or a workplace, by context.{" "}
        <W w="<to>" /> and <W w="<from>" /> follow <W w="to" /> and <W w="from" />: who or where it
        goes to (<i>&lt;to&gt; send(vt)</i>, the addressee; <i>&lt;to&gt; go(vi)</i>, the destination) and comes from (
        <i>&lt;from&gt; come(vi)</i>, someone's origin; <i>&lt;from&gt; receive(vt)</i>, the sender). Arabic builds
        nouns from roots the same way (<i>kātib</i> writer, <i>maktab</i> office, from k-t-b
        “write”), and so does Esperanto (<i>tranĉilo</i> knife, <i>lernejo</i> school).
      </p>
      <Open>
        Should <W w="direction" /> be a domain specifier?
      </Open>

      <H2>Sentences</H2>
      <p>
        Role markers come before their phrases: <W w="<subject>" /> before the subject,{" "}
        <W w="<verb>" /> (or another verb specifier) before the verb, <W w="<object>" /> before the
        object. Every draft so far is in subject–verb–object order.
      </p>
      <Example meaning="Everyone has the right to life, liberty and security of person.">
        &lt;subject&gt; everyone &lt;verb&gt; possess(vt) &lt;object&gt; right of life and freedom and safety.
      </Example>
      <p>
        <b>Transitivity.</b> A transitive verb always takes <W w="<object>" />, even when nothing
        about the object is said. Without an object, the verb is intransitive. In examples, a verb is
        written by the meaning it has there, marked <i>(vi)</i> without an object and <i>(vt)</i>{" "}
        with one: the same root is <W w="die(vi)" /> and <W w="kill(vt)" />. What each means
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
        So <W w="kill(vt)" />, a change verb, is “die” without an object and “kill” with one;{" "}
        <W w="fight(vi)" />, an action, is “fight” and “fight someone”; and <W w="possess(vt)" />, a
        relation, only takes an object. Being in a state isn't a verb: it's <W w="be(vt)" /> with
        an adjective. Staying in one is the absence of change, <i>not change(vi)</i>, and keeping
        something going is <W w="persist(vi)" /> with an object, “maintain”. The Words view lists
        every axis verb by type.
      </p>
      <Example meaning="A soldier kills.">
        &lt;subject&gt; soldier &lt;verb&gt; kill(vt) &lt;object&gt;
      </Example>
      <Example meaning="A soldier dies.">&lt;subject&gt; soldier &lt;verb&gt; die(vi)</Example>
      <p>
        <b>Objects.</b> The object is what the verb acts on: what moves, or what changes. Whoever
        receives it is a <W w="to" /> phrase, and wherever it comes from a <W w="from" /> phrase,
        for every verb, so there's no per-verb list of which slot is which. When nothing moves, the
        one who changes is the object: <W w="educate(vt)" />'s object is the student, who becomes
        smart.
      </p>
      <Example meaning="I send you money.">
        &lt;subject&gt; I &lt;verb&gt; send(vt) &lt;object&gt; money to you
      </Example>
      <p>
        A relation's verb is the relation itself rather than a change: <W w="equal(vt)" /> relates
        two things and <W w="possess(vt)" /> relates an owner to what they own, each with an object.
      </p>
      <p className="mt-2">
        <W w="be(vt)" /> is different: what follows it isn't an object but a subject complement,
        marked <W w="<complement>" />. It says what the subject is, so it reads as a modifier: the
        adjective where there is one (<i>hot</i>, not <i>heat</i>), and otherwise the noun (
        <i>matter &lt;rank_1&gt;</i>, a liquid). Mood stays on the verb marker, so “be strong!” is{" "}
        <i>&lt;verb_prescriptive&gt; be(vt) &lt;complement&gt; strong</i>.
      </p>
      <Example meaning="The sky is blue.">
        &lt;subject&gt; sky &lt;verb&gt; be(vt) &lt;complement&gt; blue
      </Example>
      <Example meaning="Water is a liquid.">
        &lt;subject&gt; water &lt;verb&gt; be(vt) &lt;complement&gt; liquid
      </Example>
      <p className="mt-2">
        Without a complement, <W w="be(vi)" /> is existing or being somewhere, with a preposition
        for where. It's the one relation verb with a meaning without an object.
      </p>
      <Example meaning="There's water here.">
        &lt;subject&gt; water &lt;verb&gt; be(vi) at this
      </Example>
      <Open>
        Becoming, for relation verbs: maybe a helper, <W w="<become>" /> (<i>&lt;become&gt; possess(vt)</i>,
        “gain”).
      </Open>
      <p>
        <W w="<verb_prescriptive>" /> makes a verb prescriptive or imperative (should, shall), and{" "}
        <W w="<verb_interrogative>" /> makes it a question. In a question, <W w="<blank>" /> stands
        for what's being asked about; without it, the question is yes or no.
      </p>
      <Example meaning="No one shall be held in slavery.">
        &lt;subject&gt; no_one &lt;verb_prescriptive&gt; be(vt) &lt;complement&gt; &lt;ee&gt; force(vt).
      </Example>
      <Example meaning="Who does the soldier kill?">
        &lt;subject&gt; soldier &lt;verb_interrogative&gt; kill(vt) &lt;object&gt; &lt;blank&gt;
      </Example>
      <Example meaning="Does the soldier kill the enemy?">
        &lt;subject&gt; soldier &lt;verb_interrogative&gt; kill(vt) &lt;object&gt; enemy
      </Example>
      <p>
        Other question words come from where <W w="<blank>" /> sits: <i>person &lt;blank&gt;</i> is who,{" "}
        <i>at &lt;blank&gt;</i> where, <i>to &lt;blank&gt;</i> where to,{" "}
        <i>from &lt;blank&gt;</i> where from, <i>at time &lt;blank&gt;</i> when,{" "}
        <i>for &lt;blank&gt;</i> why, <i>with &lt;blank&gt;</i> how and <i>number &lt;blank&gt;</i> how
        many.
      </p>
      <Example meaning="Why do you fight?">
        &lt;subject&gt; you &lt;verb_interrogative&gt; fight(vi) for &lt;blank&gt;
      </Example>

      <H2>Tense and aspect</H2>
      <p>
        Verbs aren't marked for tense. As in Mandarin, a sentence's time comes from context, and
        once a time is set it carries over to the sentences after it. To be explicit, a time adverb
        follows the verb: <W w="henceforth" /> for the future and <W w="formerly" /> for the past.
        The axis scale grades them: <i>&lt;max_negative&gt; henceforth</i> is long ago,{" "}
        <i>&lt;min_negative&gt; henceforth</i> recently, <i>&lt;neutral&gt; henceforth</i> now,{" "}
        <i>&lt;min_positive&gt; henceforth</i> soon and <i>&lt;max_positive&gt; henceforth</i> the far future.
      </p>
      <p className="mt-2">
        <W w="<continuous_tense_aspect>" /> marks something as ongoing and{" "}
        <W w="<perfect_tense_aspect>" /> as done, with a result that still holds. They also follow the
        verb, before any time adverb, so the two combine like English's tenses. With both,
        continuous comes first, and perfect applies to the ongoing action: <i>work
        &lt;continuous_tense_aspect&gt; &lt;perfect_tense_aspect&gt;</i> is “have been working”.
      </p>
      <p className="mt-2">
        <W w="<again>" /> goes with the aspects, after the verb: <i>open(vt) &lt;again&gt;</i> is
        “reopen”. On a verb's negative end it undoes, and says the thing had been done:{" "}
        <i>&lt;negative&gt; cover(vt) &lt;again&gt;</i> is “uncover”, made exposed again.
      </p>
      <Example meaning="I was sleeping.">
        &lt;subject&gt; I &lt;verb&gt; sleep(vi) &lt;continuous_tense_aspect&gt; formerly
      </Example>
      <Example meaning="The person will have learned the way.">
        &lt;subject&gt; person &lt;verb&gt; learn(vt) &lt;perfect_tense_aspect&gt; henceforth &lt;object&gt;
        path
      </Example>
      <p className="mt-2">
        In a subclause, time is relative to the main clause's time, as in Mandarin, so “he said he
        was sleeping” needs no time word in the subclause.
      </p>

      <H2>Units of time and order</H2>
      <p>
        <W w="time" /> takes rank for its units, a step up a ladder rather than a power of ten:{" "}
        <i>&lt;rank_0&gt;</i> second, <i>&lt;rank_1&gt;</i> minute, <i>&lt;rank_2&gt;</i> hour, <i>&lt;rank_3&gt;</i> day,{" "}
        <i>&lt;rank_4&gt;</i> week, <i>&lt;rank_5&gt;</i> month, <i>&lt;rank_6&gt;</i> year, then decade, century and
        millennium. A count follows like any other: <i>time &lt;rank_3&gt; number 3</i> is three days. The
        24-hour day is <W w="day" />, <i>time &lt;rank_3&gt;</i>; <W w="daytime" /> is <i>time bright</i> and{" "}
        <W w="night" /> <i>time dark</i>.
      </p>
      <p className="mt-2">
        <W w="next" /> and <W w="previous" /> count steps in any sequence from a reference point.
        In a main clause that's now, so <i>time &lt;rank_3&gt; next</i> is tomorrow and{" "}
        <i>time &lt;rank_3&gt; previous</i> yesterday; in a subclause it's the main clause's time, so the
        same words mean the next day and the day before. Rank counts steps, as for generations:{" "}
        <i>next &lt;rank_2&gt;</i> is the one after next. As verbs, <W w="precede(vt)" /> and{" "}
        <W w="follow(vt)" /> relate two things in order.
      </p>
      <Example meaning="I slept yesterday.">
        &lt;subject&gt; I &lt;verb&gt; sleep(vi) at yesterday
      </Example>
      <Example meaning="Eating comes before sleeping.">
        &lt;subject&gt; &lt;gerund&gt; eat(vt) &lt;verb&gt; precede(vt) &lt;object&gt; &lt;gerund&gt; sleep(vi)
      </Example>

      <H2>Truth and possibility</H2>
      <p>
        The truth axis grades likelihood. Its adverb follows the verb, after any aspect or time
        words: <i>&lt;max_negative&gt; truly</i> is “certainly not”, <W w="falsely" /> “not so”,{" "}
        <i>&lt;min_negative&gt; truly</i> “probably not”, <i>&lt;neutral&gt; truly</i> “maybe”,{" "}
        <i>&lt;min_positive&gt; truly</i> “probably”, <W w="truly" /> “so” and <i>&lt;max_positive&gt; truly</i>{" "}
        “certainly”. A plain statement claims something is true, not that it's certain, so it sits
        one step below the top. Proof is how something is known, not how likely it is:{" "}
        <W w="prove(vt)" /> with <W w="<perfect_tense_aspect>" /> is “has proved”.
      </p>
      <p className="mt-2">
        Ability, the “can” of “I can swim”, is the capability axis, and its adverb is the modal:{" "}
        <W w="ably" /> is can and <W w="incapably" /> can't. Possibility is the modality axis (
        <i>not impossibly</i>) and permission is <W w="allow(vt)" />, so English “can” splits three
        ways.
      </p>
      <Example meaning="I can work.">&lt;subject&gt; I &lt;verb&gt; work(vi) ably</Example>
      <p className="mt-2">
        How required an act is, the other kind of “must” and “may”, is the permissibility axis, a
        five-step scale: <W w="forbid(vi)" />, <W w="discourage(vt)" />, <W w="allow(vi)" />,{" "}
        <W w="recommend(vi)" /> and <W w="require(vt)" />. Its adverbs are the modals:{" "}
        <W w="obligatorily" /> is must, <W w="advisably" /> should, <W w="permissibly" /> may,{" "}
        <W w="inadvisably" /> shouldn't and <W w="impermissibly" /> must not.
      </p>
      <Example meaning="You should sleep.">&lt;subject&gt; you &lt;verb&gt; sleep(vi) advisably</Example>
      <p className="mt-2">
        Rights and duties are their own axis: <W w="be_entitled_to(vt)" /> (a <W w="right" />) and{" "}
        <W w="be_bound_to(vt)" /> (a <W w="duty" />), to do something or to refrain. It doesn't say
        whose duty answers whose right; a right to speak may ask of others only that they not
        interfere, and the sentence says so.
      </p>
      <p className="mt-2">
        A <W w="law" /> or rule is <i>command abstract</i>, a general command: it applies to anyone
        in a given kind of case, where a <W w="command" /> is an order to someone about something
        particular. Whose law it is goes with <W w="of" />.
      </p>
      <Example meaning="Everyone has the right to speak.">
        &lt;subject&gt; everyone &lt;verb&gt; be_entitled_to(vt) &lt;object&gt; &lt;gerund&gt; say(vt)
      </Example>
      <Example meaning="The person probably died.">
        &lt;subject&gt; person &lt;verb&gt; die(vi) &lt;min_positive&gt; truly
      </Example>
      <p className="mt-2">
        Necessity is a separate axis, <W w="modality" />: how many cases something holds in, from{" "}
        <W w="impossible" /> to <W w="necessary" />. Its middle, <i>&lt;neutral&gt; necessary</i>, is
        contingent. Possible is <i>not impossible</i> and “possibly not” is <i>not necessary</i>,
        using <W w="not" />. The two axes stay apart because they can disagree: an unproved
        conjecture is necessary or impossible, while its likelihood is still neutral. A third axis,
        belief (<W w="doubt(vi)" /> to <W w="believe(vi)" />), is how strongly someone believes
        something.
      </p>
      <Example meaning="Everyone necessarily dies.">
        &lt;subject&gt; everyone &lt;verb&gt; die(vi) necessarily
      </Example>
      <Example meaning="I believe the person probably left.">
        &lt;subject&gt; I &lt;verb&gt; believe(vt) &lt;object&gt; &lt;clause_start&gt; &lt;subject&gt; person
        &lt;verb&gt; go(vi) &lt;min_positive&gt; truly &lt;clause_end&gt;
      </Example>

      <H2>Choice, safety, conscience and meta</H2>
      <p>
        Choosing is an axis, <W w="choose(vi)" /> and <W w="reject(vt)" />, and preferring is
        leaning toward choosing, its minor positive step: <W w="prefer(vt)" />. A comparison says
        what over: <i>prefer(vt) X exceed(vt) Y</i>. Safety is its own axis too, <W w="safe" /> and{" "}
        <W w="dangerous" />, with <W w="secure(vt)" /> and <W w="endanger(vt)" />; withstanding harm
        is resilience.
      </p>
      <p className="mt-2">
        Reasoning is the logic axis, from premises to conclusions: <W w="assume(vt)" /> a{" "}
        <W w="premise" /> at the negative end and <W w="infer(vt)" /> a <W w="conclusion" /> at the
        positive, whose no-object meaning is <W w="reason(vi)" />. At the ends,{" "}
        <W w="posit(vt)" /> an <W w="axiom" /> and <W w="derive(vt)" /> a <W w="theorem" />.{" "}
        <W w="reason" />, the faculty, is <i>&lt;tool&gt; infer(vt)</i>. A reason for believing
        something is a premise, where a reason something happened is a <W w="cause" />.
      </p>
      <Example meaning="I infer that you slept.">
        &lt;subject&gt; I &lt;verb&gt; infer(vt) &lt;object&gt; &lt;clause_start&gt; &lt;subject&gt; you &lt;verb&gt; sleep(vi) formerly
      </Example>
      <p className="mt-2">
        <W w="mind" /> is <i>&lt;er&gt; sense(vt) self</i>, what perceives itself.{" "}
        <W w="computation" /> is <i>&lt;gerund&gt; transform(vt) information</i>, transforming data, and a{" "}
        <W w="computer" /> <i>&lt;tool&gt; transform(vt) information</i>; to <W w="transform(vi)" /> is
        to change at the fullest. <W w="conscience" /> is <i>&lt;tool&gt; blame(vt) self</i>, what you blame yourself with, and by
        the same axis credit yourself. A <W w="model" /> is <i>&lt;er&gt; resemble(vt)</i>, a thing that
        resembles another. <W w="meta" /> as a modifier makes X about X: <i>merit meta</i> is
        metaethics, the study of what good is, and <i>knowledge meta</i> knowing what you know.
      </p>
      <Example meaning="I prefer water.">&lt;subject&gt; I &lt;verb&gt; prefer(vt) &lt;object&gt; water</Example>

      <H2>Family</H2>
      <p>
        <W w="family" /> is a root for family, kin or a relative. Relations come from the lineage
        axis, with <W w="child" /> at the positive end and <W w="parent" /> at the negative. The
        scale's steps name the rest, following the general pattern that the minor steps are a
        lesser version and the max steps the fullest: <i>&lt;min_negative&gt; child</i> is an aunt or uncle
        (a lesser parent, like Swahili <i>mama mdogo</i>, “small mother”),{" "}
        <i>&lt;neutral&gt; child</i> a sibling, <i>&lt;min_positive&gt; child</i> a niece or nephew, and{" "}
        <i>&lt;max_negative&gt; child</i> / <i>&lt;max_positive&gt; child</i> all ancestors or descendants.
      </p>
      <p className="mt-2">
        Rank counts generations, as in other families of words: <i>child &lt;rank_2&gt;</i> is a
        grandchild and <i>parent &lt;rank_2&gt;</i> a grandparent. For siblings it counts the generations
        up to the shared ancestor, so <i>&lt;neutral&gt; child &lt;rank_2&gt;</i> is a first cousin (a shared
        grandparent) and <i>&lt;neutral&gt; child &lt;rank_3&gt;</i> a second cousin. Bare words are &lt;rank_1&gt;, and
        &lt;rank_0&gt; is oneself. Marriage isn't a generation step: a <W w="spouse" /> is <i>family united</i>, family by
        union rather than descent, and in-laws are phrases: <i>parent of spouse</i>. Gendered words are
        modifiers: <W w="mother" /> is <i>parent female</i>, <W w="brother" /> <i>sibling male</i>.
      </p>
      <Example meaning="My grandparent has many descendants.">
        &lt;subject&gt; grandparent of me &lt;verb&gt; possess(vt) &lt;object&gt; &lt;max_positive&gt; child many
      </Example>
      <Open>
        Gendered words are long: “mother” is <i>parent female</i>, which is <i>&lt;negative&gt; child
        &lt;negative&gt; male</i>, four syllables for a very common word.
      </Open>

      <H2>Speech, writing and the senses</H2>
      <p>
        These are action axes, each with its counterpart at the other end:{" "}
        <W w="say(vt)" /> and <W w="hear(vt)" />, <W w="write(vi)" /> and <W w="read(vi)" />,{" "}
        <W w="show(vi)" /> and <W w="see(vt)" /> (<W w="look(vi)" /> without an object),{" "}
        <W w="sense(vt)" /> and <W w="overlook(vt)" />, <W w="use(vi)" /> and <W w="discard(vi)" />,{" "}
        <W w="do(vt)" /> and <W w="undo(vi)" />, and <W w="touch(vi)" /> and <W w="avoid(vt)" />. The
        scale grades them: <i>&lt;min_positive&gt; write(vi)</i>, a lesser writing, is a mark, and{" "}
        <i>&lt;min_negative&gt; write(vi)</i> is skimming. Nouns come from the role markers: a word is{" "}
        <i>&lt;ee&gt; say(vt)</i>, a text <i>&lt;ee&gt; write(vt)</i> and an ear <i>&lt;tool&gt; hear(vt)</i>. Attaching is{" "}
        <W w="connect(vi)" />.
      </p>
      <p className="mt-2">
        Untruth is the truth axis's adverb: <W w="tell_a_lie(vi)" /> is <i>say(vt) falsely</i>, and{" "}
        <W w="pretend(vi)" /> is <i>show(vi) falsely</i>, which with an object is to disguise it.
        Appearing and disappearing aren't showing: they're <W w="emerge(vi)" /> and{" "}
        <W w="vanish(vi)" />.
      </p>

      <H2>Comparison</H2>
      <p>
        Comparison is a relation verb, <W w="exceed(vt)" />, and an <W w="in" /> phrase names the
        quality compared, optional when context makes it clear. Its negative is “fall short of”,
        and the rest comes from words that already exist: <W w="equal(vt)" /> is “as big as”,{" "}
        <i>exceed(vt) &lt;object&gt; all</i> is “the biggest”, and the scale grades it, so{" "}
        <i>&lt;max_positive&gt; exceed(vt)</i> is “much bigger” and <i>&lt;min_positive&gt; exceed(vt)</i> “slightly
        bigger”. Many languages compare this way, like Nigerian Pidgin's “e big pass you”.
      </p>
      <Example meaning="The rock is bigger than the person.">
        &lt;subject&gt; rock &lt;verb&gt; exceed(vt) &lt;object&gt; person in big
      </Example>
      <Example meaning="The Sun is the biggest.">
        &lt;subject&gt; sun &lt;verb&gt; exceed(vt) &lt;object&gt; all in big
      </Example>
      <p className="mt-2">
        Likeness is the similarity axis: <W w="resemble(vt)" /> and <W w="similar" /> at the positive
        end, <W w="differ_from(vt)" /> and <W w="different" /> at the negative. Its fullest steps are{" "}
        <W w="equal(vt)" /> (<W w="same" />) and, as people use the word, <W w="opposite" /> (
        <W w="contrast_with(vt)" />).
      </p>
      <Example meaning="The moon resembles a rock.">
        &lt;subject&gt; the_moon &lt;verb&gt; resemble(vt) &lt;object&gt; rock
      </Example>

      <H2>Posture</H2>
      <p>
        The posture axis is how upright a body is, from <W w="stand(vi)" /> (<W w="upright" />) at the
        positive end to <W w="lie(vi)" /> (<W w="prone" />) at the negative, with{" "}
        <W w="sit(vi)" />, <W w="crouch(vi)" /> and <W w="crawl(vi)" /> (<W w="on_all_fours" />) as the
        steps between. It's about the body's orientation, not its height, which is elevation. Its
        verbs take a position: without an object, to sit down or lie down; with one, to seat
        someone or lay them down. Being in a posture is the continuous aspect.
      </p>
      <p className="mt-2">
        Slouching is a manner rather than a posture, since you can slouch standing or sitting, so
        it's the negative adverb: <i>stand(vi) slouchingly</i> is to stand with a slouch, and{" "}
        <i>sit(vi) uprightly</i> to sit up straight.
      </p>
      <Example meaning="I'm sitting.">
        &lt;subject&gt; I &lt;verb&gt; sit(vi) &lt;continuous_tense_aspect&gt;
      </Example>

      <H2>Moving</H2>
      <p>
        The locomotion axis names a way of moving by the medium it goes through, from thinnest to
        densest: <W w="spacefly(vi)" /> through space, <W w="fly(vi)" /> through air,{" "}
        <W w="leap(vi)" /> (a brief flight), <W w="walk(vi)" /> on the ground, <W w="wade(vi)" />{" "}
        through shallow water, <W w="swim(vi)" /> through water and <W w="burrow(vi)" /> through
        solid ground. <W w="go(vi)" /> is moving in general.
      </p>
      <p className="mt-2">
        The verb names the medium, not who or what moves, so a boat swims and a plane flies; as
        Russian <i>плыть</i> is both to swim and to sail. Vehicles are <W w="<tool>" /> and the verb:{" "}
        <W w="boat" /> is <i>&lt;tool&gt; swim(vi)</i>, <W w="aircraft" /> <i>&lt;tool&gt; fly(vi)</i> and{" "}
        <W w="spacecraft" /> <i>&lt;tool&gt; spacefly(vi)</i>. Animals are named loosely by how they move,
        as in English: <W w="bird" /> is <i>animal flying</i> and <W w="fish" /> <i>animal swimming</i>,
        and a <W w="feather" /> is <i>covering bird</i>.
      </p>
      <Example meaning="The bird flies to the tree.">
        &lt;subject&gt; bird &lt;verb&gt; fly(vi) to tree
      </Example>

      <H2>Parts of things</H2>
      <p>
        A part is named head first, like any noun and modifier: the kind of part, then the whole
        it belongs to. <W w="tail" /> is <i>rod back</i> and <W w="knee" /> <i>node leg</i>. A few
        kinds go a long way: a <W w="covering" /> is <W w="skin" /> (<i>covering body</i>),{" "}
        <W w="hair" /> (<i>covering head</i>), <W w="fur" /> or <W w="bark" />; a <W w="rod" /> is a{" "}
        <W w="horn" />, <W w="tail" /> or <W w="tongue" />; a <W w="rock" /> is a <W w="tooth" /> (
        <i>rock mouth</i>) or <W w="bone" /> (<i>rock body</i>).
      </p>
      <p className="mt-2">
        Organs are named for what they do, with <W w="<tool>" />: <W w="eye" /> is{" "}
        <i>&lt;tool&gt; see(vt)</i>, <W w="ear" /> <i>&lt;tool&gt; hear(vt)</i>, <W w="brain" />{" "}
        <i>&lt;tool&gt; know(vt)</i> and <W w="nose" /> <i>&lt;tool&gt; sense(vt) gas</i>. Where there's no verb for
        it, the kind-and-whole pattern does: <W w="heart" /> is <i>center body</i>. Substances take a
        phase: <W w="blood" /> is <i>liquid body</i>, <W w="sap" /> <i>liquid plant</i> and{" "}
        <W w="flesh" /> <i>matter body</i>. A substance can also be named for what it does:{" "}
        <W w="grease" /> is <i>&lt;tool&gt; slip(vi)</i> and <W w="glue" /> <i>&lt;tool&gt; stick(vi)</i>, from
        the ends of the texture axis.
      </p>
      <p className="mt-2">
        A body part names the like part of another whole, as many languages speak of the foot of a
        mountain. A plant's parts are its body's: <W w="root" /> is <i>feet plant</i>,{" "}
        <W w="trunk" /> <i>torso plant</i>, <W w="branch" /> <i>arm plant</i> and <W w="leaf" />{" "}
        <i>finger plant</i>, and <i>mouth water</i> is a river's mouth.
      </p>

      <H2>Geometry</H2>
      <p>
        <W w="geometry" /> is one root for geometric figures. Rank gives a bounded figure with that
        many dimensions: <W w="point" /> (<i>geometry &lt;rank_0&gt;</i>), <W w="line_segment" />{" "}
        (<i>&lt;rank_1&gt;</i>), <W w="shape" /> (<i>&lt;rank_2&gt;</i>) and <W w="form" />, a 3D structure (
        <i>&lt;rank_3&gt;</i>). A dimension helper gives the unbounded space up through that dimension:{" "}
        <W w="infinite_line" /> (<i>geometry &lt;dimension_x&gt;</i>), <W w="plane" /> (<i>&lt;dimension_y&gt;</i>)
        and <W w="space" /> (<i>&lt;dimension_z&gt;</i>); higher spaces go through the number domain, as{" "}
        <i>geometry dimension &lt;ordinal&gt; number 4</i>.
      </p>
      <p className="mt-2">
        Modifiers say which figure, at any rank: <W w="round" /> gives <W w="curve" />,{" "}
        <W w="circle" /> and <W w="sphere" />, and <W w="angular" /> gives <W w="polyline" />,{" "}
        <W w="polygon" /> and <W w="polyhedron" />.
      </p>
      <p className="mt-2">
        <W w="node" /> takes rank for networks, each more general than the last:{" "}
        <W w="sequence" /> (<i>node &lt;rank_1&gt;</i>), <W w="tree_graph" /> (<i>&lt;rank_2&gt;</i>),{" "}
        <W w="dag" /> (<i>&lt;rank_3&gt;</i>), <W w="graph" /> (<i>&lt;rank_4&gt;</i>), <W w="hypergraph" />{" "}
        (<i>&lt;rank_5&gt;</i>) and <W w="higher_order_network" /> (<i>&lt;rank_6&gt;</i>). Whether a graph's
        links have a direction is a modifier.
      </p>
      <p className="mt-2">
        A sequence's modifiers say how it's laid out: <W w="array" /> is <i>sequence continuous</i>,
        unbroken, and <W w="linked_list" /> <i>sequence discrete</i>, separate pieces each linked to
        the next. A dimension helper takes it through more dimensions, as with geometry:{" "}
        <W w="grid" /> is <i>sequence &lt;dimension_y&gt;</i>, a table of data, and{" "}
        <i>sequence &lt;dimension_z&gt;</i> a 3D grid.
      </p>

      <H2>Matter</H2>
      <p>
        <W w="matter" /> takes rank for its phase, rising in energy: <i>matter &lt;rank_0&gt;</i> is a
        solid, <i>&lt;rank_1&gt;</i> a liquid, <i>&lt;rank_2&gt;</i> a gas and <i>&lt;rank_3&gt;</i> a plasma. As a
        modifier it gives a substance's phase, so <W w="ice" /> is <i>water matter &lt;rank_0&gt;</i>,{" "}
        <W w="steam" /> is <i>water matter &lt;rank_2&gt;</i> and <W w="lava" /> is{" "}
        <i>rock matter &lt;rank_1&gt;</i>. Bare <W w="water" /> is the liquid. <W w="gas" /> usually does
        for air; <W w="air" />, <i>gas this</i> (our gas), says it outright, as <i>celestial &lt;rank_2&gt;
        this</i> is Earth.
      </p>
      <p className="mt-2">
        The phase axis (<W w="rigid" />, <W w="fluid" />) is separate: it's how something behaves,
        not its phase. Glass is rigid, and sand pours like a fluid without being a liquid.
      </p>
      <p className="mt-2">
        The phase axis changes phase. <W w="melt(vi)" /> goes up a phase and{" "}
        <W w="freeze(vi)" /> down one, so one verb is melting for ice and evaporating for water.
        Rank names the target phase, as it does for <W w="matter" />: <i>melt(vi) &lt;rank_2&gt;</i> is to
        evaporate (<W w="evaporate(vi)" />), <i>melt(vi) &lt;rank_3&gt;</i> to ionize, <i>freeze(vi) &lt;rank_1&gt;</i> to
        condense and <i>freeze(vi) &lt;rank_0&gt;</i> to solidify.
      </p>
      <Example meaning="The sun melts the ice.">
        &lt;subject&gt; sun &lt;verb&gt; melt(vt) &lt;object&gt; ice
      </Example>
      <p className="mt-2">
        <W w="element" /> marks the element domain, as <W w="number" /> marks the number domain:
        the digit after it is an atomic number, so <i>element 6</i> is carbon. Each element has
        settled into one word, written without the space: <W w="carbon" /> is <i>element 6</i>, from{" "}
        <W w="hydrogen" /> (1) to <W w="oganesson" /> (118). That's how any phrase with a canonical
        meaning becomes a word; its parts are still there to see. Bare, <W w="element" /> is any
        element, and an element with matter's rank gives its phase: <i>gold matter &lt;rank_0&gt;</i> is
        solid gold.
      </p>
      <Example meaning="This rock is iron.">
        &lt;subject&gt; rock this &lt;verb&gt; be(vt) &lt;complement&gt; iron
      </Example>

      <H2>Sky</H2>
      <p>
        <W w="celestial" /> is one root for every body in the sky, and rank picks its level in the
        orbital hierarchy, each level orbiting the next: <W w="moon" /> (<i>celestial &lt;rank_1&gt;</i>),{" "}
        <W w="planet" /> (<i>&lt;rank_2&gt;</i>), <W w="star" /> (<i>&lt;rank_3&gt;</i>), <W w="galaxy" />{" "}
        (<i>&lt;rank_4&gt;</i>), <W w="galaxy_cluster" /> (<i>&lt;rank_5&gt;</i>) and <W w="supercluster" />{" "}
        (<i>&lt;rank_6&gt;</i>). <i>&lt;rank_0&gt;</i> is a <W w="small_body" />, too small to be round, and
        modifiers tell those apart: <W w="asteroid" /> is <i>celestial &lt;rank_0&gt; rock</i> and{" "}
        <W w="comet" /> <i>celestial &lt;rank_0&gt; ice</i>.
      </p>
      <p className="mt-2">
        <W w="this" /> makes it ours: <W w="sun" /> is <i>celestial &lt;rank_3&gt; this</i>,{" "}
        <W w="earth" /> <i>&lt;rank_2&gt; this</i>, <W w="the_moon" /> <i>&lt;rank_1&gt; this</i> and{" "}
        <W w="milky_way" /> <i>&lt;rank_4&gt; this</i>. The universe isn't a body in the sky:{" "}
        <W w="universe" /> is <i>thing all</i>, everything.
      </p>
      <Example meaning="The Sun is bright.">
        &lt;subject&gt; sun &lt;verb&gt; be(vt) &lt;complement&gt; bright
      </Example>

      <H2>Directions</H2>
      <p>
        <W w="cardinal" /> is one root for the compass, and rank counts quarter turns clockwise
        from north: <W w="north" /> is <i>cardinal &lt;rank_0&gt;</i>, <W w="east" /> <i>&lt;rank_1&gt;</i>,{" "}
        <W w="south" /> <i>&lt;rank_2&gt;</i> and <W w="west" /> <i>&lt;rank_3&gt;</i>. Two ranks name the
        direction between them, north or south first as in English: <W w="northeast" /> is{" "}
        <i>cardinal &lt;rank_0&gt; &lt;rank_1&gt;</i> and <W w="southwest" />{" "}
        <i>cardinal &lt;rank_2&gt; &lt;rank_3&gt;</i>. The prepositions do the rest:{" "}
        <i>to cardinal &lt;rank_0&gt;</i> is northward and <i>at cardinal &lt;rank_1&gt;</i> in the east.
      </p>
      <p className="mt-2">
        Rank is a little out of place here. Elsewhere it's a level (a phase, an orbit, a
        generation); here it only numbers points around a circle. It's short and easy to learn, so
        it stays for now.
      </p>

      <H2>Colors</H2>
      <p>
        <W w="color" /> is a root, and so are three hues: <W w="red" />, <W w="yellow" /> and{" "}
        <W w="blue" />. Two hues together are an even blend, in either order: <W w="orange" /> is{" "}
        <i>red yellow</i>, <W w="green" /> <i>yellow blue</i> and <W w="purple" /> <i>red blue</i>.
        Lightness comes from the brightness axis: <W w="pink" /> is <i>red bright</i> and{" "}
        <W w="maroon" /> <i>red dark</i>. As modifiers, white and black are just <W w="bright" /> and{" "}
        <W w="dark" />; as nouns they're <W w="white" /> (<i>color bright</i>) and <W w="black" />{" "}
        (<i>color dark</i>), and <W w="gray" /> is <i>color &lt;neutral&gt; bright</i>. On a noun, a
        blend is grouped, since modifiers each apply to the head: <i>rock &lt;regroup&gt; red yellow</i>{" "}
        is an orange rock, and <i>rock red yellow</i> a red and yellow one.
      </p>
      <p className="mt-2">
        <W w="brown" /> is the neutral color, <i>color &lt;neutral&gt;</i>. Since{" "}
        <W w="<neutral>" /> steps an axis word that follows it, brown goes after any axis words:{" "}
        <i>rock big brown</i>, not <i>rock brown big</i>, which would read as a medium-sized color.
      </p>
      <Example meaning="The rock is orange.">
        &lt;subject&gt; rock &lt;verb&gt; be(vt) &lt;complement&gt; orange
      </Example>

      <H2>Modifiers</H2>
      <p>
        Modifiers follow what they modify: <i>person all</i> is “everyone”, <i>person none</i> is
        “no one”.
      </p>
      <p className="mt-2">
        Opposites and scales come from <b>axes</b>. Each axis has one root for its positive end,
        used across the noun, adjective, verb and adverb domains (<W w="big" />, <W w="bigness" />,{" "}
        <W w="grow(vi)" />, <W w="hugely" />
        ). The negative end is <W w="<negative>" /> plus the positive (<W w="small" />
        ), and the axis itself is <W w="<axis_of>" /> plus the positive noun (<W w="size" />
        ). A seven-step scale grades axis words: <W w="<max_negative>" />, <W w="<negative>" />,{" "}
        <W w="<min_negative>" />, <W w="<neutral>" />, <W w="<min_positive>" />, <W w="<positive>" />,{" "}
        <W w="<max_positive>" />. <W w="not" /> is the complement, for axis words too.
      </p>
      <p className="mt-2">
        <b>Order.</b> Two rules do different jobs. Modifiers build phrases and follow their head (
        <i>person all</i>, <i>kill(vt) truly</i>). Axis helpers and <W w="not" /> build words and come
        before the word they apply to, like prefixes (<i>&lt;negative&gt; big</i>,{" "}
        <i>&lt;min_positive&gt; truly</i>, <i>not impossibly</i>). Spanish splits the same way: adjectives
        follow the noun, but <i>muy</i> comes before the adjective. Each prefix takes exactly the
        one word after it, so stacks read left to right without brackets, like logic:{" "}
        <i>not &lt;max_positive&gt; true</i> is “not certain”. <W w="not" /> is always a prefix, on content
        words too, so <i>person not big</i> can only be a person who isn't big. And the sign comes
        first, so a listener never has to revise what they've heard: in{" "}
        <i>number 2 3 &lt;negative&gt; &lt;rank_2&gt;</i>, the negative comes before the rank.
      </p>

      <p className="mt-2">
        <b>Scope.</b> Each modifier applies to the head: <i>rock red yellow</i> is a rock that's red
        and yellow. <W w="<regroup>" />, like Toki Pona's <i>pi</i>, gathers the modifiers after it
        into one group that modifies the head together, the first of them as the group's own head:{" "}
        <i>rock &lt;regroup&gt; red yellow</i> is a rock of the color red yellow, an orange rock. The
        group runs to the end of the noun phrase.
      </p>
      <Example meaning="a person of a big family">person &lt;regroup&gt; family big</Example>
      <p className="mt-2">
        <W w="only" /> is a prefix, like <W w="not" />, on the one word after it: <i>only you</i>,{" "}
        <i>&lt;verb&gt; only sleep(vi)</i>.
      </p>
      <Example meaning="I drink only water.">
        &lt;subject&gt; I &lt;verb&gt; eat(vt) &lt;object&gt; only water
      </Example>
      <Open>
        <W w="and" /> between modifiers lists them: <i>rock red and yellow</i>. It may be read as
        starting a second noun instead (<i>person big and dog</i>), and context may have to decide.
      </Open>

      <H2>Prepositions</H2>
      <p>
        The prepositions are <W w="with" />, <W w="to" />, <W w="from" />, <W w="by" />,{" "}
        <W w="for" />, <W w="in" />, <W w="of" />, <W w="about" />, <W w="at" /> and{" "}
        <W w="as" /> (“as” or “like”, like Toki Pona's <i>sama</i>). A preposition
        opens a phrase, and there's no word to close it: the phrase ends at the next grammar
        marker, preposition, clause-level conjunction or <W w="<clause_end>" />. Within a phrase,
        modifiers come before prepositional phrases, so <i>person big with rod</i> is a big
        person with a rod. Stacked prepositional phrases can be ambiguous, as in most languages;
        bracket one with <W w="<clause_start>" /> and <W w="<clause_end>" /> when it matters.
      </p>
      <Example meaning="…equal in dignity and rights.">
        free and equal(vt) in value and privilege
      </Example>

      <H2>Conjunctions and clauses</H2>
      <p>
        <W w="and" />, <W w="or" />, <W w="if" /> and <W w="but" />. Exclusive forms are compounds: xor is
        “or-exclusive” and iff is “if-exclusive”. One <W w="and" /> joins both clauses and list
        items: followed by a role marker it joins clauses, and followed by a noun it joins list
        items.
      </p>
      <p className="mt-2">
        <W w="<clause_start>" /> and <W w="<clause_end>" /> bracket a clause inside another, and the
        bracket is the one device for every kind of subclause. <W w="<clause_end>" /> can be dropped
        at the end of a sentence, but not before more of the main clause, whose next role marker
        would otherwise be read as part of the subclause.
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1">
        <li>
          <b>As an object</b>: <i>I believe(vt) &lt;object&gt; &lt;clause_start&gt; … &lt;clause_end&gt;</i>, I
          believe that…. Its pronouns are the speaker's, so after <W w="say(vt)" /> it's indirect
          speech. With <W w="identically" /> on the verb, it's direct speech, the very words, and its
          pronouns, here and now are the speaker's at the time: <W w="say_verbatim(vt)" /> is{" "}
          <i>say(vt) identically</i>. Adding <W w="meta" /> makes it a quote, someone else's words
          repeated, with <W w="from" /> for whose: <W w="quote(vt)" /> is{" "}
          <i>say(vt) identically meta</i>. Writing works the same way: <W w="write_verbatim(vt)" /> and{" "}
          <W w="quote_in_writing(vt)" />. A <W w="quotation" /> is <i>&lt;ee&gt; quote(vt)</i>, what's
          quoted.
        </li>
        <li>
          <b>After a preposition</b>, for because, when, so that and until:{" "}
          <i>from &lt;clause_start&gt; …</i> is because…, <i>at time &lt;clause_start&gt; …</i>{" "}
          when…, <i>for &lt;clause_start&gt; …</i> so that… and <i>to time &lt;clause_start&gt; …</i>{" "}
          until…. <W w="if" /> takes one the same way.
        </li>
        <li>
          <b>After a noun</b>, describing it: <W w="<blank>" /> marks the noun's place in the
          clause, in any role or after any preposition. A plain verb marker tells it from a
          question, which has <W w="<verb_interrogative>" />, as English uses who and where for
          both.
        </li>
      </ul>
      <Example meaning="the person who defended me">
        person &lt;clause_start&gt; &lt;subject&gt; &lt;blank&gt; &lt;verb&gt; defend(vt) &lt;object&gt; me &lt;clause_end&gt;
      </Example>
      <Example meaning="the place where I sleep">
        place &lt;clause_start&gt; &lt;subject&gt; I &lt;verb&gt; sleep(vi) at &lt;blank&gt; &lt;clause_end&gt;
      </Example>
      <p className="mt-2">
        A subclause with no subject takes the main clause's subject: <i>I desire(vt) &lt;object&gt;
        &lt;clause_start&gt; &lt;verb&gt; sleep(vi)</i> is “I want to sleep”. A main clause with no subject
        leaves it unspecified, “someone”.
      </p>
      <p className="mt-2">
        Cause and effect is the causality axis, a relation: <W w="result_from(vt)" /> has the
        effect as its subject and <W w="cause(vt)" /> the cause. A plain “because” is{" "}
        <i>from &lt;clause_start&gt; …</i>; for a cause that's a thing or an event, the verbs say it outright.
        Change verbs with an object already mean making something happen directly, so{" "}
        <W w="cause(vt)" /> is for the looser kind: the storm caused the flood.
      </p>
      <Example meaning="Daytime results from the Sun.">
        &lt;subject&gt; daytime &lt;verb&gt; result_from(vt) &lt;object&gt; sun
      </Example>
      <p className="mt-2">
        Counterfactuals need nothing special. As in Mandarin, <W w="if" /> and context say whether a
        condition is real, and to be explicit the if-clause can say it's false with the truth axis.
      </p>
      <Example meaning="If you had slept, you would be strong.">
        if &lt;clause_start&gt; &lt;subject&gt; you &lt;verb&gt; sleep(vi) formerly falsely &lt;clause_end&gt;
        &lt;subject&gt; you &lt;verb&gt; be(vt) &lt;complement&gt; strong
      </Example>

      <H2>Pronouns</H2>
      <p>
        <W w="<pronoun_first_person>" />, <W w="<pronoun_second_person>" /> and{" "}
        <W w="<pronoun_third_person>" />, with number made by compounds: “me” is
        first_person-singular, “we” first_person-plural (also -inclusive and -exclusive), “y'all”
        second_person-plural. The third person can optionally specify plural and gender or sex.{" "}
        <W w="this" /> and <W w="that" /> point near and far, and <W w="<blank>" /> is the question
        word: what a question asks about.
      </p>
      <p className="mt-2">
        Together they make a table of pointing and question words with a few general nouns, like
        Esperanto's correlatives. There's no word for “here” or “there”: like Toki Pona's{" "}
        <i>lon ni</i>, here is <i>at this</i> and there <i>at that</i>, with{" "}
        <i>place this</i> when it needs to be a noun.
      </p>
      <table className="mt-2 text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pr-4 font-normal">bare</th>
            <th className="pr-4 font-normal">this</th>
            <th className="pr-4 font-normal">that</th>
            <th className="pr-4 font-normal">all</th>
            <th className="pr-4 font-normal">none</th>
            <th className="font-normal">&lt;blank&gt;</th>
          </tr>
        </thead>
        <tbody>
          {(
            [
              ["thing", "something", "this thing", "that thing", "everything", "nothing", "what"],
              ["person", "someone", "this person", "that person", "everyone", "no_one", "who"],
              ["place", "somewhere", "here", "there", "everywhere", "nowhere", "where"],
              ["time", "sometime", "now", "then", "always", "never", "when"],
            ] as const
          ).map(([noun, ...cells]) => (
            <tr key={noun} className="border-t border-gray-100">
              <td className="pr-4 py-0.5">
                <W w={noun} /> <span className="text-gray-500">({cells[0]})</span>
              </td>
              {cells.slice(1).map((cell, i) => (
                <td key={i} className="pr-4 py-0.5">
                  {i >= 2 ? <W w={cell} /> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Example meaning="I sleep here.">
        &lt;subject&gt; I &lt;verb&gt; sleep(vi) at this
      </Example>
      <p className="mt-2">
        <W w="thing" /> is the general noun, Toki Pona's <i>ijo</i>. <W w="everything" /> and{" "}
        <W w="nothingness" /> (<W w="nothing" />) are already words, the completeness axis's
        nouns, so <i>thing all</i> and <i>thing none</i> are longer ways to say them. The universe is
        just <W w="everything" />.{" "}
        <W w="self" /> and <W w="other" /> are content roots too. As an object, <W w="self" /> is
        reflexive (<i>I know(vt) self</i>, I know myself), and <i>family of self</i> is one's
        own family. <i>person other</i> is another person, and with a plural subject,{" "}
        <W w="other" /> is each other.
      </p>
      <Example meaning="They love each other.">
        &lt;subject&gt; it plural &lt;verb&gt; love(vt) &lt;object&gt; other
      </Example>

      <H2>Numbers</H2>
      <p>
        A number is <W w="number" /> followed by digits, most significant first. There's one word
        for every base: the base comes from context. A rank after a digit
        gives that digit's place: <W w="<rank_3>" /> puts it at base³, and the digits after it carry on
        down from there. Places a rank jumps over are zeros, so <i>number 1 &lt;rank_3&gt; 3</i> is
        1003 and <i>number 1 &lt;rank_6&gt;</i> is 1,000,000. Negative ranks give fractions and
        percents: <i>number 2 3 &lt;negative&gt; &lt;rank_2&gt;</i> is 23%.
      </p>
      <p className="mt-2">
        <W w="<ordinal>" /> before <W w="number" /> makes it an ordinal: <i>person number 3</i> is
        three people, and <i>person &lt;ordinal&gt; number 3</i> the third person.
      </p>
      <p className="mt-2">
        <W w="<per>" /> marks a denominator. A fraction a/b is “a per b”, so one word gives
        fractions, rates and ratios: <i>&lt;per&gt; number 3</i> is a third,{" "}
        <i>number 2 &lt;per&gt; number 3</i> two thirds and <i>&lt;per&gt; number 1 &lt;rank_3&gt;</i> a thousandth.
        After a noun it's a share or a rate: <i>money &lt;per&gt; number 2</i> is half the money,{" "}
        <i>money &lt;per&gt; person</i> money per person and <i>&lt;per&gt; time &lt;rank_2&gt;</i> per hour. Between
        two numbers it's a ratio, so <i>number 3 &lt;per&gt; number 1</i> is three to one. Denominators are
        whole numbers, so these are exact in any base, unlike digit fractions: a third has no exact
        digits in base 10.
      </p>
      <Example meaning="I work five days a week.">
        &lt;subject&gt; I &lt;verb&gt; work(vi) day number 5 &lt;per&gt; week
      </Example>
      <p className="mt-2">
        Ranks don't depend on the base: <W w="<rank_3>" /> is “thousands” in base 10, but “eights” in
        base 2. By convention ranks work like commas: a base 10 number past <W w="<rank_3>" /> says{" "}
        <W w="<rank_3>" /> somewhere, one past <W w="<rank_6>" /> says <W w="<rank_6>" />, and so on up
        to <W w="<rank_15>" />, skipping any group that's all zeros. 34,103,487 is{" "}
        <i>number 3 4 &lt;rank_6&gt; 1 0 3 &lt;rank_3&gt; 4 8 7 &lt;rank_0&gt;</i>. Bases 2 and 16 group every four
        places instead (<W w="<rank_4>" />, <W w="<rank_8>" />, <W w="<rank_12>" />), so the groups are
        4 bits and 16 bits. Past{" "}
        <W w="<rank_15>" />, <W w="rank" /> takes a subclause holding the place. See the Examples
        page.
      </p>
      <p className="mt-2">
        A number ends at its first rank of zero or below, <W w="<rank_0>" /> or a negative rank. Digits
        share their sounds with the axis words, so the ending tells a listener the next word isn't a
        digit. The final <W w="<rank_0>" /> can be dropped unless an axis word or an axis helper comes
        next. Only axis words can be mistaken for digits, and a helper like <W w="<negative>" /> could
        be starting a negative rank: <i>person number 3</i>, but{" "}
        <i>person number 3 &lt;rank_0&gt; big</i> and <i>person number 3 &lt;rank_0&gt; small</i>.
        Long numbers usually keep it anyway, to make the end easy to hear.
      </p>
      <Open>
        Long fractions. Since the first rank of zero or below ends the number, every digit from the
        ones place down falls in one group: 3.14159 has to be{" "}
        <i>number 3 1 4 1 5 9 &lt;negative&gt; &lt;rank_5&gt;</i>, with no comma-like ranks inside.
      </Open>

      <H2>Arithmetic</H2>
      <p>
        <W w="count(vi)" /> takes rank for the operation, each level repeating the one below, as in
        the mathematical hyperoperations: bare <i>count(vi)</i> is counting, <W w="add(vi)" /> is{" "}
        <i>count(vi) &lt;rank_1&gt;</i>, <W w="multiply(vi)" /> <i>&lt;rank_2&gt;</i> and <W w="exponentiate(vt)" />{" "}
        <i>&lt;rank_3&gt;</i>. Its negative end, <W w="count_down(vi)" />, is the inverse: counting down,{" "}
        <W w="subtract(vi)" />, <W w="divide(vi)" /> and <W w="root(vt)" />. Splitting a thing
        into parts is <W w="split(vi)" />, on the part axis.
      </p>
      <p className="mt-2">
        What an operation gives is its <W w="result" />: <W w="sum" /> is{" "}
        <i>result of &lt;gerund&gt; add(vt)</i>, and likewise <W w="arithmetic_difference" />,{" "}
        <W w="product" />, <W w="quotient" /> and <W w="power" />. Equals is <W w="equal(vt)" />, the
        top of the similarity axis. The object is the number acted on and <W w="by" /> gives the amount, and a logarithm
        is just <W w="rank" />, the exponent a number already has.
      </p>
      <Example meaning="Two plus three equals five.">
        &lt;subject&gt; &lt;gerund&gt; add(vt) &lt;object&gt; number 2 by number 3 &lt;verb&gt; equal(vt) &lt;object&gt;
        number 5
      </Example>
      <Example meaning="Divide 6 by 3.">
        &lt;verb_prescriptive&gt; divide(vt) &lt;object&gt; number 6 by number 3
      </Example>

      <H2>Conversation</H2>
      <p>
        There are no special words for answers and greetings; axis words do the work. Yes and no
        are <W w="true" /> and <W w="false" />, “that's so” and “that's not so”. Hello is{" "}
        <W w="good" /> and goodbye <i>go(vi) well</i>. Thanks and apologies come from the
        accountability axis, credit and blame: thank you is <i>thanks to you</i>, the credit goes
        to you, and sorry is <i>blame to me</i>, my fault. Between them, <W w="acknowledge(vt)" /> says
        whose something is without judging it. In full, <i>I thank(vt) you</i> and{" "}
        <i>I be(vt) &lt;complement&gt; culpable</i>, I'm to blame.
      </p>
      <p className="mt-2">
        “How” needs no word either: after the verb is where manner goes, so <W w="<blank>" /> there
        asks for it. Manner or way as a noun is <W w="path" />, as in “in a spirit of brotherhood”,{" "}
        <i>in path family</i>.
      </p>
      <Example meaning="How do you work?">
        &lt;subject&gt; you &lt;verb_interrogative&gt; work(vi) &lt;blank&gt;
      </Example>

      <H2>Other grammar words</H2>
      <p>
        <W w="<foreign>" /> marks a foreign word or name. Possession needs no word of its own: <W w="of" /> covers it, as in <i>family of me</i>.
      </p>
      <p className="mt-2">
        <W w="<filler>" /> is a hesitation, like “um” or Spanish “pues”. It means nothing and can go
        anywhere, even inside a phrase or a number; the grammar carries on as if it weren't there.
      </p>
      <Example meaning="I, um, slept.">
        &lt;subject&gt; I &lt;verb&gt; &lt;filler&gt; sleep(vi) formerly
      </Example>
    </div>
  );
}
