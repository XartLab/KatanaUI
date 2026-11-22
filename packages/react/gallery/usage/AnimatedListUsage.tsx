// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AnimatedList, Button } from '../../src/index'

export function AnimatedListUsage() {
  const [rows, setRows] = useState([{ id: 'n1', content: <p>Fab capacity guidance raised</p> }])
  const add = () =>
    setRows((list) => [{ id: `n${list.length + 1}`, content: <p>Headline {list.length + 1}</p> }, ...list])
  return (
    <>
      <Button onClick={add}>New headline</Button>
      <AnimatedList label="Headlines" items={rows} maxVisible={5} />
    </>
  )
}
