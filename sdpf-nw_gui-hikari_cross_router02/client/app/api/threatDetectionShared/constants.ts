export const ThreatDetectionSharedRequestStatusTypes = {
  PendingApproval: 'pendingApproval',
  Approved: 'approved',
  Rejected: 'rejected',
  Cancelled: 'cancelled',
} as const

export const ThreatDetectionSharedRequestDirectionTypes = {
  Sent: 'sent',
  Received: 'received',
} as const

export const ThreatDetectionSharedRequestTypes = {
  Start: 'threatDetectionShareRequest',
  Stop: 'threatDetectionStopShareRequest',
} as const

export const ThreatDetectionSharedBillingMethodTypes = {
  ReceiverPays: 'receiverPays',
  ProviderPays: 'providerPays',
  Split: 'split',
} as const

export const ThreatDetectionSharedRequestActionTypes = {
  Approve: 'approve',
  Reject: 'reject',
} as const

export const ThreatDetectionSharedTerminalDirectionTypes = {
  Provided: 'provided',
  Received: 'received',
} as const
