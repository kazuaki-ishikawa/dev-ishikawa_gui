import dayjs from 'dayjs'

const NOTIFICATION_START_AT = '2026-06-30T22:00:00+09:00'
const MAINTENANCE_START_AT = '2026-07-18T00:00:00+09:00'
const MAINTENANCE_END_AT = '2026-07-21T08:00:00+09:00'

export const useRinkMobileMaintenance = () => {
  const now = dayjs()

  const showRinkMobileMaintenanceNotification =
    now.isSameOrAfter(NOTIFICATION_START_AT) && now.isBefore(MAINTENANCE_END_AT)
  const disabledRinkMobileMaintenanceApplication =
    now.isSameOrAfter(MAINTENANCE_START_AT) && now.isBefore(MAINTENANCE_END_AT)

  return {
    showRinkMobileMaintenanceNotification,
    disabledRinkMobileMaintenanceApplication,
  }
}
