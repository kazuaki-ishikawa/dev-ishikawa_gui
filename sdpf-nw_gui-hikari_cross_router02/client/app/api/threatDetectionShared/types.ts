import type { CommonQuery, SortDirectionType, TerminalThreatDetectionPlanType } from '@/api/types'
import type {
  ThreatDetectionSharedRequestStatusTypes,
  ThreatDetectionSharedRequestTypes,
  ThreatDetectionSharedRequestDirectionTypes,
  ThreatDetectionSharedBillingMethodTypes,
  ThreatDetectionSharedRequestActionTypes,
  ThreatDetectionSharedTerminalDirectionTypes,
} from '@/api/threatDetectionShared/constants'

export type ThreatDetectionSharedRequestStatusType =
  (typeof ThreatDetectionSharedRequestStatusTypes)[keyof typeof ThreatDetectionSharedRequestStatusTypes]
type ThreatDetectionSharedRequestType =
  (typeof ThreatDetectionSharedRequestTypes)[keyof typeof ThreatDetectionSharedRequestTypes]
export type ThreatDetectionSharedRequestDirectionType =
  (typeof ThreatDetectionSharedRequestDirectionTypes)[keyof typeof ThreatDetectionSharedRequestDirectionTypes]
export type ThreatDetectionSharedBillingMethodType =
  (typeof ThreatDetectionSharedBillingMethodTypes)[keyof typeof ThreatDetectionSharedBillingMethodTypes]
export type ThreatDetectionSharedRequestActionType =
  (typeof ThreatDetectionSharedRequestActionTypes)[keyof typeof ThreatDetectionSharedRequestActionTypes]
type ThreatDetectionSharedTerminalDirectionType =
  (typeof ThreatDetectionSharedTerminalDirectionTypes)[keyof typeof ThreatDetectionSharedTerminalDirectionTypes]

export type ThreatDetectionsSharedRequestResponse = {
  requestId: string
  ref: string
  requestDirection: ThreatDetectionSharedRequestDirectionType
  status: ThreatDetectionSharedRequestStatusType
  requestType: ThreatDetectionSharedRequestType
  creationTime: string
  updateTime: string
  sharedTenantId: string
  contractorName: string
  terminals: Array<{
    terminalId: string
    customerNote: string
    installationAddress: string
  }>
  billingMethod?: ThreatDetectionSharedBillingMethodType
}

export type ThreatDetectionSharedRequestListQuery = CommonQuery & {
  requestId?: string[]
  sharedTenantId?: string[]
  status?: ThreatDetectionSharedRequestStatusType
  requestDirection?: ThreatDetectionSharedRequestDirectionType
  requestType?: ThreatDetectionSharedRequestType
}
export type ThreatDetectionSharedRequestListResponse = {
  total: number
  offset: number
  limit?: number
  threatDetectionsSharedRequests: ThreatDetectionsSharedRequestResponse[]
}

type ThreatDetectionSharedStartRequest = {
  key: string
  sharedTenantId: string
  terminalIds: string[]
  billingMethod: ThreatDetectionSharedBillingMethodType
  requestType: typeof ThreatDetectionSharedRequestTypes.Start
}
type ThreatDetectionSharedStopRequest = {
  sharedTenantId: string
  terminalIds: string[]
  requestType: typeof ThreatDetectionSharedRequestTypes.Stop
}

export type ThreatDetectionSharedRequestPostRequest =
  | ThreatDetectionSharedStartRequest
  | ThreatDetectionSharedStopRequest

export type ThreatDetectionSharedRequestPutRequest = {
  action: ThreatDetectionSharedRequestActionType
}

export type ThreatDetectionSharedTenantListTerminalType = {
  sharedTenantId: string
  contractorName: string
  terminalDirection: ThreatDetectionSharedTerminalDirectionType
  billingMethod: ThreatDetectionSharedBillingMethodType
  requestId: string
  ref: string
  approvalTime: string
  terminalId: string
  customerNote: string
  installationAddress: string
  threatDetectionPlan: TerminalThreatDetectionPlanType
}
export type ThreatDetectionSharedTenantListQuery = {
  limit?: number
  offset?: number
  sharedTenantId?: string
  terminalDirection?: ThreatDetectionSharedTerminalDirectionType
  terminalId?: string
  sortKey?: string
  direction?: SortDirectionType
}
export type ThreatDetectionSharedTenantListResponse = {
  total: number
  offset: number
  limit?: number
  terminals: ThreatDetectionSharedTenantListTerminalType[]
}
