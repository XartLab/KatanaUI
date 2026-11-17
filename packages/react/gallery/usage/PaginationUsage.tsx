// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Pagination } from '../../src/index'

export function PaginationUsage() {
  const [page, setPage] = useState(5)
  return (
    <Pagination
      page={page}
      totalPages={20}
      onPageChange={setPage}
      labels={{ nav: 'Pagination', previous: 'Previous', next: 'Next', page: (n) => `Go to page ${n}` }}
    />
  )
}
