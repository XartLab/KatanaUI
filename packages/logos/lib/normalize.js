// SPDX-License-Identifier: MIT
// 品种代码规范化（纯函数）：各家写法（BTCUSDT、BTC-USDT、BTC/USDT、BTC-PERP、BTCUSDT.P、BINANCE:BTCUSDT、600519.SH、sh600519、
// 00700.HK、AAPL.O …）收成 katana 的「代码.场所」：代码 + ISO 10383 MIC（XSHG、XSHE、BJSE、XHKG、XNAS、XNYS …）。
// 加密币的「场所」是交易所名（BINANCE、OKX），不是 MIC；徽标只认基础币（BTC），计价币与合约后缀去掉。
// 只做写法上的规整，不查任何行情库；猜不出来的（不带场所的 AAPL、4 位纯数字）原样留着，assetClass 记 unknown。
/** 场所的各种写法 → ISO MIC（只收股票场所）。 */
const MIC_ALIASES = {
    XSHG: 'XSHG',
    SH: 'XSHG',
    SS: 'XSHG',
    SSE: 'XSHG',
    XSHE: 'XSHE',
    SZ: 'XSHE',
    SZSE: 'XSHE',
    BJSE: 'BJSE',
    XBSE: 'BJSE',
    BJ: 'BJSE',
    BSE: 'BJSE',
    XHKG: 'XHKG',
    HK: 'XHKG',
    HKEX: 'XHKG',
    SEHK: 'XHKG',
    XNAS: 'XNAS',
    O: 'XNAS',
    OQ: 'XNAS',
    NASDAQ: 'XNAS',
    XNYS: 'XNYS',
    N: 'XNYS',
    NYSE: 'XNYS',
    ARCX: 'ARCX',
    ARCA: 'ARCX',
    NYSEARCA: 'ARCX',
    XASE: 'XASE',
    AMEX: 'XASE',
    NYSEAMERICAN: 'XASE',
};
/** 加密币交易所的各种写法 → 统一名（大写）。web3icons 的交易所 id 另在 web3icons.ts 里对。 */
const CRYPTO_VENUE_ALIASES = {
    BINANCE: 'BINANCE',
    BINANCEUS: 'BINANCE',
    OKX: 'OKX',
    OKEX: 'OKX',
    BYBIT: 'BYBIT',
    COINBASE: 'COINBASE',
    GDAX: 'COINBASE',
    KRAKEN: 'KRAKEN',
    KUCOIN: 'KUCOIN',
    BITGET: 'BITGET',
    GATE: 'GATEIO',
    GATEIO: 'GATEIO',
    'GATE.IO': 'GATEIO',
    BITSTAMP: 'BITSTAMP',
    GEMINI: 'GEMINI',
    UPBIT: 'UPBIT',
    BITHUMB: 'BITHUMB',
    'CRYPTO.COM': 'CRYPTOCOM',
    CRYPTOCOM: 'CRYPTOCOM',
    COINEX: 'COINEX',
    BTCTURK: 'BTCTURK',
    HYPERLIQUID: 'HYPERLIQUID',
    BITMEX: 'BITMEX',
    DERIBIT: 'DERIBIT',
    MEXC: 'MEXC',
    HTX: 'HTX',
    HUOBI: 'HTX',
};
/** 计价币，长的在前（FDUSD 先于 USD），拆 BTCUSDT 这类不带分隔符的写法用。 */
const QUOTES = ['FDUSD', 'USDT', 'USDC', 'BUSD', 'TUSD', 'USDE', 'DAI', 'USD', 'EUR', 'TRY', 'BRL', 'BTC', 'ETH', 'BNB'];
/** 合约后缀：BTC-PERP、BTCUSDT.P、BTC-USDT-SWAP、BTCPERP。 */
const PERP = /(?:[-_.]?PERP|[-_]SWAP|\.P)$/;
/** 千倍合约的前缀：1000PEPEUSDT → PEPE。 */
const MULTIPLIER = /^(?:1000000|100000|10000|1000|1M|1K)(?=[A-Z]{2,})/;
/** 场所写法 → ISO MIC 或加密币交易所名；认不得就原样大写。 */
export function normalizeVenue(venue) {
    const v = venue.trim().toUpperCase();
    return MIC_ALIASES[v] ?? CRYPTO_VENUE_ALIASES[v] ?? CRYPTO_VENUE_ALIASES[v.replaceAll(/[\s_-]/g, '')] ?? v;
}
/** 是不是股票场所的 MIC（规整之后）。 */
export function isStockVenue(venue) {
    return venue !== undefined && Object.values(MIC_ALIASES).includes(venue);
}
/** 是不是加密币交易所（规整之后）。 */
export function isCryptoVenue(venue) {
    return venue !== undefined && Object.values(CRYPTO_VENUE_ALIASES).includes(venue);
}
/** A 股 6 位代码按号段推场所：60 / 68 / 90 沪、00 / 30 / 20 深、43 / 83 / 87 / 88 / 92 北交所。 */
export function inferChinaVenue(code) {
    if (!/^\d{6}$/.test(code))
        return undefined;
    const head = code.slice(0, 2);
    if (['60', '68', '90'].includes(head))
        return 'XSHG';
    if (['00', '30', '20'].includes(head))
        return 'XSHE';
    if (['43', '83', '87', '88', '92'].includes(head))
        return 'BJSE';
    return undefined;
}
/** 拆加密币：去掉合约后缀与千倍前缀、按分隔符或计价币后缀分出基础币。拆不出计价币时 quote 为空。 */
export function splitCryptoPair(raw) {
    let s = raw.toUpperCase();
    const perp = PERP.test(s);
    s = s.replace(PERP, '');
    const parts = s.split(/[-/_:]/).filter(Boolean);
    let base = parts[0] ?? s;
    let quote = parts.length > 1 ? parts[1] : undefined;
    if (!quote) {
        const q = QUOTES.find((q) => base.endsWith(q) && base.length - q.length >= 2);
        if (q) {
            quote = q;
            base = base.slice(0, -q.length);
        }
    }
    base = base.replace(MULTIPLIER, '');
    return quote ? { base, quote, perp } : { base, perp };
}
function stockRef(input, code, venue, assetClass) {
    const c = venue === 'XHKG' && /^\d{1,5}$/.test(code) ? code.padStart(5, '0') : code;
    return { input, code: c, ...(venue ? { venue } : {}), assetClass, key: venue ? `${c}.${venue}` : c };
}
/**
 * 规整一个品种代码。hint 给已知的场所与类别（调用方从行情里知道的），比从写法里猜的优先。
 *
 * - 加密币：BTCUSDT / BTC-USDT / BTC/USDT / BTC-PERP / BTCUSDT.P / BINANCE:BTCUSDT → BTC
 * - A 股：600519.XSHG / 600519.SH / 600519.SS / sh600519 / 600519 → 600519 + XSHG
 * - 港股：00700.XHKG / 0700.HK / hk00700 → 00700 + XHKG
 * - 美股：AAPL.XNAS / AAPL.O / NASDAQ:AAPL → AAPL + XNAS；AAPL → AAPL（不带场所）
 */
export function normalizeSymbol(input, hint = {}) {
    const raw = input.trim();
    let s = raw.toUpperCase();
    let venue = hint.venue ? normalizeVenue(hint.venue) : undefined;
    // TradingView 写法「场所:代码」。
    const colon = /^([A-Z][A-Z0-9.]*):(.+)$/.exec(s);
    if (colon) {
        venue ??= normalizeVenue(colon[1]);
        s = colon[2];
    }
    // A 股、港股的前缀写法：sh600519、SZ000001、bj430047、hk00700。
    const prefixed = /^(SH|SZ|BJ|HK)(\d{1,6})$/.exec(s);
    if (prefixed) {
        venue ??= normalizeVenue(prefixed[1]);
        s = prefixed[2];
    }
    // 后缀写法：600519.SH、00700.HK、AAPL.XNAS、AAPL.O。认得的场所才拆（BRK.B 的 .B 不是场所）。BTCUSDT.P 的 .P 是合约后缀，不在表里。
    const dot = /^(.+)\.([A-Z]+)$/.exec(s);
    if (dot && MIC_ALIASES[dot[2]]) {
        venue ??= MIC_ALIASES[dot[2]];
        s = dot[1];
    }
    const looksCrypto = hint.assetClass === 'crypto' ||
        (hint.assetClass === undefined &&
            (isCryptoVenue(venue) ||
                (!isStockVenue(venue) &&
                    (PERP.test(s) || /[-/_]/.test(s) || QUOTES.some((q) => s.endsWith(q) && s.length - q.length >= 2)))));
    if (looksCrypto && !/^\d+$/.test(s)) {
        const { base, quote } = splitCryptoPair(s);
        return {
            input: raw,
            code: base,
            ...(venue ? { venue } : {}),
            ...(quote ? { quote } : {}),
            assetClass: 'crypto',
            key: base,
        };
    }
    // 纯数字：6 位按号段推 A 股场所，5 位当港股；4 位以下不猜（东京 7203、港股简写 0700 要带 .HK 才认）。
    if (/^\d+$/.test(s)) {
        venue ??= inferChinaVenue(s) ?? (s.length === 5 ? 'XHKG' : undefined);
        return stockRef(raw, s, venue, hint.assetClass ?? (venue ? 'stock' : 'unknown'));
    }
    return stockRef(raw, s, venue, hint.assetClass ?? (venue && isStockVenue(venue) ? 'stock' : 'unknown'));
}
