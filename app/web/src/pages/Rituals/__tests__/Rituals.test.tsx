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
    post: vi.fn(),
  },
}))

vi.mock('@shopify/app-bridge-react', () => ({
  TitleBar: () => null,
}))

import { Rituals } from '../index'
import { api } from '../../../services/api'

const mockGet = api.get as ReturnType<typeof vi.fn>
const mockPost = api.post as ReturnType<typeof vi.fn>

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AppProvider i18n={enTranslations}>{children}</AppProvider>
    </MemoryRouter>
  )
}

describe('Rituals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state heading when api.get returns []', async () => {
    mockGet.mockResolvedValueOnce([])
    render(<Rituals />, { wrapper: Wrapper })
    const heading = await screen.findByText('No routines yet')
    expect(heading).toBeTruthy()
  })

  it('shows Routine archived toast after confirming archive', async () => {
    const user = userEvent.setup()
    mockGet.mockResolvedValueOnce([
      {
        id: 'r1',
        title: 'Morning kit',
        lastScore: 75,
        scoreThreshold: 70,
        lastScoredAt: new Date().toISOString(),
        status: 'active',
      },
    ])
    mockPost.mockResolvedValueOnce({})

    render(<Rituals />, { wrapper: Wrapper })

    await screen.findByText('Morning kit')
    await user.click(screen.getByRole('button', { name: 'Archive' }))
    const confirmButtons = screen.getAllByRole('button', { name: 'Archive' })
    await user.click(confirmButtons[confirmButtons.length - 1])

    expect(mockPost).toHaveBeenCalledWith('/api/rituals/r1/archive', {})
    expect(await screen.findByText('Routine archived')).toBeTruthy()
  })
})
