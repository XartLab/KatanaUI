// SPDX-License-Identifier: MIT
// 组件截图够不够：快速模式用它决定能不能跳过整页 vr:fast。
// 规则：改动的每个源文件，连同 src 里所有（传递地）引用它的组件，都得被 browser/*.browser.test.tsx 直接截过；
// 每件一个的 theme/<件名>.css 跟它的件走。共用层（lib 被没截过的件用到、theme.css、tokens、gallery）就不够，照跑 vr:fast。
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'

const IMPORT = /(?:import|export)[^'"]*?from\s*['"](\.[^'"]+)['"]|import\s*['"](\.[^'"]+)['"]/g

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)],
  )
const importsOf = (file) =>
  [...readFileSync(file, 'utf8').matchAll(IMPORT)].map((m) => resolve(dirname(file), m[1] ?? m[2]))

/** Component files the screenshot tests render directly (package-relative). */
export function shotTargets(pkgDir) {
  const dir = join(pkgDir, 'browser')
  const out = new Set()
  for (const f of existsSync(dir) ? readdirSync(dir) : [])
    if (f.endsWith('.browser.test.tsx'))
      for (const t of importsOf(join(dir, f))) if (t.startsWith(join(pkgDir, 'src'))) out.add(relative(pkgDir, t))
  return out
}

/** True when the component screenshots alone cover every changed file. */
export function coveredByShots(pkgDir, changed) {
  const targets = shotTargets(pkgDir)
  // src 的反向引用图；桶文件（index.ts）与 a2ui 包装只转出，不算「引用它的组件」。
  const src = listFiles(join(pkgDir, 'src')).filter((f) => /\.(tsx?|mts)$/.test(f) && !/\.test\.tsx?$/.test(f))
  const dependents = new Map()
  for (const f of src) {
    const from = relative(pkgDir, f)
    if (basename(f).startsWith('index.') || from.startsWith('src/a2ui/')) continue
    for (const t of importsOf(f)) {
      const to = relative(pkgDir, t)
      dependents.set(to, [...(dependents.get(to) ?? []), from])
    }
  }
  const ok = (file) => {
    if (/\.test\.tsx?$/.test(file) || file.startsWith('browser/') || file.startsWith('.pixelgate-unit/')) return true
    const css = /^src\/theme\/(.+)\.css$/.exec(file)
    if (css) return [...targets].some((t) => basename(t, '.tsx') === css[1])
    if (!file.startsWith('src/') || !/\.(tsx?|mts)$/.test(file)) return false
    // 自己和所有传递引用者里，凡是组件（.tsx）都得被截过。
    const seen = new Set([file])
    const queue = [file]
    while (queue.length)
      for (const d of dependents.get(queue.shift()) ?? [])
        if (!seen.has(d)) {
          seen.add(d)
          queue.push(d)
        }
    return [...seen].filter((f) => f.endsWith('.tsx')).every((f) => targets.has(f))
  }
  return changed.every(ok)
}
