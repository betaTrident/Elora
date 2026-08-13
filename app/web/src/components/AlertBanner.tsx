import { Banner, BlockStack } from '@shopify/polaris'
import type { Alert } from '../types'

interface AlertBannerProps {
  alerts: Pick<Alert, 'id' | 'severity' | 'message' | 'type'>[]
  onResolve?: (id: string) => void
}

export function AlertBanner({ alerts, onResolve }: AlertBannerProps) {
  if (alerts.length === 0) {
    return null
  }

  return (
    <BlockStack gap="200">
      {alerts.map((alert) => (
        <Banner
          key={alert.id}
          tone={alert.severity === 'critical' ? 'critical' : 'warning'}
          action={
            onResolve
              ? {
                  content: 'Resolve',
                  onAction: () => onResolve(alert.id),
                }
              : undefined
          }
        >
          <p>{alert.message}</p>
        </Banner>
      ))}
    </BlockStack>
  )
}
