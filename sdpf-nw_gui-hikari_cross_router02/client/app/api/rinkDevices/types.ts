import type { RinkMobileOrderTypes } from '@/api/orders/constants'
import type { OrderRinkLineDetailType } from '@/api/rinkLines/types'

export type RinkDeviceListQuery = {
  limit?: number
  offset?: number
}

type RinkDeviceType = {
  imei?: string
  orderDate?: string
  modelName?: string
}

export type RinkDeviceListResponse = {
  total?: number
  deviceList: RinkDeviceType[]
}

export type RinkDeviceLineType = {
  lineIndex: number
  deviceNameAlias?: string
}

export type RinkDevicePostRequest = {
  requestDate: string
  shippingPostalCode: string
  shippingPrefecture: string
  shippingCity: string
  shippingCityAdditionalInfo?: string
  shippingAddressBlock: string
  shippingAddressNumber: string
  shippingBuilding?: string
  packageRecipient: string
  phoneNumber: string
  linesList: RinkDeviceLineType[]
}

// オーダー用定義
export type OrderRinkDeviceRequest = {
  orderType: typeof RinkMobileOrderTypes.RinkDeviceCreate
  reservedCompletionDate?: string
  shippingPostalCode: string
  shippingPrefecture: string
  shippingCity: string
  shippingCityAdditionalInfo?: string
  shippingAddressBlock: string
  shippingAddressNumber: string
  shippingBuilding?: string
  packageRecipient: string
  phoneNumber: string
  orderDetailLine?: OrderRinkLineDetailType[]
}
