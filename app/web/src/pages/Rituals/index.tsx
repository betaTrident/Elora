import { Text } from '@shopify/polaris'
import { PageLayout } from '../../components/PageLayout'

export function Rituals() {
  return (
    <PageLayout
      title="Routines"
      primaryAction={{ content: 'Create routine', url: '/rituals/new' }}
    >
      <Text as="p" variant="bodyMd">
        All active routine kits appear here. Create, edit, or archive kits from
        this list.
      </Text>
    </PageLayout>
  )
}
