import React from 'react'

const Checkbox = React.forwardRef(({ checked, onChange, label, disabled, ...rest }, ref) => (
  <label className={`admin-checkbox ${disabled ? 'admin-checkbox--disabled' : ''}`}>
    <input
      ref={ref}
      type='checkbox'
      className='admin-checkbox__input'
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      {...rest}
    />
    <span className='admin-checkbox__box' aria-hidden='true' />
    <span className='admin-checkbox__label'>{label}</span>
  </label>
))

export default Checkbox
