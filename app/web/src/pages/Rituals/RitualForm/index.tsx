import { Text } from '@shopify/polaris'
import { useParams } from 'react-router-dom'
import { PageLayout } from '../../../components/PageLayout'

export function RitualForm() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const title = isEdit ? 'Edit routine' : 'Create routine'

  return (
    <PageLayout title={title}>
      <Text as="p" variant="bodyMd">
        {isEdit
          ? "Update an existing kit's products or scoring rules."
          : 'Define a new kit — name, products, and scoring threshold. Changes are saved automatically.'}
      </Text>
    </PageLayout>
  )
}
