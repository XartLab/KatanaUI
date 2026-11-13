# Contributing to KatanaUI

This repository is a read-only mirror. The source of truth is the `packages/ui` directory of the private KATANAview
repository (XartLab/KATANAview); every change to it on `main` is synced here. Pull requests opened against this
repository cannot be merged as they are.

## What to do instead

- **Found a bug or want a component?** Open an issue here. Include the component name, what you expected, what you
  got, and a minimal snippet or screenshot.
- **Have a fix?** Open a pull request here anyway. A maintainer ports it into KATANAview by hand and credits you in
  the commit; the mirror picks it up on the next sync.
- **Design tokens** (colors, spacing, radii, shadows) are generated. Do not edit `src/tokens/tokens.css`; change
  `design/tokens.json` in KATANAview instead.

## Working on the code locally

You need Node 22.13 or newer and pnpm 11.

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
