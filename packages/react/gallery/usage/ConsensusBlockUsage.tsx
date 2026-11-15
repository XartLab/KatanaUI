// SPDX-License-Identifier: MIT
import { ConsensusBlock, countConsensus, type ConsensusParty } from '../../src/quant'

const stateText = {
  pass: '通过',
  warn: '接近',
  blocked: '未过',
  unknown: '未返回',
  timeout: '超时',
  stale: '需重检',
  pending: '评估中',
}

const orderParties: readonly ConsensusParty[] = [
  { key: 'gw', label: 'GATEWAY', state: 'pass', message: '可用 ✓ 整手 ✓' },
  {
    key: 'acct',
    label: 'ACCOUNT',
    state: 'warn',
    message: '集中度 58 / 60',
    detail: '单票集中度上限 60%，当前 58%；再买 2,000 股会到 61%（示例）。',
  },
  { key: 'rules', label: 'RULES', state: 'pass', message: '无规则命中' },
]

const promoteParties: readonly ConsensusParty[] = [
  { key: 'gates', label: 'GATES', state: 'blocked', message: '偏离门未过 19.4%', detail: '偏离门要求 ≤ 15%（示例）。' },
  { key: 'cap', label: 'CAPACITY', state: 'pass', message: '0.9 / 5 亿' },
  { key: 'acct', label: 'ACCOUNT', state: 'unknown', message: '未指定' },
]

const countText = (parties: readonly ConsensusParty[]) => {
  const n = countConsensus(parties)
  return `${n.pass} 通过 · ${n.warn} 接近 · ${n.blocked} 未过 · ${n.open} 未填`
}

export function ConsensusBlockUsage() {
  return (
    <>
      <div style={{ width: 340 }} data-testid="consensus-ok">
        <ConsensusBlock
          label="下单必要条件"
          intent="下单 · 账户 A · 买 300750 × 2,000"
          parties={orderParties}
          verdict="warn"
          verdictText="可提交"
          summary={countText(orderParties)}
          hash="7f3a"
          onHashClick={() => {}}
          stateLabels={stateText}
        />
      </div>

      <div style={{ width: 340 }} data-testid="consensus-blocked">
        <ConsensusBlock
          label="推进必要条件"
          intent="推进 · alice-rev → LIVE"
          parties={promoteParties}
          verdict="blocked"
          verdictText="不可推进"
          summary={countText(promoteParties)}
          hash={null}
          stateLabels={stateText}
        />
      </div>

      <div style={{ width: 340 }} data-testid="consensus-stale">
        <ConsensusBlock
          label="重检必要条件"
          parties={[
            { key: 'gw', label: 'GATEWAY', state: 'timeout', message: '超时' },
            { key: 'acct', label: 'ACCOUNT', state: 'stale', message: '需重检' },
            { key: 'rules', label: 'RULES', state: 'pending', message: '评估中' },
          ]}
          verdict="blocked"
          verdictText="不可提交"
          stateLabels={stateText}
        />
      </div>
    </>
  )
}
