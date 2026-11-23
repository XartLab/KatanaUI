// SPDX-License-Identifier: MIT
// 改自 SmoothUI aurora-curtain（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。极光帘子：WebGL2 着色器画几条缓缓飘动的光带，铺在内容后面；屏外与标签页隐藏时停，WebGL2 不可用退回 CSS 渐变。相对原件：颜色走 token，去掉 useReducedMotion，取色与屏内判断抽到 ../shared.ts。
import { cn } from '../../lib/cn.ts'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { MAX_DPR, clamp, resolveCssColors, toCssColor, toUnit, useOnScreen, type Rgb } from '../shared.ts'

export type AuroraDirection = 'up' | 'down'

export interface AuroraCurtainProps {
  /** Number of aurora ribbons rendered behind the content. Clamped to 1-8. */
  bands?: number
  /** Softness of every ribbon edge, from 0 (crisp) to 1 (very diffuse). */
  blur?: number
  /** Foreground content, always painted above the decorative curtain. */
  children?: ReactNode
  /** Extra classes for the positioned wrapper element. */
  className?: string
  /**
   * Ribbon colours. Accepts any CSS colour, a `var(--token)` expression, or a
   * bare custom property name such as `--accent`.
   */
  colors?: string[]
  /** Direction the light flows towards. */
  direction?: AuroraDirection
  /** Overall brightness multiplier, from 0 to 1. */
  intensity?: number
  /**
   * Film-grain strength from `0` (clean) to `1` (heavily filmic). The grain is
   * re-seeded every frame and covers the whole surface, not only the ribbons,
   * so it reads as moving film stock rather than dust on the glass.
   * `true` is accepted as a shorthand for `0.6`, `false` for `0`.
   */
  noise?: number | boolean
  /** Freezes the animation on the current frame. */
  paused?: boolean
  /** Drift speed multiplier. 1 is the calibrated default. */
  speed?: number
}

interface AuroraSettings {
  bands: number
  blur: number
  colors: Rgb[]
  direction: number
  grain: number
  intensity: number
  speed: number
}

interface AuroraController {
  destroy: () => void
  render: () => void
  resize: () => void
  setRunning: (running: boolean) => void
  setSettings: (settings: AuroraSettings) => void
}

const MAX_COLORS = 6
const MAX_BANDS = 8
const MIN_BANDS = 1
const MS_PER_SECOND = 1000
const GRAIN_SHORTHAND = 0.6
const GRAIN_SEED_CYCLE = 977
const DEFAULT_BANDS = 4
const DEFAULT_SPEED = 1
const DEFAULT_BLUR = 0.5
const DEFAULT_INTENSITY = 1

/** 三条光带的颜色走我们的 token（跟主题）：绿、蓝、强调色。 */
const DEFAULT_COLORS = ['var(--signal-green)', 'var(--signal-blue)', 'var(--accent)']

/** 取不到计算色时的兜底（0-255 的 sRGB）。 */
const FALLBACK_COLORS: Rgb[] = [
  [102, 211, 122],
  [82, 208, 210],
  [201, 120, 226],
]
/** 着色器要 0-1 的浮点。 */
const FALLBACK_UNIT: Rgb[] = FALLBACK_COLORS.map(toUnit)

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 uRes;
uniform float uTime;
uniform float uBands;
uniform float uSpeed;
uniform float uBlur;
uniform float uIntensity;
uniform float uDirection;
uniform float uGrain;
uniform float uSeed;
uniform float uPixel;
uniform int uColorCount;
uniform vec3 uColors[6];

const int MAX_BANDS = 8;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Grain hash: the per-frame seed is folded in so the pattern is reborn every
// frame instead of sitting on the screen like dust on the glass.
float grainHash(vec2 p, float seed) {
  return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed * 1.6180339) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Two-octave detail, normalised to 0..1. Used where a second octave changes
// the silhouette; anything that only needs a slow scalar uses sines instead,
// because every octave is four more transcendentals per fragment.
float fbm2(vec2 p) {
  float value = vnoise(p) * 0.5 + vnoise(p * 2.07 + 9.31) * 0.25;
  return value * 1.3333333;
}

// Three-octave meander for the ribbon path, normalised to 0..1.
float fbm3(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * vnoise(p);
    p = p * 2.03 + 7.13;
    amplitude *= 0.5;
  }
  return value * 1.1428571;
}

vec3 bandColor(int index) {
  int count = max(uColorCount, 1);
  int slot = index - (index / count) * count;
  return uColors[slot];
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float flow = mix(1.0, -1.0, uDirection);
  float y = mix(uv.y, 1.0 - uv.y, uDirection);

  // Vertical falloff: dense near the base, dissolving towards the far edge
  // the way a real aurora thins out as it climbs.
  float rise = smoothstep(-0.10, 0.26, y);
  float fade = 1.0 - smoothstep(0.16, 1.08, y);
  float envelope = rise * fade * fade;

  vec3 accum = vec3(0.0);
  float alpha = 0.0;
  float bandCount = clamp(uBands, 1.0, float(MAX_BANDS));
  float spacing = 0.92 / bandCount;
  float t = uTime * uSpeed;

  for (int i = 0; i < MAX_BANDS; i++) {
    if (float(i) >= bandCount) {
      break;
    }
    float fi = float(i);
    float seed = fi * 13.37;

    // Path: a three-octave meander, a faster single-octave wobble and a slow
    // sine fold, all evaluated per height, so each ribbon folds along its own
    // length instead of sliding across as a rigid bar.
    float driftA = fbm3(vec2(y * 1.35 + seed, t * 0.16 + seed)) - 0.5;
    float driftB = vnoise(vec2(y * 3.40 - seed, t * 0.27 + seed * 0.5)) - 0.5;
    float fold = sin(y * 4.1 + t * 0.42 * flow + seed) * 0.045;
    float center = 0.04 + spacing * (fi + 0.5) + driftA * 0.52 + driftB * 0.18 + fold;

    // Width and softness vary ALONG the ribbon, pinching towards both ends.
    float widthNoise = fbm2(vec2(y * 2.7 + seed * 2.0, t * 0.22 + seed));
    float pinch = smoothstep(0.0, 0.22, y) * (1.0 - smoothstep(0.55, 1.08, y));
    float width = (0.010 + uBlur * 0.052)
      * mix(0.30, 1.85, widthNoise)
      * (0.45 + 0.75 * pinch);
    width = max(width, 0.0025);

    // A bright narrow core wrapped in a much wider halo that falls off at the
    // edges, rather than one flat gaussian per ribbon.
    float dx = (uv.x - center) / width;
    float d2 = dx * dx;
    float core = exp(-d2 * 2.60);
    float halo = exp(-d2 * 0.22);
    float ribbon = core * 1.30 + halo * 0.34;

    // Fine vertical striations scrolling along the flow direction, and a slow
    // brightness swell. The swell is two sines, not another noise octave.
    float rays = 0.45 + 0.85 * fbm2(vec2(uv.x * 13.0 + seed, y * 1.7 - flow * t * 0.55));
    float breathe = 0.78 + 0.22 * sin(t * 0.31 + seed) * cos(t * 0.17 + seed * 0.7);

    float weight = ribbon * envelope * rays * breathe * 0.46;
    vec3 hot = mix(bandColor(i), vec3(1.0), clamp(core * 0.42, 0.0, 0.45));
    accum += hot * weight;
    alpha += weight;
  }

  // Ground haze so the ribbons sit inside atmosphere rather than on nothing.
  float haze = envelope * (1.0 - smoothstep(0.0, 0.58, y)) * 0.10;
  accum += bandColor(0) * haze;
  alpha += haze;

  alpha = clamp(alpha * uIntensity, 0.0, 1.0);
  accum = max(accum * uIntensity, vec3(0.0));

  if (uGrain > 0.0) {
    // One grain cell per CSS pixel. Two hashes averaged give a triangular
    // distribution, which reads far more photographic than a flat one, and
    // costs two extra sines rather than a whole extra noise octave.
    vec2 cell = floor(gl_FragCoord.xy / max(uPixel, 1.0));
    float g = grainHash(cell, uSeed) + grainHash(cell + vec2(41.7, 17.3), uSeed + 7.31) - 1.0;
    float amp = uGrain * 0.42;

    // Modulate the light where there is light...
    accum *= 1.0 + g * amp * 1.10;

    // ...then lay a symmetric veil over the WHOLE surface. Positive grain adds
    // light; negative grain adds coverage with no colour, which darkens the
    // backdrop through the premultiplied blend. Without the second half the
    // grain would only ever brighten, and empty areas would stay glassy.
    float bright = max(g, 0.0) * amp * 0.48;
    float dark = max(-g, 0.0) * amp * 0.34;
    accum += vec3(bright);
    alpha = clamp(alpha + bright + dark, 0.0, 1.0);
  }

  fragColor = vec4(max(accum, vec3(0.0)), alpha);
}`

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

const resolveGrain = (noise: number | boolean) => {
  if (typeof noise === 'boolean') {
    return noise ? GRAIN_SHORTHAND : 0
  }
  return clamp(noise, 0, 1)
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

const createAuroraController = (canvas: HTMLCanvasElement): AuroraController | null => {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
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
  gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const uRes = gl.getUniformLocation(program, 'uRes')
  const uTime = gl.getUniformLocation(program, 'uTime')
  const uBands = gl.getUniformLocation(program, 'uBands')
  const uSpeed = gl.getUniformLocation(program, 'uSpeed')
  const uBlur = gl.getUniformLocation(program, 'uBlur')
  const uIntensity = gl.getUniformLocation(program, 'uIntensity')
  const uDirection = gl.getUniformLocation(program, 'uDirection')
  const uGrain = gl.getUniformLocation(program, 'uGrain')
  const uSeed = gl.getUniformLocation(program, 'uSeed')
  const uPixel = gl.getUniformLocation(program, 'uPixel')
  const uColorCount = gl.getUniformLocation(program, 'uColorCount')
  const uColors = gl.getUniformLocation(program, 'uColors')

  const palette = new Float32Array(MAX_COLORS * 3)
  const startedAt = performance.now()
  let settings: AuroraSettings = {
    bands: DEFAULT_BANDS,
    blur: DEFAULT_BLUR,
    colors: FALLBACK_UNIT,
    direction: 0,
    grain: 0,
    intensity: DEFAULT_INTENSITY,
    speed: DEFAULT_SPEED,
  }
  let colorCount = FALLBACK_UNIT.length
  let pixelRatio = 1
  let grainSeed = 0
  let frame = 0
  let running = false
  let destroyed = false

  const applyPalette = () => {
    colorCount = clamp(settings.colors.length, 1, MAX_COLORS)
    for (let i = 0; i < colorCount; i++) {
      const rgb = settings.colors[i] ?? FALLBACK_UNIT[0]
      palette[i * 3] = rgb[0]
      palette[i * 3 + 1] = rgb[1]
      palette[i * 3 + 2] = rgb[2]
    }
  }
  applyPalette()

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    pixelRatio = dpr
    const width = Math.max(1, Math.round(rect.width * dpr))
    const height = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
  }

  const draw = () => {
    if (destroyed) {
      return
    }
    // A frame counter, not Math.random: deterministic, and it re-seeds the
    // grain hash so the pattern never freezes on screen.
    grainSeed = (grainSeed + 1) % GRAIN_SEED_CYCLE
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform1f(uTime, (performance.now() - startedAt) / MS_PER_SECOND)
    gl.uniform1f(uBands, settings.bands)
    gl.uniform1f(uSpeed, settings.speed)
    gl.uniform1f(uBlur, settings.blur)
    gl.uniform1f(uIntensity, settings.intensity)
    gl.uniform1f(uDirection, settings.direction)
    gl.uniform1f(uGrain, settings.grain)
    gl.uniform1f(uSeed, grainSeed)
    gl.uniform1f(uPixel, pixelRatio)
    gl.uniform1i(uColorCount, colorCount)
    gl.uniform3fv(uColors, palette)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const tick = () => {
    if (destroyed || !running) {
      return
    }
    draw()
    frame = requestAnimationFrame(tick)
  }

  resize()

  return {
    destroy: () => {
      destroyed = true
      running = false
      cancelAnimationFrame(frame)
      if (buffer) {
        gl.deleteBuffer(buffer)
      }
      gl.deleteProgram(program)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
    render: () => {
      resize()
      draw()
    },
    resize: () => {
      resize()
      if (!running) {
        draw()
      }
    },
    setRunning: (next: boolean) => {
      if (destroyed || running === next) {
        return
      }
      running = next
      if (next) {
        frame = requestAnimationFrame(tick)
      } else {
        cancelAnimationFrame(frame)
      }
    },
    setSettings: (next: AuroraSettings) => {
      settings = next
      applyPalette()
    },
  }
}

export const AuroraCurtain = ({
  bands = DEFAULT_BANDS,
  blur = DEFAULT_BLUR,
  children,
  className,
  colors = DEFAULT_COLORS,
  direction = 'up',
  intensity = DEFAULT_INTENSITY,
  noise = 0,
  paused = false,
  speed = DEFAULT_SPEED,
}: AuroraCurtainProps) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controllerRef = useRef<AuroraController | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [resolvedColors, setResolvedColors] = useState<Rgb[]>(FALLBACK_UNIT)

  const isActive = useOnScreen(hostRef, isSupported)
  const colorKey = colors.join('|')
  const grain = resolveGrain(noise)

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }
    setResolvedColors(resolveCssColors(colorKey.split('|'), host, FALLBACK_COLORS).map(toUnit))
  }, [colorKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const controller = createAuroraController(canvas)
    controllerRef.current = controller
    setIsSupported(controller !== null)
    if (!controller) {
      return
    }

    const observer = new ResizeObserver(() => controller.resize())
    observer.observe(canvas)

    return () => {
      observer.disconnect()
      controller.destroy()
      controllerRef.current = null
    }
  }, [])

  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) {
      return
    }
    controller.setSettings({
      bands: clamp(Math.round(bands), MIN_BANDS, MAX_BANDS),
      blur: clamp(blur, 0, 1),
      colors: resolvedColors,
      direction: direction === 'down' ? 1 : 0,
      grain,
      intensity: clamp(intensity, 0, 1),
      speed: Math.max(speed, 0),
    })
    controller.render()
  }, [bands, blur, direction, grain, intensity, resolvedColors, speed])

  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) {
      return
    }
    const shouldRun = isActive && !paused
    controller.setRunning(shouldRun)
    if (!shouldRun) {
      controller.render()
    }
  }, [isActive, paused])

  const fallbackBackground = colors
    .map((color, index) => {
      const x = 14 + index * (72 / Math.max(colors.length, 1))
      const y = direction === 'up' ? 108 : -8
      return `radial-gradient(58% 96% at ${x}% ${y}%, ${toCssColor(color)} 0%, transparent 68%)`
    })
    .join(', ')

  return (
    <div className={cn('relative isolate overflow-hidden', className)} ref={hostRef}>
      {isSupported ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <canvas className="h-full w-full" ref={canvasRef} />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70 blur-2xl"
          style={{ backgroundImage: fallbackBackground }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
