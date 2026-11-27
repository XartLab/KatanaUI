// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RootCauseTree, type CauseFailure } from '../../src/blocks'

// 示例数据：一次 data-check 报日 K 缺口的排查；代码、日志与路径都是演示写的。
const FAILURE: CauseFailure = {
  id: 'gap',
  title: '000001.SZ 日 K 缺 3 根（示例）',
  detail: '2026-11-18 → 11-20',
  children: [
    {
      id: 'empty',
      title: '数据源当天返回空',
      status: 'ruledOut',
      verdict: '腾讯、新浪两个源都有这三天的数据。',
      evidence: { kind: '请求', content: 'GET /kline?code=sz000001&start=20261118\n→ 200 · 3 行' },
      files: ['tencent', 'sina'],
    },
    {
      id: 'calendar',
      title: '交易日历把这三天算成休市',
      status: 'ruledOut',
      verdict: '交易日历里这三天是交易日。',
      evidence: {
        kind: '查询',
        content: "SELECT * FROM calendar WHERE date BETWEEN '2026-11-18' AND '2026-11-20'\n→ 3 行 · is_open = 1",
      },
    },
    {
      id: 'backfill',
      title: '回补任务没有跑',
      status: 'confirmed',
      gate: 'and',
      verdict: '11-18 起回补任务每次都提前退出。',
      children: [
        {
          id: 'limited',
          title: '回补撞上新浪限流被跳过',
          status: 'confirmed',
          verdict: '回补与新闻轮询挤在 15:05，新浪返回 456，任务按「源不可用」跳过当天。',
          evidence: {
            kind: '日志',
            content:
              '15:05:02 backfill sina 000001.SZ → 456 Too Many Requests\n15:05:02 backfill skip day=2026-11-18 reason=source_unavailable',
          },
          files: ['backfill/schedule.ts', 'adapters/sina.ts'],
          at: Date.UTC(2026, 10, 21, 2, 14),
        },
        { id: 'retry', title: '重试次数用完后没有改走别的源', status: 'checking', files: ['backfill/fallback.ts'] },
      ],
    },
    { id: 'parse', title: '解析时把停牌日当成脏数据删掉', status: 'open' },
  ],
}

export function RootCauseTreeUsage() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div className="gal-wide" style={{ maxWidth: 880 }} data-gallery-rct="main">
      <RootCauseTree
        failure={FAILURE}
        title="数据缺口排查"
        label="示例：排查树"
        defaultOpenId="limited"
        onAction={(cause, action) => setLast(`${action === 'fix' ? '修复' : '重跑'}：${cause.title}`)}
        formatTime={(at) => `检查于 ${new Date(at).toISOString().slice(0, 16).replace('T', ' ')} UTC`}
        labels={{
          status: { open: '待查', checking: '在查', ruledOut: '已排除', confirmed: '已确认' },
          gate: { or: '任一', and: '同时' },
          rootCause: '根因',
          counts: (c) => `已排除 ${c.ruledOut} · 已确认 ${c.confirmed} · 在查 ${c.checking} · 待查 ${c.open}`,
          evidence: '证据',
          pick: '选一行看证据',
          noEvidence: '还没有证据',
          fix: '修复',
          retry: '从这里重跑',
        }}
      />
      {last !== null && <p className="gal-note">最后一次动作（示例，不真的执行）：{last}</p>}
    </div>
  )
}
