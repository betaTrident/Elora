import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE = 'elora-lg1vomev.myshopify.com'
const API_VERSION = '2025-10'
const GRAPHQL_DIR = path.join(__dirname, 'graphql')
const QUANTITY = 25

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
    variableFile = path.join(os.tmpdir(), `elora-inv-${Date.now()}-${Math.random().toString(16).slice(2)}.json`)
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
      SHOPIFY_CLI_AGENT_IDS: 's:elora-catalog|r:set-inventory|i:1',
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
    throw new Error(payload.errors.map((error) => error.message).join('; '))
  }
  return payload
}

function userErrorText(errors) {
  return (errors ?? []).map((error) => error.message).join('; ')
}

function alreadyActive(message) {
  return /already.+activ/i.test(message) || /already stocked/i.test(message)
}

const catalog = execute({
  queryFile: path.join(GRAPHQL_DIR, 'inventory-catalog.graphql'),
})

const locations = catalog.locations?.nodes ?? []
const location = locations[0]

if (!location) {
  throw new Error('No Shopify location found')
}

console.log(`location ${location.id}`)

const products = catalog.products?.nodes ?? []
if (products.length === 0) {
  throw new Error('No Elora products found')
}

for (const product of products) {
  const variants = product.variants?.nodes ?? []
  const untracked = variants.filter((variant) => !variant.inventoryItem?.tracked)
  if (untracked.length) {
    const updated = execute({
      queryFile: path.join(GRAPHQL_DIR, 'variant-track.graphql'),
      mutate: true,
      variables: {
        productId: product.id,
        variants: untracked.map((variant) => ({
          id: variant.id,
          inventoryItem: { tracked: true },
        })),
      },
    })
    const trackErrors = userErrorText(updated.productVariantsBulkUpdate?.userErrors)
    if (trackErrors) {
      throw new Error(`track ${product.handle}: ${trackErrors}`)
    }
  }

  for (const variant of variants) {
    const inventoryItemId = variant.inventoryItem?.id
    if (!inventoryItemId) {
      console.log(`skip ${product.handle} ${variant.title} (no inventory item)`)
      continue
    }

    const activated = execute({
      queryFile: path.join(GRAPHQL_DIR, 'inventory-activate.graphql'),
      mutate: true,
      variables: {
        inventoryItemId,
        locationId: location.id,
        available: QUANTITY,
      },
    })
    const activateErrors = userErrorText(activated.inventoryActivate?.userErrors)
    if (activateErrors && !alreadyActive(activateErrors)) {
      throw new Error(`activate ${product.handle}: ${activateErrors}`)
    }

    const set = execute({
      queryFile: path.join(GRAPHQL_DIR, 'inventory-set.graphql'),
      mutate: true,
      variables: {
        input: {
          name: 'available',
          reason: 'correction',
          ignoreCompareQuantity: true,
          quantities: [
            {
              inventoryItemId,
              locationId: location.id,
              quantity: QUANTITY,
            },
          ],
        },
      },
    })
    const setErrors = userErrorText(set.inventorySetQuantities?.userErrors)
    if (setErrors) {
      throw new Error(`set ${product.handle}: ${setErrors}`)
    }

    console.log(`stocked ${product.handle} ${variant.title} qty=${QUANTITY}`)
  }
}

console.log(`done ${products.length} products at ${QUANTITY} each`)
