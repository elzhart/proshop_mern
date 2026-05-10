import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import SearchInput from '../components/admin/SearchInput'
import FilterChip from '../components/admin/FilterChip'
import ProductRow from '../components/admin/ProductRow'
import SkeletonRow from '../components/admin/SkeletonRow'
import EmptyState from '../components/admin/EmptyState'
import ErrorState from '../components/admin/ErrorState'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import Banner from '../components/admin/Banner'
import Pagination from '../components/admin/Pagination'
import {
  listProducts,
  deleteProduct,
  createProduct,
} from '../actions/productActions'
import { PRODUCT_CREATE_RESET } from '../constants/productConstants'
import '../styles/admin.css'

const PRODUCT_SKELETON_WIDTHS = [
  { w: 140, h: 12 },
  { w: '60%', h: 14 },
  { w: 80, h: 14 },
  { w: 100, h: 14 },
  { w: 100, h: 14 },
  { w: 60, h: 14 },
]

const PlusIcon = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'
       style={{ marginRight: 6 }}>
    <line x1='12' y1='5' x2='12' y2='19' />
    <line x1='5' y1='12' x2='19' y2='12' />
  </svg>
)

const ProductListScreen = ({ history, match }) => {
  const pageNumber = match.params.pageNumber || 1
  const dispatch = useDispatch()

  const productList = useSelector((s) => s.productList)
  const { loading, error, products, page, pages } = productList

  const productDelete = useSelector((s) => s.productDelete)
  const { error: errorDelete, success: successDelete } = productDelete

  const productCreate = useSelector((s) => s.productCreate)
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
    product: createdProduct,
  } = productCreate

  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET })
    if (!userInfo || !userInfo.isAdmin) {
      history.push('/login')
      return
    }
    if (successCreate) {
      history.push(`/admin/product/${createdProduct._id}/edit`)
    } else {
      dispatch(listProducts(debouncedSearch, pageNumber))
    }
  }, [
    dispatch, history, userInfo,
    successDelete, successCreate, createdProduct,
    pageNumber, debouncedSearch,
  ])

  useEffect(() => {
    if (successDelete) {
      setBanner({ variant: 'success', message: 'Product deleted' })
      setConfirmTarget(null)
    }
  }, [successDelete])

  useEffect(() => {
    if (errorDelete) {
      setBanner({ variant: 'error', message: errorDelete })
      setConfirmTarget(null)
    }
  }, [errorDelete])

  useEffect(() => {
    if (errorCreate) setBanner({ variant: 'error', message: errorCreate })
  }, [errorCreate])

  const categories = useMemo(() => {
    if (!products) return []
    const set = new Set(products.map((p) => p.category).filter(Boolean))
    return [...set]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!products) return []
    if (categoryFilter === 'all') return products
    return products.filter((p) => p.category === categoryFilter)
  }, [products, categoryFilter])

  const handleConfirm = () => {
    if (confirmTarget) dispatch(deleteProduct(confirmTarget._id))
  }

  const handleCreate = () => {
    dispatch(createProduct())
  }

  const hasProducts = products && products.length > 0
  const counterText = hasProducts && pages
    ? `Page ${page} of ${pages} · ${products.length} on this page`
    : null

  return (
    <div className='admin-root'>
      <AdminPageHeader
        title='Products'
        subtitle={counterText}
        right={(
          <button
            type='button'
            className='admin-btn admin-btn--primary'
            onClick={handleCreate}
            disabled={loadingCreate}
          >
            <PlusIcon />
            {loadingCreate ? 'Creating…' : 'Create Product'}
          </button>
        )}
      />

      {banner && (
        <Banner
          variant={banner.variant}
          message={banner.message}
          onClose={() => setBanner(null)}
          autoDismissMs={banner.variant === 'success' ? 5000 : null}
        />
      )}

      <div className='admin-controls'>
        <div className='admin-controls__search'>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder='Search products by name or brand…'
            disabled={loading && !hasProducts}
          />
        </div>
        {categories.length > 0 && (
          <div className='admin-controls__chips' role='tablist' aria-label='Filter by category'>
            <FilterChip
              label='All'
              count={products ? products.length : 0}
              active={categoryFilter === 'all'}
              tabIndex={categoryFilter === 'all' ? 0 : -1}
              onClick={() => setCategoryFilter('all')}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                count={products.filter((p) => p.category === cat).length}
                active={categoryFilter === cat}
                tabIndex={categoryFilter === cat ? 0 : -1}
                onClick={() => setCategoryFilter(cat)}
              />
            ))}
          </div>
        )}
      </div>

      {error ? (
        <ErrorState
          message='Could not load products. Make sure the backend is running on port 5001.'
          onRetry={() => window.location.reload()}
        />
      ) : !loading && filteredProducts.length === 0 && hasProducts ? (
        <EmptyState
          text={`No products in "${categoryFilter}" category on this page.`}
          cta='Show all'
          onClear={() => setCategoryFilter('all')}
        />
      ) : !loading && !hasProducts ? (
        <EmptyState text='No products yet' cta='Create the first product' onClear={handleCreate} />
      ) : (
        <div className='admin-table-wrap'>
          <table className='admin-table' aria-label='Products' aria-busy={loading ? 'true' : 'false'}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Brand</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} widths={PRODUCT_SKELETON_WIDTHS} />)
                : filteredProducts.map((p) => (
                    <ProductRow key={p._id} product={p} onDelete={setConfirmTarget} />
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} basePath='/admin/productlist' />

      <ConfirmDialog
        open={!!confirmTarget}
        title='Delete product?'
        description={
          confirmTarget
            ? `This will permanently remove "${confirmTarget.name}".`
            : ''
        }
        confirmLabel='Delete'
        confirmVariant='danger'
        cancelLabel='Cancel'
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}

export default ProductListScreen
