import React from 'react'

const FormField = ({ id, label, required, helper, error, children }) => (
  <div className={`admin-field ${error ? 'admin-field--error' : ''}`}>
    {label && (
      <label htmlFor={id} className='admin-field__label'>
        {label}
        {required && <span className='admin-field__required' aria-hidden='true'> *</span>}
      </label>
    )}
    {React.Children.map(children, (child) =>
      React.cloneElement(child, {
        id,
        'aria-required': required ? 'true' : undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': helper || error ? `${id}-msg` : undefined,
      })
    )}
    {(error || helper) && (
      <div
        id={`${id}-msg`}
        className={`admin-field__msg ${error ? 'admin-field__msg--error' : 'admin-field__msg--helper'}`}
      >
        {error || helper}
      </div>
    )}
  </div>
)

export default FormField
