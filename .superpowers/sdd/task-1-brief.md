# Task 1: Phase 1 — Project Scaffold & Tooling

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` section **Phase 1 — Project Scaffold & Tooling**.

## Where this fits

Greenfield scaffold for Elora (store/theme) + RitualScore (embedded Admin app). Workspace root is `k:\Elora` — create files here, **not** in a nested `elora/` folder. Phase 0 is done (Shopify CLI 4.6.1, Docker Desktop running). Do **not** start Phase 2+ (no Drizzle schema files, no React pages, no theme).

## Goal

A working monorepo skeleton with Docker MySQL, npm workspaces, TypeScript, linting, and a health-check endpoint.

## Files to create (verbatim from the plan where code is given)

### Root

```
package.json           # workspaces: ["app/server", "app/web"]
.gitignore
.env.example           # SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL, DATABASE_URL
docker-compose.yml
```

**`docker-compose.yml`** (use this content; you MAY add a `healthcheck` on `mysql` so “container is healthy” can be verified, without changing image/env/ports/volume):

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ritual_score
      MYSQL_USER: ritual
      MYSQL_PASSWORD: ritual
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
volumes:
  mysql_data:
```

**Root `package.json`:** npm workspaces `["app/server", "app/web"]`. Set `"private": true`. Name can be `elora`. Optional root scripts: `dev` is not required. A root `lint` script that runs ESLint in `app/server` is allowed.

**`.gitignore` must include at least:** `node_modules`, `.env`, `dist`, `*.log`, OS junk (`.DS_Store`). Do not ignore `.env.example`.

**`.env.example` placeholders:**

```
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=
DATABASE_URL=mysql://ritual:ritual@localhost:3306/ritual_score
PORT=3000
```

Copy `.env.example` to `.env` locally so dotenv can load `PORT` / `DATABASE_URL`. `.env` must stay gitignored.

### `app/server/package.json`

```json
{
  "name": "ritualscore-server",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "test": "vitest"
  },
  "dependencies": {
    "express": "^4",
    "drizzle-orm": "^0.36",
    "mysql2": "^3",
    "zod": "^3",
    "jsonwebtoken": "^9",
    "@shopify/shopify-api": "latest",
    "dotenv": "^16",
    "cors": "^2"
  },
  "devDependencies": {
    "tsx": "^4",
    "typescript": "^5",
    "drizzle-kit": "^0.27",
    "vitest": "^2",
    "supertest": "^7",
    "@types/express": "*",
    "@types/jsonwebtoken": "*",
    "@types/cors": "*",
    "eslint": "^9"
  }
}
```

You MAY add `@types/node` (needed for `process.env`) and ESLint 9 companion packages required for TypeScript linting (`@eslint/js`, `typescript-eslint`). Do not add unrelated libraries.

### `app/web/package.json`

```json
{
  "name": "ritualscore-web",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^6",
    "@shopify/polaris": "^13",
    "@shopify/app-bridge-react": "latest"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "typescript": "^5"
  }
}
```

### `app/server/src/index.ts`

```typescript
import express from 'express'
import { config } from 'dotenv'
config()

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(process.env.PORT ?? 3000, () => {
  console.log('Server ready')
})
```

### `app/server/drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './src/db/schema/*.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

### `app/web/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, host: 'localhost' },
  build: { outDir: '../server/public' },
})
```

### `app/shopify.app.toml`

```toml
name = "RitualScore"
client_id = "<SHOPIFY_API_KEY>"
application_url = "https://<tunnel-url>"
embedded = true

[access_scopes]
scopes = "read_products,read_inventory"

[webhooks]
api_version = "2025-01"

  [[webhooks.subscriptions]]
  topics = ["app/uninstalled"]
  uri = "/webhooks/app/uninstalled"
```

Keep these values. If Shopify CLI schema requires extra fields for the file to be valid TOML, add only what the CLI requires and note it in the report. Do **not** run `shopify app init`. Do **not** replace placeholders with real secrets.

## Implied files (required by Done when; not listed as code in the plan)

Create these so TypeScript and ESLint can actually run:

- `app/server/tsconfig.json` — strict, `rootDir` `src`, `outDir` `dist`, include `src`, module/moduleResolution suitable for Node + tsx (NodeNext or Node16 is fine). `noEmit` false so `npm run build` works.
- `app/web/tsconfig.json` — `jsx: react-jsx`, include `src`. You may add an empty `app/web/src/.gitkeep` or a one-line placeholder so `include` is valid; do **not** build the Phase 5 React app (`App.tsx`, pages, Polaris shell).
- `app/server/eslint.config.js` (ESLint 9 flat config) covering `src/**/*.ts`. Must pass on the health-check server file.

Do **not** create `app/server/src/db/migrate.ts` (Phase 2). Leaving the `db:migrate` script in package.json is correct.

## Commands (must run)

```bash
npm install                    # from k:\Elora
docker compose up -d           # start MySQL
cd app/server && npm run dev   # server health check
# then GET http://localhost:3000/health
```

Also run:

- `cd app/server && npx tsc --noEmit` (or `npm run build`)
- ESLint on the server (must pass)
- Confirm MySQL container is healthy (`docker compose ps` / `mysqladmin ping` inside the container)

Host port **3306 is free**. Node is **v22.17.0** (plan says Node 20; 22 is acceptable).

If `npm run dev` is a long-running watcher, start it, curl `/health`, then stop it. Do not leave a stray node process.

## Done when

- `GET /health` returns `{ ok: true }`
- MySQL container is healthy
- TypeScript compiles with no errors
- ESLint passes

## Constraints

- Do **not** commit, `git init`, or change git config. The controller owns git.
- Do **not** edit `IMPLEMENTATION_PLAN.md`.
- Do **not** overbuild: no README, no APP_DECISIONS, no theme, no schema, no React UI.
- Follow the file structure and the provided file contents.
- Work from `k:\Elora`.
- Windows PowerShell: use `Invoke-WebRequest` or `curl.exe` (not the curl alias) for the health check.

## Report

Write the full report to `k:\Elora\.superpowers\sdd\task-1-report.md`.
