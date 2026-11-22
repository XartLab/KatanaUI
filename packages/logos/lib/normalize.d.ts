export type AssetClass = 'crypto' | 'stock' | 'fund' | 'index' | 'forex' | 'future' | 'unknown';
export type SymbolRef = {
    /** 原样的输入（去掉首尾空白）。 */
    input: string;
    /** 规整后的代码：加密币是基础币（BTC），A 股 6 位、港股 5 位数字，美股是大写字母代码。 */
    code: string;
    /** 场所：股票是 ISO MIC（XSHG），加密币是交易所名（BINANCE）；不知道就没有。 */
    venue?: string;
    /** 加密币的计价币（USDT）；拆不出来就没有。 */
    quote?: string;
    assetClass: AssetClass;
    /** 「代码.场所」，没有场所就是代码本身：600519.XSHG、AAPL.XNAS、AAPL、BTC。 */
    key: string;
};
/** 场所写法 → ISO MIC 或加密币交易所名；认不得就原样大写。 */
export declare function normalizeVenue(venue: string): string;
/** 是不是股票场所的 MIC（规整之后）。 */
export declare function isStockVenue(venue: string | undefined): boolean;
/** 是不是加密币交易所（规整之后）。 */
export declare function isCryptoVenue(venue: string | undefined): boolean;
/** A 股 6 位代码按号段推场所：60 / 68 / 90 沪、00 / 30 / 20 深、43 / 83 / 87 / 88 / 92 北交所。 */
export declare function inferChinaVenue(code: string): string | undefined;
/** 拆加密币：去掉合约后缀与千倍前缀、按分隔符或计价币后缀分出基础币。拆不出计价币时 quote 为空。 */
export declare function splitCryptoPair(raw: string): {
    base: string;
    quote?: string;
    perp: boolean;
};
/**
 * 规整一个品种代码。hint 给已知的场所与类别（调用方从行情里知道的），比从写法里猜的优先。
 *
 * - 加密币：BTCUSDT / BTC-USDT / BTC/USDT / BTC-PERP / BTCUSDT.P / BINANCE:BTCUSDT → BTC
 * - A 股：600519.XSHG / 600519.SH / 600519.SS / sh600519 / 600519 → 600519 + XSHG
 * - 港股：00700.XHKG / 0700.HK / hk00700 → 00700 + XHKG
 * - 美股：AAPL.XNAS / AAPL.O / NASDAQ:AAPL → AAPL + XNAS；AAPL → AAPL（不带场所）
 */
export declare function normalizeSymbol(input: string, hint?: {
    venue?: string;
    assetClass?: AssetClass;
}): SymbolRef;
