import { type ReactNode } from 'react';
import { LogoCache } from './cache.ts';
import { type DomainMap, type LogoProvider as LogoSourceProvider, type LogoQuery } from './resolve.ts';
export type LogoProviderProps = {
    /** 来源，按序尝试：如 `[web3icons(), selfHosted({ baseUrl: '/logos' })]`。 */
    providers: readonly LogoSourceProvider[];
    /** 共用的缓存；不给就每个 LogoProvider 自带一份（跟它活得一样长）。 */
    cache?: LogoCache;
    /** 代码 → 官网域名（「代码.场所」作键），按域名取标的来源用。 */
    domainMap?: DomainMap;
    children?: ReactNode;
};
export declare function LogoProvider({ providers, cache, domainMap, children }: LogoProviderProps): import("react").JSX.Element;
export type UseLogoResult = {
    /** 当前该显示的地址；没有（没 Provider、没候选、都失败、还在载入）就是 undefined。 */
    src: string | undefined;
    /** 'none'：没有候选或都失败了；'loading'：载入函数还没回来；'ready'：src 可用。 */
    status: 'none' | 'loading' | 'ready';
    /** 接到 img 的 onError：记失败、换下一个候选。 */
    onError: () => void;
    /** 接到 img 的 onLoad：记成功，下次同一个品种直接用它。 */
    onLoad: () => void;
};
/** 有没有包在 LogoProvider 里。 */
export declare function useHasLogoProvider(): boolean;
/** 给一个品种挑徽标地址。query 为 undefined 时不解析（调用方自己有图时传 undefined）。 */
export declare function useLogo(query: LogoQuery | undefined): UseLogoResult;
