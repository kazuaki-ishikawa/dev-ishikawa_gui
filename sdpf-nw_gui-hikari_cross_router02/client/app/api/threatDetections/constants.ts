export const ThreatLevelTypes = {
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
  Information: 'Information',
  Other: 'Other',
} as const

export const ThreatTypes = ['APT', 'Malware', 'Phishing', 'C2', 'Exploit', 'Other'] as const

export const BlockingStatusTypes = {
  Blocked: 'blocked',
  NoBlocked: 'noBlocked',
  UnBlockable: 'unBlockable',
  AutoBlocked: 'autoBlocked',
} as const

export const CircuitPriorityTypes = {
  Main: 'main',
  Backup: 'backup',
} as const

export const TrafficDirectionTypes = {
  In: 'in',
  Out: 'out',
} as const

export const LineTypes = {
  Internet: 'internet',
  Vpn: 'vpn',
} as const

export const BlockingStatusOptionTypes = {
  Blocked: 'blocked',
  NoBlocked: 'noBlocked',
  NotApplicable: 'notApplicable',
} as const
export const DetectionTypes = {
  IpAddress: 'ipAddress',
  Domain: 'domain',
  Signature: 'signature',
} as const
