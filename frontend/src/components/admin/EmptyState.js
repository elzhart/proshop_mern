import React from 'react'

const Icon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <circle cx='11' cy='11' r='8' />
    <path d='m21 21-4.3-4.3' />
  </svg>
)

const buildMessage = ({ search, filter }) => {
  const hasSearch = search && search.length > 0
  const hasFilter = filter && filter !== 'all'
  if (hasSearch && hasFilter) {
    return { text: 'No features match your filters.', cta: 'Reset filters' }
  }
  if (hasSearch) {
    return { text: `No features match "${search}".`, cta: 'Clear search' }
  }
  if (hasFilter) {
    return { text: `No ${filter} features.`, cta: 'Show all' }
  }
  return { text: 'No features to show.', cta: null }
}

const EmptyState = ({ search, filter, onClear, text: textOverride, cta: ctaOverride }) => {
  const auto = buildMessage({ search, filter })
  const text = textOverride != null ? textOverride : auto.text
  const cta  = ctaOverride  != null ? ctaOverride  : auto.cta
  return (
    <div className='admin-empty'>
      <div className='admin-empty__icon'><Icon /></div>
      <div className='admin-empty__text'>{text}</div>
      {cta && (
        <button type='button' className='admin-empty__cta' onClick={onClear}>{cta}</button>
      )}
    </div>
  )
}

export default EmptyState
