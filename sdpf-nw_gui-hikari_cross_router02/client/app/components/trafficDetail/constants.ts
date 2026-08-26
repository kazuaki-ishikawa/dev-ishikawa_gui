export const TRAFFIC_DETAIL_LINK = {
  CHANGE_IWAN: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_iwan.html',
  CHANGE_LBO: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_lbo.html',
  CHANGE_TRAFFIC: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_traffic.html',
  OPTION_DETAIL_LBO: 'https://sdpf.ntt.com/services/docs/rink/service-descriptions/menu/option_detail/lbo.html',
} as const

export const BpsTypes = {
  Out: 'out',
  In: 'in',
} as const
export const GraphContentsTypes = {
  Traffic: 'traffic',
  UtilizationRate: 'utilization',
} as const

export const ChartStyleTypes = {
  Area: 'area',
  Line: 'line',
} as const
export const ChartUnitTypes = {
  BitPerSec: 'bps',
  PacketPerSec: 'pps',
} as const

export const OnlyFlowRankQueryKeyList = ['top', 'direction'] as const
export const CommonQueryKeyList = ['periodType', 'startTime', 'endTime', 'interval'] as const

export const ProtocolIdNameMap: Record<string, string> = {
  0: 'ip',
  1: 'icmp',
  2: 'igmp',
  3: 'ggp',
  4: 'ipencap',
  5: 'st',
  6: 'tcp',
  7: 'cbt',
  8: 'egp',
  9: 'igp',
  10: 'bbn-rcc-mon',
  11: 'nvp-ii',
  12: 'pup',
  13: 'argus',
  17: 'udp',
  20: 'hmp',
  22: 'xns-idp',
  27: 'rdp',
  29: 'iso-tp4',
  33: 'dccp',
  36: 'xtp',
  37: 'ddp',
  38: 'idpr-cmtp',
  41: 'ipv6',
  43: 'ipv6-route',
  44: 'ipv6-frag',
  45: 'idrp',
  46: 'rsvp',
  47: 'gre',
  50: 'esp',
  51: 'ah',
  57: 'skip',
  58: 'ipv6-icmp',
  59: 'ipv6-nonxt',
  60: 'ipv6-opts',
  73: 'rspf',
  81: 'vmtp',
  88: 'eigrp',
  89: 'ospf',
  93: 'ax.25',
  94: 'ipip',
  97: 'etherip',
  98: 'encap',
  103: 'pim',
  108: 'ipcomp',
  112: 'vrrp',
  115: 'l2tp',
  124: 'isis',
  132: 'sctp',
  133: 'fc',
  135: 'mobility-header',
  136: 'udplite',
  137: 'mpls-in-ip',
  138: 'manet',
  139: 'hip',
  140: 'shim6',
  141: 'wesp',
  142: 'rohc',
}
