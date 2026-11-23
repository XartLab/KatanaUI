// SPDX-License-Identifier: MIT
import { FallbackChain, RateLimitPlanner } from '../../src/blocks'
import { FallbackChainUsage } from '../usage/FallbackChainUsage.tsx'
import { PlanVsActualUsage } from '../usage/PlanVsActualUsage.tsx'
import { RateLimitPlannerUsage } from '../usage/RateLimitPlannerUsage.tsx'
import { TraceWaterfallUsage } from '../usage/TraceWaterfallUsage.tsx'
import { Row } from './parts.tsx'

// 参照 affectUI 补的数据处理与 Agent 件（KATANAview #1908 第二、三批）的文档站演示。数据全是示例：手写的演示值，不是任何数据源的真实耗时与限额。

const FALLBACK_LABELS = {
  status: { waiting: '等待', trying: '在试', failed: '失败', answered: '答上', skipped: '不需要' },
  sources: '数据源，按回落顺序',
  pending: '等待响应',
  answered: (attempt: { name: string }, level: number) => `第 ${level} 级 ${attempt.name} 答上`,
  exhausted: '全部失败',
  summary: (o: { tried: number; failed: number }) => `试了 ${o.tried} 级 · ${o.failed} 失败`,
  retry: '重试',
} as const

export function TraceWaterfallDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：一次日 K 取数。Tab 进树后 ↑↓ 上下、→ 展开或进子、← 收起或回父；Enter
        打开这一步的详情。跑完的叶子里最慢的一步标「最慢」。
      </p>
      <Row name="一次重试后成功">
        <TraceWaterfallUsage />
      </Row>
    </>
  )
}

export function FallbackChainDemo() {
  return (
    <>
      <p className="gal-note">示例数据：腾讯两个入口失败，第 3 级新浪答上，东财没用上。</p>
      <Row name="第 3 级答上">
        <FallbackChainUsage />
      </Row>
      <Row name="正在试第 2 级">
        <div className="gal-wide" style={{ maxWidth: 640 }}>
          <FallbackChain
            title="回落链（示例）"
            request="BTCUSDT 1m K 线"
            attempts={[
              { id: 'bn', name: '币安', status: 'failed', took: 120, reason: 'weight 超限 · 429' },
              { id: 'okx', name: 'OKX', status: 'trying' },
              { id: 'bybit', name: 'Bybit', status: 'waiting' },
            ]}
            formatMs={(ms) => `${ms} ms`}
            labels={FALLBACK_LABELS}
          />
        </div>
      </Row>
      <Row name="全部失败">
        <div className="gal-wide" style={{ maxWidth: 640 }}>
          <FallbackChain
            title="回落链（示例）"
            request="000001.SZ 分时"
            attempts={[
              { id: 'tx', name: '腾讯', status: 'failed', took: 300, reason: '超时' },
              { id: 'sina', name: '新浪', status: 'failed', took: 15, reason: '限流 · 456' },
            ]}
            formatMs={(ms) => `${ms} ms`}
            onRetry={() => {}}
            labels={FALLBACK_LABELS}
          />
        </div>
      </Row>
    </>
  )
}

export function RateLimitPlannerDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：收盘后回补、新闻、因子取数挤在一起，峰值超限。拖条（15 分对齐），或聚焦后 ←→ 挪 15 分、Shift
        挪一小时、Home / End 到最早 / 最晚、Delete 删掉；「错开」自动压峰。now 是 10:00，开盘前快照已开始，不能挪。
      </p>
      <Row name="收盘后挤峰">
        <RateLimitPlannerUsage />
      </Row>
      <Row name="只读">
        <div className="gal-wide" style={{ maxWidth: 880 }}>
          <RateLimitPlanner
            title="数据源排程（示例）"
            runs={[
              { id: 'a', name: '日 K 回补', start: 960, duration: 90, rate: 500 },
              { id: 'b', name: '新闻轮询', start: 1080, duration: 60, rate: 300 },
            ]}
            limit={1000}
            buffer={0.8}
            formatTime={(m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`}
            formatRate={(rate) => `${rate} / 分`}
            labels={{
              status: { ok: '在限额内', near: '接近上限', over: '超过限额' },
              peak: (peak, at) => `峰值 ${peak} · ${at}`,
              limit: '限额',
              buffer: '预警线',
              runs: '抓取任务',
              run: (_run, start, end, rate) => `${start} → ${end} · ${rate}`,
              locked: '已开始',
              remove: '删除',
              spread: '错开',
              moved: (run, start, peak) => `${run.name} 挪到 ${start}，峰值 ${peak}`,
              empty: '没有抓取任务',
            }}
          />
        </div>
      </Row>
    </>
  )
}

export function PlanVsActualDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：第 16 分钟时的一份周报计划。取数超时 4
        分钟完成，清洗正在做且已超过计划时长，后两步按推算位置画虚框，推算完成比计划晚。
      </p>
      <Row name="做到一半">
        <PlanVsActualUsage />
      </Row>
    </>
  )
}
