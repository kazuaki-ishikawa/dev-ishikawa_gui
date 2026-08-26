import type {
  initialRinkLineListInputData,
  initialRinkLineEditInputData,
  initialRinkLineEditValid,
  RinkLineAdditionalLimitTypes,
  RinkLineAccessTypes,
  RinkLineAvailableDateOrderTypes,
  RinkLineEditMenuTypes,
  RinkLineStatusTypes,
} from '@/api/rinkLines/constants'
import type { RinkMobileOrderTypes } from '@/api/orders/constants'

export type InitialRinkLineListInputDataType = typeof initialRinkLineListInputData
export type RinkLineEditInputDataType = Record<string, typeof initialRinkLineEditInputData>
export type RinkLineEditInputValidType = Record<string, typeof initialRinkLineEditValid>

export type RinkLineEditMenuType = (typeof RinkLineEditMenuTypes)[keyof typeof RinkLineEditMenuTypes]
export type RinkLineAccessType = (typeof RinkLineAccessTypes)[keyof typeof RinkLineAccessTypes]
export type RinkLineStatusType = (typeof RinkLineStatusTypes)[keyof typeof RinkLineStatusTypes]
export type RinkLineAdditionalLimitType =
  (typeof RinkLineAdditionalLimitTypes)[keyof typeof RinkLineAdditionalLimitTypes]

type RinkLineAdditionalLimitPutRequest = {
  lineIndex: number
  lineNumber: string
  additionalLimit: RinkLineAdditionalLimitType
}
type RinkLineAuthenticationPutRequest = {
  lineIndex: number
  lineNumber: string
  authenticationId: string
  authenticationPassword?: string
}
type RinkLinePrefixPutRequest = {
  lineIndex: number
  lineNumber: string
  actIpAddress: string
  sbyIpAddress?: string
}
type RinkLinePlanPutRequest = {
  lineIndex: number
  lineNumber: string
  planLimitAlias: string
}
type RinkLineOnlyLineNumberType = {
  lineIndex: number
  lineNumber: string
}
export type RinkLinePutRequest<T = Exclude<RinkLineEditMenuType, typeof RinkLineEditMenuTypes.Reissue>> =
  T extends typeof RinkLineEditMenuTypes.AdditionalLimit
    ? RinkLineAdditionalLimitPutRequest
    : T extends typeof RinkLineEditMenuTypes.Authentication
      ? RinkLineAuthenticationPutRequest
      : T extends typeof RinkLineEditMenuTypes.LinePrefix
        ? RinkLinePrefixPutRequest
        : T extends typeof RinkLineEditMenuTypes.Plan
          ? RinkLinePlanPutRequest
          : RinkLineOnlyLineNumberType

export type RinkLineBulkPutRequest<T = Exclude<RinkLineEditMenuType, typeof RinkLineEditMenuTypes.Reissue>> = {
  linesList: Array<RinkLinePutRequest<T>>
}
export type RinkLineReissuePutRequest = RinkLinePostOrPutRequest<RinkLineOnlyLineNumberType>

export type RinkLineLinesListPostType = {
  lineIndex: number // min:1 max:254
  planLimitAlias: string
  deviceNameAlias?: string
  authenticationId: string
  authenticationPassword: string
  actIpAddress: string
  sbyIpAddress?: string
  accessType: RinkLineAccessType
}

type RinkLinePostOrPutRequest<T> = {
  requestDate: string
  shippingPostalCode: string
  shippingPrefecture: string
  shippingCity: string
  shippingCityAdditionalInfo?: string
  shippingAddressBlock: string
  shippingAddressNumber: string
  shippingBuilding?: string
  packageRecipient: string
  phoneNumber: string
  linesList: T[]
}
export type RinkLinePostRequest = RinkLinePostOrPutRequest<RinkLineLinesListPostType>
export type RinkLinePostPutResponse = { id: string }

export type RinkLineDeleteRequest = {
  requestDate: string
  linesList: Array<{ lineIndex: number; lineNumber: string }>
}

export type RinkLineListQuery = {
  lineNumber?: string
  limit?: number
  offset?: number
}
export type RinkLineListType = {
  lineNumber: string
  lineStatus: RinkLineStatusType
  enabledAt?: string
  plan: string
  planName: string
  sms: boolean
  accessType: RinkLineAccessType
  isLocked: boolean
  simNumber?: string
  lineGroupId?: string
  deviceName?: string
  imei?: string
  authenticationId: string
  actIpAddress: string
  sbyIpAddress?: string
}
export type RinkLineListResponse = {
  total: number
  lineList: RinkLineListType[]
}

export type AvailableLinePrefixResponse = {
  lineActPrefix: string[]
  lineSbyPrefix: string[]
}

export type AvailablePlanLimitPlanType = {
  planName: string
  planLimitAlias: string
  availableAccessType: RinkLineAccessType[]
}
export type AvailablePlanLimitDeviceType = {
  deviceName: string
  deviceNameAlias: string
}
export type AvailablePlanLimitResponse = {
  planList: AvailablePlanLimitPlanType[]
  deviceList: AvailablePlanLimitDeviceType[]
}

export type RinkLineAvailableDateOrderType =
  (typeof RinkLineAvailableDateOrderTypes)[keyof typeof RinkLineAvailableDateOrderTypes]
export type RinkLineAvailableDateApplicationInfoType = {
  deviceNameAlias?: string
  quantity: number
}
export type RinkLineAvailableDateRequest =
  | {
      orderType:
        | typeof RinkLineAvailableDateOrderTypes.ChangeLineReissue
        | typeof RinkLineAvailableDateOrderTypes.DeleteLineLines
    }
  | {
      orderType: typeof RinkLineAvailableDateOrderTypes.CreateLineDevices
      applicationInfo: RinkLineAvailableDateApplicationInfoType[]
    }
  | {
      orderType: typeof RinkLineAvailableDateOrderTypes.CreateLineLines
      rinkMobileId: string
      applicationInfo: RinkLineAvailableDateApplicationInfoType[]
    }
export type RinkLineAvailableDateResponse = {
  availableServiceInDate: string
  availableDateDeadline: string
}

export type ShippingAddressType = {
  packageRecipient: string
  shippingPostalCode: string
  shippingPrefecture: string
  shippingCity: string
  shippingCityAdditionalInfo: string | null
  shippingAddressBlock: string
  shippingAddressNumber: string
  shippingBuilding: string | null
  phoneNumber: string
}
export type ShippingAddressHistoryListResponse = {
  shippingAddresses: ShippingAddressType[]
}

export type RinkLineUsageType = {
  date: string
  usage: number
}
export type RinkLinesUsageResponse = {
  lineNumber: string
  totalLimit: number
  lineUsageList: RinkLineUsageType[]
  remainUsage?: number
  updatedAt: string
}

export type RinkLinesUsageSummaryLineUsageType = {
  lineNumber?: string
  usage?: number
}

export type RinkLinesUsageSummaryResponse = {
  lineUsageList?: RinkLinesUsageSummaryLineUsageType[]
  updatedAt?: string
}

export type RinkLinesCurrentUsageResponse = {
  lineGroupId?: string
  usage: number
  remainUsage: number
}

// オーダー用定義
export type OrderRinkLineDetailType = {
  lineNumber: string
  lineStatus: RinkLineStatusType
  imei: string
  simNumber: string
  swimmyAccountId: string
  planLimitAlias: string
  plan: string
  planName: string
  planType: string
  planSuffix: number
  dataLimit: number
  addLimit: RinkLineAdditionalLimitType
  reissue: boolean
  sms: boolean
  accessType: RinkLineAccessType
  actIpAddress: string
  sbyIpAddress?: string
  authenticationId: string
  authenticationPassword: string
  deviceName?: string
  initialDeviceName: string
  deviceTCode: string
  lineGroupId?: string
  lineGroupName?: string
  totalLineGroupLimit?: number
  lineIndex: number
}
export type OrderRinkLineRequest = {
  orderType:
    | typeof RinkMobileOrderTypes.RinkLineCreate
    | typeof RinkMobileOrderTypes.RinkLineUpdateAdditionalLimit
    | typeof RinkMobileOrderTypes.RinkLineUpdateAuthentication
    | typeof RinkMobileOrderTypes.RinkLineUpdateLinePrefix
    | typeof RinkMobileOrderTypes.RinkLineUpdatePlan
    | typeof RinkMobileOrderTypes.RinkLineUpdateDeactivate
    | typeof RinkMobileOrderTypes.RinkLineUpdateReactivate
    | typeof RinkMobileOrderTypes.RinkLineUpdateReissue
    | typeof RinkMobileOrderTypes.RinkLineDelete
  reservedCompletionDate?: string
  cancellationDeadline?: string
  reservedConstructionDate?: string
  packageRecipient?: string
  shippingPostalCode?: string
  shippingPrefecture?: string
  shippingCity?: string
  shippingCityAdditionalInfo?: string | null
  shippingAddressBlock?: string
  shippingAddressNumber?: string
  shippingBuilding?: string | null
  phoneNumber?: string
  orderDetailLine?: OrderRinkLineDetailType[]
}
