import React from 'react'

const ToggleSwitch = ({ on, onChange, ariaLabel, disabled }) => (
  <button
    type='button'
    role='switch'
    aria-checked={on}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => !disabled && onChange(!on)}
    className={`admin-toggle ${on ? 'admin-toggle--on' : 'admin-toggle--off'}`}
  >
    <span className='admin-toggle__track' aria-hidden='true'>
      <span className='admin-toggle__knob' />
    </span>
  </button>
)

export default ToggleSwitch
