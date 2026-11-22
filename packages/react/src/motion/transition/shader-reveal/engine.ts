// SPDX-License-Identifier: MIT
// 改自 SmoothUI 的 shader-reveal-transition 与 sdf-blob-transition（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：
// 原件里 @repo/shader-reveal-transition、@repo/sdf-blob-transition、aperture-blur、chroma-blur 四份几乎一样的 WebGL 控制器与播放器，归成这一份引擎。
// 相对原件的改动：① 着色器与时序做成参数（TransitionSpec），一个引擎四种着色器；② 颜色走 uniform（调用方传 token），不写进着色器；
// ③ 只在播放期间跑 requestAnimationFrame，空闲时不画（原件挂上就每帧清屏重画）；④ 画布与 WebGL 上下文第一次播放时才建，卸载时主动释放；
// ⑤ 标签页隐藏时 rAF 本来就停，这里直接跳过动画换内容；⑥ 去掉 useReducedMotion（项目不跟系统的「减少动态效果」，见 theme/motion.css 头部）。
import { MAX_DPR, clamp, resolveCssColors, toUnit, type Rgb } from '../../shared.ts'

const MIDPOINT_DEFAULT = 0.5
const MS_PER_SECOND = 1000
const VERTEX_SHADER = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }'
const STRIP = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

/** 四个颜色 uniform 的默认来源（token）：主色、冷色、暖色、第四色。交易语境里是强调橙、蓝、琥珀、绿，都跟主题走。 */
export const DEFAULT_COLORS: readonly string[] = [
  'var(--accent)',
  'var(--signal-blue)',
  'var(--signal-amber)',
  'var(--signal-green)',
]
/** 解不出颜色时的兜底（只在没有 DOM 或 token 缺失时用）。 */
const FALLBACK_COLORS: readonly Rgb[] = [
  [255, 90, 40],
  [60, 140, 255],
  [255, 190, 60],
  [60, 210, 140],
]

const easeOutCubic = (value: number) => 1 - (1 - value) ** 3
const easeOutQuart = (value: number) => 1 - (1 - value) ** 4
const easeInOutCubic = (value: number) => (value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2)
export const EASES = { cubic: easeOutCubic, quart: easeOutQuart } as const

/** 一种着色器过场的固定参数：着色器源码、进度缓动、换内容的时刻、收尾淡出的毫秒。 */
export type TransitionSpec = {
  fragment: string
  ease: (t: number) => number
  /** 进度过了这个比例就把新内容换进来（遮住的那一刻）。 */
  midpoint?: number
  /** 播完后画布淡出的毫秒。 */
  fadeMs: number
  /** 默认总时长（毫秒）。 */
  duration: number
}

export type EngineFrame = {
  alpha: number
  /** 同一份着色器里选哪个变体（没有变体的着色器传 0）。 */
  variant: number
  colors: readonly Rgb[]
  progress: number
  time: number
}

export type ShaderEngine = {
  draw: (frame: EngineFrame) => void
  destroy: () => void
}

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/** 建引擎；WebGL 不可用或着色器编译失败返回 null（调用方退回普通淡入淡出）。 */
export const createShaderEngine = (canvas: HTMLCanvasElement, fragment: string): ShaderEngine | null => {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true })
  if (!gl) return null
  const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment)
  const program = gl.createProgram()
  if (!(vertexShader && fragmentShader && program)) return null
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  gl.useProgram(program)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, STRIP, gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'a')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const uRes = gl.getUniformLocation(program, 'uRes')
  const uTime = gl.getUniformLocation(program, 'uTime')
  const uProgress = gl.getUniformLocation(program, 'uProgress')
  const uAlpha = gl.getUniformLocation(program, 'uAlpha')
  const uVariant = gl.getUniformLocation(program, 'uVariant')
  const uColors = [0, 1, 2, 3].map((i) => gl.getUniformLocation(program, `uC${i}`))

  return {
    draw: ({ alpha, variant, colors, progress, time }) => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const width = Math.max(1, Math.round(rect.width * dpr))
      const height = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(uRes, width, height)
      gl.uniform1f(uTime, time)
      gl.uniform1f(uProgress, progress)
      gl.uniform1f(uAlpha, alpha)
      gl.uniform1f(uVariant, variant)
      uColors.forEach((location, i) => {
        const [r, g, b] = toUnit(colors[i % colors.length] ?? FALLBACK_COLORS[i]!)
        gl.uniform3f(location, r, g, b)
      })
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    destroy: () => {
      gl.clear(gl.COLOR_BUFFER_BIT)
      if (buffer) gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

/** 取 token 的当前颜色（过场开始时取一次，主题切了下次就是新的）。 */
export const resolveColors = (host: HTMLElement, colors: readonly string[]): Rgb[] =>
  resolveCssColors(colors, host, FALLBACK_COLORS)

export type Playback = { cancel: () => void }

/**
 * 播一次：进度按 spec.ease 从 0 走到 1，过了 midpoint 就换内容，播完画布淡出再收尾。
 * 只在播放期间要 requestAnimationFrame；cancel 后不再触发任何回调。
 */
export const playTransition = (
  engine: ShaderEngine,
  spec: TransitionSpec,
  options: {
    duration: number
    variant: number
    colors: readonly Rgb[]
    onMidpoint: () => void
    onComplete: () => void
  },
): Playback => {
  const { duration, variant, colors, onMidpoint, onComplete } = options
  const midpoint = spec.midpoint ?? MIDPOINT_DEFAULT
  let frame = 0
  let cancelled = false
  let swapped = false
  const startedAt = performance.now()
  const draw = (progress: number, alpha: number) =>
    engine.draw({ alpha, variant, colors, progress, time: (performance.now() - startedAt) / MS_PER_SECOND })

  const advance = () => {
    if (cancelled) return
    const raw = clamp((performance.now() - startedAt) / duration, 0, 1)
    const progress = spec.ease(raw)
    draw(progress, 1)
    if (!swapped && progress >= midpoint) {
      swapped = true
      onMidpoint()
    }
    if (raw < 1) {
      frame = requestAnimationFrame(advance)
      return
    }
    if (!swapped) {
      swapped = true
      onMidpoint()
    }
    const fadeStartedAt = performance.now()
    const fade = () => {
      if (cancelled) return
      const fadeRaw = clamp((performance.now() - fadeStartedAt) / spec.fadeMs, 0, 1)
      draw(1, 1 - easeInOutCubic(fadeRaw))
      if (fadeRaw < 1) {
        frame = requestAnimationFrame(fade)
        return
      }
      onComplete()
    }
    frame = requestAnimationFrame(fade)
  }
  frame = requestAnimationFrame(advance)
  return {
    cancel: () => {
      cancelled = true
      cancelAnimationFrame(frame)
    },
  }
}
