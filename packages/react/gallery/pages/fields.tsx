// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  DateTimeInput,
  Loading,
  NumberInput,
  Skeleton,
  type DateTimeLabels,
  type LoadingLabels,
} from '../../src/index.ts'
import { Row } from './parts.tsx'

// 数字框、日期时间框与加载骨架的演示（#1860 从 src/ui 搬进包）。这几件的文字都是调用方给的，这里给一份演示用的中文。

export function NumberInputDemo() {
  const [size, setSize] = useState(14)
  const [price, setPrice] = useState(0.5)
  const [auto, setAuto] = useState(0)
  const [qty, setQty] = useState(100)
  return (
    <>
      <Row name="默认">
        <NumberInput label="线宽" value={size} onValueChange={setSize} min={1} max={40} unit="px" />
        <output data-gallery-number>{size}</output>
      </Row>
      <Row name="sm · 小数">
        <NumberInput
          label="步长"
          value={price}
          onValueChange={setPrice}
          min={0}
          max={10}
          step={0.1}
          size="sm"
          width={80}
        />
      </Row>
      <Row name="自动">
        <NumberInput
          label="根数"
          value={auto}
          onValueChange={setAuto}
          min={0}
          max={500}
          autoValue={0}
          autoText="自动"
        />
      </Row>
      <Row name="标签 · 算式">
        <NumberInput
          label="数量"
          caption="数量"
          value={qty}
          onValueChange={setQty}
          min={0}
          max={100000}
          step={10}
          width={140}
          expression
        />
        <output data-gallery-qty>{qty}</output>
      </Row>
      <Row name="禁用 · 非法">
        <NumberInput label="禁用" value={3} onValueChange={() => {}} disabled />
        <NumberInput label="非法" value={3} onValueChange={() => {}} invalid />
      </Row>
      <p className="gal-note">
        打字、↑↓、按住左右拖（Shift 粗调、Alt 精调）都能改值；越界夹进范围。「标签 · 算式」那个框还能写
        +10%、*2、/4、100*1.5，回车算。
      </p>
    </>
  )
}

const DATE_LABELS: DateTimeLabels = {
  date: (label) => `${label}的日期`,
  pickDate: (label) => `选${label}的日期`,
  calendar: (label) => `${label}的日历`,
  time: (label) => `${label}的时刻`,
  previousMonth: '上个月',
  nextMonth: '下个月',
}

export function DateTimeInputDemo() {
  const [date, setDate] = useState('2026-11-14')
  const [time, setTime] = useState('09:30')
  const [second, setSecond] = useState('09:30:15')
  return (
    <>
      <Row name="日期 + 时刻">
        <DateTimeInput
          label="起点"
          labels={DATE_LABELS}
          locale="zh-CN"
          date={date}
          onDate={setDate}
          time={time}
          onTime={setTime}
        />
        <output data-gallery-datetime>{`${date} ${time}`}</output>
      </Row>
      <Row name="只有日期 · sm">
        <DateTimeInput label="截止" labels={DATE_LABELS} locale="zh-CN" size="sm" date={date} onDate={setDate} />
      </Row>
      <Row name="带秒 · 限范围">
        <DateTimeInput
          label="成交"
          labels={DATE_LABELS}
          locale="zh-CN"
          date={date}
          onDate={setDate}
          time={second}
          onTime={setSecond}
          seconds
          min="2026-11-01"
          max="2026-11-30"
        />
      </Row>
    </>
  )
}

const LABELS: LoadingLabels = {
  skeleton: '正在载入',
  content: '内容',
  noResponse: '没有回应',
  loadingLed: '加载中',
  retry: '重试',
  loading: (name, source) => (source ? `加载 ${name} · ${source}` : `加载 ${name}`),
  slow: (source) => (source ? `仍在加载 · ${source}` : '仍在加载'),
  timeout: (source) => (source ? `点重试 · ${source} 10 秒无回应` : '点重试 · 10 秒无回应'),
}

export function SkeletonDemo() {
  return (
    <>
      <Row name="三行">
        <div className="gal-wide">
          <Skeleton label="正在载入" lines={3} />
        </div>
      </Row>
      <Row name="一行">
        <div className="gal-wide">
          <Skeleton label="正在载入" lines={1} />
        </div>
      </Row>
      <p className="gal-note">
        骨架本身：点阵圆角条，第一行 40%、最后一行 70%、中间满宽；不脉冲、不转圈。什么时候出、出多久由 Loading 管。
      </p>
    </>
  )
}

export function LoadingDemo() {
  const [pending, setPending] = useState(true)
  return (
    <>
      <Row name="loading">
        <div className="gal-wide">
          <Loading phase="loading" labels={LABELS} what="涨停池" source="本机服务" />
        </div>
      </Row>
      <Row name="slow">
        <div className="gal-wide">
          <Loading phase="slow" labels={LABELS} source="本机服务" />
        </div>
      </Row>
      <Row name="timeout">
        <div className="gal-wide">
          <Loading phase="timeout" labels={LABELS} source="本机服务" onRetry={() => {}} />
        </div>
      </Row>
      <Row name="等数据">
        <button type="button" onClick={() => setPending((p) => !p)} data-gallery-toggle>
          {pending ? '数据到了' : '重新等'}
        </button>
        <div className="gal-wide">
          <Loading labels={LABELS} pending={pending} what="演示数据">
            <p data-gallery-loaded>数据到了。</p>
          </Loading>
        </div>
      </Row>
      <p className="gal-note">
        一个入口三种用法：给 pending 等数据；不给 pending 当 Suspense 边界；给 phase 钉在某一段直接画（这里的前三行）。
        等 500ms 才出骨架（之前什么也不画），2s 改说「仍在加载」，10s 转琥珀条加重试；骨架不脉冲、不转圈。
      </p>
    </>
  )
}
