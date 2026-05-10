import React from 'react'

const NumberInput = React.forwardRef(
  ({ value, onChange, prefix, suffix, min, max, step = 1, disabled, placeholder, ...rest }, ref) => (
    <div className={`admin-numinput ${disabled ? 'admin-numinput--disabled' : ''}`}>
      {prefix && <span className='admin-numinput__affix'>{prefix}</span>}
      <input
        ref={ref}
        type='number'
        className='admin-numinput__input'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.target.blur()}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        {...rest}
      />
      {suffix && <span className='admin-numinput__affix admin-numinput__affix--end'>{suffix}</span>}
    </div>
  )
)

export default NumberInput
