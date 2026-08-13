import { BlockStack, Card, Grid, Text } from '@shopify/polaris'
import type { DashboardCounts } from '../../types'

interface KpiCardsProps {
  counts: DashboardCounts
}

const CARDS = [
  { label: 'Total routines', key: 'total' as const, tone: undefined },
  { label: 'Healthy', key: 'healthy' as const, tone: 'success' as const },
  { label: 'At risk / Broken', key: 'broken' as const, tone: 'critical' as const },
  { label: 'Open alerts', key: 'openAlerts' as const, tone: 'caution' as const },
]

export function KpiCards({ counts }: KpiCardsProps) {
  return (
    <BlockStack gap="300">
      <Text as="h2" variant="headingMd">Store routine health</Text>
      <Grid>
        {CARDS.map(({ label, key, tone }) => (
          <Grid.Cell key={label} columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  {label}
                </Text>
                <Text as="p" variant="headingXl" tone={tone}>
                  {counts[key]}
                </Text>
              </BlockStack>
            </Card>
          </Grid.Cell>
        ))}
      </Grid>
    </BlockStack>
  )
}
