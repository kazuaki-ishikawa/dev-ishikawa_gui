import type { OrderStatusType, ResourceStatusType, CommonQuery } from '@/api/types'
import type {
  PhysicalBandwidthTypes,
  UserInterfaceTypes,
  ReserveStatusTypes,
  ConstructionTypes,
  CommunicationModeTypes,
  WiringTypes,
  VpnRateLimitTypes,
  InternetRateLimitTypes,
  ConnectionTypes,
  ThresholdTypes,
  DurationTypes,
  NotificationIntervalTypes,
  FieldSurveyResultTypes,
  BgpSessionStatusTypes,
  BgpSessionOperationTypes,
  FieldSurveyLessResultSurveyLessTypes,
  FieldSurveyLessResultDrawingResendRequestTypes,
  initialGuaranteeInputData,
  initialGuaranteeFieldSurveyAndConstructionDateInputData,
} from '@/api/guarantees/constants'
import type { TimeType } from '@/api/hikariCollaboUtil/types'

export type PhysicalBandwidthType = (typeof PhysicalBandwidthTypes)[number]
export type UserInterfaceType = (typeof UserInterfaceTypes)[number]

export type ReserveStatusType = (typeof ReserveStatusTypes)[keyof typeof ReserveStatusTypes]
type ConstructionType = (typeof ConstructionTypes)[keyof typeof ConstructionTypes]
type WiringType = (typeof WiringTypes)[keyof typeof WiringTypes]
export type CommunicationModeType = (typeof CommunicationModeTypes)[keyof typeof CommunicationModeTypes]
export type VpnRateLimitType = (typeof VpnRateLimitTypes)[number]
export type InternetRateLimitType = (typeof InternetRateLimitTypes)[number]
export type ConnectionType = (typeof ConnectionTypes)[keyof typeof ConnectionTypes]

export type ThresholdType = (typeof ThresholdTypes)[number]
export type DurationType = (typeof DurationTypes)[keyof typeof DurationTypes]
export type NotificationIntervalType = (typeof NotificationIntervalTypes)[keyof typeof NotificationIntervalTypes]
export type FieldSurveyResultType = (typeof FieldSurveyResultTypes)[keyof typeof FieldSurveyResultTypes]
export type BgpSessionStatusType = (typeof BgpSessionStatusTypes)[keyof typeof BgpSessionStatusTypes]
export type BgpSessionOperationType = (typeof BgpSessionOperationTypes)[keyof typeof BgpSessionOperationTypes]

type WorkerNameType = {
  name?: string
  nameKana?: string
}

export type WorkerInfoType = {
  constructionType?: 'fieldSurvey' | 'construction' | 'removal'
  accessLineId?: string
  companyName?: string
  companyMobilePhoneNumber?: string
  companyPhoneNumber?: string
  responsiblePersonName?: string
  responsiblePersonNameKana?: string
  workerCandidates?: WorkerNameType[]
  confirmedWorkers?: WorkerNameType[]
  answerDateOfWorkerCandidates?: string
  answerDateOfConfirmedWorkers?: string
  numberOfWorkers?: string
  placeOfWork?: string
  dateOfWork?: string
  vehicleInfo?: string
  mobilePhoneInfo?: string
  cameraInfo?: string
  pcInfo?: string
  remarks?: string
}

type CommonIwanDataRequest = {
  operationAdjustment: boolean
  date?: string
  time?: string
  preContactCompanyName: string
  preContactPersonName: string
  preContactPhoneNumber: string
  attendanceCompanyName: string
  attendancePersonName: string
  attendancePhoneNumber: string
  admissionApplicationRequired: boolean
}
type CommonIwanDataResponse = CommonIwanDataRequest & {
  reserveStatus: ReserveStatusType
  desiredDates: { priority: number; date: string; time: TimeType }[]
  time: TimeType
  workerInfoUpdateTime?: string
  workerInfo?: WorkerInfoType
}

export type GuaranteeListQuery = CommonQuery & {
  guaranteeId?: string[]
  customerNote?: string
  resourceStatus?: ResourceStatusType[]
}

type AlertSettingType = {
  threshold: ThresholdType
  duration: DurationType
  notificationInterval: NotificationIntervalType
}

export type GuaranteeResponse = {
  tenantId: string
  guaranteeId: string
  accessLineId?: string
  resourceStatus: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime: string
  serviceStartTime?: string
  ref: string
  customerNote: string
  siteName?: string | null
  terminalId?: string
  terminalCustomerNote?: string | null
  userInterfaceType: UserInterfaceType
  physicalBandwidth: PhysicalBandwidthType
  internet?: {
    rateLimit?: InternetRateLimitType | null
    alertSetting?: AlertSettingType
  }
  vpn?: {
    rateLimit?: VpnRateLimitType | null
    alertSetting?: AlertSettingType
  }
  installationPlaceCode: string
  constructionType: ConstructionType
  wiringType: WiringType
  communicationMode: CommunicationModeType
  fieldSurveyLess: boolean
  fieldSurveyResult: FieldSurveyResultType
  fieldSurveyReportUpdateTime?: string
  fieldSurveyLessInfo?: {
    fieldSurveyLessFileId: string
    fieldSurveyLessResult: (typeof FieldSurveyLessResultSurveyLessTypes)[keyof typeof FieldSurveyLessResultSurveyLessTypes]
    drawingResendRequest?: (typeof FieldSurveyLessResultDrawingResendRequestTypes)[keyof typeof FieldSurveyLessResultDrawingResendRequestTypes]
    drawingDeficiencyReason?: string
  }
  fieldSurvey?: CommonIwanDataResponse
  construction: CommonIwanDataResponse
  removal?: CommonIwanDataResponse
}

export type GuaranteeListResponse = {
  total: number
  offset: number
  guarantees: GuaranteeResponse[]
}

type ResourceSummaryGuaranteeResponse = Pick<
  GuaranteeResponse,
  | 'tenantId'
  | 'resourceStatus'
  | 'orderId'
  | 'orderStatus'
  | 'creationTime'
  | 'updateTime'
  | 'serviceStartTime'
  | 'ref'
  | 'customerNote'
  | 'guaranteeId'
  | 'physicalBandwidth'
>
export type ResourceSummaryGuaranteeListResponse = {
  limit: number
  offset: number
  total: number
  guarantees: ResourceSummaryGuaranteeResponse[]
}

export type GuaranteePostRequest = {
  customerNote: string
  userInterfaceType: UserInterfaceType
  physicalBandwidth: PhysicalBandwidthType
  internet: {
    rateLimit?: InternetRateLimitType
    alertSetting?: AlertSettingType
  }
  vpn: {
    rateLimit?: VpnRateLimitType
    alertSetting?: AlertSettingType
  }
  installationPlaceCode: string
  constructionType: ConstructionType
  wiringType: WiringType
  communicationMode: CommunicationModeType
  fieldSurveyLess: boolean
  fieldSurvey?: CommonIwanDataRequest
  construction: CommonIwanDataRequest
  fieldSurveyLessInfo?: {
    fieldSurveyLessFileId: string
  }
}
export type GuaranteePutRequest = {
  customerNote: string
  internet: {
    rateLimit?: InternetRateLimitType | null
    alertSetting?: AlertSettingType | null
  }
  vpn: {
    rateLimit?: VpnRateLimitType | null
    alertSetting?: AlertSettingType | null
  }
}

export type GuaranteeDeleteRequest = {
  removal: CommonIwanDataRequest
}

export type GuaranteeFieldSurveyAndConstructionOrderPutRequest = {
  fieldSurvey?: {
    date: string
    time: string
  }
  construction?: {
    date: string
    time: string
  }
}
type GuaranteeRemovalOrderPutRequest = {
  removal: {
    date: string
    time: string
  }
}
type GuaranteeFieldSurveyLessOrderPutRequest = {
  fieldSurveyLessInfo: {
    fieldSurveyLessFileId: string
  }
}
export type GuaranteeOrderPutRequest = {
  request:
    | GuaranteeFieldSurveyAndConstructionOrderPutRequest
    | GuaranteeRemovalOrderPutRequest
    | GuaranteeFieldSurveyLessOrderPutRequest
}

export type BgpSessionClearRequest = {
  operation: 'reset'
}
export type BgpSessionClearResponse = {
  status?: BgpSessionStatusType
  requestTime?: string
  operation?: BgpSessionOperationType
  guaranteeId: string
}

export type InitialGuaranteeInputDataType = typeof initialGuaranteeInputData
export type InitialGuaranteeFieldSurveyAndConstructionDateInputDataType =
  typeof initialGuaranteeFieldSurveyAndConstructionDateInputData
