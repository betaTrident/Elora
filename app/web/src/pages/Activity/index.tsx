import { Text } from '@shopify/polaris'
import { PageLayout } from '../../components/PageLayout'

export function Activity() {
  return (
    <PageLayout title="Activity">
      <Text as="p" variant="bodyMd">
        A chronological log of score changes, alerts, and kit events across your
        store.
      </Text>
    </PageLayout>
  )
}
