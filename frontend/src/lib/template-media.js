// Original still packs live apart from the catalogue's licensed media. A plan may explicitly
// request an allow-listed pack, while GLOBAL_PACK_BY_ID makes a curated pack the default anywhere
// that exercise appears (library, picker, plan and workout). Keep both maps explicit because a
// shared plan file is untrusted input and must never turn an arbitrary string into an asset URL.
const PACKS = {
  tanchengyi: new Set([
    '0025', '0314', '0251', '0061', '5818',
    '1204', '7583', '1235', '0218', '1636',
    '1757', '2290', '0042', '0085', '0489',
    '3329', '0472', '0175',
  ]),
}

const GLOBAL_PACK_BY_ID = new Map(
  [...PACKS.tanchengyi].map(id => [id, 'tanchengyi']),
)

export const cleanTemplateMediaPack = (pack, exerciseId) =>
  typeof pack === 'string' && PACKS[pack]?.has(String(exerciseId)) ? pack : ''

export const globalTemplateMediaPack = exerciseId =>
  GLOBAL_PACK_BY_ID.get(String(exerciseId)) || ''

export const templateMediaSrc = (ex, pack) => {
  const id = String(ex?.id || '')
  const clean = cleanTemplateMediaPack(pack, id) || globalTemplateMediaPack(id)
  return clean ? `template-media/${clean}/${id}.webp` : null
}

export const templateMediaIds = pack => [...(PACKS[pack] || [])]
