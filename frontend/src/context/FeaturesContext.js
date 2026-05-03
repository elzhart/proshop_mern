import React, { createContext, useContext, useEffect, useState } from 'react'
import { getBucket } from '../utils/featureBucket'

const FeaturesContext = createContext({ features: {}, bucket: 0, connected: false })

export const FeaturesProvider = ({ children }) => {
  const [features, setFeatures] = useState({})
  const [connected, setConnected] = useState(false)
  const [bucket] = useState(() => getBucket())

  useEffect(() => {
    let cancelled = false

    fetch('/api/features')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((data) => {
        if (!cancelled) setFeatures(data)
      })
      .catch(() => {})

    const es = new EventSource('/api/features/stream')
    es.addEventListener('snapshot', (e) => {
      try {
        setFeatures(JSON.parse(e.data))
      } catch (_) {}
    })
    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    return () => {
      cancelled = true
      es.close()
    }
  }, [])

  return (
    <FeaturesContext.Provider value={{ features, bucket, connected }}>
      {children}
    </FeaturesContext.Provider>
  )
}

export const useFeaturesContext = () => useContext(FeaturesContext)

export const isFeatureActive = (feature, bucket) => {
  if (!feature) return false
  if (feature.status === 'Enabled') return true
  if (feature.status === 'Testing') {
    const pct = Number(feature.traffic_percentage) || 0
    return bucket < pct
  }
  return false
}