import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import ActionIconButton from './ActionIconButton'

const truncateMid = (s, head = 6, tail = 4) => {
  if (!s || s.length <= head + tail + 1) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

const formatPrice = (n) => {
  const num = Number(n) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ProductRow = ({ product, onDelete }) => {
  const outOfStock = Number(product.countInStock) === 0
  return (
    <tr className={`admin-row ${outOfStock ? 'admin-row--disabled' : ''}`}>
      <td className='admin-row__id'>
        <OverlayTrigger placement='top' overlay={<Tooltip id={`pid-${product._id}`}>{product._id}</Tooltip>}>
          <code>{truncateMid(product._id)}</code>
        </OverlayTrigger>
      </td>
      <td className='admin-row__name'>
        <span>{product.name}</span>
        {outOfStock && <span className='admin-oos-badge'>Out of stock</span>}
      </td>
      <td className='admin-row__price'>
        <span className='admin-price'>
          <span className='admin-price__sym'>$</span>
          <span className='admin-price__val'>{formatPrice(product.price)}</span>
        </span>
      </td>
      <td className='admin-row__category'>{product.category}</td>
      <td className='admin-row__brand'>{product.brand}</td>
      <td className='admin-row__actions'>
        <LinkContainer to={`/admin/product/${product._id}/edit`}>
          <span>
            <ActionIconButton variant='edit' ariaLabel={`Edit ${product.name}`} tooltip='Edit product' />
          </span>
        </LinkContainer>
        <ActionIconButton
          variant='delete'
          ariaLabel={`Delete ${product.name}`}
          tooltip='Delete product'
          onClick={() => onDelete(product)}
        />
      </td>
    </tr>
  )
}

export default ProductRow
