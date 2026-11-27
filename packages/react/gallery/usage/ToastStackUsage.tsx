// SPDX-License-Identifier: MIT
import { useRef } from 'react'
import { Button, ToastStack, type ToastStackHandle } from '../../src/index'

export function ToastStackUsage() {
  const stack = useRef<ToastStackHandle>(null)
  return (
    <>
      <Button
        onClick={() =>
          stack.current?.push({
            title: 'Watchlist item removed',
            description: 'ACME is no longer on your watchlist',
            // Clicking Undo turns this same toast into the result below; no second toast appears.
            action: { label: 'Undo', result: { title: 'Restored', description: 'ACME is back on your watchlist' } },
          })
        }
      >
        Remove
      </Button>
      <ToastStack ref={stack} labels={{ region: 'Notifications', close: 'Dismiss' }} />
    </>
  )
}
