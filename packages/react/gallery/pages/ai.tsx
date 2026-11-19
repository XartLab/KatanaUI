// SPDX-License-Identifier: MIT
import { useState, type CSSProperties } from 'react'
import { LiveToggle } from '../LiveToggle.tsx'
import { useLiveTicker } from '../live-sim.ts'
import {
  AgentAvatar,
  AiApproval,
  AiArtifact,
  AiBranch,
  AiBranchMessages,
  AiBranchNext,
  AiBranchPage,
  AiBranchPrevious,
  AiBranchSelector,
  AiContextMeter,
  AiConversation,
  AiDiff,
  AiMessage,
  AiPromptInput,
  AiReasoning,
  AiResponse,
  AiSuggestions,
  AiTaskList,
  AiToolCall,
  Button,
  MatrixOrb,
  Slider,
  type AiApprovalOption,
  type AiDiffLabels,
  type AiDiffLine,
  type AiResponseCitation,
  type AiState,
  type AiTask,
  type AiToolCallLabels,
  type OrbState,
  type WebSource,
} from '../../src/index'
import { Row } from './parts'

// 交易助手对话的演示数据：全是写死的，不接模型也不联网。数字与新闻都是编的，只为演示件的样子。

const SOURCES: readonly WebSource[] = [
  {
    id: 's1',
    site: '财新',
    title: '贵州茅台批发价连续下行，终端动销偏弱',
    snippet: '53 度飞天散瓶批价较上月回落，渠道库存仍偏高。',
  },
  { id: 's2', site: '上交所', title: '600519 融资净卖出居前', snippet: '融资余额单日减少，北向资金小幅净流出。' },
  { id: 's3', site: '中证网', title: '白酒板块午后走弱，高端酒领跌', snippet: '板块跌幅居前，成交额较昨日放大。' },
]
const CITATIONS: readonly AiResponseCitation[] = SOURCES.map((source, index) => ({ index: index + 1, source }))

const ANSWER =
  '600519 今日下跌约 2.3%，主要有三方面原因：一是终端批价继续回落，渠道库存偏高 [1]；二是融资资金净卖出、北向小幅流出 [2]；三是白酒板块午后整体走弱，高端酒领跌 [3]。更像板块与资金面共振，而不是公司自身出现了新的利空。'

const REASONING_LINES = [
  '先判断是个股事件还是板块行情：看同板块的五粮液、泸州老窖是否同步下跌。',
  '再查今日新闻与资金流向：批价、融资融券、北向。',
  '最后给出结论，并判断持仓是否需要动作。',
]

const TOOL_LABELS: AiToolCallLabels = {
  status: { pending: '排队', running: '运行中', success: '完成', error: '失败' },
  args: '参数',
  result: '结果',
}
const REASONING_LABELS = {
  thinking: '思考中',
  reasoning: '推理过程',
  thought: (seconds: number) => `思考了 ${seconds.toFixed(1)} 秒`,
}
const MESSAGE_LABELS = { copy: '复制', copied: '已复制', retry: '重试', good: '回答不错', bad: '回答不好' }
const PROMPT_LABELS = {
  send: '发送',
  stop: '停止生成',
  attach: '添加附件',
  removeAttachment: (name: string) => `移除 ${name}`,
}

const stage: CSSProperties = { width: '100%', maxWidth: 560 }

/** 一条模拟的 token 流：每个节拍多出 step 个字。热键 window.__liveStep 可手动步进。 */
function useStream(text: string, step: number, intervalMs: number) {
  const { tick } = useLiveTicker(0, (n) => n + 1, { intervalMs })
  const chars = Math.min(text.length, tick * step)
  return { chars, shown: text.slice(0, chars), done: chars >= text.length, tick }
}

const PARAM_LINES: readonly AiDiffLine[] = [
  { kind: 'context', content: 'strategy: 双均线趋势', number: 1 },
  { kind: 'removed', content: 'fast_window: 10', number: 2 },
  { kind: 'added', content: 'fast_window: 12', number: 2 },
  { kind: 'removed', content: 'stop_loss: 0.05', number: 3 },
  { kind: 'added', content: 'stop_loss: 0.035', number: 3 },
  { kind: 'context', content: 'slow_window: 30', number: 4 },
  { kind: 'added', content: 'max_position: 0.08', number: 5 },
]
const DIFF_LABELS: AiDiffLabels = {
  accept: '接受',
  reject: '拒绝',
  accepted: '已接受',
  rejected: '已拒绝',
  added: '新增',
  removed: '删除',
  context: '未变',
}

export function AiReasoningDemo() {
  const [run, setRun] = useState(0)
  return (
    <>
      <Row name="流式 → 收起">
        <div style={stage} data-gallery-reasoning>
          <ReasoningRun key={run} />
        </div>
        <Button onClick={() => setRun((n) => n + 1)}>重播</Button>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
      </Row>
      <Row name="已结束 · 给定耗时">
        <div style={stage}>
          <AiReasoning labels={REASONING_LABELS} duration={3.2} defaultOpen collapseWhenDone={false}>
            <p style={{ margin: 0 }}>{REASONING_LINES[0]}</p>
          </AiReasoning>
        </div>
      </Row>
      <p className="gal-note">思考中摘要有流光、面板展开；结束后停一拍自动收起并报耗时。手动开合过就不再替你决定。</p>
    </>
  )
}

function ReasoningRun() {
  const { tick } = useLiveTicker(0, (n) => n + 1, { intervalMs: 900 })
  const lines = Math.min(REASONING_LINES.length, tick)
  const streaming = tick <= REASONING_LINES.length
  return (
    <AiReasoning labels={REASONING_LABELS} isStreaming={streaming}>
      {REASONING_LINES.slice(0, Math.max(lines, 1)).map((line) => (
        <p key={line} style={{ margin: '0 0 4px' }}>
          {line}
        </p>
      ))}
    </AiReasoning>
  )
}

export function AiToolCallDemo() {
  const [status, setStatus] = useState<'pending' | 'running' | 'success' | 'error'>('running')
  const order = ['pending', 'running', 'success', 'error'] as const
  return (
    <>
      <Row name="状态环">
        <div style={stage} data-gallery-toolcall>
          <AiToolCall
            name="search_news"
            labels={TOOL_LABELS}
            status={status}
            summary={status === 'success' ? '3 条' : undefined}
            args={<pre style={{ margin: 0 }}>{'{ "query": "贵州茅台 600519 今日 下跌", "days": 1 }'}</pre>}
            result={
              status === 'success' ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {SOURCES.map((source) => (
                    <li key={source.id}>{source.title}</li>
                  ))}
                </ul>
              ) : undefined
            }
          />
        </div>
        <Button onClick={() => setStatus(order[(order.indexOf(status) + 1) % order.length]!)}>下一个状态</Button>
      </Row>
      <Row name="四种">
        <div style={{ ...stage, display: 'grid', gap: 8 }}>
          {order.map((item) => (
            <AiToolCall key={item} name={`get_fund_flow · ${item}`} labels={TOOL_LABELS} status={item} />
          ))}
        </div>
      </Row>
      <p className="gal-note">
        状态徽标是一个会变脸的环：排队时呼吸、运行时缺一口并转、成功在里面画对勾、失败画叉。参数与结果展开才看。
      </p>
    </>
  )
}

export function AiDiffDemo() {
  const [run, setRun] = useState(0)
  const [last, setLast] = useState('等待决定')
  return (
    <>
      <Row name="AI 调整策略参数">
        <div style={stage} data-gallery-diff>
          <AiDiff
            key={run}
            title="双均线趋势 · 参数调整"
            lines={PARAM_LINES}
            labels={DIFF_LABELS}
            onAccept={() => setLast('已接受')}
            onReject={() => setLast('已拒绝')}
          />
        </div>
        <Button onClick={() => (setRun((n) => n + 1), setLast('等待决定'))}>重播</Button>
        <output data-gallery-diff-last>{last}</output>
      </Row>
      <p className="gal-note">
        新增行从左往右擦进来，上下文行不动；拒绝时各行收到零高让出版面；接受闪一下绿、拒绝闪一下红。
      </p>
    </>
  )
}

const ORDER_OPTIONS: AiApprovalOption[] = [
  {
    id: 'approve',
    label: '批准下单',
    primary: true,
    hold: { hint: '按住约 2 秒批准下单', confirmedLabel: '已批准' },
  },
  { id: 'edit', label: '改数量再批', detail: '回到订单' },
  { id: 'reject', label: '拒绝', destructive: true },
]
const ORDER_FACTS = [
  { label: '标的', value: '贵州茅台 600519' },
  { label: '方向', value: '卖出（减仓）', tone: 'down' as const },
  { label: '数量', value: '200 股' },
  { label: '限价', value: '1,468.00' },
]

export function AiApprovalDemo() {
  const [run, setRun] = useState(0)
  const [decided, setDecided] = useState('未决定')
  return (
    <>
      <Row name="下单审批 · 按住确认">
        <div style={stage} data-gallery-approval>
          <AiApproval
            key={run}
            question="AI 建议减仓 600519，是否下单？"
            facts={ORDER_FACTS}
            options={ORDER_OPTIONS}
            onDecide={(option) => setDecided(option.id)}
          >
            理由：板块与资金面共振走弱，单一标的仓位已超过 8% 上限。
          </AiApproval>
        </div>
        <Button onClick={() => (setRun((n) => n + 1), setDecided('未决定'))}>重播</Button>
        <output data-gallery-approval-last>{decided}</output>
      </Row>
      <Row name="低风险 · 单击">
        <div style={stage}>
          <AiApproval
            question="把止损从 5% 调到 3.5%？"
            options={[
              { id: 'yes', label: '调整', primary: true },
              { id: 'no', label: '保持不变' },
            ]}
          />
        </div>
      </Row>
      <Row name="已决定（回放）">
        <div style={stage}>
          <AiApproval question="AI 建议减仓 600519，是否下单？" options={ORDER_OPTIONS} resolvedId="reject" />
        </div>
      </Row>
      <p className="gal-note">
        高风险动作（真的下单）的选项带
        hold，画成「按住确认」：单击不触发，按住把底色填满才批。选中后该项展开铺满、其余收没。
      </p>
    </>
  )
}

export function AiContextMeterDemo() {
  const [used, setUsed] = useState(62_000)
  const limit = 128_000
  const percent = Math.round((used / limit) * 100)
  const breakdown = [
    { label: '系统提示', tokens: 2100 },
    { label: '对话历史', tokens: Math.round(used * 0.45) },
    { label: '工具结果', tokens: Math.round(used * 0.4) },
    { label: '附件', tokens: Math.max(0, used - 2100 - Math.round(used * 0.85)) },
  ]
  return (
    <>
      <Row name="可调">
        <div style={{ padding: '56px 0 0' }} data-gallery-context>
          <AiContextMeter used={used} limit={limit} label={`上下文已用 ${percent}%`} breakdown={breakdown} />
        </div>
        <div className="gal-slider">
          <Slider
            value={[used]}
            min={0}
            max={limit}
            step={1000}
            onValueChange={(next) => setUsed(next[0] ?? 0)}
            thumbLabels={['已用 token']}
          />
        </div>
      </Row>
      <Row name="三档">
        <AiContextMeter used={40_000} limit={limit} label="上下文已用 31%" />
        <AiContextMeter used={108_000} limit={limit} label="上下文已用 84%" />
        <AiContextMeter used={125_000} limit={limit} label="上下文已用 98%" />
      </Row>
      <p className="gal-note">越过 80% 环变琥珀、越过 95% 变红；几何不变，只换色相。悬停、聚焦或点按看分项。</p>
    </>
  )
}

export function AiMessageDemo() {
  const [vote, setVote] = useState('未评价')
  return (
    <>
      <Row name="一问一答">
        <div style={{ ...stage, display: 'grid', gap: 12 }} data-gallery-message>
          <AiMessage from="user" timestamp="14:32" copyText="600519 今天为什么跌" labels={MESSAGE_LABELS}>
            600519 今天为什么跌
          </AiMessage>
          <AiMessage
            timestamp="14:32"
            avatar={<MatrixOrb status="done" cells={5} label="助手" />}
            copyText="更像板块与资金面共振。"
            labels={MESSAGE_LABELS}
            onRetry={() => setVote('重试')}
            onVote={(next) => setVote(next === 'up' ? '赞' : '踩')}
          >
            更像板块与资金面共振，而不是公司自身出现新的利空。
          </AiMessage>
        </div>
        <output data-gallery-message-last>{vote}</output>
      </Row>
      <Row name="不带气泡">
        <div style={stage}>
          <AiMessage bubble={false} labels={MESSAGE_LABELS} copyText="x">
            助手的回合里自带卡片（推理、工具、diff）时，外面再套气泡是盒子里的盒子。
          </AiMessage>
        </div>
      </Row>
      <p className="gal-note">
        动作（复制、重试、赞踩）从气泡自己的边上滑出来；悬停与键盘聚焦都会显出。赞踩只在助手消息上。
      </p>
    </>
  )
}

export function AiResponseDemo() {
  const [run, setRun] = useState(0)
  return (
    <>
      <Row name="流式 + 引用">
        <div style={stage} data-gallery-response>
          <ResponseRun key={run} />
        </div>
        <Button onClick={() => setRun((n) => n + 1)}>重播</Button>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
      </Row>
      <p className="gal-note">
        词到了才进场（淡入、去模糊、上移），不是定时器逐字打；中文按词切。[n] 变成行内引用，悬停或聚焦看来源。
      </p>
    </>
  )
}

function ResponseRun() {
  const { shown, done } = useStream(ANSWER, 6, 300)
  return <AiResponse text={shown} citations={CITATIONS} isStreaming={!done} locale="zh-CN" />
}

const TASKS_STEPS: readonly (readonly AiTask['status'][])[] = [
  ['running', 'pending', 'pending', 'pending'],
  ['done', 'running', 'pending', 'pending'],
  ['done', 'done', 'running', 'pending'],
  ['done', 'done', 'done', 'running'],
  ['done', 'done', 'done', 'failed'],
]

export function AiTaskListDemo() {
  const [step, setStep] = useState(1)
  const status = TASKS_STEPS[step]!
  const tasks: AiTask[] = [
    { id: 'a', label: '读取 600519 近 20 日行情', status: status[0]!, note: '20/20' },
    {
      id: 'b',
      label: '查今日新闻与资金流向',
      status: status[1]!,
      children: [
        { id: 'b1', label: 'search_news', status: status[1] === 'pending' ? 'pending' : 'done' },
        { id: 'b2', label: 'get_fund_flow', status: status[1] === 'running' ? 'running' : status[1]! },
      ],
    },
    { id: 'c', label: '对照持仓与风险上限', status: status[2]! },
    { id: 'd', label: '生成减仓建议并提交审批', status: status[3]!, note: status[3] === 'failed' ? '超时' : undefined },
  ]
  return (
    <>
      <Row name="计划">
        <div style={stage} data-gallery-plan>
          <AiTaskList
            tasks={tasks}
            label="计划"
            statusLabels={{ pending: '待办', running: '进行中', done: '已完成', failed: '失败' }}
          />
        </div>
        <Button onClick={() => setStep((n) => (n + 1) % TASKS_STEPS.length)}>推进一步</Button>
      </Row>
      <p className="gal-note">
        表头「已完成/总数」从任务派生；完成的行安静下来，进行中的行有流光下划线，一次只有一处在动。
      </p>
    </>
  )
}

export function AiPromptInputDemo() {
  const [sent, setSent] = useState('')
  const [state, setState] = useState<AiState>('idle')
  const [files, setFiles] = useState([
    { id: 'f1', name: '持仓明细.csv', size: 12_800 },
    { id: 'f2', name: '回测报告.pdf', size: 1_480_000 },
  ])
  return (
    <>
      <Row name="可输入">
        <div style={stage} data-gallery-prompt>
          <AiPromptInput
            label="向交易助手提问"
            labels={PROMPT_LABELS}
            placeholder="问点什么，例如：600519 今天为什么跌"
            state={state}
            maxLength={40}
            onSubmit={setSent}
            onStop={() => setState('idle')}
          />
        </div>
        <output data-gallery-prompt-sent>{sent || '未发送'}</output>
      </Row>
      <Row name="状态">
        {(['idle', 'streaming', 'error', 'done'] as const).map((item) => (
          <Button key={item} onClick={() => setState(item)} aria-pressed={state === item}>
            {item}
          </Button>
        ))}
      </Row>
      <Row name="带附件">
        <div style={stage}>
          <AiPromptInput
            label="带附件的提问"
            labels={PROMPT_LABELS}
            placeholder="附件已加入草稿"
            attachments={files}
            onAttach={() => undefined}
            onRemoveAttachment={(id) => setFiles((list) => list.filter((file) => file.id !== id))}
          />
        </div>
      </Row>
      <p className="gal-note">
        回车发送、Shift+回车换行；中文输入法选词时的回车不发送。长到 8 行封顶再滚。流式中发送钮变停止。
      </p>
    </>
  )
}

const SUGGESTION_SETS = [
  [
    { id: 'a', label: '600519 今天为什么跌' },
    { id: 'b', label: '我的持仓里谁拖累最大' },
    { id: 'c', label: '帮我复盘昨天的策略信号' },
  ],
  [
    { id: 'd', label: '把止损收紧一点会怎样' },
    { id: 'e', label: '同板块还有哪些在跌' },
  ],
] as const

export function AiSuggestionsDemo() {
  const [set, setSet] = useState(0)
  const [picked, setPicked] = useState('未选')
  return (
    <>
      <Row name="追问">
        <div style={stage} data-gallery-suggestions>
          <AiSuggestions
            key={set}
            label="可以接着问"
            suggestions={SUGGESTION_SETS[set]!}
            onSelect={(suggestion) => setPicked(suggestion.label)}
          />
        </div>
        <Button onClick={() => setSet((n) => (n + 1) % SUGGESTION_SETS.length)}>换一组</Button>
        <output data-gallery-suggestions-last>{picked}</output>
      </Row>
      <p className="gal-note">药丸从中间向两边错开进场：它们是同等分量的备选，不是从左到右的优先级。</p>
    </>
  )
}

const STRATEGY_CODE = `{
  "strategy": "双均线趋势",
  "fast_window": 12,
  "slow_window": 30,
  "stop_loss": 0.035,
  "max_position": 0.08
}`

export function AiArtifactDemo() {
  return (
    <>
      <Row name="预览 / 代码">
        <div style={stage} data-gallery-artifact>
          <AiArtifact
            title="双均线趋势 · 参数"
            labels={{ preview: '预览', code: '代码', views: '视图', copy: '复制', copied: '已复制' }}
            copyText={STRATEGY_CODE}
            preview={
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
                <dt>快线</dt>
                <dd style={{ margin: 0 }}>12 日</dd>
                <dt>慢线</dt>
                <dd style={{ margin: 0 }}>30 日</dd>
                <dt>止损</dt>
                <dd style={{ margin: 0 }}>3.5%</dd>
                <dt>仓位上限</dt>
                <dd style={{ margin: 0 }}>8%</dd>
              </dl>
            }
            code={STRATEGY_CODE}
          />
        </div>
      </Row>
      <p className="gal-note">两个视图沿同一条水平轴走：预览永远在代码左边，所以切换有方向。左右方向键在页签间移动。</p>
    </>
  )
}

const BRANCHES = [
  '更像板块与资金面共振，公司自身没有新的利空。',
  '批价回落与融资卖出是主因，板块只是放大了跌幅。',
  '三个因素叠加：批价、资金、板块；单看任何一个都解释不了全部跌幅。',
]

export function AiBranchDemo() {
  return (
    <>
      <Row name="重答三次">
        <div style={stage} data-gallery-branch>
          <AiBranch>
            <AiBranchMessages>
              {BRANCHES.map((text) => (
                <AiMessage key={text} avatar={<MatrixOrb status="done" cells={5} label="助手" />}>
                  {text}
                </AiMessage>
              ))}
            </AiBranchMessages>
            <AiBranchSelector from="assistant">
              <AiBranchPrevious label="上一个回答" />
              <AiBranchPage format={(at, total) => `第 ${at} 个，共 ${total} 个`} />
              <AiBranchNext label="下一个回答" />
            </AiBranchSelector>
          </AiBranch>
        </div>
      </Row>
      <p className="gal-note">
        同一个问题重答出的几个版本，用上一个 / 下一个翻，到头会绕回；只有一个版本时翻页条不画。
      </p>
    </>
  )
}

export function AgentAvatarDemo() {
  return (
    <>
      <Row name="同一种子同一张脸">
        <div data-gallery-avatar style={{ display: 'flex', gap: 12 }}>
          <AgentAvatar seed="researcher" label="研究员" size={64} />
          <AgentAvatar seed="researcher" label="研究员（同种子）" size={64} animated={false} />
          <AgentAvatar seed="risk" label="风控" size={64} />
          <AgentAvatar seed="executor" label="执行" size={64} />
        </div>
      </Row>
      <Row name="尺寸">
        {[24, 32, 48, 96].map((size) => (
          <AgentAvatar key={size} seed="risk" label={`风控 ${size}`} size={size} />
        ))}
      </Row>
      <p className="gal-note">
        6×6 的色块由种子的散列生成；呼吸、脉动、斜扫、闪点四种环境动效，animated=false 画静止的一帧。
      </p>
    </>
  )
}

// ---- 完整的交易助手对话 ----

const T = { reasonEnd: 4, toolsStart: 4, toolsEnd: 7, answerStart: 7, step: 12 }

function assistantState(tick: number, answerDone: boolean): AiState {
  if (tick < 1) return 'idle'
  if (tick < T.answerStart) return 'thinking'
  return answerDone ? 'done' : 'streaming'
}

function ConversationRun({ onReplay }: { onReplay: () => void }) {
  const { tick, advance } = useLiveTicker(0, (n) => n + 1, { intervalMs: 700 })
  const answerChars = Math.max(0, Math.min(ANSWER.length, (tick - T.answerStart) * T.step))
  const answerDone = answerChars >= ANSWER.length
  const state = assistantState(tick, answerDone)
  const reasoningStreaming = tick < T.reasonEnd
  const toolStatus = (offset: number): 'pending' | 'running' | 'success' =>
    tick < T.toolsStart + offset ? 'pending' : tick < T.toolsEnd + offset - 1 ? 'running' : 'success'
  const orb: OrbState = state
  const used = 18_400 + Math.min(tick, 14) * 3_100
  const content = tick * 100 + answerChars
  return (
    <div data-gallery-assistant style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 640 }}>
      <div
        style={{
          height: 360,
          border: '1px solid var(--line-100)',
          borderRadius: 'var(--radius-overlay)',
          background: 'var(--bg-000)',
        }}
      >
        <AiConversation label="交易助手对话" jumpLabel="回到最新" contentKey={content} className="h-full">
          <div style={{ display: 'grid', gap: 14, padding: 14 }}>
            <AiMessage from="user" timestamp="14:32" labels={MESSAGE_LABELS} copyText="600519 今天为什么跌">
              600519 今天为什么跌
            </AiMessage>
            {tick >= 1 ? (
              <AiMessage bubble={false} avatar={<MatrixOrb status={orb} cells={5} label={`助手：${state}`} />}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <AiReasoning labels={REASONING_LABELS} isStreaming={reasoningStreaming}>
                    {REASONING_LINES.slice(0, Math.max(1, Math.min(REASONING_LINES.length, tick))).map((line) => (
                      <p key={line} style={{ margin: '0 0 4px' }}>
                        {line}
                      </p>
                    ))}
                  </AiReasoning>
                  {tick >= T.toolsStart ? (
                    <AiToolCall
                      name="search_news"
                      labels={TOOL_LABELS}
                      status={toolStatus(0)}
                      summary={toolStatus(0) === 'success' ? '3 条' : undefined}
                      args={<pre style={{ margin: 0 }}>{'{ "query": "贵州茅台 600519 今日 下跌", "days": 1 }'}</pre>}
                      result={
                        toolStatus(0) === 'success'
                          ? SOURCES.map((source) => <div key={source.id}>{source.title}</div>)
                          : undefined
                      }
                    />
                  ) : null}
                  {tick >= T.toolsStart + 1 ? (
                    <AiToolCall
                      name="get_fund_flow"
                      labels={TOOL_LABELS}
                      status={toolStatus(1)}
                      summary={toolStatus(1) === 'success' ? '融资 -1.2 亿' : undefined}
                    />
                  ) : null}
                  {answerChars > 0 ? (
                    <AiResponse
                      text={ANSWER.slice(0, answerChars)}
                      citations={CITATIONS}
                      isStreaming={!answerDone}
                      locale="zh-CN"
                    />
                  ) : null}
                  {answerDone ? (
                    <AiApproval question="AI 建议减仓 600519，是否下单？" facts={ORDER_FACTS} options={ORDER_OPTIONS}>
                      理由：板块与资金面共振走弱，单一标的仓位已超过 8% 上限。
                    </AiApproval>
                  ) : null}
                </div>
              </AiMessage>
            ) : null}
          </div>
        </AiConversation>
      </div>
      <AiPromptInput
        label="向交易助手提问"
        labels={PROMPT_LABELS}
        placeholder="问点什么……"
        state={state}
        onSubmit={onReplay}
        onStop={() => advance()}
      >
        <AiContextMeter
          used={used}
          limit={128_000}
          label={`上下文已用 ${Math.round((used / 128_000) * 100)}%`}
          breakdown={[
            { label: '系统提示', tokens: 2100 },
            { label: '对话历史', tokens: Math.round(used * 0.4) },
            { label: '工具结果', tokens: Math.round(used * 0.5) },
          ]}
        />
      </AiPromptInput>
    </div>
  )
}

export function AiConversationDemo() {
  const [run, setRun] = useState(0)
  return (
    <>
      <Row name="交易助手">
        <ConversationRun key={run} onReplay={() => setRun((n) => n + 1)} />
      </Row>
      <Row>
        <Button onClick={() => setRun((n) => n + 1)}>重播</Button>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
      </Row>
      <p className="gal-note">
        问「600519 今天为什么跌」→ 推理 → 调工具查新闻与资金 → 带来源的回答 →
        一条减仓建议进审批（按住确认）。演示数据写死：发送任何问题都重播这一段。
      </p>
    </>
  )
}
