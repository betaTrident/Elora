import { Router, Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { config } from '../config'
import { softDeleteShop } from '../services/shops'

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

function resolveShopDomain(req: Request): string | undefined {
  const headerDomain = req.headers['x-shopify-shop-domain'] as string | undefined
  if (headerDomain) return headerDomain

  try {
    const parsed = JSON.parse((req.body as Buffer).toString('utf8')) as Record<string, unknown>
    const domain =
      parsed.myshopify_domain ?? parsed.domain ?? parsed.shop_domain
    return typeof domain === 'string' ? domain : undefined
  } catch {
    return undefined
  }
}

router.post('/app/uninstalled', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = req.body as Buffer
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string | undefined

    if (!verifyHmac(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Invalid HMAC' })
    }

    const shopDomain = resolveShopDomain(req)
    if (shopDomain) {
      await softDeleteShop(shopDomain)
    }

    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
