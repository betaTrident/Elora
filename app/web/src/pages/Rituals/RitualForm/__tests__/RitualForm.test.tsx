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

const mockPost = api.post as ReturnType<typeof vi.fn>
const mockPut = api.put as ReturnType<typeof vi.fn>

function Wrapper({ children }: { children: ReactNode }) {
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
    render(<RitualForm />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText('Routine title'), 'Morning kit')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mockPost).not.toHaveBeenCalled()
    expect(mockPut).not.toHaveBeenCalled()
    expect(await screen.findByText(/add at least one product/i)).toBeTruthy()
  })
})
