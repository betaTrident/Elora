import { Router } from 'express'
import { z } from 'zod'
import * as ritualsService from '../services/rituals'

const router = Router()

const componentSchema = z.object({
  shopifyProductId: z.string().min(1),
  shopifyVariantId: z.string().nullable().optional(),
  productTitleCache: z.string().max(255).optional(),
  role: z.enum(['cleanse', 'treat', 'seal', 'scent']),
  quantity: z.number().int().min(1).default(1),
  unitCost: z.number().nonnegative().optional(),
  sortOrder: z.number().int().default(0),
})

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  scoreThreshold: z.number().int().min(0).max(100).optional(),
  components: z.array(componentSchema).min(1),
})

router.get('/', async (req, res, next) => {
  try {
    const rituals = await ritualsService.listRituals(req.shop.shopId, req.query.status as string)
    res.json(rituals)
  } catch (e) {
    next(e)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const result = await ritualsService.createRitual(req.shop, body)
    res.status(201).json(result)
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const ritual = await ritualsService.getRitual(req.shop.shopId, req.params.id)
    res.json(ritual)
  } catch (e) {
    next(e)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const result = await ritualsService.updateRitual(req.shop, req.params.id, body)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

router.post('/:id/archive', async (req, res, next) => {
  try {
    await ritualsService.archiveRitual(req.shop, req.params.id)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

router.post('/:id/recalculate', async (req, res, next) => {
  try {
    const result = await ritualsService.recalculateRitual(req.shop, req.params.id)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

export default router
