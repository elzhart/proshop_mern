import React from 'react'

const Check = () => (
  <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <polyline points='20 6 9 17 4 12' />
  </svg>
)
const Cross = () => (
  <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <line x1='18' y1='6' x2='6' y2='18' />
    <line x1='6' y1='6' x2='18' y2='18' />
  </svg>
)

const formatDate = (iso) => {
  if (!iso) return ''
  return String(iso).substring(0, 10)
}

const DateOrCrossCell = ({ date, positiveLabel = 'Yes', negativeLabel = 'No' }) => {
  if (date) {
    return (
      <span
        className='admin-date-cell admin-date-cell--positive'
        aria-label={`${positiveLabel} on ${formatDate(date)}`}
      >
        <span className='admin-date-cell__icon admin-date-cell__icon--positive'><Check /></span>
        <time dateTime={date} className='admin-date-cell__date'>{formatDate(date)}</time>
      </span>
    )
  }
  return (
    <span className='admin-date-cell' aria-label={negativeLabel}>
      <span className='admin-date-cell__icon admin-date-cell__icon--negative'><Cross /></span>
    </span>
  )
}

export default DateOrCrossCell
