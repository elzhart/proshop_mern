import React from 'react'

const Textarea = React.forwardRef(
  ({ value, onChange, maxLength, showCounter = true, placeholder, disabled, ...rest }, ref) => {
    const len = (value || '').length
    const over = maxLength != null && len > maxLength
    return (
      <div className='admin-textarea-wrap'>
        <textarea
          ref={ref}
          className={`admin-textarea ${over ? 'admin-textarea--over' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          {...rest}
        />
        {showCounter && maxLength != null && (
          <div className={`admin-textarea__counter ${over ? 'admin-textarea__counter--over' : ''}`}>
            {len} / {maxLength}
          </div>
        )}
      </div>
    )
  }
)

export default Textarea
