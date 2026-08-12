import { Request, Response, NextFunction } from 'express'
import { verifySessionToken, ShopContext } from '../shopify/auth'

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      shop: ShopContext
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? ''
  const token = header.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    req.shop = await verifySessionToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid session token' })
  }
}
