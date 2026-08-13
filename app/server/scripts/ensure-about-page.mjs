import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE = 'elora-lg1vomev.myshopify.com'
const API_VERSION = '2025-10'
const GRAPHQL_DIR = path.join(__dirname, 'graphql')

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
      SHOPIFY_CLI_AGENT_IDS: 's:elora-catalog|r:about-page|i:1',
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

function main() {
  const found = execute({
    queryFile: path.join(GRAPHQL_DIR, 'page-find.graphql'),
    variables: { query: 'handle:about' },
  })
  let page = found.pages?.nodes?.[0]

  if (page) {
    const updated = execute({
      queryFile: path.join(GRAPHQL_DIR, 'page-update.graphql'),
      mutate: true,
      variables: {
        id: page.id,
        page: {
          title: 'About',
          handle: 'about',
          isPublished: true,
          templateSuffix: 'about',
          body: '',
        },
      },
    })
    assertNoUserErrors(updated.pageUpdate?.userErrors, 'pageUpdate about')
    page = updated.pageUpdate?.page ?? page
    console.log(`updated page ${page.handle} ${page.id}`)
  } else {
    const created = execute({
      queryFile: path.join(GRAPHQL_DIR, 'page-create.graphql'),
      mutate: true,
      variables: {
        page: {
          title: 'About',
          handle: 'about',
          isPublished: true,
          templateSuffix: 'about',
          body: '',
        },
      },
    })
    assertNoUserErrors(created.pageCreate?.userErrors, 'pageCreate about')
    page = created.pageCreate?.page
    if (!page?.id) throw new Error('pageCreate returned no page')
    console.log(`created page ${page.handle} ${page.id}`)
  }

  console.log(`ready page ${page.handle} templateSuffix=${page.templateSuffix || ''} ${page.id}`)
}

main()
