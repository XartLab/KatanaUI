// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it, vi } from 'vite-plus/test'

// @a2ui/react 在模块顶层继承 HTMLElement，单测在 Node 环境，先垫一个空类再载入目录（只为载入，不渲染）。
vi.hoisted(() => {
  globalThis.HTMLElement ??= class {} as typeof HTMLElement
})

const here = dirname(fileURLToPath(import.meta.url))
const read = (path: string) => JSON.parse(readFileSync(join(here, path), 'utf8')) as Record<string, unknown>

const { KATANA_APIS, KATANA_CATALOG_ID, BASIC_LAYOUT_NAMES, EXCLUDED_FUNCTIONS, katanaCatalog } =
  await import('./catalog.ts')

// 每个组件一份示例属性：新加组件没写示例，下面「每个组件都有示例」就红，逼着补。
const EXAMPLES: Record<string, Record<string, unknown>> = {
  KatanaButton: { label: 'Accept', variant: 'primary', action: { event: { name: 'accept', context: { id: 'a1' } } } },
  KatanaTextField: { label: 'Symbol', value: { '@path': '/form/symbol' }, inputType: 'text' },
  KatanaSelect: {
    label: 'Venue',
    options: [{ label: 'Binance', value: 'binance' }],
    value: { '@path': '/form/venue' },
  },
  KatanaSwitch: { label: 'Reduce only', value: { '@path': '/form/reduce' } },
  KatanaSlider: { label: 'Size', min: 0, max: 100, step: 5, value: { '@path': '/form/size' } },
  KatanaDateTimeInput: { label: 'From', value: '2026-11-17T09:30', enableTime: true, min: '2026-01-01' },
  KatanaPnlText: { text: '+1,240.50 USDT', value: 1240.5, arrow: true },
  KatanaMetricCard: {
    title: 'VIX',
    value: '18.4',
    changes: [{ label: 'vs yesterday', value: -1.2 }],
    trend: { '@path': '/vix' },
    trendLabel: 'VIX over the last 30 days',
  },
  KatanaChangeText: { value: 1.5, digits: 2 },
  KatanaSparkline: { values: [1, 2, 3], label: 'Price trend' },
  KatanaDecisionQueue: {
    items: [
      {
        id: 'd1',
        action: 'Buy',
        target: 'ACME',
        rationale: 'Backtest is positive.',
        sources: [{ label: 'Report', href: 'https://example.com/report' }],
        createdAt: '2026-11-17T09:00:00Z',
      },
    ],
    onAccept: { event: { name: 'decision.accept' } },
  },
  KatanaHypothesisLedger: {
    items: [
      {
        id: 'h1',
        claim: 'Credit easing lifts small caps.',
        layer: 'credit',
        status: 'pending',
        failure: 'Small caps lag for 3 months.',
        deadline: '2027-01-31',
        evidence: [
          {
            id: 'e1',
            kind: 'data',
            source: 'Central bank',
            href: 'https://example.com/data',
            publishedAt: '2026-11-01',
            summary: 'Loan growth rose.',
            stance: 'support',
          },
        ],
      },
    ],
  },
  KatanaAiStatus: { state: 'searching', label: 'Reading the filing', elapsed: 12 },
  KatanaWebSearch: { sources: [{ id: 's1', site: 'Reuters', title: 'Headline' }], label: 'Searched 1 source' },
  KatanaAlert: { tone: 'warn', title: 'Stale data', description: 'The feed is 5 minutes behind.' },
}

describe('A2UI 目录', () => {
  it('每个组件都有示例，示例能被自己的 schema 解析', () => {
    expect(KATANA_APIS.map((api) => api.name).toSorted()).toEqual(Object.keys(EXAMPLES).toSorted())
    for (const api of KATANA_APIS) {
      const parsed = api.schema.safeParse(EXAMPLES[api.name])
      expect(parsed.success, `${api.name}: ${parsed.success ? '' : parsed.error.message}`).toBe(true)
    }
  })

  it('schema 是严格的：多写一个属性就拒绝', () => {
    for (const api of KATANA_APIS) {
      expect(api.schema.safeParse({ ...EXAMPLES[api.name], executeScript: 'alert(1)' }).success, api.name).toBe(false)
    }
  })

  it('组件名都带 Katana 前缀，不跟基础目录撞名；并进来的排版件都在基础目录里', () => {
    for (const api of KATANA_APIS) expect(api.name).toMatch(/^Katana[A-Z][A-Za-z]+$/)
    expect([...katanaCatalog.components.keys()]).toEqual([...BASIC_LAYOUT_NAMES, ...KATANA_APIS.map((api) => api.name)])
    expect(katanaCatalog.id).toBe(KATANA_CATALOG_ID)
  })

  it('每个属性都有英文说明（智能体靠它理解），没有中文', () => {
    const json = katanaCatalog.toJson() as {
      components: Record<string, { properties: Record<string, { description?: string }> }>
    }
    const bad: string[] = []
    for (const api of KATANA_APIS) {
      for (const [name, prop] of Object.entries(json.components[api.name]!.properties)) {
        if (name === 'component') continue
        if (!prop.description || /[一-鿿]/.test(prop.description)) bad.push(`${api.name}.${name}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('安全：目录里没有 openUrl，来源链接只收 https，多余的属性与 javascript: 链接都被拒', () => {
    expect([...katanaCatalog.functions.keys()]).not.toContain('openUrl')
    expect(EXCLUDED_FUNCTIONS).toContain('openUrl')
    const queue = KATANA_APIS.find((api) => api.name === 'KatanaDecisionQueue')!
    const item = (EXAMPLES.KatanaDecisionQueue!.items as Record<string, unknown>[])[0]!
    for (const href of ['http://example.com', 'javascript:alert(1)', 'data:text/html,x', '/relative']) {
      const bad = { ...EXAMPLES.KatanaDecisionQueue, items: [{ ...item, sources: [{ label: 'x', href }] }] }
      expect(queue.schema.safeParse(bad).success, href).toBe(false)
    }
    // 没有任何属性能放 HTML、脚本或原始 URL：整份目录 JSON 里不出现这些字段名。
    const text = JSON.stringify(katanaCatalog.toJson())
    for (const field of ['"html"', '"innerHTML"', '"script"', '"dangerouslySetInnerHTML"', '"url"', '"openUrl"']) {
      expect(text.includes(field), field).toBe(false)
    }
  })
})

describe('目录 JSON', () => {
  const ajv = new Ajv2020({ strict: false, allErrors: true })
  const common = read('__fixtures__/common_types.json')
  ajv.addSchema(common)
  const validate = ajv.compile(read('__fixtures__/catalog_definition.json'))
  const document = katanaCatalog.toJson()

  it('过 A2UI v1.0 的 catalog_definition 校验', () => {
    expect(validate(document), JSON.stringify(validate.errors, null, 1)).toBe(true)
    expect(document.protocolVersion).toBe('1.0')
    expect(document.catalogId).toBe(KATANA_CATALOG_ID)
  })

  it('校验器是认真的：缺 catalogId、多一个顶层字段都不过', () => {
    const { catalogId: _drop, ...noId } = document
    expect(validate(noId)).toBe(false)
    expect(validate({ ...document, surprise: true })).toBe(false)
  })

  it('已提交的 public/a2ui/katana/v1.json 与 schema 算出来的一致（pnpm a2ui:catalog）', () => {
    const committed = readFileSync(resolve(here, '../../public/a2ui/katana/v1.json'), 'utf8')
    expect(committed).toBe(`${JSON.stringify(document, null, 2)}\n`)
  })
})
