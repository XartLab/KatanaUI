// SPDX-License-Identifier: MIT
// 三个交易模式页（#103：下单到确认、持仓监控、连接账户）的演示逻辑：一个假的执行网关、API 信息的解析、强平提醒的挑选。
// 纯函数，页上的演示与单测共用；不连任何交易所，不存任何东西。文件是 .ts，不被 patterns/index.tsx 的 import.meta.glob 当成一页收进去。
import {
  liquidationDistance,
  liquidationRisk,
  type LiquidationRisk,
  type Order,
  type OrderDraft,
  type Position,
} from '../../src/blocks'

/** 网关这一刻的样子（演示里由页上的开关给）：交易锁开着，或者交易所会拒（拒的原因），或者都没有。 */
export type GatewayState = { locked: boolean; reject: string | null }

/** 一张单交给网关后的回答。 */
export type GatewayReply =
  | { kind: 'locked' }
  | { kind: 'rejected'; reason: string }
  | { kind: 'filled'; contracts: number }
  | { kind: 'accepted'; order: Order }

/** 回答里要的、面板给不出的：单号、时刻（演示里由调用方给，单测固定）、品种、价格位数。 */
export type GatewayContext = { id: string; time: number; symbol: string; pricePrecision: number }

/**
 * 假网关：锁先于一切（锁开着时单不出网关，交易所根本收不到）；再看交易所拒不拒；市价单当场成交，不进委托表；限价单回一张挂单，进委托表。
 * 真网关在调用方那边（应用的唯一执行网关），这里只演示回答有几种、各自去哪。
 */
export function submitToGateway(draft: OrderDraft, gateway: GatewayState, context: GatewayContext): GatewayReply {
  if (gateway.locked) return { kind: 'locked' }
  if (gateway.reject !== null) return { kind: 'rejected', reason: gateway.reject }
  if (draft.type === 'market' || draft.price === undefined) return { kind: 'filled', contracts: draft.contracts }
  return {
    kind: 'accepted',
    order: {
      id: context.id,
      symbol: context.symbol,
      side: draft.side,
      type: 'limit',
      price: draft.price,
      quantity: draft.contracts,
      filled: 0,
      status: 'open',
      time: context.time,
      pricePrecision: context.pricePrecision,
    },
  }
}

/** 弹出提示的语气与文字：标题写结果（不写「出错了」），说明写原因或下一步。 */
export type ReplyNotice = { tone: 'ok' | 'warn' | 'danger'; title: string; description: string }

export function replyNotice(reply: GatewayReply, draft: OrderDraft, symbol: string): ReplyNotice {
  const what = `${symbol} ${draft.reduceOnly ? '平仓' : draft.side === 'buy' ? '开多' : '开空'} ${draft.contracts} 张`
  switch (reply.kind) {
    case 'locked':
      return { tone: 'warn', title: '没有发出：交易锁开着', description: `${what}留在面板里，解锁后再点下单。` }
    case 'rejected':
      return { tone: 'danger', title: '下单被拒', description: `${what}：${reply.reason}。面板里填的数都还在。` }
    case 'filled':
      return { tone: 'ok', title: '市价单已成交', description: `${what}，看持仓表。` }
    case 'accepted':
      return { tone: 'ok', title: '委托已挂出', description: `${what} @ ${reply.order.price}，在下面的委托表里。` }
  }
}

/** 粘贴框里认出来的东西。没认出任何一项时 recognized 是 false，框照旧手填。 */
export type ApiPaste = {
  recognized: boolean
  apiKey?: string
  secretKey?: string
  name?: string
  permissions: readonly string[]
}

// OKX 建好 API 后页面上给的那一段（apikey = "…" secretkey = "…" 备注名 = "…" 权限 = "…"），写法取自 KATANAview 用户文档
// docs/user/getting-started.md「添加 OKX 时可以整段粘贴」（2026-11-23 读）；别家交易所的格式待核对。
const PASTE_FIELD = /(apikey|secretkey|备注名|权限)\s*[=:：]\s*["“]([^"”]*)["”]/gi

/** 从粘贴的一段文字里取出 Key、Secret、备注名与权限；Passphrase 是建 API 时自己设的，交易所不显示，不在这里。 */
export function parseApiPaste(text: string): ApiPaste {
  const found: Partial<Record<'apikey' | 'secretkey' | '备注名' | '权限', string>> = {}
  for (const match of text.matchAll(PASTE_FIELD)) {
    const key = match[1]!.toLowerCase() as keyof typeof found
    found[key] = match[2]!.trim()
  }
  const permissions = (found['权限'] ?? '').split(/[,，/、\s]+/).filter(Boolean)
  return {
    recognized: Object.keys(found).length > 0,
    apiKey: found.apikey || undefined,
    secretKey: found.secretkey || undefined,
    name: found['备注名'] || undefined,
    permissions,
  }
}

/** 这把 API 能干什么：只读、可交易、带提现。连接行上的牌与下单灯都按它画。 */
export type ApiAccess = 'read' | 'trade' | 'withdraw'

export function apiAccess(permissions: readonly string[]): ApiAccess {
  if (permissions.some((item) => /提现|withdraw/i.test(item))) return 'withdraw'
  if (permissions.some((item) => /交易|trade/i.test(item))) return 'trade'
  return 'read'
}

/** 连接表单的三个框。 */
export type ConnectForm = { apiKey: string; secretKey: string; passphrase: string }
export type ConnectField = keyof ConnectForm

/** 先在本机查空框，空的写在那个框旁边；都填了才交给交易所验。 */
export function missingFields(form: ConnectForm): Partial<Record<ConnectField, string>> {
  const errors: Partial<Record<ConnectField, string>> = {}
  if (!form.apiKey.trim()) errors.apiKey = '没填 API Key'
  if (!form.secretKey.trim()) errors.secretKey = '没填 Secret'
  if (!form.passphrase.trim()) errors.passphrase = '没填 Passphrase：建 API 时自己设的那串'
  return errors
}

/** 平仓确认窗里填的数量：大于 0、不超过持有的有限数；别的都是 null（平仓钮变灰）。 */
export function parseCloseQuantity(text: string, held: number): number | null {
  const value = Number(text.trim())
  if (text.trim() === '' || !Number.isFinite(value) || value <= 0 || value > held) return null
  return value
}

/** 按市价平掉 quantity：平满就移走这一行；部分平仓按剩下的比例缩数量、盈亏与保证金（演示用，真数由交易所回报给）。 */
export function closePosition(positions: readonly Position[], id: string, quantity: number): readonly Position[] {
  return positions.flatMap((position) => {
    if (position.id !== id) return [position]
    if (quantity >= position.quantity) return []
    const keep = (position.quantity - quantity) / position.quantity
    return [
      {
        ...position,
        quantity: position.quantity - quantity,
        unrealizedPnl: position.unrealizedPnl * keep,
        margin: position.margin === null ? null : position.margin * keep,
      },
    ]
  })
}

/** 强平提醒要挑的那一个：离强平最近、落在警告或危险档的持仓（越近档越高）；全都安全就没有。 */
export type LiquidationAlert = { position: Position; distance: number; risk: Exclude<LiquidationRisk, 'none' | 'safe'> }

export function nearestLiquidation(positions: readonly Position[], warnPct: number): LiquidationAlert | null {
  let nearest: LiquidationAlert | null = null
  for (const position of positions) {
    const distance = liquidationDistance(position.side, position.markPrice, position.liquidationPrice)
    const risk = liquidationRisk(distance, warnPct)
    if (distance === null || (risk !== 'warn' && risk !== 'danger')) continue
    if (nearest === null || distance < nearest.distance) nearest = { position, distance, risk }
  }
  return nearest
}
