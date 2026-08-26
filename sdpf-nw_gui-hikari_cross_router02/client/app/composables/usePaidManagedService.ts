import type { PaidManagedServiceListResponse, PaidManagedServiceResponse } from '@/api/paidManagedService/types'

export const useGetPaidManagedService = () => {
  const { API } = useAPI()

  const paidManagedServiceList = ref<PaidManagedServiceResponse[]>([])
  const getPaidManagedService = async () => {
    try {
      const response = await API.GET<PaidManagedServiceListResponse>('settings/paid-managed-service')
      paidManagedServiceList.value = response.paidManagedService
      return response
    } catch (error) {
      paidManagedServiceList.value = []
      throw error
    }
  }

  return { paidManagedServiceList, getPaidManagedService }
}
