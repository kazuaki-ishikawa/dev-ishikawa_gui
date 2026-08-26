import type { CommonQuery, CircuitType } from '@/api/types'
import type {
  BlockingStatusTypes,
  BlockingStatusOptionTypes,
  ThreatLevelTypes,
  ThreatTypes,
  CircuitPriorityTypes,
  TrafficDirectionTypes,
  LineTypes,
  DetectionTypes,
} from '@/api/threatDetections/constants'

export type ThreatLevelType = (typeof ThreatLevelTypes)[keyof typeof ThreatLevelTypes]
type BlockingStatusType = (typeof BlockingStatusTypes)[keyof typeof BlockingStatusTypes]
export type BlockingStatusOptionType = (typeof BlockingStatusOptionTypes)[keyof typeof BlockingStatusOptionTypes]
type CircuitPriorityType = (typeof CircuitPriorityTypes)[keyof typeof CircuitPriorityTypes]
export type TrafficDirectionType = (typeof TrafficDirectionTypes)[keyof typeof TrafficDirectionTypes]
type LineType = (typeof LineTypes)[keyof typeof LineTypes]
export type DetectionType = (typeof DetectionTypes)[keyof typeof DetectionTypes]

export type ThreatDetectionsQuery = CommonQuery & {
  sharedTenantId?: string
  startTime?: string
  endTime?: string
  terminalId?: string[]
  circuitId?: string[]
  threatLevel?: ThreatLevelType[]
  threatType?: (typeof ThreatTypes)[number][]
  detectionType?: DetectionType[]
  blockingStatus?: BlockingStatusType[]
  trafficDirection?: TrafficDirectionType
}

type ThreatDetectionsResponse = {
  terminalId: string
  customerNote?: string
  circuitId: string | null
  circuitType?: CircuitType
  circuitPriority: CircuitPriorityType
  blockingStatus: BlockingStatusType
  detectionType: DetectionType
  timestamp: string
  threatType: string
  threatLevel: ThreatLevelType
  threatDestination: string
  threatPort: string
  applicationCategory: string
  direction: TrafficDirectionType
  destinationIp: string
  sourceIp: string
  destinationPort: string
  sourcePort: string
  protocol: string
  lineType: LineType
}

export type ThreatDetectionsList = {
  total: number
  offset: number
  limit?: number
  threatDetections: ThreatDetectionsResponse[]
}
