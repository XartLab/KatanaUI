// SPDX-License-Identifier: MIT
// @katana-ui/logos：品种 / 公司 / 币种 / 交易所徽标的统一解析（XartLab/KatanaUI #94）。不依赖 React 与任何应用。
// React 的 LogoProvider / useLogo 在 @katana-ui/logos/react，内置的加密币来源在 @katana-ui/logos/web3icons。
export { inferChinaVenue, isCryptoVenue, isStockVenue, normalizeSymbol, normalizeVenue, splitCryptoPair, } from './normalize.js';
export { SELF_HOSTED_CRYPTO_PATTERN, SELF_HOSTED_DEFAULT_PATTERN, SELF_HOSTED_VENUE_PATTERN, domainFor, fillTemplate, logoContext, resolveLogo, selfHosted, selfHostedPath, templateValues, urlTemplate, } from './resolve.js';
export { LOGOKIT_DEFAULT_SUFFIX, byDomain, companiesLogo, companiesLogoApiUrl, companiesLogoSymbol, logoDev, logoKit, pickCompaniesLogoImage, } from './services.js';
export { LogoCache, svgDataUrl } from './cache.js';
