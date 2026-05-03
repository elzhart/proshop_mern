import express from 'express'
import path from 'path'
import fs from 'fs'

const router = express.Router()

const featuresPath = path.resolve(process.cwd(), 'features.json')
const descriptionsPath = path.resolve(process.cwd(), 'features-descriptions.json')

const readFeatures = () => {
  const raw = fs.readFileSync(featuresPath, 'utf-8')
  return JSON.parse(raw)
}

const readDescriptions = () => {
  const raw = fs.readFileSync(descriptionsPath, 'utf-8')
  const parsed = JSON.parse(raw)
  return parsed.features || {}
}

router.get('/', (req, res) => {
  try {
    res.json(readFeatures())
  } catch (err) {
    res.status(500).json({ message: 'Failed to read features.json', error: err.message })
  }
})

router.get('/descriptions', (req, res) => {
  try {
    res.json(readDescriptions())
  } catch (err) {
    res.status(500).json({ message: 'Failed to read features-descriptions.json', error: err.message })
  }
})

router.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()

  const send = (event, data) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    send('snapshot', readFeatures())
  } catch (err) {
    send('error', { message: err.message })
  }

  const onChange = () => {
    try {
      send('snapshot', readFeatures())
    } catch (err) {
      send('error', { message: err.message })
    }
  }

  fs.watchFile(featuresPath, { interval: 500 }, onChange)

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n')
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    fs.unwatchFile(featuresPath, onChange)
    res.end()
  })
})

export default router