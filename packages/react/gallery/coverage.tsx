// SPDX-License-Identifier: MIT
import { KINDS, STATUSES, summarize, type CoverageMap } from '../docs/coverage-core'
import map from '../docs/coverage-map.json'
import saltMap from '../docs/salt-map.json'
import { SALT_STATUSES, summarizeSalt, type SaltMap } from '../docs/salt-core'

// 文档站的「覆盖」页（#1870）：设计稿的组件卡做了多少。数字与明细来自手写的 docs/coverage-map.json，
// 与脚本生成的 docs/coverage.md 用同一份汇总逻辑（docs/coverage-core.ts），两处不会各算各的。
const coverage = map as CoverageMap
const salt = saltMap as SaltMap

export function CoveragePage() {
  const summary = summarize(coverage)
  const total = summary.reduce((sum, item) => ({ done: sum.done + item.done, all: sum.all + item.total }), {
    done: 0,
    all: 0,
  })
  const names = Object.keys(coverage.cards).sort()
  return (
    <article className="gal-doc" data-testid="coverage">
      <header>
        <h1>覆盖</h1>
        <p>
          设计稿 <code>design/katana-console/project/components/</code> 的 {names.length}{' '}
          张组件卡，每张落到了哪里、做没做。 手写的是 <code>docs/coverage-map.json</code>，<code>pnpm lint:ds</code>{' '}
          核对每张卡都有映射、落点真的存在。
        </p>
      </header>
      <section aria-labelledby="coverage-summary">
        <h2 id="coverage-summary">汇总</h2>
        <table data-testid="coverage-summary">
          <thead>
            <tr>
              <th scope="col">归属</th>
              <th scope="col">已做 / 总数</th>
              {STATUSES.map((status) => (
                <th key={status} scope="col">
                  {status}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.map((item) => (
              <tr key={item.kind} data-kind={item.kind}>
                <th scope="row">{item.kind}</th>
                <td data-cell="ratio">
                  {item.done} / {item.total}
                </td>
                <td>{item.done}</td>
                <td>{item.partial}</td>
                <td>{item.none}</td>
              </tr>
            ))}
            <tr data-kind="合计">
              <th scope="row">合计</th>
              <td data-cell="ratio">
                {total.done} / {total.all}
              </td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </section>
      {KINDS.map((kind) => (
        <section key={kind} aria-labelledby={`coverage-${kind}`}>
          <h2 id={`coverage-${kind}`}>{kind}</h2>
          <table data-kind={kind}>
            <thead>
              <tr>
                <th scope="col">卡</th>
                <th scope="col">落在哪里</th>
                <th scope="col">状态</th>
                <th scope="col">备注</th>
              </tr>
            </thead>
            <tbody>
              {names
                .filter((name) => coverage.cards[name].kind === kind)
                .map((name) => (
                  <tr key={name} data-card={name} data-status={coverage.cards[name].status}>
                    <th scope="row">{name}</th>
                    <td>
                      {[...coverage.cards[name].at, ...(coverage.cards[name].planned ?? [])].map((place, index) => (
                        <span key={place}>
                          {index > 0 ? '、' : ''}
                          <code>{place}</code>
                          {coverage.cards[name].planned?.includes(place) ? '（计划）' : ''}
                        </span>
                      ))}
                      {coverage.cards[name].at.length + (coverage.cards[name].planned?.length ?? 0) === 0 ? '—' : null}
                    </td>
                    <td>{coverage.cards[name].status}</td>
                    <td>{coverage.cards[name].note ?? ''}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
      <SaltSection />
    </article>
  )
}

/** 「对照 Salt」一节（#104）：Salt Design System 的组件清单逐个对到我们的页；数据在 docs/salt-map.json。 */
function SaltSection() {
  const counts = summarizeSalt(salt)
  return (
    <section aria-labelledby="coverage-salt" data-testid="salt-map">
      <h2 id="coverage-salt">对照 Salt</h2>
      <p>
        <a href={salt.source}>Salt Design System</a> 的 {salt.components.length} 个组件（{salt.readOn}{' '}
        读的清单）逐个对到我们的页： 有 = 读过我们那一页、功能对得上；部分 = 缺的写在备注；没有 =
        包里没有对应的件。手写的是 <code>docs/salt-map.json</code>，测试核对表里的页 id 都真实存在。
      </p>
      <table data-testid="salt-summary">
        <thead>
          <tr>
            {SALT_STATUSES.map((status) => (
              <th key={status} scope="col">
                {status}
              </th>
            ))}
            <th scope="col">合计</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {SALT_STATUSES.map((status) => (
              <td key={status} data-cell={status}>
                {counts[status]}
              </td>
            ))}
            <td data-cell="合计">{salt.components.length}</td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th scope="col">Salt 组件</th>
            <th scope="col">我们的页</th>
            <th scope="col">状态</th>
            <th scope="col">备注</th>
          </tr>
        </thead>
        <tbody>
          {salt.components.map((entry) => (
            <tr key={entry.slug} data-salt={entry.slug} data-status={entry.status}>
              <th scope="row">{entry.name}</th>
              <td>
                {entry.pages.map((id, index) => (
                  <span key={id}>
                    {index > 0 ? '、' : ''}
                    <a href={`#/${id}`}>
                      <code>{id}</code>
                    </a>
                  </span>
                ))}
                {entry.pages.length === 0 ? '—' : null}
              </td>
              <td>{entry.status}</td>
              <td>{entry.note ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
