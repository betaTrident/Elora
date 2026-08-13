# Task 15A Report — Phase 15 security (uninstall + audit)

## Status

**DONE**

## Summary

Implemented the remaining Phase 15 security gap: soft-delete on app uninstall webhook, reinstall token re-exchange for previously uninstalled shops, and audit tests proving CSP and webhook behavior. No changes to `app/web`, `theme`, or `IMPLEMENTATION_PLAN.md`. No commit.

## TDD Evidence

### RED → GREEN

1. **Uninstall soft-delete** — Extended `POST /webhooks/app/uninstalled` tests to spy on `softDeleteShop` before wiring the webhook handler. Tests failed until `services/shops.ts` and webhook route were implemented.
2. **Reinstall after uninstall** — Added `ping.test.ts` case expecting `fetch` token exchange when `uninstalledAt` is set. Failed until `verifySessionToken` selected `uninstalledAt` and re-ran `exchangeAndUpsertShop`.
3. **CSP audit** — Added `GET /health` CSP header assertion (passed immediately; documents existing middleware).

### Verification commands (PowerShell)

```
Set-Location k:\Elora\app\server
npx vitest run src/__tests__/api.test.ts src/__tests__/ping.test.ts
npx tsc --noEmit
```

**Results:** 42/42 tests passed; `tsc --noEmit` exit 0.

## Files Changed

| File | Change |
|------|--------|
| `app/server/src/services/shops.ts` | **New** — `softDeleteShop(shopDomain)` sets `uninstalledAt = CURRENT_TIMESTAMP`, `accessToken = ''` |
| `app/server/src/routes/webhooks.ts` | Resolve shop domain from header/body; call `softDeleteShop`; removed stub comment |
| `app/server/src/shopify/auth.ts` | Select `uninstalledAt`; re-exchange if missing shop or `uninstalledAt != null` |
| `app/server/src/__tests__/api.test.ts` | Soft-delete spy tests, unknown-shop 200 test, CSP test; auth mocks include `uninstalledAt: null` |
| `app/server/src/__tests__/ping.test.ts` | Reinstall test; existing ping mock includes `uninstalledAt: null` |

## Implementation Details

### 1. Soft-delete on uninstall webhook

- After HMAC verification, domain resolved from `X-Shopify-Shop-Domain` or JSON `myshopify_domain` / `domain` / `shop_domain`.
- `softDeleteShop` uses Drizzle `update` with `sql\`CURRENT_TIMESTAMP\`` and empty-string token (NOT NULL column).
- Returns `{ ok: true }` even when no row matches (idempotent).
- Unknown shop still calls `softDeleteShop` and returns 200.

### 2. Reinstall after uninstall

- `verifySessionToken` now treats uninstalled shops like missing shops: runs `exchangeAndUpsertShop`, which already clears `uninstalledAt` and sets a new `accessToken`.

### 3. Security checklist (tests only)

- CSP: `GET /health` response includes `Content-Security-Policy` with `frame-ancestors` and `https://admin.shopify.com`.
- Existing items (JWT HS256, shop isolation, HMAC webhooks, Zod, etc.) left unchanged per brief.

## Tests Added/Updated

| Test | File |
|------|------|
| Valid HMAC calls `softDeleteShop('test.myshopify.com')` | `api.test.ts` |
| Valid HMAC unknown shop → 200 | `api.test.ts` |
| CSP on `GET /health` | `api.test.ts` |
| Re-exchange when `uninstalledAt` set | `ping.test.ts` |
| Auth mocks include `uninstalledAt: null` | `api.test.ts`, `ping.test.ts` |

## Self-Review

- **Scope:** Server-only; no web/theme/migration/TOML changes.
- **Idempotency:** Webhook always 200 after valid HMAC.
- **Token nulling:** Empty string per schema constraint, not SQL NULL.
- **CSP:** Both `admin.shopify.com` and `*.myshopify.com` preserved in `index.ts`.
- **Patterns:** Service helper + spy matches existing test style; Drizzle parameterized update.

## Concerns

None. All brief requirements met; full test suite for specified files green; typecheck clean.

## Commits

None (per task instructions).
