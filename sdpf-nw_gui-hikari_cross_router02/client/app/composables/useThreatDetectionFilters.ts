import { useI18n } from 'vue-i18n'
import type {
  ThreatDetectionFiltersQuery,
  ThreatDetectionFiltersList,
  ThreatDetectionFiltersResponse,
  ThreatDetectionFiltersPutRequest,
  ThreatDetectionFiltersRemoveRequest,
  ThreatDetectionFiltersDataType,
} from '@/api/threatDetectionFilters/types'
import { OperationStatusTypes } from '@/api/threatDetectionFilters/constants'

export const useGetThreatDetectionFiltersTableList = () => {
  const { API } = useAPI()

  const threatDetectionFiltersQuery = ref<ThreatDetectionFiltersQuery>({ limit: 10, offset: 0 })
  const threatDetectionFiltersTableList = ref<ThreatDetectionFiltersList | null>(null)
  const getThreatDetectionFiltersTableList = async (query: ThreatDetectionFiltersQuery) => {
    try {
      threatDetectionFiltersQuery.value = query
      const response = await API.GET<ThreatDetectionFiltersList, ThreatDetectionFiltersQuery>(
        'threat-detection-filters',
        { query },
      )
      threatDetectionFiltersTableList.value = response
      return response
    } catch (error) {
      threatDetectionFiltersTableList.value = null
      throw error
    }
  }

  return { threatDetectionFiltersQuery, threatDetectionFiltersTableList, getThreatDetectionFiltersTableList }
}

export const useUpdateThreatDetectionFilters = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const { setLoadingState } = useLoading()

  const updateThreatDetectionFilters = async (
    request: Array<{ terminalId: string; filters: ThreatDetectionFiltersPutRequest[] }>,
  ) => {
    try {
      setLoadingState('start')
      const response = await Promise.all(
        request.map(req =>
          API.PUT<{ filters: ThreatDetectionFiltersResponse[] }, { filters: ThreatDetectionFiltersPutRequest[] }>(
            `threat-detection-filters/${req.terminalId}`,
            { body: { filters: req.filters } },
          ),
        ),
      )
      setNotificationMessageState({ message: t('threatDetections.message.acceptedBlocking') })
      return response
    } finally {
      setLoadingState('end')
    }
  }

  return { updateThreatDetectionFilters }
}

export const useDeleteThreatDetectionFilters = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const { setLoadingState } = useLoading()

  const deleteThreatDetectionFilters = async (request: ThreatDetectionFiltersDataType[]) => {
    try {
      setLoadingState('start')
      const response = await Promise.all(
        request.map(({ terminalId, filterIds }) =>
          API.DELETE<ThreatDetectionFiltersResponse, ThreatDetectionFiltersRemoveRequest>(
            `threat-detection-filters/${terminalId}`,
            { body: { filterIds } },
          ),
        ),
      )
      setNotificationMessageState({ message: t('threatDetectionFilters.message.unblocked') })
      return response
    } finally {
      setLoadingState('end')
    }
  }

  return { deleteThreatDetectionFilters }
}

export const useThreatDetectionFilters = () => {
  const { t } = useI18n()

  const operationStatusOptions = Object.values(OperationStatusTypes).map(value => ({
    value,
    text: t(`threatDetectionFilters.${value}`),
  }))
  const blockingStatusOptions = [
    { value: 'true', text: t('threatDetectionFilters.blocking') },
    { value: 'false', text: t('threatDetectionFilters.unblock') },
  ]

  return {
    operationStatusOptions,
    blockingStatusOptions,
  }
}
