// SPDX-License-Identifier: MIT
// 组件卡 ConsensusBlock（design/katana-console/project/components/ConsensusBlock，#1929）：必要条件块。
// 名字沿用「三方表决」，但不是投票：写命令提交前，说清「当前意图是什么、哪些必要条件满足、哪个条件阻止、最终由谁裁决」。
// 任一方 blocked / unknown / timeout / stale 即不可执行；多方同意不等于授权，裁决永远在执行网关与账户服务（卡引的 engineering.md §4.1，待核对）。
// 判定来自各自的权威：件只画调用方给的状态与结论，不合成第四种判断（verdict 由调用方传；countConsensus 只数各方的状态给「n 通过 · n 未过」那一行用）。
// 状态不只靠颜色：每一格有灯（形状随状态变：实心、叉、空心、环）、状态字（stateLabels）和一句话（message）。
// 文案（各方的名字、句子、状态字、结论）一律由调用方传；stateLabels 的英文只是缺省值。结构不皮肤化（卡片说它是核心界面的一部分）。
import { useId, useState, type ReactNode } from 'react'

/** pass 满足；warn 接近（不阻止，但提交前要列出）；blocked 未过；unknown 未返回；timeout 超时；stale 已失效要重检；pending 评估中。 */
export type ConsensusState = 'pass' | 'warn' | 'blocked' | 'unknown' | 'timeout' | 'stale' | 'pending'

export type ConsensusParty = {
  key: string
  /** 点阵小标题（如 GATEWAY）。 */
  label: string
  state: ConsensusState
  /** 一句话（≤ 10 字为宜：可用 ✓ 整手 ✓ / 集中度 58 / 60）。 */
  message: string
  /** 点开才看的详情（限额值、规则 id、预检原因）；有就整格是按钮。 */
  detail?: ReactNode
}

/** ok 可提交；warn 可提交但确认框要列出警告；blocked 不可提交。 */
export type ConsensusVerdict = 'ok' | 'warn' | 'blocked'

export type ConsensusBlockProps = {
  /** 整块的读屏名。 */
  label: string
  /** 当前意图（如「下单 · 账户 A · 买 300750 × 2,000」）。 */
  intent?: ReactNode
  parties: readonly ConsensusParty[]
  verdict: ConsensusVerdict
  /** 结论的字（如「可提交」「不可提交」）。 */
  verdictText: string
  /** 结论行左边的计数那句（如「2 通过 · 1 接近」），用 countConsensus 的结果拼。 */
  summary?: ReactNode
  /** 参数 hash；还没就绪传 null，显示「—」。 */
  hash?: string | null
  /** 点 hash（复制）；给了 hash 才是按钮。 */
  onHashClick?: () => void
  /** 各状态的字，缺省是英文。 */
  stateLabels?: Partial<Record<ConsensusState, string>>
  className?: string
}

const DEFAULT_LABELS: Record<ConsensusState, string> = {
  pass: 'Pass',
  warn: 'Near limit',
  blocked: 'Blocked',
  unknown: 'No reply',
  timeout: 'Timed out',
  stale: 'Re-check',
  pending: 'Checking',
}

/** 各状态的个数：pass、warn（接近）、blocked（未过）、open（未返回、超时、失效、评估中，都不是「过」）。纯函数。 */
export function countConsensus(parties: readonly ConsensusParty[]): {
  pass: number
  warn: number
  blocked: number
  open: number
} {
  const count = { pass: 0, warn: 0, blocked: 0, open: 0 }
  for (const { state } of parties) {
    if (state === 'pass') count.pass += 1
    else if (state === 'warn') count.warn += 1
    else if (state === 'blocked') count.blocked += 1
    else count.open += 1
  }
  return count
}

export function ConsensusBlock({
  label,
  intent,
  parties,
  verdict,
  verdictText,
  summary,
  hash,
  onHashClick,
  stateLabels,
  className,
}: ConsensusBlockProps) {
  const id = useId()
  const [open, setOpen] = useState<string | null>(null)
  const labels = { ...DEFAULT_LABELS, ...stateLabels }
  const expanded = parties.find((party) => party.key === open && party.detail)
  return (
    <div className={`k-consensus${className ? ` ${className}` : ''}`}>
      {intent ? <div className="k-consensus-intent">{intent}</div> : null}
      <div className="k-consensus-shell" role="group" aria-label={label}>
        {parties.map((party) => {
          const body = (
            <>
              <span className="k-consensus-tag">{party.label}</span>
              <span className="k-consensus-state">
                <i className="k-consensus-lamp" aria-hidden="true" />
                {labels[party.state]}
              </span>
              <span className="k-consensus-msg">{party.message}</span>
            </>
          )
          return party.detail ? (
            <button
              type="button"
              key={party.key}
              className="k-consensus-party"
              data-state={party.state}
              aria-expanded={open === party.key}
              aria-controls={`${id}-detail`}
              onClick={() => setOpen(open === party.key ? null : party.key)}
            >
              {body}
            </button>
          ) : (
            <div key={party.key} className="k-consensus-party" data-state={party.state}>
              {body}
            </div>
          )
        })}
      </div>
      {expanded ? (
        <div className="k-consensus-detail" id={`${id}-detail`} role="region" aria-label={expanded.label}>
          {expanded.detail}
        </div>
      ) : null}
      <div className="k-consensus-verdict-row">
        <span className="k-consensus-summary">
          {summary ? <>{summary} · </> : null}
          <b className="k-consensus-verdict" data-verdict={verdict} role="status">
            {verdictText}
          </b>
        </span>
        {hash && onHashClick ? (
          <button type="button" className="k-consensus-hash" onClick={onHashClick}>
            {hash}
          </button>
        ) : (
          <span className="k-consensus-hash">{hash ?? '—'}</span>
        )}
      </div>
    </div>
  )
}
