// SPDX-License-Identifier: MIT
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../src/index'

export function CardUsage() {
  return (
    <Card style={{ width: 280 }}>
      <CardHeader>
        <CardTitle>Account A</CardTitle>
        <CardDescription>Cash account</CardDescription>
        <CardAction>
          <Button size="sm" variant="ghost">
            Switch
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>Available 182,400.00</CardContent>
      <CardFooter>
        <Button size="sm">Deposit</Button>
      </CardFooter>
    </Card>
  )
}
