export const FlowCollectorPeriodTypes = {
  CurrentMonth: 'currentMonth',
  Last1Month: 'last1month',
  Last3Months: 'last3months',
  Last6Months: 'last6months',
  Last12Months: 'last12months',
  Free: 'free',
} as const

export const TrafficFlowCircuitTypes = {
  Guarantee: 'guarantee',
  Ipoe: 'ipoe',
  Mobile: 'mobile',
  Vpn: 'vpn',
} as const

export const DisplayCircuitTypes = {
  Main: 'main',
  Backup: 'backup',
  Both: 'both',
} as const

export const DisplayAggregationMethodTypes = {
  Daily: 'daily',
  Cumulative: 'cumulative',
} as const

export const TrafficFlowDownloadRequestStatusTypes = {
  Processing: 'processing',
  Completed: 'completed',
  Aborted: 'aborted',
} as const
