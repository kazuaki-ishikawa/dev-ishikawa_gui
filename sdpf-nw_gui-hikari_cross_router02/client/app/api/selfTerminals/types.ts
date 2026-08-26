import type { CircuitTypes } from '@/api/constants'
import type {
  ResourceStatusType,
  OrderStatusType,
  TrafficReportFlowAnalyzerType,
  TerminalFlowCollectorResponseType,
  TerminalFlowCollectorRequestType,
  TerminalThreatDetectionType,
  TerminalBehaviorDetectionType,
} from '@/api/types'
import type { VpnRouteLimitList } from '@/api/selfTerminals/constants'

type VpnRouteLimitType = (typeof VpnRouteLimitList)[number]
type SelfTerminalGuaranteeRequestType = {
  guaranteeId: string
  internet: {
    advertise: boolean
    pingMonitoring?: boolean
  }
  vpn?: {
    act?: {
      connectedIpv4Prefix: string | null
    }
    sby?: {
      connectedIpv4Prefix: string | null
    }
  }
}

type SelfTerminalGuaranteeResponseActSbyType = {
  connectedIpv4Prefix: string
  peConnectedIPv4Address: string
  cpeConnectedIpv4Address: string
  vlan: number
}
type SelfTerminalGuaranteeResponseType = {
  guaranteeId: string
  internet?: {
    advertise: boolean
    pingMonitoring?: boolean
    globalIpAddress?: string
    act?: SelfTerminalGuaranteeResponseActSbyType
    sby?: SelfTerminalGuaranteeResponseActSbyType
  }
  vpn?: {
    act: SelfTerminalGuaranteeResponseActSbyType
    sby: SelfTerminalGuaranteeResponseActSbyType
  }
}

export type SelfTerminalPostRequest = {
  customerNote: string
  installationPostalCode: string
  installationAddress: string
  primaryCircuitType: typeof CircuitTypes.Guarantee
  vpnId?: string
  vpnRouteLimit?: VpnRouteLimitType
  vpnAdvertiseNetworks?: string[]
  guarantee: SelfTerminalGuaranteeRequestType
  trafficReportFlowAnalyzer: TrafficReportFlowAnalyzerType
  threatDetection: TerminalThreatDetectionType
  flowCollector: TerminalFlowCollectorRequestType
  behaviorDetection: TerminalBehaviorDetectionType
}

export type SelfTerminalPutRequest = {
  customerNote?: string
  installationPostalCode?: string
  installationAddress?: string
  primaryCircuitType?: typeof CircuitTypes.Guarantee
  vpnId?: string | null
  vpnRouteLimit?: VpnRouteLimitType
  vpnAdvertiseNetworks?: string[]
  guarantee?: {
    guaranteeId?: string
    internet?: {
      advertise: boolean
      pingMonitoring: boolean
    }
    vpn?: {
      act?: {
        connectedIpv4Prefix?: string | null
      }
      sby?: {
        connectedIpv4Prefix?: string | null
      }
    }
  }
  trafficReportFlowAnalyzer?: Partial<TrafficReportFlowAnalyzerType>
  threatDetection?: TerminalThreatDetectionType
  flowCollector?: TerminalFlowCollectorRequestType
  behaviorDetection?: TerminalBehaviorDetectionType
}

export type SelfTerminalResponse = {
  terminalId: string
  ref: string
  tenantId: string
  resourceStatus: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime: string
  serviceStartTime: string
  customerNote: string
  installationPostalCode?: string
  installationAddress?: string
  vpnId?: string
  asNumber?: string
  vpnRouteLimit?: VpnRouteLimitType
  vpnAdvertiseNetworks?: string[]
  guarantee: SelfTerminalGuaranteeResponseType
  primaryCircuit: {
    circuitType: typeof CircuitTypes.Guarantee
    circuitId: string
    ref?: string
  }
  trafficReportFlowAnalyzer: TrafficReportFlowAnalyzerType
  threatDetection: TerminalThreatDetectionType
  flowCollector: TerminalFlowCollectorResponseType
  behaviorDetection: TerminalBehaviorDetectionType
}
