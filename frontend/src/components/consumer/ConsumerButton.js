import React from 'react'

/**
 * Consumer-facing button.
 *
 * Props:
 *   variant: 'primary' | 'secondary' | 'ghost'     (default: primary)
 *   size:    'sm' | 'md' | 'lg'                    (default: md)
 *   full:    boolean                                — full-width
 *   loading: boolean                                — replaces label with spinner (light)
 *   ...rest: native button props
 */
const Spinner = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='2.5' strokeLinecap='round' aria-hidden='true'
       style={{ animation: 'consumer-spin 1s linear infinite' }}>
    <path d='M12 2 a 10 10 0 0 1 10 10' />
  </svg>
)

const ConsumerButton = React.forwardRef(
  ({
    variant = 'primary',
    size = 'md',
    full,
    loading,
    disabled,
    children,
    className = '',
    ...rest
  }, ref) => (
    <button
      ref={ref}
      className={[
        'consumer-btn',
        `consumer-btn--${variant}`,
        `consumer-btn--${size}`,
        full ? 'consumer-btn--full' : '',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
)

export default ConsumerButton
