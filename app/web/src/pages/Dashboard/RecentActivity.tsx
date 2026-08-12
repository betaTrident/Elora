import { BlockStack, Card, Text } from '@shopify/polaris'
import type { ActivityLog } from '../../types'
import { formatRelativeTime } from '../../utils/formatRelativeTime'

interface RecentActivityProps {
  activity: ActivityLog[]
}

export function RecentActivity({ activity }: RecentActivityProps) {
  const entries = activity.slice(0, 5)

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">Recent activity</Text>
        {entries.length === 0 ? (
          <Text as="p" variant="bodyMd" tone="subdued">
            No recent activity
          </Text>
        ) : (
          entries.map((entry) => (
            <BlockStack key={entry.id} gap="100">
              <Text as="p" variant="bodyMd">
                {entry.summary}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {formatRelativeTime(new Date(entry.createdAt as string))}
              </Text>
            </BlockStack>
          ))
        )}
      </BlockStack>
    </Card>
  )
}
