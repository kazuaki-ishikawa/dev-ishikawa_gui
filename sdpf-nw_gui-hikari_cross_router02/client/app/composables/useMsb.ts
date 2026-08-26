import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type {
  MsbLicensesResponse,
  MsbResponse,
  MsbLicensePackType,
  MsbThreatNoticeResponse,
  MsbPostRequest,
  MsbPostResponse,
  MsbPatchResponse,
  MsbPatchRequest,
  MsbDeleteRequest,
  MsbDeleteResponse,
} from '@/api/msb/types'
import type { ErrorResponse } from '@/api/types'

export const useGetMsb = () => {
  const { MSB_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const msb = ref<MsbResponse | null>(null)
  const getMsb = async ({ showNotFoundError = false }: { showNotFoundError?: boolean } = {}) => {
    try {
      const response = await MSB_API.GET<MsbResponse>('rink-msb-contracts', { suppressErrorDialog: true })
      msb.value = response
      return response
    } catch (e) {
      msb.value = null
      const error = e as ErrorResponse
      if (error.statusCode === 404 && showNotFoundError) {
        setNotificationMessageState({ message: `${t('message.failed')}\n${t('msb.message.notFound')}` })
      } else if (error.statusCode !== 404) {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      throw error
    }
  }

  return { msb, getMsb }
}

export const useCreateMsb = () => {
  const { MSB_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const createMsb = async (request: MsbPostRequest) => {
    const response = await MSB_API.POST<MsbPostResponse, MsbPostRequest>('rink-msb-contracts', { body: request })
    setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })

    return response
  }

  return { createMsb }
}

export const useDeleteMsb = () => {
  const { MSB_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteMsb = async (resourceId: string, request: MsbDeleteRequest) => {
    const response = await MSB_API.DELETE<MsbDeleteResponse, MsbDeleteRequest>(`rink-msb-contracts/${resourceId}`, {
      body: request,
    })
    setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })
    return response
  }

  return { deleteMsb }
}

export const useGetMsbLicenses = () => {
  const { MSB_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const msbLicenses = ref<MsbLicensesResponse | null>(null)
  const getMsbLicenses = async (resourceId: string) => {
    try {
      const response = await MSB_API.GET<MsbLicensesResponse>(`rink-msb-contracts/${resourceId}/licenses`, {
        suppressErrorDialog: true,
      })
      msbLicenses.value = response
      return response
    } catch (e) {
      const error = e as ErrorResponse
      if (error.statusCode === 404) {
        setNotificationMessageState({ message: `${t('message.failed')}\n${t('msb.message.notFound')}` })
      } else {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      throw error
    }
  }

  return { msbLicenses, getMsbLicenses }
}

export const useUpdateMsbLicenses = () => {
  const { MSB_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const updateMsbLicenses = async (resourceId: string, request: MsbPatchRequest) => {
    const response = await MSB_API.PATCH<MsbPatchResponse, MsbPatchRequest>(
      `rink-msb-contracts/${resourceId}/licenses`,
      { body: request },
    )
    setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })
    return response
  }

  return { updateMsbLicenses }
}

export const useGetMsbThreatNotice = () => {
  const { MSB_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const msbThreatNotice = ref<MsbThreatNoticeResponse | null>(null)
  const getMsbThreatNotice = async () => {
    try {
      const response = await MSB_API.GET<MsbThreatNoticeResponse>('threat-notice', { suppressErrorDialog: true })
      msbThreatNotice.value = response
      return response
    } catch (e) {
      msbThreatNotice.value = null
      const error = e as ErrorResponse
      if (error.statusCode !== 404) {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      throw error
    }
  }

  return { msbThreatNotice, getMsbThreatNotice }
}

export const useMsb = () => {
  const { t } = useI18n()

  const duringReceptionHours = computed(() => {
    const today = dayjs().tz()
    const day = today.day()
    // 平日の9:00〜16:00の場合
    if (day >= 1 && day <= 5) {
      return today.hour() >= 9 && today.hour() < 16
    }
    return false
  })

  const msbLicenseOptions = (max: number) =>
    Array.from({ length: max + 1 }, (_, i) => ({
      text: `${i}`,
      value: `${i}`,
    }))

  const getMsbLicensePackList = (licensePacks: MsbLicensePackType) => {
    if (!licensePacks) {
      return []
    }
    return (Object.keys(licensePacks) as Array<keyof MsbLicensePackType>).sort().map(key => ({
      key,
      label: t(`msb.licensePacks.${key}`),
      value: licensePacks[key],
    }))
  }

  return { msbLicenseOptions, getMsbLicensePackList, duringReceptionHours }
}
