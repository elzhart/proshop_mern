import React from 'react'

const FilterChip = React.forwardRef(({ label, count, active, onClick, onKeyDown, tabIndex }, ref) => (
  <button
    ref={ref}
    type='button'
    role='tab'
    aria-selected={active}
    tabIndex={tabIndex}
    onClick={onClick}
    onKeyDown={onKeyDown}
    className={`admin-chip ${active ? 'admin-chip--active' : ''}`}
  >
    <span className='admin-chip__label'>{label}</span>
    <span className='admin-chip__sep'>·</span>
    <span className='admin-chip__count'>{count}</span>
  </button>
))

export default FilterChip
