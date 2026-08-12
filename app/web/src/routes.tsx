import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Banner, Page, Text } from '@shopify/polaris'
import { api } from './services/api'

function HomePage() {
  const [shop, setShop] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get<{ shop: string }>('/api/ping')
      .then((data) => {
        if (!cancelled) setShop(data.shop)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ping failed')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Page title="RitualScore">
      {error ? (
        <Banner tone="critical">{error}</Banner>
      ) : (
        <Text as="p" variant="bodyMd">
          {shop ? `Connected to ${shop}` : 'Connecting…'}
        </Text>
      )}
    </Page>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}
