export type MobileResponse = {
  mobileDiscountCode?: string
  mobileTermsOfServiceAccepted: boolean
  mobileRepresentativeNumber?: string
  orderId?: string
}

export type MobilePutRequest = {
  mobileDiscountCode: string | null
}
