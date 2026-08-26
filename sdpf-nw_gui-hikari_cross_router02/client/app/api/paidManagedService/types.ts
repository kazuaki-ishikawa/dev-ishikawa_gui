export type PaidManagedServiceResponse = {
  pssReceiptNumber: string
  menuName: string
  teamInCharge: string
  personName: string
  mailAddress: string
  phoneNumber: string
  endDate: string
  remarks: string
}

export type PaidManagedServiceListResponse = {
  paidManagedService: PaidManagedServiceResponse[]
}
