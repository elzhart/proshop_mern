import React from 'react'

const Check = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <polyline points='20 6 9 17 4 12' />
  </svg>
)

const Minus = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='2.5' strokeLinecap='round' aria-hidden='true'>
    <line x1='5' y1='12' x2='19' y2='12' />
  </svg>
)

const BooleanCell = ({ value, trueLabel = 'Yes', falseLabel = 'No', neutral }) => {
  if (neutral) {
    return (
      <span className='admin-bool admin-bool--neutral' aria-label='Not applicable'>
        <Minus />
      </span>
    )
  }
  if (value) {
    return (
      <span className='admin-bool admin-bool--true' aria-label={trueLabel}>
        <Check />
      </span>
    )
  }
  return (
    <span className='admin-bool admin-bool--false' aria-label={falseLabel}>
      <Minus />
    </span>
  )
}

export default BooleanCell
