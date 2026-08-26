import type { RiskTypes } from './constants'

export type RiskType = (typeof RiskTypes)[keyof typeof RiskTypes]

export type ThreatReportsQuery = {
  limit?: number
  offset?: number
  from?: string
  to?: string
  email?: string
  ip?: string
  risk?: RiskType[]
}

export type ThreatReportType = {
  emailAddresses: string[]
  ipAddresses: string[]
  risk: RiskType
  detail: string
  recommendedAction: string
  recommendedActionHelpDetail: string | null
  fromDatetime: string
  toDatetime: string
}

export type ThreatReportListResponse = {
  limit: number
  total: number
  offset: number
  tenantId: string
  reports: ThreatReportType[]
}

export type ThreatReportsSummaryResponse = {
  summary: {
    high: number
    medium: number
    low: number
    informational: number
  }
  tenantId: string
}

export type AuthenticationStatusResponse = {
  date: string
  success: number
  failed: number
}

export type AuthenticationStatusListResponse = {
  statuses: AuthenticationStatusResponse[]
  tenantId: string
}

export type ThreatTrendType = {
  month: string
  high: number
  medium: number
  low: number
  informational: number
}

export type ThreatTrendListResponse = {
  trends: ThreatTrendType[]
  tenantId: string
}
