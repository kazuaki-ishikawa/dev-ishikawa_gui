import type { ServiceClosedDaysServiceTypes } from '@/api/serviceClosedDays/constants'

export type ServiceClosedDaysServiceType =
  (typeof ServiceClosedDaysServiceTypes)[keyof typeof ServiceClosedDaysServiceTypes]

export type ServiceClosedDaysResponse = {
  service: ServiceClosedDaysServiceType
  closedDays: string[]
}
