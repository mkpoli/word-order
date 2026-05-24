# Word Order Illustrator

> A bitext word-alignment and word-order illustrator for translators, language learners, conlangers, and linguists.

**Live demo:** <https://word-order.mkpo.li/> · **First published:** August 2022

![Preview of the Word Order Illustrator with linked words across two languages.](static/og-image.png)

Paste sentences in any languages, click matching words across rows, and the tool draws curved connectors. Reordered translations, one-to-many mappings, and many-to-one mappings all stay readable.

## Features

- 🔤 **Locale-aware tokenization** — CJK, Thai, and other unspaced scripts are auto-segmented; use `|` to fix the cases where the segmenter guesses wrong.
- 〰️ **Curved connectors** with tunable curvature, line width, gap, and endpoint correction.
- 🏷️ **Multi-tier annotations above and below each word** — gloss, IPA, morphemes, as many tiers as you need.
- 🈁 **Ruby annotations** (`<ruby>漢<rt>かん</rt></ruby>`) render inline in source text and in any annotation tier.
- ✂️ **Per-token merge and split** at any grapheme boundary.
- 🎲 **Scramble equivalency** — one click reorders the color groups to show how much a translation reshuffles meaning.
- 🤖 **BYO-key LLM translate-and-align** — supply your own [OpenAI](https://platform.openai.com/), [Anthropic](https://console.anthropic.com/), or [Gemini](https://aistudio.google.com/app/apikey) key (stored only in localStorage). Translate into one or more targets at once with auto-glossing and auto-alignment; any BCP-47 code works as a target.
- 📚 **Examples gallery** — SOV vs SVO, RTL scripts, Romance pro-drop, multi-script CJK, Turkish interlinear gloss, Ainu polysynthesis, Genesis 1:1 across Hebrew / Koine Greek / Latin / English, and more.
- 💾 **localStorage autosave** and **export** as SVG, PNG, PDF, or re-importable JSON.
- 🌐 **UI in 30+ languages** via [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — including Ainu, Korean Hanja, Esperanto, Interlingua, and Toki Pona.

## How to use

1. Type or paste a sentence into the input box and press **Add**.
2. *(Optional)* If you've added an API key in **Settings**, click **Translate** to pick target languages — the tool fills in translated rows, glosses, and tentative alignments for you.
3. Click a word in one row, then a matching word in another, and press **Confirm** to connect them. Clicking an already-linked word lets you edit its color group.
4. Use the pencil icon on any row to fine-tune tokenization or add annotation tiers above and below.
5. Tweak spacing, curvature, fonts, and text alignment in the **Options** panel.
6. Export from the **Export** menu — or load a ready-made example from **Examples**.

## Tech stack

- [SvelteKit](https://kit.svelte.dev/) (Svelte 4) + TypeScript
- [Vite](https://vitejs.dev/) (Vite 5)
- [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) for i18n
- [`dom-to-svg`](https://github.com/felixfbecker/dom-to-svg) and [`dom-to-image`](https://github.com/tsayen/dom-to-image) for vector and raster export
- [`@neodrag/svelte`](https://www.neodrag.dev/) for draggable dialogs
- [`colorjs.io`](https://colorjs.io/) for OKLCH color palette generation
- [Iconify](https://iconify.design/) for icons
- Deployed on [Vercel](https://vercel.com/)

## Related tools

> Working draft — re-verify each tool's current feature set before citing the comparison externally; add any peers that are missing.

### Authoring tools (closest peers — manual click-to-link alignment with curved connectors)

- **[Bitext Align](https://aligner.tinygods.dev/)** ([source](https://github.com/tinygodsdev/bitext-word-alignment)) — SvelteKit. By [Dani Polani](https://github.com/dani-polani) under the [tinygodsdev](https://github.com/tinygodsdev) org. Multi-line editor with per-line LTR/RTL, gloss/IPA tiers, PNG/SVG/PDF/HTML export, URL-encoded share, light/dark theme, 3 built-in examples.
- **[BasicCAT Bitext Aligner](https://www.basiccat.org/new-tool-bitext-aligner/)** — sentence/word aligner shipped inside a CAT translation suite.
- **Academic prototypes** (paper-only, not always hosted):
  - **Yawat** — uses dynamic markup to keep the alignment view from getting visually busy as connections pile up.
  - **[Line-a-line](https://www.academia.edu/49114010/)** — drag-and-drop alignment for under-resourced parallel corpora.
  - **CLUE-Aligner** — manual annotation of contiguous and non-contiguous multiword expressions.
  - **[SWIFT Aligner](https://www.researchgate.net/publication/263765021)** — visualization + alignment + morpho-syntactic cross-language transfer in one GUI.

### Curated atlases (browse pre-aligned data — not for authoring your own)

- **[LangMap](https://langmap.heuron.com/)** ([source](https://github.com/jounlai/langmap)) — 100 sentences × 223 languages of hand-aligned word-order data, plus a 957-language word atlas with IPA and a D3 family tree.

### Interlinear gloss formatters (adjacent category — they typeset glosses, they don't align across rows)

- **[Leipzig.js](https://bdchauvette.net/leipzig.js/)** ([source](https://github.com/bdchauvette/leipzig.js/)) — JS library for embedding Leipzig-style glosses in HTML.
- **[Gloss My Gloss](https://neonnaut.github.io/)** — browser tool that formats glosses into aligned columns with abbreviation tooltips.
- **[leipzig-glossing (Typst)](https://typst.app/universe/package/leipzig-glossing/)** — Typst package for typesetting glosses in documents.
- **[FieldWorks Language Explorer](https://software.sil.org/fieldworks/)** — SIL's desktop suite for full interlinear text annotation with a persistent lexicon.

### Feature comparison

Survey conducted May 2026 from each tool's then-current live build, GitHub repo, and README. Cells marked `?` were not directly verifiable from the public surface and should be confirmed by the tool's author before being cited externally.

<details>
<summary>Click to expand the comparison tables</summary>

#### Identity & metadata

| | Word Order Illustrator | Bitext Align | LangMap |
|---|---|---|---|
| Category | Authoring | Authoring | Curated atlas |
| Web | [word-order.mkpo.li](https://word-order.mkpo.li/) | [aligner.tinygods.dev](https://aligner.tinygods.dev/) | [langmap.heuron.com](https://langmap.heuron.com/) |
| Repo | [mkpoli/word-order](https://github.com/mkpoli/word-order) | [tinygodsdev/bitext-word-alignment](https://github.com/tinygodsdev/bitext-word-alignment) | [jounlai/langmap](https://github.com/jounlai/langmap) |
| Author | [@mkpoli](https://github.com/mkpoli) | [Dani Polani](https://github.com/dani-polani) / [tinygodsdev](https://github.com/tinygodsdev) | [Jounlai Cho](https://github.com/jounlai) / [Heuron Corp.](https://heuron.com/) |
| First public release | Aug 2022 | Apr 2026 | Mar 2026 |
| Repo created | 2022-08-23 | 2026-04-18 | 2026-03-12 |
| License | MIT | MIT | MIT (README only — no `LICENSE` file in repo) |
| GitHub stars (May 2026) | 13 | 1 | 5 |
| Tech stack | SvelteKit 2 · Svelte 4 · TS · Vite 5 · Vercel | SvelteKit · Vite 8 · Docker | Static HTML/JS · D3 · no build |
| Build step required | ✅ Vite | ✅ Vite | ❌ static files |

#### Alignment authoring

| Feature | Word Order Illustrator | Bitext Align | LangMap |
|---|---|---|---|
| Manual click-to-link alignment | ✅ | ✅ | n/a (pre-aligned) |
| Curved Bézier connectors | ✅ tunable | ✅ tunable | ✅ |
| Connector parameters exposed | curvature, line width, gap, straight length, endpoint correction | style, colors, tokens, fonts | minimal |
| `Intl.Segmenter` tokenization (CJK / Thai) | ✅ | ❌ whitespace + manual join | n/a |
| `<ruby>` (furigana / pinyin / zhuyin) | ✅ tokens & glosses | ❌ | ❌ |
| Interlinear gloss tier | ✅ | ✅ extra tier | ❌ |
| Per-token merge / split dialog | ✅ | partial | ❌ |
| Per-line RTL / LTR toggle | implicit (BCP-47) | ✅ explicit | ✅ |
| Multiple sentences (> 2 rows) | ✅ | ✅ | ✅ |
| Drag to reorder rows | ✅ | ✅ | ✅ |
| Delete row | ✅ | ✅ | ✅ |
| Reorder color groups | ✅ | ? | n/a |
| Scramble equivalency view | ✅ | ❌ | ❌ |
| LLM translate + auto-align (BYO key) | ✅ | ❌ | ❌ |

#### Content & presentation

| Feature | Word Order Illustrator | Bitext Align | LangMap |
|---|---|---|---|
| Built-in examples | 10+ | 3 | 100 sentences × 223 langs |
| UI languages | 32 | 1 (EN) | 21 |
| Light / dark theme | ❌ | ✅ | ✅ |
| Font customization | ✅ family / style / size | ✅ Fonts panel | font size only |
| Color palette customization | ✅ OKLCH auto + Settings | ✅ Colors panel | ❌ fixed |
| Language metadata (family / typology / IPA) | ❌ | ❌ | ✅ extensive |
| Mobile responsive | ? | ? | ✅ |
| Keyboard navigation | ? | ? | ✅ arrow keys, random |
| Guided tour / Help | ❌ | ❌ | ❌ |

#### Persistence & sharing

| Feature | Word Order Illustrator | Bitext Align | LangMap |
|---|---|---|---|
| Autosave (localStorage) | ✅ | ? | n/a |
| Multiple workspaces / tabs | ❌ | ❌ | n/a |
| URL share (state in hash) | ❌ | ✅ | ✅ |
| Social share buttons | ❌ | ✅ | ✅ X / Facebook / LINE |
| Export SVG | ✅ vector | ✅ vector | ✅ |
| Export PNG | ✅ (2× fixed) | ✅ (2×–6× picker) | ✅ |
| Export PDF | ✅ | ✅ | ❌ |
| Export HTML | ❌ | ✅ | ❌ |
| Export JSON (project archive) | ✅ | ❌ | ❌ |
| Export CSV | ❌ | ❌ | ✅ |
| SEO (OG image, JSON-LD) | ✅ | ❌ | ❌ |

</details>

## Developing

[Bun](https://bun.sh) is the recommended package manager (the lockfile is `bun.lockb`) and must be installed before running the development commands.

```bash
bun install
bun dev
```

Other scripts:

```bash
bun run build               # production build (Vercel adapter)
bun run preview             # preview the production build locally
bun run check               # run paraglide compile, svelte-kit sync, and svelte-check
bun run lint                # prettier --check + eslint
bun run format              # prettier --write
bun run paraglide:compile   # regenerate i18n message modules after editing project.inlang/messages/*.json
bun run test                # Playwright E2E tests
```

### Adding a new UI language

Translations live in `project.inlang/messages/*.json`. To add a new locale:

1. Add the locale code to `project.inlang/settings.json`.
2. Copy `project.inlang/messages/en.json` to `project.inlang/messages/<locale>.json` and translate the values.
3. Run `bun run paraglide:compile` to regenerate the typed message modules.
4. Add the locale to `src/lib/lang.ts` if it needs a display name override.

Missing keys fall back to the base locale (English), so translations can be incremental.

## Contributing

Issues and pull requests are welcome — <https://github.com/mkpoli/word-order/>.

- **Bug reports**: include the live-demo URL with your `?` state if you can reproduce there, plus browser + OS. Screenshots help when the issue is visual.
- **PRs**: please run `bun run lint`, `bun run check`, and `bun run test` before opening. If you touch user-visible strings, follow the [Adding a new UI language](#adding-a-new-ui-language) instructions and run `bun run paraglide:compile`.
- **Commit style**: this repo uses [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, etc.) — your PR's commits should follow suit.
- **New examples** for the gallery are a great low-friction way to contribute: edit `src/lib/examples.ts`.

## Author

Created by [@mkpoli](https://mkpo.li/) — [Twitter](https://twitter.com/mkpoli/) · [GitHub](https://github.com/mkpoli).

## License

Source code is released under the [MIT License](LICENSE) © 2022–2026 mkpoli.

### A note on rights

This application doesn't claim rights over the illustrations you create with it. How you use or share them is entirely up to you. Sharing the tool itself is appreciated.
