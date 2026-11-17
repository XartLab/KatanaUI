// SPDX-License-Identifier: MIT
// 改自 SmoothUI liquid-metal（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。液态金属：WebGL2 着色器画流动的金属面，铺在内容后面或裁成文字形状；屏外停，WebGL2 不可用退回 CSS 渐变。相对原件：金属的明、暗、色调三色不写死，改由 token 混出（见 METAL_TOKENS），着色器按 uniform 取；去掉 useReducedMotion。
import { cn } from '../../lib/cn.ts'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { MAX_DPR, resolveCssColors, toUnit, type Rgb } from '../shared.ts'

export type LiquidMetalVariant = 'chrome' | 'gold' | 'mercury' | 'oil'

export interface LiquidMetalProps {
  /** Content rendered above the metal surface, or clipped to it when `maskText` is on. */
  children?: ReactNode
  /** Extra classes for the wrapper. */
  className?: string
  /** Strength of the domain warp. `0` is an almost flat sheet, `2` is molten. */
  distortion?: number
  /** Clip the material to the shape of the text instead of filling the box. */
  maskText?: boolean
  /** Freeze the surface on its current frame. */
  paused?: boolean
  /** Let the pointer push the flow field around. */
  pointerInfluence?: boolean
  /** Time multiplier for the flow. */
  speed?: number
  /** Material preset: chrome, gold, mercury or oil. */
  variant?: LiquidMetalVariant
}

const DEFAULT_SPEED = 1
const DEFAULT_DISTORTION = 1
const MS_PER_SECOND = 1000
const MAX_FRAME_DELTA = 1 / 20
const POINTER_EASE = 0.08
const POINTER_RANGE = 2
const POINTER_CENTER = 0.5
const TEXT_SWEEP_SECONDS = 9
const TEXT_SWEEP_RANGE = 100
const TEXT_POINTER_SHIFT = 18
const TEXT_BACKGROUND_SIZE = '300% 100%'
const HALF = 0.5

const VARIANT_INDEX: Record<LiquidMetalVariant, number> = {
  chrome: 0,
  gold: 1,
  mercury: 2,
  oil: 3,
}

/**
 * 四种金属的明、暗、色调三色，全由 token 混出（跟主题走）：铬与水银是灰阶加一点蓝，金是琥珀，油膜是蓝加系列色。
 * 着色器取这三色做 uniform，WebGL2 不可用时 CSS 渐变与文字面也用同一组。
 */
const METAL_TOKENS: Record<LiquidMetalVariant, { hi: string; lo: string; tint: string }> = {
  chrome: {
    lo: 'var(--bg-000)',
    hi: 'var(--ink-100)',
    tint: 'color-mix(in oklch, var(--ink-300) 70%, var(--signal-blue))',
  },
  gold: {
    lo: 'color-mix(in oklch, var(--bg-000) 78%, var(--signal-amber))',
    hi: 'color-mix(in oklch, var(--ink-100) 70%, var(--signal-amber))',
    tint: 'var(--signal-amber)',
  },
  mercury: {
    lo: 'var(--bg-100)',
    hi: 'var(--ink-100)',
    tint: 'var(--ink-300)',
  },
  oil: {
    lo: 'color-mix(in oklch, var(--bg-000) 85%, var(--series-5))',
    hi: 'color-mix(in oklch, var(--ink-100) 85%, var(--signal-blue))',
    tint: 'var(--signal-blue)',
  },
}

/** 取不到计算色时的兜底（0-255）：明、暗、色调。 */
const FALLBACK_METAL: Rgb[] = [
  [10, 13, 18],
  [230, 240, 252],
  [148, 173, 217],
]

/** CSS 渐变版：着色器不可用时铺在面上。 */
const fallbackSurface = (variant: LiquidMetalVariant) => {
  const { lo, hi, tint } = METAL_TOKENS[variant]
  return `conic-gradient(from 210deg at 50% 50%, ${lo}, ${tint}, ${hi}, ${tint}, ${hi}, ${lo}, ${tint}, ${lo})`
}

/** 文字面：一条斜向的金属光带，maskText 时裁进字形。 */
const textSurface = (variant: LiquidMetalVariant) => {
  const { lo, hi, tint } = METAL_TOKENS[variant]
  return `linear-gradient(100deg, ${tint} 0%, ${hi} 16%, ${tint} 32%, ${hi} 46%, ${lo} 62%, ${hi} 78%, ${tint} 100%)`
}

const VERTEX_SHADER = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime;
uniform float uDistortion;
uniform float uVariant;
uniform vec2 uPointer;
uniform vec3 uLo;
uniform vec3 uHi;
uniform vec3 uTint;

float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p){
  float value = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++){
    value += amplitude * noise(p);
    p = turn * p;
    amplitude *= 0.5;
  }
  return value;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (uv - 0.5) * aspect * 2.2;
  vec2 push = uPointer * 0.55;
  float warp = clamp(uDistortion, 0.0, 3.0);

  vec2 q = vec2(fbm(p + push), fbm(p + vec2(5.2, 1.3) - push));
  vec2 flow = p + warp * 3.2 * q;
  vec2 r = vec2(
    fbm(flow + vec2(1.7, 9.2) + uTime * 0.17),
    fbm(flow + vec2(8.3, 2.8) - uTime * 0.13)
  );

  vec2 base = p + warp * 2.8 * r;
  float eps = 0.006;
  float h = fbm(base);
  float hx = fbm(base + vec2(eps, 0.0));
  float hy = fbm(base + vec2(0.0, eps));
  vec3 n = normalize(vec3((h - hx) / eps * 0.05, (h - hy) / eps * 0.05, 1.0));

  vec3 view = normalize(vec3((uv - 0.5) * aspect, 1.0));
  vec3 refl = reflect(view, n);
  float f = clamp(refl.y * 0.5 + 0.5, 0.0, 1.0);
  float sideways = clamp(refl.x * 0.5 + 0.5, 0.0, 1.0);

  vec3 lo = uLo;
  vec3 hi = uHi;
  vec3 tint = uTint;

  vec3 col = mix(lo, hi, smoothstep(0.04, 0.96, f));
  col = mix(col, tint, pow(sideways, 2.0) * 0.55);

  float spec = pow(max(dot(n, normalize(vec3(0.35, 0.75, 0.55))), 0.0), 42.0);
  float fresnel = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);
  col += spec * 0.85 + fresnel * 0.20;

  if (uVariant > 2.5) {
    vec3 sheen = 0.5 + 0.5 * cos(6.28318 * (f + h * 0.75 + vec3(0.0, 0.33, 0.67)));
    col = mix(col, sheen, 0.72);
  }

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

const STRIP = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

interface MetalController {
  destroy: () => void
  setDistortion: (value: number) => void
  setPalette: (colors: Rgb[]) => void
  setPointer: (x: number, y: number) => void
  setRunning: (running: boolean) => void
  setSpeed: (value: number) => void
  setVariant: (value: LiquidMetalVariant) => void
}

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)
  if (!shader) {
    return null
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

const resizeCanvas = (canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) => {
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const width = Math.max(1, Math.round(rect.width * dpr))
  const height = Math.max(1, Math.round(rect.height * dpr))
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  gl.viewport(0, 0, width, height)
}

const createMetalController = (
  canvas: HTMLCanvasElement,
  initialVariant: LiquidMetalVariant,
  initialSpeed: number,
  initialDistortion: number,
): MetalController | null => {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  })
  if (!gl) {
    return null
  }

  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  const program = gl.createProgram()
  if (!(vertex && fragment && program)) {
    return null
  }

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL2RenderingContext.useProgram is not a React hook.
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, STRIP, gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'a')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const uRes = gl.getUniformLocation(program, 'uRes')
  const uTime = gl.getUniformLocation(program, 'uTime')
  const uDistortion = gl.getUniformLocation(program, 'uDistortion')
  const uVariant = gl.getUniformLocation(program, 'uVariant')
  const uPointer = gl.getUniformLocation(program, 'uPointer')
  const uLo = gl.getUniformLocation(program, 'uLo')
  const uHi = gl.getUniformLocation(program, 'uHi')
  const uTint = gl.getUniformLocation(program, 'uTint')
  let palette: Rgb[] = FALLBACK_METAL.map(toUnit)

  let variant = initialVariant
  let speed = initialSpeed
  let distortion = initialDistortion
  let elapsed = 0
  let lastFrameAt = performance.now()
  let frame = 0
  let running = false
  let destroyed = false
  let pointerX = 0
  let pointerY = 0
  let targetX = 0
  let targetY = 0

  const draw = () => {
    resizeCanvas(canvas, gl)
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform1f(uTime, elapsed)
    gl.uniform1f(uDistortion, distortion)
    gl.uniform1f(uVariant, VARIANT_INDEX[variant])
    gl.uniform2f(uPointer, pointerX, pointerY)
    gl.uniform3f(uLo, ...palette[0]!)
    gl.uniform3f(uHi, ...palette[1]!)
    gl.uniform3f(uTint, ...palette[2]!)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const tick = () => {
    if (destroyed) {
      return
    }
    const now = performance.now()
    const delta = Math.min((now - lastFrameAt) / MS_PER_SECOND, MAX_FRAME_DELTA)
    lastFrameAt = now
    elapsed += delta * speed
    pointerX += (targetX - pointerX) * POINTER_EASE
    pointerY += (targetY - pointerY) * POINTER_EASE
    draw()
    frame = requestAnimationFrame(tick)
  }

  draw()

  return {
    destroy: () => {
      destroyed = true
      cancelAnimationFrame(frame)
      if (buffer) {
        gl.deleteBuffer(buffer)
      }
      gl.deleteProgram(program)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
    setDistortion: (value: number) => {
      distortion = value
    },
    setPalette: (colors: Rgb[]) => {
      palette = colors
      if (!running) {
        draw()
      }
    },
    setPointer: (x: number, y: number) => {
      targetX = x
      targetY = y
    },
    setRunning: (next: boolean) => {
      if (destroyed || next === running) {
        return
      }
      running = next
      if (running) {
        lastFrameAt = performance.now()
        frame = requestAnimationFrame(tick)
        return
      }
      cancelAnimationFrame(frame)
      draw()
    },
    setSpeed: (value: number) => {
      speed = value
    },
    setVariant: (value: LiquidMetalVariant) => {
      variant = value
    },
  }
}

export const LiquidMetal = ({
  children,
  className,
  distortion = DEFAULT_DISTORTION,
  maskText = false,
  paused = false,
  pointerInfluence = true,
  speed = DEFAULT_SPEED,
  variant = 'chrome',
}: LiquidMetalProps) => {
  const wrapperRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const controllerRef = useRef<MetalController | null>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const [isSupported, setIsSupported] = useState(true)
  const [isInView, setIsInView] = useState(true)

  const usesShader = !maskText && isSupported
  const isPlaying = !paused && isInView

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) {
      return
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        setIsInView(entry.isIntersecting)
      }
    })
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  // The GL context is rebuilt only when the rendering strategy changes; live
  // uniform values are pushed through the setters in the effect below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: initial uniform values must not restart the context.
  useEffect(() => {
    if (!usesShader) {
      return
    }
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const controller = createMetalController(canvas, variant, speed, distortion)
    if (!controller) {
      setIsSupported(false)
      return
    }
    controllerRef.current = controller
    return () => {
      controller.destroy()
      controllerRef.current = null
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- 只在是否用着色器变化时重建，其余参数由下一个 effect 推给控制器
  }, [usesShader])

  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) {
      return
    }
    controller.setVariant(variant)
    controller.setSpeed(speed)
    controller.setDistortion(distortion)
  }, [distortion, speed, variant])

  // 金属三色按主题取：变体换了、着色器重建了都重取一次。
  useEffect(() => {
    const wrapper = wrapperRef.current
    const controller = controllerRef.current
    if (!(wrapper && controller)) {
      return
    }
    const { lo, hi, tint } = METAL_TOKENS[variant]
    controller.setPalette(resolveCssColors([lo, hi, tint], wrapper, FALLBACK_METAL).map(toUnit))
  }, [variant, usesShader, isSupported])

  useEffect(() => {
    controllerRef.current?.setRunning(isPlaying)
  }, [isPlaying])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!(wrapper && pointerInfluence)) {
      return
    }
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!hoverQuery.matches) {
      return
    }

    const handleMove = (event: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - POINTER_CENTER) * POINTER_RANGE
      const y = (POINTER_CENTER - (event.clientY - rect.top) / rect.height) * POINTER_RANGE
      pointerRef.current = { x, y }
      controllerRef.current?.setPointer(x, y)
    }
    const handleLeave = () => {
      pointerRef.current = { x: 0, y: 0 }
      controllerRef.current?.setPointer(0, 0)
    }

    wrapper.addEventListener('pointermove', handleMove)
    wrapper.addEventListener('pointerleave', handleLeave)
    return () => {
      wrapper.removeEventListener('pointermove', handleMove)
      wrapper.removeEventListener('pointerleave', handleLeave)
    }
  }, [pointerInfluence])

  useEffect(() => {
    const node = textRef.current
    if (!(maskText && node) || paused || !isInView) {
      return
    }
    let frame = 0
    const startedAt = performance.now()
    const step = () => {
      const seconds = ((performance.now() - startedAt) / MS_PER_SECOND) * Math.max(speed, 0)
      const cycle = (seconds / TEXT_SWEEP_SECONDS) % 1
      const offset = pointerInfluence ? pointerRef.current.x * TEXT_POINTER_SHIFT : 0
      node.style.backgroundPosition = `${cycle * TEXT_SWEEP_RANGE + offset}% 50%`
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [isInView, maskText, paused, pointerInfluence, speed])

  if (maskText) {
    const textStyle: CSSProperties = {
      backgroundClip: 'text',
      backgroundImage: textSurface(variant),
      backgroundPosition: `${TEXT_SWEEP_RANGE * HALF}% 50%`,
      backgroundSize: TEXT_BACKGROUND_SIZE,
      color: 'transparent',
      // inline 的背景只盖父级字号的行盒，子元素字更大时会被裁掉上半截：要 inline-block 才盖得住。
      display: 'inline-block',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }

    return (
      <span
        className={cn('inline-block', className)}
        ref={(node) => {
          wrapperRef.current = node
        }}
      >
        <span ref={textRef} style={textStyle}>
          {children}
        </span>
      </span>
    )
  }

  return (
    <div
      className={cn('relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-surface-0', className)}
      ref={(node) => {
        wrapperRef.current = node
      }}
    >
      {usesShader ? (
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <canvas className="h-full w-full" ref={canvasRef} />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0"
          style={{ backgroundImage: fallbackSurface(variant) }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
