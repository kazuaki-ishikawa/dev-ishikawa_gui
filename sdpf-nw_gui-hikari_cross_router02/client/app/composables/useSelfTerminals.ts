import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import { OrderStatusTypes, ResourceStatusTypes } from '@/api/constants'
import { VpnRouteLimitList } from '@/api/selfTerminals/constants'
import type { SelfTerminalResponse, SelfTerminalPostRequest, SelfTerminalPutRequest } from '@/api/selfTerminals/types'

export const useGetSelfTerminal = () => {
  const { API } = useAPI()

  const selfTerminal = ref<SelfTerminalResponse | null>(null)
  const getSelfTerminal = async (terminalId: string) => {
    try {
      const response = await API.GET<SelfTerminalResponse>(`self-terminals/${terminalId}`)
      selfTerminal.value = response
      return response
    } catch (error) {
      selfTerminal.value = null
      throw error
    }
  }

  const editable = computed(
    () =>
      !!selfTerminal.value &&
      selfTerminal.value.resourceStatus === ResourceStatusTypes.Active &&
      (!selfTerminal.value?.orderStatus || selfTerminal.value.orderStatus === OrderStatusTypes.Completed),
  )

  return { selfTerminal, getSelfTerminal, editable }
}

export const useCreateSelfTerminal = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setApiErrorMessageState } = useApiErrorDialog()

  const createSelfTerminal = async (request: SelfTerminalPostRequest) => {
    try {
      const response = await API.POST<SelfTerminalResponse, SelfTerminalPostRequest>('self-terminals', {
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
    }
  }

  return { createSelfTerminal }
}

export const useUpdateSelfTerminal = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setApiErrorMessageState } = useApiErrorDialog()

  const updateSelfTerminal = async (terminalId: string, request: SelfTerminalPutRequest) => {
    try {
      const response = await API.PUT<SelfTerminalResponse, SelfTerminalPutRequest>(`self-terminals/${terminalId}`, {
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
    }
  }

  return { updateSelfTerminal }
}

export const useDeleteSelfTerminal = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteDialog = ref(false)
  const deleteSelfTerminal = async (terminalId: string) => {
    try {
      const response = await API.DELETE<SelfTerminalResponse>(`self-terminals/${terminalId}`, {
        suppressErrorDialog: true,
      })
      setNotificationMessageState({ message: t('message.deleted') })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const errorMessage = error.statusCode === 400 ? t('message.badError') : t('message.failed')
      setNotificationMessageState({ message: `${errorMessage}\n${errorFormat(error)}` })
      throw error
    } finally {
      deleteDialog.value = false
    }
  }

  return { deleteDialog, deleteSelfTerminal }
}

export const useSelfTerminals = () => {
  const { t } = useI18n()

  const useableOptions = [
    { text: t('common.use'), value: 'true' },
    { text: t('common.disuse'), value: 'false' },
  ]
  const vpnRouteLimitOptions = VpnRouteLimitList.map(value => ({
    text: value === 1000 ? `${value}${t('terminals.paidRoute')}` : `${value}${t('terminals.freeRoute')}`,
    value: `${value}`,
  }))
  const getVpnRouteLimitText = (value?: number) => {
    const found = vpnRouteLimitOptions.find(option => option.value === `${value}`)
    return found?.text ?? ''
  }

  return { useableOptions, vpnRouteLimitOptions, getVpnRouteLimitText }
}
