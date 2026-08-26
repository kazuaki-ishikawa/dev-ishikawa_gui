import { BehaviorDetectionOptionTypes, SecurityOptionTypes } from '../constants'
import type {
  TerminalBehaviorDetectionPlanType,
  TerminalFlowCollectorPlanType,
  TerminalThreatDetectionPlanType,
} from '../types'

export const SELF_TERMINAL_LINK = {
  TICKET: 'https://sdpf.ntt.com/services/docs/rink/tutorials/inquiry.html#ticket-use',
  BASE_SETTING: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/customer_router.html#basesetting',
  RESOURCE_SETTING:
    'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/customer_router.html#resourcesetting-iwan',
  PRICE: 'https://sdpf.ntt.com/services/rink/pricing/#ntt_price_list',
  CREATION_TERMS_LINK:
    'https://sdpf.ntt.com/services/docs/rink/service-descriptions/service_quality/conditions_of_provision.html#service-conditions',
} as const

export const VpnRouteLimitList = [35, 100, 200, 1000] as const

const initialSelfTerminalGuaranteeInputData = {
  guaranteeId: '',
  internetAdvertise: '',
  internetPingMonitoring: '',
  vpnActConnectedIpv4Prefix: '',
  vpnSbyConnectedIpv4Prefix: '',
}

export const initialSelfTerminalInputData = {
  customerNote: '',
  installationPostalCode: '',
  installationAddress: '',
  vpnId: '',
  vpnRouteLimit: '',
  vpnAdvertiseNetworks: [] as string[],
  guarantee: {
    ...initialSelfTerminalGuaranteeInputData,
  },
  trafficReportFlowAnalyzer: {
    trafficReportFlowAnalyzerPlan: '',
    trafficReportFlowAnalyzerAlert: '',
  },
  threatDetectionPlan: SecurityOptionTypes.Plan3Months as TerminalThreatDetectionPlanType,
  flowCollectorPlan: SecurityOptionTypes.NoSubscription as TerminalFlowCollectorPlanType,
  behaviorDetectionPlan: BehaviorDetectionOptionTypes.NoSubscription as TerminalBehaviorDetectionPlanType,
}
export const initialSelfTerminalValid = {
  customerNote: false,
  installationPostalCode: false,
  installationAddress: false,
  vpnId: true,
  vpnRouteLimit: true,
  vpnAdvertiseNetworks: true,
  guarantee: {
    guaranteeId: false,
    internetAdvertise: false,
    internetPingMonitoring: true,
    vpnActConnectedIpv4Prefix: true,
    vpnSbyConnectedIpv4Prefix: true,
  },
  trafficReportFlowAnalyzer: {
    trafficReportFlowAnalyzerPlan: false,
    trafficReportFlowAnalyzerAlert: true,
  },
  threatDetectionPlan: true,
  flowCollectorPlan: true,
  behaviorDetectionPlan: true,
}

export const initialTermsOfServiceAgreement = [
  { key: 'self-terminal' as const, value: false },
  { key: 'wan-security-options' as const, value: false },
  { key: 'traffic-report-flow-analyzer' as const, value: false },
]
