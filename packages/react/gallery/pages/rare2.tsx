// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  Button,
  CodeBlock,
  DurationPicker,
  StepPlayer,
  TaskList,
  ThemeSelector,
  WebSearch,
  WebSearchCitation,
  type DurationValue,
  type Task,
  type ThemeOption,
  type WebSource,
} from '../../src/index'
import { Row } from './parts'

// #1861 第二批：学 rare-ui 的交互、本仓库重写的件的演示。数据与文字都是演示用的。

export function StepPlayerDemo() {
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(0)
  const labels = {
    play: '播放',
    pause: '暂停',
    replay: '重放',
    group: (at: number, count: number) => `第 ${at + 1} 步，共 ${count} 步`,
    step: (at: number) => `跳到第 ${at + 1} 步`,
  }
  return (
    <>
      <Row name="默认">
        <div data-gallery-player>
          <StepPlayer
            steps={3}
            duration={700}
            labels={labels}
            onValueChange={setIndex}
            onComplete={() => setDone((n) => n + 1)}
          />
        </div>
        <output data-gallery-step>
          第 {index + 1} 步 · 放完 {done} 次
        </output>
      </Row>
      <Row name="可跳 · 循环">
        <div data-gallery-seek>
          <StepPlayer
            steps={[{ duration: 600 }, { duration: 1200, label: '第二段' }, { duration: 600 }]}
            labels={labels}
            seekable
            loop
            size={40}
          />
        </div>
      </Row>
      <p className="gal-note">
        点播放：当前步的填充随时间走，走完去下一步；放完图标变重放；可跳的那条点圆点直接去那一步。
      </p>
    </>
  )
}

// 缩略用的调色板：照两个主题的 token（design/tokens.json）取的值，演示用；应用里由设置页按当前主题的 token 传。
const THEMES: readonly ThemeOption[] = [
  {
    value: 'console',
    label: '控制台',
    colors: {
      rail: 'var(--demo-console-rail)',
      panel: 'var(--demo-console-panel)',
      line: 'var(--demo-console-line)',
      strong: 'var(--demo-console-strong)',
      muted: 'var(--demo-console-muted)',
      tile: 'var(--demo-console-tile)',
    },
  },
  {
    value: 'graphite',
    label: '石墨',
    colors: {
      rail: 'var(--demo-graphite-rail)',
      panel: 'var(--demo-graphite-panel)',
      line: 'var(--demo-graphite-line)',
      strong: 'var(--demo-graphite-strong)',
      muted: 'var(--demo-graphite-muted)',
      tile: 'var(--demo-graphite-tile)',
    },
  },
]

export function ThemeSelectorDemo() {
  const [theme, setTheme] = useState('console')
  return (
    <>
      <Row name="两个主题">
        <div data-gallery-themes>
          <ThemeSelector themes={THEMES} label="主题" value={theme} onChange={setTheme} />
        </div>
        <output data-gallery-theme>{theme}</output>
      </Row>
      <Row name="只有缩略">
        <ThemeSelector themes={THEMES} label="主题（无名字）" defaultValue="graphite" showLabels={false} />
      </Row>
      <Row name="禁用">
        <ThemeSelector themes={THEMES} label="主题（禁用）" defaultValue="console" disabled />
      </Row>
      <p className="gal-note">
        点缩略或用方向键换主题，环用弹簧滑过去；tab 只停在选中那张。缩略颜色由调用方传，这里不会真的换页面主题。
      </p>
    </>
  )
}

const SAMPLE_TS = `
// 取最近 N 根的均价
import { sma } from './studies'

export function lastMean(bars: Bar[], n = 20): number {
  const closes = bars.slice(-n).map((bar) => bar.close)
  if (closes.length === 0) return 0 // 没有柱
  return sma(closes, closes.length).at(-1) ?? 0
}
`
const SAMPLE_JSON = `{
  "name": "momentum",
  "window": 20,
  "enabled": true,
  "tags": ["agent", "demo"]
}`
const SAMPLE_SH = `# 起开发服务器
pnpm dev:all --port 5173
echo "done" && exit 0`

export function CodeBlockDemo() {
  return (
    <>
      <Row name="TypeScript · 高亮第 4 行">
        <div className="gal-wide" data-gallery-code>
          <CodeBlock
            code={SAMPLE_TS}
            language="ts"
            filename="last-mean.ts"
            highlightLines={[4]}
            copyLabel="复制代码"
            copiedLabel="已复制"
          />
        </div>
      </Row>
      <Row name="JSON · 蓝色强调">
        <div className="gal-wide">
          <CodeBlock
            code={SAMPLE_JSON}
            language="json"
            accent="var(--signal-blue)"
            copyLabel="复制 JSON"
            copiedLabel="已复制 JSON"
          />
        </div>
      </Row>
      <Row name="没有头 · 没有行号">
        <div className="gal-wide">
          <CodeBlock
            code={SAMPLE_SH}
            language="sh"
            showHeader={false}
            showLineNumbers={false}
            copyLabel="复制命令"
            copiedLabel="已复制命令"
          />
        </div>
      </Row>
      <p className="gal-note">
        配色只从一个强调色混出来：关键字取强调色，字符串、数字、函数是它与正文色的不同比例，注释灰；两个主题自动跟着换。
      </p>
    </>
  )
}

const SOURCES: readonly WebSource[] = [
  {
    id: 'a',
    site: 'Reuters',
    title: '央行下调存款准备金率 0.5 个百分点',
    snippet: '释放长期资金约 1 万亿元，用于支持实体经济。',
  },
  { id: 'b', site: 'Bloomberg', title: '科技股领涨，成交额连续三日放大', snippet: '半导体板块单日涨幅居前。' },
  { id: 'c', site: 'FT', title: '外资连续五周净流入 A 股' },
  { id: 'd', site: '财新', title: '三季度社融数据低于预期', snippet: '企业中长期贷款回升，居民端仍弱。' },
  { id: 'e', site: 'WSJ', title: '美债收益率回落，美元走弱' },
  { id: 'f', site: '新华社', title: '国务院常务会议部署稳增长措施' },
]

export function WebSearchDemo() {
  const [count, setCount] = useState<number>(SOURCES.length)
  const [searching, setSearching] = useState(false)
  const shown = SOURCES.slice(0, count)
  const label = searching ? `检索中，已有 ${count} 条` : `已检索 ${count} 个站点`
  return (
    <>
      <Row name="来源区">
        <div className="gal-wide" data-gallery-search>
          <WebSearch
            sources={shown}
            status={searching ? 'searching' : 'done'}
            label={label}
            moreLabel={(n) => `还有 ${n} 条`}
            lessLabel="收起"
          />
        </div>
      </Row>
      <Row>
        <Button
          onClick={() => {
            setSearching(true)
            setCount(0)
          }}
        >
          开始检索
        </Button>
        <Button onClick={() => setCount((n) => Math.min(SOURCES.length, n + 1))}>来一条结果</Button>
        <Button onClick={() => setSearching(false)}>检索完成</Button>
      </Row>
      <Row name="行内引用">
        <p data-gallery-citation style={{ margin: 0, maxWidth: 480, lineHeight: '26px' }}>
          央行宣布降准释放约 1 万亿元长期资金
          <WebSearchCitation source={SOURCES[0]!} index={1} />
          ，随后科技股放量上涨
          <WebSearchCitation source={SOURCES[1]!} index={2} />。
        </p>
      </Row>
      <p className="gal-note">
        检索中进度环每来一条补上剩下的 30%，没到的位置画空骨架；第四条起最后一格是「还有 N 条」。引用悬停停一会儿或 Tab
        聚焦就弹出预览。
      </p>
    </>
  )
}

const TASKS: readonly Task[] = [
  { id: 't1', label: '读最近 20 根日线' },
  { id: 't2', label: '算均线与量比，对照上一周的结果，写进分析组件的表里' },
  { id: 't3', label: '给出带来源的建议' },
  { id: 't4', label: '等人确认', done: true },
]

export function TaskListDemo() {
  const [tasks, setTasks] = useState<Task[]>([...TASKS])
  return (
    <>
      <Row name="清单">
        <div data-gallery-tasks className="gal-wide">
          <TaskList
            tasks={tasks}
            onTasksChange={setTasks}
            label="计划"
            labels={{ completed: (label) => `${label} 已完成`, reopened: (label) => `${label} 已重开` }}
          />
        </div>
        <output data-gallery-done>已完成 {tasks.filter((task) => task.done).length} 项</output>
      </Row>
      <p className="gal-note">点一行：圆圈填色、对勾画出来、文字划掉，划完这一行沉到底部；再点一次回到原位。</p>
    </>
  )
}

export function DurationPickerDemo() {
  const [confirmed, setConfirmed] = useState<DurationValue | null>(null)
  const [editing, setEditing] = useState(false)
  const labels = {
    hours: '时',
    minutes: '分',
    edit: '编辑时长',
    save: '确认时长',
    hoursInput: '小时',
    minutesInput: '分钟',
  }
  return (
    <>
      <Row name="默认">
        <div data-gallery-duration>
          <DurationPicker
            defaultValue={{ hours: 2, minutes: 30 }}
            labels={labels}
            onConfirm={setConfirmed}
            onEditingChange={setEditing}
          />
        </div>
        <output data-gallery-confirmed>
          {editing ? '编辑中' : confirmed ? `确认 ${confirmed.hours} 时 ${confirmed.minutes} 分` : '未确认'}
        </output>
      </Row>
      <Row name="上限 4 时 · 禁用">
        <DurationPicker defaultValue={{ hours: 1, minutes: 0 }} maxHours={4} labels={labels} disabled />
      </Row>
      <p className="gal-note">
        点笔进入编辑：三段用弹簧分开，数字可输入；超上限夹住并抖一下；Enter 确认、Esc 放弃、上下键加减。
      </p>
    </>
  )
}
