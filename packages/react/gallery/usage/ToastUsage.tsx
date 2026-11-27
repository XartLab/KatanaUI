// SPDX-License-Identifier: MIT
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastCountdown,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
} from '../../src/index'

export function ToastUsage() {
  return (
    <div className="flex w-[340px] flex-col gap-2">
      <Toast>
        <ToastContent>
          <ToastIcon />
          <ToastText>
            <ToastTitle>BTCUSDT crossed 106,000</ToastTitle>
            <ToastDescription>Trigger price 106,012.4</ToastDescription>
          </ToastText>
          <ToastClose label="Dismiss" />
        </ToastContent>
      </Toast>
      {/* An action toast: do the thing first, then offer Undo. remaining (0 to 1) comes from your own clock. */}
      <Toast>
        <ToastContent>
          <ToastIcon />
          <ToastText>
            <ToastTitle>Drawing deleted</ToastTitle>
            <ToastDescription>Trend line BTCUSDT 1H</ToastDescription>
          </ToastText>
          <ToastCountdown remaining={0.6} />
          <ToastAction>Undo</ToastAction>
          <ToastClose label="Dismiss" />
        </ToastContent>
      </Toast>
    </div>
  )
}
