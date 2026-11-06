import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { cleanTemplateMediaPack, globalTemplateMediaPack, templateMediaIds, templateMediaSrc } from './template-media.js'

const mediaDir = new URL('../../public/template-media/tanchengyi/', import.meta.url)

describe('curated exercise media', () => {
  it('uses the Tan Chengyi pack globally for its allow-listed exercises', () => {
    expect(globalTemplateMediaPack('0025')).toBe('tanchengyi')
    expect(templateMediaSrc({ id: '0025' })).toBe('template-media/tanchengyi/0025.webp')
    expect(templateMediaSrc({ id: '3329' })).toBe('template-media/tanchengyi/3329.webp')
    expect(templateMediaSrc({ id: '0001' })).toBeNull()
  })

  it('accepts only an allow-listed pack and exercise from shared plan data', () => {
    expect(templateMediaSrc({ id: '0025' }, 'tanchengyi')).toBe('template-media/tanchengyi/0025.webp')
    expect(templateMediaSrc({ id: '3329' }, 'tanchengyi')).toBe('template-media/tanchengyi/3329.webp')
    expect(templateMediaSrc({ id: '0001' }, 'tanchengyi')).toBeNull()
    expect(cleanTemplateMediaPack('tanchengyi', '0025')).toBe('tanchengyi')
    expect(cleanTemplateMediaPack('../../private', '0025')).toBe('')
  })

  it('covers every exercise occurrence in the branded plan', () => {
    expect(templateMediaIds('tanchengyi')).toHaveLength(18)
    expect(new Set(templateMediaIds('tanchengyi')).size).toBe(18)
    for (const id of templateMediaIds('tanchengyi')) {
      expect(existsSync(fileURLToPath(new URL(`${id}.webp`, mediaDir))), `${id}.webp`).toBe(true)
    }
  })
})
