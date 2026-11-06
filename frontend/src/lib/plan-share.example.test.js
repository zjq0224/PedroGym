import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parsePlan } from './plan-share.js'

const example = new URL('../../../docs/examples/tanchengyi-three-split.zh-CN.json', import.meta.url)

describe('documented plan examples', () => {
  it('imports the Tanchengyi three-split and abs day without dropping an exercise', () => {
    const plan = parsePlan(readFileSync(example, 'utf8'))

    expect(plan.name).toBe('凯圣王 × 谭成义 2026 三分化＋腹部')
    expect(plan.routineCount).toBe(4)
    expect(plan.exerciseCount).toBe(18)
    expect(plan.dropped).toBe(0)
    expect(plan.week).toEqual({})
    expect(plan.customEx).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'ctcy-reverse-roman-chair-crunch', n: '反向山羊挺身卷腹' })
    ]))
  })
})
