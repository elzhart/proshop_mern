import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const Undo = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <path d='M3 7v6h6' />
    <path d='M21 17a9 9 0 0 0-15-6.7L3 13' />
  </svg>
)

const ResetButton = ({ onClick, ariaLabel, tooltip = 'Reset to features.json default' }) => (
  <OverlayTrigger placement='top' overlay={<Tooltip id='reset-tt'>{tooltip}</Tooltip>}>
    <button
      type='button'
      className='admin-reset-btn'
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Undo />
    </button>
  </OverlayTrigger>
)

export default ResetButton
