// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
import { api } from '../lib/api.js'
import { setLang } from '../lib/i18n.js'
import { SharedPlansGallery, groupSharedPlans } from './SharedPlans.jsx'

const nav = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => nav }))
vi.mock('../lib/api.js', () => ({ api: vi.fn() }))

const plans = [
  { id: 't1', title: 'Starter strength', summary: 'Admin notes', owner: { id: 'admin', name: 'Ada' }, template: true, routineCount: 3, exerciseCount: 12 },
  { id: 'a1', title: 'Alice one', summary: '', owner: { id: 'alice', name: 'Alice' }, template: false, routineCount: 2, exerciseCount: 8 },
  { id: 'a2', title: 'Alice two', summary: '', owner: { id: 'alice', name: 'Alice' }, template: false, routineCount: 4, exerciseCount: 16 },
  { id: 'b1', title: 'Bob plan', summary: '', owner: { id: 'bob', name: 'Bob' }, template: false, routineCount: 1, exerciseCount: 4 },
]

let host, root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  setLang('en')
  nav.mockClear(); api.mockReset()
  useStore.setState({ user: { id: 'me', name: 'Me' } })
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })

describe('shared plan gallery', () => {
  it('puts templates first, then one vertical group per owner with their plans in one rail', () => {
    const groups = groupSharedPlans(plans)
    expect(groups.map(g => [g.label, g.plans.map(p => p.id)])).toEqual([
      ['Template plans', ['t1']],
      ['Alice', ['a1', 'a2']],
      ['Bob', ['b1']],
    ])
  })

  it('renders each owner as a horizontal rail and opens a selected plan', async () => {
    api.mockResolvedValue({ plans })
    await act(async () => { root.render(<SharedPlansGallery compact />); await Promise.resolve() })
    expect(api).toHaveBeenCalledWith('/api/shared-plans')
    const groups = [...host.querySelectorAll('.shared-owner')]
    expect(groups).toHaveLength(3)
    expect(groups[1].querySelector('.shared-owner-head').textContent).toContain('Alice')
    expect(groups[1].querySelectorAll('.shared-plan-card')).toHaveLength(2)
    expect(groups[2].querySelectorAll('.shared-plan-card')).toHaveLength(1)
    act(() => groups[1].querySelectorAll('.shared-plan-card')[1].click())
    expect(nav).toHaveBeenCalledWith('/plans/a2')
  })

  it('shows a stable empty state when nobody opted in', async () => {
    api.mockResolvedValue({ plans: [] })
    await act(async () => { root.render(<SharedPlansGallery compact />); await Promise.resolve() })
    expect(host.textContent).toContain('Nobody has shared a plan yet.')
  })
})
