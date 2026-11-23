// SPDX-License-Identifier: MIT
import { CompanyProfile } from '../../src/quotes'

export function CompanyProfileUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <CompanyProfile
        name="Alpha Devices"
        facts={[
          { id: 'sector', label: 'Sector', value: 'Electronic technology' },
          { id: 'industry', label: 'Industry', value: 'Telecommunications equipment' },
        ]}
        description="Designs and sells consumer electronics, computing hardware and related services."
        labels={{ more: 'Show more', less: 'Show less', empty: 'Not connected' }}
      />
    </div>
  )
}
