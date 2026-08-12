import { Text } from '@shopify/polaris'
import { PageLayout } from '../../components/PageLayout'

export function Settings() {
  return (
    <PageLayout title="Settings">
      <Text as="p" variant="bodyMd">
        Configure scoring thresholds and notification preferences for your store.
      </Text>
    </PageLayout>
  )
}
