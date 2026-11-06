// A starter plan may ship its own stills without replacing the catalogue's licensed media.
// The marker lives on an exercise occurrence, not the catalogue entry: the same bench press in
// another routine keeps the ordinary openGym animation. Keep this allow-list explicit because a
// shared plan file is untrusted input and must never turn an arbitrary string into an asset URL.
const PACKS = {
  tanchengyi: new Set([
    '0025', '0314', '0251', '0061', '5818',
    '1204', '7583', '1235', '0218', '1636',
    '1757', '2290', '0042', '0085', '0489',
    '3329', '0472', '0175',
  ]),
}

export const cleanTemplateMediaPack = (pack, exerciseId) =>
  typeof pack === 'string' && PACKS[pack]?.has(String(exerciseId)) ? pack : ''

export const templateMediaSrc = (ex, pack) => {
  const clean = cleanTemplateMediaPack(pack, ex?.id)
  return clean ? `template-media/${clean}/${ex.id}.png` : null
}

export const templateMediaIds = pack => [...(PACKS[pack] || [])]
