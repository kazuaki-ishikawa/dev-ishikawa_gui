import type { TerminalType, ResourceStatusType } from '@/api/types'

type GuaranteeMaintenanceAffectedCircuitsType = {
  guaranteeId: string
  customerNote: string
  resourceStatus?: Exclude<ResourceStatusType, 'terminated'>
  terminalId?: string
  terminalType?: TerminalType
  switchover?: boolean
}
export type GuaranteeMaintenancesType = {
  maintenanceId: string
  startTime: string
  endTime: string
  affectedCircuits: GuaranteeMaintenanceAffectedCircuitsType[]
}
export type GuaranteeMaintenanceResponse = {
  maintenances: GuaranteeMaintenancesType[]
}
