import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import type { ReactNode } from 'react'

vi.mock('../../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock('@shopify/app-bridge-react', () => ({
  TitleBar: () => null,
}))

import { RitualForm } from '../index'
import { api } from '../../../../services/api'

const mockGet = api.get as ReturnType<typeof vi.fn>
const mockPost = api.post as ReturnType<typeof vi.fn>
const mockPut = api.put as ReturnType<typeof vi.fn>

const sampleBreakdown = {
  availability: 40,
  availabilityMax: 50,
  completeness: 15,
  completenessMax: 20,
  margin: 20,
  marginMax: 30,
  total: 75,
  factors: [],
}

const sampleSaveResponse = {
  id: 'ritual-1',
  score: 75,
  breakdown: sampleBreakdown,
  threshold: 70,
}

function NewWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/rituals/new']}>
      <AppProvider i18n={enTranslations}>
        <Routes>
          <Route path="/rituals/new" element={children} />
          <Route path="/rituals/:id/edit" element={children} />
        </Routes>
      </AppProvider>
    </MemoryRouter>
  )
}

function EditWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/rituals/ritual-1/edit']}>
      <AppProvider i18n={enTranslations}>
        <Routes>
          <Route path="/rituals/new" element={children} />
          <Route path="/rituals/:id/edit" element={children} />
        </Routes>
      </AppProvider>
    </MemoryRouter>
  )
}

describe('RitualForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(globalThis, 'shopify', {
      value: {
        idToken: async () => 'test-token',
        resourcePicker: async () => undefined,
      },
      configurable: true,
    })
  })

  it('does not POST when submitting without components', async () => {
    const user = userEvent.setup()
    render(<RitualForm />, { wrapper: NewWrapper })

    await user.type(screen.getByLabelText('Routine title'), 'Morning kit')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mockPost).not.toHaveBeenCalled()
    expect(mockPut).not.toHaveBeenCalled()
    expect(await screen.findByText(/add at least one product/i)).toBeTruthy()
  })

  it('shows three breakdown labels after successful save with breakdown', async () => {
    const user = userEvent.setup()
    mockGet.mockResolvedValueOnce({
      id: 'ritual-1',
      title: 'Morning kit',
      description: '',
      scoreThreshold: 70,
      status: 'active',
      lastScore: 75,
      components: [
        {
          shopifyProductId: 'p1',
          role: 'cleanse',
          quantity: 1,
          productTitleCache: 'Cleanser',
        },
      ],
    })
    mockPut.mockResolvedValueOnce(sampleSaveResponse)

    render(<RitualForm />, { wrapper: EditWrapper })

    await screen.findByDisplayValue('Morning kit')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/Availability — 40\/50/)).toBeTruthy()
    expect(screen.getByText(/Completeness — 15\/20/)).toBeTruthy()
    expect(screen.getByText(/Margin — 20\/30/)).toBeTruthy()
  })

  it('shows Recalculate on edit form and POSTs recalculate endpoint', async () => {
    const user = userEvent.setup()
    mockGet.mockResolvedValueOnce({
      id: 'ritual-1',
      title: 'Morning kit',
      description: '',
      scoreThreshold: 70,
      status: 'active',
      lastScore: 75,
      components: [
        {
          shopifyProductId: 'p1',
          role: 'cleanse',
          quantity: 1,
          productTitleCache: 'Cleanser',
        },
      ],
    })
    mockPost.mockResolvedValueOnce({
      score: 80,
      breakdown: sampleBreakdown,
    })

    render(<RitualForm />, { wrapper: EditWrapper })

    const recalculateButtons = await screen.findAllByRole('button', { name: 'Recalculate' })
    await user.click(recalculateButtons[0])

    expect(mockPost).toHaveBeenCalledWith('/api/rituals/ritual-1/recalculate', undefined)
    expect(await screen.findByText(/Availability — 40\/50/)).toBeTruthy()
  })
})
