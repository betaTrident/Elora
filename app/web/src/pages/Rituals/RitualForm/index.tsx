import { useEffect, useState } from 'react'
import {
  Banner,
  BlockStack,
  Layout,
  SkeletonBodyText,
  SkeletonPage,
  TextField,
} from '@shopify/polaris'
import { useNavigate, useParams } from 'react-router-dom'
import { PageLayout } from '../../../components/PageLayout'
import { ScoreBadge } from '../../../components/ScoreBadge'
import { ScoreBreakdown } from '../../../components/ScoreBreakdown'
import type {
  RitualDetail,
  RitualRecalculateResponse,
  RitualSaveResponse,
  ScoreBreakdown as ScoreBreakdownType,
} from '../../../types'
import { api } from '../../../services/api'
import { mapScoreBreakdownToItems } from '../../../utils/mapScoreBreakdown'
import { ComponentList } from './ComponentList'

interface ScoreDisplay {
  score: number
  threshold: number
  breakdown: ScoreBreakdownType
}

export function RitualForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const pageTitle = isEdit ? 'Edit routine' : 'Create routine'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scoreThreshold, setScoreThreshold] = useState('70')
  const [components, setComponents] = useState<RitualDetail['components']>([])
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [scoreDisplay, setScoreDisplay] = useState<ScoreDisplay | null>(null)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    setLoadError(null)
    api
      .get<RitualDetail>(`/api/rituals/${id}`)
      .then((ritual) => {
        setTitle(ritual.title)
        setDescription(ritual.description ?? '')
        setScoreThreshold(String(ritual.scoreThreshold))
        setComponents(ritual.components)
      })
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error : new Error(String(error))),
      )
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit() {
    setValidationError(null)
    setScoreDisplay(null)

    if (components.length === 0) {
      setValidationError('Add at least one product before saving this routine.')
      return
    }

    const body = {
      title,
      description,
      scoreThreshold: Number(scoreThreshold),
      components: components.map((component, index) => ({
        shopifyProductId: component.shopifyProductId,
        shopifyVariantId: component.shopifyVariantId ?? null,
        productTitleCache: component.productTitleCache,
        role: component.role,
        quantity: component.quantity,
        unitCost: component.unitCost ?? undefined,
        sortOrder: component.sortOrder ?? index,
      })),
    }

    setSubmitting(true)
    try {
      const result = isEdit
        ? await api.put<RitualSaveResponse>(`/api/rituals/${id}`, body)
        : await api.post<RitualSaveResponse>('/api/rituals', body)

      setScoreDisplay({
        score: result.score,
        threshold: result.threshold,
        breakdown: result.breakdown,
      })
      if (!isEdit) {
        navigate(`/rituals/${result.id}/edit`)
      }
    } catch (error: unknown) {
      setValidationError(
        error instanceof Error ? error.message : 'Failed to save routine.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRecalculate() {
    if (!id) return

    setRecalculating(true)
    setValidationError(null)
    try {
      const result = await api.post<RitualRecalculateResponse>(
        `/api/rituals/${id}/recalculate`,
        undefined,
      )
      setScoreDisplay({
        score: result.score,
        threshold: Number(scoreThreshold),
        breakdown: result.breakdown,
      })
    } catch (error: unknown) {
      setValidationError(
        error instanceof Error ? error.message : 'Failed to recalculate score.',
      )
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <div aria-live="polite" aria-atomic="true">
        <SkeletonPage primaryAction>
          <Layout>
            <Layout.Section>
              <SkeletonBodyText lines={6} />
            </Layout.Section>
          </Layout>
        </SkeletonPage>
      </div>
    )
  }

  if (loadError) {
    return (
      <PageLayout title={pageTitle}>
        <Banner
          tone="critical"
          title="Routine failed to load"
          action={{ content: 'Back to routines', url: '/rituals' }}
        >
          <p>{loadError.message}</p>
        </Banner>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={pageTitle}
      primaryAction={{
        content: 'Save',
        onAction: () => void handleSubmit(),
        loading: submitting,
      }}
      secondaryActions={
        isEdit
          ? [
              {
                content: 'Recalculate',
                onAction: () => void handleRecalculate(),
                loading: recalculating,
              },
            ]
          : undefined
      }
    >
      <div aria-live="polite" aria-atomic="true">
        <BlockStack gap="400">
          {scoreDisplay && (
            <Banner tone="success" title="Health score updated">
              <BlockStack gap="200">
                <p>
                  Health score:{' '}
                  <ScoreBadge
                    score={scoreDisplay.score}
                    threshold={scoreDisplay.threshold}
                  />
                </p>
                <ScoreBreakdown
                  breakdown={mapScoreBreakdownToItems(scoreDisplay.breakdown)}
                />
              </BlockStack>
            </Banner>
          )}
          {validationError && (
            <Banner tone="critical" title="Could not save routine">
              <p>{validationError}</p>
            </Banner>
          )}
          <TextField
            label="Routine title"
            value={title}
            onChange={setTitle}
            autoComplete="off"
            requiredIndicator
          />
          <TextField
            label="Description"
            value={description}
            onChange={setDescription}
            autoComplete="off"
            multiline={3}
          />
          <TextField
            label="Score threshold"
            type="number"
            value={scoreThreshold}
            onChange={setScoreThreshold}
            autoComplete="off"
            min={0}
            max={100}
          />
          <ComponentList components={components} onChange={setComponents} />
        </BlockStack>
      </div>
    </PageLayout>
  )
}
