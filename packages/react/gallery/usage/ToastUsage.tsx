// SPDX-License-Identifier: MIT
import { Toast, ToastContent, ToastClose, ToastDescription, ToastIcon, ToastText, ToastTitle } from '../../src/index'

export function ToastUsage() {
  return (
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
  )
}
