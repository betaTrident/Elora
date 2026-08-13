import { Router } from 'express'
import * as alertsService from '../services/alerts'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const openAlerts = await alertsService.listOpenAlerts(req.shop.shopId)
    res.json(openAlerts)
  } catch (e) {
    next(e)
  }
})

router.post('/:id/resolve', async (req, res, next) => {
  try {
    await alertsService.resolveAlert(req.shop.shopId, req.params.id)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
