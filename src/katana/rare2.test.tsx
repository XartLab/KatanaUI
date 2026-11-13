// SPDX-License-Identifier: AGPL-3.0-only
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { CodeBlock, DurationPicker, StepPlayer, TaskList, ThemeSelector, WebSearch } from '../index'
import { highlight } from './code-highlight'
import { gutterWidth, trimCode } from './code-block'
import { fieldText, parseField } from './duration-picker'
import { rollSlots, rollStrip } from './rolling-text'
import { arrive, clampStep, stepDuration } from './step-player-model'
import { orderTasks } from './task-list'
import { nextThemeIndex } from './theme-selector'
import { searchProgress, siteInitial } from './web-search'

// #1861 第二批的纯逻辑与结构。动效、焦点、键盘在 e2e/ui-gallery.spec.ts 里用真浏览器验。

describe('RollingText 里程表式转轮', () => {
  it('涨：旧字起往上数到新字前一格；9 转到 0 走一格', () => {
    expect(rollStrip('9', '7', 'up')).toEqual({ strip: '7\n8', steps: 2 })
    expect(rollStrip('5', '7', 'up')).toEqual({ strip: '7\n8\n9\n0\n1\n2\n3\n4', steps: 8 })
    expect(rollStrip('0', '9', 'up')).toEqual({ strip: '9', steps: 1 })
  })

  it('跌：列表从上到下写，旧字在最下', () => {
    expect(rollStrip('6', '9', 'down')).toEqual({ strip: '7\n8\n9', steps: 3 })
    expect(rollStrip('9', '0', 'down')).toEqual({ strip: '0', steps: 1 })
  })

  it('不是数字的位、没变的位只走一格、只有旧字', () => {
    expect(rollStrip('.', ',', 'up')).toEqual({ strip: ',', steps: 1 })
    expect(rollStrip('3', '3', 'up')).toEqual({ strip: '3', steps: 1 })
  })

  it('转轮里的字不进文本：渲染出的文本仍是当前的完整数字', () => {
    expect(
      rollSlots('106,985.4', '106,977.4', true)
        .map((slot) => slot.char)
        .join(''),
    ).toBe('106,985.4')
  })
})

describe('StepPlayer', () => {
  it('每步放完：还有下一步就前进，最后一步看 loop', () => {
    expect(arrive(0, 4, false)).toEqual({ kind: 'advance', index: 1 })
    expect(arrive(3, 4, false)).toEqual({ kind: 'finish' })
    expect(arrive(3, 4, true)).toEqual({ kind: 'loop' })
    expect(arrive(0, 1, false)).toEqual({ kind: 'finish' })
  })

  it('步序夹进范围，不是有限数当 0；时长不是正数当 0', () => {
    expect(clampStep(9, 4)).toBe(3)
    expect(clampStep(-2, 4)).toBe(0)
    expect(clampStep(Number.NaN, 4)).toBe(0)
    expect(stepDuration(undefined, 4000)).toBe(4000)
    expect(stepDuration(600, 4000)).toBe(600)
    expect(stepDuration(-1, 4000)).toBe(0)
  })

  it('结构：播放钮名字由调用方给，当前步是长条、其余是点', () => {
    const html = renderToStaticMarkup(
      <StepPlayer
        steps={3}
        defaultValue={1}
        labels={{
          play: '播放',
          pause: '暂停',
          replay: '重放',
          group: (i, n) => `第 ${i + 1}/${n}`,
          step: (i) => `去 ${i}`,
        }}
      />,
    )
    expect(html).toContain('aria-label="播放"')
    expect(html).toContain('aria-label="第 2/3"')
    expect(html.match(/data-state="active"/g)).toHaveLength(1)
    expect(html.match(/data-state="past"/g)).toHaveLength(1)
    expect(html.match(/data-state="pending"/g)).toHaveLength(1)
    expect(html).not.toContain('step-player-seek')
  })
})

describe('ThemeSelector', () => {
  it('方向键与 Home / End：移动并循环，别的键不处理', () => {
    expect(nextThemeIndex('ArrowRight', 1, 3)).toBe(2)
    expect(nextThemeIndex('ArrowRight', 2, 3)).toBe(0)
    expect(nextThemeIndex('ArrowLeft', 0, 3)).toBe(2)
    expect(nextThemeIndex('Home', 2, 3)).toBe(0)
    expect(nextThemeIndex('End', 0, 3)).toBe(2)
    expect(nextThemeIndex('a', 0, 3)).toBeNull()
    expect(nextThemeIndex('ArrowRight', 0, 0)).toBeNull()
  })

  it('没选中时 tab 停在第一张，选中时只停在选中那张', () => {
    const colors = { rail: '#111', panel: '#222', line: '#333', strong: '#fff', muted: '#555', tile: '#444' }
    const themes = [
      { value: 'a', label: 'A', colors },
      { value: 'b', label: 'B', colors },
    ]
    const none = renderToStaticMarkup(<ThemeSelector themes={themes} label="主题" value={null} />)
    expect(none.match(/tabindex="0"/gi)).toHaveLength(1)
    expect(none).toContain('aria-checked="false"')
    const picked = renderToStaticMarkup(<ThemeSelector themes={themes} label="主题" defaultValue="b" />)
    expect(picked).toContain('role="radiogroup"')
    expect(picked).toMatch(/aria-checked="true"[^>]*aria-label="B"/)
  })
})

describe('CodeBlock', () => {
  it('切分：注释、字符串、数字、关键字、函数调用各归各的类', () => {
    const [line] = highlight("const n = foo(42, 'x') // 注", 'ts')
    expect(line!.map((token) => [token.type, token.text])).toEqual([
      ['keyword', 'const'],
      ['plain', ' n '],
      ['punctuation', '='],
      ['plain', ' '],
      ['function', 'foo'],
      ['punctuation', '('],
      ['number', '42'],
      ['punctuation', ','],
      ['plain', ' '],
      ['string', "'x'"],
      ['punctuation', ')'],
      ['plain', ' '],
      ['comment', '// 注'],
    ])
  })

  it('多行注释每一行各自成 token，拼回去等于原文', () => {
    const code = '/* a\n b */\nlet x = 1'
    const lines = highlight(code, 'js')
    expect(lines).toHaveLength(3)
    expect(lines[0]![0]).toEqual({ type: 'comment', text: '/* a' })
    expect(lines.map((line) => line.map((token) => token.text).join('')).join('\n')).toBe(code)
  })

  it('JSON 的键与值分开着色；shell 的开关是 function；认不得的语言是纯文本', () => {
    const [json] = highlight('{ "a": "b", "n": 1, "t": true }', 'json')
    expect(json!.filter((token) => token.type === 'function').map((token) => token.text)).toEqual(['"a"', '"n"', '"t"'])
    expect(json!.filter((token) => token.type === 'string').map((token) => token.text)).toEqual(['"b"'])
    expect(json!.find((token) => token.type === 'keyword')?.text).toBe('true')
    const [sh] = highlight('pnpm dev --port 80', 'sh')
    expect(sh!.find((token) => token.type === 'function')?.text).toBe('--port')
    expect(highlight('const x', 'brainfuck')).toEqual([[{ type: 'plain', text: 'const x' }]])
  })

  it('任何输入都不丢字：切分后拼回去等于原文', () => {
    const samples = ['', 'a = "未闭合的串', '`模板\n多行` + 1', "'\\''", '#fff { color: red; } /* x */', '😀 emoji']
    for (const code of samples)
      for (const language of ['ts', 'py', 'sh', 'css', 'json', 'plain']) {
        const text = highlight(code, language)
          .map((line) => line.map((token) => token.text).join(''))
          .join('\n')
        expect(text, `${language}: ${code}`).toBe(code)
      }
  })

  it('去掉开头的空行与结尾的空白；行号栏宽跟总行数的位数走', () => {
    expect(trimCode('\n\n  a\nb  \n\n')).toBe('  a\nb')
    expect(gutterWidth(9)).toBe(1)
    expect(gutterWidth(10)).toBe(2)
    expect(gutterWidth(0)).toBe(1)
  })

  it('结构：头写文件名、复制钮名字由调用方给、高亮行带标记', () => {
    const html = renderToStaticMarkup(
      <CodeBlock
        code={'a\nb'}
        language="ts"
        filename="x.ts"
        highlightLines={[2]}
        copyLabel="复制"
        copiedLabel="已复制"
      />,
    )
    expect(html).toContain('>x.ts<')
    expect(html).toContain('aria-label="复制"')
    expect(html).toContain('data-line="2" data-marked="true"')
    expect(html).not.toContain('data-line="1" data-marked')
    const bare = renderToStaticMarkup(<CodeBlock code="a" showHeader={false} copyLabel="复制" copiedLabel="x" />)
    expect(bare).not.toContain('code-block-header')
    expect(bare).toContain('code-block-copy')
  })
})

describe('WebSearch', () => {
  it('进度环：先快后慢、永远走不满；没结果是 8%', () => {
    expect(searchProgress(0)).toBe(0.08)
    expect(searchProgress(1)).toBeCloseTo(0.3)
    expect(searchProgress(2)).toBeCloseTo(0.51)
    expect(searchProgress(20)).toBeLessThan(1)
    expect(searchProgress(2)).toBeGreaterThan(searchProgress(1))
  })

  it('来源小标是站名首字母，空站名写点', () => {
    expect(siteInitial('reuters')).toBe('R')
    expect(siteInitial('  财新')).toBe('财')
    expect(siteInitial('')).toBe('·')
  })

  it('结构：第四条起最后一格是「还有 N 条」；检索中补空骨架；不画链接', () => {
    const sources = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, site: id, title: `标题 ${id}` }))
    const html = renderToStaticMarkup(
      <WebSearch sources={sources} label="已检索" moreLabel={(n) => `还有 ${n} 条`} lessLabel="收起" />,
    )
    expect(html.match(/data-slot="web-search-source"/g)).toHaveLength(3)
    expect(html).toContain('还有 2 条')
    expect(html).not.toContain('<a ')
    const searching = renderToStaticMarkup(
      <WebSearch sources={sources.slice(0, 1)} status="searching" label="检索中" moreLabel={() => ''} lessLabel="" />,
    )
    expect(searching.match(/data-slot="web-search-skeleton"/g)).toHaveLength(3)
  })
})

describe('TaskList', () => {
  const tasks = [
    { id: 'a', label: 'A', done: true },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C', done: true },
    { id: 'd', label: 'D' },
  ]

  it('划完（沉底）的行排到后面，没沉的保持原位，包括勾上但线没划完的', () => {
    expect(orderTasks(tasks, ['c']).map((task) => task.id)).toEqual(['a', 'b', 'd', 'c'])
    expect(orderTasks(tasks, ['a', 'c']).map((task) => task.id)).toEqual(['b', 'd', 'a', 'c'])
    expect(orderTasks(tasks, []).map((task) => task.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('沉了的行如果现在不是完成的、或已经不存在，当作没沉', () => {
    expect(orderTasks(tasks, ['b', 'zzz']).map((task) => task.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('结构：每行是 checkbox，起始就完成的在底部，屏外有播报区', () => {
    const html = renderToStaticMarkup(
      <TaskList defaultTasks={tasks} labels={{ completed: (l) => l, reopened: (l) => l }} />,
    )
    expect(html.match(/role="checkbox"/g)).toHaveLength(4)
    expect(html.match(/aria-checked="true"/g)).toHaveLength(2)
    expect(html.indexOf('>B<')).toBeLessThan(html.indexOf('>A<'))
    expect(html).toContain('role="status"')
  })
})

describe('DurationPicker', () => {
  it('输入框的字：只认数字，空当 0，超出夹到上限并标记', () => {
    expect(parseField('', 24)).toEqual({ value: 0, overflow: false })
    expect(parseField('12', 24)).toEqual({ value: 12, overflow: false })
    expect(parseField('99', 24)).toEqual({ value: 24, overflow: true })
    expect(parseField('a3b', 24)).toEqual({ value: 3, overflow: false })
    expect(fieldText(0)).toBe('')
    expect(fieldText(7)).toBe('7')
  })

  it('结构：不编辑时两个数字只读、笔钮名字由调用方给；0 写成 0', () => {
    const labels = { hours: '时', minutes: '分', edit: '编辑', save: '确认', hoursInput: '小时', minutesInput: '分钟' }
    const html = renderToStaticMarkup(<DurationPicker defaultValue={{ hours: 2, minutes: 0 }} labels={labels} />)
    expect(html).toContain('aria-label="编辑"')
    expect(html).toContain('value="2"')
    expect(html).toContain('value="0"')
    expect(html.match(/readOnly=""/g)).toHaveLength(2)
    const editing = renderToStaticMarkup(<DurationPicker defaultEditing labels={labels} />)
    expect(editing).toContain('aria-label="确认"')
    expect(editing).not.toContain('readOnly')
  })
})
