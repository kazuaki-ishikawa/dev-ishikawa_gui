import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import type { GmoApiKeyPostRequest, GmoApiKeyResponse } from '@/api/gmoApiKey/types'

export const useGmoApiKey = () => {
  const { IDAAS_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const gmoApiKey = ref<GmoApiKeyResponse>()

  const getGmoApiKey = async () => {
    try {
      const response = await IDAAS_API.GET<GmoApiKeyResponse>('gmo-api-key', { suppressErrorDialog: true })
      gmoApiKey.value = response
      return response
    } catch (e) {
      const error = e as ErrorResponse
      // 404は未登録のためダイアログを表示しない
      if (error.statusCode !== 404) {
        setNotificationMessageState({
          message: `${t('message.failed')}\n${errorFormat(error)}`,
        })
      }
      gmoApiKey.value = undefined
      throw error
    }
  }
  const createGmoApiKey = async (request: GmoApiKeyPostRequest) => {
    const { isNovaView } = useNova()
    try {
      const response = await IDAAS_API.POST<GmoApiKeyResponse, GmoApiKeyPostRequest>('gmo-api-key', {
        body: request,
        suppressErrorDialog: true,
      })
      gmoApiKey.value = response
      return response
    } catch (error) {
      if (!isNovaView.value) {
        setNotificationMessageState({ message: t('idaas.message.createApiKeyFailed') })
      }
      throw error
    }
  }
  const deleteGmoApiKey = async (id: string) => {
    const { isNovaView } = useNova()

    await IDAAS_API.DELETE(`gmo-api-key/${id}`)
    if (!isNovaView.value) {
      setNotificationMessageState({ message: t('idaas.message.deleted') })
    }
    gmoApiKey.value = undefined
  }

  return {
    gmoApiKey,
    getGmoApiKey,
    createGmoApiKey,
    deleteGmoApiKey,
  }
}
