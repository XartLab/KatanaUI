import { type DomainMap, type LogoQuery } from './resolve.ts';
export declare const CRYPTOCURRENCY_ICONS_TEMPLATE = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/{code_lower}.svg";
export declare const CLI_PROVIDERS: readonly ['web3icons', 'cryptocurrency-icons', 'url', 'companieslogo', 'logodev', 'domain'];
export type FetchOptions = {
    queries: readonly LogoQuery[];
    provider: (typeof CLI_PROVIDERS)[number];
    out: string;
    /** 「代码.场所」→ 官网域名。 */
    domainMap?: DomainMap;
    template?: string;
    params?: Readonly<Record<string, string>>;
    /** 强制文件扩展名；不给就按返回的 content-type。 */
    ext?: string;
    concurrency?: number;
    timeoutMs?: number;
};
export type ManifestEntry = {
    query: LogoQuery;
    key: string;
    file: string;
    provider: string;
    /** 下载地址（模板参数的值替换成 *，不把 key 写进文件）。本地来源写 package:版本。 */
    source: string;
    bytes: number;
    contentType: string;
};
export type FetchFailure = {
    query: LogoQuery;
    reason: string;
};
export type FetchReport = {
    ok: ManifestEntry[];
    failed: FetchFailure[];
    manifest: string;
};
type Deps = {
    fetch: typeof fetch;
    log: (line: string) => void;
};
/** 读清单文本。 */
export declare function parseList(text: string): LogoQuery[];
/** 下载清单里的每一项；失败的记下原因，不中断。 */
export declare function runFetch(options: FetchOptions, deps?: Deps): Promise<FetchReport>;
type SyncCliDeps = Deps & {
    now?: () => Date;
    sleep?: (ms: number) => Promise<void>;
    env?: Record<string, string | undefined>;
};
/** 命令行入口；返回退出码。fetch 的 --strict 时有失败就返回 1，默认只汇报。 */
export declare function main(argv: readonly string[], deps?: SyncCliDeps): Promise<number>;
export {};
