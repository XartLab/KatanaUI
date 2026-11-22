export declare const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
export declare const WIKIDATA_BATCH = 200;
export type WikidataHit = {
    item: string;
    logo?: string;
    website?: string;
};
export type WikidataOptions = {
    /** 交易所条目上 MIC 的属性号，默认 P7534（待核对）。 */
    micProperty?: string;
    /** 规整后的 MIC → Wikidata 上写的 MIC（北交所规整成 BJSE，Wikidata 上可能写 XBSE 之类，在这里对上）。 */
    micAliases?: Readonly<Record<string, string>>;
};
/** 一批「代码.场所」的 SPARQL。pairs 是 [代码, MIC]。 */
export declare function wikidataQuery(pairs: readonly (readonly [string, string])[], options?: WikidataOptions): string;
/** 解析 SPARQL JSON：「代码.MIC」→ 命中（同一个品种多行时取第一个有徽标的）。MIC 按 micAliases 反查回规整后的。 */
export declare function parseWikidata(json: unknown, options?: WikidataOptions): Map<string, WikidataHit>;
/** Commons 文件地址：位图加 width=256，SVG 原样。 */
export declare function commonsFileUrl(logo: string): string;
/** 切批。 */
export declare function chunk<T>(list: readonly T[], size?: number): T[][];
