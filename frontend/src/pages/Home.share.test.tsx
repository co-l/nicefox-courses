import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Home } from './Home'
import type { AccountShareStatusView } from '../types'

vi.mock('../services/api', () => ({
  getItems: vi.fn(async () => []),
  deleteItem: vi.fn(async () => undefined),
  createTemporaryItem: vi.fn(async () => ({
    id: 'temp-1',
    userId: 'owner-1',
    name: 'test',
    targetQuantity: 1,
    currentQuantity: 0,
    unit: 'unite(s)',
    homeLocation: '',
    homeOrder: 0,
    storeSection: 'Billa',
    storeOrder: 0,
    isTemporary: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  })),
  getAccountShareStatus: vi.fn(),
  requestAccountShare: vi.fn(),
  cancelAccountShareRequest: vi.fn(),
  respondToAccountShare: vi.fn(),
  stopAccountShare: vi.fn(),
}))

import {
  getAccountShareStatus,
  requestAccountShare,
  cancelAccountShareRequest,
  respondToAccountShare,
  stopAccountShare,
} from '../services/api'

const mockedGetStatus = vi.mocked(getAccountShareStatus)
const mockedRequest = vi.mocked(requestAccountShare)
const mockedCancel = vi.mocked(cancelAccountShareRequest)
const mockedRespond = vi.mocked(respondToAccountShare)
const mockedStop = vi.mocked(stopAccountShare)

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )

const status = (overrides: Partial<AccountShareStatusView> = {}): AccountShareStatusView => ({
  role: 'none',
  effectiveOwnerUserId: 'owner-1',
  partnerEmail: null,
  outgoingRequest: null,
  incomingRequests: [],
  ...overrides,
})

describe('Home account sharing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetStatus.mockResolvedValue(status())
  })

  it('shows "Partager ce compte" and allows creating request', async () => {
    mockedRequest.mockResolvedValue({
      id: 'share-1',
      ownerUserId: 'owner-1',
      ownerAuthUserId: 'auth-owner-1',
      ownerEmail: 'owner@example.test',
      targetEmail: 'target@example.test',
      status: 'pending',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
    })

    renderHome()

    expect(await screen.findByRole('button', { name: 'Partager ce compte' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Partager ce compte' }))
    fireEvent.change(screen.getByPlaceholderText('Email du compte'), {
      target: { value: 'target@example.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))

    await waitFor(() => {
      expect(mockedRequest).toHaveBeenCalledWith('target@example.test')
    })
  })

  it('shows pending request and lets owner cancel it', async () => {
    mockedGetStatus.mockReset()
    mockedGetStatus
      .mockResolvedValueOnce(status())
      .mockResolvedValue(
        status({
          role: 'owner',
          partnerEmail: 'target@example.test',
          outgoingRequest: {
            id: 'share-1',
            ownerUserId: 'owner-1',
            ownerAuthUserId: 'auth-owner-1',
            ownerEmail: 'owner@example.test',
            targetEmail: 'target@example.test',
            status: 'pending',
            createdAt: '2026-01-01T10:00:00.000Z',
            updatedAt: '2026-01-01T10:00:00.000Z',
          },
        })
      )
    mockedRequest.mockResolvedValue({
      id: 'share-1',
      ownerUserId: 'owner-1',
      ownerAuthUserId: 'auth-owner-1',
      ownerEmail: 'owner@example.test',
      targetEmail: 'target@example.test',
      status: 'pending',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
    })
    mockedCancel.mockResolvedValue({
      id: 'share-1',
      ownerUserId: 'owner-1',
      ownerAuthUserId: 'auth-owner-1',
      ownerEmail: 'owner@example.test',
      targetEmail: 'target@example.test',
      status: 'cancelled',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:05:00.000Z',
    })

    renderHome()

    fireEvent.click(await screen.findByRole('button', { name: 'Partager ce compte' }))
    fireEvent.change(screen.getByPlaceholderText('Email du compte'), {
      target: { value: 'target@example.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Annuler la demande' }))

    await waitFor(() => {
      expect(mockedCancel).toHaveBeenCalledTimes(1)
    })
  })

  it('shows incoming request modal with Accepter and Refuser', async () => {
    mockedGetStatus.mockResolvedValue(
      status({
        incomingRequests: [
          {
            id: 'share-1',
            ownerUserId: 'owner-1',
            ownerAuthUserId: 'auth-owner-1',
            ownerEmail: 'owner@example.test',
            targetEmail: 'target@example.test',
            status: 'pending',
            createdAt: '2026-01-01T10:00:00.000Z',
            updatedAt: '2026-01-01T10:00:00.000Z',
          },
        ],
      })
    )
    mockedRespond.mockResolvedValue({
      id: 'share-1',
      ownerUserId: 'owner-1',
      ownerAuthUserId: 'auth-owner-1',
      ownerEmail: 'owner@example.test',
      targetEmail: 'target@example.test',
      status: 'accepted',
      targetAuthUserId: 'auth-target-1',
      targetUserId: 'target-1',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
      respondedAt: '2026-01-01T10:05:00.000Z',
    })

    renderHome()

    expect(
      await screen.findByText('owner@example.test veut fusionner son compte avec le votre')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }))

    await waitFor(() => {
      expect(mockedRespond).toHaveBeenCalledWith('share-1', 'accept')
    })
  })

  it('shows shared state and lets participants stop sharing', async () => {
    mockedGetStatus.mockResolvedValue(
      status({
        role: 'target',
        partnerEmail: 'owner@example.test',
        outgoingRequest: {
          id: 'share-1',
          ownerUserId: 'owner-1',
          ownerAuthUserId: 'auth-owner-1',
          ownerEmail: 'owner@example.test',
          targetEmail: 'target@example.test',
          status: 'accepted',
          targetAuthUserId: 'auth-target-1',
          targetUserId: 'target-1',
          createdAt: '2026-01-01T10:00:00.000Z',
          updatedAt: '2026-01-01T10:00:00.000Z',
          respondedAt: '2026-01-01T10:05:00.000Z',
        },
      })
    )
    mockedStop.mockResolvedValue({
      id: 'share-1',
      ownerUserId: 'owner-1',
      ownerAuthUserId: 'auth-owner-1',
      ownerEmail: 'owner@example.test',
      targetEmail: 'target@example.test',
      status: 'stopped',
      targetAuthUserId: 'auth-target-1',
      targetUserId: 'target-1',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:10:00.000Z',
      stoppedAt: '2026-01-01T10:10:00.000Z',
    })

    renderHome()

    const shareButton = await screen.findByRole('button', {
      name: 'Compte partage avec owner@example.test',
    })
    fireEvent.click(shareButton)
    fireEvent.click(screen.getByRole('button', { name: 'Arreter de partager' }))

    await waitFor(() => {
      expect(mockedStop).toHaveBeenCalledTimes(1)
    })
  })
})
