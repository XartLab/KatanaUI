// SPDX-License-Identifier: MIT
// 生成 registry.json（shadcn registry 的清单，shadcn 4.22.2 的 schema；`pnpm --filter @katana-ui/react registry:build` 先跑它再跑 `shadcn build`）。
// 清单由脚本从源码与文档站的页数据（gallery/registry.ts：每个 item 的说明读它的页）生成，不手写：每个源文件一项（文件名短横线小写就是 item 名），registryDependencies 与 npm dependencies 从 import 扫出来，不会漏。
// 约定（#1862 定）：
//   type：primitives/ → registry:ui；lib/、quant/format/、katana/ 的纯函数 → registry:lib；patterns/、quant/、katana/、blocks/ 的件 → registry:component；`style`（token、主题、动效）→ registry:style。
//   命名：`@katana/<文件名>`；同名冲突在源码里就不许有（每层文件名唯一，单测查）。
//   落点：每个文件的 target 保持包内的相对结构（~/src/katana/ui/<层>/<文件>），所以件之间的相对 import 与 theme.css 里的 @source 路径在别的项目里原样有效。
// 用法：node scripts/registry-json.mjs           写 registry.json
//       node scripts/registry-json.mjs --check   与已提交的比对，不一样退出 1
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
const TARGET_ROOT = '~/src/katana/ui'

/**
 * 不是组件的 item（样式入口、工具、内部拼件用的零件）的说明：文档站没有它们的页。
 * 有页的件，说明读页数据（gallery/registry.ts 的 PAGES.summary），这里不写第二份。
 */
const INTERNAL = {
  style: '设计 token（Console 与 Graphite 两个主题、红涨绿跌切换）、Tailwind v4 主题与动效 CSS。ui.css 最后引。',
  cn: 'shadcn-ui/cn 引擎（替 clsx 加 tailwind-merge），认得 k-text-* 字号档。',
  focus: '各控件共用的焦点环类名。',
  motion: '三条弹簧参数（snappy、gentle、settle），给 motion/react 用。',
  spring: '把三条弹簧的停止阈值收到 0.001，给 scale、opacity、pathLength 这类 0 到 1 的量用。',
  'hover-intent': '悬停意图：停一会儿才开、离开等一会儿再收、键盘聚焦立即开的钩子。',
  'code-highlight': 'CodeBlock 用的小型词法切分：注释、字符串、数字、关键字、函数、标点（纯函数，不加依赖）。',
  'matrix-orb-model': 'MatrixOrb 的纯数学：某状态下圆盘上一点在某一时刻的亮度。',
  'step-player-model': 'StepPlayer 的纯逻辑：一步放完后是前进、循环还是结束。',
  overlay: '浮层内容的 Portal 包装：平时挂到 body，包在 InlineOverlays 里时原地渲染（静态预览用）。',
  'hover-open': '悬停打开弹层、延迟关闭的钩子。',
  'menu-any': '同一份菜单内容既能下拉又能右键时，按种类挑对应的零件。',
  'menu-kind': '告诉菜单零件自己在哪一种菜单里的上下文。',
  'menu-parts': '菜单共用的容器、行、分隔线与勾选列样式。',
  'tone-text': 'ChangeText 与 PnlText 共用的底：方向到颜色与箭头。',
  'date-time-model': 'DateTimeInput 的解析与格式化（纯函数）。',
  'number-field-model': 'NumberInput 的解析与取整（纯函数）。',
  'number-expression': 'NumberInput 的算式输入：+10%、*2、100*1.5 按当前值算（纯函数，不用 eval）。',
  'hold-model': 'HoldToConfirm 的进度规则：按住填满、松手退回的时长与每帧推进（纯函数）。',
  'loading-gate': 'Loading 的计时与行数量取（纯函数）。',
  'opener-focus': '对话框与抽屉共用：关闭后把焦点还给打开前拿着它的元素。',
  label: 'Radix Label，Field 用它做标签（文档站在 field 页）。',
  'loading-wait': 'Loading 的计时外壳：500ms、2s、10s 三个阶段。',
}

const read = (rel) => readFileSync(join(pkgDir, rel), 'utf8')
const listDir = (rel) => (existsSync(join(pkgDir, rel)) ? readdirSync(join(pkgDir, rel)).sort(compare) : [])
function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

/** 源文件 → item 的描述（不含依赖）。 */
function collectItems() {
  const items = []
  const add = (name, type, files, extra = {}) => items.push({ name, type, files, ...extra })
  const isCode = (f) => /\.(?:tsx?|json)$/.test(f) && !/\.test\./.test(f)
  const byFile = (dir, type, filter = isCode) =>
    listDir(dir)
      .filter((f) => filter(f) && !f.endsWith('.json'))
      .forEach((f) => add(f.replace(/\.[^.]+$/, ''), type, [`${dir}/${f}`]))

  add(
    'style',
    'registry:style',
    [
      'src/ui.css',
      'src/tokens.css',
      'src/theme/theme.css',
      ...listDir('src/theme')
        .filter((f) => f.endsWith('.css') && f !== 'theme.css')
        .map((f) => `src/theme/${f}`),
    ],
    {
      fileType: 'registry:file',
      extraDependencies: [
        `tailwindcss@${pkg.dependencies.tailwindcss}`,
        `@katana-ui/tokens@${pkg.peerDependencies['@katana-ui/tokens']}`,
      ],
    },
  )
  for (const f of listDir('src/lib').filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))) {
    const name = f.replace(/\.tsx?$/, '')
    add(name, 'registry:lib', [`src/lib/${f}`])
  }
  byFile('src/primitives', 'registry:ui')
  // katana/ 自有的件：带 JSX 的是 component，纯函数（解析、计时）是 lib。
  for (const f of listDir('src/katana').filter(isCode)) {
    add(f.replace(/\.[^.]+$/, ''), f.endsWith('.tsx') ? 'registry:component' : 'registry:lib', [`src/katana/${f}`])
  }
  byFile('src/patterns', 'registry:component')
  if (existsSync(join(pkgDir, 'src/quant'))) {
    byFile('src/quant', 'registry:component', (f) => isCode(f) && f !== 'index.ts')
    // 格式化函数：src/quant/format/*.ts 合成一项，件依赖它。
    const format = listDir('src/quant/format').filter((f) => f.endsWith('.ts') && !/\.test\./.test(f))
    if (format.length)
      add(
        'quant-format',
        'registry:lib',
        format.map((f) => `src/quant/format/${f}`),
      )
  }
  // blocks/：拼面板用的积木（#1869）。数据表与工具条各自一个子目录合成一项，空态、估算标记一文件一项。
  if (existsSync(join(pkgDir, 'src/blocks'))) {
    const codeIn = (dir) => listDir(dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))
    add(
      'data-grid',
      'registry:component',
      codeIn('src/blocks/data-grid').map((f) => `src/blocks/data-grid/${f}`),
    )
    add(
      'toolbar',
      'registry:component',
      codeIn('src/blocks/toolbar').map((f) => `src/blocks/toolbar/${f}`),
    )
    byFile('src/blocks', 'registry:component', (f) => isCode(f) && f !== 'index.ts')
  }
  return items
}

/** 页数据（文档站的 PAGES）：说明与「哪一页覆盖哪些出口」只写在那里。node 直接载入 .ts（registry.ts 只有类型与常量，没有引入）。 */
async function loadPages() {
  const { PAGES } = await import(pathToFileURL(join(pkgDir, 'gallery/registry.ts')).href)
  return PAGES
}

/** 某个源文件里声明了（或转出了）这个名字吗。 */
const declares = (source, name) =>
  new RegExp(`export\\s+(?:default\\s+)?(?:async\\s+)?(?:function|const|class|type|interface|let)\\s+${name}\\b`).test(
    source,
  ) || new RegExp(`export\\s*(?:type\\s*)?\\{[^}]*\\b${name}\\b[^}]*\\}`).test(source)

const IMPORT = /(?:from|import)\s+['"]([^'"]+)['"]/g

export async function buildRegistry() {
  const items = collectItems()
  const pages = await loadPages()
  const owner = new Map() // 文件 → item 名
  for (const item of items) for (const f of item.files) owner.set(f, item.name)
  const names = items.map((i) => i.name)
  const dup = names.filter((n, i) => names.indexOf(n) !== i)
  if (dup.length) throw new Error(`registry：item 名重复 ${dup.join('、')}（每层文件名要唯一）`)

  // 每页归到声明它第一个出口的那个 item；每页都要有归属，页上写的出口都要找得到。
  const pageOf = new Map() // item 名 → 页
  for (const page of pages) {
    for (const name of page.exports) {
      const hit = items.find((item) =>
        item.files.some((f) => /\.tsx?$/.test(f) && !f.endsWith('/index.ts') && declares(read(f), name)),
      )
      if (!hit) throw new Error(`registry：文档页 ${page.id} 的出口 ${name} 在源码里找不到声明`)
      if (!pageOf.has(hit.name)) pageOf.set(hit.name, page)
    }
  }

  const out = items.map((item) => {
    const npm = new Set(item.extraDependencies ?? [])
    const deps = new Set()
    const types = new Set()
    for (const file of item.files) {
      if (!/\.tsx?$/.test(file)) continue
      for (const [, spec] of read(file).matchAll(IMPORT)) {
        if (spec.startsWith('.')) {
          const base = relative(pkgDir, resolve(pkgDir, dirname(file), spec))
            .split('\\')
            .join('/')
          const hit = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, `${base}/index.ts`].find((c) => owner.has(c))
          if (!hit) throw new Error(`registry：${file} 引入 ${spec}，找不到属于哪个 item`)
          if (owner.get(hit) !== item.name) deps.add(owner.get(hit))
        } else if (!spec.startsWith('node:')) {
          const bare = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
          if (bare === 'react' || bare === 'react-dom') continue
          const version =
            pkg.dependencies[bare] ?? (bare === '@katana-ui/tokens' ? pkg.peerDependencies[bare] : undefined)
          if (!version) throw new Error(`registry：${file} 引入 ${bare}，但 package.json 的 dependencies 里没有`)
          npm.add(`${bare}@${version}`)
          // 类型包（DefinitelyTyped：@scope/name → @types/scope__name）在 devDependencies 里就跟着写进 item，
          // 否则别的项目装完件 tsc 找不到类型（#1890 treemap 的 d3-hierarchy）。
          const typesName = `@types/${bare.startsWith('@') ? bare.slice(1).replace('/', '__') : bare}`
          const typesVersion = pkg.devDependencies?.[typesName]
          if (typesVersion) types.add(`${typesName}@${typesVersion}`)
        }
      }
    }
    const description = pageOf.get(item.name)?.summary ?? INTERNAL[item.name]
    if (!description)
      throw new Error(
        `registry：${item.name} 没有说明：文档站没有覆盖它的页，也不在 scripts/registry-json.mjs 的 INTERNAL 里`,
      )
    return {
      name: item.name,
      type: item.type,
      title: item.name
        .split('-')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' '),
      description,
      ...(npm.size ? { dependencies: [...npm].sort(compare) } : {}),
      ...(types.size ? { devDependencies: [...types].sort(compare) } : {}),
      ...(deps.size ? { registryDependencies: [...deps].sort(compare).map((n) => `@katana/${n}`) } : {}),
      files: item.files.map((path) => ({
        path,
        type: item.fileType ?? item.type,
        target: `${TARGET_ROOT}/${path.replace(/^src\//, '')}`,
      })),
    }
  })
  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'katana',
    homepage: 'https://github.com/XartLab/KatanaUI/tree/main/packages/react',
    items: out,
  }
}

export const registryText = async () => `${JSON.stringify(await buildRegistry(), null, 2)}\n`

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = await registryText()
  const file = join(pkgDir, 'registry.json')
  if (process.argv.includes('--check')) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== text) {
      console.error('registry.json 与源码对不上，跑 pnpm --filter @katana-ui/react registry:build')
      process.exit(1)
    }
    console.log('registry.json 与源码一致')
  } else {
    writeFileSync(file, text)
    console.log(`registry.json 已生成（${JSON.parse(text).items.length} 项）`)
  }
}
