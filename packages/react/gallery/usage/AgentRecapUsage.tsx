// SPDX-License-Identifier: MIT
import { AgentRecap, type RecapEvent } from '../../src/index'

// 示例数据：昨夜 23:00 到今早 07:00 后台 Agent 做的事（时间是 UTC 毫秒，按上海时区写钟点），条目是手写的演示值。
const SINCE = Date.UTC(2026, 10, 22, 15, 0)
const at = (hours: number) => SINCE + hours * 3_600_000
const EVENTS: readonly RecapEvent[] = [
  { id: 'e1', time: at(0.5), kind: 'done', title: '日 K 回补完成', detail: '沪深两市', count: '5,102 只' },
  { id: 'e2', time: at(1.6), kind: 'failed', title: '新闻源抓取失败', detail: '新浪滚动 · 限流 456' },
  { id: 'e3', time: at(2.4), kind: 'done', title: '因子重算完成', detail: '动量、反转、换手', count: '3 组' },
  { id: 'e4', time: at(3.1), kind: 'needs', title: '调仓建议待批', detail: '组合 A · 减仓 2 只', count: '2 笔' },
  { id: 'e5', time: at(4.8), kind: 'needs', title: '数据缺口要确认', detail: '600519 缺 3 天日 K', action: '去看' },
  { id: 'e6', time: at(6.2), kind: 'done', title: '周报草稿写好', detail: '第 47 周' },
  { id: 'e7', time: at(7.5), kind: 'done', title: '盘前快照就绪' },
]
const clock = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' })

export function AgentRecapUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 900 }} data-gallery-rc="main">
      <AgentRecap
        title="你不在时（示例）"
        events={EVENTS}
        since={SINCE}
        until={at(8)}
        limit={2}
        onAction={() => new Promise((resolve) => setTimeout(resolve, 600))}
        onUndo={() => {}}
        onRedo={() => {}}
        formatTime={(time) => clock.format(time)}
        labels={{
          lanes: { needs: '要你拍板', failed: '失败', done: '做完' },
          empty: { needs: '没有要你的', failed: '没有失败', done: '还没有做完的' },
          tag: { needs: '要你', failed: '失败', done: '完成' },
          action: { needs: '批准', failed: '重试' },
          review: '查看',
          undo: '撤销',
          redo: '重做',
          working: '处理中',
          acted: '已处理',
          undone: '已撤销',
          more: (count) => `还有 ${count} 件`,
          named: (verb, title) => `${verb}：${title}`,
          announce: (verb, title) => `${title}：已${verb}`,
        }}
      />
    </div>
  )
}
