# @katana-ui/logos

One place to resolve logos for symbols, companies, coins and venues. Code plus licence-clean sources only: no company logos (trademarks) are bundled.

- **Normalise symbols** (pure functions): `BTCUSDT`, `BTC-USDT`, `BTC/USDT`, `BTC-PERP`, `BTCUSDT.P`, `BINANCE:BTCUSDT` → `BTC`; `600519.XSHG`, `600519.SH`, `sh600519` → `600519` + `XSHG`; `00700.HK` → `00700` + `XHKG`; `AAPL.XNAS`, `AAPL.O`, `NASDAQ:AAPL` → `AAPL` + `XNAS`. Venues are ISO 10383 MICs for stocks and exchange names for crypto.
- **Pluggable providers**, tried in order:
  - `web3icons()` (`@katana-ui/logos/web3icons`): coins and exchanges from [`@web3icons/core`](https://github.com/0xa3k5/web3icons) (MIT, 1,790 coins and 30 exchanges). Each SVG is a dynamic import, so the bundler splits it into its own chunk and only loads it when shown.
  - `selfHosted({ baseUrl, pattern })`: the app's own directory, named `{code}.{mic}.svg` then `{code}.svg` (`600519.XSHG.svg`), `crypto/{code}.svg`, `venues/{venue}.svg`.
  - `urlTemplate({ template, params })`: any logo service or CDN, for example Logo.dev: `https://img.logo.dev/ticker/{code}?token={token}`. The key comes from the app; this package never holds one.
- **Logo-service presets** (URLs and requests only; the app supplies the key):
  - `companiesLogo({ token })`: companieslogo.com API. Shanghai `600519.SS`, Shenzhen `000001.SZ`, Hong Kong `0700.HK`, US bare tickers; Beijing (BJSE) is not supported yet. The API returns JSON, so the candidate is a loader. Its terms allow downloading and self-hosting, so prefer the CLI.
  - `logoDev({ token })`: Logo.dev. With a domain, `img.logo.dev/{domain}` (works worldwide, including A-shares); US stocks also get `img.logo.dev/ticker/{code}` (NYSE / NASDAQ only).
  - `logoKit({ token, suffix })`: LogoKit, `img.logokit.com/ticker/{symbol}?token=…&fallback=404` (404 instead of its monogram, so we draw letters). US bare tickers; A-shares get a suffix from `suffix` (default `.SZ` / `.SS`, not documented by LogoKit, to be verified with a real key); Beijing is not mapped. Hotlink only: its terms forbid caching or storing images, so the CLI refuses it. Free tier is 64px and needs an attribution link; each app or user uses its own publishable key.
  - `byDomain(template, { params })`: any "logo by company domain" template containing `{domain}`.
  - `domainMap` (`resolveLogo(query, providers, { domainMap })`, `<LogoProvider domainMap>`): `{ '600519.XSHG': 'example.com' }`, keyed by `code.MIC`, filled in when a query has no `domain`.
  - Do not use a platform's private CDN (for example TradingView's logo files): it is not licensed for reuse.
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

```
katana-logos fetch --symbols a-shares.txt --provider companieslogo --token $COMPANIESLOGO_KEY --out public/logos
katana-logos fetch --symbols a-shares.txt --provider logodev --token $LOGO_DEV_KEY --domains domains.json --out public/logos
katana-logos fetch --symbols a-shares.txt --provider domain --template 'https://logos.example.com/{domain}.png' --domains domains.json --out public/logos
```

`web3icons` exports from the installed package and needs no network. `cryptocurrency-icons` (CC0) downloads from jsDelivr. `--domains` is a JSON object from `code.MIC` to company domain. The file extension follows the response content type unless `--ext` is given; `--token` values never reach `manifest.json`.

## Sync the whole market

`katana-logos sync` fills the app's logo directory for a whole market list in one run (A-shares, US, Hong Kong and crypto in one file):

```
katana-logos sync --list market.csv --out public/logos                  # free sources only
katana-logos sync --list market.csv --out public/logos --config katana-logos.config.json --refresh 30 --concurrency 6
katana-logos sync --list market.csv --out public/logos --domains domains.json
```

`market.csv` has the header `symbol,venue,name,domain[,assetClass]` (`venue` is the ISO MIC; `XBSE` is accepted for Beijing and normalised to `BJSE`), or is a JSON array of the same objects.

Sources are tried in the configured order. The default (no config file) is free only:

1. `website`: the company site (the list's `domain` first, then Wikidata P856). The SVG icon, then `apple-touch-icon`, then the largest `icon` by `sizes`, then `/apple-touch-icon.png`, `/favicon.ico` (largest frame), and finally Google's favicon service.
2. `wikidata`: logo image (P154), looked up by exchange (P414, matched on the exchange's MIC property, default P7534) and ticker (P249), up to 200 per SPARQL batch.
3. `web3icons`: coins, from the installed package.

Optional: `companieslogo` (paid; its terms allow download and self-hosting), `pack` (a paid logo pack already on disk, e.g. EODHD), `logokit` (hotlink only: the URL goes into the manifest's `hotlink` field with `{token}` in place of the key; nothing is downloaded). Keys are written as `env:NAME` in the config. See `katana-logos.config.example.json`.

Every image passes a quality filter: smaller than 32px, Google's 16px globe placeholder, wider than 2.2:1 (wordmarks), or blank / one flat colour is rejected with a reason, and the next candidate is tried. Output: images named `code.MIC.ext` (`600519.XSHG.svg`, `crypto/BTC.svg`), `manifest.json` (source, size, time and rejection reasons per symbol), and `coverage.json` / `coverage.md` by market (XSHG, XSHE, BJSE, US, XHKG, crypto): totals, hits, share by source, rejections by reason, and the missing list. Re-runs skip symbols whose sources are unchanged and not older than `--refresh` days; failed requests are retried twice; one symbol failing never stops the run.

Not done on purpose: scraping logos from any platform's CDN (TradingView, Eastmoney, Xueqiu, Futu and others). Those are the platforms' own assets and their terms do not allow it.

## Licence

MIT. See `NOTICE` for third-party sources. Company logos are trademarks: host them yourself under your own licence, or use a logo service under its terms.

## Regenerate the web3icons table

After upgrading `@web3icons/core`: `pnpm --filter @katana-ui/logos web3icons:sync`. `pnpm test` fails when the table and the dependency disagree.
