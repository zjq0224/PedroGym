import { describe, expect, it } from 'vitest'
import { EXIDX, searchExercises } from './exercises.js'

const TAN_IDS = new Set([
  '0025', '0314', '0251', '0061', '5818', '1204', '7583', '1235', '0218',
  '1636', '1757', '2290', '0042', '0085', '0489', '3329', '0472', '0175',
])

describe('Tan Chengyi exercise collection search', () => {
  it.each(['谭', '谭成义', '谭成义动作', 'Tan Chengyi', 'tanchengyi'])('finds all 18 exercises with %s', query => {
    const found = searchExercises(Object.values(EXIDX), query)
    expect(new Set(found.map(ex => ex.id))).toEqual(TAN_IDS)
  })
})
