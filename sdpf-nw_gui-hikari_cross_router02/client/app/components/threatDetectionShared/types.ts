import type {
  ThreatDetectionSharedBillingMethodType,
  ThreatDetectionSharedTenantListTerminalType,
} from '@/api/threatDetectionShared/types'

export type TenantTerminalTableItemType = ThreatDetectionSharedTenantListTerminalType & {
  selector: boolean
  sharedTenantId: string
  contractorName: string
  billingMethod?: ThreatDetectionSharedBillingMethodType
  terminalPath?: string
}
