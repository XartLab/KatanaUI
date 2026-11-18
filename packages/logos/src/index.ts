// SPDX-License-Identifier: MIT
// @katana-ui/logos：品种 / 公司 / 币种 / 交易所徽标的统一解析（XartLab/KatanaUI #94）。不依赖 React 与任何应用。
// React 的 LogoProvider / useLogo 在 @katana-ui/logos/react，内置的加密币来源在 @katana-ui/logos/web3icons。
export {
  type AssetClass,
  type SymbolRef,
  inferChinaVenue,
  isCryptoVenue,
  isStockVenue,
  normalizeSymbol,
  normalizeVenue,
  splitCryptoPair,
} from './normalize.ts'
export {
  type DomainMap,
  type LogoCandidate,
  type LogoContext,
  type LogoProvider,
  type LogoQuery,
  type LogoSource,
  type ResolveOptions,
  type SelfHostedOptions,
  type UrlTemplateOptions,
  SELF_HOSTED_CRYPTO_PATTERN,
  SELF_HOSTED_DEFAULT_PATTERN,
  SELF_HOSTED_VENUE_PATTERN,
  domainFor,
  fillTemplate,
  logoContext,
  resolveLogo,
  selfHosted,
  selfHostedPath,
  templateValues,
  urlTemplate,
} from './resolve.ts'
export {
  type ByDomainOptions,
  type CompaniesLogoOptions,
  type LogoDevOptions,
  type LogoKitOptions,
  LOGOKIT_DEFAULT_SUFFIX,
  byDomain,
  companiesLogo,
  companiesLogoApiUrl,
  companiesLogoSymbol,
  logoDev,
  logoKit,
  pickCompaniesLogoImage,
} from './services.ts'
export { LogoCache, type LogoStatus, svgDataUrl } from './cache.ts'
