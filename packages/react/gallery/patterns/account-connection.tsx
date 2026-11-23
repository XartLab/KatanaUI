// SPDX-License-Identifier: MIT
import { useRef, useState, type ComponentProps } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Led,
  PasswordInput,
  RunModeBadge,
  Tag,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  useFieldControl,
} from '../../src/index'
import {
  apiAccess,
  missingFields,
  parseApiPaste,
  type ApiAccess,
  type ApiPaste,
  type ConnectField,
  type ConnectForm,
} from './trading-sim'
import type { Pattern } from './types'

// 演示数据：提供方、密钥、交易所的回答都是编的；不存密钥、不发请求。粘贴的格式照 OKX 建好 API 后页面上给的那一段（见 trading-sim.ts）。
const SAMPLE_PASTE =
  'apikey = "demo-0000-key" secretkey = "demo-0000-secret" IP = "" 备注名 = "示例模拟盘" 权限 = "读取, 交易"'
const RUN_MODE_LABELS = { paper: '模拟盘', replay: '回放', forward: '前向测试', live: '实盘' } as const
const ACCESS: Record<ApiAccess, { text: string; tone: 'neutral' | 'warn' | 'danger' }> = {
  read: { text: '只读', tone: 'neutral' },
  trade: { text: '可交易', tone: 'warn' },
  withdraw: { text: '带提现', tone: 'danger' },
}
type Answer = 'ok' | 'passphrase' | 'ip'
type Proxy = 'system' | 'direct' | 'custom'
type Connection = { id: number; name: string; kind: 'exchange' | 'public'; access: ApiAccess | null; on: boolean }

const row = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } as const
const EMPTY: ConnectForm = { apiKey: '', secretKey: '', passphrase: '' }

function FieldInput(props: ComponentProps<typeof Input>) {
  const control = useFieldControl()
  return <Input {...props} {...control} />
}
function FieldSecret(props: ComponentProps<typeof PasswordInput>) {
  const control = useFieldControl()
  return <PasswordInput labels={{ toggle: '显示或遮住' }} {...props} {...control} />
}
function FieldTextarea(props: ComponentProps<typeof Textarea>) {
  const control = useFieldControl()
  return <Textarea {...props} {...control} />
}

/** 一行连接：名字、环境牌、权限牌，三盏灯各说各的（行情、账户、下单），右边连接 / 断开与删除。 */
function ConnectionRow({
  connection,
  onToggle,
  onRemove,
}: {
  connection: Connection
  onToggle: () => void
  onRemove: () => void
}) {
  const { name, kind, access, on } = connection
  const trading = on && (access === 'trade' || access === 'withdraw')
  return (
    <li className="gal-stack" style={{ gap: 6, padding: '8px 12px' }} data-testid="connection-row">
      <div style={{ ...row, justifyContent: 'space-between' }}>
        <span style={row}>
          <strong>{name}</strong>
          {kind === 'exchange' ? <RunModeBadge mode="paper" labels={RUN_MODE_LABELS} /> : null}
          {access ? (
            <Tag tone={ACCESS[access].tone} data-access={access}>
              {ACCESS[access].text}
            </Tag>
          ) : (
            <Tag>公开行情</Tag>
          )}
        </span>
        <span style={row}>
          <Button size="sm" onClick={onToggle}>
            {on ? '断开' : '连接'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove} aria-label={`删除 ${name}`}>
            删除
          </Button>
        </span>
      </div>
      <div style={{ ...row, gap: 16 }} className="gal-note">
        <span style={row}>
          <Led tone={on ? 'ok' : 'off'} label={on ? '行情已连接' : '行情已断开'} /> 行情 {on ? '已连接' : '已断开'}
        </span>
        {kind === 'exchange' ? (
          <>
            <span style={row}>
              <Led tone={on ? 'ok' : 'off'} label={on ? '账户已同步' : '账户已断开'} /> 账户{' '}
              {on ? '已同步' : '已断开（记录留着，标过期）'}
            </span>
            <span style={row} data-testid="trade-light">
              <Led tone={trading ? 'ok' : 'off'} label={trading ? '可以下单' : '不能下单'} /> 下单{' '}
              {trading ? '可用' : access === 'read' ? '不能：这把 API 只读' : '不能：已断开'}
            </span>
          </>
        ) : null}
      </div>
    </li>
  )
}

function ProxySettings() {
  const [mode, setMode] = useState<Proxy>('system')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('7890')
  const [result, setResult] = useState<string | null>(null)
  return (
    <FieldSet>
      <FieldLegend>网络代理（所有连接共用一份）</FieldLegend>
      <ToggleGroup
        size="sm"
        aria-label="代理"
        value={mode}
        onValueChange={(value) => {
          if (!value) return
          setMode(value as Proxy)
          setResult(null)
        }}
      >
        <ToggleGroupItem value="system">跟随系统</ToggleGroupItem>
        <ToggleGroupItem value="direct">不用代理</ToggleGroupItem>
        <ToggleGroupItem value="custom">自定义</ToggleGroupItem>
      </ToggleGroup>
      {mode === 'custom' ? (
        <div style={{ ...row, alignItems: 'flex-end' }}>
          <Field style={{ width: 180 }}>
            <FieldLabel>主机</FieldLabel>
            <FieldInput value={host} onChange={(event) => setHost(event.target.value)} placeholder="127.0.0.1" />
          </Field>
          <Field style={{ width: 90 }}>
            <FieldLabel>端口</FieldLabel>
            <FieldInput value={port} onChange={(event) => setPort(event.target.value)} inputMode="numeric" />
          </Field>
          <Button onClick={() => setResult(host.trim() ? '通了 · 86 ms（演示）' : '没通：没填主机')}>测试</Button>
        </div>
      ) : null}
      <p className="gal-note" role="status">
        现在：
        {mode === 'custom'
          ? (result ?? '填好后点「测试」，再保存')
          : mode === 'system'
            ? '跟随系统（演示里是直连）'
            : '直连'}
      </p>
    </FieldSet>
  )
}

function Demo() {
  const [provider, setProvider] = useState<'exchange' | null>(null)
  const [paste, setPaste] = useState('')
  const [parsed, setParsed] = useState<ApiPaste | null>(null)
  const [form, setForm] = useState<ConnectForm>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<ConnectField, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [answer, setAnswer] = useState<Answer>('ok')
  const [connections, setConnections] = useState<readonly Connection[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const seq = useRef(1)

  const add = (connection: Omit<Connection, 'id' | 'on'>) => {
    setConnections((list) => [...list, { ...connection, id: seq.current++, on: true }])
    setNotice(`已连上 ${connection.name}`)
  }
  const edit = (field: ConnectField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }
  const onPaste = (text: string) => {
    const result = parseApiPaste(text)
    if (!result.recognized) {
      setPaste(text)
      setParsed(result)
      return
    }
    // 认出来就填进框里，原文当场清掉、不留存。
    setPaste('')
    setParsed(result)
    setForm((current) => ({
      ...current,
      apiKey: result.apiKey ?? current.apiKey,
      secretKey: result.secretKey ?? current.secretKey,
    }))
    setErrors({})
  }
  const access = parsed?.recognized ? apiAccess(parsed.permissions) : null
  const connect = () => {
    setFormError(null)
    const missing = missingFields(form)
    if (Object.keys(missing).length > 0) {
      setErrors(missing)
      return
    }
    if (answer === 'passphrase') {
      setErrors({ passphrase: 'Passphrase 不对（交易所的回答）' })
      return
    }
    if (answer === 'ip') {
      setFormError('本机的出口 IP 不在这把 API 的白名单里：在交易所的 API 设置里加上，或去掉 IP 限制。')
      return
    }
    // 权限真的以交易所验证时的回答为准；演示里只能从贴进来的那段读，手填的没有这一项，按只读画。
    add({ name: parsed?.name ?? '示例交易所 模拟盘', kind: 'exchange', access: access ?? 'read' })
    setProvider(null)
    setForm(EMPTY)
    setParsed(null)
  }

  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 1000 }}>
      <p className="gal-note">
        演示数据：提供方与密钥都是编的，不存、不发请求。点「示例交易所」，再点「填入示例」把一段 API 信息贴进去，填个
        Passphrase 点「连接」。
      </p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        <PanelFrame aria-label="添加连接">
          <PanelFrameHeader heading="添加连接" object="· 演示数据" />
          <PanelFrameBody>
            <div className="gal-stack" style={{ padding: 12 }}>
              <div style={row} role="group" aria-label="提供方">
                <Button aria-pressed={provider === 'exchange'} onClick={() => setProvider('exchange')}>
                  示例交易所 · 要 API
                </Button>
                <Button onClick={() => add({ name: '示例公开行情', kind: 'public', access: null })}>
                  示例公开行情 · 免密钥
                </Button>
              </div>
              {provider === 'exchange' ? (
                <div className="gal-stack" data-testid="connect-form">
                  <Field>
                    <FieldLabel>粘贴 API 信息</FieldLabel>
                    <FieldTextarea
                      rows={2}
                      value={paste}
                      onChange={(event) => onPaste(event.target.value)}
                      placeholder='apikey = "…" secretkey = "…" 备注名 = "…" 权限 = "…"'
                    />
                    <FieldDescription>
                      {parsed?.recognized
                        ? `认出了 Key、Secret${parsed.name ? `、备注名「${parsed.name}」` : ''}，权限「${parsed.permissions.join('、') || '没写'}」；原文已清掉。`
                        : parsed
                          ? '没认出来，下面的框照旧手填。'
                          : '交易所建好 API 后给的那一段整段贴进来，Key 与 Secret 自动填好。'}
                    </FieldDescription>
                  </Field>
                  <Button size="sm" style={{ alignSelf: 'flex-start' }} onClick={() => onPaste(SAMPLE_PASTE)}>
                    填入示例
                  </Button>
                  {access === 'trade' || access === 'withdraw' ? (
                    <Alert tone={access === 'withdraw' ? 'danger' : 'warn'} data-testid="permission-alert">
                      <AlertTitle>这把 API {access === 'withdraw' ? '带提现权限' : '能交易'}</AlertTitle>
                      <AlertDescription>
                        只看行情与账户，只读就够；要从这里下单才留「交易」。提现一律去掉：这里永远用不到。
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <Field invalid={Boolean(errors.apiKey)}>
                    <FieldLabel>API Key</FieldLabel>
                    <FieldInput value={form.apiKey} onChange={(event) => edit('apiKey', event.target.value)} />
                    {errors.apiKey ? <FieldError>{errors.apiKey}</FieldError> : null}
                  </Field>
                  <Field invalid={Boolean(errors.secretKey)}>
                    <FieldLabel>Secret</FieldLabel>
                    <FieldSecret value={form.secretKey} onChange={(event) => edit('secretKey', event.target.value)} />
                    {errors.secretKey ? <FieldError>{errors.secretKey}</FieldError> : null}
                  </Field>
                  <Field invalid={Boolean(errors.passphrase)}>
                    <FieldLabel>Passphrase</FieldLabel>
                    <FieldSecret value={form.passphrase} onChange={(event) => edit('passphrase', event.target.value)} />
                    <FieldDescription>建 API 时自己设的，交易所不显示，要手填。</FieldDescription>
                    {errors.passphrase ? <FieldError>{errors.passphrase}</FieldError> : null}
                  </Field>
                  <ToggleGroup
                    size="sm"
                    aria-label="交易所的回答（演示）"
                    value={answer}
                    onValueChange={(value) => value && setAnswer(value as Answer)}
                  >
                    <ToggleGroupItem value="ok">验证通过</ToggleGroupItem>
                    <ToggleGroupItem value="passphrase">Passphrase 不对</ToggleGroupItem>
                    <ToggleGroupItem value="ip">IP 不在白名单</ToggleGroupItem>
                  </ToggleGroup>
                  {formError ? (
                    <Alert tone="danger">
                      <AlertTitle>没连上，什么都没存</AlertTitle>
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div style={{ ...row, justifyContent: 'flex-end' }}>
                    <Button onClick={() => setProvider(null)}>取消</Button>
                    <Button variant="primary" onClick={connect}>
                      连接
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </PanelFrameBody>
        </PanelFrame>
        <PanelFrame aria-label="连接">
          <PanelFrameHeader heading="连接" object={`· ${connections.length} 个 · 演示数据`} />
          <PanelFrameBody>
            <div className="gal-stack" style={{ padding: 12 }}>
              {notice ? (
                <p className="gal-note" role="status" data-testid="connect-notice">
                  {notice}
                </p>
              ) : null}
              {connections.length === 0 ? (
                <p className="gal-note">还没有连接：在左边选一个提供方。</p>
              ) : (
                <ul aria-label="连接列表" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {connections.map((connection) => (
                    <ConnectionRow
                      key={connection.id}
                      connection={connection}
                      onToggle={() =>
                        setConnections((list) =>
                          list.map((item) => (item.id === connection.id ? { ...item, on: !item.on } : item)),
                        )
                      }
                      onRemove={() => setConnections((list) => list.filter((item) => item.id !== connection.id))}
                    />
                  ))}
                </ul>
              )}
              <ProxySettings />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
    </div>
  )
}

const pattern: Pattern = {
  id: 'account-connection',
  title: '连接账户',
  summary:
    '照 ATAS 的连接管理器：选提供方，贴一段 API 信息、补 Passphrase、点「连接」一步连上；列表里一行一个连接，行情、账户、下单三盏灯各说各的，只读与可交易一眼分开；代理所有连接共用一份。',
  Demo,
  use: [
    '第一次接交易所或券商账户，或在账户面板、下单面板的空态里点「连接交易账户」',
    '看哪个连接通着、哪个断了、哪个只读，在一处连上、断开、删除',
  ],
  avoid: [
    '免密钥的公开行情：点提供方卡片就连上，不弹表单',
    '在网页里存密钥：密钥只交给本机服务的保险箱，页面不留存、不回显；没有本机服务时写明存不了，不在浏览器里另存',
    '每个连接各填一份代理：代理是全局设置，放在设置的「网络」里，连接表单里不出现',
  ],
  parts: [
    { page: 'button', role: '提供方：要 API 的点开表单，免密钥的点一下直接连上' },
    { page: 'textarea', role: '「粘贴 API 信息」：整段贴进来，认出 Key、Secret、备注名与权限，原文当场清掉' },
    { page: 'input', role: 'API Key 与代理的主机、端口' },
    { page: 'password-input', role: 'Secret 与 Passphrase：默认遮住，眼睛钮看一眼' },
    { page: 'field', role: '每个框的标签、说明与错误：交易所说哪个框不对，错就写在哪个框旁边' },
    { page: 'alert', role: 'API 带交易或提现权限的提醒；整体失败（IP 白名单、时间不对）的原因' },
    { page: 'led', role: '行情、账户、下单三盏灯，各配一句字' },
    { page: 'run-mode-badge', role: '环境牌：模拟盘 / 实盘，样子分明不混' },
    { page: 'tag', role: '权限牌：只读、可交易、带提现' },
    { page: 'toggle-group', role: '代理三选一：跟随系统、不用代理、自定义' },
  ],
  rules: [
    '添加一步到位：选提供方 → 贴 API 信息（Key、Secret 自动填）→ 补 Passphrase → 「连接」。「连接」就是存密钥 + 交易所验一次 + 连上，比 ATAS 的「添加 → 填 key → 完成 → 回列表点连接」少一步（KATANAview 决定 2026-11-07）',
    '验不过什么都不存：交易所说哪个框不对就写在哪个框旁（Passphrase 不对、权限不够）；说不出是哪个框的（IP 不在白名单、时间对不上、环境不符）写在表单底部；已填的内容留着让人改',
    '贴进来的原文认出来就清掉、不留存；认不出就写一句，框照旧手填；名字默认取备注名，没有就是「提供方 + 环境」，改名在这一行的设置里',
    '权限分三档写成牌：只读（中性）、可交易（警示）、带提现（危险）；带交易或提现时表单当场提醒，提现一律劝去掉',
    '一行三盏灯各说各的：行情、账户、下单；灯旁一定有字，「不能下单」写原因（只读、已断开），不只是一盏暗灯',
    '只读的连接没有任何下单入口：下单面板里它的账户灰着，写明「只读」，不在点下单后才报错',
    '环境牌（模拟盘 / 实盘）跟在名字后面，实盘的样子最醒目；模拟、回放、实盘账户不混在一个模式里',
    '断开是真的停掉这个连接的账户通道，密钥留在保险箱，记录留着并标过期；删除才清密钥',
    '代理所有连接共用一份，三选一：跟随系统（默认）、不用代理、自定义（类型、主机、端口，「测试」写通没通与延迟）；「现在」一行写眼下实际走的哪一路',
  ],
  source: {
    label: 'ATAS · Connectors（连接器与连接设置）',
    href: 'https://help.atas.net/en/support/solutions/folders/72000569858',
  },
}
export default pattern
