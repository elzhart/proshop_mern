import React from 'react'
import { Link } from 'react-router-dom'

const ChevronLeft = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <polyline points='15 18 9 12 15 6' />
  </svg>
)

const BackLink = ({ to, label = 'Go Back' }) => (
  <Link to={to} className='admin-back-link'>
    <ChevronLeft />
    <span>{label}</span>
  </Link>
)

export default BackLink
