import React, { useEffect } from 'react'

const VARIANT_ICON = {
  success: (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor'
         strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
      <polyline points='22 4 12 14.01 9 11.01' />
    </svg>
  ),
  error: (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor'
         strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='8' x2='12' y2='12' />
      <line x1='12' y1='16' x2='12.01' y2='16' />
    </svg>
  ),
  warning: (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor'
         strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
      <line x1='12' y1='9' x2='12' y2='13' />
      <line x1='12' y1='17' x2='12.01' y2='17' />
    </svg>
  ),
  info: (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor'
         strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='16' x2='12' y2='12' />
      <line x1='12' y1='8' x2='12.01' y2='8' />
    </svg>
  ),
}

const CloseIcon = () => (
  <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <line x1='18' y1='6' x2='6' y2='18' />
    <line x1='6' y1='6' x2='18' y2='18' />
  </svg>
)

const Banner = ({ variant = 'info', message, onClose, autoDismissMs }) => {
  useEffect(() => {
    if (!autoDismissMs) return
    const t = setTimeout(() => onClose && onClose(), autoDismissMs)
    return () => clearTimeout(t)
  }, [autoDismissMs, onClose])

  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status'
  return (
    <div className={`admin-banner admin-banner--${variant}`} role={role} aria-live='polite'>
      <span className='admin-banner__icon'>{VARIANT_ICON[variant]}</span>
      <span className='admin-banner__msg'>{message}</span>
      {onClose && (
        <button type='button' className='admin-banner__close' onClick={onClose} aria-label='Dismiss'>
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

export default Banner
