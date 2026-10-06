# Conlang dictionary

```bash
bun install
bun run dev    # http://localhost:3005
bun run test
```

`bun run dev` runs `dev.ts`, which runs `server.ts` and restarts it when a source file is added
(Bun's dev bundler serves newly created files stale otherwise). The server also lets the
phonology playground's **Save as defaults** write `phonology.defaults.json`.

- `dict.ts`: every word, in sections of root IDs, plus candidates (planned words without a root
  yet), the axis backlog and a Toki Pona reference list
- `phonology.ts`: how a root ID becomes a syllable, and the checks the playground runs
- `examples.ts`: worked examples (number examples, the UDHR) and the tokenizer that looks up
  their words
- `grammar.tsx`: the grammar and syntax page

The tests snapshot which words hold which root IDs. If one fails after you add or move a word,
check the diff is what you meant, then run `bun test --update-snapshots`.

# todo

- [ ] when looking up the parts of a compound word, be consistent about domain
- [x] allow looking up all the root words that correspond to some root id (Roots page)
- [ ] keep track of word depth (how far to the furthest root)
  - [ ] allow filtering by depth
- [ ] allow looking up all the compounds that have some word as a part

## Axis merge candidates

Still to assess, one at a time. Merging frees an axis slot; a merged axis's extra words often
fit as its scale steps.

- [ ] capacity (empty/full) and completeness (none/all): both have "fill up / fill". Set aside:
  vanish/erase may not belong to completeness
- [ ] alignment (skew / true up, plumb) and directness (veer / aim): set aside until aim's
  direction is settled
- [ ] enclose/release and liberty (free/constrain): release ≈ free; enclose could be max_negative
  liberty. Set aside
- [ ] transmission (send/receive): with give, or with travel. Kept separate for now
- [ ] travel (come/go) and distance (near/far): probably keep, since go(vi) is the general verb
  of motion and "go to X" approaches X
- [ ] obligation (duty/privilege) and permissibility (forbid/allow/recommend): obligatory as
  max_positive recommend; might give a word for "right"
- [ ] compliance (submit/resist) and fortitude (succumb/endure): submit ≈ succumb, both near
  control's "give in"
- [ ] aliveness (dead/alive) and animacy (inanimate/animate): partial overlap
- [ ] internality (internal/external) and in/out: noted on the axis as a possible duplicate
- [ ] effort (difficult/easy, hinder/enable): may not make much sense as it stands; revisit now
  that capability (able/unable) holds ability
- [ ] granularity's max steps, slip and stick: sticky as the fullest coarse is a stretch.
  Tentative; a friction axis of its own may fit better
