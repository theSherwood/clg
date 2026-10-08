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
      <p className="mt-2">
        Stress falls on a word's first syllable, as in Finnish and Czech, compounds included. Since
        a word starts with its head, the stress marks where each word begins.
      </p>
      <Open>
        Stress on the second-to-last syllable, as in Polish and Esperanto, would sound smoother,
        but it moves as a compound grows. First-syllable stress is the rule for now.
      </Open>

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
        named this way, though buildings take their own root: <W w="house" /> is{" "}
        <i>building family</i>, a <W w="room" /> <i>part building</i>, a <W w="tower" />{" "}
        <i>building high</i> and a <W w="city" /> <i>land building</i>, built-up land. A{" "}
        <W w="brick" /> is <i>rock artificial</i>. <W w="chair" /> is <i>&lt;place&gt; sit(vi)</i>, <W w="table" />{" "}
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
        &lt;subject&gt; everyone &lt;verb&gt; be_entitled_to(vt) &lt;object&gt; life and freedom and safety.
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
      <p className="mt-2">
        <W w="<complement>" /> can follow any verb, saying what the subject is while the verb
        happens: born free, came home wet. It always describes the subject; what the object is
        goes on the object as a modifier, <i>&lt;object&gt; water hot</i>. With <W w="be(vt)" />,
        there's nothing else happening, so it's just what the subject is.
      </p>
      <Example meaning="Everyone is born free.">
        &lt;subject&gt; everyone &lt;verb&gt; be_born(vi) &lt;complement&gt; free
      </Example>
      <Example meaning="The child came home wet.">
        &lt;subject&gt; child &lt;verb&gt; come(vi) formerly to house &lt;complement&gt; wet
      </Example>
      <p className="mt-2">
        Change verbs have becoming built in, but action and relation verbs don't. For those,{" "}
        <W w="become" /> is a prefix on the verb, coming into its state, like Toki Pona's{" "}
        <i>kama</i>: <i>become possess(vt)</i> is gain, <i>become know(vt)</i> come to know.
      </p>
      <Example meaning="I gained a house.">
        &lt;subject&gt; I &lt;verb&gt; become possess(vt) formerly &lt;object&gt; house
      </Example>
      <p>
        <W w="<verb_prescriptive>" /> makes a verb prescriptive or imperative (should, shall), and{" "}
        <W w="<verb_interrogative>" /> makes it a question. In a question, <W w="<blank>" /> stands
        for what's being asked about; without it, the question is yes or no. With <W w="we" /> as
        its subject, <W w="<verb_prescriptive>" /> is “let's”.
      </p>
      <Example meaning="Let us make brick.">
        &lt;subject&gt; we &lt;verb_prescriptive&gt; create(vt) &lt;object&gt; brick
      </Example>
      <Example meaning="No one shall be held in slavery or servitude.">
        &lt;subject&gt; no_one &lt;verb_prescriptive&gt; be(vt) &lt;complement&gt; owned or forced.
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
        <i>for &lt;blank&gt;</i> why, <i>by &lt;blank&gt;</i> how (by what means),{" "}
        <i>with &lt;blank&gt;</i> with whom and <i>number &lt;blank&gt;</i> how many. The answers
        follow the same pattern: <i>for nothing</i> is for no reason, arbitrarily.
      </p>
      <Example meaning="Why do you fight?">
        &lt;subject&gt; you &lt;verb_interrogative&gt; fight(vi) for &lt;blank&gt;
      </Example>

      <H2>Leaving the doer unsaid</H2>
      <p>
        There's no passive voice. A clause that opens with <W w="<object>" /> and has no subject
        leaves the doer unsaid, which is what the passive is for:{" "}
        <i>&lt;object&gt; rock &lt;verb&gt; eat(vt) formerly</i> is “the rock was eaten”. A clause that opens
        with its verb marker instead borrows a subject (see Conjunctions and clauses).
      </p>
      <Example meaning="The rock was eaten.">&lt;object&gt; rock &lt;verb&gt; eat(vt) formerly</Example>

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
        A noun about time right after a verb says when, not what: <i>sleep(vi) always</i>,{" "}
        <i>use(vt) never</i>, <i>sleep(vi) hour many</i>. Any other bare noun there is a built-in
        object, as in <i>work(vt) information</i>, to compute.
      </p>
      <Example meaning="These rights shall never be used against their purpose.">
        &lt;object&gt; right this &lt;verb_prescriptive&gt; use(vt) never for &lt;gerund&gt; oppose(vt)
        purpose of it
      </Example>
      <p className="mt-2">
        <W w="<continuous_tense_aspect>" /> marks something as ongoing and{" "}
        <W w="<perfect_tense_aspect>" /> as done, with a result that still holds. They also follow the
        verb, before any time adverb, so the two combine like English's tenses. With both,
        continuous comes first, and perfect applies to the ongoing action: <i>work
        &lt;continuous_tense_aspect&gt; &lt;perfect_tense_aspect&gt;</i> is “have been working”.
      </p>
      <p className="mt-2">
        <W w="again" /> goes with the aspects, after the verb: <i>open(vt) again</i> is
        “reopen”. On a verb's negative end it undoes, and says the thing had been done:{" "}
        <i>&lt;negative&gt; cover(vt) again</i> is “uncover”, made exposed again.
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
        particular. Whose law it is goes with <W w="of" />. To <W w="punish(vt)" /> is{" "}
        <i>hurt(vt) for law</i>, to hurt for the rule's sake; without an object it's to be
        punished, to suffer for the law. Pain's fullest step is <W w="torment(vt)" /> (torture),
        and its adverb <W w="cruelly" />: <i>punish(vt) cruelly</i> is cruel punishment, to the point
        of agony.
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
        &lt;subject&gt; I &lt;verb&gt; believe(vt) &lt;object&gt; &lt;subject&gt; person
        &lt;verb&gt; go(vi) &lt;min_positive&gt; truly &lt;clause_end&gt;
      </Example>

      <H2>Choice, safety, conscience and meta</H2>
      <p>
        The sex axis is <W w="female" /> and <W w="male" />. Mating is joining them:{" "}
        <W w="mate(vi)" /> is <i>connect(vi) sex</i>.
      </p>
      <p className="mt-2">
        Choosing is an axis, <W w="choose(vi)" /> and <W w="reject(vt)" />, and preferring is
        leaning toward choosing, its minor positive step: <W w="prefer(vt)" />. A comparison says
        what over: <i>prefer(vt) X exceed(vt) Y</i>. The axis's measure, how worth choosing
        something is, is <W w="value" />, and <W w="dignity" /> is <i>value intrinsic</i>, worth
        that belongs to a thing itself. Value in money is <W w="price" />. Safety is its own axis too, <W w="safe" /> and{" "}
        <W w="dangerous" />, with <W w="secure(vt)" /> and <W w="endanger(vt)" />; withstanding harm
        is resilience.
      </p>
      <p className="mt-2">
        Reasoning is the logic axis, from premises to conclusions: <W w="assume(vt)" /> a{" "}
        <W w="premise" /> at the negative end and <W w="infer(vt)" /> a <W w="conclusion" /> at the
        positive, whose no-object meaning is <W w="reason(vi)" />. At the ends,{" "}
        <W w="posit(vt)" /> an <W w="axiom" /> and <W w="derive(vt)" /> a <W w="theorem" />.{" "}
        <W w="reason" />, the faculty, is <i>&lt;tool&gt; infer(vt)</i>. A reason for believing
        something is a premise, a reason something happened a <W w="cause" />, and a reason for
        doing it a <W w="purpose" />, <i>&lt;to&gt; aim(vt)</i>, what the act is aimed at. In general,
        “a reason” is a cause, as German <i>Grund</i> and Toki Pona <i>tan</i> are both.
      </p>
      <Example meaning="I infer that you slept.">
        &lt;subject&gt; I &lt;verb&gt; infer(vt) &lt;object&gt; &lt;subject&gt; you &lt;verb&gt; sleep(vi) formerly
      </Example>
      <p className="mt-2">
        <W w="mind" /> is <i>&lt;er&gt; sense(vt) self</i>, what perceives itself. A <W w="machine" /> is{" "}
        <i>worker artificial</i>, an artificial <W w="worker" />. Making something new or following what exists is the
        provenance axis: <W w="original" /> and <W w="derivative" />, <W w="invent(vt)" /> and{" "}
        <W w="imitate(vt)" />, with a <W w="copy" /> as imitation at its fullest and a{" "}
        <W w="source" /> (<W w="canonical" />) as originality at its fullest: <i>source of truth</i>.{" "}
        To <W w="compute(vi)" /> is <i>work(vt) information</i>, to work data, as German{" "}
        <i>Datenverarbeitung</i> is data processing; <W w="computation" /> is{" "}
        <i>&lt;gerund&gt; work(vt) information</i> and a <W w="computer" />{" "}
        <i>&lt;tool&gt; work(vt) information</i>. Working a material is crafting it, as German{" "}
        <i>werken</i>: <i>work(vt) rock</i> is stonework. <W w="conscience" /> is <i>&lt;tool&gt; blame(vt) self</i>, what you blame yourself with, and by
        the same axis credit yourself. A <W w="model" /> is <i>&lt;er&gt; resemble(vt)</i>, a thing that
        resembles another. <W w="meta" /> as a modifier makes X about X: <i>merit meta</i> is
        metaethics, the study of what good is, and <i>knowledge meta</i> knowing what you know.
        <W w="merit" />, the goodness axis, is also morality or ethics, and a principle is an{" "}
        <W w="axiom" />, a posited starting point.
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
      <p className="mt-2">
        Birth is the child end's verb: without an object, <W w="be_born(vi)" />; with one, to
        bear a child, <W w="bear(vt)" />. To <W w="reproduce(vi)" /> is <i>bear(vt) child</i>.
      </p>
      <Example meaning="My grandparent has many descendants.">
        &lt;subject&gt; grandparent of me &lt;verb&gt; possess(vt) &lt;object&gt; &lt;max_positive&gt; child many
      </Example>
      <p className="mt-2">
        To <W w="marry(vi)" /> is <i>connect(vi) family</i>, as mating is <i>connect(vi) sex</i>,
        and a <W w="marriage" /> <i>&lt;gerund&gt; marry(vi)</i>. Growing up is the age axis:{" "}
        <W w="juvenile" /> leans new and <W w="mature" /> leans old, so an <W w="adult" /> is{" "}
        <i>person mature</i>. <W w="child" /> is the lineage word, someone's child, at any age.
        A <W w="friend" /> is <i>&lt;ee&gt; like(vt)</i>, an <W w="enemy" />{" "}
        <i>&lt;ee&gt; hate(vt)</i> and a <W w="beloved" /> <i>&lt;ee&gt; love(vt)</i>, so{" "}
        <i>friend of me</i> is the one I like, and <i>friend mutual</i> says it goes both ways.
      </p>
      <Open>
        Gendered words are long: “mother” is <i>parent female</i>, which is <i>&lt;negative&gt; child
        &lt;negative&gt; male</i>, four syllables for a very common word.
      </Open>

      <H2>Society and country</H2>
      <p>
        People come first. A <W w="society" /> is <i>group person</i>, a group of people: a
        community, or a people. A <W w="country" /> is <i>land society</i>, a society's land, and a{" "}
        <W w="government" /> <i>&lt;gerund&gt; govern(vi)</i>, governing, where to{" "}
        <W w="govern(vi)" /> is <i>lead(vt) society</i>; a <W w="governor" /> is{" "}
        <i>&lt;er&gt; govern(vi)</i>. <W w="politics" />, <i>&lt;gerund&gt; seek(vt) authority</i>, is
        the contest over who governs, and as a modifier it's “political”: a non-political crime is{" "}
        <i>crime not politics</i>. <W w="democracy" /> is <i>government everyone</i>, everyone's
        government, and a democratic society <i>society democracy</i>. A <W w="member" /> is{" "}
        <i>&lt;ee&gt; include(vt)</i>, who's included, and a <W w="citizen" /> <i>member country</i>;
        one's nationality is <i>country of self</i>. A <W w="border" /> is <i>edge country</i>.
        “Nation” and “state” are whichever of these is meant, “international” is{" "}
        <i>between country plural</i> and humanity is <W w="everyone" />.
      </p>
      <p className="mt-2">
        A <W w="leader" /> is <i>&lt;er&gt; lead(vt)</i>. To <W w="vote(vi)" /> is{" "}
        <i>choose(vi) together</i>, and with an object to vote for; a <W w="vote" /> or election is{" "}
        <i>&lt;gerund&gt; vote(vi)</i>. A <W w="representative" /> is <i>&lt;er&gt; act(vi) for
        other</i>, who acts on others' behalf, and taking part is <i>act(vi) in</i>. Public and
        private have no words of their own. Seen, they're <W w="visible" /> and <W w="hidden" />,
        so a secret ballot is <i>vote(vi) secretly</i>; owned, they're <i>of society</i> and{" "}
        <i>of self</i>, so public service is <i>serve(vt) society</i>. <W w="privacy" /> is{" "}
        <i>hiding self</i>.
      </p>
      <Example meaning="Everyone may leave any country and come back to their own.">
        &lt;subject&gt; everyone &lt;verb&gt; be_entitled_to(vt) &lt;object&gt; &lt;verb&gt; exit(vi) from country
        all and &lt;verb&gt; come(vi) to country of self
      </Example>

      <H2>Law and justice</H2>
      <p>
        To <W w="judge(vt)" /> is <i>infer(vt) accountability</i>, to reason out who's accountable.
        A <W w="judge" /> is <i>&lt;er&gt; judge(vt)</i>, a <W w="court" />{" "}
        <i>&lt;place&gt; judge(vt)</i> and a <W w="trial" /> <i>&lt;gerund&gt; judge(vt)</i>. A{" "}
        <W w="crime" /> is <i>deed forbidden</i> and the <W w="constitution" /> <i>law source</i>.
        Accusing is <W w="blame(vt)" /> and the accused <i>&lt;ee&gt; blame(vt)</i>; guilty is{" "}
        <W w="culpable" /> and innocent <i>not culpable</i>. Convicting is{" "}
        <i>judge(vt) as culpable</i>, with <W w="as" /> saying what the object is judged to be, and
        acquitting <i>judge(vt) as not culpable</i>. A <W w="wrong" /> or sin is <i>deed bad</i>,
        and to <W w="forgive(vt)" /> is <i>release(vt) from blame</i>. To <W w="tempt(vt)" /> is{" "}
        <i>persuade(vt) to wrong</i>, and <W w="temptation" /> <i>&lt;gerund&gt; tempt(vt)</i>. <W w="impartial" />, fair, is the middle of the
        value axis, neither choosing nor rejecting.
      </p>
      <Example meaning="The law shall presume the accused not guilty.">
        &lt;subject&gt; law &lt;verb_prescriptive&gt; assume(vt) &lt;object&gt; &lt;ee&gt; blame(vt) as not
        culpable
      </Example>

      <H2>Work, money and health</H2>
      <p>
        A <W w="worker" /> is <i>&lt;er&gt; work(vi)</i>, to <W w="pay(vi)" /> is{" "}
        <i>give(vt) money</i>, with <W w="to" /> for whom, and a <W w="wage" /> is{" "}
        <i>money work</i>, and a <W w="union" /> <i>group worker</i>. Whose side one acts on is
        the support axis: <W w="help(vt)" /> and <W w="oppose(vt)" />, with{" "}
        <W w="cooperate(vi)" /> a lesser helping and <W w="compete(vi)" /> a lesser opposing,
        against someone toward the same goal; a <W w="rival" /> is <i>&lt;ee&gt; compete(vi)</i>. To{" "}
        <W w="argue(vi)" /> is <i>compete(vi) by speech</i>, and an <W w="argument" />{" "}
        <i>&lt;gerund&gt; argue(vi)</i>.
        Making something easier or harder, whatever the intent, is <W w="enable(vt)" /> and{" "}
        <W w="hinder(vt)" />. Enough is the middle of the quantity axis:{" "}
        <W w="enough" />, between few and many.
      </p>
      <p className="mt-2">
        Health is the integrity axis, as heal, whole and hale share a root: <W w="health" /> is{" "}
        <i>integrity body</i>, healthy is{" "}
        <W w="intact" />, healing <W w="mend(vt)" /> without an object, and <W w="sick" /> a lesser
        breaking, <i>&lt;min_negative&gt; intact</i>. Mending bodies gives <W w="medicine" /> (
        <i>&lt;gerund&gt; mend(vt) body</i>), a <W w="doctor" />, a <W w="drug" /> and a{" "}
        <W w="hospital" />, by the role markers. <W w="clothing" /> is <i>covering person</i>, a
        person's covering, as skin is a body's, and a <W w="cloak" /> or coat{" "}
        <i>clothing outside</i>.
      </p>
      <Example meaning="The doctor healed the sick child.">
        &lt;subject&gt; doctor &lt;verb&gt; mend(vt) formerly &lt;object&gt; child sick
      </Example>

      <H2>Education, culture and science</H2>
      <p>
        Educating gives the role-marker family: <W w="education" /> is{" "}
        <i>&lt;gerund&gt; educate(vt)</i>, a <W w="teacher" /> <i>&lt;er&gt; educate(vt)</i>, a{" "}
        <W w="student" /> <i>&lt;ee&gt; educate(vt)</i> and a <W w="school" />{" "}
        <i>&lt;place&gt; educate(vt)</i>. Elementary education is <i>education juvenile</i> and
        higher education <i>education mature</i>. A pattern is a <W w="regularity" />, so a{" "}
        <W w="habit" /> is <i>regularity person</i>, a person's patterns, and <W w="culture" />{" "}
        <i>regularity society</i>, a society's. The rest are activities, named by the gerund
        like education: <W w="science" /> is <i>&lt;gerund&gt; seek(vt) knowledge</i>, with a{" "}
        <W w="scientist" />, and <W w="art" /> <i>&lt;gerund&gt; create(vt) beauty</i>, with an{" "}
        <W w="artist" /> and an <W w="artwork" />. Seeking succeeds in <W w="find(vt)" />, the
        far end of searching, as hiding ends in <W w="misplace(vt)" />, losing something. Losing a contest is{" "}
        <W w="lose(vi)" />. Costing nothing is the far cheap end of price,{" "}
        <W w="gratis" />; <W w="free" /> is liberty. Respect and tolerance are{" "}
        <W w="acknowledge(vt)" />.
      </p>
      <Example meaning="Elementary education shall be free and compulsory.">
        &lt;subject&gt; education juvenile &lt;verb_prescriptive&gt; be(vt) &lt;complement&gt; gratis and
        obligatory
      </Example>

      <H2>Speech, writing and the senses</H2>
      <p>
        These are action axes, each with its counterpart at the other end:{" "}
        <W w="say(vt)" /> and <W w="listen(vi)" />, <W w="write(vi)" /> and <W w="read(vi)" />,{" "}
        <W w="show(vi)" /> and <W w="watch(vt)" /> (<W w="look(vi)" /> without an object),{" "}
        <W w="sense(vt)" /> and <W w="overlook(vt)" />, <W w="use(vi)" /> and <W w="discard(vi)" />,{" "}
        <W w="do(vt)" /> and <W w="undo(vi)" />, and <W w="touch(vi)" /> and <W w="avoid(vt)" />. The
        scale grades them: <i>&lt;min_positive&gt; write(vi)</i>, a lesser writing, is a mark, and{" "}
        <i>&lt;min_negative&gt; write(vi)</i> is skimming. Nouns come from the role markers: a word is{" "}
        <i>&lt;ee&gt; say(vt)</i>, a text <i>&lt;ee&gt; write(vt)</i> and an ear <i>&lt;tool&gt; hear(vt)</i>. Attaching is{" "}
        <W w="connect(vi)" />.
      </p>
      <p className="mt-2">
        The senses are all one pattern: <W w="sense(vt)" /> and the medium each one takes in.{" "}
        <W w="see(vt)" /> is <i>sense(vt) light</i>, <W w="hear(vt)" /> <i>sense(vt) sound</i>,{" "}
        <W w="feel(vt)" /> <i>sense(vt) contact</i>, <W w="taste(vt)" /> <i>sense(vt) taste</i> and{" "}
        <W w="smell(vt)" /> <i>sense(vt) odor</i>. Seeing and hearing just happen; watching and
        listening are attending to what's shown or said, so they're the far ends of{" "}
        <W w="show(vi)" /> and <W w="say(vt)" />. Feelings are perceived the same way, with{" "}
        <W w="sense(vt)" /> and the feeling: <i>sense(vt) pain</i> is to feel pain, so{" "}
        <W w="feel(vt)" /> stays touch.
      </p>
      <p className="mt-2">
        Tastes and smells are qualities, built like colors: <i>taste fun</i> is sweet,{" "}
        <i>taste painful</i> bitter, <i>taste sharp</i> sour, <i>taste rock</i> salty and{" "}
        <i>taste flesh</i> savory. <i>taste good</i> is delicious and <i>odor good</i> fragrant.
      </p>
      <Example meaning="The water tastes salty.">
        &lt;subject&gt; water &lt;verb&gt; be(vt) &lt;complement&gt; taste rock
      </Example>
      <p className="mt-2">
        Untruth is the truth axis's adverb: <W w="tell_a_lie(vi)" /> is <i>say(vt) falsely</i>, and{" "}
        <W w="pretend(vi)" /> is <i>show(vi) falsely</i>, which with an object is to disguise it.
        Appearing and disappearing aren't showing: they're <W w="emerge(vi)" /> and{" "}
        <W w="vanish(vi)" />.
      </p>
      <p className="mt-2">
        To <W w="promise(vt)" /> is <i>say(vt) dutifully</i>, saying so as to bind oneself, and a{" "}
        <W w="promise" /> is what's promised. Trying is the middle of success: <W w="try(vi)" />,
        an <W w="attempt" />, with the outcome still open.
      </p>
      <p className="mt-2">
        Thinking is inner speech: <W w="think(vi)" /> is <i>say(vt) within</i>, so like{" "}
        <W w="say(vt)" /> it takes a clause, “think that…”. <W w="thought" /> is{" "}
        <i>&lt;gerund&gt; think(vi)</i> and an <W w="idea" /> <i>&lt;ee&gt; think(vt)</i>, what's
        thought. An opinion is a <W w="belief" />, and to <W w="agree(vi)" /> is{" "}
        <i>believe(vi) identically</i>, to believe the same; <W w="agree_on(vt)" /> takes what's
        agreed, and <W w="with" /> whom. A <W w="god" /> is <i>&lt;ee&gt; worship(vt)</i>,
        what's worshipped, and a <W w="religion" /> <i>belief worship</i>, a belief with worship.
        An <W w="emotion" /> is <i>&lt;gerund&gt; sense(vt) value</i>, sensing what matters: fear
        senses danger and joy good.
        A <W w="language" /> is <i>&lt;tool&gt; say(vt)</i>, what one speaks with, a{" "}
        <W w="message" /> <i>&lt;ee&gt; send(vt) information</i> and a <W w="reputation" />{" "}
        <i>belief of other</i>, what others believe of one.
      </p>
      <p className="mt-2">
        Signs are the signification axis, a relation whose two ends are a sign and what it stands
        for, as cause and result are two ends of one link: a <W w="symbol" /> or sign, and its{" "}
        <W w="meaning" />. The symbol is the subject of <W w="mean(vt)" />, and the meaning of{" "}
        <W w="be_called(vt)" />. A name is the commonest symbol, so <i>symbol of you</i>{" "}
        is your name, and a <W w="word" /> is <i>symbol speech</i>, a spoken one. When a symbol
        could be a name or a picture, as a country's, <i>word of country</i> is the name.
      </p>
      <Example meaning="What does this mean?">
        &lt;subject&gt; this &lt;verb_interrogative&gt; mean(vt) &lt;object&gt; &lt;blank&gt;
      </Example>
      <Example meaning="The city is called Babel.">
        &lt;subject&gt; city &lt;verb&gt; be_called(vt) &lt;object&gt; &lt;foreign&gt; babel
      </Example>
      <Example meaning="I think that you slept.">
        &lt;subject&gt; I &lt;verb&gt; think(vt) &lt;object&gt; &lt;subject&gt; you &lt;verb&gt; sleep(vi) formerly
      </Example>

      <H2>Comparison</H2>
      <p>
        Comparison is a relation verb, <W w="exceed(vt)" />, and an <W w="in" /> phrase names the
        quality compared, optional when context makes it clear. Its negative is “fall short of”,
        and the rest comes from words that already exist: <W w="equal(vt)" /> is “as big as”,{" "}
        <i>exceed(vt) &lt;object&gt; all</i> is “the biggest”, and the scale grades it, so{" "}
        <i>&lt;max_positive&gt; exceed(vt)</i> is “much bigger” and <i>&lt;min_positive&gt; exceed(vt)</i> “slightly
        bigger”. Many languages compare this way, like Nigerian Pidgin's “e big pass you”.
        “The more…, the more…” is <W w="increase(vi)" /> with <W w="with" />, along with: the
        harder the wind blew, the tighter the cloak is <i>closure of cloak increase(vi) with &lt;gerund&gt;
        blow(vi) of wind</i>.
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
        solid ground. <W w="go(vi)" /> is moving in general, between <W w="come(vi)" /> and{" "}
        <W w="stay(vi)" /> on the travel axis. Staying somewhere is living there: <i>stay(vi) at
        that</i>, they dwelt there.
      </p>
      <p className="mt-2">
        The verb names the medium, not who or what moves, so a boat swims and a plane flies; as
        Russian <i>плыть</i> is both to swim and to sail. Vehicles are <W w="<tool>" /> and the verb:{" "}
        <W w="boat" /> is <i>&lt;tool&gt; swim(vi)</i>, <W w="aircraft" /> <i>&lt;tool&gt; fly(vi)</i> and{" "}
        <W w="spacecraft" /> <i>&lt;tool&gt; spacefly(vi)</i>. Animals are named loosely by how they move,
        as in English: <W w="bird" /> is <i>animal flying</i> and <W w="fish" /> <i>animal swimming</i>,
        and a <W w="feather" /> is <i>covering bird</i>. An animal's call is <W w="animal_noise" />,{" "}
        <i>speech animal</i>. A <W w="bug" /> is a very small animal,{" "}
        <i>animal &lt;max_negative&gt; big</i>, and a <W w="louse" /> <i>bug hair</i>.
      </p>
      <Example meaning="The bird flies to the tree.">
        &lt;subject&gt; bird &lt;verb&gt; fly(vi) to tree
      </Example>

      <H2>Parts of things</H2>
      <p>
        Limbs count their segments out from the body with rank, as Toki Pona's <i>luka</i> is
        arm and hand: <W w="hand" /> is <i>arm &lt;rank_2&gt;</i> and <W w="finger" />{" "}
        <i>arm &lt;rank_3&gt;</i>, <W w="foot" /> <i>leg &lt;rank_2&gt;</i> and <W w="toe" />{" "}
        <i>leg &lt;rank_3&gt;</i>. Joints are nodes: <W w="elbow" /> is <i>node arm</i>,{" "}
        <W w="wrist" /> <i>node hand</i> and <W w="ankle" /> <i>node foot</i>.
      </p>
      <p className="mt-2">
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
        <i>&lt;tool&gt; know(vt)</i> and <W w="nose" /> <i>&lt;tool&gt; smell(vt)</i>. Where there's no verb for
        it, the kind-and-whole pattern does: <W w="heart" /> is <i>center body</i>, and the{" "}
        <W w="liver" /> <i>filter body</i>, the body's <W w="filter" /> (<i>&lt;tool&gt; separate(vi)</i>). Substances take a
        phase: <W w="blood" /> is <i>liquid body</i>, <W w="sap" /> <i>liquid plant</i> and{" "}
        <W w="flesh" /> <i>matter body</i>. A substance can also be named for what it does:{" "}
        <W w="grease" /> is <i>&lt;tool&gt; slip(vi)</i> and <W w="glue" /> <i>&lt;tool&gt; stick(vi)</i>, from
        the ends of the texture axis.
      </p>
      <p className="mt-2">
        A body part names the like part of another whole, as many languages speak of the foot of a
        mountain. A plant's parts are its body's: <W w="root" /> is <i>foot plant</i>,{" "}
        <W w="trunk" /> <i>torso plant</i>, <W w="branch" /> <i>arm plant</i> and <W w="leaf" />{" "}
        <i>finger plant</i>, and <i>mouth water</i> is a river's mouth. <W w="seed" /> is{" "}
        <i>&lt;ee&gt; sow(vt)</i> and <W w="fruit" /> <i>food seed</i>, food with seed in it.
      </p>

      <H2>Kinds</H2>
      <p>
        Kinds are the ends of the abstraction axis, which runs from <W w="concrete" /> to{" "}
        <W w="abstract" />. A <W w="type" /> (<W w="generic" />) is generalizing as far as it goes,
        and an <W w="instance" /> (<W w="particular" />) is the fully particular case. “What kind?”
        is <i>type &lt;blank&gt;</i>, and “in all its forms” is <i>in type all</i>. To{" "}
        <W w="discriminate(vi)" /> is <i>reject(vt) by type</i>, and its opposite is{" "}
        <W w="impartially" />.
      </p>
      <Example meaning="What kind of animal is it?">
        &lt;subject&gt; it &lt;verb_interrogative&gt; be(vt) &lt;complement&gt; animal &lt;regroup&gt; type &lt;blank&gt;
      </Example>

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
        this</i> is Earth. <W w="wind" /> is <i>air travel</i>, air in motion, and the north wind{" "}
        <i>wind north</i>, as in English. Sending out a medium makes verbs of emitting:{" "}
        <W w="blow(vi)" /> is <i>send(vt) air</i> and <W w="shine(vi)" /> <i>send(vt) light</i>,
        and with an object, to blow or shine on it.
      </p>
      <p className="mt-2">
        Temperature runs <W w="frigid" />, <W w="cold" />, <W w="cool" />, <W w="warm" />,{" "}
        <W w="hot" /> and <W w="burning" />, its lesser steps the milder ones.
      </p>
      <Example meaning="The Sun shone warmly.">
        &lt;subject&gt; sun &lt;verb&gt; shine(vi) formerly warmly
      </Example>
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
        <W w="universe" /> is just <W w="everything" />.
      </p>
      <p className="mt-2">
        The <W w="sky" /> is <i>place high</i>, the high place, as Toki Pona's <i>sewi</i> is up, sky
        and heaven; <W w="heaven" />, <i>sky sacred</i>, says the second outright. <W w="rain" /> is <i>water sky</i> and a <W w="cloud" /> <i>covering sky</i>, the
        sky's covering. What fire leaves is <W w="ash" />, <i>result fire</i>, and <W w="smoke" /> is
        that as a gas, <i>ash gas</i>.
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
        <W w="only" />, <W w="also" /> and <W w="even" /> are prefixes, like <W w="not" />, on the one
        word they focus: <i>only you</i>, <i>also you</i> (you too), <i>even child</i>. On a
        preposition or <W w="if" />, that word opens a phrase, and the phrase is what's focused:{" "}
        <i>only by law</i>, <i>only if …</i>.
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
        <W w="for" />, <W w="in" />, <W w="of" />, <W w="about" />, <W w="at" />, <W w="as" /> (“as”
        or “like”, like Toki Pona's <i>sama</i>) and <W w="between" />, whose two ends are joined
        with <W w="and" />. A preposition
        opens a phrase, and there's no word to close it: the phrase ends at the next grammar
        marker, preposition, clause-level conjunction or <W w="<clause_end>" />. Within a phrase,
        modifiers come before prepositional phrases, so <i>person big with rod</i> is a big
        person with a rod. Phrases that modify the verb go right after it, before{" "}
        <W w="<object>" />, and a phrase after a noun modifies that noun: in{" "}
        <i>secure(vt) at everywhere &lt;object&gt; acknowledgment of right</i>, everywhere is where
        the securing happens and of right says what's acknowledged. Phrases stacked on one side can
        still be ambiguous, as in most languages; bracket one with <W w="<clause_start>" /> and{" "}
        <W w="<clause_end>" /> when it matters, or split the sentence.
      </p>
      <Example meaning="…equal in dignity and rights.">free and same in dignity and right</Example>
      <p className="mt-2">
        <W w="with" /> is company and <W w="by" /> the means: <i>open(vt) with mother</i> is opening
        it with your mother, and <i>open(vt) by &lt;tool&gt; open(vt)</i> opening it with a key. <W w="for" /> is who
        something is for with a noun, <i>for mother</i>, and the purpose with a clause,{" "}
        <i>for &lt;subject&gt; you …</i>, so that you…. Other relations of place are a noun with{" "}
        <W w="at" /> and <W w="of" />, as in Mandarin and Toki Pona: <i>at topside of rock</i> is on
        the rock, and <i>at underside of rock</i> under it.
      </p>
      <Example meaning="The child sleeps between the mother and the father.">
        &lt;subject&gt; child &lt;verb&gt; sleep(vi) between mother and father
      </Example>

      <H2>Conjunctions and clauses</H2>
      <p>
        <W w="and" />, <W w="or" />, <W w="if" /> and <W w="but" />. Exclusive forms are compounds: xor is
        “or-exclusive” and iff is “if-exclusive”. One <W w="and" /> joins both clauses and list
        items: followed by <W w="<subject>" />, <W w="<object>" /> or a verb marker it joins
        clauses, and otherwise list items. <W w="<gerund>" />, like <W w="<er>" /> and{" "}
        <W w="<ee>" />, makes a noun, so after <W w="and" /> it starts a list item: <i>&lt;gerund&gt;
        possess(vt) person and &lt;gerund&gt; exchange(vt) person</i> is “owning people and trading
        people”.
      </p>
      <p className="mt-2">
        <W w="<clause_start>" /> and <W w="<clause_end>" /> bracket a clause inside another, and the
        bracket is the one device for every kind of subclause. <W w="<clause_start>" /> is needed
        only after a noun. After <W w="if" />, a preposition, or a role marker that needs a phrase (
        <W w="<subject>" />, <W w="<object>" />, <W w="<complement>" />), a clause starting with{" "}
        <W w="<subject>" /> or a verb marker can only be a subclause, so the bracket is left out.
        After a noun, a role marker would start the next part of the main clause instead, so
        there it stays. A subclause that opens with <W w="<object>" /> keeps it too, since{" "}
        <i>&lt;object&gt; &lt;object&gt;</i> is hard to read. <W w="<clause_end>" /> can be dropped at the end of a sentence, or of
        a bracketed clause around it, whose own <W w="<clause_end>" /> closes both; but not before
        more of the main clause, whose next role marker would otherwise be read as part of
        the subclause.
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1">
        <li>
          <b>As an object</b>: <i>I believe(vt) &lt;object&gt; &lt;subject&gt; … &lt;clause_end&gt;</i>, I
          believe that…. Its pronouns are the speaker's, so after <W w="say(vt)" /> it's indirect
          speech. With <W w="identically" /> on the verb, it's direct speech, the very words, and its
          pronouns, here and now are the speaker's at the time: <W w="say_verbatim(vt)" /> is{" "}
          <i>say(vt) identically</i>. Direct speech is a sentence of its own, so it always has both
          brackets: it can open with anything, and only <W w="<clause_end>" /> shows where it
          stops. A quote that opens with <W w="<verb_prescriptive>" /> is a command:{" "}
          <i>say_verbatim(vt) &lt;object&gt; &lt;clause_start&gt; &lt;verb_prescriptive&gt; see(vi)
          &lt;clause_end&gt;</i>, they said, “Behold”. A quote longer than one sentence has periods
          inside its brackets: <i>&lt;object&gt; &lt;clause_start&gt; … . … &lt;clause_end&gt;</i>. Adding <W w="meta" /> makes it a quote, someone else's words
          repeated, with <W w="from" /> for whose: <W w="quote(vt)" /> is{" "}
          <i>say(vt) identically meta</i>. Writing works the same way: <W w="write_verbatim(vt)" /> and{" "}
          <W w="quote_in_writing(vt)" />. A <W w="quotation" /> is <i>&lt;ee&gt; quote(vt)</i>, what's
          quoted.
        </li>
        <li>
          <b>After a preposition</b>, for because, when, so that and until:{" "}
          <i>from &lt;subject&gt; …</i> is because…, <i>for &lt;subject&gt; …</i> so that…, and{" "}
          <W w="if" /> takes one the same way. <W w="as" />, “like” with a noun (<i>as sibling</i>), is
          “just as” with a clause: <i>as &lt;subject&gt; we &lt;verb&gt; forgive(vt) …</i>. “When” and “until” are clauses describing a noun,{" "}
          <i>at time &lt;clause_start&gt; …</i> and <i>to time &lt;clause_start&gt; …</i>, so they keep the
          bracket.
        </li>
        <li>
          <b>As a question inside a sentence</b>: an object clause with{" "}
          <W w="<verb_interrogative>" />, and <W w="<blank>" /> for what it asks.{" "}
          <i>I know(vt) &lt;object&gt; &lt;subject&gt; &lt;blank&gt; &lt;verb_interrogative&gt; come(vi)</i> is “I
          know who came”, and without <W w="<blank>" />, whether.
        </li>
        <li>
          <b>After a noun</b>, describing it: <W w="<blank>" /> marks the noun's place in the
          clause, in any role or after any preposition. A plain verb marker tells it from a
          question, which has <W w="<verb_interrogative>" />, as English uses who and where for
          both. The clause describes the noun just before it, so it goes right after its noun,
          before that noun's phrases: <i>child &lt;clause_start&gt; … &lt;clause_end&gt; of friend</i> is
          the friend's child who…, and <i>child of friend &lt;clause_start&gt; … &lt;clause_end&gt;</i> the
          child of the friend who…. A count or ordinal is part of its noun, so the clause follows
          it and describes the whole: <i>thing &lt;ordinal&gt; number 1 &lt;clause_start&gt; …</i> is
          the first one who….
        </li>
      </ul>
      <Example meaning="the person who defended me">
        person &lt;clause_start&gt; &lt;subject&gt; &lt;blank&gt; &lt;verb&gt; defend(vt) &lt;object&gt; me &lt;clause_end&gt;
      </Example>
      <Example meaning="the place where I sleep">
        place &lt;clause_start&gt; &lt;subject&gt; I &lt;verb&gt; sleep(vi) at &lt;blank&gt; &lt;clause_end&gt;
      </Example>
      <p className="mt-2">
        <b>Missing subjects.</b> A clause that opens with its verb marker borrows the subject of
        the clause it's attached to: a subclause the main clause's, and a clause joined by{" "}
        <W w="and" />, <W w="or" /> or <W w="but" /> the previous clause's. Only a sentence that
        opens with a verb marker has nothing to borrow from: with <W w="<verb_prescriptive>" /> it's
        a command to the listener, and otherwise the subject is unspecified, “someone”. A clause
        that opens with <W w="<object>" /> leaves the doer unsaid wherever it is.
      </p>
      <Example meaning="I want to sleep.">
        &lt;subject&gt; I &lt;verb&gt; desire(vt) &lt;object&gt; &lt;verb&gt; sleep(vi)
      </Example>
      <Example meaning="I want to be known.">
        &lt;subject&gt; I &lt;verb&gt; desire(vt) &lt;object&gt; &lt;clause_start&gt; &lt;object&gt; me
        &lt;verb&gt; know(vt) &lt;clause_end&gt;
      </Example>
      <Example meaning="I ate and slept.">
        &lt;subject&gt; I &lt;verb&gt; eat(vt) formerly &lt;object&gt; food and &lt;verb&gt; sleep(vi)
      </Example>
      <Example meaning="Come here!">&lt;verb_prescriptive&gt; come(vi) to this</Example>
      <p className="mt-2">
        Cause and effect is the causality axis, a relation: <W w="result_from(vt)" /> has the
        effect as its subject and <W w="cause(vt)" /> the cause. A plain “because” is{" "}
        <i>from &lt;subject&gt; …</i>; for a cause that's a thing or an event, the verbs say it outright.
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
        if &lt;subject&gt; you &lt;verb&gt; sleep(vi) formerly falsely &lt;clause_end&gt;
        &lt;subject&gt; you &lt;verb&gt; be(vt) &lt;complement&gt; strong
      </Example>

      <H2>Topics and settings</H2>
      <p>
        An <W w="about" /> phrase put first sets the topic, “as for…”. A setting, “in the daytime…”,
        is <W w="if" /> with it, as Toki Pona's <i>la</i> covers both conditions and settings:{" "}
        <i>if &lt;clause_start&gt; daytime &lt;clause_end&gt;</i>.
      </p>
      <Example meaning="As for the rock, I ate it.">
        about rock &lt;subject&gt; I &lt;verb&gt; eat(vt) formerly &lt;object&gt; it
      </Example>

      <H2>Because and so</H2>
      <p>
        “Because” is a subclause after <W w="from" />: <i>from &lt;subject&gt; …</i>. “So” is the
        adverb <W w="consequently" />, on the verb of what follows.
      </p>
      <Example meaning="I slept because I was weak.">
        &lt;subject&gt; I &lt;verb&gt; sleep(vi) formerly from &lt;subject&gt; I &lt;verb&gt; be(vt)
        &lt;complement&gt; weak
      </Example>

      <H2>Pronouns</H2>
      <p>
        <W w="<pronoun_first_person>" />, <W w="<pronoun_second_person>" /> and{" "}
        <W w="<pronoun_third_person>" />, with number made by compounds: <W w="we" /> is{" "}
        <i>&lt;pronoun_first_person&gt; plural</i>, <W w="you_all" /> the second person plural and{" "}
        <W w="they" /> the third. The third person can optionally specify plural and gender or sex.{" "}
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
        own family. It means its own clause's subject, borrowed or not, so in a subclause with a
        subject of its own, the main clause's subject is <W w="<pronoun_third_person>" />. <i>person other</i> is another person, and <W w="each_other" /> is{" "}
        <i>other mutual</i>, the mutual other. <W w="mutual" /> is the adjective of{" "}
        <W w="trade" />, giving and taking alike, the middle of the giving axis.
      </p>
      <Example meaning="They love each other.">
        &lt;subject&gt; they &lt;verb&gt; love(vt) &lt;object&gt; each_other
      </Example>

      <H2>“The” and “a”</H2>
      <p>
        There are no articles, as in Toki Pona and Mandarin: <i>rock</i> is “a rock” or “the rock” by
        context. Where it matters, <W w="this" /> or <W w="that" /> makes it definite and{" "}
        <i>number 1</i> makes it one, any one.
      </p>

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

      <H2>Politeness</H2>
      <p>
        <W w="please" /> is “if you want”, <i>if &lt;verb&gt; desire(vt)</i>, as French{" "}
        <i>s'il vous plaît</i> is “if it pleases you”. It's a set phrase, so it drops both clause
        brackets on either side of the request: <W w="if" /> only ever takes a clause, and
        listeners know where it stops. Its subclause takes the request's subject, you. Thanks and apologies are on the accountability axis, above.
      </p>
      <Example meaning="Sit, please.">&lt;verb_prescriptive&gt; sit(vi) please</Example>
      <Example meaning="Please sit.">please &lt;verb_prescriptive&gt; sit(vi)</Example>

      <H2>Addressing someone</H2>
      <p>
        The one addressed is the subject of a request, as Toki Pona does with <i>o</i>:{" "}
        <i>&lt;subject&gt; mother &lt;verb_prescriptive&gt; come(vi)</i> is “Mother, come”.
      </p>
      <Example meaning="Mother, come.">&lt;subject&gt; mother &lt;verb_prescriptive&gt; come(vi)</Example>
      <p className="mt-2">
        When the one addressed isn't the next clause's subject, the address stands apart, as a
        bracketed subject opening the sentence. The bracket does what a comma and a pause do in
        English: <i>&lt;clause_start&gt; &lt;subject&gt; father &lt;clause_end&gt;</i> is “Father, …”. It
        never fills a role in the clause after it, even one whose doer is unsaid, and from then on
        the one addressed is <W w="<pronoun_second_person>" />, as English vocatives are “you”.
        It comes first, since a bracket after a noun describes that noun, and on its own it's
        calling someone, with <W w="<clause_end>" /> dropped at the sentence's end.
      </p>
      <Example meaning="Our Father in heaven, hallowed be thy name.">
        &lt;clause_start&gt; &lt;subject&gt; father of we at heaven &lt;clause_end&gt; &lt;object&gt; symbol of
        you &lt;verb_prescriptive&gt; sanctify(vt)
      </Example>

      <H2>Other grammar words</H2>
      <p>
        Possession needs no word of its own: <W w="of" /> covers it, as in <i>family of me</i>.
      </p>
      <p className="mt-2">
        <W w="<foreign>" /> marks the next word as a foreign name or borrowing. Every syllable we
        can say is already a root, so a name sounds like a compound, and the marker is what says
        it's sound rather than meaning. A name is one word, ending where the next stressed
        syllable starts, so one of several words is run together: <i>&lt;foreign&gt; new_york</i>.
        It's respelled in our syllables, as Japanese and Toki Pona adapt names: sounds we have
        are kept; another consonant becomes the onset at its place and manner (h is kh, f ph, v
        and w bh, j and y zh), and another vowel the nearest (i is e). n, m, r and l close the
        syllable before them where they can, and are otherwise d or b. A vowel with no onset takes
        kh, and an onset with no vowel takes u. So Babel is <i>ba-ber</i> (r and l being one
        sound), Shinar <i>shen-khar</i>, Adam <i>kha-dan</i> and London <i>don-don</i>. A name
        usually follows a noun for its kind, as in Toki Pona's <i>ma Kanata</i>, so the listener
        knows what's coming: <i>land &lt;foreign&gt; shinar</i>, <i>person &lt;foreign&gt; adam</i>.
      </p>
      <Example meaning="Adam came from the land of Shinar.">
        &lt;subject&gt; person &lt;foreign&gt; adam &lt;verb&gt; come(vi) formerly from land &lt;foreign&gt; shinar
      </Example>
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
