# Word Order Illustrator

> A bitext word-alignment and word-order illustrator for translators, language learners, conlangers, and linguists.

**Live demo:** <https://word-order.mkpo.li/> · **First published:** August 2022

![Preview of the Word Order Illustrator with linked words across two languages.](static/og-image.png)

Paste sentences in any languages, click matching words across rows, and the tool draws curved connectors. Reordered translations, one-to-many mappings, and many-to-one mappings all stay readable.

## Features

- **Locale-aware tokenization** via `Intl.Segmenter` — CJK, Thai, and other unspaced scripts split correctly out of the box. Use `|` for finer manual control.
- **Curved connectors** with adjustable curvature, line width, gap, straight segments, and endpoint correction.
- **Interlinear gloss** row above each sentence for Leipzig-style annotations.
- **Ruby annotations** — `<ruby>漢<rt>かん</rt></ruby>` works inside both sentence text and glosses, so furigana, pinyin, and zhuyin render correctly.
- **Per-token edit dialog** — merge selected tokens, split at any grapheme boundary, or merge into a neighbor.
- **Multiple projects via tabs** with localStorage autosave — refreshing or closing the browser preserves your work.
- **Examples gallery** — SOV vs SVO, RTL scripts, Romance pro-drop, multi-script CJK, Turkish interlinear gloss, Genesis 1:1 across Hebrew / Koine Greek / Latin / English.
- **Scramble equivalency** — instantly reorder the color groups to visualize how often translations rearrange information.
- **Export** as SVG (vector) or PNG (raster), plus full project JSON for archival and sharing.
- **UI in 20+ languages** via [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — including Ainu, Korean Hanja, Bulgarian, Finnish, Esperanto, Interlingua, Toki Pona, and more.
- **SEO-ready** with localized metadata, Open Graph, JSON-LD, and an Open Graph preview image.

## How to use

1. Type or paste a sentence into the input box and press **Add**. Words are split automatically using locale-aware segmentation.
2. Click a word in one row, then a matching word in an adjacent row, then press **Confirm** to connect them. Click an already-linked word to edit its color group.
3. Use the pencil icon to fine-tune tokenization (merge/split tokens) and optionally fill in an interlinear gloss row.
4. Adjust spacing, curvature, fonts, and text alignment in the Options panel.
5. Export as SVG or PNG when you're done.

For a guided tour, click the **Help** button in the header.

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

> **TODO** — this section is a working draft. Re-verify each tool's current feature set before relying on the comparison externally; add any peers that are missing.

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

> **TODO** — survey conducted May 2026 from each tool's then-current live build, GitHub repo, and README. Cells marked `?` were not directly verifiable from the public surface and should be confirmed by the tool's author before being cited externally.

#### Identity & metadata

| | Word Order Illustrator | Bitext Align | LangMap |
|---|---|---|---|
| Category | Authoring | Authoring | Curated atlas |
| Web | [word-order.mkpo.li](https://word-order.mkpo.li/) | [aligner.tinygods.dev](https://aligner.tinygods.dev/) | [langmap.heuron.com](https://langmap.heuron.com/) |
| Repo | [mkpoli/word-order](https://github.com/mkpoli/word-order) | [tinygodsdev/bitext-word-alignment](https://github.com/tinygodsdev/bitext-word-alignment) | [jounlai/langmap](https://github.com/jounlai/langmap) |
| Author | [@mkpoli](https://github.com/mkpoli) | [Dani Polani](https://github.com/dani-polani) / [tinygodsdev](https://github.com/tinygodsdev) | [Jounlai Cho](https://github.com/jounlai) / [Heuron Corp.](https://heuron.com/) |
| First public release | Aug 2022 | Apr 2026 | Mar 2026 |
| Repo created | 2022-08-23 | 2026-04-18 | 2026-03-12 |
| License | none in repo (see "[A note on rights](#a-note-on-rights)") | MIT | MIT (README only — no `LICENSE` file in repo) |
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
| Guided tour / Help | ✅ (Help button) | ❌ | ❌ |

#### Persistence & sharing

| Feature | Word Order Illustrator | Bitext Align | LangMap |
|---|---|---|---|
| Autosave (localStorage) | ✅ | ? | n/a |
| Multiple workspaces / tabs | ✅ (per-tab autosave) | ❌ | n/a |
| URL share (state in hash) | ❌ | ✅ | ✅ |
| Social share buttons | ❌ | ✅ | ✅ X / Facebook / LINE |
| Export SVG | ✅ vector | ✅ vector | ✅ |
| Export PNG | ✅ (2× fixed) | ✅ (2×–6× picker) | ✅ |
| Export PDF | ✅ | ✅ | ❌ |
| Export HTML | ❌ | ✅ | ❌ |
| Export JSON (project archive) | ✅ | ❌ | ❌ |
| Export CSV | ❌ | ❌ | ✅ |
| SEO (OG image, JSON-LD) | ✅ | ❌ | ❌ |

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

Issues and pull requests welcome at <https://github.com/mkpoli/word-order/>.

## Author

Created by [@mkpoli](https://mkpo.li/) — [Twitter](https://twitter.com/mkpoli/) · [GitHub](https://github.com/mkpoli).

## A note on rights

This application doesn't claim rights over the illustrations you create with it. How you use or share them is entirely up to you. Sharing the tool itself is appreciated.
