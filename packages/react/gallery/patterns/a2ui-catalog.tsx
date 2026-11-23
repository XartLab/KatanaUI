// SPDX-License-Identifier: MIT
import catalog from '../../public/a2ui/katana/v1.json'
import { A2uiCatalogUsage } from '../usage/A2uiCatalogUsage'
import { pageById } from '../registry'
import type { Pattern } from './types'

// 名字对不上的才写在这里（如 TextField 对 Input + Field）；其余按 KatanaXxx → Xxx 推出，表的行来自目录 JSON，加件不用改这里。
const PARTS: Readonly<Record<string, readonly [part: string, page: string]>> = {
  KatanaButton: ['Button', 'button'],
  KatanaTextField: ['Input + Field', 'input'],
  KatanaSelect: ['Select', 'select'],
  KatanaSwitch: ['Switch', 'switch'],
  KatanaSlider: ['Slider', 'slider'],
  KatanaDateTimeInput: ['DateTimeInput', 'date-time-input'],
  KatanaPnlText: ['PnlText', 'pnl-text'],
  KatanaMetricCard: ['MetricCard', 'metric-card'],
  KatanaChangeText: ['ChangeText', 'change-text'],
  KatanaSparkline: ['Sparkline', 'sparkline'],
  KatanaDecisionQueue: ['DecisionQueue', 'decision-queue'],
  KatanaHypothesisLedger: ['HypothesisLedger', 'hypothesis-ledger'],
  KatanaAiStatus: ['AiStatus', 'ai-status'],
  KatanaWebSearch: ['WebSearch', 'web-search'],
  KatanaAlert: ['Alert', 'alert'],
  KatanaDataGrid: ['DataGrid', 'data-grid'],
  KatanaNewsFeed: ['NewsFeed', 'news-feed'],
  KatanaNewsReader: ['NewsReader', 'news-reader'],
  KatanaEventTimeline: ['EventTimeline', 'event-timeline'],
  KatanaStatusBar: ['StatusBar', 'status-bar'],
  KatanaSystemMonitor: ['SystemMonitor', 'system-monitor'],
  KatanaEmptyState: ['EmptyState', 'empty-state'],
  KatanaTaskList: ['TaskList', 'task-list'],
  KatanaStepPlayer: ['StepPlayer', 'step-player'],
  KatanaConsensusBlock: ['ConsensusBlock', 'consensus-block'],
  KatanaLimitLadder: ['LimitLadder', 'limit-ladder'],
  KatanaTechnicalRating: ['TechnicalRating', 'technical-rating'],
  KatanaWatchlist: ['Watchlist', 'watchlist'],
  KatanaQuoteTable: ['QuoteTable', 'quote-table'],
  KatanaAccordion: ['Accordion', 'accordion'],
  KatanaPanelFrame: ['PanelFrame', 'panel-frame'],
  KatanaSplitter: ['Splitter', 'splitter'],
  KatanaCheckbox: ['Checkbox', 'checkbox'],
  KatanaToggleGroup: ['ToggleGroup', 'toggle-group'],
  KatanaMultiSelect: ['MultiSelect', 'multi-select'],
  KatanaChipGroup: ['ChipGroup', 'chip-group'],
  KatanaNumberInput: ['NumberInput', 'number-input'],
  KatanaDecimalField: ['DecimalField', 'decimal-field'],
  KatanaDateRangePicker: ['DateRangePicker', 'date-range-picker'],
  KatanaDurationPicker: ['DurationPicker', 'duration-picker'],
  KatanaCombobox: ['Combobox', 'combobox'],
  KatanaPasswordInput: ['PasswordInput', 'password-input'],
  KatanaToast: ['Toast', 'toast'],
  KatanaCodeBlock: ['CodeBlock', 'code-block'],
  KatanaJsonViewer: ['JsonViewer', 'json-viewer'],
  KatanaSymbolMark: ['SymbolMark', 'symbol-mark'],
  KatanaCommand: ['Command', 'command'],
}

/** KatanaEquityCurve → ['EquityCurve', 'equity-curve']：组件页 id 是件名的 kebab 写法。 */
const derivePart = (name: string): readonly [string, string] => {
  const part = name.slice('Katana'.length)
  return [part, part.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()]
}

type Prop = Record<string, unknown>
const text = (value: unknown) => JSON.stringify(value)
/** 能写成 {"@path": …} 绑到数据模型的属性。 */
const bindable = (props: Record<string, Prop>) =>
  Object.entries(props)
    .filter(([name, schema]) => name !== 'component' && text(schema).includes('common_types.json#/$defs/DataBinding'))
    .map(([name]) => name)
/** 会发 Action 的属性（schema 里带 event 的）。 */
const actions = (props: Record<string, Prop>) =>
  Object.entries(props)
    .filter(([name, schema]) => name !== 'weight' && text(schema).includes('"event"'))
    .map(([name]) => name)

function Reference() {
  const components = catalog.components as unknown as Record<string, { properties: Record<string, Prop> }>
  const layout = Object.keys(components).filter((name) => !name.startsWith('Katana'))
  return (
    <section>
      <h2>目录 id 与已登记的组件</h2>
      <p className="gal-note">
        目录 id：<code>{catalog.catalogId}</code>（协议 {catalog.protocolVersion}）。目录 JSON 由 zod schema 生成（
        <code>pnpm a2ui:catalog</code>），文档站发布在同一个地址。
      </p>
      <table className="gal-fd-table" data-testid="a2ui-components">
        <thead>
          <tr>
            <th>组件</th>
            <th>对应的 KatanaUI 件</th>
            <th>可绑定的属性</th>
            <th>发出的动作</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(components)
            .filter((name) => name.startsWith('Katana'))
            .map((name) => {
              const [part, page] = PARTS[name] ?? derivePart(name)
              const props = components[name]!.properties
              return (
                <tr key={name}>
                  <td>
                    <code>{name}</code>
                  </td>
                  <td className="gal-fd-usage">{pageById(page) ? <a href={`#/${page}`}>{part}</a> : part}</td>
                  <td className="gal-fd-usage">{bindable(props).join('、') || '—'}</td>
                  <td className="gal-fd-usage">{actions(props).join('、') || '—'}</td>
                </tr>
              )
            })}
          <tr>
            <td>
              <code>{layout.join('、')}</code>
            </td>
            <td className="gal-fd-usage">基础目录的同名件，原样并入，样子由 a2ui.css 接到我们的 token</td>
            <td className="gal-fd-usage">text、children、tabs 的标题</td>
            <td className="gal-fd-usage">—</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}

const pattern: Pattern = {
  id: 'a2ui-catalog',
  title: 'A2UI 目录',
  summary:
    'A2UI（Agent-to-User Interface，Apache-2.0）让智能体只发布局数据、不发代码，前端用自己的组件渲染。@katana-ui/react/a2ui 把一批 KatanaUI 件登记成 v1.0 目录，智能体发的数据直接画成我们的件。',
  Demo: A2uiCatalogUsage,
  use: [
    '让智能体在对话旁边出一块带读数、建议卡、表单的界面，样子与工作台完全一致',
    '智能体的输出要受控：只能用目录里登记的件，属性按 schema 校验，多写一个字段就拒绝',
  ],
  avoid: [
    '界面是固定的、不由智能体决定：直接写 React，不必过一层目录',
    '要智能体直接下单、转账、改仓位：目录里没有这类属性；这些只能是 Action，由宿主弹确认后执行',
  ],
  parts: [
    { page: 'button', role: '所有操作都是它：只发 Action，宿主决定做什么' },
    { page: 'decision-queue', role: '智能体的建议卡：接受、拒绝、稍后都是 Action，来源链接交给宿主' },
    { page: 'metric-card', role: '读数卡：数字与文字由智能体算好传来，件不取数' },
    { page: 'pnl-text', role: '盈亏文字：数值只定涨跌方向' },
  ],
  Reference,
  rules: [
    '接入：`new MessageProcessor([katanaCatalog])`，每个 surface 用 `<A2uiSurface surface={surface} />` 渲染；样式引 `@katana-ui/react/a2ui.css`（tokens.css 之后）。',
    '入口独立：`@katana-ui/react/a2ui`；`@a2ui/react`、`@a2ui/web_core`、`zod` 是可选 peer 依赖，主入口不引它们，不用 A2UI 的项目零成本。',
    '一个 surface 只用一个目录：Row、Column、List、Card、Tabs、Divider、Text 从基础目录并进来，智能体能排版；Image、Video、AudioPlayer（会加载外部地址）、Icon、Modal 没并。',
    '组件名一律 `Katana` 前缀，与基础目录的 Button 等不撞名；每个属性的英文说明写在 schema 里，智能体靠它理解。',
    '文字全由智能体传，并按用户语言写；读屏名与状态词有英文兜底，可用 `labels` 覆盖。',
    '值要随数据变就用 `{"@path": "/x"}` 绑定；表单件把用户输入写回同一个路径。成列的数据（建议、假说、来源、走势）既可直接写数组，也可绑数据模型里的数组。',
    '动作：Action 的 `context` 由智能体写；同一个件里分多条的（建议队列）用 `metadata.extensions.katanaDecision.id` 告诉宿主是哪一条。',
    '安全：没有任何属性能放 HTML、脚本或原始外链；来源链接只收 https，点了发 `onOpenSource`，由宿主决定开不开；基础目录的 `openUrl` 函数没并入。',
    '安全：交易类动作只能是 Action。组件本身不下单；宿主收到后必须自己再让用户确认。',
    '安全：智能体发来的一切都不可信：schema 把多余属性拒掉，绑进来的数组逐项解析、坏项丢掉。',
  ],
  source: { label: 'A2UI 协议与 React 渲染器', href: 'https://a2ui.org' },
}
export default pattern
