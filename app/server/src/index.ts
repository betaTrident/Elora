import express from 'express'
import { config } from 'dotenv'
import { requireAuth } from './middleware/requireAuth'
import { config as appConfig } from './config'

config()

export const app = express()
app.use(express.json())

app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    'frame-ancestors https://admin.shopify.com https://*.myshopify.com;',
  )
  next()
})

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api', requireAuth)
app.get('/api/ping', (req, res) => res.json({ shop: req.shop.shopDomain }))

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  app.listen(appConfig.port, () => {
    console.log('Server ready')
  })
}
