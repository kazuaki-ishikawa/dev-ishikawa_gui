import type { OperationStatusTypes } from '@/api/threatDetectionFilters/constants'
import type { CommonQuery } from '@/api/types'

export type OperationStatusType = (typeof OperationStatusTypes)[keyof typeof OperationStatusTypes]

export type ThreatDetectionFiltersQuery = CommonQuery & {
  terminalId?: string[]
  blockingStatus?: string
  operationStatus?: OperationStatusType
  startTime?: string
  endTime?: string
}

export type ThreatDetectionFiltersResponse = {
  filterId: string
  terminalId: string
  creationTime?: string
  endTime?: string
  blockingStatus?: boolean | null
  operationStatus: OperationStatusType
  latestGetCounterTime?: string
  latestFilterHitCount?: string
  previousGetCounterTime?: string
  previousFilterHitCount?: string
  threatDestination: string
  sourceIp: string
  destinationPort: string
  sourcePort: string
  protocol: string
}

export type ThreatDetectionFiltersList = {
  total: number
  offset: number
  limit: number
  filters: ThreatDetectionFiltersResponse[]
}

export type ThreatDetectionFiltersPutRequest = {
  threatDestination: string
  sourceIp: string
  destinationPort: string
  sourcePort: string
  protocol: string
}

export type ThreatDetectionFiltersRemoveRequest = {
  filterIds: string[]
}

export type ThreatDetectionFiltersDataType = {
  terminalId: string
  filterIds: string[]
}
