import type {
  TrafficFlowCircuitTypes,
  DisplayCircuitTypes,
  DisplayAggregationMethodTypes,
  TrafficFlowDownloadRequestStatusTypes,
} from '@/api/trafficFlow/constants'

export type TrafficFlowCircuitType = (typeof TrafficFlowCircuitTypes)[keyof typeof TrafficFlowCircuitTypes]
export type DisplayCircuitType = (typeof DisplayCircuitTypes)[keyof typeof DisplayCircuitTypes]
export type DisplayAggregationMethodType =
  (typeof DisplayAggregationMethodTypes)[keyof typeof DisplayAggregationMethodTypes]

export type TrafficFlowUsageCircuitDailyUsageType = {
  date: string
  bytes: number
}
type TrafficFlowUsageCircuitType = {
  circuitId: string
  circuitType: TrafficFlowCircuitType
  totalBytes: number
  dailyUsage: TrafficFlowUsageCircuitDailyUsageType[]
}
export type TrafficFlowUsageType = {
  terminalId: string
  customerNote: string
  circuits: TrafficFlowUsageCircuitType[]
}

export type TrafficFlowUsageQuery = {
  terminalId: string[]
  startDate?: string
  endDate?: string
}
export type TrafficFlowUsageResponse = {
  limit: number
  offset: number
  total: number
  flowUsages: TrafficFlowUsageType[]
}

export type TrafficFlowDownloadPostRequest = {
  terminalId: string
  startTime: string
  endTime: string
}

export type TrafficFlowDownloadResponse = {
  requestId: string
  requestTime: string
  terminalId: string
  startTime: string
  endTime: string
}

type TrafficFlowDownloadRequestStatusType =
  (typeof TrafficFlowDownloadRequestStatusTypes)[keyof typeof TrafficFlowDownloadRequestStatusTypes]

export type TrafficFlowDownloadRequestResponse = {
  requestId: string
  requestTime: string
  terminalId: string
  startTime: string
  endTime: string
  status: TrafficFlowDownloadRequestStatusType
  lastUpdateTime?: string
  url?: string
  expiration?: string
}
