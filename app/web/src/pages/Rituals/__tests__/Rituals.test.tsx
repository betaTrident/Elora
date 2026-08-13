import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
