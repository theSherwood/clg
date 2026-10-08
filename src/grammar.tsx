import React from "react";
import { type VerbType, VERB_TYPE_RULES, sections } from "./dict";
import { WithContents } from "./contents";
import { Phrase, Spoken, T, VerbTypeBadge, W } from "./word_ui";

// Grammar and syntax, as decided so far. Word references use <W>, so they show each word's
// current sound and follow the phonology playground.

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 data-toc className="text-lg font-semibold mt-6 mb-2">
    {children}
  </h2>
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
    <div className="font-mono">
      <Phrase text={React.Children.toArray(children).join("")} />
    </div>
    <Spoken transliteration={React.Children.toArray(children).join("")} />
    <div className="text-gray-600">“{meaning}”</div>
  </div>
);

export function GrammarView() {
  return (
    <WithContents view="grammar">
      <div className="p-4 max-w-3xl mx-auto text-gray-800 leading-relaxed">
        <h1 className="text-xl font-bold">Grammar and syntax</h1>
        <p className="text-sm text-gray-600">
          A working draft. Words are shown with their current sound; hover one, or any word in an
          example, for details. Amber
          words are candidates with no root yet. In examples, grammar markers are in angle brackets (
          <T>&lt;subject&gt;</T>, <T>&lt;ee&gt;</T>) and prepositions are bare (<T>to</T>,{" "}
          <T>at</T>).
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
          English employer and employee: <T>&lt;er&gt; eat(vt)</T> is “eater”, <T>&lt;ee&gt; eat(vt)</T> is “what is eaten”,
          so food. <W w="<er>" /> is whoever or whatever does it, not only a person, like English
          printer or opener. Two more markers name other roles, like the prepositions{" "}
          <W w="with" /> and <W w="at" />: <W w="<tool>" /> is what it's done with (<T>&lt;tool&gt; open(vt)</T>,
          a key) and <W w="<place>" /> where it's done (<T>&lt;place&gt; sleep(vi)</T>, a bed). Furniture is
          named this way, though buildings take their own root: <W w="house" /> is{" "}
          <T>building family</T>, a <W w="room" /> <T>part building</T>, a <W w="tower" />{" "}
          <T>building high</T> and a <W w="city" /> <T>land building</T>, built-up land. A{" "}
          <W w="brick" /> is <T>rock artificial</T>. <W w="chair" /> is <T>&lt;place&gt; sit(vi)</T>, <W w="table" />{" "}
          <T>&lt;place&gt; eat(vt)</T> and <W w="desk" /> <T>&lt;place&gt; work(vi)</T>. The same words can
          be a room or a building, a restaurant or a workplace, by context.{" "}
          <W w="<to>" /> and <W w="<from>" /> follow <W w="to" /> and <W w="from" />: who or where it
          goes to (<T>&lt;to&gt; send(vt)</T>, the addressee; <T>&lt;to&gt; go(vi)</T>, the destination) and comes from (
          <T>&lt;from&gt; come(vi)</T>, someone's origin; <T>&lt;from&gt; receive(vt)</T>, the sender). Arabic builds
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
          an adjective. Staying in one is the absence of change, <T>not change(vi)</T>, and keeping
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
          adjective where there is one (<T>hot</T>, not <T>heat</T>), and otherwise the noun (
          <T>matter &lt;rank_1&gt;</T>, a liquid). Mood stays on the verb marker, so “be strong!” is{" "}
          <T>&lt;verb_prescriptive&gt; be(vt) &lt;complement&gt; strong</T>.
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
          goes on the object as a modifier, <T>&lt;object&gt; water hot</T>. With <W w="be(vt)" />,
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
          <i>kama</i>: <T>become possess(vt)</T> is gain, <T>become know(vt)</T> come to know.
        </p>
        <Example meaning="I gained a house.">
          &lt;subject&gt; I &lt;verb&gt; become possess(vt) formerly &lt;object&gt; house
        </Example>
        <p>
          <W w="<verb_prescriptive>" /> makes a verb prescriptive: what should be rather than what is,
          as a command, an obligation (should, shall) or a wish (may…, let…), much like a subjunctive.{" "}
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
          Other question words come from where <W w="<blank>" /> sits: <T>person &lt;blank&gt;</T> is who,{" "}
          <T>at &lt;blank&gt;</T> where, <T>to &lt;blank&gt;</T> where to,{" "}
          <T>from &lt;blank&gt;</T> where from, <T>at time &lt;blank&gt;</T> when,{" "}
          <T>for &lt;blank&gt;</T> why, <T>by &lt;blank&gt;</T> how (by what means),{" "}
          <T>with &lt;blank&gt;</T> with whom and <T>number &lt;blank&gt;</T> how many. The answers
          follow the same pattern: <T>for nothing</T> is for no reason, arbitrarily.
        </p>
        <Example meaning="Why do you fight?">
          &lt;subject&gt; you &lt;verb_interrogative&gt; fight(vi) for &lt;blank&gt;
        </Example>

        <H2>Leaving the doer unsaid</H2>
        <p>
          There's no passive voice. A clause that opens with <W w="<object>" /> and has no subject
          leaves the doer unsaid, which is what the passive is for:{" "}
          <T>&lt;object&gt; rock &lt;verb&gt; eat(vt) formerly</T> is “the rock was eaten”. A clause that opens
          with its verb marker instead borrows a subject (see Conjunctions and clauses).
        </p>
        <Example meaning="The rock was eaten.">&lt;object&gt; rock &lt;verb&gt; eat(vt) formerly</Example>

        <H2>Tense and aspect</H2>
        <p>
          Verbs aren't marked for tense. As in Mandarin, a sentence's time comes from context, and
          once a time is set it carries over to the sentences after it. To be explicit, a time adverb
          follows the verb: <W w="henceforth" /> for the future and <W w="formerly" /> for the past.
          The past is the bare root, since it's said most. The axis scale grades them:{" "}
          <T>&lt;max_positive&gt; formerly</T> is long ago, <T>&lt;min_positive&gt; formerly</T> recently,{" "}
          <T>&lt;neutral&gt; formerly</T> now, <T>&lt;min_negative&gt; formerly</T> soon and{" "}
          <T>&lt;max_negative&gt; formerly</T> the far future.
        </p>
        <p className="mt-2">
          A noun about time right after a verb says when, not what: <T>sleep(vi) always</T>,{" "}
          <T>use(vt) never</T>, <T>sleep(vi) hour many</T>. Any other bare noun there is a built-in
          object, as in <T>work(vt) information</T>, to compute.
        </p>
        <Example meaning="These rights shall never be used against their purpose.">
          &lt;object&gt; right this &lt;verb_prescriptive&gt; use(vt) never for &lt;gerund&gt; oppose(vt)
          purpose of it
        </Example>
        <p className="mt-2">
          <W w="<continuous_tense_aspect>" /> marks something as ongoing and{" "}
          <W w="<perfect_tense_aspect>" /> as done, with a result that still holds. They also follow the
          verb, before any time adverb, so the two combine like English's tenses. With both,
          continuous comes first, and perfect applies to the ongoing action: <T>work
          &lt;continuous_tense_aspect&gt; &lt;perfect_tense_aspect&gt;</T> is “have been working”.
        </p>
        <p className="mt-2">
          <W w="again" /> goes with the aspects, after the verb: <T>open(vt) again</T> is
          “reopen”. On a verb's negative end it undoes, and says the thing had been done:{" "}
          <T>&lt;negative&gt; cover(vt) again</T> is “uncover”, made exposed again.
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
          <T>&lt;rank_0&gt;</T> second, <T>&lt;rank_1&gt;</T> minute, <T>&lt;rank_2&gt;</T> hour, <T>&lt;rank_3&gt;</T> day,{" "}
          <T>&lt;rank_4&gt;</T> week, <T>&lt;rank_5&gt;</T> month, <T>&lt;rank_6&gt;</T> year, then decade, century and
          millennium. A count follows like any other: <T>time &lt;rank_3&gt; number 3</T> is three days. The
          24-hour day is <W w="day" />, <T>time &lt;rank_3&gt;</T>; <W w="daytime" /> is <T>time bright</T> and{" "}
          <W w="night" /> <T>time dark</T>.
        </p>
        <p className="mt-2">
          <W w="next" /> and <W w="previous" /> count steps in any sequence from a reference point.
          In a main clause that's now, so <T>time &lt;rank_3&gt; next</T> is tomorrow and{" "}
          <T>time &lt;rank_3&gt; previous</T> yesterday; in a subclause it's the main clause's time, so the
          same words mean the next day and the day before. Rank counts steps, as for generations:{" "}
          <T>next &lt;rank_2&gt;</T> is the one after next. As verbs, <W w="precede(vt)" /> and{" "}
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
          words: <T>&lt;max_negative&gt; truly</T> is “certainly not”, <W w="falsely" /> “not so”,{" "}
          <T>&lt;min_negative&gt; truly</T> “probably not”, <T>&lt;neutral&gt; truly</T> “maybe”,{" "}
          <T>&lt;min_positive&gt; truly</T> “probably”, <W w="truly" /> “so” and <T>&lt;max_positive&gt; truly</T>{" "}
          “certainly”. A plain statement claims something is true, not that it's certain, so it sits
          one step below the top. Proof is how something is known, not how likely it is:{" "}
          <W w="prove(vt)" /> with <W w="<perfect_tense_aspect>" /> is “has proved”.
        </p>
        <p className="mt-2">
          Ability, the “can” of “I can swim”, is the capability axis, and its adverb is the modal:{" "}
          <W w="ably" /> is can and <W w="incapably" /> can't. Possibility is the modality axis (
          <T>not impossibly</T>) and permission is <W w="allow(vt)" />, so English “can” splits three
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
          A <W w="law" /> or rule is <T>command abstract</T>, a general command: it applies to anyone
          in a given kind of case, where a <W w="command" /> is an order to someone about something
          particular. Whose law it is goes with <W w="of" />. To <W w="punish(vt)" /> is{" "}
          <T>hurt(vt) for law</T>, to hurt for the rule's sake; without an object it's to be
          punished, to suffer for the law. Pain's fullest step is <W w="torment(vt)" /> (torture),
          and its adverb <W w="cruelly" />: <T>punish(vt) cruelly</T> is cruel punishment, to the point
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
          <W w="impossible" /> to <W w="necessary" />. Its middle, <T>&lt;neutral&gt; necessary</T>, is
          contingent. Possible is <T>not impossible</T> and “possibly not” is <T>not necessary</T>,
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
          <W w="mate(vi)" /> is <T>connect(vi) sex</T>.
        </p>
        <p className="mt-2">
          Choosing is an axis, <W w="choose(vi)" /> and <W w="reject(vt)" />, and preferring is
          leaning toward choosing, its minor positive step: <W w="prefer(vt)" />. A comparison says
          what over: <T>prefer(vt) X exceed(vt) Y</T>. The axis's measure, how worth choosing
          something is, is <W w="value" />, and <W w="dignity" /> is <T>value intrinsic</T>, worth
          that belongs to a thing itself. Value in money is <W w="price" />. Safety is its own axis too, <W w="safe" /> and{" "}
          <W w="dangerous" />, with <W w="secure(vt)" /> and <W w="endanger(vt)" />; withstanding harm
          is resilience.
        </p>
        <p className="mt-2">
          Reasoning is the logic axis, from premises to conclusions: <W w="assume(vt)" /> a{" "}
          <W w="premise" /> at the negative end and <W w="infer(vt)" /> a <W w="conclusion" /> at the
          positive, whose no-object meaning is <W w="reason(vi)" />. At the ends,{" "}
          <W w="posit(vt)" /> an <W w="axiom" /> and <W w="derive(vt)" /> a <W w="theorem" />.{" "}
          <W w="reason" />, the faculty, is <T>&lt;tool&gt; infer(vt)</T>. A reason for believing
          something is a premise, a reason something happened a <W w="cause" />, and a reason for
          doing it a <W w="purpose" />, <T>&lt;to&gt; aim(vt)</T>, what the act is aimed at. In general,
          “a reason” is a cause, as German <i>Grund</i> and Toki Pona <i>tan</i> are both.
        </p>
        <Example meaning="I infer that you slept.">
          &lt;subject&gt; I &lt;verb&gt; infer(vt) &lt;object&gt; &lt;subject&gt; you &lt;verb&gt; sleep(vi) formerly
        </Example>
        <p className="mt-2">
          <W w="mind" /> is <T>&lt;er&gt; sense(vt) self</T>, what perceives itself. A <W w="machine" /> is{" "}
          <T>worker artificial</T>, an artificial <W w="worker" />. Making something new or following what exists is the
          provenance axis: <W w="original" /> and <W w="derivative" />, <W w="invent(vt)" /> and{" "}
          <W w="imitate(vt)" />, with a <W w="copy" /> as imitation at its fullest and a{" "}
          <W w="source" /> (<W w="canonical" />) as originality at its fullest: <T>source of truth</T>.{" "}
          To <W w="compute(vi)" /> is <T>work(vt) information</T>, to work data, as German{" "}
          <i>Datenverarbeitung</i> is data processing; <W w="computation" /> is{" "}
          <T>&lt;gerund&gt; work(vt) information</T> and a <W w="computer" />{" "}
          <T>&lt;tool&gt; work(vt) information</T>. Working a material is crafting it, as German{" "}
          <i>werken</i>: <T>work(vt) rock</T> is stonework. <W w="conscience" /> is <T>&lt;tool&gt; blame(vt) self</T>, what you blame yourself with, and by
          the same axis credit yourself. A <W w="model" /> is <T>&lt;er&gt; resemble(vt)</T>, a thing that
          resembles another. <W w="meta" /> as a modifier makes X about X: <T>merit meta</T> is
          metaethics, the study of what good is, and <T>knowledge meta</T> knowing what you know.
          <W w="merit" />, the goodness axis, is also morality or ethics, and a principle is an{" "}
          <W w="axiom" />, a posited starting point.
        </p>
        <Example meaning="I prefer water.">&lt;subject&gt; I &lt;verb&gt; prefer(vt) &lt;object&gt; water</Example>

        <H2>Family</H2>
        <p>
          <W w="family" /> is a root for family, kin or a relative. Relations come from the lineage
          axis, with <W w="child" /> at the positive end and <W w="parent" /> at the negative. The
          scale's steps name the rest, following the general pattern that the minor steps are a
          lesser version and the max steps the fullest: <T>&lt;min_negative&gt; child</T> is an aunt or uncle
          (a lesser parent, like Swahili <i>mama mdogo</i>, “small mother”),{" "}
          <T>&lt;neutral&gt; child</T> a sibling, <T>&lt;min_positive&gt; child</T> a niece or nephew, and{" "}
          <T>&lt;max_negative&gt; child</T> / <T>&lt;max_positive&gt; child</T> all ancestors or descendants.
        </p>
        <p className="mt-2">
          Rank counts generations, as in other families of words: <T>child &lt;rank_2&gt;</T> is a
          grandchild and <T>parent &lt;rank_2&gt;</T> a grandparent. For siblings it counts the generations
          up to the shared ancestor, so <T>&lt;neutral&gt; child &lt;rank_2&gt;</T> is a first cousin (a shared
          grandparent) and <T>&lt;neutral&gt; child &lt;rank_3&gt;</T> a second cousin. Bare words are &lt;rank_1&gt;, and
          &lt;rank_0&gt; is oneself. Marriage isn't a generation step: a <W w="spouse" /> is <T>family united</T>, family by
          union rather than descent, and in-laws are phrases: <T>parent of spouse</T>. Gendered words are
          modifiers: <W w="mother" /> is <T>parent female</T>, <W w="brother" /> <T>sibling male</T>.
        </p>
        <p className="mt-2">
          Birth is the child end's verb: without an object, <W w="be_born(vi)" />; with one, to
          bear a child, <W w="bear(vt)" />. To <W w="reproduce(vi)" /> is <T>bear(vt) child</T>.
        </p>
        <Example meaning="My grandparent has many descendants.">
          &lt;subject&gt; grandparent of me &lt;verb&gt; possess(vt) &lt;object&gt; &lt;max_positive&gt; child many
        </Example>
        <p className="mt-2">
          To <W w="marry(vi)" /> is <T>connect(vi) family</T>, as mating is <T>connect(vi) sex</T>,
          and a <W w="marriage" /> <T>&lt;gerund&gt; marry(vi)</T>. Growing up is the age axis:{" "}
          <W w="juvenile" /> leans new and <W w="mature" /> leans old, so an <W w="adult" /> is{" "}
          <T>person mature</T>. <W w="child" /> is the lineage word, someone's child, at any age.
          A <W w="friend" /> is <T>&lt;ee&gt; like(vt)</T>, an <W w="enemy" />{" "}
          <T>&lt;ee&gt; hate(vt)</T> and a <W w="beloved" /> <T>&lt;ee&gt; love(vt)</T>, so{" "}
          <T>friend of me</T> is the one I like, and <T>friend mutual</T> says it goes both ways.
        </p>
        <Open>
          Gendered words are long: “mother” is <T>parent female</T>, which is <T>&lt;negative&gt; child
          &lt;negative&gt; male</T>, four syllables for a very common word.
        </Open>

        <H2>Society and country</H2>
        <p>
          People come first. A <W w="society" /> is <T>group person</T>, a group of people: a
          community, or a people. A <W w="country" /> is <T>land society</T>, a society's land, and a{" "}
          <W w="government" /> <T>&lt;gerund&gt; govern(vi)</T>, governing, where to{" "}
          <W w="govern(vi)" /> is <T>lead(vt) society</T>; a <W w="governor" /> is{" "}
          <T>&lt;er&gt; govern(vi)</T>. <W w="politics" />, <T>&lt;gerund&gt; seek(vt) authority</T>, is
          the contest over who governs, and as a modifier it's “political”: a non-political crime is{" "}
          <T>crime not politics</T>. <W w="democracy" /> is <T>government everyone</T>, everyone's
          government, and a democratic society <T>society democracy</T>. A <W w="member" /> is{" "}
          <T>&lt;ee&gt; include(vt)</T>, who's included, and a <W w="citizen" /> <T>member country</T>;
          one's nationality is <T>country of self</T>. A <W w="border" /> is <T>edge country</T>.
          “Nation” and “state” are whichever of these is meant, “international” is{" "}
          <T>between country plural</T> and humanity is <W w="everyone" />.
        </p>
        <p className="mt-2">
          A <W w="leader" /> is <T>&lt;er&gt; lead(vt)</T>. To <W w="vote(vi)" /> is{" "}
          <T>choose(vi) together</T>, and with an object to vote for; a <W w="vote" /> or election is{" "}
          <T>&lt;gerund&gt; vote(vi)</T>. A <W w="representative" /> is <T>&lt;er&gt; act(vi) for
          other</T>, who acts on others' behalf, and taking part is <T>act(vi) in</T>. Public and
          private have no words of their own. Seen, they're <W w="visible" /> and <W w="hidden" />,
          so a secret ballot is <T>vote(vi) secretly</T>; owned, they're <T>of society</T> and{" "}
          <T>of self</T>, so public service is <T>serve(vt) society</T>. <W w="privacy" /> is{" "}
          <T>hiding self</T>.
        </p>
        <Example meaning="Everyone may leave any country and come back to their own.">
          &lt;subject&gt; everyone &lt;verb&gt; be_entitled_to(vt) &lt;object&gt; &lt;verb&gt; exit(vi) from country
          all and &lt;verb&gt; come(vi) to country of self
        </Example>

        <H2>Law and justice</H2>
        <p>
          To <W w="judge(vt)" /> is <T>infer(vt) accountability</T>, to reason out who's accountable.
          A <W w="judge" /> is <T>&lt;er&gt; judge(vt)</T>, a <W w="court" />{" "}
          <T>&lt;place&gt; judge(vt)</T> and a <W w="trial" /> <T>&lt;gerund&gt; judge(vt)</T>. A{" "}
          <W w="crime" /> is <T>deed forbidden</T> and the <W w="constitution" /> <T>law source</T>.
          Accusing is <W w="blame(vt)" /> and the accused <T>&lt;ee&gt; blame(vt)</T>; guilty is{" "}
          <W w="culpable" /> and innocent <T>not culpable</T>. Convicting is{" "}
          <T>judge(vt) as culpable</T>, with <W w="as" /> saying what the object is judged to be, and
          acquitting <T>judge(vt) as not culpable</T>. A <W w="wrong" /> or sin is <T>deed bad</T>,
          and to <W w="forgive(vt)" /> is <T>release(vt) from blame</T>. To <W w="tempt(vt)" /> is{" "}
          <T>persuade(vt) &lt;max_negative&gt; well</T>, to persuade evilly, and{" "}
          <W w="temptation" /> <T>persuasion &lt;max_negative&gt; good</T>, evil persuasion. <W w="impartial" />, fair, is the middle of the
          value axis, neither choosing nor rejecting.
        </p>
        <Example meaning="The law shall presume the accused not guilty.">
          &lt;subject&gt; law &lt;verb_prescriptive&gt; assume(vt) &lt;object&gt; &lt;ee&gt; blame(vt) as not
          culpable
        </Example>

        <H2>Work, money and health</H2>
        <p>
          A <W w="worker" /> is <T>&lt;er&gt; work(vi)</T>, to <W w="pay(vi)" /> is{" "}
          <T>give(vt) money</T>, with <W w="to" /> for whom, and a <W w="wage" /> is{" "}
          <T>money work</T>, and a <W w="union" /> <T>group worker</T>. Whose side one acts on is
          the support axis: <W w="help(vt)" /> and <W w="oppose(vt)" />, with{" "}
          <W w="cooperate(vi)" /> a lesser helping and <W w="compete(vi)" /> a lesser opposing,
          against someone toward the same goal; a <W w="rival" /> is <T>&lt;ee&gt; compete(vi)</T>. To{" "}
          <W w="argue(vi)" /> is <T>compete(vi) by speech</T>, and an <W w="argument" />{" "}
          <T>&lt;gerund&gt; argue(vi)</T>.
          Making something easier or harder, whatever the intent, is <W w="enable(vt)" /> and{" "}
          <W w="hinder(vt)" />. Enough is the middle of the quantity axis:{" "}
          <W w="enough" />, between few and many.
        </p>
        <p className="mt-2">
          Health is the integrity axis, as heal, whole and hale share a root: <W w="health" /> is{" "}
          <T>integrity body</T>, healthy is{" "}
          <W w="intact" />, healing <W w="mend(vt)" /> without an object, and <W w="sick" /> a lesser
          breaking, <T>&lt;min_negative&gt; intact</T>. Mending bodies gives <W w="medicine" /> (
          <T>&lt;gerund&gt; mend(vt) body</T>), a <W w="doctor" />, a <W w="drug" /> and a{" "}
          <W w="hospital" />, by the role markers. <W w="clothing" /> is <T>covering person</T>, a
          person's covering, as skin is a body's, and a <W w="cloak" /> or coat{" "}
          <T>clothing outside</T>.
        </p>
        <Example meaning="The doctor healed the sick child.">
          &lt;subject&gt; doctor &lt;verb&gt; mend(vt) formerly &lt;object&gt; child sick
        </Example>

        <H2>Education, culture and science</H2>
        <p>
          Educating gives the role-marker family: <W w="education" /> is{" "}
          <T>&lt;gerund&gt; educate(vt)</T>, a <W w="teacher" /> <T>&lt;er&gt; educate(vt)</T>, a{" "}
          <W w="student" /> <T>&lt;ee&gt; educate(vt)</T> and a <W w="school" />{" "}
          <T>&lt;place&gt; educate(vt)</T>. Elementary education is <T>education juvenile</T> and
          higher education <T>education mature</T>. A pattern is a <W w="regularity" />, so a{" "}
          <W w="habit" /> is <T>regularity person</T>, a person's patterns, and <W w="culture" />{" "}
          <T>regularity society</T>, a society's. The rest are activities, named by the gerund
          like education: <W w="science" /> is <T>&lt;gerund&gt; seek(vt) knowledge</T>, with a{" "}
          <W w="scientist" />, and <W w="art" /> <T>&lt;gerund&gt; create(vt) beauty</T>, with an{" "}
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
          scale grades them: <T>&lt;min_positive&gt; write(vi)</T>, a lesser writing, is a mark, and{" "}
          <T>&lt;min_negative&gt; write(vi)</T> is skimming. Nouns come from the role markers: a word is{" "}
          <T>&lt;ee&gt; say(vt)</T>, a text <T>&lt;ee&gt; write(vt)</T> and an ear <T>&lt;tool&gt; hear(vt)</T>. Attaching is{" "}
          <W w="connect(vi)" />.
        </p>
        <p className="mt-2">
          The senses are all one pattern: <W w="sense(vt)" /> and the medium each one takes in.{" "}
          <W w="see(vt)" /> is <T>sense(vt) light</T>, <W w="hear(vt)" /> <T>sense(vt) sound</T>,{" "}
          <W w="feel(vt)" /> <T>sense(vt) contact</T>, <W w="taste(vt)" /> <T>sense(vt) taste</T> and{" "}
          <W w="smell(vt)" /> <T>sense(vt) odor</T>. Seeing and hearing just happen; watching and
          listening are attending to what's shown or said, so they're the far ends of{" "}
          <W w="show(vi)" /> and <W w="say(vt)" />. Feelings are perceived the same way, with{" "}
          <W w="sense(vt)" /> and the feeling: <T>sense(vt) pain</T> is to feel pain, so{" "}
          <W w="feel(vt)" /> stays touch. Holding isn't touching but containing: <W w="hold(vt)" /> is
          the containment verb, whose opposite is <W w="release(vt)" />, and to grip is to hold fully,{" "}
          <W w="grip(vt)" />.
        </p>
        <p className="mt-2">
          Washing is built like the senses, from <W w="clean(vt)" /> and the medium: <W w="wash(vt)" />{" "}
          is <T>clean(vt) water</T>. Like any change verb, without an object it's what happens to the
          subject, so washing without an object is bathing: <W w="bathe(vi)" />. The pleasure verb
          covers play: <W w="enjoy_oneself(vi)" /> is to enjoy oneself, play or make merry, and{" "}
          <W w="entertain(vt)" /> to entertain.
        </p>
        <p className="mt-2">
          Tastes and smells are qualities, built like colors: <T>taste fun</T> is sweet,{" "}
          <T>taste painful</T> bitter, <T>taste sharp</T> sour, <T>taste rock</T> salty and{" "}
          <T>taste flesh</T> savory. <T>taste good</T> is delicious and <T>odor good</T> fragrant.
        </p>
        <Example meaning="The water tastes salty.">
          &lt;subject&gt; water &lt;verb&gt; be(vt) &lt;complement&gt; taste rock
        </Example>
        <p className="mt-2">
          Untruth is the truth axis's adverb: <W w="tell_a_lie(vi)" /> is <T>say(vt) falsely</T>, and{" "}
          <W w="pretend(vi)" /> is <T>show(vi) falsely</T>, which with an object is to disguise it.
          Appearing and disappearing aren't showing: they're <W w="emerge(vi)" /> and{" "}
          <W w="vanish(vi)" />.
        </p>
        <p className="mt-2">
          To <W w="promise(vt)" /> is <T>say(vt) dutifully</T>, saying so as to bind oneself, and a{" "}
          <W w="promise" /> is what's promised. Trying is the middle of success: <W w="try(vi)" />,
          an <W w="attempt" />, with the outcome still open.
        </p>
        <p className="mt-2">
          Thinking is inner speech: <W w="think(vi)" /> is <T>say(vt) within</T>, so like{" "}
          <W w="say(vt)" /> it takes a clause, “think that…”. <W w="thought" /> is{" "}
          <T>&lt;gerund&gt; think(vi)</T> and an <W w="idea" /> <T>&lt;ee&gt; think(vt)</T>, what's
          thought. An opinion is a <W w="belief" />, and to <W w="agree(vi)" /> is{" "}
          <T>believe(vi) identically</T>, to believe the same; <W w="agree_on(vt)" /> takes what's
          agreed, and <W w="with" /> whom. A <W w="god" /> is <T>&lt;ee&gt; worship(vt)</T>,
          what's worshipped, and a <W w="religion" /> <T>belief worship</T>, a belief with worship.
          An <W w="emotion" /> is <T>&lt;gerund&gt; sense(vt) value</T>, sensing what matters: fear
          senses danger and joy good.
          A <W w="language" /> is <T>&lt;tool&gt; say(vt)</T>, what one speaks with, a{" "}
          <W w="message" /> <T>&lt;ee&gt; send(vt) information</T> and a <W w="reputation" />{" "}
          <T>belief of other</T>, what others believe of one.
        </p>
        <p className="mt-2">
          Signs are the signification axis, a relation whose two ends are a sign and what it stands
          for, as cause and result are two ends of one link: a <W w="symbol" /> or sign, and its{" "}
          <W w="meaning" />. The symbol is the subject of <W w="mean(vt)" />, and the meaning of{" "}
          <W w="be_called(vt)" />. A name is the commonest symbol, so <T>symbol of you</T>{" "}
          is your name, and a <W w="word" /> is <T>symbol speech</T>, a spoken one. When a symbol
          could be a name or a picture, as a country's, <T>word of country</T> is the name.
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
          <T>exceed(vt) &lt;object&gt; all</T> is “the biggest”, and the scale grades it, so{" "}
          <T>&lt;max_positive&gt; exceed(vt)</T> is “much bigger” and <T>&lt;min_positive&gt; exceed(vt)</T> “slightly
          bigger”. Many languages compare this way, like Nigerian Pidgin's “e big pass you”.
          “The more…, the more…” is <W w="increase(vi)" /> with <W w="with" />, along with: the
          harder the wind blew, the tighter the cloak is <T>closure of cloak increase(vi) with &lt;gerund&gt;
          blow(vi) of wind</T>.
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
          it's the negative adverb: <T>stand(vi) slouchingly</T> is to stand with a slouch, and{" "}
          <T>sit(vi) uprightly</T> to sit up straight.
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
          <W w="stay(vi)" /> on the travel axis. Staying somewhere is living there: <T>stay(vi) at
          that</T>, they dwelt there. Dancing is moving to music: <W w="dance(vi)" /> is{" "}
          <T>go(vi) music</T>, and <W w="music" /> is <T>sound beautiful</T>.
        </p>
        <p className="mt-2">
          The verb names the medium, not who or what moves, so a boat swims and a plane flies; as
          Russian <i>плыть</i> is both to swim and to sail. Vehicles are <W w="<tool>" /> and the verb:{" "}
          <W w="boat" /> is <T>&lt;tool&gt; swim(vi)</T>, <W w="aircraft" /> <T>&lt;tool&gt; fly(vi)</T> and{" "}
          <W w="spacecraft" /> <T>&lt;tool&gt; spacefly(vi)</T>. Animals are named loosely by how they move,
          as in English: <W w="bird" /> is <T>animal flying</T> and <W w="fish" /> <T>animal swimming</T>,
          and a <W w="feather" /> is <T>covering bird</T>. An animal's call is <W w="animal_noise" />,{" "}
          <T>speech animal</T>. A <W w="bug" /> is a very small animal,{" "}
          <T>animal &lt;max_negative&gt; big</T>, and a <W w="louse" /> <T>bug hair</T>.
        </p>
        <Example meaning="The bird flies to the tree.">
          &lt;subject&gt; bird &lt;verb&gt; fly(vi) to tree
        </Example>

        <H2>Parts of things</H2>
        <p>
          Limbs count their segments out from the body with rank, as Toki Pona's <i>luka</i> is
          arm and hand: <W w="hand" /> is <T>arm &lt;rank_2&gt;</T> and <W w="finger" />{" "}
          <T>arm &lt;rank_3&gt;</T>, <W w="foot" /> <T>leg &lt;rank_2&gt;</T> and <W w="toe" />{" "}
          <T>leg &lt;rank_3&gt;</T>. Joints are nodes: <W w="elbow" /> is <T>node arm</T>,{" "}
          <W w="wrist" /> <T>node hand</T> and <W w="ankle" /> <T>node foot</T>.
        </p>
        <p className="mt-2">
          A part is named head first, like any noun and modifier: the kind of part, then the whole
          it belongs to. <W w="tail" /> is <T>rod back</T> and <W w="knee" /> <T>node leg</T>. A few
          kinds go a long way: a <W w="covering" /> is <W w="skin" /> (<T>covering body</T>),{" "}
          <W w="hair" /> (<T>covering head</T>), <W w="fur" /> or <W w="bark" />; a <W w="rod" /> is a{" "}
          <W w="horn" />, <W w="tail" /> or <W w="tongue" />; a <W w="rock" /> is a <W w="tooth" /> (
          <T>rock mouth</T>) or <W w="bone" /> (<T>rock body</T>). A part can also be named by where it
          is on the whole: the <W w="belly" /> is <T>torso front</T>.
        </p>
        <p className="mt-2">
          Organs are named for what they do, with <W w="<tool>" />: <W w="eye" /> is{" "}
          <T>&lt;tool&gt; see(vt)</T>, <W w="ear" /> <T>&lt;tool&gt; hear(vt)</T>, <W w="brain" />{" "}
          <T>&lt;tool&gt; know(vt)</T> and <W w="nose" /> <T>&lt;tool&gt; smell(vt)</T>. Where there's no verb for
          it, the kind-and-whole pattern does: <W w="heart" /> is <T>center body</T>, and the{" "}
          <W w="liver" /> <T>filter body</T>, the body's <W w="filter" /> (<T>&lt;tool&gt; separate(vi)</T>). Substances take a
          phase: <W w="blood" /> is <T>liquid body</T>, <W w="sap" /> <T>liquid plant</T> and{" "}
          <W w="flesh" /> <T>matter body</T>. A substance can also be named for what it does:{" "}
          <W w="grease" /> is <T>&lt;tool&gt; slip(vi)</T> and <W w="glue" /> <T>&lt;tool&gt; stick(vi)</T>, from
          the ends of the texture axis.
        </p>
        <p className="mt-2">
          A body part names the like part of another whole, as many languages speak of the foot of a
          mountain. A plant's parts are its body's: <W w="root" /> is <T>foot plant</T>,{" "}
          <W w="trunk" /> <T>torso plant</T>, <W w="branch" /> <T>arm plant</T> and <W w="leaf" />{" "}
          <T>finger plant</T>, and <T>mouth water</T> is a river's mouth. <W w="seed" /> is{" "}
          <T>&lt;ee&gt; sow(vt)</T> and <W w="fruit" /> <T>food seed</T>, food with seed in it. To{" "}
          <W w="feast(vi)" /> is <T>eat(vt) hugely</T>, which sounds just like “eat big”, and a{" "}
          <W w="feast" /> is feasting.
        </p>

        <H2>Kinds</H2>
        <p>
          Kinds are the ends of the abstraction axis, which runs from <W w="concrete" /> to{" "}
          <W w="abstract" />. A <W w="type" /> (<W w="generic" />) is generalizing as far as it goes,
          and an <W w="instance" /> (<W w="particular" />) is the fully particular case. “What kind?”
          is <T>type &lt;blank&gt;</T>, and “in all its forms” is <T>in type all</T>. To{" "}
          <W w="discriminate(vi)" /> is <T>reject(vt) by type</T>, and its opposite is{" "}
          <W w="impartially" />.
        </p>
        <Example meaning="What kind of animal is it?">
          &lt;subject&gt; it &lt;verb_interrogative&gt; be(vt) &lt;complement&gt; animal &lt;regroup&gt; type &lt;blank&gt;
        </Example>

        <H2>Geometry</H2>
        <p>
          <W w="geometry" /> is one root for geometric figures. Rank gives a bounded figure with that
          many dimensions: <W w="point" /> (<T>geometry &lt;rank_0&gt;</T>), <W w="line_segment" />{" "}
          (<T>&lt;rank_1&gt;</T>), <W w="shape" /> (<T>&lt;rank_2&gt;</T>) and <W w="form" />, a 3D structure (
          <T>&lt;rank_3&gt;</T>). A dimension helper gives the unbounded space up through that dimension:{" "}
          <W w="infinite_line" /> (<T>geometry &lt;dimension_x&gt;</T>), <W w="plane" /> (<T>&lt;dimension_y&gt;</T>)
          and <W w="space" /> (<T>&lt;dimension_z&gt;</T>); higher spaces go through the number domain, as{" "}
          <T>geometry dimension &lt;ordinal&gt; number 4</T>.
        </p>
        <p className="mt-2">
          Modifiers say which figure, at any rank: <W w="round" /> gives <W w="curve" />,{" "}
          <W w="circle" /> and <W w="sphere" />, and <W w="angular" /> gives <W w="polyline" />,{" "}
          <W w="polygon" /> and <W w="polyhedron" />.
        </p>
        <p className="mt-2">
          <W w="node" /> takes rank for networks, each more general than the last:{" "}
          <W w="sequence" /> (<T>node &lt;rank_1&gt;</T>), <W w="tree_graph" /> (<T>&lt;rank_2&gt;</T>),{" "}
          <W w="dag" /> (<T>&lt;rank_3&gt;</T>), <W w="graph" /> (<T>&lt;rank_4&gt;</T>), <W w="hypergraph" />{" "}
          (<T>&lt;rank_5&gt;</T>) and <W w="higher_order_network" /> (<T>&lt;rank_6&gt;</T>). Whether a graph's
          links have a direction is a modifier.
        </p>
        <p className="mt-2">
          A sequence's modifiers say how it's laid out: <W w="array" /> is <T>sequence continuous</T>,
          unbroken, and <W w="linked_list" /> <T>sequence discrete</T>, separate pieces each linked to
          the next. A dimension helper takes it through more dimensions, as with geometry:{" "}
          <W w="grid" /> is <T>sequence &lt;dimension_y&gt;</T>, a table of data, and{" "}
          <T>sequence &lt;dimension_z&gt;</T> a 3D grid.
        </p>

        <H2>Matter</H2>
        <p>
          <W w="matter" /> takes rank for its phase, rising in energy: <T>matter &lt;rank_0&gt;</T> is a
          solid, <T>&lt;rank_1&gt;</T> a liquid, <T>&lt;rank_2&gt;</T> a gas and <T>&lt;rank_3&gt;</T> a plasma. As a
          modifier it gives a substance's phase, so <W w="ice" /> is <T>water matter &lt;rank_0&gt;</T>,{" "}
          <W w="steam" /> is <T>water matter &lt;rank_2&gt;</T> and <W w="lava" /> is{" "}
          <T>rock matter &lt;rank_1&gt;</T>. Bare <W w="water" /> is the liquid. <W w="gas" /> usually does
          for air; <W w="air" />, <T>gas this</T> (our gas), says it outright, as <T>celestial &lt;rank_2&gt;
          this</T> is Earth. <W w="wind" /> is <T>air travel</T>, air in motion, and the north wind{" "}
          <T>wind north</T>, as in English. Sending out a medium makes verbs of emitting:{" "}
          <W w="blow(vi)" /> is <T>send(vt) air</T> and <W w="shine(vi)" /> <T>send(vt) light</T>,
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
          Rank names the target phase, as it does for <W w="matter" />: <T>melt(vi) &lt;rank_2&gt;</T> is to
          evaporate (<W w="evaporate(vi)" />), <T>melt(vi) &lt;rank_3&gt;</T> to ionize, <T>freeze(vi) &lt;rank_1&gt;</T> to
          condense and <T>freeze(vi) &lt;rank_0&gt;</T> to solidify.
        </p>
        <Example meaning="The sun melts the ice.">
          &lt;subject&gt; sun &lt;verb&gt; melt(vt) &lt;object&gt; ice
        </Example>
        <p className="mt-2">
          <W w="element" /> marks the element domain, as <W w="number" /> marks the number domain:
          the digit after it is an atomic number, so <T>element 6</T> is carbon. Each element has
          settled into one word, written without the space: <W w="carbon" /> is <T>element 6</T>, from{" "}
          <W w="hydrogen" /> (1) to <W w="oganesson" /> (118). That's how any phrase with a canonical
          meaning becomes a word; its parts are still there to see. Bare, <W w="element" /> is any
          element, and an element with matter's rank gives its phase: <T>gold matter &lt;rank_0&gt;</T> is
          solid gold.
        </p>
        <Example meaning="This rock is iron.">
          &lt;subject&gt; rock this &lt;verb&gt; be(vt) &lt;complement&gt; iron
        </Example>

        <H2>Sky</H2>
        <p>
          <W w="celestial" /> is one root for every body in the sky, and rank picks its level in the
          orbital hierarchy, each level orbiting the next: <W w="moon" /> (<T>celestial &lt;rank_1&gt;</T>),{" "}
          <W w="planet" /> (<T>&lt;rank_2&gt;</T>), <W w="star" /> (<T>&lt;rank_3&gt;</T>), <W w="galaxy" />{" "}
          (<T>&lt;rank_4&gt;</T>), <W w="galaxy_cluster" /> (<T>&lt;rank_5&gt;</T>) and <W w="supercluster" />{" "}
          (<T>&lt;rank_6&gt;</T>). <T>&lt;rank_0&gt;</T> is a <W w="small_body" />, too small to be round, and
          modifiers tell those apart: <W w="asteroid" /> is <T>celestial &lt;rank_0&gt; rock</T> and{" "}
          <W w="comet" /> <T>celestial &lt;rank_0&gt; ice</T>.
        </p>
        <p className="mt-2">
          <W w="this" /> makes it ours: <W w="sun" /> is <T>celestial &lt;rank_3&gt; this</T>,{" "}
          <W w="earth" /> <T>&lt;rank_2&gt; this</T>, <W w="the_moon" /> <T>&lt;rank_1&gt; this</T> and{" "}
          <W w="milky_way" /> <T>&lt;rank_4&gt; this</T>. The universe isn't a body in the sky:{" "}
          <W w="universe" /> is just <W w="everything" />.
        </p>
        <p className="mt-2">
          The <W w="sky" /> is <T>place high</T>, the high place, as Toki Pona's <i>sewi</i> is up, sky
          and heaven; <W w="heaven" />, <T>sky sacred</T>, says the second outright. <W w="rain" /> is <T>water sky</T> and a <W w="cloud" /> <T>covering sky</T>, the
          sky's covering. What fire leaves is <W w="ash" />, <T>result fire</T>, and <W w="smoke" /> is
          that as a gas, <T>ash gas</T>.
        </p>
        <Example meaning="The Sun is bright.">
          &lt;subject&gt; sun &lt;verb&gt; be(vt) &lt;complement&gt; bright
        </Example>

        <H2>Directions</H2>
        <p>
          <W w="cardinal" /> is one root for the compass, and rank counts quarter turns clockwise
          from north: <W w="north" /> is <T>cardinal &lt;rank_0&gt;</T>, <W w="east" /> <T>&lt;rank_1&gt;</T>,{" "}
          <W w="south" /> <T>&lt;rank_2&gt;</T> and <W w="west" /> <T>&lt;rank_3&gt;</T>. Two ranks name the
          direction between them, north or south first as in English: <W w="northeast" /> is{" "}
          <T>cardinal &lt;rank_0&gt; &lt;rank_1&gt;</T> and <W w="southwest" />{" "}
          <T>cardinal &lt;rank_2&gt; &lt;rank_3&gt;</T>. The prepositions do the rest:{" "}
          <T>to cardinal &lt;rank_0&gt;</T> is northward and <T>at cardinal &lt;rank_1&gt;</T> in the east.
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
          <T>red yellow</T>, <W w="green" /> <T>yellow blue</T> and <W w="purple" /> <T>red blue</T>.
          Lightness comes from the brightness axis: <W w="pink" /> is <T>red bright</T> and{" "}
          <W w="maroon" /> <T>red dark</T>. As modifiers, white and black are just <W w="bright" /> and{" "}
          <W w="dark" />; as nouns they're <W w="white" /> (<T>color bright</T>) and <W w="black" />{" "}
          (<T>color dark</T>), and <W w="gray" /> is <T>color &lt;neutral&gt; bright</T>. On a noun, a
          blend is grouped, since modifiers each apply to the head: <T>rock &lt;regroup&gt; red yellow</T>{" "}
          is an orange rock, and <T>rock red yellow</T> a red and yellow one.
        </p>
        <p className="mt-2">
          <W w="brown" /> is the neutral color, <T>color &lt;neutral&gt;</T>. Since{" "}
          <W w="<neutral>" /> steps an axis word that follows it, brown goes after any axis words:{" "}
          <T>rock big brown</T>, not <T>rock brown big</T>, which would read as a medium-sized color.
        </p>
        <Example meaning="The rock is orange.">
          &lt;subject&gt; rock &lt;verb&gt; be(vt) &lt;complement&gt; orange
        </Example>

        <H2>Modifiers</H2>
        <p>
          Modifiers follow what they modify: <T>person all</T> is “everyone”, <T>person none</T> is
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
          <T>person all</T>, <T>kill(vt) truly</T>). Axis helpers and <W w="not" /> build words and come
          before the word they apply to, like prefixes (<T>&lt;negative&gt; big</T>,{" "}
          <T>&lt;min_positive&gt; truly</T>, <T>not impossibly</T>). Spanish splits the same way: adjectives
          follow the noun, but <i>muy</i> comes before the adjective. Each prefix takes exactly the
          one word after it, so stacks read left to right without brackets, like logic:{" "}
          <T>not &lt;max_positive&gt; true</T> is “not certain”. <W w="not" /> is always a prefix, on content
          words too, so <T>person not big</T> can only be a person who isn't big. And the sign comes
          first, so a listener never has to revise what they've heard: in{" "}
          <T>number 2 3 &lt;negative&gt; &lt;rank_2&gt;</T>, the negative comes before the rank.
        </p>

        <p className="mt-2">
          <b>Scope.</b> Each modifier applies to the head: <T>rock red yellow</T> is a rock that's red
          and yellow. <W w="<regroup>" />, like Toki Pona's <i>pi</i>, gathers the modifiers after it
          into one group that modifies the head together, the first of them as the group's own head:{" "}
          <T>rock &lt;regroup&gt; red yellow</T> is a rock of the color red yellow, an orange rock. The
          group runs to the end of the noun phrase.
        </p>
        <Example meaning="a person of a big family">person &lt;regroup&gt; family big</Example>
        <p className="mt-2">
          <W w="only" />, <W w="also" /> and <W w="even" /> are prefixes, like <W w="not" />, on the one
          word they focus: <T>only you</T>, <T>also you</T> (you too), <T>even child</T>. On a
          preposition or <W w="if" />, that word opens a phrase, and the phrase is what's focused:{" "}
          <T>only by law</T>, <T>only if …</T>.
        </p>
        <Example meaning="I drink only water.">
          &lt;subject&gt; I &lt;verb&gt; eat(vt) &lt;object&gt; only water
        </Example>
        <Open>
          <W w="and" /> between modifiers lists them: <T>rock red and yellow</T>. It may be read as
          starting a second noun instead (<T>person big and dog</T>), and context may have to decide.
        </Open>

        <H2>Prepositions</H2>
        <p>
          The prepositions are <W w="with" />, <W w="to" />, <W w="from" />, <W w="by" />,{" "}
          <W w="for" />, <W w="in" />, <W w="of" />, <W w="about" />, <W w="at" />, <W w="as" /> (“as”
          or “like”, like Toki Pona's <i>sama</i>) and <W w="between" />, whose two ends are joined
          with <W w="and" />. A preposition
          opens a phrase, and there's no word to close it: the phrase ends at the next grammar
          marker, preposition, clause-level conjunction or <W w="<clause_end>" />. Within a phrase,
          modifiers come before prepositional phrases, so <T>person big with rod</T> is a big
          person with a rod. Phrases that modify the verb go right after it, before{" "}
          <W w="<object>" />, and a phrase after a noun modifies that noun: in{" "}
          <T>secure(vt) at everywhere &lt;object&gt; acknowledgment of right</T>, everywhere is where
          the securing happens and of right says what's acknowledged. Phrases stacked on one side can
          still be ambiguous, as in most languages; bracket one with <W w="<clause_start>" /> and{" "}
          <W w="<clause_end>" /> when it matters, or split the sentence.
        </p>
        <Example meaning="…equal in dignity and rights.">free and same in dignity and right</Example>
        <p className="mt-2">
          <W w="with" /> is company and <W w="by" /> the means: <T>open(vt) with mother</T> is opening
          it with your mother, and <T>open(vt) by &lt;tool&gt; open(vt)</T> opening it with a key. <W w="for" /> is who
          something is for with a noun, <T>for mother</T>, and the purpose with a clause,{" "}
          <T>for &lt;subject&gt; you …</T>, so that you…. Other relations of place are a noun with{" "}
          <W w="at" /> and <W w="of" />, as in Mandarin and Toki Pona: <T>at topside of rock</T> is on
          the rock, and <T>at underside of rock</T> under it.
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
          <W w="<ee>" />, makes a noun, so after <W w="and" /> it starts a list item: <T>&lt;gerund&gt;
          possess(vt) person and &lt;gerund&gt; exchange(vt) person</T> is “owning people and trading
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
          <T>&lt;object&gt; &lt;object&gt;</T> is hard to read. <W w="<clause_end>" /> can be dropped at the end of a sentence, or of
          a bracketed clause around it, whose own <W w="<clause_end>" /> closes both; but not before
          more of the main clause, whose next role marker would otherwise be read as part of
          the subclause.
        </p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>
            <b>As an object</b>: <T>I believe(vt) &lt;object&gt; &lt;subject&gt; … &lt;clause_end&gt;</T>, I
            believe that…. Its pronouns are the speaker's, so after <W w="say(vt)" /> it's indirect
            speech. With <W w="identically" /> on the verb, it's direct speech, the very words, and its
            pronouns, here and now are the speaker's at the time: <W w="say_verbatim(vt)" /> is{" "}
            <T>say(vt) identically</T>. Direct speech is a sentence of its own, so it always has both
            brackets: it can open with anything, and only <W w="<clause_end>" /> shows where it
            stops. A quote that opens with <W w="<verb_prescriptive>" /> is a command:{" "}
            <T>say_verbatim(vt) &lt;object&gt; &lt;clause_start&gt; &lt;verb_prescriptive&gt; see(vi)
            &lt;clause_end&gt;</T>, they said, “Behold”. A quote longer than one sentence has periods
            inside its brackets: <T>&lt;object&gt; &lt;clause_start&gt; … . … &lt;clause_end&gt;</T>. Adding <W w="meta" /> makes it a quote, someone else's words
            repeated, with <W w="from" /> for whose: <W w="quote(vt)" /> is{" "}
            <T>say(vt) identically meta</T>. Writing works the same way: <W w="write_verbatim(vt)" /> and{" "}
            <W w="quote_in_writing(vt)" />. A <W w="quotation" /> is <T>&lt;ee&gt; quote(vt)</T>, what's
            quoted.
          </li>
          <li>
            <b>After a preposition</b>, for because, when, so that and until:{" "}
            <T>from &lt;subject&gt; …</T> is because…, <T>for &lt;subject&gt; …</T> so that…, and{" "}
            <W w="if" /> takes one the same way. <W w="as" />, “like” with a noun (<T>as sibling</T>), is
            “just as” with a clause: <T>as &lt;subject&gt; we &lt;verb&gt; forgive(vt) …</T>. “When” and “until” are clauses describing a noun,{" "}
            <T>at time &lt;clause_start&gt; …</T> and <T>to time &lt;clause_start&gt; …</T>, so they keep the
            bracket.
          </li>
          <li>
            <b>As a question inside a sentence</b>: an object clause with{" "}
            <W w="<verb_interrogative>" />, and <W w="<blank>" /> for what it asks.{" "}
            <T>I know(vt) &lt;object&gt; &lt;subject&gt; &lt;blank&gt; &lt;verb_interrogative&gt; come(vi)</T> is “I
            know who came”, and without <W w="<blank>" />, whether.
          </li>
          <li>
            <b>After a noun</b>, describing it: <W w="<blank>" /> marks the noun's place in the
            clause, in any role or after any preposition. A plain verb marker tells it from a
            question, which has <W w="<verb_interrogative>" />, as English uses who and where for
            both. The clause describes the noun just before it, so it goes right after its noun,
            before that noun's phrases: <T>child &lt;clause_start&gt; … &lt;clause_end&gt; of friend</T> is
            the friend's child who…, and <T>child of friend &lt;clause_start&gt; … &lt;clause_end&gt;</T> the
            child of the friend who…. A count or ordinal is part of its noun, so the clause follows
            it and describes the whole: <T>thing &lt;ordinal&gt; number 1 &lt;clause_start&gt; …</T> is
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
          opens with a verb marker has nothing to borrow from, so its subject is unspecified,
          “someone”. With <W w="<verb_prescriptive>" />, who should do it comes from context: often the
          listener, which makes it a command (“behold”), but it can as well be a general should or a
          wish (“let every day be a feast”). A topic or a <W w="<vocative>" /> before it doesn't
          count, since both stand outside the clause. A clause
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
          <T>from &lt;subject&gt; …</T>; for a cause that's a thing or an event, the verbs say it outright.
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
          <T>if &lt;clause_start&gt; daytime &lt;clause_end&gt;</T>.
        </p>
        <Example meaning="As for the rock, I ate it.">
          about rock &lt;subject&gt; I &lt;verb&gt; eat(vt) formerly &lt;object&gt; it
        </Example>

        <H2>Because and so</H2>
        <p>
          “Because” is a subclause after <W w="from" />: <T>from &lt;subject&gt; …</T>. “So” is the
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
          <T>&lt;pronoun_first_person&gt; plural</T>, <W w="you_all" /> the second person plural and{" "}
          <W w="they" /> the third. The third person can optionally specify plural and gender or sex.{" "}
          <W w="this" /> and <W w="that" /> point near and far, and <W w="<blank>" /> is the question
          word: what a question asks about.
        </p>
        <p className="mt-2">
          Together they make a table of pointing and question words with a few general nouns, like
          Esperanto's correlatives. There's no word for “here” or “there”: like Toki Pona's{" "}
          <i>lon ni</i>, here is <T>at this</T> and there <T>at that</T>, with{" "}
          <T>place this</T> when it needs to be a noun.
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
          nouns, so <T>thing all</T> and <T>thing none</T> are longer ways to say them. The universe is
          just <W w="everything" />.{" "}
          <W w="self" /> and <W w="other" /> are content roots too. As an object, <W w="self" /> is
          reflexive (<T>I know(vt) self</T>, I know myself), and <T>family of self</T> is one's
          own family. It means its own clause's subject, borrowed or not, so in a subclause with a
          subject of its own, the main clause's subject is <W w="<pronoun_third_person>" />. <T>person other</T> is another person, and <W w="each_other" /> is{" "}
          <T>other mutual</T>, the mutual other. <W w="mutual" /> is the adjective of{" "}
          <W w="trade" />, giving and taking alike, the middle of the giving axis.
        </p>
        <Example meaning="They love each other.">
          &lt;subject&gt; they &lt;verb&gt; love(vt) &lt;object&gt; each_other
        </Example>

        <H2>“The” and “a”</H2>
        <p>
          There are no articles, as in Toki Pona and Mandarin: <T>rock</T> is “a rock” or “the rock” by
          context. Where it matters, <W w="this" /> or <W w="that" /> makes it definite and{" "}
          <T>number 1</T> makes it one, any one.
        </p>

        <H2>Numbers</H2>
        <p>
          A number is <W w="number" /> followed by digits, most significant first. There's one word
          for every base: the base comes from context. A rank after a digit
          gives that digit's place: <W w="<rank_3>" /> puts it at base³, and the digits after it carry on
          down from there. Places a rank jumps over are zeros, so <T>number 1 &lt;rank_3&gt; 3</T> is
          1003 and <T>number 1 &lt;rank_6&gt;</T> is 1,000,000. Negative ranks give fractions and
          percents: <T>number 2 3 &lt;negative&gt; &lt;rank_2&gt;</T> is 23%.
        </p>
        <p className="mt-2">
          <W w="<ordinal>" /> before <W w="number" /> makes it an ordinal: <T>person number 3</T> is
          three people, and <T>person &lt;ordinal&gt; number 3</T> the third person.
        </p>
        <p className="mt-2">
          <W w="<per>" /> marks a denominator. A fraction a/b is “a per b”, so one word gives
          fractions, rates and ratios: <T>&lt;per&gt; number 3</T> is a third,{" "}
          <T>number 2 &lt;per&gt; number 3</T> two thirds and <T>&lt;per&gt; number 1 &lt;rank_3&gt;</T> a thousandth.
          After a noun it's a share or a rate: <T>money &lt;per&gt; number 2</T> is half the money,{" "}
          <T>money &lt;per&gt; person</T> money per person and <T>&lt;per&gt; time &lt;rank_2&gt;</T> per hour. Between
          two numbers it's a ratio, so <T>number 3 &lt;per&gt; number 1</T> is three to one. Denominators are
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
          <T>number 3 4 &lt;rank_6&gt; 1 0 3 &lt;rank_3&gt; 4 8 7 &lt;rank_0&gt;</T>. Bases 2 and 16 group every four
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
          be starting a negative rank: <T>person number 3</T>, but{" "}
          <T>person number 3 &lt;rank_0&gt; big</T> and <T>person number 3 &lt;rank_0&gt; small</T>.
          Long numbers usually keep it anyway, to make the end easy to hear.
        </p>
        <Open>
          Long fractions. Since the first rank of zero or below ends the number, every digit from the
          ones place down falls in one group: 3.14159 has to be{" "}
          <T>number 3 1 4 1 5 9 &lt;negative&gt; &lt;rank_5&gt;</T>, with no comma-like ranks inside.
        </Open>

        <H2>Arithmetic</H2>
        <p>
          <W w="count(vi)" /> takes rank for the operation, each level repeating the one below, as in
          the mathematical hyperoperations: bare <T>count(vi)</T> is counting, <W w="add(vi)" /> is{" "}
          <T>count(vi) &lt;rank_1&gt;</T>, <W w="multiply(vi)" /> <T>&lt;rank_2&gt;</T> and <W w="exponentiate(vt)" />{" "}
          <T>&lt;rank_3&gt;</T>. Its negative end, <W w="count_down(vi)" />, is the inverse: counting down,{" "}
          <W w="subtract(vi)" />, <W w="divide(vi)" /> and <W w="root(vt)" />. Splitting a thing
          into parts is <W w="split(vi)" />, on the part axis.
        </p>
        <p className="mt-2">
          What an operation gives is its <W w="result" />: <W w="sum" /> is{" "}
          <T>result of &lt;gerund&gt; add(vt)</T>, and likewise <W w="arithmetic_difference" />,{" "}
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
          <W w="good" /> and goodbye <T>go(vi) well</T>. Thanks and apologies come from the
          accountability axis, credit and blame: thank you is <T>thanks to you</T>, the credit goes
          to you, and sorry is <T>blame to me</T>, my fault. Between them, <W w="acknowledge(vt)" /> says
          whose something is without judging it. In full, <T>I thank(vt) you</T> and{" "}
          <T>I be(vt) &lt;complement&gt; culpable</T>, I'm to blame.
        </p>
        <p className="mt-2">
          “How” needs no word either: after the verb is where manner goes, so <W w="<blank>" /> there
          asks for it. Manner or way as a noun is <W w="path" />, as in “in a spirit of brotherhood”,{" "}
          <T>in path family</T>.
        </p>
        <Example meaning="How do you work?">
          &lt;subject&gt; you &lt;verb_interrogative&gt; work(vi) &lt;blank&gt;
        </Example>

        <H2>Politeness</H2>
        <p>
          <W w="please" /> is “if you want”, <T>if &lt;verb&gt; desire(vt)</T>, as French{" "}
          <i>s'il vous plaît</i> is “if it pleases you”. It's a set phrase, so it drops both clause
          brackets on either side of the request: <W w="if" /> only ever takes a clause, and
          listeners know where it stops. Its subclause takes the request's subject, you. Thanks and apologies are on the accountability axis, above.
        </p>
        <Example meaning="Sit, please.">&lt;verb_prescriptive&gt; sit(vi) please</Example>
        <Example meaning="Please sit.">please &lt;verb_prescriptive&gt; sit(vi)</Example>

        <H2>Addressing someone</H2>
        <p>
          The one addressed is the subject of a request, as Toki Pona does with <i>o</i>:{" "}
          <T>&lt;subject&gt; mother &lt;verb_prescriptive&gt; come(vi)</T> is “Mother, come”.
        </p>
        <Example meaning="Mother, come.">&lt;subject&gt; mother &lt;verb_prescriptive&gt; come(vi)</Example>
        <p className="mt-2">
          When the one addressed isn't the next clause's subject, <W w="<vocative>" /> marks them, as a
          comma and a pause do in English: <T>&lt;vocative&gt; father</T> is “Father, …”. Like any role
          marker it comes before its phrase, which runs to the next marker. It never fills a role in
          the clause after it, even one whose doer is unsaid, and from then on the one addressed is{" "}
          <W w="<pronoun_second_person>" />, as English vocatives are “you”. So a request after it
          needs no subject when it's plainly theirs to do, but a clause opening with{" "}
          <W w="<object>" /> keeps its doer unsaid: “hallowed be thy name”, not “hallow thy name”. On its own it's calling
          someone: <T>&lt;vocative&gt; mother</T>, “Mother!”
        </p>
        <Example meaning="Our Father in heaven, hallowed be thy name.">
          &lt;vocative&gt; father of we at heaven &lt;object&gt; symbol of you &lt;verb_prescriptive&gt;
          sanctify(vt)
        </Example>
        <p className="mt-2">
          The address opens the sentence, though a topic goes before it, since a phrase right after
          a noun describes that noun: after <T>&lt;vocative&gt; person &lt;foreign&gt; gilgamesh</T>, an{" "}
          <W w="about" /> phrase would be about Gilgamesh, not the sentence's topic.
        </p>
        <Example meaning="As for you, Gilgamesh, fill your belly.">
          about you &lt;vocative&gt; person &lt;foreign&gt; gilgamesh &lt;verb_prescriptive&gt; fill(vt)
          &lt;object&gt; belly of you
        </Example>

        <H2>Other grammar words</H2>
        <p>
          Possession needs no word of its own: <W w="of" /> covers it, as in <T>family of me</T>.
        </p>
        <p className="mt-2">
          <W w="<foreign>" /> marks the next word as a foreign name or borrowing. Every syllable we
          can say is already a root, so a name sounds like a compound, and the marker is what says
          it's sound rather than meaning. A name is one word, ending where the next stressed
          syllable starts, so one of several words is run together: <T>&lt;foreign&gt; new_york</T>.
          It's respelled in our syllables, as Japanese and Toki Pona adapt names: sounds we have
          are kept; another consonant becomes the onset at its place and manner (h is kh, f ph, v
          and w bh, j and y zh), and another vowel the nearest (i is e). n, m, r and l close the
          syllable before them where they can, and are otherwise d or b. A vowel with no onset takes
          kh, and an onset with no vowel takes u. So Babel is <i>ba-ber</i> (r and l being one
          sound), Shinar <i>shen-khar</i>, Adam <i>kha-dan</i> and London <i>don-don</i>. A name
          usually follows a noun for its kind, as in Toki Pona's <i>ma Kanata</i>, so the listener
          knows what's coming: <T>land &lt;foreign&gt; shinar</T>, <T>person &lt;foreign&gt; adam</T>.
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
    </WithContents>
  );
}
