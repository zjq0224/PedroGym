import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { api } from '../lib/api.js'
import { parsePlan, mergePlan } from '../lib/plan-share.js'
import { DAYN, exCount, routineCount, weekOrder, weekStartOf } from '../lib/format.js'
import { t, exerciseNameFor } from '../lib/i18n.js'
import { EXIDX } from '../lib/exercises.js'
import { exLine } from '../lib/history.js'
import { speedUnitOf } from '../lib/speed.js'
import { glyphOf } from '../lib/glyphs.js'
import { confirmSheet } from '../sheets.jsx'
import { SharedPlansGallery } from '../components/SharedPlans.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Switch, TextArea, TextField } from '../components/ui.jsx'

export default function SharedPlans() {
  const { id } = useParams()
  return id ? <SharedPlanDetail id={id} /> : <SharedPlanLibrary />
}

function SharedPlanLibrary() {
  const nav = useNavigate()
  return <div className="narrow shared-library">
    <div className="hdr">
      <button className="iconbtn" data-back="/home" onClick={() => nav('/home')} aria-label={t('Home')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 12 }}>
        <h1>{t('Shared plans')}</h1>
        <div className="sub">{t('Templates and plans shared by people on this server')}</div>
      </div>
    </div>
    <SharedPlansGallery />
  </div>
}

function SharedPlanDetail({ id }) {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const user = useStore(s => s.user)
  const toast = useUI(s => s.toast)
  const openSheet = useUI(s => s.openSheet)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    setPlan(null); setError('')
    api('/api/shared-plan?id=' + encodeURIComponent(id)).then(d => { if (alive) setPlan(d.plan) })
      .catch(e => { if (alive) setError(e.message || t('This shared plan is no longer available.')) })
    return () => { alive = false }
  }, [id, reload])

  if (error) return <div className="narrow shared-library">
    <BackHeader nav={nav} title={t('Shared plan')} />
    <div className="empty"><Icon name="warning" className="ico" /><div>{error}</div><Button style={{ marginTop: 12 }} onClick={() => nav('/plans')}>{t('Browse all')}</Button></div>
  </div>
  if (!plan) return <div className="narrow shared-library"><BackHeader nav={nav} title={t('Shared plan')} /><div className="empty">{t('Loading…')}</div></div>

  const bundle = plan.bundle || { routines: [], week: {}, customEx: [] }
  const ownPlan = plan.owner.id === user?.id
  const canEdit = ownPlan || user?.admin
  const custom = new Map((bundle.customEx || []).map(e => [e.id, e]))
  const exercise = id => EXIDX[id] || custom.get(id) || { id, n: id }
  const names = new Map((bundle.routines || []).map(r => [r.id, r.name]))
  const scheduled = weekOrder(weekStartOf(S)).map(day => ({
    day,
    names: [].concat(bundle.week?.[day] || []).map(rid => names.get(rid)).filter(Boolean),
  })).filter(row => row.names.length)

  const fork = () => {
    let parsed
    try { parsed = parsePlan(bundle, S.unit) } catch (e) { toast(e.message); return }
    const apply = schedule => {
      update(s => { mergePlan(s, parsed, { schedule }) })
      toast(t('Plan added. You can change its exercises, sets and weights now.'))
      nav('/plan')
    }
    if (!S.routines.length) { apply(true); return }
    confirmSheet({
      title: t('Add this plan?'),
      message: t('Your routines stay. This plan is added as new editable routines without changing your schedule.'),
      confirmText: t('Add plan'),
      onConfirm: () => apply(false),
    })
  }

  const edit = () => openSheet(close => <PlanDetailsSheet plan={plan} close={close} onSaved={() => setReload(n => n + 1)} />)
  const remove = () => confirmSheet({
    title: t('Stop sharing this plan?'),
    message: t('This removes the shared snapshot only. Your own plan is unchanged.'),
    confirmText: t('Stop sharing'), danger: true,
    onConfirm: () => api('/api/shared-plans/delete', { method: 'POST', body: JSON.stringify({ id: plan.id }) })
      .then(() => { toast(t('Sharing stopped')); window.dispatchEvent(new Event('shared-plans-changed')); nav('/plans') })
      .catch(e => toast(e.message)),
  })

  return <div className="narrow shared-detail">
    <BackHeader nav={nav} title={t('Shared plan')} />
    <div className="card shared-detail-hero">
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          {plan.template && <div className="tag acc shared-template-tag"><Icon name="crown" />{t('Template')}</div>}
          <h2 className="shared-detail-title">{plan.title}</h2>
          <div className="small muted">{t('Shared by {0}', plan.owner.name)}</div>
        </div>
        {canEdit && <button className="iconbtn" onClick={edit} aria-label={t('Edit details')}><Icon name="pencil" /></button>}
      </div>
      {plan.summary && <div className="shared-detail-summary">{plan.summary}</div>}
      <div className="shared-detail-stats">
        <span>{routineCount(plan.routineCount)}</span><span>{exCount(plan.exerciseCount)}</span>
        {!!plan.scheduledDays && <span>{t('{0} scheduled days', plan.scheduledDays)}</span>}
      </div>
      <Button variant="primary" icon="copy" onClick={fork}>{t('Fork to my plan')}</Button>
    </div>

    {!!scheduled.length && <section className="sect shared-schedule">
      <h4 className="sec">{t('Week schedule')}</h4>
      <div className="sect-b">
        {scheduled.map(row => <div className="shared-schedule-row" key={row.day}>
          <span>{t(DAYN[row.day])}</span><b>{row.names.join(' + ')}</b>
        </div>)}
      </div>
    </section>}

    <h4 className="sec">{t('Routines')}</h4>
    <div className="shared-routines">
      {(bundle.routines || []).map(routine => <section className="card shared-routine" key={routine.id}>
        <div className="row" style={{ gap: 9 }}>
          <span className="lrow-i"><Icon name={glyphOf(routine.emoji)} /></span>
          <div><div className="ttl">{routine.name}</div><div className="small dim">{exCount(routine.ex?.length || 0)}</div></div>
        </div>
        <div className="shared-exercises">
          {(routine.ex || []).map((entry, index) => {
            const ex = exercise(entry.id)
            return <div className="shared-exercise" key={index + '-' + entry.id}>
              <span className="shared-ex-num">{index + 1}</span>
              <div className="grow"><div>{exerciseNameFor(ex)}</div>{entry.note && <div className="small dim">{entry.note}</div>}</div>
              <span className="small muted">{exLine(entry, bundle.unit || S.unit, speedUnitOf(S))}</span>
            </div>
          })}
        </div>
      </section>)}
    </div>

    {canEdit && <Button className="shared-stop" variant="ghost" icon="trash" onClick={remove}>{t('Stop sharing')}</Button>}
  </div>
}

function BackHeader({ nav, title }) {
  return <div className="hdr">
    <button className="iconbtn" data-back="/plans" onClick={() => nav('/plans')} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
    <div style={{ flex: 1, marginInlineStart: 12 }}><h1>{title}</h1></div>
  </div>
}

function PlanDetailsSheet({ plan, close, onSaved }) {
  const user = useStore(s => s.user)
  const toast = useUI(s => s.toast)
  const [title, setTitle] = useState(plan.title)
  const [summary, setSummary] = useState(plan.summary || '')
  const [template, setTemplate] = useState(!!plan.template)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!title.trim() || busy) return
    setBusy(true)
    try {
      await api('/api/shared-plans/update', { method: 'POST', body: JSON.stringify({
        id: plan.id, title: title.trim(), summary: summary.trim(), ...(user?.admin ? { template } : {}),
      }) })
      toast(t('Plan details updated'))
      window.dispatchEvent(new Event('shared-plans-changed'))
      onSaved()
      close()
    } catch (e) { toast(e.message); setBusy(false) }
  }
  return <>
    <h3>{t('Edit plan details')}</h3>
    <label className="field-label">{t('Plan name')}</label>
    <TextField value={title} maxLength={60} autoFocus onChange={e => setTitle(e.target.value)} />
    <label className="field-label">{t('Description (optional)')}</label>
    <TextArea rows={4} value={summary} maxLength={1000} onChange={e => setSummary(e.target.value)} />
    {user?.admin && <div className="row between shared-template-switch">
      <div><div>{t('Show as template')}</div><div className="small dim">{t('Templates are highlighted for everyone on this server.')}</div></div>
      <Switch checked={template} onChange={setTemplate} aria-label={t('Show as template')} />
    </div>}
    <Button variant="primary" disabled={!title.trim() || busy} onClick={save}>{busy ? t('Loading…') : t('Save')}</Button>
  </>
}
