import { Router } from 'express'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    res.json({
      counts: { total: 0, healthy: 0, broken: 0, unscored: 0, openAlerts: 0 },
      worst5: [],
      recentActivity: [],
    })
  } catch (e) {
    next(e)
  }
})

export default router
