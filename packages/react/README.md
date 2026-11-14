# KatanaUI

A React component library for dense, data-heavy interfaces such as trading consoles and dashboards. Radix UI provides
the behavior, [shadcn/ui](https://ui.shadcn.com) code is the starting point, Tailwind CSS v4 does the styling, and
every color, size, radius and motion value comes from a design token, so a whole theme is a handful of CSS variables.

- **Documentation and live previews:** <https://xartlab.github.io/KatanaUI/>
- **shadcn registry:** `https://xartlab.github.io/KatanaUI/r/{name}.json`
- **License:** MIT

## Install as a package

The package is not on npm yet. Pin a release tag of this repository (your git credentials need read access to it):

```json
{
  "dependencies": {
    "@katana-ui/react": "git+https://github.com/XartLab/KatanaUI.git#v0.1.0&path:packages/react"
  }
}
```

```ts
import '@katana-ui/react/tokens.css' // tokens first
import '@katana-ui/react/ui.css' // Tailwind theme and motion, last
import { Button } from '@katana-ui/react'
```

The package ships TypeScript source, so your bundler (Vite, for example) compiles it.

## Install with shadcn

Your project needs React 19 and Tailwind CSS v4. Add the registry to your `components.json` once:

```json
{
  "registries": {
    "@katana": "https://xartlab.github.io/KatanaUI/r/{name}.json"
  }
}
```

Then add the style (tokens, Tailwind theme, motion) and the components you want. Each item copies its source files into
your project and installs the npm packages it needs; items depend on each other, so `button` also brings the
`cn` and `focus` helpers.

```sh
npx shadcn@4.22.2 add @katana/style @katana/button
```

You can also add a single item by URL: `npx shadcn@4.22.2 add https://xartlab.github.io/KatanaUI/r/button.json`.

Import order matters because Tailwind utilities are not layered. In your entry stylesheet, load the tokens first, your
own styles next, and `ui.css` last:

```css
@import 'katana/ui/tokens/tokens.css';
@import './app.css';
@import 'katana/ui/ui.css';
```

## Theming

Components read semantic tokens only (`--bg-*`, `--ink-*`, `--pnl-up`, and so on). To reskin, override those CSS
variables under a `data-theme` attribute on the root element; no component code changes. Two themes ship in
`tokens.css`: Console (default) and Graphite (`data-theme="graphite"`). Setting `data-updown="cn"` swaps the up and down
colors for markets where red means up.

The token source is `src/tokens/tokens.json` (plus `src/tokens/motion.tokens.json` for springs). `src/tokens/tokens.css`
is generated from it: edit the JSON, then run `pnpm tokens:sync`. `pnpm test` fails when the two disagree.

## Develop locally

Node 22.13 or newer and pnpm 12. Run these from the repository root:

```sh
pnpm install
pnpm dev          # documentation site at http://localhost:5173
pnpm test         # format, lint, generated-file checks and unit tests
pnpm typecheck
pnpm build:site   # documentation site and shadcn registry into dist/ and dist/r/
```

## Layout

```
src/tokens      token source (tokens.json), generated CSS variables (tokens.css) and motion springs
src/theme       Tailwind v4 theme, keyframes and component CSS
src/lib         cn, focus ring, motion helpers
src/primitives  Radix-based building blocks (button, input, select, dialog, menus, tabs, ...)
src/katana      readouts and status components (led, lcd, dot-matrix, number-input, ...)
src/patterns    compositions of the primitives (multi-select)
src/quant       market-data formatting and components (change and PnL text, number formats)
src/blocks      larger compositions built from the layers above (data grid, toolbar, empty state, ...)
gallery         the documentation site
design-system   generated design-system package (tokens, per-component docs and previews)
registry.json   shadcn registry manifest, generated from the source
docs/zh-CN.md   internal notes in Chinese
```

Dependencies only point down that list: tokens, theme, lib, primitives, katana, patterns, quant, blocks.

## License

MIT. Files in `src/primitives/` are derived from shadcn/ui (MIT, Copyright (c) 2023 shadcn); their headers say so. See
[LICENSE](LICENSE) and [NOTICE](NOTICE).
