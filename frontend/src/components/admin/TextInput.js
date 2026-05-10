import React from 'react'

const TextInput = React.forwardRef(
  ({ type = 'text', value, onChange, onBlur, placeholder, disabled, ...rest }, ref) => (
    <input
      ref={ref}
      type={type}
      className='admin-input'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      {...rest}
    />
  )
)

export default TextInput
