export const BREAK_OUT_LINK = {
  SERVICES: 'https://sdpf.ntt.com/services/rink/lbo_list/',
  CHANGE_LBO: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_lbo.html',
} as const

export const LIST_TOTAL_MAX_LENGTH = 1000 as const

export const initialBreakOutData = {
  customerNote: '',
  fqdnList: '',
  prefixList: '',
}
export const initialBreakOutValid = {
  customerNote: false,
  fqdnList: false,
  prefixList: false,
}
