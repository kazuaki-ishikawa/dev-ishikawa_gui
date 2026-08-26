import type { UnoConnectionPostRequest } from '@/api/unoConnections/types'

// TODO(#17243): UNO 廃止チュートリアルの正式 URL が決まり次第差し替える（暫定）
export const UNO_URL = {
  ABOLITION_TUTORIAL: 'https://sdpf.ntt.com/services/rink/tutorials',
} as const
export const initialUnoConnectionCreateData: UnoConnectionPostRequest = {
  customerNote: '',
  vpnId: '',
  unoContractNumber: '',
  unoVpnId: '',
  unoApplicationDate: '',
}
