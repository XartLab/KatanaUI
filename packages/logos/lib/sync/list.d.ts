import type { AssetClass } from '../normalize.ts';
export type MarketItem = {
    symbol: string;
    venue?: string;
    name?: string;
    domain?: string;
    assetClass?: AssetClass;
};
/** 拆一行 CSV（支持双引号与引号里的逗号、两个双引号转义）。 */
export declare function csvRow(line: string): string[];
export declare function parseMarketList(text: string): MarketItem[];
