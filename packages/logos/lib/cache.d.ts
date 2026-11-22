import type { LogoCandidate } from './resolve.ts';
export type LogoStatus = 'ok' | 'failed';
export declare class LogoCache {
    #private;
    status(key: string): LogoStatus | undefined;
    /** 候选的地址：字符串原样；载入函数要先 load 过才有。 */
    url(candidate: LogoCandidate): string | undefined;
    /** 载入一个候选的地址；同一个键只载入一次，失败记进失败缓存。 */
    load(candidate: LogoCandidate): Promise<string>;
    markOk(key: string): void;
    markFailed(key: string): void;
    /** 该试哪个：先用加载成功过的，再按序取第一个没失败的；都失败了返回 undefined（退回字母）。 */
    pick(candidates: readonly LogoCandidate[]): LogoCandidate | undefined;
    clear(): void;
}
/** SVG 文本 → data URL（img 能直接用，不另起请求）。 */
export declare function svgDataUrl(svg: string): string;
