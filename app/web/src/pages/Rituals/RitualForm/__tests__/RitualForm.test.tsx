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
  SaveBar: ({
    open,
    children,
  }: {
    open?: boolean
    children?: ReactNode
  }) => (open ? <div data-testid="save-bar">{children}</div> : null),
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
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0])

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
    expect(screen.getByText('Routine saved')).toBeTruthy()
  })

  it('shows Routine saved toast and score banner after create', async () => {
    const user = userEvent.setup()
    Object.defineProperty(globalThis, 'shopify', {
      value: {
        idToken: async () => 'test-token',
        resourcePicker: async () => [
          {
            id: 'gid://shopify/Product/1',
            title: 'Cleanser',
            variants: [{ id: 'v1' }],
          },
        ],
      },
      configurable: true,
    })
    mockPost.mockResolvedValueOnce(sampleSaveResponse)
    mockGet.mockResolvedValueOnce({
      id: 'ritual-1',
      title: 'Morning kit',
      description: '',
      scoreThreshold: 70,
      status: 'active',
      lastScore: 75,
      components: [
        {
          shopifyProductId: 'gid://shopify/Product/1',
          shopifyVariantId: 'v1',
          role: 'cleanse',
          quantity: 1,
          productTitleCache: 'Cleanser',
        },
      ],
    })

    render(<RitualForm />, { wrapper: NewWrapper })

    await user.type(screen.getByLabelText('Routine title'), 'Morning kit')
    await user.click(screen.getByRole('button', { name: 'Add product' }))
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0])

    expect(mockPost).toHaveBeenCalledWith(
      '/api/rituals',
      expect.objectContaining({ title: 'Morning kit' }),
    )
    expect(await screen.findByText('Routine saved')).toBeTruthy()
    expect(await screen.findByText(/Availability — 40\/50/)).toBeTruthy()
  })

  it('shows the save bar when the form is dirty and discard restores the snapshot', async () => {
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

    render(<RitualForm />, { wrapper: EditWrapper })

    await screen.findByDisplayValue('Morning kit')
    expect(screen.queryByTestId('save-bar')).toBeNull()

    const titleField = screen.getByLabelText('Routine title')
    await user.clear(titleField)
    await user.type(titleField, 'Evening kit')

    expect(screen.getByTestId('save-bar')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Discard' }))

    expect(screen.getByDisplayValue('Morning kit')).toBeTruthy()
    expect(screen.queryByTestId('save-bar')).toBeNull()
  })

  it('hides the save bar after a successful save', async () => {
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
    await user.type(screen.getByLabelText('Routine title'), ' updated')
    expect(screen.getByTestId('save-bar')).toBeTruthy()

    await user.click(screen.getAllByRole('button', { name: 'Save' })[0])

    expect(await screen.findByText('Routine saved')).toBeTruthy()
    expect(screen.queryByTestId('save-bar')).toBeNull()
  })

  it('retries loading the routine when Retry is clicked', async () => {
    const user = userEvent.setup()
    mockGet
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
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

    render(<RitualForm />, { wrapper: EditWrapper })

    expect(await screen.findByText('Routine failed to load')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByDisplayValue('Morning kit')).toBeTruthy()
    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(mockGet).toHaveBeenNthCalledWith(2, '/api/rituals/ritual-1')
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
