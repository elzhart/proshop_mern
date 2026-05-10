import React from 'react'

const AlertIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <circle cx='12' cy='12' r='10' />
    <line x1='12' y1='8' x2='12' y2='12' />
    <line x1='12' y1='16' x2='12.01' y2='16' />
  </svg>
)

const ErrorState = ({ message, onRetry }) => (
  <div className='admin-error' role='alert'>
    <div className='admin-error__icon'><AlertIcon /></div>
    <div className='admin-error__body'>
      <div className='admin-error__title'>Couldn't load features</div>
      <div className='admin-error__msg'>{message}</div>
    </div>
    <button type='button' className='admin-error__retry' onClick={onRetry}>Retry</button>
  </div>
)

export default ErrorState
