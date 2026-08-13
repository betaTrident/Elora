export type ScoreStatus = 'not-scored' | 'healthy' | 'at-risk' | 'broken'

export function getScoreStatus(
  score: number | null,
  threshold: number,
): ScoreStatus {
  if (score === null) return 'not-scored'
  if (score >= threshold && score >= 80) return 'healthy'
  if (score >= threshold) return 'at-risk'
  return 'broken'
}
