import React from 'react'
import { LinkContainer } from 'react-router-bootstrap'

const ChevronLeft = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <polyline points='15 18 9 12 15 6' />
  </svg>
)
const ChevronRight = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <polyline points='9 18 15 12 9 6' />
  </svg>
)

const buildPageList = (page, pages) => {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, i) => i + 1)
  }
  const items = new Set([1, 2, pages - 1, pages, page - 1, page, page + 1])
  const sorted = [...items].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
}

const Pagination = ({ page, pages, basePath = '/admin/productlist' }) => {
  if (!pages || pages <= 1) return null
  const list = buildPageList(page, pages)
  const prevTo = page > 1     ? `${basePath}/${page - 1}` : null
  const nextTo = page < pages ? `${basePath}/${page + 1}` : null

  return (
    <nav className='admin-pagination' aria-label='Pagination'>
      {prevTo ? (
        <LinkContainer to={prevTo}>
          <a className='admin-page-btn' aria-label='Previous page'><ChevronLeft /> <span>Prev</span></a>
        </LinkContainer>
      ) : (
        <span className='admin-page-btn admin-page-btn--disabled'><ChevronLeft /> <span>Prev</span></span>
      )}

      {list.map((item, idx) =>
        item === '…' ? (
          <span key={`e-${idx}`} className='admin-page-ellipsis' aria-hidden='true'>…</span>
        ) : item === page ? (
          <span key={item} className='admin-page-btn admin-page-btn--active' aria-current='page'>{item}</span>
        ) : (
          <LinkContainer key={item} to={`${basePath}/${item}`}>
            <a className='admin-page-btn'>{item}</a>
          </LinkContainer>
        )
      )}

      {nextTo ? (
        <LinkContainer to={nextTo}>
          <a className='admin-page-btn' aria-label='Next page'><span>Next</span> <ChevronRight /></a>
        </LinkContainer>
      ) : (
        <span className='admin-page-btn admin-page-btn--disabled'><span>Next</span> <ChevronRight /></span>
      )}
    </nav>
  )
}

export default Pagination
