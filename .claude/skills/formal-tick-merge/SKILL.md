---
name: formal-tick-merge
description: "订单簿合并档位的形式化验证（fast-check 性质测试）。改到 packages/react/src/blocks/order-book/order-book-model.ts（mergeLevels、buildOrderBook、bookScale）或 packages/react/src/lib/scaled-decimal.ts（toUnits、fromUnits、formatUnits、decimalsOf）时用：重跑性质、判断失败是真 bug 还是建模错了、改动是有意的时候更新性质。"
---

# 订单簿合并档位：形式化验证

订单簿把挂单按档位（tick）合并，再算累计量和买卖占比。这里的数直接摆在交易者眼前，错一位就是错价、错量。
单测只覆盖写测试的人想到的几组数；这里用 fast-check 在真实代码上生成上千组输入（价格位数、数量位数、档位、两侧档位、行数），每条性质对每组都要成立。
期望值用 BigInt 整数和字符串解析算，不经被测的 `lib/scaled-decimal.ts`，所以是两条独立的路在对账。

工具选 fast-check + vitest（#143，用户 2026-11-23 定）：代码是 TypeScript，没有能直接证明 TS 函数的验证器；要的是「对每个输入都成立」，就用生成的输入跑真实函数，不手写函数的模型。

## 性质（大白话）

1. **价格对齐档位**（`性质 1`）：合并后每一行的价格都是档位的整数倍；买盘向下取整、卖盘向上取整，每个原始挂单恰好落进一行，行价就是那个十进制数本身（没有 `100.05000000000001` 这类尾巴）。
   - 违反了：买盘合并后的价比真实挂单高、卖盘比真实挂单低，交易者看到一个市场上并不存在的更优价；或者价格显示出浮点尾巴、落不到选的档位上。
2. **同档数量精确相加**（`性质 2`）：每行的量、累计量，等于把同一档里的挂单量按整数定点相加后的十进制值。
   - 违反了：屏上出现 `0.30000000000000004` 这种量，或者累计深度与逐档相加对不上，深度条、下单回填都跟着错。
3. **买卖占比加起来恰好 100**（`性质 3`）：买占比 = 买量 ÷（买 + 卖）四舍五入到 0.1%（.5 进位），卖占比 = 100 减买占比，两者相加就是 `100`；占比只数每侧前 `shareRows` 行（截到 `rows` 行以后）；两边都是 0 时 `bidPct`、`askPct` 都是 `null`。
   - 违反了：占比条出现 50.1% + 50.0% = 100.1% 这种对不上的数，或者一边没量时编出一个占比。
4. **行数不增、排序不乱**（`性质 4`）：合并后的行数不多于不同原价的个数，档位放大成整数倍后行数只减不增；买盘价格严格降序、卖盘严格升序（最优价在前）；`buildOrderBook` 每侧不多于 `rows` 行。
   - 违反了：同一档出现两行、合并后行数反而变多，或者最优价不在第一行，交易者按第一行理解的「最优价」是错的。
5. **换算来回不丢**（`引理`，`lib/scaled-decimal.ts`）：整数换成数再换回来还是原整数，`u × 10^-d` 的乘法误差也吃得掉；`formatUnits` 写出的字符串就是十进制值本身。上面四条都建立在它上面。
   - 违反了：上面四条全部跟着错，而且错得很隐蔽（只在某些位数、某些量级出现）。

## 怎么跑（一条命令）

在 `packages/react` 目录：

```sh
pnpm exec vp test run src/blocks/order-book/order-book-model.property.test.ts src/lib/scaled-decimal.property.test.ts
```

- 正常结果：`Test Files  2 passed (2)`、`Tests  6 passed (6)`，约 1 秒内。
- 工具版本：`fast-check` 4.10.2（`packages/react/package.json` 的 devDependencies，写死），vitest 随 `vite-plus` 1.4.0。
- 加量：`FC_RUNS=20000 pnpm exec vp test run --testTimeout=120000 <同上两个文件>`（约 15 秒；不加 `--testTimeout` 会被 vitest 默认 5 秒超时打断，那不是 bug）。
- 复现失败：fast-check 失败时打印 `{ seed: ..., path: ... }` 和 `Counterexample`；`FC_SEED=<seed>` 加同一条命令即可复现同一串输入。
- `pnpm fast` 也会跑到它们（`vp test run --changed` 选中改动波及的测试）。

## 覆盖了什么

| 文件 | 函数 / 符号 | 哪条性质 |
|---|---|---|
| `packages/react/src/blocks/order-book/order-book-model.ts` | `mergeLevels`（取整到档位、同档相加、排序、累计量） | 1、2、4 |
| 同上 | `buildOrderBook`（`rows` 截断、`shareRows` 窗口、`bidVolume` / `askVolume`、`bidPct` / `askPct`；`tick` 省略时按 `10 ** -priceDecimals`） | 3、4 |
| 同上 | `bookScale` | 1（换算位数 = max(价格位数, 档位小数位)） |
| `packages/react/src/lib/scaled-decimal.ts` | `toUnits`、`fromUnits`、`formatUnits`、`decimalsOf` | 引理，并经 `mergeLevels` 间接覆盖 |
| `packages/react/src/lib/chart/format/price.ts` | `decimalsOfTick`（经 `decimalsOf`） | 间接 |

测试文件：

- `packages/react/src/blocks/order-book/order-book-model.property.test.ts`（性质 1–4）
- `packages/react/src/lib/scaled-decimal.property.test.ts`（引理）

**最后同步到的提交：`3163940`**（`feat(blocks): 订单簿、深度图、成交明细三件 (#104)`）。性质是对照这个提交里上面几个文件写的、在这个提交上证明过能失败的。

## 什么时候该重跑

看上表的文件在同步提交之后有没有变：

```sh
git log --oneline 3163940..HEAD -- packages/react/src/blocks/order-book/order-book-model.ts packages/react/src/lib/scaled-decimal.ts packages/react/src/lib/chart/format/price.ts
```

- 有输出：改到了已验证的代码，跑上面的命令。只改了 `order-book.tsx`（渲染、闪烁、点价）不需要重跑，那不在覆盖里。
- 绿了，并且读过改动、确认上面五条大白话仍然准确描述新代码：把本文的「最后同步到的提交」推进到新提交。**没读改动、没确认性质仍准确，就不要推进同步提交**，只是「测试绿了」不够。

## 红了：真 bug 还是建模错了

先用 `FC_SEED` 复现，把 `Counterexample` 读成一小段步骤，例如：「价格位数 0，档位 2，一个买单价 1 量 1 → 期望合并到 0，代码给了 2」。然后：

- **代码的承诺没变（注释、函数文档、#140 正文都还是这么说的），只是实现改了** → 真 bug，报给改动的人，附反例。不要改性质让它变绿。
- **承诺有意改了**（比如用户定了卖盘也向下取整、占比改成按整数百分比）→ 建模跟着改：改对应性质的断言和本文的大白话，再做一次「证明能失败」（下一节），再推进同步提交。
- **反例落在生成器不该产生的输入上**（比如价格有多于 `priceDecimals` 的小数位）→ 建模错了，修生成器；不要为此改产品代码。
- **期望值算错**（BigInt 的取整、窗口截断写错）→ 建模错了，修测试里的 `expected` / `shareUnits`。判别法：把反例手算一遍，看代码和测试谁对得上代码注释。

## 证明它能失败（改性质后必须重做）

对每条性质，临时把它保护的代码改坏，跑上面的命令必须红；`git checkout -- <文件>` 改回后必须绿。2026-11-23 在 `3163940` 上做过、每个改坏各跑 5 次全红的记录：

| 改坏 | 在哪 | 红的性质 |
|---|---|---|
| 买盘 `Math.floor(units / tickUnits)` 改成 `Math.round` | `mergeLevels` | 1（另 2、3、4） |
| 卖盘 `Math.ceil(units / tickUnits)` 改成 `Math.floor` | `mergeLevels` | 1、3 |
| 同档相加从 `toUnits(level.size, sizeDecimals)` 整数改回 `level.size` 浮点，输出不再 `fromUnits` | `mergeLevels` | 2 |
| 去掉占比补差：`askPct` 从 `(1000 - bidTenths) / 10` 改成 `Math.round((askUnits * 1000) / all) / 10` | `buildOrderBook` | 3 |
| 去掉排序 `.toSorted(...)` | `mergeLevels` | 4（另 1、2、3） |
| 同档第二笔另起一行（键加 0.5） | `mergeLevels` | 4（另 1、2、3） |
| `toUnits` 的 `Math.round` 改成 `Math.trunc` | `scaled-decimal.ts` | 引理（另 1、2、3） |

占比压在 .5 上的输入很少（小簿里约 1%），所以性质 3 跑 10 倍用例（默认 3000），生成器里一半的簿只有 1..20 个最小位的小量、每侧最多 8 档。改生成器时别丢了这一点，否则去掉补差可能测不红。

## 范围与界限

- **用例数**：性质 1、2、4 和两条引理每条 300 组，性质 3 是 3000 组；`FC_RUNS` 可调（性质 3 恒为它的 10 倍）。每次随机种子不同，失败会打印种子。
- **数值范围**：
  - 价格位数 `priceDecimals` 0..4，数量位数 `sizeDecimals` 0..8。
  - 价格是价格位数上的整数，中心价 1..1e7 个最小位，各档在中心 ±500 个最小位内（为了让多档落进同一档位）；两种写法：`u / 10^d` 与 `u * 10^-d`（带乘法误差）。
  - 数量 1..1e6 个最小位（一半的簿只用 1..20），也有两种写法。
  - 档位 `m × 10^-k`，m 1..200，k 0..价格位数 + 3（可以比价格最小位细，如 2 位价格配 0.005），约九分之一是非法档位（0、负数、NaN、Infinity，代码规定按价格最小位）。
  - 每侧 0..60 档（小簿 0..8），约十三分之一是不进簿的坏档（量 0、负数、NaN、Infinity，价格 NaN、Infinity）。
  - `rows` 1..30，`shareRows` 1..30 或省略；性质 4 的放大倍数 2..10。
  - 引理：|整数| ≤ 1e12，小数位 0..8。
- **不覆盖**：
  - 价格本身带有多于 `priceDecimals` 的小数位（不在调用方约定里）。这时代码先按换算位数四舍五入再取整，买盘可能被抬高：`mergeLevels([{ price: 100.049, size: 1 }], 'bid', 0.05, { priceDecimals: 2, sizeDecimals: 0 })` 给出价 `100.05`。
  - 档位本身带浮点误差（如 `0.1 * 3` = `0.30000000000000004`）：`decimalsOf` 算出 17 位，换算位数跟着变 17，行价出现尾巴（`99.90000000000002`）。生成器只产生十进制字面量的档位。
  - 超出上面量级的数（价格 × 10^换算位数、累计量接近 2^53）。
  - `bestBid` / `bestAsk` / `spread` / `spreadPct`、`depthRatio`，以及 `order-book.tsx` 的渲染、点价回调、闪烁——不在这几条性质里。
  - 这是有界的随机检验，不是对所有输入的证明：通过只说明这些范围里抽到的输入都满足性质。

## 代码变了以后

代码在同步提交之后有改动、或者你改了性质，用 pstack 的 `maintain-formal-verification-skill` 技能重新对齐：确认性质仍准确描述新代码、重做「证明能失败」、更新本文的覆盖表和同步提交。
