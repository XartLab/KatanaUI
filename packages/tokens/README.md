# @katana-ui/tokens

Design tokens for Katana UI: one JSON source, generated CSS variables. No framework, no app code.

- `tokens.json`: the source (colour, spacing, radius, shadow, border, type, and later the foundation, density and characteristics layers). Edit this.
- `motion.tokens.json`: the three springs (`snappy`, `gentle`, `settle`). Also the source of the CSS `linear()` easings.
- `tokens.css`: generated from the two files above by `scripts/sync-tokens.mjs`. Do not edit by hand.

## Exports

```css
@import '@katana-ui/tokens/tokens.css';
```

```ts
import tokens from '@katana-ui/tokens/tokens.json'
import motion from '@katana-ui/tokens/motion.tokens.json'
```

`@katana-ui/react` re-exports `./tokens.css` and `./tokens.json`, so most consumers do not import this package directly.

## Change a token

Edit `src/tokens.json` (or `src/motion.tokens.json`), then:

```
pnpm tokens:sync          # from the repo root
```

`pnpm test` runs `node scripts/sync-tokens.mjs --check` and fails when `src/tokens.css` and the sources disagree.

## Install (before npm)

The repo is private and not on npm yet, so install from a git tag with a subdirectory:

```json
{
  "dependencies": {
    "@katana-ui/tokens": "git+https://github.com/XartLab/KatanaUI.git#v0.1.0&path:packages/tokens"
  }
}
```

License: MIT.
