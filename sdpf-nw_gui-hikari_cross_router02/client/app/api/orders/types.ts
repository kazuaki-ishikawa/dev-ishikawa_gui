import type { SecurityHelpDeskResponse } from '../securityHelpDesk/types'
import type { OrderStatusType, CommonQuery } from '@/api/types'
import type { ContractorPutRequest, ContractorResponse } from '@/api/contractor/types'
import type {
  FicConnectionPostRequest,
  FicConnectionPutRequest,
  FicConnectionResponse,
} from '@/api/ficConnections/types'
import type {
  GuaranteeDeleteRequest,
  GuaranteePostRequest,
  GuaranteePutRequest,
  GuaranteeResponse,
} from '@/api/guarantees/types'
import type {
  FletsSeparateResponse,
  FletsSeparatePostRequest,
  FletsSeparatePutRequest,
  HikariCollaboPostRequest,
  HikariCollaboPutRequest,
  HikariCollaboDeleteRequest,
  HikariCollaboResponse,
} from '@/api/ipoes/types'
import type { HikariCollaboDiversionRequest } from '@/api/hikariCollaboUtil/types'
import type { SelfTerminalResponse, SelfTerminalPostRequest, SelfTerminalPutRequest } from '@/api/selfTerminals/types'
import type {
  TerminalPostRequest,
  TerminalPutRequest,
  TerminalDeleteRequest,
  TerminalResponse,
} from '@/api/terminals/types'
import type { VpnPostRequest, VpnPutRequest, VpnResponse } from '@/api/vpns/types'
import type { MobilePutRequest, MobileResponse } from '@/api/mobile/types'
import type {
  PhoneTicketingSupportResponse,
  PhoneTicketingSupportPostRequest,
  PhoneTicketingSupportPutRequest,
  PhoneTicketingSupportDeleteRequest,
} from '@/api/phoneTicketingSupport/types'
import type { RegistrationAddressPostRequest, RegistrationAddressResponse } from '@/api/iwanUtil/types'
import type { OrderResourceTypes, OrderRequestTypes } from '@/api/orders/constants'
import type { BreakOutResponse, BreakOutPostRequest, BreakOutPutRequest } from '@/api/breakOut/types'
import type { OrderRinkConnectionRequest } from '@/api/rinkConnections/types'
import type { OrderRinkDeviceRequest } from '@/api/rinkDevices/types'
import type { OrderRinkLineRequest } from '@/api/rinkLines/types'
import type { OrderRinkLineGroupRequest } from '@/api/rinkLineGroups/types'
import type {
  MsbPostRequest,
  MsbPatchRequest,
  MsbDeleteRequest,
  MsbDeleteResponse,
  MsbPatchResponse,
  MsbPostResponse,
} from '@/api/msb/types'

export type OrderResourceType = (typeof OrderResourceTypes)[keyof typeof OrderResourceTypes]
export type OrderRequestType = (typeof OrderRequestTypes)[keyof typeof OrderRequestTypes]

export type DownloadableDocumentIdType = {
  collaboFieldSurveyWorkCandidate?: string
  collaboConstructionWorkCandidate?: string
  collaboRemovalWorkCandidate?: string
  collaboSiteRouteSurveyReport?: string
  collaboConstructionResultReport?: string
}

type OrderCommonResponse<T> = {
  tenantId: string
  resourceId?: string
  orderId: string
  bulkOrderId?: string
  customerNote?: string
  ref: string
  requestType: OrderRequestType
  orderStatus: OrderStatusType
  downloadableDocumentId?: DownloadableDocumentIdType
  creationTime: string
  updateTime?: string
  response: {
    statusCode: number
    message: T
    remarks?: string
  }
}
type OrderFicConnectionResponse = OrderCommonResponse<FicConnectionResponse> & {
  resourceType: typeof OrderResourceTypes.Fic
  request: FicConnectionPostRequest | FicConnectionPutRequest
}
type OrderIpoeResponse = OrderCommonResponse<HikariCollaboResponse | FletsSeparateResponse> & {
  resourceType: typeof OrderResourceTypes.Ipoe
  request:
    | FletsSeparatePostRequest
    | FletsSeparatePutRequest
    | HikariCollaboPostRequest
    | HikariCollaboPutRequest
    | HikariCollaboDeleteRequest
    | HikariCollaboDiversionRequest
    | null
}
type OrderTerminalResponse = OrderCommonResponse<TerminalResponse> & {
  resourceType: typeof OrderResourceTypes.Terminal
  request: TerminalPostRequest | TerminalPutRequest | TerminalDeleteRequest
}
type OrderSelfTerminalResponse = OrderCommonResponse<SelfTerminalResponse> & {
  resourceType: typeof OrderResourceTypes.SelfTerminal
  request: SelfTerminalPostRequest | SelfTerminalPutRequest
}
type OrderVpnResponse = OrderCommonResponse<VpnResponse> & {
  resourceType: typeof OrderResourceTypes.Vpn
  request: VpnPostRequest | VpnPutRequest
}
type OrderContractorResponse = OrderCommonResponse<ContractorResponse> & {
  resourceType: typeof OrderResourceTypes.Contractor
  request: ContractorPutRequest
}
type OrderMobileResponse = OrderCommonResponse<MobileResponse> & {
  resourceType: typeof OrderResourceTypes.Mobile
  request: MobilePutRequest
}
export type OrderGuaranteeResponse = OrderCommonResponse<GuaranteeResponse> & {
  resourceType: typeof OrderResourceTypes.Guarantee
  request: GuaranteePostRequest | GuaranteePutRequest | GuaranteeDeleteRequest
}
export type OrderRegistrationAddressResponse = OrderCommonResponse<RegistrationAddressResponse> & {
  resourceType: typeof OrderResourceTypes.RegistrationAddress
  request: RegistrationAddressPostRequest
}
type OrderPhoneTicketingSupportResponse = OrderCommonResponse<PhoneTicketingSupportResponse> & {
  resourceType: typeof OrderResourceTypes.PhoneTicketingSupport
  request: PhoneTicketingSupportPostRequest | PhoneTicketingSupportPutRequest | PhoneTicketingSupportDeleteRequest
}
type OrderBreakOutResponse = OrderCommonResponse<BreakOutResponse> & {
  resourceType: typeof OrderResourceTypes.BreakOutList
  request: BreakOutPostRequest | BreakOutPutRequest
}
type OrderSecurityHelpDeskResponse = OrderCommonResponse<SecurityHelpDeskResponse> & {
  resourceType: typeof OrderResourceTypes.SecurityHelpDesk
  request: null
}
type OrderMsbResponse = OrderCommonResponse<MsbPostResponse | MsbPatchResponse | MsbDeleteResponse> & {
  resourceType: typeof OrderResourceTypes.Msb
  request: MsbPostRequest | MsbPatchRequest | MsbDeleteRequest
}

export type OrderRinkMobileResponse = OrderCommonResponse<string | null> & {
  resourceType: typeof OrderResourceTypes.RinkMobile
  request: OrderRinkConnectionRequest | OrderRinkDeviceRequest | OrderRinkLineRequest | OrderRinkLineGroupRequest
}

export type OrderResponse =
  | OrderFicConnectionResponse
  | OrderIpoeResponse
  | OrderTerminalResponse
  | OrderSelfTerminalResponse
  | OrderVpnResponse
  | OrderContractorResponse
  | OrderMobileResponse
  | OrderGuaranteeResponse
  | OrderRegistrationAddressResponse
  | OrderPhoneTicketingSupportResponse
  | OrderBreakOutResponse
  | OrderSecurityHelpDeskResponse
  | OrderRinkMobileResponse
  | OrderMsbResponse
type ResourceSummaryOrderResponse = Omit<OrderResponse, 'downloadableDocumentId'>

export type OrderQueryType = {
  resourceId?: string
  orderStatus?: OrderStatusType[]
  requestType?: OrderRequestType[]
  resourceType?: OrderResourceType[]
  bulkOrderId?: string
}
export type OrderListQuery = CommonQuery & OrderQueryType

export type OrderListResponse = {
  limit: number
  offset: number
  total: number
  orders: ResourceSummaryOrderResponse[]
}
