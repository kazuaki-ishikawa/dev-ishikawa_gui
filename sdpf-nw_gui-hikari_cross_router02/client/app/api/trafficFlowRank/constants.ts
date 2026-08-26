export const MAX_ADDABLE_FILTER_NUBER = 10 as const

export const TrafficFlowRankTopTypes = {
  Top10: 10,
  Top100: 100,
} as const

export const TrafficFlowRankIntervalTypes = {
  Interval1Day: '1d',
  Interval15Minutes: '15m',
  Interval5Minutes: '5m',
} as const

export const TrafficFlowRankDirectionTypes = {
  In: 'in',
  Out: 'out',
} as const

export const TrafficFlowRankRankByTypes = {
  SourceIpAddress: 'sourceIpAddress',
  DestinationIpAddress: 'destinationIpAddress',
  SourcePort: 'sourcePort',
  DestinationPort: 'destinationPort',
  Protocol: 'protocol',
  ApplicationId: 'applicationId',
} as const
export const TrafficFlowRankTabValues = [
  TrafficFlowRankRankByTypes.ApplicationId,
  TrafficFlowRankRankByTypes.SourceIpAddress,
  TrafficFlowRankRankByTypes.DestinationIpAddress,
  TrafficFlowRankRankByTypes.SourcePort,
  TrafficFlowRankRankByTypes.DestinationPort,
  TrafficFlowRankRankByTypes.Protocol,
  'communication',
] as const
