#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// verify-katanaui 的辅助脚本：起文档站开发服务器、诊断、驱动一条功能流程、截一页、清理。
// 用法见上一级的 SKILL.md。浏览器用仓库锁定的 @playwright/test（packages/react 的开发依赖），
// 但借系统 Chrome：锁定的 chromium-1194 在本机没装（见 SKILL.md 的 Gotchas）。
import { execFileSync, execSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '..', '..', '..', '..')
const pkg = path.join(repo, 'packages', 'react')
const isWin = process.platform === 'win32'
const HOST = '127.0.0.1'
const PORT = Number(process.env.KUI_PORT ?? 5196)
const BASE = `http://${HOST}:${PORT}`
const ROOT = path.resolve(process.env.KUI_VERIFY_DIR ?? path.join(repo, '.tmp', 'verify-katanaui'))
const RUN = path.join(ROOT, 'run')
const EVIDENCE = path.join(ROOT, 'evidence')
const STATE = path.join(RUN, 'server.json')
const DEV_LOG = path.join(RUN, 'dev.log')
const CHROME =
  process.env.KUI_CHROME ?? (isWin ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome')
const VIEWPORT = { width: 1100, height: 1500 }
// 干净的 main 上就有、跟被验的功能无关的控制台报错：记进 known，不判失败。加一条要写明在哪个提交上见到、票号。
const KNOWN_CONSOLE = [
  {
    pattern: /two children with the same key[\s\S]*decisions/,
    note: '文档站目录里 decisions 一组的 React key 重复（c9634db 上每页都报）',
  },
]

const requireFromPkg = createRequire(path.join(pkg, 'package.json'))

/** 本地时间的 YYYYMMDD-HHMMSS，给证据目录起名。 */
function stamp() {
  const d = new Date()
  const two = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const readState = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : null)
const head = () => git('rev-parse', '--short', 'HEAD')
function git(...args) {
  try {
    return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
  } catch {
    return '?'
  }
}
function alive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
const portFree = () =>
  new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(PORT, HOST)
  })

/** 进程表：pid → 父 pid。 */
function processTable() {
  const out = isWin
    ? execFileSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId) $($_.ParentProcessId)" }',
        ],
        { encoding: 'utf8' },
      )
    : execFileSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' })
  const table = new Map()
  for (const line of out.split(/\r?\n/)) {
    const [pid, ppid] = line.trim().split(/\s+/).map(Number)
    if (pid) table.set(pid, ppid)
  }
  return table
}

/** 在 PORT 上监听的进程 pid（找不到返回 null）。 */
function listenerPid() {
  try {
    if (isWin) {
      const out = execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' })
      for (const line of out.split(/\r?\n/)) {
        const cols = line.trim().split(/\s+/)
        if (cols[0] === 'TCP' && cols[1]?.endsWith(`:${PORT}`) && cols[3] === 'LISTENING') return Number(cols[4])
      }
      return null
    }
    const out = execFileSync('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8' })
    return Number(out.trim().split('\n')[0]) || null
  } catch {
    return null
  }
}

function isDescendant(pid, root, table) {
  for (let at = pid, hops = 0; at && hops < 64; at = table.get(at), hops++) if (at === root) return true
  return false
}

/** 起一个浏览器上下文：系统 Chrome、无头、中文、UTC，跟 e2e 的 use 一致。每次都是新的上下文，localStorage 是空的。 */
async function openBrowser({ headed = false, scrollbars = false } = {}) {
  const { chromium } = requireFromPkg('@playwright/test')
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: !headed,
    ...(scrollbars ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {}),
  })
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'zh-CN', timezoneId: 'UTC' })
  const page = await context.newPage()
  const errors = { page: [], console: [], known: [], noise: [] }
  page.on('pageerror', (error) => errors.page.push(String(error)))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const where = message.location()?.url ?? ''
    // 系统 Chrome 会请求 /favicon.ico，文档站没有：这一条是环境噪声，单独记，不算失败。
    const text = `${message.text()} @ ${where}`
    const known = KNOWN_CONSOLE.find((k) => k.pattern.test(text))
    if (/favicon\.ico/.test(where)) errors.noise.push(text)
    else if (known) errors.known.push(known.note)
    else errors.console.push(text)
  })
  return { browser, page, errors }
}

/** 打开文档站的一页（#/<id>），等它的预览容器 [data-gallery=<id>] 出来。 */
async function openPage(page, id, theme = 'graphite') {
  await page.goto(`${BASE}/?theme=${theme}#/${id}`)
  const section = page.locator(`[data-gallery="${id}"]`).first()
  await section.waitFor({ timeout: 90_000 })
  return section
}

async function cmdStart() {
  const state = readState()
  if (state && alive(state.pid)) {
    console.log(`已在运行：pid ${state.pid}，${state.base}。先 stop 再 start。`)
    process.exit(1)
  }
  if (!(await portFree())) {
    console.error(
      `端口 ${PORT} 被别的进程占着（pid ${listenerPid() ?? '?'}），不是这次起的，不碰它。换 KUI_PORT 再起。`,
    )
    process.exit(2)
  }
  fs.mkdirSync(RUN, { recursive: true })
  const log = fs.openSync(DEV_LOG, 'w')
  // `pnpm dev` 就是这两步：先 tokens:sync，再 vp dev。分开跑：经 pnpm.exe 起的话，Windows 上 vp 的输出进了 pnpm
  // 自己开的控制台，日志文件是空的；直接用 node 起 vp，进程树的根就是服务本身。
  execSync('pnpm --filter @katana-ui/tokens run tokens:sync', { cwd: pkg, stdio: ['ignore', log, log] })
  const vp = path.join(pkg, 'node_modules', 'vite-plus', 'bin', 'vp')
  const child = spawn(process.execPath, [vp, 'dev', '--host', HOST, '--port', String(PORT), '--strictPort'], {
    cwd: pkg,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
  })
  child.unref()
  const info = {
    pid: child.pid,
    port: PORT,
    base: BASE,
    cwd: pkg,
    head: head(),
    branch: git('branch', '--show-current'),
    startedAt: new Date().toISOString(),
  }
  fs.writeFileSync(STATE, JSON.stringify(info, null, 2))
  console.log(`起了：pid ${info.pid}，日志 ${DEV_LOG}`)

  const deadline = Date.now() + 180_000
  let httpOk = false
  while (Date.now() < deadline && alive(child.pid)) {
    try {
      const response = await fetch(`${BASE}/`)
      if (response.ok && (await response.text()).includes('KatanaUI components')) {
        httpOk = true
        break
      }
    } catch {
      // 还没监听，接着等。
    }
    await sleep(1000)
  }
  if (!httpOk) {
    console.error(`没就绪：${BASE}/ 不应答。日志最后 20 行：`)
    console.error(fs.readFileSync(DEV_LOG, 'utf8').split('\n').slice(-20).join('\n'))
    process.exit(1)
  }
  // 能应答不等于能用：第一次打开要编译整个文档站，等第一页的预览真的画出来才算就绪。
  const started = Date.now()
  const { browser, page, errors } = await openBrowser()
  try {
    await openPage(page, 'button')
  } finally {
    await browser.close()
  }
  console.log(`就绪：${BASE}/#/button 画出来了（首次编译 ${Math.round((Date.now() - started) / 1000)} 秒）`)
  if (errors.page.length) console.log(`页面异常：${errors.page.join(' | ')}`)
}

async function cmdDoctor() {
  const checks = []
  const check = (name, ok, detail) => checks.push({ name, ok, detail })
  check('repo', true, `${git('branch', '--show-current')} @ ${head()}`)
  const state = readState()
  check('state', !!state, state ? STATE : `没有 ${STATE}：不是这个技能起的，或已经 stop`)
  check('pid', !!state && alive(state.pid), state ? `pid ${state.pid}` : '-')
  const listener = listenerPid()
  const ours = !!state && !!listener && isDescendant(listener, state.pid, processTable())
  check(
    'port',
    ours,
    listener ? `:${PORT} 由 pid ${listener} 监听，${ours ? '是' : '不是'}这次起的进程树` : `:${PORT} 没人监听`,
  )
  if (state) check('head', state.head === head(), `起服务时 ${state.head}，现在 ${head()}`)
  check('chrome', fs.existsSync(CHROME), CHROME)
  const pw = JSON.parse(fs.readFileSync(path.join(pkg, 'node_modules/@playwright/test/package.json'), 'utf8'))
  check('playwright', true, `@playwright/test ${pw.version}`)
  let httpOk = false
  try {
    const response = await fetch(`${BASE}/`)
    httpOk = response.ok && (await response.text()).includes('KatanaUI components')
    check('http', httpOk, `GET ${BASE}/ → ${response.status}`)
  } catch (error) {
    check('http', false, `GET ${BASE}/ 失败：${error.cause?.code ?? error.message}`)
  }
  if (httpOk && ours) {
    const { browser, page, errors } = await openBrowser()
    try {
      await openPage(page, 'button')
      check('render', true, `#/button 画出来了，data-theme=${await page.locator('html').getAttribute('data-theme')}`)
      check('errors', errors.page.length === 0 && errors.console.length === 0, JSON.stringify(errors))
      if (errors.known.length) console.log(`已知报错（不算失败）：${[...new Set(errors.known)].join('；')}`)
    } catch (error) {
      check('render', false, error.message.split('\n')[0])
    } finally {
      await browser.close()
    }
  }
  for (const { name, ok, detail } of checks) console.log(`${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(10)} ${detail}`)
  process.exit(checks.every((c) => c.ok) ? 0 : 1)
}

/** 截一页：预览区截图 + 预览区的 ARIA 快照，放进 evidence/<时间>-shot-<id>/。 */
async function cmdShot(id, flags) {
  if (!id) throw new Error('用法：shot <页 id> [--theme console] [--full]')
  const dir = path.join(EVIDENCE, `${stamp()}-shot-${id}`)
  fs.mkdirSync(dir, { recursive: true })
  const { browser, page, errors } = await openBrowser(flags)
  try {
    const section = await openPage(page, id, flags.theme)
    await section.screenshot({ path: path.join(dir, `${id}.png`) })
    if (flags.full) await page.screenshot({ path: path.join(dir, `${id}-page.png`), fullPage: true })
    fs.writeFileSync(path.join(dir, `${id}.aria.yml`), await section.ariaSnapshot())
    fs.writeFileSync(path.join(dir, 'errors.json'), JSON.stringify(errors, null, 2))
  } finally {
    await browser.close()
  }
  console.log(dir)
}

const cell = (value) => String(typeof value === 'string' ? value : JSON.stringify(value)).replaceAll('|', '\\|')

/** 驱动一条流程（flows/<名>.mjs）：每一步记「做了什么 → 看到什么」，每步一张截图，失败时多截一张 fail.png。 */
async function cmdDrive(name, flags) {
  const flowsDir = path.join(here, 'flows')
  const file = path.join(flowsDir, `${name}.mjs`)
  if (!name || !fs.existsSync(file)) {
    const known = fs.readdirSync(flowsDir).map((f) => f.replace(/\.mjs$/, ''))
    throw new Error(`用法：drive <流程>，可选：${known.join(', ')}`)
  }
  const flow = (await import(pathToFileURL(file).href)).default
  const dir = path.join(EVIDENCE, `${stamp()}-${name}`)
  fs.mkdirSync(dir, { recursive: true })
  const { expect } = requireFromPkg('@playwright/test')
  const { browser, page, errors } = await openBrowser(flags)
  const steps = []
  let failure = null
  const step = async (title, act) => {
    const n = String(steps.length + 1).padStart(2, '0')
    const shot = `${n}-${title.replaceAll(/[^\w\u4e00-\u9fa5-]+/g, '-').slice(0, 40)}.png`
    const record = { n, title, observed: null, shot }
    steps.push(record)
    record.observed = (await act()) ?? 'ok'
    await page.screenshot({ path: path.join(dir, shot) })
    console.log(`  ${n} ${title} → ${cell(record.observed)}`)
  }
  const aria = async (locator, file) => fs.writeFileSync(path.join(dir, file), await locator.ariaSnapshot())
  console.log(`drive ${name}（${flow.title}）`)
  try {
    const section = await openPage(page, flow.page, flags.theme)
    await flow.run({ page, section, step, expect, aria })
  } catch (error) {
    failure = error.message.split('\n').slice(0, 8).join('\n')
    await page.screenshot({ path: path.join(dir, 'fail.png') }).catch(() => {})
  } finally {
    await browser.close()
  }
  const pass = !failure && errors.page.length === 0 && errors.console.length === 0
  const url = `${BASE}/?theme=${flags.theme ?? 'graphite'}#/${flow.page}`
  const result = { flow: name, title: flow.title, url, head: head(), pass, failure, errors, steps }
  fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(result, null, 2))
  const lines = [
    `# ${flow.title}`,
    '',
    `- 结果：${pass ? 'PASS' : 'FAIL'}`,
    `- 页：${url}`,
    `- 提交：${result.head}`,
    '',
    '| # | 做了什么 | 看到什么 | 截图 |',
    '| --- | --- | --- | --- |',
    ...steps.map((s) => `| ${s.n} | ${cell(s.title)} | ${cell(s.observed)} | ${s.shot} |`),
  ]
  if (failure) lines.push('', '## 失败', '', '```', failure, '```')
  if (errors.page.length || errors.console.length) {
    lines.push('', '## 页面报错', '', '```', JSON.stringify(errors, null, 2), '```')
  }
  if (errors.known.length) lines.push('', `已知报错（不算失败）：${[...new Set(errors.known)].join('；')}。`)
  if (errors.noise.length) lines.push('', `环境噪声（不算失败）：${errors.noise.length} 条 favicon 404。`)
  fs.writeFileSync(path.join(dir, 'report.md'), lines.join('\n') + '\n')
  console.log(`${pass ? 'PASS' : 'FAIL'} ${dir}`)
  if (failure) console.log(failure)
  process.exit(pass ? 0 : 1)
}

async function cmdStop() {
  const state = readState()
  if (!state) {
    console.log(`没有 ${STATE}：没有这个技能起的服务。别的进程不碰。`)
    return
  }
  if (alive(state.pid)) {
    // 只停这次起的那棵进程树（pnpm → vp → node），不按进程名杀。
    if (isWin) execFileSync('taskkill', ['/PID', String(state.pid), '/T', '/F'], { stdio: 'ignore' })
    else process.kill(-state.pid, 'SIGTERM')
  }
  for (let i = 0; i < 30 && !(await portFree()); i++) await sleep(500)
  fs.mkdirSync(EVIDENCE, { recursive: true })
  if (fs.existsSync(DEV_LOG)) fs.copyFileSync(DEV_LOG, path.join(EVIDENCE, `dev-${stamp()}.log`))
  fs.rmSync(RUN, { recursive: true, force: true })
  const free = await portFree()
  console.log(`停了 pid ${state.pid} 的进程树；:${PORT} ${free ? '已空出' : '仍被占着'}。证据留在 ${EVIDENCE}`)
  if (!free) process.exit(1)
}

// 本机跑仓库自带 e2e 规格用的配置：锁定的 chromium-1194 没装，借系统 Chrome。是验证脚手架，跑完就删，不提交。
const PW_LOCAL = `// 验证脚手架（verify-katanaui 的 kui.mjs e2e 写的），跑完自动删，不提交。
import base from './playwright.config.ts'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  ...base,
  use: { ...base.use, launchOptions: { executablePath: ${JSON.stringify(CHROME)} } },
})
`

/** 跑仓库自带的 e2e 规格（packages/react/e2e/）当补充证据：它自己打包文档站、用 vp preview 起在 PORT+1 上。 */
function cmdE2e(args) {
  if (!args.length) throw new Error('用法：e2e <e2e/某.spec.ts> [playwright 的其余参数，如 -g "列优先级"]')
  const config = path.join(pkg, '.pw-local.config.ts')
  const existed = fs.existsSync(config)
  if (!existed) fs.writeFileSync(config, PW_LOCAL)
  const quoted = args.map((a) => (/[\s"]/.test(a) ? `"${a.replaceAll('"', '\\"')}"` : a)).join(' ')
  try {
    execSync(`pnpm exec playwright test -c .pw-local.config.ts ${quoted}`, {
      cwd: pkg,
      stdio: 'inherit',
      env: { ...process.env, E2E_PORT: String(PORT + 1) },
    })
  } catch (error) {
    process.exitCode = error.status ?? 1
  } finally {
    if (!existed) fs.rmSync(config)
  }
}

function parseFlags(args) {
  const flags = {}
  const rest = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--theme') flags.theme = args[++i]
    else if (arg === '--headed') flags.headed = true
    else if (arg === '--full') flags.full = true
    else if (arg === '--scrollbars') flags.scrollbars = true
    else rest.push(arg)
  }
  return { flags, rest }
}

const [command, ...args] = process.argv.slice(2)
const { flags, rest } = parseFlags(args)
const commands = {
  start: cmdStart,
  doctor: cmdDoctor,
  shot: () => cmdShot(rest[0], flags),
  drive: () => cmdDrive(rest[0], flags),
  stop: cmdStop,
  e2e: () => cmdE2e(rest),
}
if (!commands[command]) {
  console.log(
    '用法：node .claude/skills/verify-katanaui/scripts/kui.mjs <start|doctor|drive <流程>|shot <页 id>|e2e <规格>|stop>',
  )
  process.exit(command ? 1 : 0)
}
try {
  await commands[command]()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
