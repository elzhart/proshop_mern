import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import SearchInput from '../components/admin/SearchInput'
import FilterChip from '../components/admin/FilterChip'
import OrderRow from '../components/admin/OrderRow'
import SkeletonRow from '../components/admin/SkeletonRow'
import EmptyState from '../components/admin/EmptyState'
import ErrorState from '../components/admin/ErrorState'
import { listOrders } from '../actions/orderActions'
import '../styles/admin.css'

const ORDER_SKELETON_WIDTHS = [
  { w: 140, h: 12 },
  { w: 120, h: 14 },
  { w: 90, h: 12 },
  { w: 80, h: 14 },
  { w: 110, h: 18, r: 9999 },
  { w: 110, h: 18, r: 9999 },
  { w: 70, h: 26, r: 6 },
]

const FILTER_OPTIONS = [
  { key: 'all',       label: 'All'       },
  { key: 'paid',      label: 'Paid'      },
  { key: 'unpaid',    label: 'Unpaid'    },
  { key: 'delivered', label: 'Delivered' },
  { key: 'pending',   label: 'Pending'   },
]

const isPendingOrder = (o) => !o.isPaid || !o.isDelivered

const OrderListScreen = ({ history }) => {
  const dispatch = useDispatch()
  const orderList = useSelector((s) => s.orderList)
  const { loading, error, orders } = orderList

  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listOrders())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, userInfo])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(t)
  }, [search])

  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0 }
    return {
      total: orders.length,
      pending: orders.filter(isPendingOrder).length,
    }
  }, [orders])

  const counts = useMemo(() => {
    if (!orders) return { all: 0, paid: 0, unpaid: 0, delivered: 0, pending: 0 }
    return {
      all:       orders.length,
      paid:      orders.filter((o) => o.isPaid).length,
      unpaid:    orders.filter((o) => !o.isPaid).length,
      delivered: orders.filter((o) => o.isDelivered).length,
      pending:   orders.filter(isPendingOrder).length,
    }
  }, [orders])

  const visibleOrders = useMemo(() => {
    if (!orders) return []
    const q = debouncedSearch.trim().toLowerCase()
    return orders.filter((o) => {
      if (statusFilter === 'paid' && !o.isPaid) return false
      if (statusFilter === 'unpaid' && o.isPaid) return false
      if (statusFilter === 'delivered' && !o.isDelivered) return false
      if (statusFilter === 'pending' && !isPendingOrder(o)) return false
      if (q) {
        const idMatch  = o._id && o._id.toLowerCase().includes(q)
        const usrMatch = o.user && o.user.name && o.user.name.toLowerCase().includes(q)
        if (!idMatch && !usrMatch) return false
      }
      return true
    })
  }, [orders, debouncedSearch, statusFilter])

  const hasOrders = orders && orders.length > 0
  const isEmpty = !loading && !error && orders && orders.length === 0

  return (
    <div className='admin-root'>
      <AdminPageHeader
        title='Orders'
        right={hasOrders ? (
          <div className='admin-inline-stats'>
            <span className='admin-inline-stat admin-inline-stat--neutral'>Total: {stats.total}</span>
            <span className='admin-inline-stat admin-inline-stat--warning'>Pending: {stats.pending}</span>
          </div>
        ) : null}
      />

      <div className='admin-controls'>
        <div className='admin-controls__search'>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder='Search by order ID or user…'
            disabled={!hasOrders}
          />
        </div>
        <div className='admin-controls__chips' role='tablist' aria-label='Filter by order status'>
          {FILTER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              count={hasOrders ? counts[opt.key] : 0}
              active={statusFilter === opt.key}
              tabIndex={statusFilter === opt.key ? 0 : -1}
              onClick={() => setStatusFilter(opt.key)}
            />
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState
          message='Could not load orders. Make sure the backend is running on port 5001.'
          onRetry={() => window.location.reload()}
        />
      ) : isEmpty ? (
        <EmptyState text='No orders yet' cta={null} />
      ) : !loading && visibleOrders.length === 0 ? (
        <EmptyState
          text='No orders match your filters.'
          cta='Reset filters'
          onClear={() => { setSearch(''); setStatusFilter('all') }}
        />
      ) : (
        <div className='admin-table-wrap'>
          <table className='admin-table' aria-label='Orders' aria-busy={loading ? 'true' : 'false'}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Delivered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} widths={ORDER_SKELETON_WIDTHS} />)
                : visibleOrders.map((o) => <OrderRow key={o._id} order={o} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default OrderListScreen
