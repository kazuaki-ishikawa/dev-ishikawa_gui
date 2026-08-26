import { useI18n } from 'vue-i18n'
import type { ContractorResponse, ContractorPutRequest } from '@/api/contractor/types'

export const useGetContractor = () => {
  const { API } = useAPI()

  const contractor = ref<ContractorResponse>()
  const getContractor = async () => {
    try {
      const response = await API.GET<ContractorResponse>('settings/contractor')
      contractor.value = response
      return response
    } catch (error) {
      contractor.value = undefined
      throw error
    }
  }

  return { contractor, getContractor }
}

export const useUpdateContractor = (isFirstContract: boolean) => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const updateContractor = async (data: ContractorPutRequest) => {
    const request = {
      ...data,
      address: convertHyphen(data.address ?? ''),
      houseNumber: convertHyphen(data.houseNumber ?? ''),
      buildingName: data.buildingName ? convertHyphen(data.buildingName) : null,
      addressKana: convertHyphen(data.addressKana ?? ''),
    }
    const response = await API.PUT<ContractorResponse, ContractorPutRequest>('settings/contractor', { body: request })
    const notification = isFirstContract
      ? { message: t('message.registered') }
      : { message: t('message.accepted'), orderId: response.orderId }
    setNotificationMessageState(notification)
    return response
  }

  return { updateContractor }
}
