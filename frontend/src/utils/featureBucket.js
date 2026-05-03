const BUCKET_KEY = 'ff_bucket'

const randomBucket = () => Math.floor(Math.random() * 100)

export const getBucket = () => {
  try {
    const cached = localStorage.getItem(BUCKET_KEY)
    if (cached !== null) {
      const n = Number(cached)
      if (Number.isInteger(n) && n >= 0 && n < 100) return n
    }
    const fresh = randomBucket()
    localStorage.setItem(BUCKET_KEY, String(fresh))
    return fresh
  } catch (_) {
    return randomBucket()
  }
}