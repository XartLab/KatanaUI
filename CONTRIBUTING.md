# Contributing to KatanaUI

This repository is the source of truth for Katana UI. Issues and pull requests are welcome here.

- **Found a bug or want a component?** Open an issue. Include the component name, what you expected, what you got,
  and a minimal snippet or screenshot.
- **Have a fix?** Open a pull request against `main`. CI runs the same checks as `pnpm test`, `pnpm typecheck` and
  `pnpm build:site`.
- **Design tokens** live in `packages/react/src/tokens/tokens.json`. Do not edit the generated `tokens.css`; change the
  JSON and run `pnpm tokens:sync`.

## Working on the code locally

You need Node 22.13 or newer and pnpm 12. Run commands from the repository root.

```sh
pnpm install
pnpm dev          # documentation site with live previews
pnpm test         # unit tests
pnpm typecheck
pnpm build:site   # documentation site plus the shadcn registry (dist/ and dist/r/)
```

Code style: no semicolons, single quotes, 120 columns. `pnpm check` runs the formatter and the linter; a single
warning fails it. Every source file starts with an `SPDX-License-Identifier: MIT` line. Components take their text
from props; do not hard-code user-facing strings in them.

By contributing you agree that your work is released under the MIT license of this project.
