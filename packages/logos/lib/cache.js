export class LogoCache {
    #status = new Map();
    #urls = new Map();
    #pending = new Map();
    status(key) {
        return this.#status.get(key);
    }
    /** 候选的地址：字符串原样；载入函数要先 load 过才有。 */
    url(candidate) {
        return typeof candidate.source === 'string' ? candidate.source : this.#urls.get(candidate.key);
    }
    /** 载入一个候选的地址；同一个键只载入一次，失败记进失败缓存。 */
    load(candidate) {
        const ready = this.url(candidate);
        if (ready !== undefined)
            return Promise.resolve(ready);
        if (this.status(candidate.key) === 'failed')
            return Promise.reject(new Error(`logo failed: ${candidate.key}`));
        let pending = this.#pending.get(candidate.key);
        if (!pending) {
            const source = candidate.source;
            pending = source().then((url) => {
                this.#urls.set(candidate.key, url);
                this.#pending.delete(candidate.key);
                return url;
            }, (error) => {
                this.markFailed(candidate.key);
                this.#pending.delete(candidate.key);
                throw error;
            });
            this.#pending.set(candidate.key, pending);
        }
        return pending;
    }
    markOk(key) {
        this.#status.set(key, 'ok');
    }
    markFailed(key) {
        this.#status.set(key, 'failed');
    }
    /** 该试哪个：先用加载成功过的，再按序取第一个没失败的；都失败了返回 undefined（退回字母）。 */
    pick(candidates) {
        return (candidates.find((c) => this.status(c.key) === 'ok') ?? candidates.find((c) => this.status(c.key) !== 'failed'));
    }
    clear() {
        this.#status.clear();
        this.#urls.clear();
        this.#pending.clear();
    }
}
/** SVG 文本 → data URL（img 能直接用，不另起请求）。 */
export function svgDataUrl(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
