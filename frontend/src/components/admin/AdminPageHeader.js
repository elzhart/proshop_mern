import React from 'react'

const AdminPageHeader = ({ eyebrow = 'Admin · Internal Tools', title, subtitle, right }) => (
  <header className='admin-header'>
    <div className='admin-header__left'>
      <div className='admin-eyebrow'>{eyebrow}</div>
      <h1 className='admin-h1'>{title}</h1>
      {subtitle && <p className='admin-subtitle'>{subtitle}</p>}
    </div>
    {right && <div className='admin-header__right'>{right}</div>}
  </header>
)

export default AdminPageHeader
