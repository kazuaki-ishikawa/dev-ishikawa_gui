import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import { OperationTypes } from '@/api/terminals/constants'
import type { TerminalOperationType } from '@/api/terminals/types'
import type {
  TerminalBulkOperationResponse,
  TerminalBulkPostRequest,
  TerminalBulkResponse,
  TerminalBulkPutRequest,
  TerminalBulkOperationRequest,
  PostTerminalBulkOperationResponse,
  TerminalBulkGetFilterCountsRequest,
  TerminalBulkGetFilterCountsResponse,
  TerminalsBulkOperationsListResponse,
  TerminalsBulkOperationsListQuery,
  TerminalsBulkOperationsResponse,
  BulkOperationType,
} from '@/api/terminalsBulk/types'
import type { SelfTerminalPutRequest, SelfTerminalResponse } from '@/api/selfTerminals/types'

export const useCreateTerminalBulk = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setApiErrorMessageState } = useApiErrorDialog()
  const { resetJpkiRequestStatus } = useGetJpkiRequestStatus()

  const createTerminalBulk = async (request: TerminalBulkPostRequest) => {
    try {
      const response = await API.POST<TerminalBulkResponse, TerminalBulkPostRequest>('terminals-bulk', {
        body: request,
        suppressErrorDialog: true,
      })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const errorMessage = error.statusCode === 400 ? t('message.badError') : t('message.failed')
      setApiErrorMessageState({
        apiType: 'terminal',
        message: `${errorMessage}\n${errorFormat(error)}`,
      })
      throw error
    } finally {
      resetJpkiRequestStatus()
    }
  }

  return { createTerminalBulk }
}

export const useUpdateTerminalBulk = () => {
  const { API } = useAPI()
  const { setLoadingAnimation } = useLoading()

  const updateTerminalBulk = async (request: {
    rental?: TerminalBulkPutRequest
    self?: { terminalIds: string[]; request: SelfTerminalPutRequest }
  }) => {
    try {
      // 実行中は loading アニメーションを表示
      setLoadingAnimation(true)
      const rentalPromises = request?.rental
        ? [API.PUT<TerminalBulkResponse, TerminalBulkPutRequest>('terminals-bulk', { body: request.rental })]
        : []
      const selfPromises = request?.self
        ? request.self.terminalIds.map((id: string) =>
            API.PUT<SelfTerminalResponse, SelfTerminalPutRequest>(`self-terminals/${id}`, {
              body: request.self?.request,
            }),
          )
        : []

      const response = await Promise.all([...rentalPromises, ...selfPromises])
      return response
    } finally {
      setLoadingAnimation(false)
    }
  }

  return { updateTerminalBulk }
}

export const useGetTerminalsBulkOperation = () => {
  const { API } = useAPI()

  const terminalsBulkOperationMap = ref<Map<string, TerminalOperationType[]>>(new Map())
  const getTerminalsBulkOperation = async () => {
    const response = await API.GET<TerminalBulkOperationResponse>('terminals-bulk/operation')
    terminalsBulkOperationMap.value = new Map(
      response.terminals.map(terminal => [terminal.terminalId, terminal.operations]),
    )
    return response
  }

  return { getTerminalsBulkOperation, terminalsBulkOperationMap }
}

export const usePostTerminalBulkOperation = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const { isNovaView } = useNova()

  const bulkOperationMessages: Record<BulkOperationType, string> = {
    [OperationTypes.BreakOutListUpdate]: t('terminals.message.breakOutListUpdate'),
    [OperationTypes.FirmwareUpdate]: t('firmwareUpdate.message.firmwareUpdateBulkSubmit'),
  }

  const postTerminalBulkOperation = async (terminalIds: string[], operation: BulkOperationType) => {
    const response = await API.POST<PostTerminalBulkOperationResponse, TerminalBulkOperationRequest>(
      'terminals-bulk/operation',
      { body: { terminalIds, operation } },
    )
    if (!isNovaView.value) {
      setNotificationMessageState({ message: bulkOperationMessages[operation] })
    }
    return response
  }

  return { postTerminalBulkOperation }
}

export const useGetTerminalsBulkOperationsList = () => {
  const { API } = useAPI()
  const terminalsBulkOperationsList = ref<TerminalsBulkOperationsListResponse | null>({
    total: 0,
    limit: 0,
    offset: 0,
    bulkOperations: [],
  })

  const getTerminalsBulkOperationsList = async (query?: TerminalsBulkOperationsListQuery) => {
    try {
      const response = await API.GET<TerminalsBulkOperationsListResponse, TerminalsBulkOperationsListQuery>(
        'terminals-bulk-operations',
        { query },
      )
      terminalsBulkOperationsList.value = response
      return response
    } catch (error) {
      terminalsBulkOperationsList.value = { total: 0, limit: 0, offset: 0, bulkOperations: [] }
      throw error
    }
  }

  return { terminalsBulkOperationsList, getTerminalsBulkOperationsList }
}

export const useGetTerminalsBulkOperations = () => {
  const { API } = useAPI()

  const terminalsBulkOperations = ref<TerminalsBulkOperationsResponse>()

  const getTerminalsBulkOperations = async (bulkOperationId: string) => {
    try {
      const response = await API.GET<TerminalsBulkOperationsResponse>(`terminals-bulk-operations/${bulkOperationId}`)
      terminalsBulkOperations.value = response
      return response
    } catch (error) {
      terminalsBulkOperations.value = undefined
      throw error
    }
  }
  return { terminalsBulkOperations, getTerminalsBulkOperations }
}

export const useDeleteTerminalsBulkOperations = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteTerminalsBulkOperations = async (bulkOperationId: string) => {
    const response = await API.DELETE<TerminalsBulkOperationsResponse>(`terminals-bulk-operations/${bulkOperationId}`)
    setNotificationMessageState({ message: t('firmwareUpdate.message.cancelInProgressCompleted') })
    return response
  }
  return { deleteTerminalsBulkOperations }
}

export const usePostTerminalBulkGetFilterCounts = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const postTerminalBulkGetFilterCounts = async (request: TerminalBulkGetFilterCountsRequest) => {
    const response = await API.POST<TerminalBulkGetFilterCountsResponse, TerminalBulkGetFilterCountsRequest>(
      'terminals-bulk/get-filter-counts',
      { body: request },
    )
    setNotificationMessageState({ message: t('threatDetectionFilters.message.getFilterCount') })
    return response
  }

  return { postTerminalBulkGetFilterCounts }
}
