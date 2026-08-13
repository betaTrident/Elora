import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Banner,
  BlockStack,
  IndexTable,
  InlineStack,
  Layout,
  Select,
  SkeletonBodyText,
  SkeletonPage,
  Text,
} from '@shopify/polaris'
import { PageLayout } from '../../components/PageLayout'
import { EmptyState } from '../../components/EmptyState'
import type { ActivityLog } from '../../types'
import { api } from '../../services/api'
import { formatRelativeTime } from '../../utils/formatRelativeTime'

const ACTOR_TYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Merchant', value: 'merchant' },
  { label: 'System', value: 'system' },
]

const ACTION_OPTIONS = [
  { label: 'All actions', value: 'all' },
  { label: 'Created', value: 'ritual.created' },
  { label: 'Updated', value: 'ritual.updated' },
  { label: 'Archived', value: 'ritual.archived' },
  { label: 'Recalculated', value: 'ritual.recalculated' },
]

function buildActivityPath(actorType: string, action: string): string {
  const params = new URLSearchParams()
  if (actorType !== 'all') params.set('actorType', actorType)
  if (action !== 'all') params.set('action', action)
  const query = params.toString()
  return query ? `/api/activity?${query}` : '/api/activity'
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function Activity() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [actorTypeFilter, setActorTypeFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get<ActivityLog[]>(buildActivityPath(actorTypeFilter, actionFilter))
      .then((items) => {
        setLogs(items)
        setExpandedId(null)
      })
      .catch((fetchError: unknown) =>
        setError(
          fetchError instanceof Error
            ? fetchError
            : new Error(String(fetchError)),
        ),
      )
      .finally(() => setLoading(false))
  }, [actorTypeFilter, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  function toggleExpand(id: string) {
    setExpandedId((current) => (current === id ? null : id))
  }

  if (loading) {
    return (
      <div aria-live="polite" aria-atomic="true">
        <SkeletonPage>
          <Layout>
            <Layout.Section>
              <SkeletonBodyText lines={2} />
            </Layout.Section>
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
      <PageLayout title="Activity" titleBarTitle="Activity log">
        <Banner
          tone="critical"
          title="Activity failed to load"
          action={{ content: 'Retry', onAction: () => fetchLogs() }}
        >
          <p>{error.message}</p>
        </Banner>
      </PageLayout>
    )
  }

  const hasActiveFilters = actorTypeFilter !== 'all' || actionFilter !== 'all'

  const tableRows = logs.flatMap((log, index) => {
    const rows = [
      <IndexTable.Row
        key={log.id}
        id={log.id}
        position={index}
        onClick={() => toggleExpand(log.id)}
      >
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {log.summary}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge>{log.entityType}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{log.actorType}</IndexTable.Cell>
        <IndexTable.Cell>
          {formatRelativeTime(new Date(log.createdAt as string))}
        </IndexTable.Cell>
      </IndexTable.Row>,
    ]

    if (expandedId === log.id) {
      rows.push(
        <IndexTable.Row key={`${log.id}-details`} id={`${log.id}-details`} position={index}>
          <IndexTable.Cell colSpan={4}>
            <BlockStack gap="200">
              {log.beforeJson != null && (
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" fontWeight="semibold">
                    Before
                  </Text>
                  <pre>{formatJson(log.beforeJson)}</pre>
                </BlockStack>
              )}
              {log.afterJson != null && (
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" fontWeight="semibold">
                    After
                  </Text>
                  <pre>{formatJson(log.afterJson)}</pre>
                </BlockStack>
              )}
            </BlockStack>
          </IndexTable.Cell>
        </IndexTable.Row>,
      )
    }

    return rows
  })

  return (
    <PageLayout title="Activity" titleBarTitle="Activity log">
      <div aria-live="polite" aria-atomic="true">
        <BlockStack gap="400">
          <InlineStack gap="300" wrap>
            <Select
              label="Who"
              options={ACTOR_TYPE_OPTIONS}
              value={actorTypeFilter}
              onChange={setActorTypeFilter}
            />
            <Select
              label="Action"
              options={ACTION_OPTIONS}
              value={actionFilter}
              onChange={setActionFilter}
            />
          </InlineStack>
          {logs.length === 0 ? (
            <EmptyState
              heading={
                hasActiveFilters ? 'No matching events' : 'No activity yet'
              }
              description={
                hasActiveFilters
                  ? 'Try changing or clearing the filters above to see more events.'
                  : 'Score changes, routine updates, and other events will appear here.'
              }
            />
          ) : (
            <IndexTable
              resourceName={{ singular: 'event', plural: 'events' }}
              itemCount={logs.length}
              headings={[
                { title: 'Action' },
                { title: 'Entity' },
                { title: 'Who' },
                { title: 'When' },
              ]}
              selectable={false}
            >
              {tableRows}
            </IndexTable>
          )}
        </BlockStack>
      </div>
    </PageLayout>
  )
}
