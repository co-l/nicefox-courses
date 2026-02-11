import { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Layout } from './Layout'
import { Modal } from './Modal'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'conrad@example.com',
      role: 'user',
    },
    logout: vi.fn(),
  }),
}))

const renderLayout = (children: ReactNode) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Layout>{children}</Layout>
    </MemoryRouter>
  )

describe('Dark theme', () => {
  it('renders app chrome with dark shell classes', () => {
    const { container } = renderLayout(<div>content</div>)

    const root = container.firstElementChild as HTMLElement
    const header = container.querySelector('header') as HTMLElement

    expect(root).toHaveClass('bg-slate-950')
    expect(header).toHaveClass('bg-slate-900/95')
  })

  it('renders modal panel with dark surface classes', () => {
    const { getByTestId } = render(
      <Modal isOpen={true} onClose={() => undefined} title="Titre">
        modal content
      </Modal>
    )

    const panel = getByTestId('modal-panel')

    expect(panel).toHaveClass('bg-slate-900')
    expect(panel).toHaveClass('border')
    expect(panel).toHaveClass('border-slate-800')
  })
})
