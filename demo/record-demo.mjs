/**
 * Records a walkthrough of the running RitualScore app (https://localhost:3458).
 * Injects App Bridge idToken so API calls hit the real backend.
 * Does not print secrets.
 */
import { createRequire } from 'module'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const serverRequire = createRequire(path.join(root, 'app/server/package.json'))
const jwt = serverRequire('jsonwebtoken')
const dotenv = serverRequire('dotenv')

dotenv.config({ path: path.join(root, 'app/server/.env') })
dotenv.config({ path: path.join(root, '.env') })

const API_KEY = process.env.SHOPIFY_API_KEY
const API_SECRET = process.env.SHOPIFY_API_SECRET
const SHOP = 'elora-lg1vomev.myshopify.com'
const BASE = 'https://localhost:3458'

if (!API_KEY || !API_SECRET) {
  console.error('Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET in .env')
  process.exit(1)
}

const token = jwt.sign(
  { aud: API_KEY, dest: `https://${SHOP}`, sub: 'demo-walkthrough' },
  API_SECRET,
  { algorithm: 'HS256', expiresIn: '30m' },
)

const rawDir = path.join(__dirname, 'raw')
fs.mkdirSync(rawDir, { recursive: true })

async function setCaption(page, text) {
  await page.evaluate((caption) => {
    let el = document.getElementById('ritualscore-demo-caption')
    if (!el) {
      el = document.createElement('div')
      el.id = 'ritualscore-demo-caption'
      el.setAttribute('role', 'status')
      Object.assign(el.style, {
        position: 'fixed',
        left: '24px',
        right: '24px',
        bottom: '20px',
        zIndex: '2147483647',
        padding: '12px 16px',
        borderRadius: '8px',
        background: 'rgba(26, 26, 26, 0.88)',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
        lineHeight: '1.4',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        pointerEvents: 'none',
      })
      document.body.appendChild(el)
    }
    el.textContent = caption
  }, text)
}

async function hold(page, ms) {
  await page.waitForTimeout(ms)
}

const browser = await chromium.launch({
  headless: true,
  ignoreHTTPSErrors: true,
})

const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } },
})

await context.addInitScript(
  ({ sessionToken }) => {
    window.shopify = {
      idToken: async () => sessionToken,
      resourcePicker: async () => [
        {
          id: 'gid://shopify/Product/1001',
          title: 'Silk cleanser',
          variants: [{ id: 'gid://shopify/ProductVariant/2001' }],
        },
        {
          id: 'gid://shopify/Product/1002',
          title: 'Vitamin C serum',
          variants: [{ id: 'gid://shopify/ProductVariant/2002' }],
        },
        {
          id: 'gid://shopify/Product/1003',
          title: 'Barrier cream',
          variants: [{ id: 'gid://shopify/ProductVariant/2003' }],
        },
      ],
    }
  },
  { sessionToken: token },
)

const page = await context.newPage()

try {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1500)
  await setCaption(page, 'RitualScore — Dashboard. KPIs, routines needing attention, and recent activity.')
  await hold(page, 3500)

  await page.goto(`${BASE}/rituals`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await setCaption(page, 'Routines list — health scores, thresholds, and archive.')
  await hold(page, 3000)

  const create = page.getByRole('link', { name: /create routine/i }).first()
  if (await create.count()) {
    await create.click()
    await page.waitForTimeout(1000)
  } else {
    await page.goto(`${BASE}/rituals/new`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
  }
  await setCaption(page, 'Create a routine kit — name, threshold, and products from the catalog.')
  await hold(page, 2000)

  const titleBox = page.getByRole('textbox', { name: /title|name/i }).first()
  if (await titleBox.count()) {
    await titleBox.fill('Morning glow kit')
  } else {
    const inputs = page.locator('input[type="text"]')
    if (await inputs.count()) await inputs.first().fill('Morning glow kit')
  }
  await hold(page, 1200)

  const addProduct = page.getByRole('button', { name: /add product/i }).first()
  if (await addProduct.count()) {
    await addProduct.click()
    await hold(page, 1800)
  }

  const save = page.getByRole('button', { name: /save|create/i }).first()
  if (await save.count()) {
    await setCaption(page, 'Save scores the kit immediately from live inventory.')
    await save.click()
    await page.waitForTimeout(2500)
  }

  await page.goto(`${BASE}/rituals`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await setCaption(page, 'The new routine appears in the list with its health score.')
  await hold(page, 3000)

  await page.goto(`${BASE}/activity`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await setCaption(page, 'Activity log — every create, update, archive, and recalculate.')
  await hold(page, 2500)

  const firstRow = page.locator('tr, [class*="IndexTable"]').first()
  if (await firstRow.count()) {
    await firstRow.click({ timeout: 2000 }).catch(() => {})
    await hold(page, 2000)
  }

  await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await setCaption(page, 'Settings — scoring threshold and notifications (placeholder until Phase 10).')
  await hold(page, 2500)

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await setCaption(page, 'Back on the dashboard — store routine health at a glance.')
  await hold(page, 3000)
} finally {
  const video = page.video()
  await page.close()
  const videoPath = video ? await video.path() : null
  await context.close()
  await browser.close()
  if (videoPath) {
    const dest = path.join(__dirname, 'walkthrough.webm')
    fs.copyFileSync(videoPath, dest)
    console.log(`WROTE ${dest}`)
  } else {
    console.error('No video file produced')
    process.exit(1)
  }
}
