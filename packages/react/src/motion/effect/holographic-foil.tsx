// SPDX-License-Identifier: MIT
// 改自 SmoothUI holographic-foil（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。全息箔卡片：条纹箔层随指针或设备倾斜漂移、色相偏转，上面掠过一道柔光，卡片带轻微 3D 倾斜；只在有精确指针的设备上跟指针。相对原件：箔的颜色全由 token 混出（见 tone），去掉 useReducedMotion，「开启倾斜」按钮的文字改成 orientationLabel 属性（不给就不出按钮）。
import { cn } from '../../lib/cn.ts'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import {
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'

type BlendMode = NonNullable<CSSProperties['mixBlendMode']>

export type HolographicFoilPattern = 'aurora' | 'gold' | 'oil' | 'prism'

export interface HolographicFoilProps {
  /** Card content. It renders above the foil, so give text a solid backing. */
  children: ReactNode
  /** Extra classes for the card surface. */
  className?: string
  /**
   * Lay the foil over the content instead of printing it underneath.
   *
   * The default suits a card you assemble here — bare stock and translucent
   * artwork let the print show through from below. Turn this on when the child
   * is one opaque image of a finished card face, which would otherwise hide the
   * foil completely.
   */
  foilOver?: boolean
  /** Strength of the highlight that passes over the content, `0` to `1`. */
  glare?: number
  /** Foil strength, `0` (barely there) to `1` (full holo). */
  intensity?: number
  /** Which foil material the card is printed with. */
  pattern?: HolographicFoilPattern
  /** Speed multiplier for the idle sheen sweep. `1` is the default cadence. */
  sheenSpeed?: number
  /** Couple the foil to a subtle 3D card tilt. */
  tilt?: boolean
  /** Opt into device tilt on touch devices. Permission is requested on demand. */
  useDeviceOrientation?: boolean
  /** Label of the button that asks for device-tilt permission (iOS); without it no button is shown. */
  orientationLabel?: string
}

interface FoilMaterial {
  /** Banded gradient stack — bands with gaps, never a uniform wash. */
  background: string
  blend: BlendMode
  /** Degrees of hue travel across the full tilt range. Narrow keeps identity. */
  hueRange: number
  /** Per-material saturation multiplier. */
  saturation: number
}

type OrientationAccess = 'denied' | 'granted' | 'idle' | 'prompt'

interface OrientationPermissionApi {
  requestPermission?: () => Promise<'denied' | 'granted'>
}

/** token 色按百分比透明度混出来：箔的颜色全走主题，不写死。 */
const tone = (token: string, percent: number) => `color-mix(in oklch, var(${token}) ${percent}%, transparent)`

const HOVER_QUERY = '(hover: hover) and (pointer: fine)'
const MAX_TILT_DEG = 9
const PERSPECTIVE_PX = 900
const FOIL_DRIFT = 14
const GLARE_DRIFT = 42
const SHEEN_BASE_DURATION_S = 6
const ORIENTATION_RANGE_DEG = 32
const AXIS_MIN = -0.5
const AXIS_MAX = 0.5
const MIN_SHEEN_SPEED = 0.05
const SPRING_CONFIG = { damping: 28, mass: 0.6, stiffness: 240 } as const
const LINEAR_EASE: [number, number, number, number] = [0.25, 0.25, 0.75, 0.75]

const FOIL_MIN_OPACITY = 0.05
const FOIL_MAX_OPACITY = 0.85
const FOIL_MIN_SATURATION = 0.5
const FOIL_SATURATION_GAIN = 0.85
const FOIL_MIN_CONTRAST = 0.95
const FOIL_CONTRAST_GAIN = 0.3
/** The sheen never runs at full strength: it crosses text. */
const SHEEN_OPACITY_RATIO = 0.34
const GLARE_OPACITY_RATIO = 0.18
const SHEEN_FROM = '-120%'
const SHEEN_TO = '220%'

/**
 * Concentrates the foil into a diagonal band. Because the layer translates with
 * the tilt, the band travels across the card instead of tinting all of it.
 */
const FOIL_MASK =
  'linear-gradient(104deg, transparent 0%, oklch(0 0 0 / 0.35) 14%, oklch(0 0 0) 30%, oklch(0 0 0) 70%, oklch(0 0 0 / 0.35) 86%, transparent 100%)'

const SHEEN_GRADIENT = `linear-gradient(102deg, transparent 0%, ${tone('--signal-blue', 55)} 34%, ${tone('--k-color-white', 85)} 50%, ${tone('--series-7', 50)} 66%, transparent 100%)`
/**
 * The sheen gradient is tilted, so its `transparent` stops run diagonally while
 * the band it paints is a rectangle. Near the top the band's own left edge lands
 * mid-gradient, and the box boundary shows up as a straight vertical cut
 * travelling across the card. This fades the band's vertical edges so only the
 * gradient decides where the sheen ends.
 */
const SHEEN_EDGE_FADE =
  'linear-gradient(to right, transparent 0%, oklch(0 0 0) 22%, oklch(0 0 0) 78%, transparent 100%)'
const GLARE_GRADIENT = `radial-gradient(closest-side, ${tone('--k-color-white', 75)}, ${tone('--k-color-white', 12)} 55%, transparent 78%)`

const MATERIALS: Record<HolographicFoilPattern, FoilMaterial> = {
  // 冷箔：蓝、紫、青。
  aurora: {
    background: [
      `repeating-linear-gradient(103deg, transparent 0 5%, ${tone('--series-2', 85)} 7.5%, ${tone('--series-4', 80)} 10.5%, ${tone('--series-6', 85)} 13.5%, transparent 16% 26%)`,
      `linear-gradient(160deg, ${tone('--series-2', 50)}, transparent 65%)`,
    ].join(', '),
    blend: 'screen',
    hueRange: 20,
    saturation: 1,
  },
  // 暖箔：金、橙、洋红。
  gold: {
    background: [
      `repeating-linear-gradient(97deg, transparent 0 5%, ${tone('--signal-amber', 85)} 7.5%, ${tone('--accent', 80)} 10.5%, ${tone('--series-7', 78)} 14%, transparent 17% 27%)`,
      `linear-gradient(150deg, ${tone('--series-5', 45)}, transparent 68%)`,
    ].join(', '),
    blend: 'screen',
    hueRange: 24,
    saturation: 1,
  },
  // 油膜：色相铺得宽，透明度压低，读起来是一层薄膜。
  oil: {
    background: [
      `repeating-linear-gradient(110deg, transparent 0 6%, ${tone('--series-6', 55)} 8.5%, ${tone('--series-4', 50)} 12%, ${tone('--series-3', 45)} 15.5%, transparent 18.5% 30%)`,
      `linear-gradient(135deg, ${tone('--series-2', 30)}, transparent 70%)`,
    ].join(', '),
    blend: 'screen',
    hueRange: 30,
    saturation: 0.7,
  },
  // 全息：青、紫、洋红，加一条金带。
  prism: {
    background: [
      `repeating-linear-gradient(100deg, transparent 0 4%, ${tone('--series-6', 90)} 6%, ${tone('--series-4', 88)} 9%, ${tone('--series-7', 86)} 12%, ${tone('--signal-amber', 70)} 15%, transparent 17.5% 25%)`,
      `radial-gradient(120% 90% at 30% 15%, ${tone('--series-2', 50)}, transparent 65%)`,
    ].join(', '),
    blend: 'screen',
    hueRange: 34,
    saturation: 1.1,
  },
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const clampAxis = (value: number) => Math.max(AXIS_MIN, Math.min(AXIS_MAX, value))

const readOrientationApi = (): OrientationPermissionApi | undefined => {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
    return
  }
  return window.DeviceOrientationEvent as unknown as OrientationPermissionApi
}

export const HolographicFoil = ({
  children,
  className,
  foilOver = false,
  glare = 0.5,
  intensity = 0.6,
  pattern = 'prism',
  sheenSpeed = 1,
  tilt = true,
  useDeviceOrientation = false,
  orientationLabel,
}: HolographicFoilProps) => {
  const [isHoverDevice, setIsHoverDevice] = useState(false)
  const [orientationAccess, setOrientationAccess] = useState<OrientationAccess>('idle')

  const material = MATERIALS[pattern]
  const foilLevel = clamp01(intensity)
  const glareLevel = clamp01(glare)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, SPRING_CONFIG)
  const springY = useSpring(pointerY, SPRING_CONFIG)

  const rotateX = useTransform(springY, [AXIS_MIN, AXIS_MAX], [MAX_TILT_DEG, -MAX_TILT_DEG])
  const rotateY = useTransform(springX, [AXIS_MIN, AXIS_MAX], [-MAX_TILT_DEG, MAX_TILT_DEG])
  const hue = useTransform(springX, [AXIS_MIN, AXIS_MAX], [-material.hueRange, material.hueRange])
  const foilX = useTransform(springX, [AXIS_MIN, AXIS_MAX], [`${-FOIL_DRIFT}%`, `${FOIL_DRIFT}%`])
  const foilY = useTransform(springY, [AXIS_MIN, AXIS_MAX], [`${-FOIL_DRIFT}%`, `${FOIL_DRIFT}%`])
  const glareX = useTransform(springX, [AXIS_MIN, AXIS_MAX], [`${-GLARE_DRIFT}%`, `${GLARE_DRIFT}%`])
  const glareY = useTransform(springY, [AXIS_MIN, AXIS_MAX], [`${-GLARE_DRIFT}%`, `${GLARE_DRIFT}%`])
  const sheenX = useTransform(springX, [AXIS_MIN, AXIS_MAX], ['-18%', '18%'])

  const saturation = (FOIL_MIN_SATURATION + foilLevel * FOIL_SATURATION_GAIN) * material.saturation
  const contrast = FOIL_MIN_CONTRAST + foilLevel * FOIL_CONTRAST_GAIN
  const foilFilter = useMotionTemplate`hue-rotate(${hue}deg) saturate(${saturation}) contrast(${contrast})`
  const foilOpacity = FOIL_MIN_OPACITY + foilLevel * (FOIL_MAX_OPACITY - FOIL_MIN_OPACITY)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    const query = window.matchMedia(HOVER_QUERY)
    // oxlint-disable-next-line react/set-state-in-effect -- 挂载后才知道环境，必须在 effect 里设
    setIsHoverDevice(query.matches)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsHoverDevice(event.matches)
    }
    query.addEventListener('change', handleChange)
    return () => {
      query.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (!useDeviceOrientation) {
      // oxlint-disable-next-line react/set-state-in-effect -- 挂载后才知道环境，必须在 effect 里设
      setOrientationAccess('idle')
      return
    }
    const api = readOrientationApi()
    if (!api) {
      setOrientationAccess('denied')
      return
    }
    setOrientationAccess(typeof api.requestPermission === 'function' ? 'prompt' : 'granted')
  }, [useDeviceOrientation])

  const orientationActive = useDeviceOrientation && orientationAccess === 'granted'

  useEffect(() => {
    if (!orientationActive || typeof window === 'undefined') {
      return
    }
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0
      const beta = event.beta ?? 0
      pointerX.set(clampAxis(gamma / ORIENTATION_RANGE_DEG / 2))
      pointerY.set(clampAxis(beta / ORIENTATION_RANGE_DEG / 2))
    }
    window.addEventListener('deviceorientation', handleOrientation)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [orientationActive, pointerX, pointerY])

  const requestOrientation = useCallback(async () => {
    const api = readOrientationApi()
    if (typeof api?.requestPermission !== 'function') {
      setOrientationAccess('denied')
      return
    }
    try {
      const result = await api.requestPermission()
      setOrientationAccess(result === 'granted' ? 'granted' : 'denied')
    } catch {
      setOrientationAccess('denied')
    }
  }, [])

  const tracksPointer = isHoverDevice

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      pointerX.set(clampAxis((event.clientX - rect.left) / rect.width - 0.5))
      pointerY.set(clampAxis((event.clientY - rect.top) / rect.height - 0.5))
    },
    [pointerX, pointerY],
  )

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0)
    pointerY.set(0)
  }, [pointerX, pointerY])

  const isLive = tracksPointer || orientationActive

  /**
   * The print itself. Placed either under or over the content depending on
   * `foilOver`, which is the only thing that differs between the two modes.
   */
  const foilLayer = (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        backgroundImage: material.background,
        filter: isLive ? foilFilter : undefined,
        inset: `-${FOIL_DRIFT * 2}%`,
        maskImage: FOIL_MASK,
        mixBlendMode: material.blend,
        opacity: foilOpacity,
        WebkitMaskImage: FOIL_MASK,
        willChange: 'transform',
        x: isLive ? foilX : 0,
        y: isLive ? foilY : 0,
      }}
    />
  )

  const foilUnder = foilOver ? null : foilLayer
  const foilAbove = foilOver ? foilLayer : null
  const sheenDuration = SHEEN_BASE_DURATION_S / Math.max(MIN_SHEEN_SPEED, sheenSpeed)
  const showPermissionButton = useDeviceOrientation && Boolean(orientationLabel) && orientationAccess === 'prompt'

  return (
    // The tilt lives on the same element as the border, the stock colour and
    // the clip, so the card turns as one rigid object. With the transform on an
    // inner wrapper, this outer box stayed square while its contents leaned —
    // a static window with a card moving behind it, which is very obvious once
    // the child is a full-bleed image rather than a padded layout.
    <motion.div
      className={cn(
        'relative isolate overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface-1 shadow-[var(--lift)]',
        className,
      )}
      onPointerLeave={tracksPointer ? handlePointerLeave : undefined}
      onPointerMove={tracksPointer ? handlePointerMove : undefined}
      style={
        tilt && isLive
          ? {
              rotateX,
              rotateY,
              transformPerspective: PERSPECTIVE_PX,
              transformStyle: 'preserve-3d',
            }
          : undefined
      }
    >
      <div className="relative h-full">
        {/* Layer order is DOM order, deliberately: no `z-index` anywhere, so no
            child creates a stacking context and content can blend with the foil
            (an artwork can; a text scrim stays opaque). Which side of the
            content the print lands on is `foilOver`. */}
        {foilUnder}

        <div className="relative h-full">{children}</div>

        {foilAbove}

        {/* Restrained highlight pass over the content. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <motion.div className="absolute inset-0" style={{ x: isLive ? sheenX : 0 }}>
            <motion.div
              animate={isLive ? { x: [SHEEN_FROM, SHEEN_TO] } : undefined}
              className="absolute inset-y-0 left-0 w-2/3"
              style={{
                backgroundImage: SHEEN_GRADIENT,
                maskImage: SHEEN_EDGE_FADE,
                mixBlendMode: 'soft-light',
                opacity: glareLevel * SHEEN_OPACITY_RATIO,
                WebkitMaskImage: SHEEN_EDGE_FADE,
                willChange: 'transform',
              }}
              transition={
                isLive
                  ? {
                      duration: sheenDuration,
                      ease: LINEAR_EASE,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'loop',
                    }
                  : { duration: 0 }
              }
            />
          </motion.div>
        </div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            backgroundImage: GLARE_GRADIENT,
            inset: `-${GLARE_DRIFT}%`,
            mixBlendMode: 'soft-light',
            opacity: glareLevel * GLARE_OPACITY_RATIO,
            willChange: 'transform',
            x: isLive ? glareX : 0,
            y: isLive ? glareY : 0,
          }}
        />
      </div>

      {showPermissionButton ? (
        <button
          className="k-text-caption absolute right-2 bottom-2 cursor-pointer rounded-[var(--radius-control)] border border-line-strong bg-surface-3 px-3 py-1 text-ink outline-none transition-colors duration-150 ease-out hover:bg-surface-4 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          onClick={requestOrientation}
          type="button"
        >
          {orientationLabel}
        </button>
      ) : null}
    </motion.div>
  )
}
