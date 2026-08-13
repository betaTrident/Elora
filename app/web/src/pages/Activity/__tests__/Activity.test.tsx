import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

import { Activity } from '../index'
import { api } from '../../../services/api'

const mockGet = api.get as ReturnType<typeof vi.fn>

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AppProvider i18n={enTranslations}>{children}</AppProvider>
    </MemoryRouter>
  )
}

const sampleLog = {
  id: 'log-1',
  summary: 'Created routine "Morning kit"',
  entityType: 'ritual',
  actorType: 'merchant',
  action: 'ritual.created',
  createdAt: new Date().toISOString(),
  afterJson: { score: 85 },
}

describe('Activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('shows empty state heading when api.get returns []', async () => {
    mockGet.mockResolvedValueOnce([])
    render(<Activity />, { wrapper: Wrapper })
    const heading = await screen.findByText('No activity yet')
    expect(heading).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Who' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Action' })).toBeTruthy()
  })

  it('keeps filters visible with filtered empty results', async () => {
    mockGet.mockResolvedValue([])
    render(<Activity />, { wrapper: Wrapper })
    await screen.findByText('No activity yet')

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Action' }),
      'ritual.recalculated',
    )

    expect(await screen.findByText('No matching events')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Who' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Action' })).toBeTruthy()
  })

  it('includes Settings in the action filter options', async () => {
    mockGet.mockResolvedValueOnce([])
    render(<Activity />, { wrapper: Wrapper })
    await screen.findByText('No activity yet')
    expect(screen.getByRole('option', { name: 'Settings' })).toBeTruthy()
  })

  it('renders a summary row when logs are present', async () => {
    mockGet.mockResolvedValueOnce([sampleLog])
    render(<Activity />, { wrapper: Wrapper })
    expect(await screen.findByText('Created routine "Morning kit"')).toBeTruthy()
  })

  it('expands row to show afterJson when clicked', async () => {
    mockGet.mockResolvedValueOnce([sampleLog])
    render(<Activity />, { wrapper: Wrapper })
    const summary = await screen.findByText('Created routine "Morning kit"')
    await userEvent.click(summary)
    expect(await screen.findByText(/"score": 85/)).toBeTruthy()
  })
})
