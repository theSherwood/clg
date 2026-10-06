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
