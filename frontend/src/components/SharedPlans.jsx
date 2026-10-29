import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { api } from '../lib/api.js'
import { buildPlanBundle } from '../lib/plan-share.js'
import { exCount, routineCount } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'
import { Button, TextArea, TextField } from './ui.jsx'

// Templates get their own first rail. Every remaining rail belongs to exactly one user: vertical
// scrolling changes people, horizontal scrolling changes the snapshots that person published.
export function groupSharedPlans(plans) {
  const safe = Array.isArray(plans) ? plans.filter(p => p && p.owner) : []
  const groups = []
  const templates = safe.filter(p => p.template)
  if (templates.length) groups.push({ key: 'templates', label: t('Template plans'), plans: templates, template: true })
  const byOwner = new Map()
  safe.filter(p => !p.template).forEach(p => {
    if (!byOwner.has(p.owner.id)) byOwner.set(p.owner.id, { key: p.owner.id, label: p.owner.name, plans: [] })
    byOwner.get(p.owner.id).plans.push(p)
  })
  return groups.concat([...byOwner.values()])
}

export function SharedPlansGallery({ compact = false }) {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!user) { setPlans([]); setError(''); return }
    let alive = true
    setError('')
    api('/api/shared-plans').then(d => {
      if (!alive) return
      setPlans(Array.isArray(d?.plans) ? d.plans : [])
    }).catch(e => { if (alive) { setPlans([]); setError(e.message || t('Couldn’t load shared plans.')) } })
    return () => { alive = false }
  }, [user?.id, reload])

  useEffect(() => {
    const changed = () => setReload(n => n + 1)
    window.addEventListener('shared-plans-changed', changed)
    return () => window.removeEventListener('shared-plans-changed', changed)
  }, [])

  if (!user) return null
  const groups = groupSharedPlans(plans)
  const body = plans == null
    ? <div className="muted small">{t('Loading…')}</div>
    : error
      ? <div className="shared-empty"><span>{error}</span><Button size="sm" icon="reset" onClick={() => setReload(n => n + 1)}>{t('Try again')}</Button></div>
      : groups.length
        ? groups.map(group => <PlanGroup key={group.key} group={group} open={id => nav('/plans/' + id)} />)
        : <div className="shared-empty"><Icon name="globe" /><span>{t('Nobody has shared a plan yet.')}</span></div>

  if (!compact) return <div className="shared-groups">{body}</div>
  return <div className="card shared-gallery">
    <div className="row between shared-gallery-head">
      <div>
        <h2>{t('Plans from this gym')}</h2>
        <div className="small muted">{t('Plans people on this server chose to share.')}</div>
      </div>
      {!!plans?.length && <Button size="sm" variant="ghost" trailingIcon="chevronRight" onClick={() => nav('/plans')}>{t('Browse all')}</Button>}
    </div>
    <div className="shared-groups">{body}</div>
  </div>
}

function PlanGroup({ group, open }) {
  return <section className="shared-owner">
    <div className="shared-owner-head">
      <span className="shared-avatar"><Icon name={group.template ? 'crown' : 'person'} /></span>
      <span>{group.label}</span>
      <span className="small dim">{group.plans.length}</span>
    </div>
    <div className="shared-rail">
      {group.plans.map(plan => <button key={plan.id} className="shared-plan-card" onClick={() => open(plan.id)}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="shared-plan-title">{plan.title}</div>
          {plan.template && <span className="tag acc"><Icon name="crown" />{t('Template')}</span>}
        </div>
        {plan.summary && <div className="shared-plan-summary">{plan.summary}</div>}
        <div className="shared-plan-meta">{routineCount(plan.routineCount)} · {exCount(plan.exerciseCount)}</div>
        {group.template && <div className="shared-plan-owner">{t('Shared by {0}', plan.owner.name)}</div>}
      </button>)}
    </div>
  </section>
}

export function openSharePlanSheet() {
  useUI.getState().openSheet(close => <SharePlanSheet close={close} />)
}

function SharePlanSheet({ close }) {
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const toast = useUI(s => s.toast)
  const initial = S.routines.length === 1 ? S.routines[0].name : t('My training plan')
  const [title, setTitle] = useState(initial)
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)

  const share = async () => {
    const name = title.trim()
    if (!name || busy || !user) return
    setBusy(true)
    try {
      const bundle = buildPlanBundle(S, name)
      await api('/api/shared-plans/publish', { method: 'POST', body: JSON.stringify({ title: name, summary: summary.trim(), bundle }) })
      toast(t('Plan shared'))
      window.dispatchEvent(new Event('shared-plans-changed'))
      close()
    } catch (e) {
      toast(e.message)
      setBusy(false)
    }
  }

  return <>
    <h3>{t('Share with this server')}</h3>
    <div className="muted small shared-sheet-copy">{t('People on this server can see and fork this snapshot. Workouts and body weight are never included.')}</div>
    <label className="field-label">{t('Plan name')}</label>
    <TextField value={title} maxLength={60} autoFocus onChange={e => setTitle(e.target.value)} />
    <label className="field-label">{t('Description (optional)')}</label>
    <TextArea rows={4} value={summary} maxLength={1000} onChange={e => setSummary(e.target.value)} />
    <Button variant="primary" icon="share" disabled={!title.trim() || busy} onClick={share}>{busy ? t('Loading…') : t('Share plan')}</Button>
  </>
}
