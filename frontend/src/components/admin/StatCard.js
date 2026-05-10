import React from 'react'

const VARIANT_CLASS = {
  default:  '',
  enabled:  'admin-stat--enabled',
  testing:  'admin-stat--testing',
  disabled: 'admin-stat--disabled',
}

const StatCard = ({ label, value, variant = 'default' }) => (
  <div className={`admin-stat ${VARIANT_CLASS[variant] || ''}`}>
    <div className='admin-stat__value'>{value}</div>
    <div className='admin-stat__label'>{label}</div>
  </div>
)

export default StatCard
