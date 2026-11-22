import { type LogoContext } from '../resolve.ts';
import { type ImageFormat } from './image.ts';
import type { MarketItem } from './list.ts';
import { type WikidataOptions } from './wikidata.ts';
export type SourceConfig = {
    type: 'website';
    google?: boolean;
} | ({
    type: 'wikidata';
} & WikidataOptions) | {
    type: 'web3icons';
} | {
    type: 'companieslogo';
    token: string;
} | {
    type: 'pack';
    id?: string;
    dir: string;
    pattern?: string | string[];
} | {
    type: 'logokit';
    token: string;
    suffix?: Record<string, string>;
};
export type SyncConfig = {
    sources: SourceConfig[];
    concurrency?: number;
    retries?: number;
    refreshDays?: number;
    /** Wikidata 查询的设置（website 来源也靠它补官网域名）。 */
    wikidata?: WikidataOptions & {
        domains?: boolean;
    };
};
/** 默认配置：只用免费源。 */
export declare const DEFAULT_SYNC_CONFIG: SyncConfig;
export type Rejected = {
    source: string;
    url: string;
    reason: string;
};
export type SyncEntry = {
    symbol: string;
    key: string;
    market: string;
    status: 'ok' | 'hotlink' | 'missing';
    file?: string;
    source?: string;
    url?: string;
    format?: ImageFormat;
    width?: number;
    height?: number;
    bytes?: number;
    /** 只许热链的来源（LogoKit）登记的地址；key 换成 {token}，由应用自己的 key 填。 */
    hotlink?: string;
    domain?: string;
    fetchedAt?: string;
    checkedAt: string;
    /** 当时配置的来源顺序；变了就重拉。 */
    sources: string;
    rejected: Rejected[];
    error?: string;
};
export type SyncManifest = {
    generator: 'katana-logos sync';
    updatedAt: string;
    entries: Record<string, SyncEntry>;
};
export type SyncDeps = {
    fetch: typeof fetch;
    log: (line: string) => void;
    now: () => Date;
    sleep?: (ms: number) => Promise<void>;
    env?: Readonly<Record<string, string | undefined>>;
};
export type SyncOptions = {
    items: readonly MarketItem[];
    out: string;
    config?: SyncConfig;
    /** 「代码.场所」→ 官网域名（清单里没写 domain 的补上）。 */
    domainMap?: Readonly<Record<string, string>>;
    /** 超过这么多天的重拉（盖过配置）。 */
    refreshDays?: number;
    concurrency?: number;
};
export type SyncReport = {
    manifest: SyncManifest;
    coverage: Coverage;
    processed: number;
    skipped: number;
};
/** 统计用的市场分组。 */
export declare function marketOf(ctx: LogoContext): string;
/** 配置里的 "env:NAME" 换成环境变量。 */
export declare function resolveSecrets(config: SyncConfig, env: Readonly<Record<string, string | undefined>>): SyncConfig;
/** 跑一遍流水线。 */
export declare function runSync(options: SyncOptions, deps: SyncDeps): Promise<SyncReport>;
export type MarketCoverage = {
    total: number;
    /** 有本地文件的。 */
    hit: number;
    /** 只有热链地址的。 */
    hotlink: number;
    missing: number;
    /** 命中来源 → 个数。 */
    bySource: Record<string, number>;
    /** 被丢原因 → 次数（一个品种可能被丢多次）。 */
    byReason: Record<string, number>;
    missingList: string[];
};
export type Coverage = {
    generatedAt: string;
    total: MarketCoverage;
    markets: Record<string, MarketCoverage>;
};
export declare const MARKET_ORDER: readonly ['XSHG', 'XSHE', 'BJSE', 'US', 'XHKG', 'crypto', 'other'];
export declare const MARKET_LABEL: Readonly<Record<string, string>>;
/** 按市场统计（纯函数）。 */
export declare function buildCoverage(entries: readonly SyncEntry[], now: Date): Coverage;
/** coverage.md（纯函数）。 */
export declare function coverageMarkdown(c: Coverage): string;
