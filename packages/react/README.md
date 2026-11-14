# KatanaUI

A React component library for dense, data-heavy interfaces such as trading consoles and dashboards. Radix UI provides
the behavior, [shadcn/ui](https://ui.shadcn.com) code is the starting point, Tailwind CSS v4 does the styling, and
every color, size, radius and motion value comes from a design token, so a whole theme is a handful of CSS variables.

- **Documentation and live previews:** <https://xartlab.github.io/KatanaUI/>
- **shadcn registry:** `https://xartlab.github.io/KatanaUI/r/{name}.json`
- **License:** MIT
- **Browser tests:** `pnpm test:e2e` runs the Playwright suite against the built docs site; `pnpm --filter @katana-ui/react test:happo` sends Happo visual snapshots (needs a Happo account, not part of the gate).

## Install as a package

The package is not on npm yet. Pin a release tag of this repository (your git credentials need read access to it):

```json
{
  "dependencies": {
    "@katana-ui/react": "git+https://github.com/XartLab/KatanaUI.git#v0.1.0&path:packages/react"
  }
}
```

`@katana-ui/react` has `@katana-ui/tokens` (the design tokens, a sibling package in this repository) as a peer
dependency, so you install both, pinned to the same tag. Neither is on npm yet:

```json
{
  "dependencies": {
    "@katana-ui/react": "git+https://github.com/XartLab/KatanaUI.git#v0.1.0&path:packages/react",
    "@katana-ui/tokens": "git+https://github.com/XartLab/KatanaUI.git#v0.1.0&path:packages/tokens"
  }
}
```

No `overrides` and no `blockExoticSubdeps` are needed (checked with pnpm 12.18.0). Do not make tokens a regular
dependency of the react package: pnpm 12 rejects a git-sourced dependency of a dependency (`ERR_PNPM_EXOTIC_SUBDEP`),
and reads `overrides` only from `pnpm-workspace.yaml`, not from a `pnpm.overrides` field in `package.json`. Once the
packages are on npm, both lines become plain semver ranges.

The package ships compiled JavaScript and type declarations (built into `lib/` by its `prepare` script when pnpm
installs it from git), so plain Node and `tsc` can load it as well as bundlers. pnpm only runs that script if you
allow it, with the full dependency address as the key, in your `pnpm-workspace.yaml` (checked with pnpm 12.18.0;
a bare package name does not work). The address is the one pnpm prints in the error when the entry is missing; for
a commit or tag it has this form:

```yaml
allowBuilds:
  '@katana-ui/react@https://codeload.github.com/XartLab/KatanaUI/tar.gz/<commit or tag>#path:packages/react': true
```

Update the key whenever you change the pinned commit or tag. You do not need `@types/d3-hierarchy` or any other
`@types/*` package besides `@types/react`.

```ts
import '@katana-ui/react/tokens.css' // tokens first
import '@katana-ui/react/ui.css' // Tailwind theme and motion, last
import tokens from '@katana-ui/react/tokens.json' // the token source, for canvas code
import { Button } from '@katana-ui/react'
```

`@katana-ui/react/tokens.css` and `@katana-ui/react/tokens.json` forward to `@katana-ui/tokens`, so the import lines do
not change. The package exports also have a `source` condition that points at the TypeScript source in `src/`.

## Install with shadcn

Your project needs React 19 and Tailwind CSS v4. Add the registry to your `components.json` once:

```json
{
  "registries": {
    "@katana": "https://xartlab.github.io/KatanaUI/r/{name}.json"
  }
}
```

Then add the style (tokens, Tailwind theme, motion) and the components you want. The `style` and `motion` items depend
on the `@katana-ui/tokens` package, (until it is on npm, add it with the git form under "Install as a package"). Each item copies its source files into
your project and installs the npm packages it needs; items depend on each other, so `button` also brings the
`cn` and `focus` helpers.

```sh
npx shadcn@4.22.2 add @katana/style @katana/button
```

You can also add a single item by URL: `npx shadcn@4.22.2 add https://xartlab.github.io/KatanaUI/r/button.json`.

Import order matters because Tailwind utilities are not layered. In your entry stylesheet, load the tokens first, your
own styles next, and `ui.css` last:

```css
@import 'katana/ui/tokens.css';
@import './app.css';
@import 'katana/ui/ui.css';
```

## Theming

Components read semantic tokens only (`--bg-*`, `--ink-*`, `--pnl-up`, and so on). To reskin, override those CSS
variables under a `data-theme` attribute on the root element; no component code changes. Two themes ship in
`tokens.css`: Console (default) and Graphite (`data-theme="graphite"`). Setting `data-updown="cn"` swaps the up and down
colors for markets where red means up.

The token source lives in the sibling package `packages/tokens` (`@katana-ui/tokens`): `src/tokens.json`, plus
`src/motion.tokens.json` for springs. `src/tokens.css` there is generated from them: edit the JSON, then run
`pnpm tokens:sync` from the repository root. `pnpm test` fails when the two disagree.

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
src/tokens.css  forwards to @katana-ui/tokens (the token source and generated CSS variables live in packages/tokens)
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
