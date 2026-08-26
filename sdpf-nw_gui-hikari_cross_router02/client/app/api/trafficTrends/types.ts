import type { CommonQuery } from '@/api/types'
import type { InternetRateLimitType } from '@/api/guarantees/types'
import type { CircuitTypes } from '@/api/constants'
import type { IntervalTypes, AccessTypes } from '@/api/trafficTrends/constants'

export type IntervalType = (typeof IntervalTypes)[keyof typeof IntervalTypes]
export type CircuitType = typeof CircuitTypes.Guarantee | typeof CircuitTypes.Ipoe
export type AccessType = (typeof AccessTypes)[keyof typeof AccessTypes]

export type TrafficTrendCsvDataType = {
  timestamp: string
  terminalId: string
  customerNote: string
  circuitId: string
  bitPerSecIn: number
  bytePerSecIn: number
  bitPerSecOut: number
  bytePerSecOut: number
}
export type TrafficTrendsQuery = {
  limit?: number
  offset?: number
  startTime?: string
  endTime?: string
  terminalId?: string
  interval?: IntervalType
}

export type TrafficTrendsSummaryQuery = CommonQuery & {
  startDate?: string
  endDate?: string
  terminalId?: string[]
  customerNote?: string
  circuitType?: CircuitType
}

export type TrafficTrendCircuitType = {
  circuitType: CircuitType
  circuitId: string
  accessType?: AccessType
  rateLimit?: InternetRateLimitType
  timestamp: string[]
  bitPerSecIn: number[]
  bytePerSecIn: number[]
  bitPerSecOut: number[]
  bytePerSecOut: number[]
}

export type TrafficTrendType = {
  terminalId: string
  customerNote: string
  circuits: TrafficTrendCircuitType[]
}

export type TrafficTrendsResponse = {
  total: number
  offset: number
  trafficTrends: TrafficTrendType[]
}

export type TrafficTrendSummaryCircuitType<T = AccessType> = {
  circuitType: CircuitType
  circuitId: string
  accessType?: T
  rateLimit?: InternetRateLimitType
  average?: string
  maxBpsList?: Array<{ date: string; max: string }>
}

export type TrafficTrendSummaryType = {
  terminalId: string
  customerNote: string
  circuits: TrafficTrendSummaryCircuitType[]
}

export type TrafficTrendsSummaryResponse = {
  total: number
  offset: number
  trafficTrends: TrafficTrendSummaryType[]
}
