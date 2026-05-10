import React from 'react'
import { OverlayTrigger, Popover } from 'react-bootstrap'

const PRIORITY_CLASS = (p) => {
  if (!p) return 'admin-pri-none'
  if (p.startsWith('Must')) return 'admin-pri-must'
  if (p === 'Core') return 'admin-pri-core'
  if (p === 'Skip') return 'admin-pri-skip'
  return 'admin-pri-default'
}

const InfoIcon = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <circle cx='12' cy='12' r='10' />
    <line x1='12' y1='16' x2='12' y2='12' />
    <line x1='12' y1='8' x2='12.01' y2='8' />
  </svg>
)

const DescriptionPopover = ({ feature, info }) => {
  if (!info) return null
  const popover = (
    <Popover id={`pop-${feature.id || feature.name}`} className='admin-popover'>
      <Popover.Title as='strong'>{feature.name}</Popover.Title>
      <Popover.Content>
        <p className='admin-pop__lead'>{info.code_state}</p>
        <div className='admin-pop__meta'>
          <span><strong>Сложность:</strong> {info.complexity}/10</span>
          <span className={`admin-pri ${PRIORITY_CLASS(info.priority)}`}>{info.priority}</span>
          <span>Figma: {info.figma_rating}</span>
        </div>
        {info.note && (
          <div className='admin-pop__note'>
            <small><strong>Note:</strong> {info.note}</small>
          </div>
        )}
        {feature.description && (
          <details className='admin-pop__details'>
            <summary><small>spec.description</small></summary>
            <small>{feature.description}</small>
          </details>
        )}
      </Popover.Content>
    </Popover>
  )
  return (
    <OverlayTrigger trigger={['hover', 'focus']} placement='left' overlay={popover}>
      <button type='button' className='admin-info-btn' aria-label={`Show details for ${feature.name}`}>
        <InfoIcon />
      </button>
    </OverlayTrigger>
  )
}

export default DescriptionPopover
