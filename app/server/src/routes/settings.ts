import { Router } from 'express'
import { z } from 'zod'
import * as settingsService from '../services/settings'

const router = Router()
const schema = z.object({ defaultThreshold: z.number().int().min(0).max(100) })

router.get('/', async (req, res, next) => {
  try {
    res.json(await settingsService.getSettings(req.shop.shopId))
  } catch (e) {
    next(e)
  }
})

router.put('/', async (req, res, next) => {
  try {
    const body = schema.parse(req.body)
    res.json(await settingsService.updateSettings(req.shop, body.defaultThreshold))
  } catch (e) {
    next(e)
  }
})

export default router
