import type { OrderStatusType, ResourceStatusType } from '@/api/types'
import type { initialBreakOutData } from '@/api/breakOut/constants'

export type InitialBreakOutDataType = typeof initialBreakOutData

export type BreakOutPostRequest = {
  customerNote: string
  fqdnList?: string[]
  prefixList?: string[]
}
export type BreakOutPutRequest = Partial<BreakOutPostRequest>

export type BreakOutListQuery = {
  customerNote?: string
  resourceStatus?: ResourceStatusType[]
}
export type BreakOutResponse = {
  tenantId: string
  breakOutListId: string
  resourceStatus: ResourceStatusType
  ref: string
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime?: string
  customerNote: string
  fqdnList?: string[]
  prefixList?: string[]
}

export type BreakOutListResponse = {
  breakOutLists: BreakOutResponse[]
}
