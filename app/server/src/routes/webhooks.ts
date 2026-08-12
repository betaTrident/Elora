import { Router, Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { config } from '../config'

const router = Router()

function verifyHmac(rawBody: Buffer, hmacHeader: string | undefined): boolean {
  if (!hmacHeader) return false

  const computed = crypto
    .createHmac('sha256', config.shopifyApiSecret)
    .update(rawBody)
    .digest('base64')

  try {
    const expected = Buffer.from(hmacHeader, 'base64')
    const actual = Buffer.from(computed, 'base64')
    if (expected.length !== actual.length) return false
    return crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

router.post('/app/uninstalled', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = req.body as Buffer
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string | undefined

    if (!verifyHmac(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Invalid HMAC' })
    }

    // Stub: full shop soft-delete deferred to a later phase
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
