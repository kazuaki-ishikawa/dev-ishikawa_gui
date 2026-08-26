import type { CircuitType } from '@/api/types'
import type {
  DiagnosisResult,
  CommunicationStatus,
  Status,
  PortTypes,
  AreaTypes,
  SignalStrengthTypes,
  SituationTypes,
  EthernetTypes,
  LinkModeTypes,
} from '@/api/healthDiagnosis/constants'

export type DiagnosisResultType = (typeof DiagnosisResult)[keyof typeof DiagnosisResult]
export type CommunicationStatusType = (typeof CommunicationStatus)[keyof typeof CommunicationStatus]
export type StatusType = (typeof Status)[keyof typeof Status]
type PortType = (typeof PortTypes)[keyof typeof PortTypes]
export type AreaType = (typeof AreaTypes)[keyof typeof AreaTypes]
export type SignalStrengthType = (typeof SignalStrengthTypes)[keyof typeof SignalStrengthTypes]
export type SituationType = (typeof SituationTypes)[keyof typeof SituationTypes]
export type EthernetType = (typeof EthernetTypes)[keyof typeof EthernetTypes]
export type LinkModeType = (typeof LinkModeTypes)[keyof typeof LinkModeTypes]

export type LanPortType = {
  name: string
  status: 'up' | 'down'
  autoNegotiation?: 'on' | 'off'
  ethernetType?: EthernetType
  linkMode?: LinkModeType
}

export type WanPortType = {
  type: PortType
  name: string
  status?: 'up' | 'down'
  area?: AreaType
  signalStrength?: SignalStrengthType
  situation: SituationType
  autoNegotiation?: 'on' | 'off'
  ethernetType?: EthernetType
  linkMode?: LinkModeType
}

type HealthDiagnosisCommunicationStatus = {
  circuitType: CircuitType
  situation: SituationType
  status: CommunicationStatusType
}
export type HealthDiagnosisResponseBody = {
  terminalId: string
  currentDatetime: string
  lastBootDatetime: string
  operatingTime: string
  lanPorts?: LanPortType[]
  wanPorts?: WanPortType[]
  communicationStatus: HealthDiagnosisCommunicationStatus[]
  customerEquipmentStatus: StatusType
  terminalStatus: StatusType
  mobileWanStatus?: StatusType
  ipoeOnuStatus?: StatusType
  ipoeWanStatus?: StatusType
  guaranteeWanStatus?: StatusType
  guaranteeOnuStatus?: StatusType
  internetStatus: StatusType
  vpnStatus?: StatusType
  ficRouterStatus?: StatusType
  diagnosisResults: DiagnosisResultType[]
}
export type HealthDiagnosisResponse = {
  requestId: string
  completed: boolean
  completedTime: string
  responseBody?: HealthDiagnosisResponseBody
}

export type HealthDiagnosisRequestIdResponse = {
  completed: boolean
  requestId: string
  requestTime: string
}
