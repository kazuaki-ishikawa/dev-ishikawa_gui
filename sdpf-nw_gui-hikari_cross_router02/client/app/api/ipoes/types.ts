import type { OrderStatusType, ResourceStatusType, CommonQuery } from '@/api/types'
import type { ReserveConstructionDateRequest, DiversionContractInfoType } from '@/api/hikariCollaboUtil/types'
import type {
  RequestTypes,
  FletsTypes,
  IpoeTypes,
  HikariPlans,
  RemovalCollectTypes,
  FletsOrderTypes,
} from '@/api/ipoes/constants'

export type RequestType = (typeof RequestTypes)[keyof typeof RequestTypes]
export type FletsType = (typeof FletsTypes)[keyof typeof FletsTypes]
export type HikariPlanType = (typeof HikariPlans)[keyof typeof HikariPlans]
export type IpoeType = (typeof IpoeTypes)[keyof typeof IpoeTypes]
export type RemovalCollectType = (typeof RemovalCollectTypes)[keyof typeof RemovalCollectTypes]
type FletsOrderType = (typeof FletsOrderTypes)[keyof typeof FletsOrderTypes]

type ConstructionOptionType = {
  siteRouteSurvey: boolean
  lineConfirmation?: boolean
  wiringRouteConstruction: boolean
  constructionResultReport: boolean
  photographConsent?: boolean
  photographConsentName?: string
  specifiedVisitDateTime: boolean
}

export type FletsSeparatePostRequest = {
  customerNote: string
  fletsId?: string
  hikariPlan: HikariPlanType
  ipoeType: IpoeType
  appControl: boolean
  accessKey?: string
  ipoeApplicationDate?: string
  fletsOpen: boolean
  fletsOpenDate?: string
  applicant?: {
    name?: string
    nameKana?: string
    phoneNumber?: string
    mailAddress?: string
  }
  originContractor?: {
    name?: string
    nameKana?: string
    phoneNumber?: string
    postalCode?: string
    mailAddress?: string
  }
  installationPlace?: {
    postalCode?: string
    phoneNumber?: string
  }
}
export type FletsSeparatePutRequest = {
  customerNote?: string
  ipoeType?: IpoeType
  appControl?: boolean
}

export type FletsSeparateResponse = FletsSeparatePostRequest & {
  ipoeId: string
  ipv4Address: string
  ref?: string
  terminalId?: string
  tenantId: string
  resourceStatus?: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime: string
  serviceStartTime: string
}

export type HikariCollaboPostRequest = {
  customerNote: string
  fletsOrderType: typeof FletsOrderTypes.New
  fletsType: FletsType
  ipoeType: IpoeType
  appControl: boolean
  installationPlaceCode: string
  onSiteRepairOption: boolean
  constructionOption: ConstructionOptionType
}

export type HikariCollaboPutRequest = {
  customerNote?: string
  ipoeType?: IpoeType
  appControl?: boolean
  changeEffectiveDate?: string
  onSiteRepairOption?: boolean
}

export type HikariCollaboDeleteRequest = {
  collectType: RemovalCollectType
  lanCollect?: boolean
  kitSendInstallAddressSame?: boolean
  kitSendAddress?: {
    companyName: string
    personName: string
    addressCode: string
    address: string
    houseNumber: string
    buildingName: string
  }
}

type ConstructionType = ReserveConstructionDateRequest & {
  workerCompanyName: string
  workerCompanyPhoneNumber: string
  workerResponsiblePersonName: string
}
type RemovalConstructionType = ConstructionType & HikariCollaboDeleteRequest
export type HikariCollaboResponse = {
  ipoeId: string
  postalCode?: string
  address?: string
  ref?: string
  terminalId?: string
  ipv4Address?: string
  fieldSurveyRequirement?: boolean
  ticketIssueRequirement?: boolean
  ticketIssueRequirementReason?: 'facilityConfirmationRequired' | 'fieldSurveyPossible' | 'specifiedVisitDateTime'
  changeEffectiveDate?: string
  tenantId?: string
  resourceStatus?: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime?: string
  updateTime?: string
  serviceStartTime?: string
  customerNote: string
  fletsOrderType: FletsOrderType
  fletsType?: FletsType
  ipoeType: IpoeType
  appControl: boolean
  installationPlaceCode?: string
  fletsId?: string
  onSiteRepairOption?: boolean
  constructionOption?: ConstructionOptionType
  fieldSurvey?: ConstructionType
  construction?: ConstructionType
  removal?: RemovalConstructionType
  diversion?: {
    diversionNumber: string
    contractInfo: DiversionContractInfoType
    diversionDate: string
  }
}

export type IpoeListQuery = CommonQuery & {
  ipoeId?: string[]
  customerNote?: string
  resourceStatus?: ResourceStatusType[]
}

export type ResourceSummaryIpoeResponse = {
  ipoeId: string
  tenantId: string
  resourceStatus: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime: string
  serviceStartTime?: string
  ref: string
  customerNote: string
  ipv4Address?: string
}

type IpoeResponse = {
  tenantId: string
  resourceStatus: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime?: string
  updateTime?: string
  serviceStartTime?: string
  ipoeId: string
  fletsId?: string
  siteName?: string | null
  terminalId?: string
  terminalCustomerNote?: string
  ipv4Address?: string
  customerNote: string
  hikariPlan?: HikariPlanType
  ipoeType: IpoeType
  appControl: boolean
  ref: string
}
export type IpoeListResponse = {
  total: number
  offset: number
  ipoes: IpoeResponse[]
}

export type ResourceSummaryIpoeListResponse = {
  total: number
  limit: number
  offset: number
  ipoes: ResourceSummaryIpoeResponse[]
}
