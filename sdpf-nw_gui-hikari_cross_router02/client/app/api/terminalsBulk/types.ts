import type {
  TrafficReportFlowAnalyzerType,
  TerminalFlowCollectorRequestType,
  TerminalThreatDetectionType,
  TerminalBehaviorDetectionType,
} from '@/api/types'
import type { NetworkTypes, OperationTypes } from '@/api/terminals/constants'
import type {
  NetworkType,
  TerminalPostRequest,
  TerminalMobilePostRequest,
  TerminalWanStaticType,
  TerminalUserFilter,
  TerminalDhcpServerType,
  TerminalDhcpRelayServerType,
  OperationType,
  OperationStatusType,
  TerminalOperationType,
} from '@/api/terminals/types'
import type { TerminalsBulkOperationsStatusTypes } from '@/api/terminalsBulk/constants'

export type TerminalBulkUnitParameter = Omit<
  TerminalPostRequest,
  'inet4OutFilters' | 'lanStaticRoutes' | 'vpnInFilters' | 'vpnOutFilters' | 'wanStaticRoutes' | 'terminalDeviceType'
>
export type TerminalBulkPostRequest = {
  mobile: TerminalMobilePostRequest
  terminals: Omit<TerminalBulkUnitParameter, 'mobile'>[]
}

export type TerminalBulkPutRequest = {
  terminalIds?: string[]
  vpnId?: string | null
  breakOut?: string[] | null
  interceptDnsServers?: string[] | null
  defaultGateway?: {
    nexthopNetwork: Exclude<NetworkType, typeof NetworkTypes.Lan>
  }
  wanStaticRoutes?: TerminalWanStaticType[] | null
  vpnInFilters?: TerminalUserFilter | null
  vpnOutFilters?: TerminalUserFilter | null
  inet4OutFilters?: TerminalUserFilter | null
  dhcpServer?: Omit<TerminalDhcpServerType, 'ipv4AddressRanges'> | null
  dhcpRelayServers?: TerminalDhcpRelayServerType[] | null
  trafficReportFlowAnalyzer?: Partial<TrafficReportFlowAnalyzerType>
  threatDetection?: TerminalThreatDetectionType
  flowCollector?: TerminalFlowCollectorRequestType
  behaviorDetection?: TerminalBehaviorDetectionType
}

export type TerminalBulkOperationResponse = {
  terminals: Array<{
    terminalId: string
    operations: TerminalOperationType[]
  }>
}
export type PostTerminalBulkOperationResponse = {
  terminalIds: string[]
  operation: OperationType
  requestTime: string
}

export type BulkOperationType = typeof OperationTypes.BreakOutListUpdate | typeof OperationTypes.FirmwareUpdate

export type TerminalBulkOperationRequest = {
  terminalIds: string[]
  operation: BulkOperationType
}

export type TerminalBulkResponse = {
  bulkOrderId: string
  requestTime: string
}

export type TerminalBulkFilterCountsTerminalsType = {
  terminalId: string
  filterIds: string[]
}

export type TerminalBulkGetFilterCountsRequest = {
  terminals?: TerminalBulkFilterCountsTerminalsType[]
}

export type TerminalBulkGetFilterCountsResponse = {
  requestTime: string
}

export type TerminalsBulkOperationsListQuery = {
  limit?: number
  offset?: number
  operation?: Exclude<OperationType, 'reboot' | 'firmwareUpdateNoReboot'>
}

export type TerminalsBulkOperationsStatusType =
  (typeof TerminalsBulkOperationsStatusTypes)[keyof typeof TerminalsBulkOperationsStatusTypes]

type TerminalsBulkOperationType = {
  terminalId: string
  operation: OperationType
  status: OperationStatusType
  requestTime: string
  completedTime?: string
}

export type TerminalsBulkOperationsResponse = {
  bulkOperationId: string
  status: TerminalsBulkOperationsStatusType
  requestTime: string
  completedTime?: string
  operations: TerminalsBulkOperationType[]
}

export type TerminalsBulkOperationsListResponse = {
  limit: number
  offset: number
  total: number
  bulkOperations?: TerminalsBulkOperationsResponse[]
}
