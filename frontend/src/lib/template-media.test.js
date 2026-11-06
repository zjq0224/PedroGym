import { describe, expect, it } from 'vitest'
import { cleanTemplateMediaPack, templateMediaIds, templateMediaSrc } from './template-media.js'

describe('starter-plan template media', () => {
  it('builds a relative URL only for an allow-listed pack and exercise', () => {
    expect(templateMediaSrc({ id: '0025' }, 'tanchengyi')).toBe('template-media/tanchengyi/0025.png')
    expect(templateMediaSrc({ id: '0001' }, 'tanchengyi')).toBeNull()
    expect(templateMediaSrc({ id: '0025' }, '../../private')).toBeNull()
    expect(cleanTemplateMediaPack('tanchengyi', '0025')).toBe('tanchengyi')
  })

  it('covers every exercise occurrence in the branded plan', () => {
    expect(templateMediaIds('tanchengyi')).toHaveLength(18)
    expect(new Set(templateMediaIds('tanchengyi')).size).toBe(18)
  })
})
