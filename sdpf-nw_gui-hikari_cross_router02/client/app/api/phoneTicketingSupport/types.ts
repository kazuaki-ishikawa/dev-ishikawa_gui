import type { OrderStatusType } from '@/api/types'

export type PhoneTicketingSupportResponse = {
  enabled: boolean
  supportId?: string
  orderId?: string
  orderStatus?: OrderStatusType
  effectiveDate?: string
  picName?: string
  picPhoneNumber?: string
  supportPhoneNumber?: string
}

export type PhoneTicketingSupportPostRequest = {
  effectiveDate?: string
  picName: string
  picPhoneNumber: string
}

export type PhoneTicketingSupportPutRequest = {
  picName?: string
  picPhoneNumber?: string
}

export type PhoneTicketingSupportDeleteRequest = {
  effectiveDate?: string
}
