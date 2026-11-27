# 渲染设置

> 本面板是 Preferences 偏好页的「渲染」一节（components/Preferences）。

原生交易客户端（ATAS X、TapeDelta 桌面版）暴露 GPU / MSAA / VSync / 帧队列四项。Web 版能控的不一样，但同样做成一块工业面板：**能调的给拨杆，调不了的用 LCD 只读显示，不做假开关。**

## RENDER 面板

| 项 | 控件 | 说明 |
|---|---|---|
| GPU | LCD 只读 | `navigator.gpu` adapter 信息，如 `Apple M4 · WebGPU`；WebGL 时显示 `WEBGL2`；都没有显示 `CANVAS 2D` |
| 后端 | 三选一 | 自动 / WebGPU / Canvas 2D。只影响订单流与热力图；K 线由 lightweight-charts 自管 |
| 抗锯齿 | 拨杆 | 关 / 4x。WebGPU `sampleCount` 1 或 4；Canvas 2D 下禁用并显示"始终开" |
| 缩放 | LCD + 三选一 | 显示当前 DPR；跟随系统 / 1x / 2x。盘口密度在 1x 与 2x 下差很多 |
| 帧率上限 | 三选一 | 跟随刷新率 / 60 / 30。笔记本电池、多面板时省 GPU |
| 绘制合并 | 拨杆（锁定开） | 每帧最多画一次，不可关；显示是为了说明机制 |
| 后台面板停绘 | 拨杆 | 不可见面板停 rAF，不退订业务；默认开 |
| 帧时 | LCD 只读 | 实时 p95 帧时与长任务数；与性能验收共用计量 |
| 色觉友好 | 拨杆 | 发散色阶切到橙/蓝，`series` 不变 |
| 安静模式 | 拨杆 | 动效退化 + 音效只留交易/系统；见 motion.md / sound.md |
| 夜间 | 拨杆 + 时间 | 可配置时段：整体亮度 -10%、BLED 溢光关、音量降一档（readability §30） |

## 不做

- VSync 开关：浏览器 rAF 永远跟刷新率，关不掉。
- 帧队列：不暴露。
- 文字抗锯齿：文字由浏览器渲染，不经我们的 canvas；盘口数字清晰度靠 DPR 与字体，不靠 MSAA。

## 实现

- 这是运行中心 / 设置里的一个 PanelSpec（`render-settings`），用 Toggle、LCDReadout、StatusLED 组装，不写新控件。
- 后端与抗锯齿改动需要重建 canvas 上下文，面板先显示"重建中"LCD 状态，不闪黑。


## Web 文字与像素（2026-11-17）

实现：`@katana-ui/react` 的 `theme/rendering.css` 与 `RenderingSettings` 件（设置页的「渲染」一节用它）。文档站「总览 → 渲染设置」能直接调、能看字样。

### 能调的

| 项 | 控件 | 做法 |
|---|---|---|
| 文字平滑 | 灰度 / 系统 | 默认灰度（`-webkit-font-smoothing: antialiased`，只在 macOS 生效）；系统 = 交回系统默认 |
| 像素对齐 | 开 / 关 | 默认开：网格、零线、基线、无圆角的柱与格 `shape-rendering: crispEdges`，吸到设备像素；曲线不吸 |
| 字重补偿 | −60…+60 | 全部文字档字重加减（typography.md §0.3） |
| 字号 | 85%…130% | 全部文字档缩放，取整到整像素 |
| 斜线零 | 开 / 关 | OpenType `zero` |
| 中英对齐 | 开 / 关 | `font-size-adjust: cap-height from-font` |
| 字体 | 界面 / 汉字 / 数据字 / 代码 | 字体目录（typography.md §0.2） |

值挂在根节点：`data-text-smoothing`、`data-pixel-snap`、`data-numerals`、`data-cjk-adjust`、`data-font-<角色>`、`--k-weight-adjust`、`--k-text-scale`。件是受控的，应用存值，启动时 `applyRendering` 写回。

### 写组件时的硬规则（清晰度）

- **文字不落在小数像素上**：居中不用 `transform: translate(-50%)`，写 `translate: round(nearest, -50%, 1px)`；JS 算出的定位（刻度、末端值）`Math.round`；行高写整像素。
- **不无故把文字放进合成层**：`will-change`、常驻 `transform`、半透明层上的文字在 Windows 会从 ClearType 退成灰度，看着发虚。
- 1px 线与格子交给像素对齐；图表的线宽用 `vector-effect: non-scaling-stroke`。
- 关平滑（`-webkit-font-smoothing: none`）只给点阵字与 LCD 字，界面字不许关。
- 滚动条细（navigation.md §5）。

### 管不到的

- Windows 的 ClearType 由系统管（「调整 ClearType 文本」），CSS 改不了；我们只能避开让它退成灰度的情况。
- 图表现在是 SVG 按比例拉伸（宽 1000 的 viewBox），像素对齐只是让浏览器帮忙吸附；彻底清楚要改成 canvas 按设备像素画（位图尺寸 = CSS 尺寸 × DPR 取整），待做。
