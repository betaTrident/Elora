import { useEffect, useState } from 'react'
import { Banner, BlockStack, Grid, Layout, SkeletonBodyText, SkeletonPage } from '@shopify/polaris'
import { PageLayout } from '../../components/PageLayout'
import { EmptyState } from '../../components/EmptyState'
import { AlertBanner } from '../../components/AlertBanner'
import type { Alert, DashboardData } from '../../types'
import { api } from '../../services/api'
import { KpiCards } from './KpiCards'
import { RitualHealthTable } from './RitualHealthTable'
import { RecentActivity } from './RecentActivity'

const PRIMARY_ACTION = { content: 'Create routine', url: '/rituals/new' }

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [alertsError, setAlertsError] = useState<Error | null>(null)

  function fetchAlerts() {
    setAlertsError(null)
    api
      .get<Alert[]>('/api/alerts')
      .then((openAlerts) => setAlerts(openAlerts))
      .catch((e: unknown) =>
        setAlertsError(e instanceof Error ? e : new Error(String(e))),
      )
  }

  function fetchDashboard() {
    setLoading(true)
    setError(null)
    api
      .get<DashboardData>('/api/dashboard')
      .then((d) => setData(d))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e : new Error(String(e))),
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDashboard()
    fetchAlerts()
  }, [])

  if (loading) {
    return (
      <div aria-live="polite" aria-atomic="true">
        <SkeletonPage primaryAction>
          <Layout>
            <Layout.Section>
              <SkeletonBodyText lines={4} />
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
      <PageLayout
        title="Dashboard"
        titleBarTitle="RitualScore"
        primaryAction={PRIMARY_ACTION}
      >
        <Banner
          tone="critical"
          title="Dashboard failed to load"
          action={{ content: 'Retry', onAction: () => window.location.reload() }}
        >
          <p>{error.message}</p>
        </Banner>
      </PageLayout>
    )
  }

  if (!data || data.counts.total === 0) {
    return (
      <PageLayout
        title="Dashboard"
        titleBarTitle="RitualScore"
        primaryAction={PRIMARY_ACTION}
      >
        <EmptyState
          heading="Start tracking your beauty routines"
          description="Create your first routine kit and see its health score instantly."
          action={{ content: 'Create routine', url: '/rituals/new' }}
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Dashboard"
      titleBarTitle="RitualScore"
      primaryAction={PRIMARY_ACTION}
    >
      <div aria-live="polite" aria-atomic="true">
        <BlockStack gap="400">
          {alertsError && (
            <Banner
              tone="critical"
              title="Alerts failed to load"
              action={{ content: 'Retry', onAction: () => fetchAlerts() }}
            >
              <p>{alertsError.message}</p>
            </Banner>
          )}
          <AlertBanner alerts={alerts} />
          <Layout>
            <Layout.Section>
              <KpiCards counts={data.counts} />
            </Layout.Section>
            <Layout.Section>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, lg: 8 }}>
                  <RitualHealthTable rituals={data.worst5} />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, lg: 4 }}>
                  <RecentActivity activity={data.recentActivity} />
                </Grid.Cell>
              </Grid>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </div>
    </PageLayout>
  )
}
