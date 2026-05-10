import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useFeaturesContext } from '../context/FeaturesContext'
import useFeatureOverrides from '../hooks/useFeatureOverrides'
import StatCard from '../components/admin/StatCard'
import FilterChip from '../components/admin/FilterChip'
import SearchInput from '../components/admin/SearchInput'
import FeatureRow from '../components/admin/FeatureRow'
import SkeletonRow from '../components/admin/SkeletonRow'
import EmptyState from '../components/admin/EmptyState'
import ErrorState from '../components/admin/ErrorState'
import '../styles/admin.css'

const WIRED_FEATURES = ['image_lazy_loading', 'paypal_express_buttons', 'product_recommendations']

const FILTER_OPTIONS = [
  { key: 'all',      label: 'All'      },
  { key: 'Enabled',  label: 'Enabled'  },
  { key: 'Testing',  label: 'Testing'  },
  { key: 'Disabled', label: 'Disabled' },
]

const STATUS_FROM_TRAFFIC = (t) =>
  t === 0 ? 'Disabled' : t === 100 ? 'Enabled' : 'Testing'

const DashboardFeaturesScreen = ({ history }) => {
  const { features, bucket, connected } = useFeaturesContext()
  const { overrides, setTraffic, resetOne, resetAll, version } = useFeatureOverrides()
  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const [descriptions, setDescriptions] = useState({})
  const [descError, setDescError] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const chipRefs = useRef([])

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) history.push('/login')
  }, [history, userInfo])

  // Descriptions fetch (one-shot, optional)
  useEffect(() => {
    let cancelled = false
    fetch('/api/features/descriptions')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((d) => { if (!cancelled) setDescriptions(d) })
      .catch(() => { if (!cancelled) setDescError(true) })
    return () => { cancelled = true }
  }, [])

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(t)
  }, [search])

  // Apply local overrides on top of features.json
  const effectiveFeatures = useMemo(() => {
    return Object.fromEntries(
      Object.entries(features).map(([id, f]) => {
        const o = overrides[id]
        if (!o) return [id, { ...f, _overridden: false }]
        const traffic = o.traffic
        return [id, {
          ...f,
          traffic_percentage: traffic,
          status: STATUS_FROM_TRAFFIC(traffic),
          _overridden: true,
        }]
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features, version])

  // Counts for stats and chip labels
  const stats = useMemo(() => {
    const list = Object.values(effectiveFeatures)
    return {
      total:    list.length,
      enabled:  list.filter((f) => f.status === 'Enabled').length,
      testing:  list.filter((f) => f.status === 'Testing').length,
      disabled: list.filter((f) => f.status === 'Disabled').length,
    }
  }, [effectiveFeatures])

  // Filtered + searched
  const visibleFeatures = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return Object.entries(effectiveFeatures).filter(([id, f]) => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false
      if (q) {
        if (!f.name.toLowerCase().includes(q) && !id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [effectiveFeatures, debouncedSearch, statusFilter])

  const hasFeatures   = Object.keys(features).length > 0
  const hasOverrides  = Object.keys(overrides).length > 0
  const featuresError = !hasFeatures && !connected && Object.keys(features).length === 0

  // Chip keyboard navigation (←/→/Home/End)
  const handleChipKeyDown = (idx) => (e) => {
    const last = FILTER_OPTIONS.length - 1
    let next = null
    if (e.key === 'ArrowRight') next = idx === last ? 0 : idx + 1
    else if (e.key === 'ArrowLeft') next = idx === 0 ? last : idx - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End')  next = last
    if (next !== null) {
      e.preventDefault()
      setStatusFilter(FILTER_OPTIONS[next].key)
      const node = chipRefs.current[next]
      if (node && node.focus) node.focus()
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  return (
    <div className='admin-root'>
      <header className='admin-header'>
        <div className='admin-header__left'>
          <div className='admin-eyebrow'>Admin · Internal Tools</div>
          <h1 className='admin-h1'>Feature Flags</h1>
          <p className='admin-subtitle'>
            View of <code>features.json</code> with local overrides for testing.
            Persist via the <code>feature-flags</code> MCP server.
            Your traffic bucket: <strong>{bucket}</strong>.
          </p>
          {hasOverrides && (
            <button type='button' className='admin-reset-all-link' onClick={resetAll}>
              Reset all local overrides
            </button>
          )}
        </div>
        <div aria-live='polite'>
          <span
            className={`admin-live-pill admin-live-pill--${connected ? 'on' : 'off'}`}
            aria-label={connected ? 'Live: connected to SSE' : 'Offline: SSE disconnected'}
          >
            <span className='admin-live-pill__dot' aria-hidden='true' />
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </header>

      <div className='admin-stats'>
        <StatCard label='Total'    value={hasFeatures ? stats.total    : '—'} />
        <StatCard label='Enabled'  value={hasFeatures ? stats.enabled  : '—'} variant='enabled' />
        <StatCard label='Testing'  value={hasFeatures ? stats.testing  : '—'} variant='testing' />
        <StatCard label='Disabled' value={hasFeatures ? stats.disabled : '—'} variant='disabled' />
      </div>

      <div className='admin-controls'>
        <div className='admin-controls__search'>
          <SearchInput value={search} onChange={setSearch} disabled={!hasFeatures} />
        </div>
        <div className='admin-controls__chips' role='tablist' aria-label='Filter by status'>
          {FILTER_OPTIONS.map((opt, idx) => {
            const active = statusFilter === opt.key
            const count = opt.key === 'all'
              ? stats.total
              : stats[opt.key.toLowerCase()]
            return (
              <FilterChip
                key={opt.key}
                ref={(el) => (chipRefs.current[idx] = el)}
                label={opt.label}
                count={hasFeatures ? count : 0}
                active={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setStatusFilter(opt.key)}
                onKeyDown={handleChipKeyDown(idx)}
              />
            )
          })}
        </div>
      </div>

      {featuresError ? (
        <ErrorState
          message='Make sure the backend is running on port 5001.'
          onRetry={() => window.location.reload()}
        />
      ) : !hasFeatures ? (
        <div className='admin-table-wrap'>
          <table className='admin-table' aria-label='Feature flags' aria-busy='true'>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Status</th><th>Traffic</th><th>For me</th><th></th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : visibleFeatures.length === 0 ? (
        <EmptyState
          search={debouncedSearch}
          filter={statusFilter}
          onClear={handleClearFilters}
        />
      ) : (
        <div className='admin-table-wrap'>
          <table className='admin-table' aria-label='Feature flags'>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Status</th><th>Traffic</th><th>For me</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visibleFeatures.map(([id, f]) => (
                <FeatureRow
                  key={id}
                  id={id}
                  effective={f}
                  upstreamTraffic={features[id] ? features[id].traffic_percentage : 0}
                  bucket={bucket}
                  description={descriptions[id]}
                  wired={WIRED_FEATURES.includes(id)}
                  isOverridden={f._overridden}
                  onSetTraffic={setTraffic}
                  onReset={resetOne}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className='admin-footer-hint'>
        Wired features (real impact): <code>search_v2</code> · <code>paypal_express_buttons</code> · <code>image_lazy_loading</code>
        — наведи на ⚡ в колонке ID для подробностей.
        {descError && ' Note: feature descriptions failed to load — only basic info shown.'}
      </div>
    </div>
  )
}

export default DashboardFeaturesScreen
