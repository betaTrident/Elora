import { useEffect, useState } from 'react'
import {
  Banner,
  BlockStack,
  Button,
  IndexTable,
  Layout,
  Link,
  Modal,
  SkeletonBodyText,
  SkeletonPage,
  Text,
} from '@shopify/polaris'
import { PageLayout } from '../../components/PageLayout'
import { EmptyState } from '../../components/EmptyState'
import { ScoreBadge } from '../../components/ScoreBadge'
import type { RitualListItem } from '../../types'
import { api } from '../../services/api'
import { formatRelativeTime } from '../../utils/formatRelativeTime'

const PRIMARY_ACTION = { content: 'Create routine', url: '/rituals/new' }

export function Rituals() {
  const [rituals, setRituals] = useState<RitualListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<RitualListItem | null>(null)
  const [archiving, setArchiving] = useState(false)

  function fetchRituals() {
    setLoading(true)
    setError(null)
    api
      .get<RitualListItem[]>('/api/rituals')
      .then((items) => setRituals(items))
      .catch((fetchError: unknown) =>
        setError(fetchError instanceof Error ? fetchError : new Error(String(fetchError))),
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRituals()
  }, [])

  async function handleArchiveConfirm() {
    if (!archiveTarget) return

    setArchiving(true)
    try {
      await api.post(`/api/rituals/${archiveTarget.id}/archive`, {})
      setRituals((current) =>
        current.filter((ritual) => ritual.id !== archiveTarget.id),
      )
      setArchiveTarget(null)
    } catch (archiveError: unknown) {
      setError(
        archiveError instanceof Error
          ? archiveError
          : new Error('Failed to archive routine.'),
      )
      setArchiveTarget(null)
    } finally {
      setArchiving(false)
    }
  }

  if (loading) {
    return (
      <div aria-live="polite" aria-atomic="true">
        <SkeletonPage primaryAction>
          <Layout>
            <Layout.Section>
              <SkeletonBodyText lines={8} />
            </Layout.Section>
          </Layout>
        </SkeletonPage>
      </div>
    )
  }

  if (error) {
    return (
      <PageLayout title="Routines" primaryAction={PRIMARY_ACTION}>
        <Banner
          tone="critical"
          title="Routines failed to load"
          action={{ content: 'Retry', onAction: () => fetchRituals() }}
        >
          <p>{error.message}</p>
        </Banner>
      </PageLayout>
    )
  }

  if (rituals.length === 0) {
    return (
      <PageLayout title="Routines" primaryAction={PRIMARY_ACTION}>
        <EmptyState
          heading="No routines yet"
          description="Create a routine kit to start tracking product health."
          action={{ content: 'Create routine', url: '/rituals/new' }}
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Routines" primaryAction={PRIMARY_ACTION}>
      <div aria-live="polite" aria-atomic="true">
        <BlockStack gap="300">
          <Text as="p" variant="bodyMd">
            All active routine kits appear here. Create, edit, or archive kits from
            this list.
          </Text>
          <IndexTable
            resourceName={{ singular: 'routine', plural: 'routines' }}
            itemCount={rituals.length}
            headings={[
              { title: 'Routine name' },
              { title: 'Score' },
              { title: 'Threshold' },
              { title: 'Last checked' },
              { title: 'Actions' },
            ]}
            selectable={false}
          >
            {rituals.map((ritual, index) => (
              <IndexTable.Row key={ritual.id} id={ritual.id} position={index}>
                <IndexTable.Cell>
                  <Link url={`/rituals/${ritual.id}/edit`}>{ritual.title}</Link>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <ScoreBadge
                    score={ritual.lastScore}
                    threshold={ritual.scoreThreshold}
                  />
                </IndexTable.Cell>
                <IndexTable.Cell>{ritual.scoreThreshold}</IndexTable.Cell>
                <IndexTable.Cell>
                  {ritual.lastScoredAt
                    ? formatRelativeTime(new Date(ritual.lastScoredAt as string))
                    : '\u2014'}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={() => setArchiveTarget(ritual)}
                  >
                    Archive
                  </Button>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </BlockStack>
        <Modal
          open={archiveTarget !== null}
          onClose={() => setArchiveTarget(null)}
          title="Archive routine"
          primaryAction={{
            content: 'Archive',
            onAction: () => void handleArchiveConfirm(),
            loading: archiving,
            destructive: true,
          }}
          secondaryActions={[
            { content: 'Cancel', onAction: () => setArchiveTarget(null) },
          ]}
        >
          <Modal.Section>
            <p>
              Archive &ldquo;{archiveTarget?.title}&rdquo;? It will be removed from
              active lists but kept in your store history.
            </p>
          </Modal.Section>
        </Modal>
      </div>
    </PageLayout>
  )
}
