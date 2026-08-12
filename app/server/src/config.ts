import 'dotenv/config'

export const config = {
  shopifyApiKey: process.env.SHOPIFY_API_KEY!,
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET!,
  shopifyAppUrl: process.env.SHOPIFY_APP_URL!,
  databaseUrl: process.env.DATABASE_URL!,
  port: Number(process.env.PORT ?? 3000),
}
