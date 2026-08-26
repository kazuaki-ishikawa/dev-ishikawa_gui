import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import type {
  TenantReferenceAuthKeyRequest,
  TenantReferenceAuthKeyResponse,
  TenantReferenceAuthKeySearchRequest,
  TenantReferenceAuthKeySearchResponse,
} from '@/api/tenantReferenceAuthKey/types'

export const useCreateTenantReferenceAuthKey = () => {
  const { API } = useAPI()

  const createTenantReferenceAuthKey = async (request: TenantReferenceAuthKeyRequest) => {
    const response = await API.POST<TenantReferenceAuthKeyResponse, TenantReferenceAuthKeyRequest>(
      'settings/tenant-reference-auth-key',
      { body: request },
    )
    return response
  }

  return { createTenantReferenceAuthKey }
}

export const useTenantReferenceAuthKeySearch = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const tenantReferenceAuthKeySearchResponse = ref<TenantReferenceAuthKeySearchResponse>()
  const tenantReferenceAuthKeySearch = async (request: TenantReferenceAuthKeySearchRequest) => {
    try {
      const response = await API.POST<TenantReferenceAuthKeySearchResponse, TenantReferenceAuthKeySearchRequest>(
        'settings/tenant-reference-auth-key/search',
        { body: request, suppressErrorDialog: true },
      )
      tenantReferenceAuthKeySearchResponse.value = response
      return response
    } catch (e) {
      const error = e as ErrorResponse
      if (error.statusCode === 403) {
        setNotificationMessageState({ message: t('threatDetectionStartSharing.message.expiredAuthKey') })
      } else {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      tenantReferenceAuthKeySearchResponse.value = undefined
      throw error
    }
  }

  return { tenantReferenceAuthKeySearchResponse, tenantReferenceAuthKeySearch }
}
