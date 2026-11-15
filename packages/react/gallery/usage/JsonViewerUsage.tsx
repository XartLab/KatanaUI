// SPDX-License-Identifier: MIT
import { JsonViewer, type JsonViewerLabels } from '../../src/index'

const JSON_LABELS: JsonViewerLabels = {
  search: '在 JSON 里查找',
  matches: (count) => (count === 0 ? '没有命中' : `${count} 处命中`),
  more: (count) => `还有 ${count} 项`,
}

// 演示用的消息：照 EventTimeline 卡的场景（300750、账户 A）编的，不是真实的行情或订单。

const JSON_SAMPLE = {
  type: 'order.update',
  symbol: '300750',
  filled: true,
  price: 201.35,
  tags: ['账户 A', '盘中'],
  orders: [
    { id: 'FILL-0231', side: 'buy', price: 201.3, qty: 200 },
    { id: 'FILL-0240', side: 'sell', price: 203.1, qty: 400 },
  ],
  error: null,
  history: Array.from({ length: 5 }, (_, i) => i * 10),
}

export function JsonViewerUsage() {
  return (
    <>
      <div className="gal-json" style={{ width: 360 }}>
        <JsonViewer label="消息" value={JSON_SAMPLE} labels={JSON_LABELS} />
      </div>

      <div className="gal-json" style={{ width: 360 }}>
        <JsonViewer
          label="长数组"
          value={{ rows: Array.from({ length: 12 }, (_, i) => ({ n: i })) }}
          labels={JSON_LABELS}
          defaultExpandDepth={2}
          maxChildren={4}
        />
      </div>
    </>
  )
}

// 演示事件：照卡里的场景（A 股 300750、账户 A / B、run 2e52），时刻与内容都是编的演示数据，不是真实的公告、告警或成交。
// 显示时区 Asia/Shanghai；A 股交易时段 09:30–11:30、13:00–15:00（午休压成短带）。
