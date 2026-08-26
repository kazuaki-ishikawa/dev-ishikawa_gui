import type { OrderStatusType } from '@/api/types'

export type SecurityHelpDeskResponse = {
  enabled: boolean
  orderId?: string
  orderStatus?: OrderStatusType
  effectiveDate?: string
  supportUrl?: string
  supportEmail?: string
  supportedTerminalCount: number
}
