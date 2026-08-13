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

import { Dashboard } from '../index'
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
    mockGet.mockImplementation((path: string) => {
      if (path === '/api/dashboard') return Promise.resolve(emptyData)
      if (path === '/api/alerts') return Promise.resolve([])
      return Promise.reject(new Error(`unexpected path: ${path}`))
    })
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
    mockGet.mockImplementation((path: string) => {
      if (path === '/api/dashboard') return Promise.resolve(fullData)
      if (path === '/api/alerts') return Promise.resolve([])
      return Promise.reject(new Error(`unexpected path: ${path}`))
    })
    render(<Dashboard />, { wrapper: Wrapper })
    expect(await screen.findByText('Total routines')).toBeTruthy()
    expect(screen.getByText('Healthy')).toBeTruthy()
    expect(screen.getByText('At risk / Broken')).toBeTruthy()
    expect(screen.getByText('Open alerts')).toBeTruthy()
  })

  it('shows alert message when /api/alerts returns an open alert', async () => {
    const alertMessage = 'Routine score 45 is below threshold 70'
    mockGet.mockImplementation((path: string) => {
      if (path === '/api/dashboard') return Promise.resolve(fullData)
      if (path === '/api/alerts')
        return Promise.resolve([
          {
            id: 'a1',
            ritualId: 'r1',
            type: 'low_score',
            severity: 'warning',
            message: alertMessage,
            status: 'open',
            createdAt: new Date().toISOString(),
          },
        ])
      return Promise.reject(new Error(`unexpected path: ${path}`))
    })
    render(<Dashboard />, { wrapper: Wrapper })
    expect(await screen.findByText(alertMessage)).toBeTruthy()
  })

  it('resolves an alert when Resolve is clicked', async () => {
    const user = userEvent.setup()
    const alertMessage = 'Routine score 45 is below threshold 70'
    mockGet.mockImplementation((path: string) => {
      if (path === '/api/dashboard') return Promise.resolve(fullData)
      if (path === '/api/alerts')
        return Promise.resolve([
          {
            id: 'a1',
            ritualId: 'r1',
            type: 'low_score',
            severity: 'warning',
            message: alertMessage,
            status: 'open',
            createdAt: new Date().toISOString(),
          },
        ])
      return Promise.reject(new Error(`unexpected path: ${path}`))
    })
    mockPost.mockResolvedValueOnce({})

    render(<Dashboard />, { wrapper: Wrapper })
    expect(await screen.findByText(alertMessage)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Resolve' }))

    expect(mockPost).toHaveBeenCalledWith('/api/alerts/a1/resolve', {})
    expect(await screen.findByText('Alert resolved')).toBeTruthy()
    expect(screen.queryByText(alertMessage)).toBeNull()
  })

  it('does not show alert message when /api/alerts returns empty array', async () => {
    mockGet.mockImplementation((path: string) => {
      if (path === '/api/dashboard') return Promise.resolve(fullData)
      if (path === '/api/alerts') return Promise.resolve([])
      return Promise.reject(new Error(`unexpected path: ${path}`))
    })
    render(<Dashboard />, { wrapper: Wrapper })
    await screen.findByText('Total routines')
    expect(screen.queryByText(/below threshold/i)).toBeNull()
  })
})
