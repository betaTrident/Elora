import { Router } from 'express'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    res.json([])
  } catch (e) {
    next(e)
  }
})

router.post('/:id/resolve', async (_req, res, next) => {
  try {
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
