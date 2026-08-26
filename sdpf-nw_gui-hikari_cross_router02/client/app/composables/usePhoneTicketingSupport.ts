import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { OrderStatusTypes } from '@/api/constants'
import type {
  PhoneTicketingSupportResponse,
  PhoneTicketingSupportPostRequest,
  PhoneTicketingSupportPutRequest,
  PhoneTicketingSupportDeleteRequest,
} from '@/api/phoneTicketingSupport/types'

export const PhoneTicketingSupportStatus = {
  Creating: 'creating', // 申し込みが完了し利用開始を待っている状態
  Created: 'created', // 利用開始日を過ぎ利用中の状態
  Deleting: 'deleting', // 廃止申し込み後、廃止日を待っている状態
  Deleted: 'deleted', // 廃止された状態(= 申し込み前の状態)
} as const

export const useGetPhoneTicketingSupport = () => {
  const { API } = useAPI()

  const phoneTicketingSupport = ref<PhoneTicketingSupportResponse | null>(null)
  const getPhoneTicketingSupport = async () => {
    try {
      const response = await API.GET<PhoneTicketingSupportResponse>('settings/phone-ticketing-support')
      phoneTicketingSupport.value = response
      return response
    } catch (error) {
      phoneTicketingSupport.value = null
      throw error
    }
  }

  const editable = computed(
    () =>
      !!phoneTicketingSupport.value &&
      (!phoneTicketingSupport.value?.orderStatus ||
        phoneTicketingSupport.value.orderStatus === OrderStatusTypes.Completed),
  )

  const status = computed(() => {
    if (!phoneTicketingSupport.value?.effectiveDate) {
      return PhoneTicketingSupportStatus.Deleted
    }

    const isBeforeEffectiveDate = dayjs().isBefore(phoneTicketingSupport.value.effectiveDate, 'day')

    if (phoneTicketingSupport.value.enabled) {
      if (isBeforeEffectiveDate) {
        return PhoneTicketingSupportStatus.Deleting
      } else {
        return PhoneTicketingSupportStatus.Created
      }
    }

    if (isBeforeEffectiveDate) {
      return PhoneTicketingSupportStatus.Creating
    } else {
      return PhoneTicketingSupportStatus.Deleted
    }
  })

  return { phoneTicketingSupport, getPhoneTicketingSupport, editable, status }
}

export const useCreatePhoneTicketingSupport = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const createPhoneTicketingSupport = async (request: Required<PhoneTicketingSupportPostRequest>) => {
    const response = await API.POST<PhoneTicketingSupportResponse, Required<PhoneTicketingSupportPostRequest>>(
      'settings/phone-ticketing-support',
      { body: request },
    )
    setNotificationMessageState({ message: t('phoneTicketingSupport.registered') })
    return response
  }

  return { createPhoneTicketingSupport }
}

export const useUpdatePhoneTicketingSupport = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const updatePhoneTicketingSupport = async (request: Required<PhoneTicketingSupportPutRequest>) => {
    const response = await API.PUT<PhoneTicketingSupportResponse, Required<PhoneTicketingSupportPutRequest>>(
      'settings/phone-ticketing-support',
      { body: request },
    )
    setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })
    return response
  }

  return { updatePhoneTicketingSupport }
}

export const useDeletePhoneTicketingSupport = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deletePhoneTicketingSupport = async (request: Required<PhoneTicketingSupportDeleteRequest>) => {
    const response = await API.DELETE<PhoneTicketingSupportResponse, Required<PhoneTicketingSupportDeleteRequest>>(
      'settings/phone-ticketing-support',
      { body: request },
    )
    setNotificationMessageState({ message: t('phoneTicketingSupport.deleted') })
    return response
  }

  return { deletePhoneTicketingSupport }
}
