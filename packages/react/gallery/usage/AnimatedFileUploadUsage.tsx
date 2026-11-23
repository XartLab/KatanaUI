// SPDX-License-Identifier: MIT
import { AnimatedFileUpload } from '../../src/index'

export function AnimatedFileUploadUsage() {
  return (
    <AnimatedFileUpload
      accept=".csv,.parquet"
      maxSize={5 * 1024 * 1024}
      onFilesSelected={() => {}}
      labels={{
        zone: 'Import backtest data. Drag files here or press to browse',
        idle: 'Drag a file here or click to browse',
        dragging: 'Drop to import',
        list: 'Chosen files',
        remove: (name) => `Remove ${name}`,
        tooLarge: (count, limit) => `${count} file(s) are over ${limit}`,
      }}
    />
  )
}
