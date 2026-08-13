import { useCallback, useEffect, useState } from 'react'
import {
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  Layout,
  RangeSlider,
  SkeletonBodyText,
  SkeletonPage,
  Text,
  Toast,
} from '@shopify/polaris'
import { PageLayout } from '../../components/PageLayout'
import type { RecalculateAllResponse, ShopSettings } from '../../types'
import { api } from '../../services/api'

function recalculateToastContent(count: number): string {
  return count === 1
    ? 'Recalculated 1 routine'
    : `Recalculated ${count} routines`
}

export function Settings() {
  const [threshold, setThreshold] = useState(70)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [saveError, setSaveError] = useState<Error | null>(null)
  const [recalculateError, setRecalculateError] = useState<Error | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchSettings = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get<ShopSettings>('/api/settings')
      .then((settings) => setThreshold(settings.defaultThreshold))
      .catch((fetchError: unknown) =>
        setError(
          fetchError instanceof Error
            ? fetchError
            : new Error(String(fetchError)),
        ),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      await api.put<ShopSettings>('/api/settings', {
        defaultThreshold: threshold,
      })
      setRecalculateError(null)
      setToast('Settings saved')
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err : new Error('Failed to save settings.'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function recalculateAll() {
    setRecalculating(true)
    setRecalculateError(null)
    try {
      const result = await api.post<RecalculateAllResponse>(
        '/api/scores/recalculate-all',
        {},
      )
      setSaveError(null)
      setToast(recalculateToastContent(result.recalculated))
    } catch (err: unknown) {
      setRecalculateError(
        err instanceof Error
          ? err
          : new Error('Failed to recalculate routines.'),
      )
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <div aria-live="polite" aria-atomic="true">
        <SkeletonPage>
          <Layout>
            <Layout.Section>
              <SkeletonBodyText lines={4} />
            </Layout.Section>
          </Layout>
        </SkeletonPage>
      </div>
    )
  }

  if (error) {
    return (
      <PageLayout title="Settings">
        <Banner
          tone="critical"
          title="Settings failed to load"
          action={{ content: 'Retry', onAction: () => fetchSettings() }}
        >
          <p>{error.message}</p>
        </Banner>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Settings">
      <div aria-live="polite" aria-atomic="true">
        <BlockStack gap="400">
          {saveError && (
            <Banner
              tone="critical"
              title="Could not save settings"
              action={{ content: 'Retry', onAction: () => void save() }}
            >
              <p>{saveError.message}</p>
            </Banner>
          )}
          {recalculateError && (
            <Banner
              tone="critical"
              title="Could not recalculate routines"
              action={{ content: 'Retry', onAction: () => void recalculateAll() }}
            >
              <p>{recalculateError.message}</p>
            </Banner>
          )}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Default health threshold
              </Text>
              <Text as="p" tone="subdued">
                Routines scoring below this will trigger an alert.
              </Text>
              <RangeSlider
                label={`Threshold: ${threshold}`}
                value={threshold}
                min={0}
                max={100}
                step={5}
                onChange={(value) => setThreshold(value as number)}
                output
              />
              <ButtonGroup>
                <Button
                  variant="primary"
                  onClick={() => void save()}
                  loading={saving}
                  disabled={recalculating}
                >
                  Save settings
                </Button>
                <Button
                  onClick={() => void recalculateAll()}
                  loading={recalculating}
                  disabled={saving}
                >
                  Recalculate all routines
                </Button>
              </ButtonGroup>
            </BlockStack>
          </Card>
        </BlockStack>
      </div>
      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
    </PageLayout>
  )
}
