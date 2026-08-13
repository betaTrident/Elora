import { Banner, BlockStack } from '@shopify/polaris'
import type { Alert } from '../types'

interface AlertBannerProps {
  alerts: Pick<Alert, 'id' | 'severity' | 'message' | 'type'>[]
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) {
    return null
  }

  return (
    <BlockStack gap="200">
      {alerts.map((alert) => (
        <Banner
          key={alert.id}
          tone={alert.severity === 'critical' ? 'critical' : 'warning'}
        >
          <p>{alert.message}</p>
        </Banner>
      ))}
    </BlockStack>
  )
}
