import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import { RINK_MOBILE_ERROR_TEXT } from '@/api/rinkConnections/constants'
import type { RinkDeviceListQuery, RinkDeviceListResponse, RinkDevicePostRequest } from '@/api/rinkDevices/types'

export const useGetRinkDeviceTableList = () => {
  const { RINK_MOBILE_API } = useAPI()

  const rinkDeviceTableList = ref<RinkDeviceListResponse>({ total: 0, deviceList: [] })
  const getRinkDeviceTableList = async (rinkMobileId: string, query: { limit: number; page: number }) => {
    try {
      const { limit, page } = query
      const response = await RINK_MOBILE_API.GET<RinkDeviceListResponse, RinkDeviceListQuery>(
        `devices/self-add/${rinkMobileId}`,
        { query: { limit, offset: (page - 1) * limit } },
      )
      rinkDeviceTableList.value = response
      return response
    } catch (error) {
      rinkDeviceTableList.value = { total: 0, deviceList: [] }
      throw error
    }
  }

  return { rinkDeviceTableList, getRinkDeviceTableList }
}

export const usePostRinkDevices = () => {
  const { RINK_MOBILE_API } = useAPI()

  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const postRinkDevices = async (rinkMobileId: string, body: RinkDevicePostRequest) => {
    try {
      const response = await RINK_MOBILE_API.POST<{ id: string }, RinkDevicePostRequest>(
        `devices/self-add/${rinkMobileId}`,
        { body, suppressErrorDialog: true },
      )
      setNotificationMessageState({ message: t('message.finished'), isRinkMobile: true })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error?.data?.moreInfo === RINK_MOBILE_ERROR_TEXT.RECEPTION_IS_CLOSED
          ? t('rinkConnections.message.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { postRinkDevices }
}
