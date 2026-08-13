import { Badge } from '@shopify/polaris'
import { getScoreStatus } from '../utils/scoreStatus'

export type { ScoreStatus } from '../utils/scoreStatus'
export { getScoreStatus }

interface ScoreBadgeProps {
  score: number | null
  threshold: number
}

const STATUS_CONFIG = {
  'not-scored': { tone: undefined, label: 'Not scored' },
  healthy: { tone: 'success' as const, label: null },
  'at-risk': { tone: 'attention' as const, label: null },
  broken: { tone: 'critical' as const, label: null },
} as const

export function ScoreBadge({ score, threshold }: ScoreBadgeProps) {
  const status = getScoreStatus(score, threshold)
  const config = STATUS_CONFIG[status]
  const displayText =
    config.label !== null ? config.label : `${status === 'healthy' ? 'Healthy' : status === 'at-risk' ? 'At risk' : 'Broken'} \u00B7 ${score}`

  return <Badge tone={config.tone}>{displayText}</Badge>
}
