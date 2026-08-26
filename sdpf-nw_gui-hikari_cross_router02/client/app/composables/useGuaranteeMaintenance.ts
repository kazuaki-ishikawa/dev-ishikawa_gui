import type { GuaranteeMaintenancesType, GuaranteeMaintenanceResponse } from '@/api/guaranteeMaintenance/types'

export const useGuaranteeMaintenance = () => {
  const { API } = useAPI()

  const maintenances = ref<GuaranteeMaintenancesType[]>([])
  const getGuaranteeMaintenance = async (query?: { guaranteeId?: string }) => {
    try {
      const response = await API.GET<GuaranteeMaintenanceResponse, { guaranteeId?: string }>('guarantee-maintenance', {
        query,
      })
      maintenances.value = response.maintenances
      return response
    } catch (error) {
      maintenances.value = []
      throw error
    }
  }

  return { maintenances, getGuaranteeMaintenance }
}
