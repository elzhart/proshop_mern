import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const Bolt = () => (
  <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
  </svg>
)

const WiredMarker = ({ featureId }) => (
  <OverlayTrigger
    placement='top'
    overlay={
      <Tooltip id={`wired-${featureId}`}>
        Wired — this flag actually affects runtime UI
      </Tooltip>
    }
  >
    <span className='admin-wired' aria-label='Wired feature: affects runtime UI'>
      <Bolt />
    </span>
  </OverlayTrigger>
)

export default WiredMarker
