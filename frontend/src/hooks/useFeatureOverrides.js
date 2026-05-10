import { useCallback, useState } from 'react'

const STORAGE_KEY = 'featureOverrides:v1'

const safeRead = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (_) {
    return {}
  }
}

const safeWrite = (value) => {
  try {
    if (Object.keys(value).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    }
    return true
  } catch (_) {
    return false
  }
}

/**
 * Hook for managing per-feature traffic overrides in localStorage.
 *
 * Returns:
 *   overrides         — { [featureId]: { traffic: number } }
 *   setTraffic(id, n) — write or clear override (clears when n === upstreamTraffic)
 *   resetOne(id)      — remove single override
 *   resetAll()        — wipe all
 *   version           — counter that ticks on every change (for useMemo deps)
 */
const useFeatureOverrides = () => {
  const [overrides, setOverridesState] = useState(safeRead)
  const [version, setVersion] = useState(0)

  const commit = useCallback((next) => {
    safeWrite(next)
    setOverridesState(next)
    setVersion((v) => v + 1)
  }, [])

  const setTraffic = useCallback(
    (id, value, upstreamTraffic) => {
      const v = Math.max(0, Math.min(100, Math.round(value)))
      const next = { ...overrides }
      if (v === upstreamTraffic) {
        delete next[id]
      } else {
        next[id] = { traffic: v }
      }
      commit(next)
    },
    [overrides, commit]
  )

  const resetOne = useCallback(
    (id) => {
      if (!(id in overrides)) return
      const next = { ...overrides }
      delete next[id]
      commit(next)
    },
    [overrides, commit]
  )

  const resetAll = useCallback(() => {
    commit({})
  }, [commit])

  return { overrides, setTraffic, resetOne, resetAll, version }
}

export default useFeatureOverrides
