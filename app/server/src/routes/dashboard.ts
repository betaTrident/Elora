import { Router } from 'express'
import { getDashboardData } from '../services/dashboard'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    res.json(await getDashboardData(req.shop.shopId))
  } catch (e) {
    next(e)
  }
})

export default router
