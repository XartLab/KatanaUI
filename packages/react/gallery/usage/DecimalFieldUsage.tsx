// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DecimalField } from '../../src/quant'

const BUTTONS = { decrease: '减一格', increase: '加一格' }

export function DecimalFieldUsage() {
  const [price, setPrice] = useState('67000.3')
  const [qty, setQty] = useState('')
  // 只读与禁用也接真的 onValue：要是件在这两种状态下还会改值，演示页上就看得见。
  const [locked, setLocked] = useState('100.5')
  return (
    <>
      <div className="gal-wide">
        <DecimalField label="价格" value={price} onValueChange={setPrice} step="0.5" buttons={BUTTONS} />
      </div>
      <output data-testid="decimal-price-out">{price}</output>

      <div className="gal-wide">
        <DecimalField
          label="数量"
          value={qty}
          onValueChange={setQty}
          step="0.001"
          base="1"
          unit="BTC"
          placeholder="1"
          buttons={BUTTONS}
        />
      </div>
      <output data-testid="decimal-qty-out">{qty}</output>

      <DecimalField label="只读价格" value={locked} onValueChange={setLocked} step="0.5" readOnly buttons={BUTTONS} />

      <DecimalField label="禁用价格" value={locked} onValueChange={setLocked} step="0.5" disabled buttons={BUTTONS} />

      <DecimalField label="错误价格" value="abc" onValueChange={() => {}} step="0.5" status="error" />

      <DecimalField label="警告价格" value="100.3" onValueChange={() => {}} step="0.5" status="warning" />
    </>
  )
}
