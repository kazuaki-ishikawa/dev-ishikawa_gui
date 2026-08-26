import type {
  BreakOutTypes,
  SortDirectionTypes,
  OrderStatusTypes,
  ResourceStatusTypes,
  CircuitTypes,
  TerminalTypes,
  TerminalDeviceTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
  DocumentTypes,
  DocumentServiceTypes,
  GuaranteeDocumentTypes,
  EncodingTypes,
  AddressFamilyTypes,
} from './constants'

export type ErrorResponse = Error & {
  statusCode?: number
  data?: {
    errorCode: number
    errorMessage: string
    moreInfo?: unknown
  }
}

export type SessionResponse = {
  auth: {
    menus?: string[]
  }
  backend: [string, string, string, string]
}

export type SortDirectionType = (typeof SortDirectionTypes)[keyof typeof SortDirectionTypes]
export type CommonQuery = {
  limit?: number
  offset?: number
  sortKey?: string
  direction?: SortDirectionType
}

export type OptionType = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  query?: object
  body?: object
}

export type BreakOutType = (typeof BreakOutTypes)[keyof typeof BreakOutTypes]
export type ResourceStatusType = (typeof ResourceStatusTypes)[keyof typeof ResourceStatusTypes]
export type OrderStatusType = (typeof OrderStatusTypes)[keyof typeof OrderStatusTypes]
export type CircuitType = (typeof CircuitTypes)[keyof typeof CircuitTypes]
export type TerminalType = (typeof TerminalTypes)[keyof typeof TerminalTypes]
export type TerminalDeviceType = (typeof TerminalDeviceTypes)[keyof typeof TerminalDeviceTypes]
export type TrafficReportFlowAnalyzerPlanType =
  | (typeof TrafficReportFlowAnalyzerPlanTypes)['FreePlan']
  | (typeof TrafficReportFlowAnalyzerPlanTypes)['PaidPlan'][number]
  | (typeof TrafficReportFlowAnalyzerPlanTypes)['NoSubscription']

export type DocumentServiceType = (typeof DocumentServiceTypes)[keyof typeof DocumentServiceTypes]
export type DocumentType = (typeof DocumentTypes)[keyof typeof DocumentTypes]
export type GuaranteeDocumentType = (typeof GuaranteeDocumentTypes)[keyof typeof GuaranteeDocumentTypes]
export type EncodingType = (typeof EncodingTypes)[keyof typeof EncodingTypes]
export type AddressFamilyType = (typeof AddressFamilyTypes)[keyof typeof AddressFamilyTypes]

export type TerminalBehaviorDetectionPlanType =
  (typeof BehaviorDetectionOptionTypes)[keyof typeof BehaviorDetectionOptionTypes]
export type TerminalFlowCollectorPlanType = (typeof SecurityOptionTypes)[keyof typeof SecurityOptionTypes]
export type TerminalThreatDetectionPlanType = Exclude<
  TerminalFlowCollectorPlanType,
  typeof SecurityOptionTypes.Plan6Months
>
export type TrafficReportFlowAnalyzerType = {
  trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanType
  trafficReportFlowAnalyzerAlert?: boolean
}
export type TerminalFlowCollectorResponseType = {
  flowCollectorPlan: TerminalFlowCollectorPlanType
  flowCollectorUsage?: number // byte
  flowCollectorStartDate?: string
}
export type TerminalFlowCollectorRequestType = Pick<TerminalFlowCollectorResponseType, 'flowCollectorPlan'>
export type TerminalThreatDetectionType = {
  threatDetectionPlan: TerminalThreatDetectionPlanType
}
export type TerminalBehaviorDetectionType = {
  behaviorDetectionPlan: TerminalBehaviorDetectionPlanType
}
type UploadIdentificationDocumentRequest = {
  documentType: typeof DocumentTypes.IdentificationDocument
  format: 'jpg' | 'png' | 'pdf'
}
type UploadFieldSurveyLessFileRequest = {
  documentType: typeof DocumentTypes.FieldSurveyLessFile
  format: 'pdf' | 'xls' | 'xlsx' | 'zip'
}
type UploadMapDocumentRequest = {
  documentType: typeof DocumentTypes.MapDocument
  format: 'jpg' | 'png' | 'pdf'
}
export type UploadDocumentRequest = (
  | UploadIdentificationDocumentRequest
  | UploadFieldSurveyLessFileRequest
  | UploadMapDocumentRequest
) & {
  encoding: 'base64'
  content: string
  service: DocumentServiceType
}
export type UploadDocumentResponse = {
  documentId: string
  encoding: 'base64'
  size: number
  md5: string
  creationTime: string
  expireTime: string
}

export type DownloadDocumentRequest = {
  documentId: string
}
export type DownloadDocumentResponse<T = 'pdf' | 'xlsx'> = {
  documentId: string
  decoding: 'base64'
  content: string
  format: T
  md5: string
}
export type DecodedDownloadDocumentResponse = {
  title: string
  content: string
}

export type DownloadGuaranteeDocumentQuery = {
  documentType: GuaranteeDocumentType
}

export type DownloadGuaranteeDocumentResponse = {
  documentType: GuaranteeDocumentType
  encoding?: EncodingType
  content?: string
  fileName?: string
}
