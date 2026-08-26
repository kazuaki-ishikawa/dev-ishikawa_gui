import type { RinkMobileOrderTypes } from '@/api/orders/constants'
import type { OrderRinkLineDetailType } from '@/api/rinkLines/types'

export type RinkLineGroupListType = {
  lineGroupId: string
  lineGroupName: string
  lineGroupLimit: number
  lineCount: number
}
export type RinkLineGroupListResponse = {
  lineGroupList: RinkLineGroupListType[]
}

export type RinkLineGroupUsageSummaryQuery = {
  targetMonth: string
}

export type RinkLineGroupCurrentUsageResponse = {
  usage: number
  remainUsage: number
}
export type RinkLineGroupListCurrentUsageType = {
  usage: number
  remainUsage: number
  totalLineGroupLimit: number
}
export type RinkLineUsageListType = {
  lineNumber: string
  usage: number
}
export type RinkLineGroupDailyUsageQuery = {
  targetMonth: string
}
export type RinkLineGroupDailyUsageListType = {
  date: string
  usage: number
}
export type RinkLineGroupUsageSummaryResponse = {
  lineGroupId: string
  lineGroupUsage: number
  lineGroupUsageList: RinkLineUsageListType[]
  updatedAt?: string
}
export type RinkLineGroupDailyUsageResponse = {
  lineGroupId: string
  totalLineGroupLimit: number
  lineGroupUsageList: RinkLineGroupDailyUsageListType[]
  remainUsage?: number
  updatedAt: string
}
export type RinkLineGroupPostRequest = {
  lineGroupName: string
}
export type RinkLineGroupDeleteRequest = {
  lineGroupId: string
}
export type RinkLineGroupLineMembersPutRequest = {
  linesList: Array<{ lineIndex: number; lineNumber: string }>
}
export type RinkLineGroupLineMembersDeleteRequest = RinkLineGroupLineMembersPutRequest

// オーダー用定義
export type OrderRinkLineGroupRequest = {
  orderType:
    | typeof RinkMobileOrderTypes.RinkLineGroupCreate
    | typeof RinkMobileOrderTypes.RinkLineGroupDelete
    | typeof RinkMobileOrderTypes.RinkLineGroupUpdateAdd
    | typeof RinkMobileOrderTypes.RinkLineGroupUpdateRemove
  orderDetailLine?: OrderRinkLineDetailType[]
}
