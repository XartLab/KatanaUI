# @katana-ui/logos

One place to resolve logos for symbols, companies, coins and venues. Code plus licence-clean sources only: no company logos (trademarks) are bundled.

- **Normalise symbols** (pure functions): `BTCUSDT`, `BTC-USDT`, `BTC/USDT`, `BTC-PERP`, `BTCUSDT.P`, `BINANCE:BTCUSDT` → `BTC`; `600519.XSHG`, `600519.SH`, `sh600519` → `600519` + `XSHG`; `00700.HK` → `00700` + `XHKG`; `AAPL.XNAS`, `AAPL.O`, `NASDAQ:AAPL` → `AAPL` + `XNAS`. Venues are ISO 10383 MICs for stocks and exchange names for crypto.
- **Pluggable providers**, tried in order:
  - `web3icons()` (`@katana-ui/logos/web3icons`): coins and exchanges from [`@web3icons/core`](https://github.com/0xa3k5/web3icons) (MIT, 1,790 coins and 30 exchanges). Each SVG is a dynamic import, so the bundler splits it into its own chunk and only loads it when shown.
  - `selfHosted({ baseUrl, pattern })`: the app's own directory, named `{code}.{mic}.svg` then `{code}.svg` (`600519.XSHG.svg`), `crypto/{code}.svg`, `venues/{venue}.svg`.
  - `urlTemplate({ template, params })`: any logo service or CDN, for example Logo.dev: `https://img.logo.dev/ticker/{code}?token={token}`. The key comes from the app; this package never holds one.
- **Cache**: an in-memory cache per `LogoProvider`. A loader runs once, a failed URL is never requested again, a URL that loaded is tried first next time.
- **React** (`@katana-ui/logos/react`): `LogoProvider` and `useLogo`. `SymbolMark` from `@katana-ui/react` reads it when it has no `src`, tries each candidate and falls back to letters.
- **CLI** `katana-logos fetch`: download logos into the app's own directory and write `manifest.json`.

## Use

```tsx
import { selfHosted, urlTemplate } from '@katana-ui/logos'
import { LogoProvider } from '@katana-ui/logos/react'
import { web3icons } from '@katana-ui/logos/web3icons'

const providers = [
  web3icons(),
  selfHosted({ baseUrl: '/logos' }),
  // urlTemplate({ template: 'https://img.logo.dev/ticker/{code}?token={token}', params: { token: LOGO_DEV_KEY }, assetClasses: ['stock'] }),
]

<LogoProvider providers={providers}>
  <SymbolMark symbol="BTCUSDT" />                 {/* web3icons */}
  <SymbolMark symbol="600519.SH" name="..." />    {/* /logos/600519.XSHG.svg, then letters */}
</LogoProvider>
```

`web3icons()` only matches `assetClass: 'crypto'` by default. Pair notation (`BTCUSDT`, `BTC-PERP`) and crypto venues are recognised as crypto; a bare `META` is not, so a stock never gets a coin's logo. Pass `assetClass` when you know it.

Without a `LogoProvider`, `useLogo` returns nothing and `SymbolMark` behaves exactly as before.

Templates can use `{code}`, `{code_lower}`, `{mic}`, `{venue}`, `{venue_lower}`, `{key}`, `{quote}`, `{symbol}`, `{name}`, `{domain}`, `{assetClass}` and any `params`. A candidate whose template has an empty placeholder is skipped.

## CLI

```
katana-logos fetch --symbols list.txt --provider web3icons --out public/logos
katana-logos fetch --symbols list.txt --provider cryptocurrency-icons --out public/logos
katana-logos fetch --symbols list.txt --provider url \
  --template 'https://img.logo.dev/ticker/{code}?token={token}&format=png' --param token=$LOGO_DEV_KEY --ext png --out public/logos
```

`list.txt` has one `symbol[,venue[,assetClass[,name[,domain]]]]` per line (`#` comments), or is a JSON array of queries. A failed download does not stop the run; the summary lists failures and `--strict` makes them exit 1. `manifest.json` is merged with the existing one and never contains parameter values (keys are written as `*`).

`web3icons` exports from the installed package and needs no network. `cryptocurrency-icons` (CC0) downloads from jsDelivr.

## Licence

MIT. See `NOTICE` for third-party sources. Company logos are trademarks: host them yourself under your own licence, or use a logo service under its terms.

## Regenerate the web3icons table

After upgrading `@web3icons/core`: `pnpm --filter @katana-ui/logos web3icons:sync`. `pnpm test` fails when the table and the dependency disagree.
