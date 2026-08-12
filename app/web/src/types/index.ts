export interface DashboardCounts {
  total: number
  healthy: number
  broken: number
  unscored: number
  openAlerts: number
}

export interface RitualSummary {
  id: string
  title: string
  lastScore: number | null
  scoreThreshold: number
  lastScoredAt?: string | Date | null
  status?: string
}

export interface ActivityLog {
  id: string
  summary: string
  entityType: string
  actorType: string
  createdAt: string | Date
  afterJson?: unknown
}

export interface DashboardData {
  counts: DashboardCounts
  worst5: RitualSummary[]
  recentActivity: ActivityLog[]
}
