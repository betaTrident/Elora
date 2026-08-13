import express from 'express'
import cors from 'cors'
import { config as appConfig } from './config'
import { requireAuth } from './middleware/requireAuth'
import { errorHandler } from './middleware/errorHandler'
import dashboardRouter from './routes/dashboard'
import ritualsRouter from './routes/rituals'
import scoresRouter from './routes/scores'
import alertsRouter from './routes/alerts'
import activityRouter from './routes/activity'
import settingsRouter from './routes/settings'
import webhooksRouter from './routes/webhooks'

export const app = express()
app.use(cors())

app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    'frame-ancestors https://admin.shopify.com https://*.myshopify.com;',
  )
  next()
})

app.use('/webhooks', express.raw({ type: '*/*' }), webhooksRouter)
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api', requireAuth)
app.get('/api/ping', (req, res) => res.json({ shop: req.shop.shopDomain }))

app.use('/api/dashboard', dashboardRouter)
app.use('/api/rituals', ritualsRouter)
app.use('/api/scores', scoresRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/activity', activityRouter)
app.use('/api/settings', settingsRouter)

app.use(errorHandler)

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  app.listen(appConfig.port, () => {
    console.log('Server ready')
  })
}
