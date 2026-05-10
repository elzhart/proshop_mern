import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const ICONS = {
  edit: (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
         strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M12 20h9' />
      <path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z' />
    </svg>
  ),
  delete: (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
         strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <polyline points='3 6 5 6 21 6' />
      <path d='M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6' />
      <path d='M10 11v6' />
      <path d='M14 11v6' />
      <path d='M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2' />
    </svg>
  ),
}

const ActionIconButton = React.forwardRef(({
  variant = 'edit',
  onClick,
  ariaLabel,
  tooltip,
  disabled,
}, ref) => {
  const cls = variant === 'delete' ? 'admin-action-btn admin-action-btn--danger' : 'admin-action-btn'
  const btn = (
    <button
      ref={ref}
      type='button'
      className={cls}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {ICONS[variant] || ICONS.edit}
    </button>
  )
  if (!tooltip) return btn
  return (
    <OverlayTrigger placement='top' overlay={<Tooltip id={`act-${variant}`}>{tooltip}</Tooltip>}>
      {btn}
    </OverlayTrigger>
  )
})

export default ActionIconButton
