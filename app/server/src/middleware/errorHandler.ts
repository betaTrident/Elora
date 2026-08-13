import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  void next
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', issues: err.flatten() })
  }
  if (err instanceof Error && 'status' in err) {
    return res.status((err as { status: number }).status).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
