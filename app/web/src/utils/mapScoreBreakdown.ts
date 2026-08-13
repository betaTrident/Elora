import type { BreakdownItem, ScoreBreakdown } from '../types'

export function mapScoreBreakdownToItems(breakdown: ScoreBreakdown): BreakdownItem[] {
  return [
    {
      label: 'Availability',
      value: breakdown.availability,
      max: breakdown.availabilityMax,
      description: 'In-stock and active products across routine components',
    },
    {
      label: 'Completeness',
      value: breakdown.completeness,
      max: breakdown.completenessMax,
      description: 'Required roles present (cleanse, treat, seal)',
    },
    {
      label: 'Margin',
      value: breakdown.margin,
      max: breakdown.marginMax,
      description: 'Margin proxy from unit costs vs product price',
    },
  ]
}
