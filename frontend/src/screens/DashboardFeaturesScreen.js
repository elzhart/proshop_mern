import React, { useEffect, useMemo, useState } from 'react'
import { Table, Badge, ProgressBar, Row, Col, Card, OverlayTrigger, Popover } from 'react-bootstrap'
import Loader from '../components/Loader'
import { useFeaturesContext, isFeatureActive } from '../context/FeaturesContext'

const STATUS_VARIANT = {
  Enabled: 'success',
  Testing: 'warning',
  Disabled: 'secondary',
}

const PRIORITY_VARIANT = (p) => {
  if (!p) return 'light'
  if (p.startsWith('Must')) return 'danger'
  if (p === 'Core') return 'primary'
  if (p === 'Skip') return 'dark'
  return 'info'
}

const WIRED_FEATURES = ['image_lazy_loading', 'paypal_express_buttons', 'product_recommendations']

const truncate = (s, n) => (!s ? '' : s.length <= n ? s : s.slice(0, n - 1) + '…')

const DescriptionCell = ({ id, feature, info }) => {
  if (!info) return <small className='text-muted'>—</small>
  const popover = (
    <Popover id={`pop-${id}`} style={{ maxWidth: 460 }}>
      <Popover.Title as='strong'>{feature.name}</Popover.Title>
      <Popover.Content>
        <p className='mb-2'>{info.code_state}</p>
        <div className='mb-1'>
          <strong>Сложность:</strong> {info.complexity}/10{' '}
          <Badge variant={PRIORITY_VARIANT(info.priority)} className='ml-1'>
            {info.priority}
          </Badge>{' '}
          <span>Figma: {info.figma_rating}</span>
        </div>
        {info.note && (
          <div className='mt-2 p-2' style={{ background: '#fff8e1', borderLeft: '3px solid #f0ad4e' }}>
            <small><strong>Note:</strong> {info.note}</small>
          </div>
        )}
        {feature.description && (
          <details className='mt-2'>
            <summary><small className='text-muted'>spec.description</small></summary>
            <small>{feature.description}</small>
          </details>
        )}
      </Popover.Content>
    </Popover>
  )
  return (
    <OverlayTrigger trigger={['hover', 'focus']} placement='left' overlay={popover}>
      <span style={{ cursor: 'help' }}>{truncate(info.code_state, 60)}</span>
    </OverlayTrigger>
  )
}

const DashboardFeaturesScreen = () => {
  const { features, bucket, connected } = useFeaturesContext()
  const [descriptions, setDescriptions] = useState({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/features/descriptions')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => !cancelled && setDescriptions(d))
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    const list = Object.values(features)
    return {
      total: list.length,
      enabled: list.filter((f) => f.status === 'Enabled').length,
      testing: list.filter((f) => f.status === 'Testing').length,
      disabled: list.filter((f) => f.status === 'Disabled').length,
    }
  }, [features])

  const hasFeatures = Object.keys(features).length > 0

  return (
    <>
      <Row className='align-items-center mb-3'>
        <Col>
          <h1 className='mb-0'>Dashboard Features</h1>
          <small className='text-muted'>
            Live view of <code>features.json</code>. Edit the file — the table updates automatically.
            Your traffic bucket: <strong>{bucket}</strong> (0–99, persisted in localStorage).
          </small>
        </Col>
        <Col xs='auto'>
          <Badge variant={connected ? 'success' : 'secondary'} style={{ fontSize: '0.9rem' }}>
            {connected ? '● live' : '○ offline'}
          </Badge>
        </Col>
      </Row>

      {hasFeatures && (
        <Row className='mb-3'>
          <Col md={3}>
            <Card body className='text-center'>
              <h5 className='mb-0'>{stats.total}</h5>
              <small className='text-muted'>Total</small>
            </Card>
          </Col>
          <Col md={3}>
            <Card body className='text-center border-success'>
              <h5 className='text-success mb-0'>{stats.enabled}</h5>
              <small className='text-muted'>Enabled</small>
            </Card>
          </Col>
          <Col md={3}>
            <Card body className='text-center border-warning'>
              <h5 className='text-warning mb-0'>{stats.testing}</h5>
              <small className='text-muted'>Testing</small>
            </Card>
          </Col>
          <Col md={3}>
            <Card body className='text-center border-secondary'>
              <h5 className='text-secondary mb-0'>{stats.disabled}</h5>
              <small className='text-muted'>Disabled</small>
            </Card>
          </Col>
        </Row>
      )}

      {!hasFeatures ? (
        <Loader />
      ) : (
        <Table striped hover responsive className='table-sm'>
          <thead>
            <tr>
              <th>Feature ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Traffic</th>
              <th>For me</th>
              <th>Wired</th>
              <th style={{ minWidth: 280 }}>Описание (наведи)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(features).map(([id, f]) => {
              const active = isFeatureActive(f, bucket)
              const wired = WIRED_FEATURES.includes(id)
              const info = descriptions[id]
              return (
                <tr key={id}>
                  <td><code>{id}</code></td>
                  <td>{f.name}</td>
                  <td>
                    <Badge variant={STATUS_VARIANT[f.status] || 'light'}>{f.status}</Badge>
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <ProgressBar
                      now={f.traffic_percentage}
                      label={`${f.traffic_percentage}%`}
                      variant={STATUS_VARIANT[f.status] || 'info'}
                    />
                  </td>
                  <td>
                    <Badge variant={active ? 'success' : 'secondary'}>
                      {active ? 'ON' : 'off'}
                    </Badge>
                  </td>
                  <td>
                    {wired ? (
                      <Badge variant='info'>wired</Badge>
                    ) : (
                      <small className='text-muted'>—</small>
                    )}
                  </td>
                  <td>
                    <DescriptionCell id={id} feature={f} info={info} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}

      <Card body className='mt-3 bg-light'>
        <h6>Wired features (real impact on the app):</h6>
        <ul className='mb-0'>
          <li>
            <code>image_lazy_loading</code> — toggles <code>loading="lazy"</code> on product images.
          </li>
          <li>
            <code>paypal_express_buttons</code> — kill switch for the PayPal button on the Order screen.
          </li>
          <li>
            <code>product_recommendations</code> — adds "Customers also bought" row on Product screen.
          </li>
        </ul>
        <small className='text-muted'>
          Колонка «Описание» — наведи курсор на текст, чтобы увидеть подробности из{' '}
          <code>features-descriptions.json</code>: код в репо, сложность, приоритет, аномалии.
        </small>
      </Card>
    </>
  )
}

export default DashboardFeaturesScreen