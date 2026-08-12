import { Router } from 'express'

const router = Router()

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
