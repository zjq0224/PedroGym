// The starter-plan catalog. Training data only: the chooser's plan names and descriptions are
// written as string literals inside t() calls in sheets.jsx, because check-source-strings.mjs
// only finds them there — copy parked in here would silently ship English in every language.
//
// A routine is [key, name, emoji, [[exerciseId, sets, reps], …]]. The key is what a plan's
// schedule points at, so a weekday never depends on the position of a routine in the array.
// Names stay canonical English — they become ordinary user routines, which are not translated.
import { uid } from './format.js'
import { EXIDX } from './exercises.js'
import { eqAvailable, ALL_EQUIPMENT } from './equipment.js'

const PPL = [
  ['push', 'Push Day', 'barbell', [['0025', 4, 8], ['0047', 3, 10], ['0426', 3, 10], ['0334', 3, 12], ['0241', 3, 12], ['0251', 3, 10]]],
  ['pull', 'Pull Day', 'pullup', [['2330', 4, 10], ['0027', 4, 8], ['1323', 3, 10], ['0031', 3, 10], ['0313', 3, 12]]],
  ['legs', 'Leg Day', 'legs', [['0043', 4, 8], ['0085', 3, 10], ['0739', 3, 12], ['0585', 3, 12], ['0586', 3, 12], ['0605', 4, 15]]]
]

const UPPER_LOWER = [
  ['upper-a', 'Upper A', 'barbell', [['0025', 3, 8], ['2330', 3, 10], ['0047', 2, 10], ['1323', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0031', 2, 12]]],
  ['lower-a', 'Lower A', 'legs', [['0043', 3, 8], ['0085', 3, 8], ['0739', 2, 10], ['0586', 2, 12], ['0605', 3, 15]]],
  ['upper-b', 'Upper B', 'barbell', [['0047', 3, 8], ['0027', 3, 8], ['0426', 2, 10], ['2330', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0313', 2, 12]]],
  ['lower-b', 'Lower B', 'legs', [['0739', 3, 10], ['0085', 2, 10], ['0585', 2, 12], ['0586', 3, 12], ['0605', 3, 15]]]
]

const FULL_BODY = [
  ['fb-a', 'Full Body A', 'figureStrength', [['0043', 3, 8], ['0025', 3, 8], ['2330', 3, 10], ['0586', 3, 12], ['0334', 2, 12], ['0031', 2, 12]]],
  ['fb-b', 'Full Body B', 'figureStrength', [['0085', 3, 8], ['0047', 3, 10], ['1323', 3, 10], ['0585', 3, 12], ['0334', 2, 12], ['0241', 2, 12]]],
  ['fb-c', 'Full Body C', 'figureStrength', [['0739', 3, 10], ['0025', 2, 10], ['0027', 3, 10], ['0426', 2, 10], ['0586', 3, 12], ['0605', 3, 15]]]
]

const FIVE_BY_FIVE = [
  ['5x5-a', '5×5 A', 'barbell', [['0043', 5, 5], ['0025', 5, 5], ['0027', 5, 5]]],
  ['5x5-b', '5×5 B', 'barbell', [['0085', 5, 5], ['0426', 5, 5], ['2330', 5, 5]]],
  ['5x5-c', '5×5 C', 'barbell', [['0739', 5, 5], ['0047', 5, 5], ['1323', 5, 5]]]
]

// 凯圣王 × 谭成义 2026 三分化，以及谭成义公开的腹部训练。Unlike the generic starter
// plans, every occurrence carries `mediaPack`: the catalogue exercise and its history stay the
// same, while the routine/workout views may show the separate coach-likeness pack.
const TANCHENGYI = [
  ['tcy-push', '谭成义 · 推日', 'barbell', [
    ['0025', 4, 15, { pyramid: [15, 12, 10, 8], warmupSets: 3, note: 'RPE 8，保留约 2 次余力；按周期逐步压低次数并提高重量。' }],
    ['0314', 4, 12, { dbLoad: 'each', prog: 'off', note: '上斜凳约 30°，先保持肩胛稳定，再逐步提高末组强度。' }],
    ['0251', 4, 12, { prog: 'off', lastToFailure: true, note: '身体略前倾，动作变形前停止；不足 12 次时记录实际次数。' }],
    ['0061', 4, 15, { prog: 'off', note: '保持肩屈位与肘部稳定，重点训练肱三头肌长头。' }],
    ['5818', 3, 20, { prog: 'off', lastToFailure: true, note: '沿肩胛面举成 Y 字；10 次后短休约 5 秒，再做 10 次或至技术力竭。' }],
  ]],
  ['tcy-pull', '谭成义 · 拉日', 'pullup', [
    ['1204', 4, 24, { side: true, prog: 'off', lastToFailure: true, note: '每侧 12 次，保持躯干稳定，末组可在技术稳定时短休追加。' }],
    ['7583', 4, 10, { repsMin: 8, prog: 'double', inc: 2.5, note: 'RPE 8；完成 4×12 后增加重量并回到 8 次。' }],
    ['1235', 4, 20, { side: true, prog: 'off', lastToFailure: true, note: '每侧 10 次，胸部保持支撑，避免躯干旋转。' }],
    ['0218', 4, 12, { prog: 'off', note: '开肘拉向下胸，主动完成肩胛后缩。' }],
    ['1636', 3, 12, { prog: 'off', note: '保持上臂抬高和固定，专注肱二头肌收缩。' }],
  ]],
  ['tcy-legs', '谭成义 · 腿日', 'legs', [
    ['1757', 4, 20, { side: true, dbLoad: 'each', prog: 'off', note: '每侧 10 次，先建立单腿稳定与髋铰链控制。' }],
    ['2290', 4, 20, { side: true, dbLoad: 'each', prog: 'off', note: '每侧 10 次，后脚只作支撑，前腿主动发力。' }],
    ['0042', 4, 10, { prog: 'linear', inc: 2.5, warmupSets: 3, note: 'RPE 8，不力竭；保持躯干直立和核心稳定。' }],
    ['0085', 4, 10, { prog: 'linear', inc: 2.5, warmupSets: 3, note: 'RPE 8；杠铃贴身，以髋铰链完成动作。' }],
    ['0489', 4, 15, { prog: 'off', note: '全程控制，不借惯性甩动；身体回到直线即可。' }],
  ]],
  ['tcy-abs', '谭成义 · 腹部训练', 'figureStrength', [
    ['3329', 4, 12, { prog: 'off', note: '骨盆和下背贴稳斜垫，先后仰拉长腹肌，再让胸廓向骨盆卷起。' }],
    ['0472', 4, 12, { prog: 'off', note: '避免摆动，抬腿末端继续轻微卷起骨盆。' }],
    ['0175', 4, 12, { prog: 'off', note: '髋部保持稳定，让胸廓向骨盆卷曲，不要只做髋部后坐。' }],
  ]],
]

// [weekday, routineKey] — weekday is a DAYN index, so 1 is Monday. Fixed weeks only: every
// plan repeats the same seven days, which is all the weekly plan model can represent.
const PLANS = {
  ppl: { routines: PPL, schedule: [[1, 'push'], [3, 'pull'], [5, 'legs']] },
  'upper-lower': { routines: UPPER_LOWER, schedule: [[1, 'upper-a'], [2, 'lower-a'], [4, 'upper-b'], [5, 'lower-b']] },
  'full-body': { routines: FULL_BODY, schedule: [[1, 'fb-a'], [3, 'fb-b'], [5, 'fb-c']] },
  '5x5': { routines: FIVE_BY_FIVE, schedule: [[1, '5x5-a'], [3, '5x5-b'], [5, '5x5-c']] },
  tanchengyi: {
    routines: TANCHENGYI,
    schedule: [[1, 'tcy-push'], [2, 'tcy-pull'], [3, 'tcy-legs'], [5, 'tcy-abs']],
    mediaPack: 'tanchengyi',
  },
}

const build = (routines, mediaPack) =>
  routines.map(([, name, emoji, list]) => ({
    id: uid(), name, emoji,
    ex: list.map(([id, sets, reps, config]) => ({ id, sets, reps, weight: 0, ...(config || {}), ...(mediaPack ? { mediaPack } : {}) })),
  }))

// Fresh routine objects (new ids) — [push, pull, legs]. The demo build seeds a history on
// top of exactly these three, so this entry point keeps its shape.
export const starterRoutines = () => build(PPL)

// [{ id, days }] for the chooser. The day count is read off the schedule rather than stored
// beside it, so the two can never disagree.
export const starterPlanOptions = () =>
  Object.entries(PLANS).map(([id, { schedule }]) => ({ id, days: schedule.length }))

// The weekdays a plan would claim, or null for an unknown id.
export const starterPlanDays = id => PLANS[id]?.schedule.map(([day]) => day) ?? null

// Words that name the equipment, not the movement ("barbell", "lever", "machine"…), so that
// "barbell bench press" and "dumbbell bench press" read as the same lift.
const EQ_WORDS = new Set(ALL_EQUIPMENT.flatMap(e => e.split(/[^a-z0-9]+/)).concat(['lever', 'leverage', 'machine', 'sled']))
const words = ex => new Set(ex.n.toLowerCase().split(/[^a-z0-9]+/).filter(w => w && !EQ_WORDS.has(w)))
const jaccard = (a, b) => {
  const inter = [...a].filter(x => b.has(x)).length
  return inter ? inter / (a.size + b.size - inter) : 0
}

// Names that are not working sets: stretches, holds, mobility and warm-up drills. Never a
// stand-in for a lift, whatever body part and muscle they share with it.
const NOT_A_LIFT = /stretch|isometric|squeeze|yoga|\bpose\b|toe touch|\broll(er)?\b|mobility|circles|warm-?up|boxing|against wall/i
// "… on exercise ball" is tagged with its weight (dumbbell), but needs a ball nobody ticked.
const NEEDS_BALL = /exercise ball|stability ball|swiss ball|bosu/i

// The best stand-in for `ex` among exercises the equipment list allows. Same body part, and it
// has to share the target muscle, the main muscle or a helper muscle with `ex`. Closest wins:
// same target muscle, then the movement by name, then helper muscles. When `ex` is a loaded
// lift, one that is loaded too beats a body-weight drill — a push-up is not a bench press.
// `taken` keeps a routine from ending up with the same exercise twice. null when nothing fits.
export const substituteFor = (ex, equipment, taken) => {
  const hasBall = equipment.includes('stability ball') || equipment.includes('bosu ball')
  const exWords = words(ex), exSm = new Set([ex.mg, ...(ex.sm || [])])
  const loaded = ex.eq !== 'body weight'
  let best = null, bestScore = -Infinity
  for (const c of Object.values(EXIDX)) {
    if (c.bp !== ex.bp || taken.has(c.id) || !eqAvailable(equipment, c)) continue
    if (NOT_A_LIFT.test(c.n) || (!hasBall && NEEDS_BALL.test(c.n))) continue
    const sm = jaccard(exSm, new Set([c.mg, ...(c.sm || [])]))
    if (c.tg !== ex.tg && c.mg !== ex.mg && !sm) continue
    const score = 2 * (c.tg === ex.tg) + (c.mg === ex.mg) + 3 * jaccard(exWords, words(c)) + 2 * sm
      - (loaded && c.eq === 'body weight' ? 3 : 0)
    // id as the last key: the same equipment always gives the same plan
    if (score > bestScore || (score === bestScore && c.id < best.id)) { best = c; bestScore = score }
  }
  return best
}

// Re-cuts a routine list for an equipment list: what you can already do stays, what you can't
// is swapped for its closest match, and what has no match is dropped (with its routine, when
// that leaves it empty). Sets and reps carry over unchanged.
const fitRoutines = (routines, equipment) => {
  let swapped = 0, dropped = 0
  const fitted = routines.map(([key, name, emoji, list]) => {
    const taken = new Set(list.map(([id]) => id))
    const out = []
    for (const [id, sets, reps, config] of list) {
      const ex = EXIDX[id]
      if (!ex || eqAvailable(equipment, ex)) { out.push([id, sets, reps, config]); continue }
      const sub = substituteFor(ex, equipment, taken)
      if (!sub) { dropped++; continue }
      taken.add(sub.id)
      swapped++
      out.push([sub.id, sets, reps, config])
    }
    return [key, name, emoji, out]
  }).filter(([, , , list]) => list.length)
  return { routines: fitted, swapped, dropped }
}

// Fresh routines plus the weekdays to put them on, or null for an unknown id — a caller that
// treats null as "change nothing" can never half-apply a plan. With an equipment list the
// plan is fitted to it first, and `fit` reports how many exercises that swapped or dropped.
export const buildStarterPlan = (id, equipment) => {
  const plan = PLANS[id]
  if (!plan) return null
  const fit = equipment ? fitRoutines(plan.routines, equipment) : null
  const source = fit ? fit.routines : plan.routines
  const routines = build(source, plan.mediaPack)
  // key → the id just minted for it, so the schedule below names its routine
  const byKey = Object.fromEntries(source.map(([key], i) => [key, routines[i].id]))
  return {
    routines,
    schedule: plan.schedule.filter(([, key]) => byKey[key]).map(([day, key]) => ({ day, routineId: byKey[key] })),
    ...(fit && { fit: { swapped: fit.swapped, dropped: fit.dropped } })
  }
}
