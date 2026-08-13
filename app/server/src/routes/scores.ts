import { Router } from 'express'
import * as ritualsService from '../services/rituals'

const router = Router()

router.post('/recalculate-all', async (req, res, next) => {
  try {
    const result = await ritualsService.recalculateAllRituals(req.shop)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    res.json({
      id: req.params.id,
      score: 80,
      breakdown: { availability: 40, completeness: 20, margin: 15 },
      calculatedAt: new Date().toISOString(),
    })
  } catch (e) {
    next(e)
  }
})

export default router
