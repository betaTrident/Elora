import express from 'express'
import { config } from 'dotenv'
config()

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(process.env.PORT ?? 3000, () => {
  console.log('Server ready')
})
