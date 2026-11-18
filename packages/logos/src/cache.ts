// SPDX-License-Identifier: MIT
// 徽标缓存（内存）：载入函数的结果只取一次（并发的请求共用一个 Promise）；加载失败的键记下来，同一个地址不再请求；
// 加载成功的记下来，下次同一个品种直接用它，不从头再试一遍。生命周期跟 LogoProvider 一样长（或调用方自己建一个共用）。
import type { LogoCandidate } from './resolve.ts'

export type LogoStatus = 'ok' | 'failed'

export class LogoCache {
  readonly #status = new Map<string, LogoStatus>()
  readonly #urls = new Map<string, string>()
  readonly #pending = new Map<string, Promise<string>>()

  status(key: string): LogoStatus | undefined {
    return this.#status.get(key)
  }

  /** 候选的地址：字符串原样；载入函数要先 load 过才有。 */
  url(candidate: LogoCandidate): string | undefined {
    return typeof candidate.source === 'string' ? candidate.source : this.#urls.get(candidate.key)
  }

  /** 载入一个候选的地址；同一个键只载入一次，失败记进失败缓存。 */
  load(candidate: LogoCandidate): Promise<string> {
    const ready = this.url(candidate)
    if (ready !== undefined) return Promise.resolve(ready)
    if (this.status(candidate.key) === 'failed') return Promise.reject(new Error(`logo failed: ${candidate.key}`))
    let pending = this.#pending.get(candidate.key)
    if (!pending) {
      const source = candidate.source as () => Promise<string>
      pending = source().then(
        (url) => {
          this.#urls.set(candidate.key, url)
          this.#pending.delete(candidate.key)
          return url
        },
        (error: unknown) => {
          this.markFailed(candidate.key)
          this.#pending.delete(candidate.key)
          throw error
        },
      )
      this.#pending.set(candidate.key, pending)
    }
    return pending
  }

  markOk(key: string): void {
    this.#status.set(key, 'ok')
  }

  markFailed(key: string): void {
    this.#status.set(key, 'failed')
  }

  /** 该试哪个：先用加载成功过的，再按序取第一个没失败的；都失败了返回 undefined（退回字母）。 */
  pick(candidates: readonly LogoCandidate[]): LogoCandidate | undefined {
    return (
      candidates.find((c) => this.status(c.key) === 'ok') ?? candidates.find((c) => this.status(c.key) !== 'failed')
    )
  }

  clear(): void {
    this.#status.clear()
    this.#urls.clear()
    this.#pending.clear()
  }
}

/** SVG 文本 → data URL（img 能直接用，不另起请求）。 */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
