import { isCustomEx } from '../lib/exercises.js'
import { mediaOf, cleanUrl } from '../lib/media-refs.js'
import { t } from '../lib/i18n.js'
import { Thumb } from './Media.jsx'
import Icon from './Icon.jsx'
import { templateMediaSrc } from '../lib/template-media.js'

// Whether an exercise has anything for the workout's media slot to show: the dataset's animation
// for a built-in, its own photo, video or link for a custom one (CustomMedia.jsx).
export const hasWorkoutMedia = (ex, mediaPack) => !!ex && (isCustomEx(ex)
  ? !!(mediaOf(ex) || cleanUrl(ex.url))
  : !!(templateMediaSrc(ex, mediaPack) || ex.gif))

// The small picture next to the exercise name when animations are set to Small (v1.3.11): the
// sets get the screen, and a tap brings the full animation back (the same gifSize switch as the
// animation's own Minimize, so it sticks like that one does).
export default function WorkoutThumb({ ex, mediaPack, onExpand }) {
  return <button type="button" className="wthumb" aria-label={t('Expand')} title={t('Expand')} onClick={onExpand}>
    <Thumb ex={ex} mediaPack={mediaPack} />
    <span className="wthumb-x" aria-hidden="true"><Icon name="expand" /></span>
  </button>
}
