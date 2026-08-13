import { Router } from 'express'
import * as activityService from '../services/activity'

const router = Router()

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

router.get('/', async (req, res, next) => {
  try {
    const logs = await activityService.listActivity(req.shop.shopId, {
      action: optionalString(req.query.action),
      entityType: optionalString(req.query.entityType),
      actorType: optionalString(req.query.actorType),
    })
    res.json(logs)
  } catch (e) {
    next(e)
  }
})

export default router
