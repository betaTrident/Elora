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
  action: string
  entityId?: string
  createdAt: string | Date
  beforeJson?: unknown
  afterJson?: unknown
}

export interface DashboardData {
  counts: DashboardCounts
  worst5: RitualSummary[]
  recentActivity: ActivityLog[]
}

export type ComponentRole = 'cleanse' | 'treat' | 'seal' | 'scent'

export interface Component {
  id?: string
  shopifyProductId: string
  shopifyVariantId?: string | null
  productTitleCache?: string
  role: ComponentRole
  quantity: number
  unitCost?: string | number | null
  sortOrder?: number
}

export interface RitualListItem {
  id: string
  title: string
  lastScore: number | null
  scoreThreshold: number
  lastScoredAt?: string | Date | null
  status: string
  description?: string
}

export interface RitualDetail extends RitualListItem {
  components: Component[]
}

export interface BreakdownItem {
  label: string
  value: number
  max: number
  description: string
}

export interface ScoreBreakdown {
  availability: number
  availabilityMax: number
  completeness: number
  completenessMax: number
  margin: number
  marginMax: number
  total: number
  factors: Array<{ productId: string; available: boolean; reason: string }>
}

export interface RitualSaveResponse {
  id: string
  score: number
  breakdown: ScoreBreakdown
  threshold: number
}

export interface RitualRecalculateResponse {
  score: number
  breakdown: ScoreBreakdown
}

export interface Alert {
  id: string
  ritualId: string
  type: string
  severity: 'critical' | 'warning'
  message: string
  status: string
  createdAt: string | Date
}

export interface ShopSettings {
  defaultThreshold: number
}

export interface RecalculateAllResponse {
  recalculated: number
}
