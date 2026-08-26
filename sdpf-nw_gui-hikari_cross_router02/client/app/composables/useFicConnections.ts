import { useI18n } from 'vue-i18n'
import { OrderStatusTypes, ResourceStatusTypes } from '@/api/constants'
import type {
  FicConnectionPostRequest,
  FicConnectionPutRequest,
  FicConnectionResponse,
  FicConnectionListResponse,
  FicConnectionListQuery,
} from '@/api/ficConnections/types'
import { RouteAdvertisementTypes } from '@/api/ficConnections/constants'

export const useGetFicConnectionList = () => {
  const { API } = useAPI()

  const ficConnectionsQuery = ref<FicConnectionListQuery>({})
  const ficConnections = ref<FicConnectionResponse[]>([])
  const getFicConnectionList = async (query?: FicConnectionListQuery) => {
    try {
      ficConnectionsQuery.value = query ?? {}
      const response = await API.GET<FicConnectionListResponse, FicConnectionListQuery>(
        'resource-summary/fic-connections',
        { query },
      )
      ficConnections.value = response.ficConnections
      return response
    } catch (error) {
      ficConnections.value = []
      throw error
    }
  }
  const customerNoteList = computed(() =>
    ficConnections.value
      .filter(fic => fic.resourceStatus !== ResourceStatusTypes.Terminated)
      .map(({ ficConnectionId: id, customerNote = '' }) => ({ id, customerNote })),
  )

  return { ficConnectionsQuery, getFicConnectionList, ficConnections, customerNoteList }
}

export const useGetFicConnection = () => {
  const { API } = useAPI()

  const ficConnection = ref<FicConnectionResponse | null>(null)
  const getFicConnection = async (ficConnectionId: string) => {
    try {
      const response = await API.GET<FicConnectionResponse>(`fic-connections/${ficConnectionId}`)
      ficConnection.value = response
      return response
    } catch (error) {
      ficConnection.value = null
      throw error
    }
  }

  const editable = computed(
    () =>
      !!ficConnection.value &&
      ficConnection.value?.resourceStatus === ResourceStatusTypes.Active &&
      (!ficConnection.value?.orderStatus || ficConnection.value.orderStatus === OrderStatusTypes.Completed),
  )

  return { ficConnection, getFicConnection, editable }
}

export const useCreateFicConnection = () => {
  const { API } = useAPI()

  const ficConnection = ref<FicConnectionResponse | null>(null)
  const createFicConnection = async (request: FicConnectionPostRequest) => {
    try {
      const response = await API.POST<FicConnectionResponse, FicConnectionPostRequest>('fic-connections', {
        body: request,
      })
      ficConnection.value = response
      return response
    } catch (error) {
      ficConnection.value = null
      throw error
    }
  }

  return { ficConnection, createFicConnection }
}

export const useUpdateFicConnection = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const { isNovaView } = useNova()

  const updateFicConnection = async (ficConnectionId: string, request: FicConnectionPutRequest) => {
    const response = await API.PUT<FicConnectionResponse, FicConnectionPutRequest>(
      `fic-connections/${ficConnectionId}`,
      { body: request },
    )
    if (!isNovaView.value) {
      setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })
    }
    return response
  }

  return { updateFicConnection }
}

export const useDeleteFicConnection = () => {
  const { API } = useAPI()

  const deleteDialog = ref(false)
  const deleteFicConnection = async (ficConnectionId: string) => {
    try {
      const response = await API.DELETE<FicConnectionResponse>(`fic-connections/${ficConnectionId}`)
      return response
    } finally {
      deleteDialog.value = false
    }
  }

  return { deleteDialog, deleteFicConnection }
}

export const useFicConnections = () => {
  const { t } = useI18n()

  const routeAdvertisementOptions = Object.values(RouteAdvertisementTypes).map(value => ({
    value,
    text: t(`fic.${value}`),
  }))
  const getRouteAdvertisementText = (value?: string) => {
    const found = routeAdvertisementOptions.find(option => option.value === value)
    return found?.text ?? ''
  }

  return {
    routeAdvertisementOptions,
    getRouteAdvertisementText,
  }
}
