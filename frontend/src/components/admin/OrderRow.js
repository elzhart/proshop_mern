import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import DateOrCrossCell from './DateOrCrossCell'

const truncateMid = (s, head = 6, tail = 4) => {
  if (!s || s.length <= head + tail + 1) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

const formatTotal = (n) => {
  const num = Number(n) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const OrderRow = ({ order }) => (
  <tr className='admin-row'>
    <td className='admin-row__id'>
      <OverlayTrigger placement='top' overlay={<Tooltip id={`oid-${order._id}`}>{order._id}</Tooltip>}>
        <code>{truncateMid(order._id)}</code>
      </OverlayTrigger>
    </td>
    <td className='admin-row__user'>
      {order.user ? order.user.name : <span className='admin-muted'>—</span>}
    </td>
    <td className='admin-row__date'>
      <time dateTime={order.createdAt} className='admin-mono-cell'>
        {String(order.createdAt || '').substring(0, 10)}
      </time>
    </td>
    <td className='admin-row__total'>
      <span className='admin-price'>
        <span className='admin-price__sym'>$</span>
        <span className='admin-price__val'>{formatTotal(order.totalPrice)}</span>
      </span>
    </td>
    <td className='admin-row__paid'>
      <DateOrCrossCell
        date={order.isPaid ? order.paidAt : null}
        positiveLabel='Paid'
        negativeLabel='Not paid'
      />
    </td>
    <td className='admin-row__delivered'>
      <DateOrCrossCell
        date={order.isDelivered ? order.deliveredAt : null}
        positiveLabel='Delivered'
        negativeLabel='Not delivered'
      />
    </td>
    <td className='admin-row__actions'>
      <LinkContainer to={`/order/${order._id}`}>
        <a className='admin-btn admin-btn--secondary admin-btn--sm'>Details</a>
      </LinkContainer>
    </td>
  </tr>
)

export default OrderRow
