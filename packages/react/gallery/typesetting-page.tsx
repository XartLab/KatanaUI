// SPDX-License-Identifier: MIT
// 「基础 → 中英排版开关」页（#250 第一部分）：十条规则一条一句（数值与做法），每条规则的演示在表后。
// 出处：kubai（@kubai087）《999 个小技巧》第 007 期「中英文排版的 CSS 设置」（https://vibedesign.tips/007-type-switches/ ，数值照 issue #250 抄录的原文，2026-11-26）。
// 规则本身在 src/theme/typesetting.css；这页只写规则与演示，不另存一份数值。
import type { ReactNode } from 'react'
import { Lede, Table } from './foundations-more'
import { phrased } from './phrased'

const code = (text: string) => <code>{text}</code>

/** 并排的「没开 / 开了」演示框。 */
function Compare({ off, on, children }: { off: ReactNode; on: ReactNode; children?: ReactNode }) {
  return (
    <div className="gal-ts-compare">
      <figure>
        <figcaption>没开</figcaption>
        <div className="gal-ts-box" data-state="off">
          {off}
        </div>
      </figure>
      <figure>
        <figcaption>开了</figcaption>
        <div className="gal-ts-box" data-state="on">
          {on}
        </div>
      </figure>
      {children}
    </div>
  )
}

// 汉字与字母、数字之间故意不打空格：开了 text-autospace 浏览器自己留。
const MIXED = '用Chrome浏览器在3个面板里看BTC与ETH的24h成交量，延迟低于50ms。'
const TITLE = '级联菜单的安全区与三段延时'
const LONG_ZH =
  '两端对齐只给中文长段落：行长取整数个字宽，每行末尾的空隙才不会被拉成大缝。窄栏、短文与按钮不用，英文为主的段落也不用。'
const PRICES = ['1,111.11', '8,888.88', '2,046.50']
const LONG_LABEL = '沪深 300 增强策略（参数扫描第 12 组，样本外）'

function TypesettingPage() {
  return (
    <>
      <Lede>
        中英混排的一组渐进增强开关，全在 {code('theme/typesetting.css')}，进 {code('ui.css')}：选择器包在{' '}
        {code(':where()')} 里，权重为 0，件自己的样式照旧压得过它；中文规则一律用 {code(':lang(zh)')}{' '}
        限定，英文界面不动；不认的浏览器直接忽略，不加垫片。
      </Lede>
      <h2>规则</h2>
      <Table
        head={['规则', '做法与数值', '边界']}
        rows={[
          [
            '标题均衡换行',
            <>
              {code('h1')}–{code('h3')}、卡片、提示、抽屉的标题：{code('text-wrap: balance')}
            </>,
            '只给短标题；Chromium 最多均衡 6 行、Firefox 10 行，超了退回普通换行；不给整页（*）开，它是二分查找，贵。',
          ],
          [
            '段落不留孤字',
            <>
              {code('p')}、{code('li')}、{code('dd')}、{code('blockquote')} 与各 {code('*-description')}：
              {code('text-wrap: pretty')}。数字与单位、破折号与名字之间写不换行空格 U+00A0（{code('UnitValue')} 已写）
            </>,
            'Firefox 不认，忽略；三行以上才看得出差别。',
          ],
          [
            '变动的数字等宽',
            <>
              {code('table')}、{code('time')}、{code('output')}：{code('font-variant-numeric: tabular-nums')}
              ；价格、计数、计时等数据件各自的样式里已写
            </>,
            '字体要有 tnum 特性；没有只是没效果，不会坏。',
          ],
          [
            '按钮文字不折行',
            <>
              {code('button')}、{code('[role=button]')}、{code('[role=tab]')}：{code('white-space: nowrap')}
            </>,
            <>里面放了段落、标题、列表的卡片式按钮不动（white-space 会往下继承）；要折行的写 {code('data-wrap')}。</>,
          ],
          [
            '截断真生效',
            <>
              flex 子项 {code('min-width: 0')}；文字{' '}
              {code('overflow: hidden; white-space: nowrap; text-overflow: ellipsis')}（{code('[data-truncate]')}{' '}
              一次写全）。真被截断时悬停出全文：应用启动时调一次 {code('installTruncationTitles()')}
            </>,
            '只在真放不下时才补 title，放得下的不补；作者自己写了 title 的不动。title 只有鼠标悬停能出，键盘与触屏要另有全文（选中项写全、点开详情）。',
          ],
          [
            '中文正文两端对齐',
            <>
              {code('[data-zh-justify]:lang(zh)')}：{code('text-align: justify')} + {code('max-width: 26em')}
              （整数字宽，
              {code('--k-zh-measure')} 可改）
            </>,
            '窄栏（不到 15 字）、短文、按钮、英文为主的不用；文档站长文适用，组件里基本不用。',
          ],
          [
            '中西文间距',
            <>
              {code(':lang(zh)')}：{code('text-autospace: normal')}；{code('code')}、{code('pre')}、{code('kbd')}、
              {code('samp')}、{code('input')}、{code('textarea')} 为 {code('no-autospace')}
            </>,
            '文案与翻译文件里不再手打中西文之间的空格；代码、输入框、等宽字的空格有含义，不加。',
          ],
          [
            '行首括号去半格',
            <>
              {code(':lang(zh)')}：{code('text-spacing-trim: trim-start')}
            </>,
            '只有 Chrome 系有；首行缩进的正文不用（缩进本来就留着空）。',
          ],
          [
            '中文标题按词断行',
            <>
              标题先过 BudouX 在词间插 {code('<wbr>')}，带了断点的标题标 {code('data-phrased')}：
              {code('word-break: keep-all; overflow-wrap: anywhere; text-wrap: balance')}
            </>,
            <>
              没有断点的标题绝不开 keep-all；不用 Intl.Segmenter；不用于正文。现在只有文档站的页标题做了（
              {code('gallery/phrased.tsx')}）；组件库里不带 BudouX（它带两个传递依赖，每个使用者都得背），EmptyState
              与卡片标题的调用方可以自己传插好 {code('<wbr>')} 的标题，加 {code('data-phrased')}。
            </>,
          ],
          [
            '避头尾',
            <>
              浏览器自带（{code('line-break: auto')}）。库里不写 {code('line-break: anywhere')}，要折超长串用{' '}
              {code('overflow-wrap: anywhere')}；全库搜过，没有 {code('line-break: anywhere')}，也没有{' '}
              {code('word-break: break-all')}
            </>,
            <>
              画布、SVG、JS 手动换行的字走 {code('wrapText')}（pretext）：它按 UAX #14
              断行，逗号、句号、右括号不会落在行首， 2026-11-26 用脚本验过，不用另外处理。
            </>,
          ],
        ]}
      />
      <p>
        出处：kubai《999 个小技巧》第 007 期「中英文排版的 CSS 设置」，数值照原文。与旧规则不冲突；待用户定的见页尾。
      </p>

      <h2>演示</h2>
      <h3>中西文间距：不再手打空格</h3>
      <Compare off={<p style={{ textAutospace: 'no-autospace' }}>{MIXED}</p>} on={<p>{MIXED}</p>} />
      <h3>中文长段落：两端对齐</h3>
      <p>右边行长是 26 个字宽，每行一样齐。</p>
      <Compare off={<p style={{ maxWidth: '26em' }}>{LONG_ZH}</p>} on={<p data-zh-justify="">{LONG_ZH}</p>} />
      <h3>行首括号去半格</h3>
      <p>括号开头的行，左边那半格是空的，对不齐上一行。</p>
      <Compare
        off={
          <p style={{ textSpacingTrim: 'space-all' }}>
            三月报表
            <br />
            （含已平仓位）
            <br />
            「样本外」结果
          </p>
        }
        on={
          <p style={{ textSpacingTrim: 'trim-start' }}>
            三月报表
            <br />
            （含已平仓位）
            <br />
            「样本外」结果
          </p>
        }
      />
      <h3>换行标题：按词断行</h3>
      <p>框宽 9 个字：左边在任意两字之间断，右边只在词与词之间断。</p>
      <Compare off={<h4 style={{ wordBreak: 'normal' }}>{TITLE}</h4>} on={<h4 {...phrased(TITLE)} />} />
      <h3>变动的数字：等宽</h3>
      <p>数字一变，宽度不变，小数点才不乱跳。</p>
      <Compare
        off={
          <div className="gal-ts-nums" style={{ fontVariantNumeric: 'proportional-nums' }}>
            {PRICES.map((price) => (
              <div key={price}>{price}</div>
            ))}
          </div>
        }
        on={
          <div className="gal-ts-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {PRICES.map((price) => (
              <div key={price}>{price}</div>
            ))}
          </div>
        }
      />
      <h3>截断标签：缩得下，悬停出全文</h3>
      <p>
        左边 flex 子项没写 {code('min-width: 0')}，撑开了容器；右边缩下去，悬停 1 秒出全文（原生
        title，只在真被截断时才有）。
      </p>
      <Compare
        off={
          <div className="gal-ts-row">
            <i aria-hidden="true" />
            <div className="gal-ts-item" data-fixed="off">
              <span className="gal-ts-label">{LONG_LABEL}</span>
            </div>
            <b>3</b>
          </div>
        }
        on={
          <div className="gal-ts-row">
            <i aria-hidden="true" />
            <div className="gal-ts-item" data-fixed="on">
              <span className="gal-ts-label">{LONG_LABEL}</span>
            </div>
            <b>3</b>
          </div>
        }
      />

      <h2>待用户定</h2>
      <ul className="gal-list">
        <li>
          按钮、页签的 nowrap 是全局默认值（带 data-wrap 或里面有段落的除外）；觉得太宽可以收窄到只在 Button 件上写。
        </li>
        <li>BudouX 现在只在文档站；要进 EmptyState 与卡片标题，得先定怎么承担它的体积与传递依赖。</li>
        <li>installTruncationTitles() 要应用启动时调一次；KATANAview 那边另开票接上。</li>
      </ul>
    </>
  )
}

export const TYPESETTING_PAGES = {
  typesetting: { title: '中英排版开关', section: 'foundations', Body: TypesettingPage },
} as const
