// SPDX-License-Identifier: MIT
// 从 TS 类型生成文档站的属性表数据 gallery/props.generated.json（`pnpm docs:props`，#1902）。
// 每个导出（部件、变体函数、钩子、类型）一条：自有 props 的名、类型（照声明写法）、是否必填、默认值、JSDoc 第一句。
//   自有 = 至少有一处声明在本包的 src/ 里；继承来的 DOM / Radix / cmdk 属性（声明在 node_modules）不逐条列，页数据里用一行 note 说「透传给谁」。
//   默认值取函数形参解构里的初始值（代码里写的就是默认，不会漂），要覆盖用 JSDoc 的 `@default`。
//   描述取 JSDoc 的第一句；缺 JSDoc 的属性描述为空，registry.test.tsx 逐条红出来。
// 用编译器接口（不是 react-docgen-typescript）：理由与对比见 PR #1902。项目自己的 typescript 是 7（没有 createProgram 一类的 JS 接口），
// 所以用 devDependency `typescript-classic`（npm:typescript@6.0.3，与根目录 pnpm-workspace.yaml 给 dependency-cruiser 配的同一份 6.x）。
// 用法：node scripts/docs-props.mjs            重新生成
//       node scripts/docs-props.mjs --check    只比对：生成的与已提交的不一样就退出 1（pnpm lint:ds 先跑它）
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript-classic'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(here, '..')
const OUT = join(pkg, 'gallery/props.generated.json')
/** package.json 的 exports 里有代码的几个入口（quant/format 已被 quant 再导出）。 */
const ENTRIES = ['src/index.ts', 'src/quotes/index.ts', 'src/quant/index.ts', 'src/cn/index.ts', 'src/blocks/index.ts']

const squash = (text) => text.replace(/\s+/g, ' ').trim()

/** JSDoc 的第一句：到第一个句末标点（后面是空白或结尾）为止；没有就取整段。 */
export function firstSentence(text) {
  const flat = squash(text)
  const hit = /^(.*?[.!?。！？])(?=\s|$)/.exec(flat)
  return hit ? hit[1] : flat
}

function createProgram() {
  const configPath = join(pkg, 'tsconfig.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, pkg)
  return ts.createProgram({ rootNames: ENTRIES.map((entry) => join(pkg, entry)), options: parsed.options })
}

const inPackage = (file) => !file.fileName.includes('/node_modules/') && file.fileName.startsWith(`${pkg}/src/`)

/** 形参解构里的默认值：`{ variant = 'default' }` → { variant: "'default'" }。 */
function destructuringDefaults(declaration) {
  const fn =
    declaration && ts.isVariableDeclaration(declaration) && declaration.initializer
      ? declaration.initializer
      : declaration
  if (!fn || !(ts.isFunctionDeclaration(fn) || ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) return {}
  const first = fn.parameters[0]
  if (!first || !ts.isObjectBindingPattern(first.name)) return {}
  const found = {}
  for (const element of first.name.elements) {
    if (element.dotDotDotToken || !element.initializer) continue
    const key = (element.propertyName ?? element.name).getText()
    found[key] = squash(element.initializer.getText())
  }
  return found
}

function describeProp(checker, prop, defaults) {
  const declaration = prop.declarations?.find((decl) => ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl))
  const required = !(prop.flags & ts.SymbolFlags.Optional)
  let type
  if (declaration?.type) {
    type = squash(declaration.type.getText())
  } else {
    // 不是自己写的类型（cva 的 VariantProps 之类算出来的）：打印算出来的类型，去掉 undefined 与 null 两个噪音成员。
    const raw = checker.getTypeOfSymbol(prop)
    const members = raw.isUnion() ? raw.types : [raw]
    const kept = members.filter((member) => !(member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)))
    type = kept.map((member) => checker.typeToString(member, undefined, ts.TypeFormatFlags.NoTruncation)).join(' | ')
  }
  const tags = prop.getJsDocTags(checker)
  const tagged = tags.find((tag) => tag.name === 'default')
  const tagText = tagged ? ts.displayPartsToString(tagged.text).trim() : undefined
  const entry = {
    name: prop.getName(),
    type,
    required,
    ...((tagText ?? defaults[prop.getName()]) ? { default: tagText ?? defaults[prop.getName()] } : {}),
    description: firstSentence(ts.displayPartsToString(prop.getDocumentationComment(checker))),
  }
  return entry
}

function ownProps(checker, type, defaults) {
  if (!type.getProperties) return []
  return type
    .getProperties()
    .filter((prop) => prop.declarations?.some((decl) => inPackage(decl.getSourceFile())))
    .map((prop) => describeProp(checker, prop, defaults))
}

/** 生成全部条目（对象：导出名 → { kind, source, props }）。 */
export function generate() {
  const program = createProgram()
  const checker = program.getTypeChecker()
  const exports = {}
  for (const entry of ENTRIES) {
    const file = program.getSourceFile(join(pkg, entry))
    const moduleSymbol = checker.getSymbolAtLocation(file)
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const name = exported.getName()
      const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
      const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
      if (!declaration) continue
      const source = relative(pkg, declaration.getSourceFile().fileName).replaceAll('\\', '/')
      let kind = 'value'
      let props = []
      if (!(symbol.flags & ts.SymbolFlags.Value)) {
        kind = 'type'
        const declared = checker.getDeclaredTypeOfSymbol(symbol)
        if (!declared.isUnion()) props = ownProps(checker, declared, {})
      } else {
        const type = checker.getTypeOfSymbolAtLocation(symbol, declaration)
        const signature = type.getCallSignatures()[0]
        if (signature) {
          kind = /^[A-Z]/.test(name) ? 'component' : 'function'
          // 每个形参里的自有属性都收（formatPrice(value, { precision, tick }) 的选项在第二个形参）；默认值只认第一个形参的解构。
          signature.parameters.forEach((param, index) => {
            const paramType = checker.getTypeOfSymbolAtLocation(param, declaration)
            props.push(...ownProps(checker, paramType, index === 0 ? destructuringDefaults(declaration) : {}))
          })
        }
      }
      const next = { kind, source, props }
      if (exports[name] && JSON.stringify(exports[name]) !== JSON.stringify(next)) {
        throw new Error(`docs-props：导出名 ${name} 在不同入口指向不同的声明`)
      }
      exports[name] = next
    }
  }
  return Object.fromEntries(Object.entries(exports).toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}

export const render = () =>
  `${JSON.stringify(
    {
      $comment:
        '生成文件（pnpm docs:props）：各导出的自有 props，取自 TS 类型与 JSDoc，不手改。继承来的 DOM / Radix 属性不列。',
      exports: generate(),
    },
    null,
    2,
  )}\n`

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const next = render()
  if (process.argv.includes('--check')) {
    let current = ''
    try {
      current = readFileSync(OUT, 'utf8')
    } catch {
      // 文件还没有：下面按不一样处理。
    }
    if (current !== next) {
      const was = current ? JSON.parse(current).exports : {}
      const now = JSON.parse(next).exports
      const changed = Object.keys({ ...was, ...now }).filter(
        (key) => JSON.stringify(was[key]) !== JSON.stringify(now[key]),
      )
      console.error(
        `docs-props：gallery/props.generated.json 过期（${changed.slice(0, 12).join('、')}${changed.length > 12 ? ' 等' : ''}）。` +
          '\n  跑 pnpm docs:props 重新生成并提交。',
      )
      process.exit(1)
    }
    console.log('docs-props：props.generated.json 是最新的')
  } else {
    writeFileSync(OUT, next)
    console.log(`docs-props：写了 ${relative(process.cwd(), OUT)}`)
  }
}
