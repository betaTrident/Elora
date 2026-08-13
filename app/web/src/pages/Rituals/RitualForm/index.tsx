import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Banner,
  BlockStack,
  Layout,
  SkeletonBodyText,
  SkeletonPage,
  TextField,
  Toast,
} from '@shopify/polaris'
import { SaveBar } from '@shopify/app-bridge-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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

interface FormSnapshot {
  title: string
  description: string
  scoreThreshold: string
  components: RitualDetail['components']
}

interface RitualFormLocationState {
  toast?: string
  scoreDisplay?: ScoreDisplay
}

const EMPTY_SNAPSHOT: FormSnapshot = {
  title: '',
  description: '',
  scoreThreshold: '70',
  components: [],
}

function captureSnapshot(
  title: string,
  description: string,
  scoreThreshold: string,
  components: RitualDetail['components'],
): FormSnapshot {
  return {
    title,
    description,
    scoreThreshold,
    components: components.map((component) => ({ ...component })),
  }
}

export function RitualForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = Boolean(id)
  const pageTitle = isEdit ? 'Edit routine' : 'Create routine'
  const locationState = location.state as RitualFormLocationState | null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scoreThreshold, setScoreThreshold] = useState('70')
  const [components, setComponents] = useState<RitualDetail['components']>([])
  const [snapshot, setSnapshot] = useState<FormSnapshot>(EMPTY_SNAPSHOT)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [scoreDisplay, setScoreDisplay] = useState<ScoreDisplay | null>(
    locationState?.scoreDisplay ?? null,
  )
  const [toast, setToast] = useState<string | null>(locationState?.toast ?? null)

  const fetchRitual = useCallback(() => {
    if (!id) return

    setLoading(true)
    setLoadError(null)
    api
      .get<RitualDetail>(`/api/rituals/${id}`)
      .then((ritual) => {
        const nextTitle = ritual.title
        const nextDescription = ritual.description ?? ''
        const nextThreshold = String(ritual.scoreThreshold)
        const nextComponents = ritual.components
        setTitle(nextTitle)
        setDescription(nextDescription)
        setScoreThreshold(nextThreshold)
        setComponents(nextComponents)
        setSnapshot(
          captureSnapshot(
            nextTitle,
            nextDescription,
            nextThreshold,
            nextComponents,
          ),
        )
      })
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error : new Error(String(error))),
      )
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    fetchRitual()
  }, [id, fetchRitual])

  const isDirty = useMemo(
    () =>
      JSON.stringify(
        captureSnapshot(title, description, scoreThreshold, components),
      ) !== JSON.stringify(snapshot),
    [title, description, scoreThreshold, components, snapshot],
  )

  function handleDiscard() {
    setTitle(snapshot.title)
    setDescription(snapshot.description)
    setScoreThreshold(snapshot.scoreThreshold)
    setComponents(snapshot.components.map((component) => ({ ...component })))
  }

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

      const nextScore: ScoreDisplay = {
        score: result.score,
        threshold: result.threshold,
        breakdown: result.breakdown,
      }
      setScoreDisplay(nextScore)
      setToast('Routine saved')
      setSnapshot(captureSnapshot(title, description, scoreThreshold, components))
      if (!isEdit) {
        navigate(`/rituals/${result.id}/edit`, {
          state: { toast: 'Routine saved', scoreDisplay: nextScore },
        })
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
          action={{ content: 'Retry', onAction: () => fetchRitual() }}
          secondaryAction={{ content: 'Back to routines', url: '/rituals' }}
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
      <SaveBar id="ritual-form-save-bar" open={isDirty}>
        <button
          type="button"
          variant="primary"
          onClick={() => void handleSubmit()}
        >
          Save
        </button>
        <button type="button" onClick={handleDiscard}>
          Discard
        </button>
      </SaveBar>
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
      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
    </PageLayout>
  )
}
