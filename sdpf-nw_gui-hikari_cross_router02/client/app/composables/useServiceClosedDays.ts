import type { ServiceClosedDaysServiceType, ServiceClosedDaysResponse } from '@/api/serviceClosedDays/types'

export const useServiceClosedDays = () => {
  const { API } = useAPI()

  const serviceClosedDays = ref<string[]>([])
  const serviceClosedDaysFetchFailed = ref(false)
  const getServiceClosedDays = async (service: ServiceClosedDaysServiceType) => {
    try {
      const response = await API.GET<ServiceClosedDaysResponse>(`service-closed-days/${service}`)
      serviceClosedDays.value = response.closedDays.toSorted()
      serviceClosedDaysFetchFailed.value = false
      return response
    } catch {
      serviceClosedDays.value = []
      serviceClosedDaysFetchFailed.value = true
    }
  }

  const serviceClosedDaysSet = computed(() => new Set(serviceClosedDays.value))
  const disabledDates = (date: Date) => {
    // 数100回呼ばれるので dayjs ではなく Date オブジェクトを使う
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return serviceClosedDaysSet.value.has(`${year}-${month}-${day}`)
  }

  return { getServiceClosedDays, disabledDates, serviceClosedDaysFetchFailed }
}
