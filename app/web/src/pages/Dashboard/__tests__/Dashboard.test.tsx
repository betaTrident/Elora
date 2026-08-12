import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import type { ReactNode } from 'react'

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock('@shopify/app-bridge-react', () => ({
  TitleBar: () => null,
}))

import { Dashboard } from '../index'
import { api } from '../../../services/api'

const mockGet = api.get as ReturnType<typeof vi.fn>

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AppProvider i18n={enTranslations}>{children}</AppProvider>
    </MemoryRouter>
  )
}

const emptyData = {
  counts: { total: 0, healthy: 0, broken: 0, unscored: 0, openAlerts: 0 },
  worst5: [],
  recentActivity: [],
}

const fullData = {
  counts: { total: 5, healthy: 3, broken: 1, unscored: 1, openAlerts: 2 },
  worst5: [
    {
      id: 'r1',
      title: 'Morning routine',
      lastScore: 45,
      scoreThreshold: 70,
      lastScoredAt: new Date().toISOString(),
    },
  ],
  recentActivity: [],
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state heading when counts.total === 0', async () => {
    mockGet.mockResolvedValueOnce(emptyData)
    render(<Dashboard />, { wrapper: Wrapper })
    const heading = await screen.findByText('Start tracking your beauty routines')
    expect(heading).toBeTruthy()
  })

  it('shows error banner when api.get rejects', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))
    render(<Dashboard />, { wrapper: Wrapper })
    const banner = await screen.findByText('Dashboard failed to load')
    expect(banner).toBeTruthy()
  })

  it('renders KPI labels when data is present', async () => {
    mockGet.mockResolvedValueOnce(fullData)
    render(<Dashboard />, { wrapper: Wrapper })
    expect(await screen.findByText('Total routines')).toBeTruthy()
    expect(screen.getByText('Healthy')).toBeTruthy()
    expect(screen.getByText('At risk / Broken')).toBeTruthy()
    expect(screen.getByText('Open alerts')).toBeTruthy()
  })
})
