#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// 快速模式（用户 2026-11-18：「速度太慢，得要 fast 模式」）：平时改完只查改动波及的那一圈，全量留到合并前（pnpm test、pnpm test:e2e、pnpm vr）。
// 步骤：改动文件的格式与 lint → 类型检查（全量，约 9 秒）→ 受影响的单测（vitest --changed）→ 受影响页的 e2e（按页 id 在用例源码里挑）→ vr:fast。
// 用法：pnpm fast [--base <ref>] [--no-e2e] [--no-vr] [--pages]（--pages：有组件截图也照跑整页 vr:fast）；任何一步失败就停，退出码非 0。
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { browserTestPlan, gitDiffOf, shotPlan } from './shot-coverage.mjs'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const has = (name) => args.includes(name)
const base = has('--base') ? args[args.indexOf('--base') + 1] : 'HEAD'

// 预算：快速模式一分钟跑不完就是 bug（用户 2026-11-18）。超了照样报通过与否，但退出码非 0，并点名最慢的一步。
const BUDGET_S = 60
const startedAll = Date.now()
const timings = []
const run = (label, cmd, cmdArgs, extraEnv = {}) => {
  const started = Date.now()
  process.stdout.write(`\n== ${label} ==\n`)
  const result = spawnSync(cmd, cmdArgs, { cwd: pkgDir, stdio: 'inherit', env: { ...process.env, ...extraEnv } })
  const secs = ((Date.now() - started) / 1000).toFixed(1)
  if (result.status !== 0) {
    process.stdout.write(`✗ ${label} 失败（${secs}s）\n`)
    process.exit(result.status ?? 1)
  }
  timings.push([label, Number(secs)])
  process.stdout.write(`✓ ${label}（${secs}s）\n`)
}
const capture = (cmd, cmdArgs) => spawnSync(cmd, cmdArgs, { cwd: pkgDir, encoding: 'utf8' }).stdout ?? ''

// 改动文件：相对 base 的已跟踪改动 + 未跟踪的新文件，只留本包里的。
const root = capture('git', ['rev-parse', '--show-toplevel']).trim()
const prefix = pkgDir.slice(root.length + 1) + '/'
const changed = [
  ...capture('git', ['diff', '--name-only', base]).split('\n'),
  ...capture('git', ['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .map((f) => prefix + f),
]
  .filter((f) => f.startsWith(prefix))
  .map((f) => f.slice(prefix.length))
  .filter((f, i, all) => f && all.indexOf(f) === i)
if (changed.length === 0) {
  process.stdout.write('没有改动，跳过。\n')
  process.exit(0)
}
process.stdout.write(`改动 ${changed.length} 个文件\n`)

const lintable = changed.filter((f) => /\.(m?[jt]sx?|css|json)$/.test(f) && !f.startsWith('.pixelgate/'))
// 只改了 CSS / JSON 时没有 lint 能查的文件，vp check 会报 "Linting could not start"：这时只跑 fmt --check。
const scripts = lintable.filter((f) => /\.m?[jt]sx?$/.test(f))
if (scripts.length) run('格式与 lint（只查改动文件）', 'pnpm', ['exec', 'vp', 'check', ...lintable])
else if (lintable.length)
  run('格式（只改了 CSS / JSON，没有可 lint 的文件）', 'pnpm', ['exec', 'vp', 'fmt', '--check', ...lintable])
run('类型检查（Vite+ 任务缓存，没改就秒过）', 'pnpm', ['exec', 'vp', 'run', 'tsc'])
run('受影响的单测', 'pnpm', ['exec', 'vp', 'test', 'run', '--changed', base, '--passWithNoTests'])
// 组件级截图（Vitest 浏览器模式 + pixelgate，browser/*.browser.test.tsx）：直接在浏览器里渲染件，不构建整站。
// 不用 vitest --changed：演示文件从 src/index 这类桶引件，桶一动所有截图都算「相关」。按件名挑：改动的件与（传递）引用它的件。
const plan = shotPlan(pkgDir, changed)
// 改了截图测试本身：只跑改动落到的那几个 test（落在 test 之外就是那个文件的全部）；底座（render、open-frame、浏览器配置）改了才退回代表件。#201：原来一改就整套，约 6 分钟。
const bt = browserTestPlan(pkgDir, changed, gitDiffOf(pkgDir, base))
const browserTests = readdirSync(join(pkgDir, 'browser')).filter((f) => f.endsWith('.browser.test.tsx'))
const shotArgs = ['exec', 'vp', 'test', 'run', '-c', 'vitest.browser.config.ts']
const REPRESENTATIVE = [
  'button',
  'input',
  'select',
  'dialog',
  'tabs',
  'toggle-group',
  'tag',
  'kbd',
  'led',
  'lcd',
  'toast',
  'chip-group',
  'date-range-picker',
  'data-grid',
  'news-feed',
  'status-bar',
  'panel-frame',
  'sparkline',
  'metric-card',
  'quote-table',
  'watchlist',
  'market-heatmap',
  'event-calendar',
  'equity-curve',
  'treemap',
  'ai-approval',
]
const hasTest = (text, n) => new RegExp(`['"\`]${n}['"\`]|^\\s*${n}\\s*:`, 'm').test(text)
const testTexts = new Map(browserTests.map((f) => [f, readFileSync(join(pkgDir, 'browser', f), 'utf8')]))
const wanted = new Set([...plan.names, ...bt.names])
if (bt.shared) for (const n of REPRESENTATIVE) if ([...testTexts.values()].some((t) => hasTest(t, n))) wanted.add(n)
// 认不出测试名的截图测试文件改了：整个文件的 Graphite 都跑（少见，名字都认不出时只能这样）。
if (bt.unnamed.size)
  run('组件截图（改了认不出测试名的截图测试：整个文件 · Graphite）', 'pnpm', [
    ...shotArgs,
    ...bt.unnamed,
    '-t',
    '^graphite',
  ])
if (wanted.size) {
  // 预算：一张约 0.6–1.2 秒，最多截 MAX_SHOTS 个件。波及更多（改了 lib、原语这类底层）就截代表件（与波及的取交集，不够再从波及的里补），
  // 其余留给合并前的整套。改动正好落到的 test 排最前，不会被代表件挤掉。
  const MAX_SHOTS = 30
  const all = [...wanted]
  const names =
    all.length <= MAX_SHOTS
      ? all
      : [...new Set([...bt.precise, ...REPRESENTATIVE.filter((n) => wanted.has(n)), ...all])].slice(0, MAX_SHOTS)
  if (names.length < all.length)
    process.stdout.write(
      `\n（波及 ${all.length} 个件，快速模式截其中 ${names.length} 个代表件；合并前整套截图会全截）\n`,
    )
  if (bt.shared) process.stdout.write('\n（改了截图测试的共用底座：截代表件，不跑整套；合并前整套截图会全截）\n')
  const themed = changed.some((f) => /^src\/theme\/(theme|tokens)\.css$/.test(f) || f.includes('tokens'))
  const themes = themed ? 'graphite|console' : 'graphite'
  // 改动的测试文件里的名字只在改动的文件里找（别的文件里同名的件不拖进来）；波及的件按名字在所有文件里找。
  const files = browserTests.filter((f) =>
    names.some(
      (n) =>
        (bt.files.includes(`browser/${f}`) && bt.names.has(n)) ||
        ((plan.names.has(n) || bt.shared) && hasTest(testTexts.get(f), n)),
    ),
  )
  // 快速模式只截 Graphite；改了主题或令牌才两个主题都截（Console 留给合并前的整套）。
  // Vitest 拼全名用 ' > '（「graphite > lcd」）。另写一份 JSON 报告：一张都没跑到算失败，免得名字对不上时假通过。
  const report = join(pkgDir, 'node_modules', '.cache', 'fast-shots.json')
  run(`组件截图（${names.length} 个件 · ${themes.replace('|', ' + ')}）`, 'pnpm', [
    ...shotArgs,
    ...files.map((f) => `browser/${f}`),
    '-t',
    `(${themes}) > (${names.join('|')})$`,
    '--reporter=default',
    '--reporter=json',
    `--outputFile.json=${report}`,
  ])
  const ran = JSON.parse(readFileSync(report, 'utf8')).numPassedTests
  if (!ran) {
    process.stdout.write(`✗ 组件截图一张都没跑到（测试名对不上：${names.join(', ')}）\n`)
    process.exit(1)
  }
}

// 受影响的页：复用 vr-fast 的映射（--dry 只打印页名，不截图）。
const dry = capture('node', ['scripts/vr-fast.mjs', '--dry', ...(has('--base') ? ['--base', base] : [])])
const pageIds = [...new Set([...dry.matchAll(/(?:graphite|console)--([a-z0-9-]+)/g)].map((m) => m[1]))].filter(
  (id) => !id.startsWith('shell-'),
)
// e2e 只跑改动的件自己那页（页 id = 文件名）：引用它的那些页，样子已由组件截图查过，行为留给合并前的全量 e2e。
// 认不出自己那页时（改的是 model、hook……）才退回波及的页，最多 3 页。
const own = new Set(changed.map((f) => /([a-z0-9-]+?)(?:-model)?\.(?:tsx?|css)$/.exec(f)?.[1]).filter(Boolean))
// 页 id 取文档站目录（registry.ts 里的 id: '…'），不经 vr-fast 的页单（共用层时它只列代表页）。
const registryIds = new Set(
  [...readFileSync(join(pkgDir, 'gallery', 'registry.ts'), 'utf8').matchAll(/^\s+id: '([a-z0-9-]+)',/gm)].map(
    (m) => m[1],
  ),
)
const ownIds = [...own].filter((id) => registryIds.has(id))
const ids = ownIds.length ? ownIds : pageIds.length <= 3 ? pageIds : []

// 共用层改动（vr-fast 提示「共用层」）波及面太大，快速模式不跑 e2e，提示合并前跑全量。
// 改动的件自己有页时照跑那页的 e2e（Lcd 被很多页用到也算共用层，但它自己那页的行为要查）。
const shared = dry.includes('共用层') && !ownIds.length
if (shared) process.stdout.write('\n（共用层改动：快速模式跳过 e2e，合并前请跑 pnpm test:e2e）\n')
if (!has('--no-e2e') && ids.length && !shared) {
  // e2e 用例名是中文，没法按页 id 过滤；在用例源码里找提到这些页 id 的 test(...)，取它们的标题拼成 -g。
  // 各页的专属用例分在 e2e/ 下几个 spec 里（ui-gallery.spec.ts 与按组拆出来的）；a11y 与 happo 是全站扫，不按页挑。
  const specs = readdirSync(join(pkgDir, 'e2e')).filter(
    (f) => f.endsWith('.spec.ts') && !/^ui-gallery-(a11y|happo)\./.test(f),
  )
  const titles = new Set()
  const files = new Set()
  for (const file of specs) {
    const spec = readFileSync(join(pkgDir, 'e2e', file), 'utf8')
    const starts = [...spec.matchAll(/\btest\(\s*(['`])((?:\\.|(?!\1).)*)\1/g)]
    starts.forEach((m, i) => {
      const body = spec.slice(m.index, starts[i + 1]?.index ?? spec.length)
      if (ids.some((id) => body.includes(`'${id}'`) || body.includes(`"${id}"`) || body.includes(`#/${id}`))) {
        titles.add(m[2])
        files.add(`e2e/${file}`)
      }
    })
  }
  if (titles.size === 0) process.stdout.write('\n（受影响的页没有专属 e2e 用例，跳过 e2e）\n')
  else if (titles.size > 15)
    process.stdout.write(`\n（波及 ${titles.size} 条 e2e，太多：快速模式跳过，合并前请跑 pnpm test:e2e）\n`)
  else {
    // 标题里的模板占位（如 ${theme}）当任意字符；其余字面量转义。
    const literal = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const grep = [...titles]
      .map((t) =>
        t
          .split(/\$\{[^}]*\}/)
          .map(literal)
          .join('.*'),
      )
      .join('|')
    run(
      `受影响的 e2e（${titles.size} 条，dpr-1）`,
      'pnpm',
      ['exec', 'playwright', 'test', ...files, '--project=dpr-1', '--workers=2', '-g', grep],
      {
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers',
      },
    )
  }
}
// 改动全落在有组件截图的件上：组件截图已经比过像素，整页 vr:fast（先构建整站，约 50 秒）留给合并前的全量。
if (!has('--no-vr') && !has('--pages') && plan.covered)
  process.stdout.write('\n改动都在有组件截图的件上：跳过整页 vr:fast（--pages 强制跑；合并前全量 pnpm vr 会跑）。\n')
else if (!has('--no-vr'))
  run('视觉回归（vr:fast）', 'node', ['scripts/vr-fast.mjs', ...(has('--base') ? ['--base', base] : [])])
const total = (Date.now() - startedAll) / 1000
if (total > BUDGET_S) {
  const [slowLabel, slowSecs] = timings.toSorted((a, b) => b[1] - a[1])[0] ?? ['?', 0]
  process.stdout.write(
    `\n✗ 快速模式用了 ${total.toFixed(1)} 秒，超过 ${BUDGET_S} 秒预算——这是 bug。最慢的一步：${slowLabel}（${slowSecs}s）。\n`,
  )
  process.exit(1)
}
process.stdout.write(
  `\n快速模式通过（${total.toFixed(1)} 秒，预算 ${BUDGET_S} 秒）。合并前再跑一次全量：pnpm test && pnpm test:e2e && pnpm vr\n`,
)
