export const DiagnosisResult = {
  TerminalApiNg: 'terminalApiNg',
  TerminalLanPortDown: 'terminalLanPortDown',
  TerminalWanPortUp: 'terminalWanPortUp',
  TerminalWanPortDown: 'terminalWanPortDown',
  TerminalSimUnrecognizable: 'terminalSimUnrecognizable',
  TerminalSimNoSignal: 'terminalSimNoSignal',
  TerminalHeavyLoad: 'terminalHeavyLoad',
  TerminalHighTemperature: 'terminalHighTemperature',
  TerminalAllOk: 'terminalAllOk',
  GuaranteeNg: 'guaranteeNg',
  GuaranteeInternetBgpWarning: 'guaranteeInternetBgpWarning',
  GuaranteeInternetBgpNg: 'guaranteeInternetBgpNg',
  GuaranteeVpnBgpWarning: 'guaranteeVpnBgpWarning',
  GuaranteeVpnBgpNg: 'guaranteeVpnBgpNg',
  GuaranteeOnuAccessDown: 'guaranteeOnuAccessDown',
  GuaranteeOnuRinhDown: 'guaranteeOnuRinhDown',
  GuaranteeOnuUniDown: 'guaranteeOnuUniDown',
  IpoeNg: 'ipoeNg',
  MobileNg: 'mobileNg',
  IpsecNg: 'ipsecNg',
  FicBgpNg: 'ficBgpNg',
  FicBgpMaxPrefixExceeded: 'ficBgpMaxPrefixExceeded',
  FicBgpWarning: 'ficBgpWarning',
  // Switchover系はAPIレスポンスには存在しないが、迂回中の状態を表すために追加
  SwitchoverInProgress: 'switchoverInProgress',
  SwitchoverGuaranteeInternetBgpNg: 'switchoverGuaranteeInternetBgpNg',
  SwitchoverGuaranteeVpnBgpNg: 'switchoverGuaranteeVpnBgpNg',
  NoAlert: 'noAlert',
} as const
export const DiagnosisResultsURL = {
  terminalApiNg: 'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#id29',
  terminalLanPortDown: 'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#id30',
  terminalWanPortUp: 'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#wan',
  terminalWanPortDown: 'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#wan',
  terminalSimUnrecognizable: 'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#id10',
  terminalSimNoSignal: 'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#id10',
  terminalHeavyLoad: 'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#id27',
  terminalHighTemperature: 'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#id28',
  guaranteeInternetBgpWarning: 'https://sdpf.ntt.com/service-status/',
  guaranteeInternetBgpNg: 'https://sdpf.ntt.com/service-status/',
  guaranteeVpnBgpWarning: 'https://sdpf.ntt.com/service-status/',
  guaranteeVpnBgpNg: 'https://sdpf.ntt.com/service-status/',
  guaranteeBgpMaxPrefixExceeded:
    'https://sdpf.ntt.com/services/docs/rink/tutorials/portal/monitoring/maintenance.html#id1',
  guaranteeOnuAccessDown: 'https://sdpf.ntt.com/service-status/',
  guaranteeOnuRinhDown: '',
  guaranteeOnuUniDown:
    'https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#communication-cable-iwan',
  ipoeNg: {
    east: 'https://flets.com/customer/const2/',
    west: 'http://www.info-construction.ntt-west.co.jp/info-report/ku010/kU010010/',
  },
  mobileNg: 'https://www.docomo.ne.jp/info/status/',
  ipsecNg: 'https://sdpf.ntt.com/service-status/',
  ficBgpNg: 'https://sdpf.ntt.com/service-status/',
  ficBgpMaxPrefixExceeded: 'https://sdpf.ntt.com/services/docs/rink/service-descriptions/menu/option_detail/fic.html#',
  ficBgpWarning: 'https://sdpf.ntt.com/service-status/',
  switchoverInProgress: 'https://sdpf.ntt.com/services/docs/rink/tutorials/portal/iwan_maintenance.html',
  switchoverGuaranteeInternetBgpNg:
    'https://sdpf.ntt.com/services/docs/rink/tutorials/portal/iwan_maintenance.html#maintenance-delete',
  switchoverGuaranteeVpnBgpNg:
    'https://sdpf.ntt.com/services/docs/rink/tutorials/portal/iwan_maintenance.html#maintenance-delete',
} as const
export const CommunicationStatus = {
  OK: 'ok',
  NG: 'ng',
} as const
export const Status = {
  OK: 'ok',
  NG: 'ng',
  Warning: 'warning',
} as const

export const PortTypes = {
  Ethernet: 'ethernet',
  Wireless: 'wireless',
} as const
export const AreaTypes = {
  Lte: 'lte',
  FiveG: '5g',
  Unknown: 'unknown',
}
export const SignalStrengthTypes = {
  NoSignal: 'noSignal',
  VeryWeak: 'veryWeak',
  Weak: 'weak',
  Medium: 'medium',
  Strong: 'strong',
} as const
export const SituationTypes = {
  Main: 'main',
  Backup: 'backup',
} as const
export const EthernetTypes = {
  '1000Base-T': '1000base-t',
  '100Base-TX': '100base-tx',
  '10Base-T': '10base-t',
  '10GBase-T': '10gbase-t',
  '5GBase-T': '5gbase-t',
  '2.5GBase-T': '2.5gbase-t',
} as const

export const LinkModeTypes = {
  Full: 'full',
  Half: 'half',
} as const
