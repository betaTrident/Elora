import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import type { ReactNode } from 'react'

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('@shopify/app-bridge-react', () => ({
  TitleBar: () => null,
}))

import { Settings } from '../index'
import { api } from '../../../services/api'

const mockGet = api.get as ReturnType<typeof vi.fn>
const mockPut = api.put as ReturnType<typeof vi.fn>
const mockPost = api.post as ReturnType<typeof vi.fn>

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AppProvider i18n={enTranslations}>{children}</AppProvider>
    </MemoryRouter>
  )
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders RangeSlider from GET defaultThreshold 75', async () => {
    mockGet.mockResolvedValueOnce({ defaultThreshold: 75 })
    render(<Settings />, { wrapper: Wrapper })

    expect(await screen.findByText('Threshold: 75')).toBeTruthy()
    expect(screen.getByText('Default health threshold')).toBeTruthy()
    expect(
      screen.getByText('Routines scoring below this will trigger an alert.'),
    ).toBeTruthy()
  })

  it('saves settings via PUT /api/settings with the loaded threshold', async () => {
    mockGet.mockResolvedValueOnce({ defaultThreshold: 75 })
    mockPut.mockResolvedValueOnce({ defaultThreshold: 75 })
    render(<Settings />, { wrapper: Wrapper })

    await screen.findByText('Threshold: 75')
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }))

    expect(mockPut).toHaveBeenCalledWith('/api/settings', {
      defaultThreshold: 75,
    })
    expect(await screen.findByText('Settings saved')).toBeTruthy()
  })

  it('recalculates all via POST /api/scores/recalculate-all', async () => {
    mockGet.mockResolvedValueOnce({ defaultThreshold: 75 })
    mockPost.mockResolvedValueOnce({ recalculated: 3 })
    render(<Settings />, { wrapper: Wrapper })

    await screen.findByText('Threshold: 75')
    await userEvent.click(
      screen.getByRole('button', { name: 'Recalculate all routines' }),
    )

    expect(mockPost).toHaveBeenCalledWith('/api/scores/recalculate-all', {})
    expect(await screen.findByText('Recalculated 3 routines')).toBeTruthy()
  })

  it('shows a Banner when GET settings rejects', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))
    render(<Settings />, { wrapper: Wrapper })

    expect(await screen.findByText('Settings failed to load')).toBeTruthy()
    expect(screen.getByText('Network error')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })

  it('shows a Banner when PUT settings rejects', async () => {
    mockGet.mockResolvedValueOnce({ defaultThreshold: 75 })
    mockPut.mockRejectedValueOnce(new Error('Save failed'))
    render(<Settings />, { wrapper: Wrapper })

    await screen.findByText('Threshold: 75')
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }))

    expect(await screen.findByText('Could not save settings')).toBeTruthy()
    expect(screen.getByText('Save failed')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })
})
