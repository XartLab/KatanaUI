#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// 快速模式（用户 2026-11-18：「速度太慢，得要 fast 模式」）：平时改完只查改动波及的那一圈，全量留到合并前（pnpm test、pnpm test:e2e、pnpm vr）。
// 步骤：改动文件的格式与 lint → 类型检查（全量，约 9 秒）→ 受影响的单测（vitest --changed）→ 受影响页的 e2e（按页 id 在用例源码里挑）→ vr:fast。
// 用法：pnpm fast [--base <ref>] [--no-e2e] [--no-vr] [--pages]（--pages：有组件截图也照跑整页 vr:fast）；任何一步失败就停，退出码非 0。
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { shotPlan } from './shot-coverage.mjs'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const has = (name) => args.includes(name)
const base = has('--base') ? args[args.indexOf('--base') + 1] : 'HEAD'

const run = (label, cmd, cmdArgs, extraEnv = {}) => {
  const started = Date.now()
  process.stdout.write(`\n== ${label} ==\n`)
  const result = spawnSync(cmd, cmdArgs, { cwd: pkgDir, stdio: 'inherit', env: { ...process.env, ...extraEnv } })
  const secs = ((Date.now() - started) / 1000).toFixed(1)
  if (result.status !== 0) {
    process.stdout.write(`✗ ${label} 失败（${secs}s）\n`)
    process.exit(result.status ?? 1)
  }
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
const browserTests = readdirSync(join(pkgDir, 'browser')).filter((f) => f.endsWith('.browser.test.tsx'))
const shotArgs = ['exec', 'vp', 'test', 'run', '-c', 'vitest.browser.config.ts']
if (plan.browserTestsChanged)
  run('组件截图（改了截图测试：整套）', 'pnpm', [...shotArgs, ...browserTests.map((f) => `browser/${f}`)])
else if (plan.names.size) {
  const names = [...plan.names]
  const files = browserTests.filter((f) =>
    names.some((n) =>
      new RegExp(`['"\`]${n}['"\`]|^\\s*${n}\\s*:`, 'm').test(readFileSync(join(pkgDir, 'browser', f), 'utf8')),
    ),
  )
  run(`组件截图（${names.length} 个件）`, 'pnpm', [
    ...shotArgs,
    ...files.map((f) => `browser/${f}`),
    '-t',
    `(^| )(${names.join('|')})$`,
  ])
}

// 受影响的页：复用 vr-fast 的映射（--dry 只打印页名，不截图）。
const dry = capture('node', ['scripts/vr-fast.mjs', '--dry', ...(has('--base') ? ['--base', base] : [])])
const ids = [...new Set([...dry.matchAll(/(?:graphite|console)--([a-z0-9-]+)/g)].map((m) => m[1]))].filter(
  (id) => !id.startsWith('shell-'),
)

// 共用层改动（vr-fast 提示「共用层」）波及面太大，快速模式不跑 e2e，提示合并前跑全量。
const shared = dry.includes('共用层')
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
  else if (titles.size > 40)
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
      ['exec', 'playwright', 'test', ...files, '--project=dpr-1', '--workers=4', '-g', grep],
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
process.stdout.write('\n快速模式通过。合并前再跑一次全量：pnpm test && pnpm test:e2e && pnpm vr\n')
