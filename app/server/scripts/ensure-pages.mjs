import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE = 'elora-lg1vomev.myshopify.com'
const API_VERSION = '2025-10'
const GRAPHQL_DIR = path.join(__dirname, 'graphql')

const PAGES = [
  {
    handle: 'about',
    title: 'About',
    templateSuffix: 'about',
    body: '',
  },
  {
    handle: 'ingredients',
    title: 'Our Ingredients',
    body: '<p>Short lists. Recognizable names. Elora formulas lead with niacinamide, hyaluronic acid, ceramides, squalane, and centella — and leave out parabens, sulphates, phthalates, mineral oil, and synthetic fragrance.</p>',
  },
  {
    handle: 'sustainability',
    title: 'Sustainability',
    body: '<p>Thoughtfully made, in small batches, with packaging meant to be kept on the shelf rather than thrown away. We ship ground when we can, and we design refill-friendly sizes for the pieces you finish.</p>',
  },
  {
    handle: 'contact',
    title: 'Contact Us',
    body: '<p>Questions about an order or a ritual? Write to hello@elora.example and we will reply within two business days.</p>',
  },
  {
    handle: 'faq',
    title: 'FAQ',
    body: '<p><strong>How do I build a ritual?</strong> Use Build your ritual on the home page — three quiet questions, then a bag-ready lineup.</p><p><strong>What is free shipping?</strong> Ground shipping is free on US orders over $50.</p><p><strong>Can I return a product?</strong> Yes. 30 days, unused or gently tried.</p>',
  },
  {
    handle: 'shipping-returns',
    title: 'Shipping & Returns',
    body: '<p>We ship from the US. Orders over $50 qualify for free ground shipping. Returns are accepted within 30 days of delivery.</p>',
  },
  {
    handle: 'track-order',
    title: 'Track Order',
    body: '<p>When your order ships you will receive a tracking email. You can also sign in to your account to view recent orders.</p>',
  },
]

function parseJsonPayload(stdout) {
  const start = stdout.indexOf('{')
  const end = stdout.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON payload in CLI output:\n${stdout}`)
  }
  return JSON.parse(stdout.slice(start, end + 1))
}

function execute({ queryFile, variables, mutate = false }) {
  const args = [
    'store',
    'execute',
    '--store',
    STORE,
    '--json',
    '--version',
    API_VERSION,
    '--query-file',
    queryFile,
  ]

  let variableFile
  if (variables) {
    variableFile = path.join(os.tmpdir(), `elora-vars-${Date.now()}-${Math.random().toString(16).slice(2)}.json`)
    fs.writeFileSync(variableFile, JSON.stringify(variables))
    args.push('--variable-file', variableFile)
  }
  if (mutate) args.push('--allow-mutations')

  const result = spawnSync('shopify', args, {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 20_000_000,
    env: {
      ...process.env,
      SHOPIFY_CLI_AGENT_INFO: 'n:cursor-grok|v:1.0.0|p:cursor',
      SHOPIFY_CLI_AGENT_IDS: 's:elora-catalog|r:storefront-pages|i:1',
    },
  })

  if (variableFile) {
    try {
      fs.unlinkSync(variableFile)
    } catch {
      /* ignore */
    }
  }

  const stdout = `${result.stdout || ''}`
  const stderr = `${result.stderr || ''}`
  if (result.status !== 0) {
    throw new Error(`shopify store execute failed (${result.status}):\n${stderr || stdout}`)
  }

  const payload = parseJsonPayload(stdout)
  if (payload.errors?.length) {
    throw new Error(payload.errors.map(error => error.message).join('; '))
  }
  return payload
}

function assertNoUserErrors(errors, context) {
  const messages = (errors ?? []).map(error => error.message).filter(Boolean)
  if (messages.length) throw new Error(`${context}: ${messages.join('; ')}`)
}

function ensurePage(spec) {
  const found = execute({
    queryFile: path.join(GRAPHQL_DIR, 'page-find.graphql'),
    variables: { query: `handle:${spec.handle}` },
  })
  const existing = found.pages?.nodes?.[0]
  const pageInput = {
    title: spec.title,
    handle: spec.handle,
    isPublished: true,
    body: spec.body ?? '',
    templateSuffix: spec.templateSuffix ?? '',
  }

  if (existing) {
    const updated = execute({
      queryFile: path.join(GRAPHQL_DIR, 'page-update.graphql'),
      mutate: true,
      variables: { id: existing.id, page: pageInput },
    })
    assertNoUserErrors(updated.pageUpdate?.userErrors, `pageUpdate ${spec.handle}`)
    console.log(`updated page ${spec.handle} ${existing.id}`)
    return
  }

  const created = execute({
    queryFile: path.join(GRAPHQL_DIR, 'page-create.graphql'),
    mutate: true,
    variables: { page: pageInput },
  })
  assertNoUserErrors(created.pageCreate?.userErrors, `pageCreate ${spec.handle}`)
  const page = created.pageCreate?.page
  if (!page?.id) throw new Error(`pageCreate returned no page for ${spec.handle}`)
  console.log(`created page ${spec.handle} ${page.id}`)
}

function main() {
  for (const spec of PAGES) {
    ensurePage(spec)
  }
}

main()
