import { Router } from 'express'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    res.json([])
  } catch (e) {
    next(e)
  }
})

export default router
