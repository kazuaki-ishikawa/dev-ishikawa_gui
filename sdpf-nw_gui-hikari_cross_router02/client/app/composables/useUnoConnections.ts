import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import type {
  UnoConnectionPostRequest,
  UnoConnectionListQuery,
  UnoConnectionListResponse,
  UnoConnectionResponse,
} from '@/api/unoConnections/types'

export const useUnoConnections = () => {
  const { API } = useAPI()

  const unoConnectionsQuery = ref<UnoConnectionListQuery>({})
  const unoConnections = ref<UnoConnectionResponse[]>([])

  const getUnoConnectionList = async (query?: UnoConnectionListQuery) => {
    try {
      unoConnectionsQuery.value = query ?? {}
      const response = await API.GET<UnoConnectionListResponse, UnoConnectionListQuery>('uno-connections', { query })
      unoConnections.value = response.unoConnections
      return response
    } catch (error) {
      unoConnections.value = []
      throw error
    }
  }

  const customerNoteList = computed(() =>
    unoConnections.value
      .filter(unoConnection => unoConnection.resourceStatus !== ResourceStatusTypes.Terminated)
      .map(({ unoConnectionId: id, customerNote }) => ({ id, customerNote })),
  )

  return {
    unoConnectionsQuery,
    unoConnections,
    customerNoteList,
    getUnoConnectionList,
  }
}

export const useGetUnoConnection = () => {
  const { API } = useAPI()

  const unoConnection = ref<UnoConnectionResponse | null>(null)

  const getUnoConnection = async (unoConnectionId: string) => {
    try {
      const response = await API.GET<UnoConnectionResponse>(`uno-connections/${unoConnectionId}`)
      unoConnection.value = response
      return response
    } catch (error) {
      unoConnection.value = null
      throw error
    }
  }

  // 廃止可能なのは廃止済み以外のリソース
  const deletable = computed(
    () => !!unoConnection.value && unoConnection.value.resourceStatus !== ResourceStatusTypes.Terminated,
  )

  return { unoConnection, getUnoConnection, deletable }
}

export const useCreateUnoConnection = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const unoConnection = ref<UnoConnectionResponse | null>(null)

  const createUnoConnection = async (request: UnoConnectionPostRequest) => {
    const response = await API.POST<UnoConnectionResponse, UnoConnectionPostRequest>('uno-connections', {
      body: request,
    })
    setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })
    return response
  }

  return { unoConnection, createUnoConnection }
}

export const useDeleteUnoConnection = () => {
  const { API } = useAPI()
  const deleteDialog = ref(false)

  const deleteUnoConnection = async (unoConnectionId: string) => {
    try {
      const response = await API.DELETE<UnoConnectionResponse>(`uno-connections/${unoConnectionId}`)
      return response
    } finally {
      deleteDialog.value = false
    }
  }

  return { deleteDialog, deleteUnoConnection }
}
