import type {
  TrafficFlowRankTopTypes,
  TrafficFlowRankIntervalTypes,
  TrafficFlowRankDirectionTypes,
  TrafficFlowRankRankByTypes,
} from '@/api/trafficFlowRank/constants'
import type { AccessTypes } from '@/api/trafficTrends/constants'
import type { CircuitTypes, TrafficReportFlowAnalyzerPlanTypes } from '@/api/constants'
import type { TrafficReportFlowAnalyzerPlanType } from '@/api/types'

export type TrafficFlowRankAccessType = typeof AccessTypes.Internet | typeof AccessTypes.Vpn
export type TrafficFlowRankTopType = (typeof TrafficFlowRankTopTypes)[keyof typeof TrafficFlowRankTopTypes]
export type TrafficFlowRankIntervalType =
  (typeof TrafficFlowRankIntervalTypes)[keyof typeof TrafficFlowRankIntervalTypes]
export type TrafficFlowRankDirectionType =
  (typeof TrafficFlowRankDirectionTypes)[keyof typeof TrafficFlowRankDirectionTypes]
export type TrafficFlowRankRankByType = (typeof TrafficFlowRankRankByTypes)[keyof typeof TrafficFlowRankRankByTypes]

export type TrafficFlowRankQuery = {
  terminalId: string
  startTime: string
  endTime: string
  top: TrafficFlowRankTopType
  interval: TrafficFlowRankIntervalType
  direction: TrafficFlowRankDirectionType
  rankBy: TrafficFlowRankRankByType
  [TrafficFlowRankRankByTypes.SourceIpAddress]?: string[]
  [TrafficFlowRankRankByTypes.DestinationIpAddress]?: string[]
  [TrafficFlowRankRankByTypes.Protocol]?: string[]
  [TrafficFlowRankRankByTypes.SourcePort]?: string[]
  [TrafficFlowRankRankByTypes.DestinationPort]?: string[]
  [TrafficFlowRankRankByTypes.ApplicationId]?: string[]
  filterId?: string
}

export type TrafficFlowRankCircuitTrafficRateType = {
  timestamp: string[]
  bitPerSec: number[] // 通信量(bit/秒)
  packetPerSec: number[] // パケット数(パケット/秒)
}
export type TrafficFlowRankCircuitTrafficType = {
  group: {
    [TrafficFlowRankRankByTypes.SourceIpAddress]?: string
    [TrafficFlowRankRankByTypes.DestinationIpAddress]?: string
    [TrafficFlowRankRankByTypes.SourcePort]?: string
    [TrafficFlowRankRankByTypes.DestinationPort]?: string
    [TrafficFlowRankRankByTypes.Protocol]?: string
    [TrafficFlowRankRankByTypes.ApplicationId]?: string
  }
  rank: number
  average: number // 単位(bps)
  rates: TrafficFlowRankCircuitTrafficRateType
}
type TrafficFlowRankCircuitType = {
  circuitId: string
  circuitType: typeof CircuitTypes.Guarantee
  accessType: TrafficFlowRankAccessType
  direction: TrafficFlowRankDirectionType
  rankBy: TrafficFlowRankRankByType
  traffics: TrafficFlowRankCircuitTrafficType[]
}
export type TrafficFlowRankType = {
  terminalId: string
  customerNote: string
  circuits: TrafficFlowRankCircuitType[]
}
export type TrafficFlowRankResponse = {
  trafficFlows: TrafficFlowRankType[]
}

type TrafficFlowRankUsageCircuitType = {
  circuitId: string
  circuitType: typeof CircuitTypes.Guarantee
  limit: Exclude<TrafficReportFlowAnalyzerPlanType, typeof TrafficReportFlowAnalyzerPlanTypes.NoSubscription>
  totalBytes: number
  dailyUsage: Array<{ date: string; bytes: number }>
}
type TrafficFlowRankUsageType = {
  terminalId: string
  customerNote: string
  circuits: TrafficFlowRankUsageCircuitType[]
}
export type TrafficFlowRankUsageQuery = {
  terminalId: string
}
export type TrafficFlowRankUsageResponse = {
  flowUsages: TrafficFlowRankUsageType[]
}

export type TrafficFlowRankFilterType = {
  type: TrafficFlowRankRankByType
  value: string
}
export type TrafficFlowRankFilterPostRequestType = {
  customerNote: string
  filter: TrafficFlowRankFilterType[]
}
export type TrafficFlowRankFlowFilterType = {
  filterId: string
  customerNote: string
  filter: TrafficFlowRankFilterType[]
}
export type TrafficFlowRankFilterResponse = {
  flowFilters: TrafficFlowRankFlowFilterType[]
}

export type TrafficFlowRankApplicationType = {
  applicationId: string
  applicationName: string
  breakOut: boolean
}
export type TrafficFlowRankApplicationListResponse = {
  applications: TrafficFlowRankApplicationType[]
}
