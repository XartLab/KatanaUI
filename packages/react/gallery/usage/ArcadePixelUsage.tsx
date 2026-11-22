// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ARCADE_SPRITES, ArcadePixel, Button, type ArcadePixelAnimate } from '../../src/index'

const ARCADE_ANIMATES: ArcadePixelAnimate[] = ['none', 'type', 'wipe', 'blink', 'marquee']

export function ArcadePixelUsage() {
  const [run, setRun] = useState(0)
  return (
    <>
      <div data-gallery-arcade>
        <ArcadePixel text="KATANA" pixelSize={6} />
      </div>
      <ArcadePixel text="READY 01" pixelSize={4} />
      <ArcadePixel text="GAME OVER" pixelSize={4} palette={['transparent', 'var(--k-content-primary-foreground)']} />

      {Object.entries(ARCADE_SPRITES).map(([name, sprite]) => (
        <ArcadePixel
          key={name}
          sprite={sprite}
          label={name}
          pixelSize={5}
          palette={['transparent', 'var(--accent)', 'var(--k-content-primary-foreground)']}
        />
      ))}

      {ARCADE_ANIMATES.map((animate) => (
        <ArcadePixel
          key={run}
          text={animate === 'marquee' ? 'KATANA READY' : 'READY'}
          animate={animate}
          columns={animate === 'marquee' ? 36 : undefined}
          loop={animate === 'blink' || animate === 'marquee'}
          pixelSize={3}
        />
      ))}
      <Button onClick={() => setRun((n) => n + 1)}>重播</Button>

      <ArcadePixel text="KATANA" pixelSize={4} glow />

      <ArcadePixel text="KATANA" pixelSize={4} scanlines />

      <ArcadePixel text="KATANA" pixelSize={4} crt glow scanlines />
    </>
  )
}
