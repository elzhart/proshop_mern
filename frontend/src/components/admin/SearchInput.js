import React from 'react'

const SearchIcon = () => (
  <svg
    className='admin-search__icon'
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <circle cx='11' cy='11' r='8' />
    <path d='m21 21-4.3-4.3' />
  </svg>
)

const SearchInput = ({ value, onChange, placeholder = 'Search features…', disabled }) => (
  <div className='admin-search'>
    <SearchIcon />
    <input
      type='text'
      className='admin-search__input'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label='Search features'
      disabled={disabled}
    />
  </div>
)

export default SearchInput
