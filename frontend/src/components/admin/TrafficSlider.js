import React from 'react'

const STATUS_FROM_TRAFFIC = (t) =>
  t === 0 ? 'Disabled' : t === 100 ? 'Enabled' : 'Testing'

const TrafficSlider = ({ value, onChange, onCommit, ariaLabel, disabled }) => {
  const status = STATUS_FROM_TRAFFIC(value)
  return (
    <div className={`admin-slider admin-slider--${status.toLowerCase()}`}>
      <input
        type='range'
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={() => onCommit && onCommit(value)}
        onTouchEnd={() => onCommit && onCommit(value)}
        onBlur={() => onCommit && onCommit(value)}
        onKeyUp={() => onCommit && onCommit(value)}
        aria-label={ariaLabel}
        className='admin-slider__input'
      />
      <span className='admin-slider__value' aria-hidden='true'>
        {value}%
      </span>
    </div>
  )
}

export default TrafficSlider
