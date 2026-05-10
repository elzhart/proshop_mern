import React from 'react'

const VARIANT_CLASS = {
  Enabled:  'admin-badge--enabled',
  Testing:  'admin-badge--testing',
  Disabled: 'admin-badge--disabled',
}

const StatusBadge = ({ status, trafficPercentage }) => {
  const cls = VARIANT_CLASS[status] || 'admin-badge--disabled'
  const label = `Status: ${status}, traffic ${trafficPercentage}%`
  return (
    <span className={`admin-badge ${cls}`} aria-label={label}>
      {status.toUpperCase()}
    </span>
  )
}

export default StatusBadge
