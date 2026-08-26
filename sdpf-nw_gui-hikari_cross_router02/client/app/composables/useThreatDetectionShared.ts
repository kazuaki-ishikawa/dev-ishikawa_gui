import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import {
  ThreatDetectionSharedRequestStatusTypes,
  ThreatDetectionSharedBillingMethodTypes,
  ThreatDetectionSharedRequestTypes,
} from '@/api/threatDetectionShared/constants'
import type {
  ThreatDetectionsSharedRequestResponse,
  ThreatDetectionSharedRequestListQuery,
  ThreatDetectionSharedRequestListResponse,
  ThreatDetectionSharedTenantListQuery,
  ThreatDetectionSharedTenantListResponse,
  ThreatDetectionSharedRequestPostRequest,
  ThreatDetectionSharedRequestPutRequest,
} from '@/api/threatDetectionShared/types'

export const useGetAllThreatDetectionSharedRequestList = () => {
  const { API } = useAPI()

  const threatDetectionSharedRequestList = ref<ThreatDetectionsSharedRequestResponse[]>([])
  const getAllThreatDetectionSharedRequestList = async (query?: { requestId?: string[] }) => {
    try {
      const response = await API.ALL<ThreatDetectionSharedRequestListResponse, { limit: number; requestId?: string[] }>(
        'threat-detection-shared/requests',
        { query: { limit: 100, ...query } },
      )
      threatDetectionSharedRequestList.value =
        response?.flatMap(val => (val ? val.threatDetectionsSharedRequests : [])) ?? []
      return response
    } catch (error) {
      threatDetectionSharedRequestList.value = []
      throw error
    }
  }

  return { threatDetectionSharedRequestList, getAllThreatDetectionSharedRequestList }
}

export const useGetThreatDetectionSharedRequestTableList = () => {
  const { API } = useAPI()

  const threatDetectionSharedRequestTableList = ref<ThreatDetectionSharedRequestListResponse>({
    offset: 0,
    total: 0,
    threatDetectionsSharedRequests: [],
  })
  const getThreatDetectionSharedRequestTableList = async (query: ThreatDetectionSharedRequestListQuery) => {
    try {
      const response = await API.GET<ThreatDetectionSharedRequestListResponse, ThreatDetectionSharedRequestListQuery>(
        'threat-detection-shared/requests',
        { query },
      )
      threatDetectionSharedRequestTableList.value = response
      return response
    } catch (error) {
      threatDetectionSharedRequestTableList.value = { offset: 0, total: 0, threatDetectionsSharedRequests: [] }
      throw error
    }
  }

  return { threatDetectionSharedRequestTableList, getThreatDetectionSharedRequestTableList }
}

export const useGetThreatDetectionSharedRequest = () => {
  const { API } = useAPI()

  const threatDetectionSharedRequest = ref<ThreatDetectionsSharedRequestResponse>()
  const getThreatDetectionSharedRequest = async (requestId: string) => {
    try {
      const response = await API.GET<ThreatDetectionsSharedRequestResponse>(
        `threat-detection-shared/requests/${requestId}`,
      )
      threatDetectionSharedRequest.value = response
      return response
    } catch (error) {
      threatDetectionSharedRequest.value = undefined
      throw error
    }
  }

  return { threatDetectionSharedRequest, getThreatDetectionSharedRequest }
}

export const usePostThreatDetectionSharedRequest = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const postThreatDetectionSharedRequest = async (request: ThreatDetectionSharedRequestPostRequest) => {
    try {
      const response = await API.POST<ThreatDetectionsSharedRequestResponse, ThreatDetectionSharedRequestPostRequest>(
        'threat-detection-shared/requests',
        { body: request, suppressErrorDialog: true },
      )
      if (request.requestType === ThreatDetectionSharedRequestTypes.Start) {
        setNotificationMessageState({ message: t('threatDetectionStartSharing.message.started') })
      }
      return response
    } catch (error) {
      if (request.requestType === ThreatDetectionSharedRequestTypes.Start) {
        // 開始の場合のみエラーメッセージを表示する
        // 停止の場合は呼び出し元で設定
        setNotificationMessageState({
          message: `${t('message.failed')}\n${errorFormat(error as ErrorResponse)}`,
        })
      }
      throw error
    }
  }

  return { postThreatDetectionSharedRequest }
}

export const usePutThreatDetectionSharedRequest = () => {
  const { API } = useAPI()

  const putThreatDetectionSharedRequest = async (data: {
    requestId: string
    request: ThreatDetectionSharedRequestPutRequest
    suppressErrorDialog?: boolean
  }) => {
    const response = await API.PUT<ThreatDetectionsSharedRequestResponse, ThreatDetectionSharedRequestPutRequest>(
      `threat-detection-shared/requests/${data.requestId}`,
      { body: data.request, suppressErrorDialog: data.suppressErrorDialog },
    )
    return response
  }

  return { putThreatDetectionSharedRequest }
}

export const useDeleteThreatDetectionSharedRequest = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteThreatDetectionSharedRequest = async (requestId: string) => {
    const response = await API.DELETE<ThreatDetectionsSharedRequestResponse>(
      `threat-detection-shared/requests/${requestId}`,
    )
    setNotificationMessageState({ message: t('threatDetectionShared.message.cancelled') })
    return response
  }

  return { deleteThreatDetectionSharedRequest }
}

export const useGetAllThreatDetectionSharedTenantList = () => {
  const { API } = useAPI()

  const allThreatDetectionSharedTenantList = ref<ThreatDetectionSharedTenantListResponse | null>(null)
  const getAllThreatDetectionSharedTenantList = async (query?: ThreatDetectionSharedTenantListQuery) => {
    try {
      const response = await API.ALL<
        ThreatDetectionSharedTenantListResponse,
        ThreatDetectionSharedTenantListQuery & { limit: number }
      >('threat-detection-shared/tenants', { query: { ...query, limit: 100 } })

      allThreatDetectionSharedTenantList.value = {
        limit: 100,
        offset: 0,
        total: response?.[0]?.total ?? 0,
        terminals: response?.flatMap(val => (val ? val.terminals : [])) ?? [],
      }

      return response
    } catch (error) {
      allThreatDetectionSharedTenantList.value = null
      throw error
    }
  }

  const tenantIdOptions = computed(() => {
    const tenants = new Map<string, string>(
      allThreatDetectionSharedTenantList.value?.terminals?.map(item => [
        item.sharedTenantId,
        `${item.contractorName} / ${item.sharedTenantId}`,
      ]) ?? [],
    )
    return Array.from(tenants).map(([value, text]) => ({ text, value }))
  })

  const terminalIdOptions = computed(() => {
    const list = new Map<string, string>(
      allThreatDetectionSharedTenantList.value?.terminals?.map(item => [
        item.terminalId,
        `${item.terminalId} / ${item.customerNote}`,
      ]) ?? [],
    )
    return Array.from(list).map(([value, text]) => ({ text, value }))
  })

  return {
    allThreatDetectionSharedTenantList,
    getAllThreatDetectionSharedTenantList,
    tenantIdOptions,
    terminalIdOptions,
  }
}

export const useGetThreatDetectionSharedTenantList = () => {
  const { API } = useAPI()

  const threatDetectionSharedTenantList = ref<ThreatDetectionSharedTenantListResponse | null>(null)
  const getThreatDetectionSharedTenantList = async (query?: ThreatDetectionSharedTenantListQuery) => {
    try {
      const response = await API.GET<ThreatDetectionSharedTenantListResponse, ThreatDetectionSharedTenantListQuery>(
        'threat-detection-shared/tenants',
        { query },
      )
      threatDetectionSharedTenantList.value = response
      return response
    } catch (error) {
      threatDetectionSharedTenantList.value = null
      throw error
    }
  }

  return { threatDetectionSharedTenantList, getThreatDetectionSharedTenantList }
}

export const useThreatDetectionShared = () => {
  const { t } = useI18n()

  const requestStatusOptions = Object.values(ThreatDetectionSharedRequestStatusTypes).map(value => ({
    text: t(`threatDetectionShared.status.${value}`),
    value,
  }))
  const billingMethodOptions = Object.values(ThreatDetectionSharedBillingMethodTypes).map(value => ({
    text: t(`threatDetectionShared.billingMethod.${value}`),
    value,
  }))
  const requestTypeOptions = Object.values(ThreatDetectionSharedRequestTypes).map(value => ({
    text: t(`threatDetectionShared.requestType.${value}`),
    value,
  }))

  const checkStoppedStatus = (request?: ThreatDetectionsSharedRequestResponse) => {
    return (
      // 停止リクエスト の場合は停止済みとみなす
      request?.requestType === ThreatDetectionSharedRequestTypes.Stop
    )
  }
  const getRequestStatusText = (request?: ThreatDetectionsSharedRequestResponse) => {
    const isStopped = checkStoppedStatus(request)
    const found = requestStatusOptions.find(option => option.value === request?.status)
    return isStopped ? t('threatDetectionShared.status.stopped') : (found?.text ?? '')
  }
  const getBillingMethodText = (value?: string) => {
    const found = billingMethodOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getRequestTypeText = (value?: string) => {
    const found = requestTypeOptions.find(option => option.value === value)
    return found ? `${found.text}${t('threatDetectionShared.request')}` : ''
  }

  return {
    requestStatusOptions,
    billingMethodOptions,
    checkStoppedStatus,
    getRequestStatusText,
    getBillingMethodText,
    getRequestTypeText,
  }
}
