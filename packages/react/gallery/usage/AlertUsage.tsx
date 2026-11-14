// SPDX-License-Identifier: MIT
import { Alert, AlertDescription, AlertTitle } from '../../src/index'

export function AlertUsage() {
  return (
    <Alert tone="warn">
      <AlertTitle>Close to the daily loss limit</AlertTitle>
      <AlertDescription>80% used; trading locks at 100%.</AlertDescription>
    </Alert>
  )
}
