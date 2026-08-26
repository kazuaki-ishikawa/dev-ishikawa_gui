import { useI18n } from 'vue-i18n'
import { OrderStatusTypes, ResourceStatusTypes } from '@/api/constants'
import { VpnRouteResourceTypes } from '@/api/vpns/constants'
import type {
  VpnResponse,
  VpnPostRequest,
  VpnPutRequest,
  VpnListQuery,
  VpnListResponse,
  ResourceSummaryVpnResponse,
  ResourceSummaryVpnListResponse,
  VpnSearchRouteType,
  VpnSearchRouteQuery,
  VpnSearchRouteResponse,
} from '@/api/vpns/types'
import { RouteName } from '@/route/constants'

export const useGetVpnList = () => {
  const { API } = useAPI()

  const vpnQuery = ref<VpnListQuery>({})
  const vpnList = ref<VpnResponse[]>([])
  const getVpnList = async (query: VpnListQuery) => {
    try {
      vpnQuery.value = query
      const response = await API.GET<VpnListResponse, VpnListQuery>('vpns', { query })
      vpnList.value = response.vpns
      return response
    } catch (error) {
      vpnList.value = []
      throw error
    }
  }

  return { vpnQuery, vpnList, getVpnList }
}

export const useGetSummaryVpnList = () => {
  const { API } = useAPI()

  const summaryVpnList = ref<ResourceSummaryVpnResponse[]>([])
  const getSummaryVpnList = async () => {
    try {
      const response = await API.GET<ResourceSummaryVpnListResponse>('resource-summary/vpns')
      summaryVpnList.value = response.vpns
      return response
    } catch (error) {
      summaryVpnList.value = []
      throw error
    }
  }

  const unterminatedVpnListOptions = computed(() =>
    summaryVpnList.value
      .filter(vpn => vpn.resourceStatus !== ResourceStatusTypes.Terminated)
      .map(vpn => ({ text: `${vpn.vpnId} / ${vpn.customerNote}`, value: vpn.vpnId })),
  )

  const activeVpnListOptions = computed(() =>
    summaryVpnList.value
      .filter(vpn => vpn.resourceStatus === ResourceStatusTypes.Active)
      .map(vpn => ({ text: `${vpn.vpnId} / ${vpn.customerNote}`, value: vpn.vpnId })),
  )

  const customerNoteList = computed(() =>
    summaryVpnList.value
      .filter(vpn => vpn.resourceStatus !== ResourceStatusTypes.Terminated)
      .map(({ vpnId: id, customerNote }) => ({ id, customerNote })),
  )

  return {
    summaryVpnList,
    activeVpnListOptions,
    unterminatedVpnListOptions,
    customerNoteList,
    getSummaryVpnList,
  }
}

export const useGetVpn = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { VpnRouteResourceTypeTranslation, VpnRouteResourceTypeRouteName } = useVpn()

  const vpn = ref<VpnResponse | null>(null)
  const getVpn = async (vpnId: string) => {
    try {
      const response = await API.GET<VpnResponse>(`vpns/${vpnId}`)
      vpn.value = response
      return response
    } catch (error) {
      vpn.value = null
      throw error
    }
  }

  const routeHeaders = [
    { text: t('vpn.route'), key: 'route', width: 200 },
    { text: t('vpn.resourceType'), key: 'resourceType', width: 200 },
    { text: t('vpn.resourceId'), key: 'resourceId', width: 200 },
    { text: t('vpn.resourceName'), key: 'resourceName' },
  ]

  const routeItems = computed(() => {
    if (!vpn.value?.routes) {
      return []
    }

    return vpn.value.routes.flatMap(routeGroup =>
      (routeGroup.routes ?? []).map(route => ({
        route,
        resourceType: VpnRouteResourceTypeTranslation[routeGroup.resourceType],
        resourceId: routeGroup.resourceId,
        resourceName: routeGroup.customerNote ?? '',
        routeName: VpnRouteResourceTypeRouteName[routeGroup.resourceType],
      })),
    )
  })

  const editable = computed(
    () =>
      !!vpn.value &&
      vpn.value.resourceStatus === ResourceStatusTypes.Active &&
      (!vpn.value?.orderStatus || vpn.value.orderStatus === OrderStatusTypes.Completed),
  )

  return { vpn, getVpn, routeHeaders, routeItems, editable }
}

export const useCreateVpn = () => {
  const { API } = useAPI()

  const createVpn = async (request: VpnPostRequest) => {
    const response = await API.POST<VpnResponse, VpnPostRequest>('vpns', { body: request })
    return response
  }

  return { createVpn }
}

export const useUpdateVpn = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()
  const { isNovaView } = useNova()

  const updateVpn = async (vpnId: string, request: VpnPutRequest) => {
    const response = await API.PUT<VpnResponse, VpnPutRequest>(`vpns/${vpnId}`, { body: request })
    if (!isNovaView.value) {
      setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })
    }
    return response
  }

  return { updateVpn }
}

export const useDeleteVpn = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()
  const { isNovaView } = useNova()

  const deleteDialog = ref(false)
  const deleteVpn = async (vpnId: string) => {
    try {
      const response = await API.DELETE<VpnResponse>(`vpns/${vpnId}`)
      if (!isNovaView.value) {
        setNotificationMessageState({ message: t('message.deleted') })
      }
      return response
    } finally {
      deleteDialog.value = false
    }
  }

  return { deleteDialog, deleteVpn }
}

export const useGetVpnRoutes = () => {
  const { API } = useAPI()

  const vpnRoutes = ref<VpnSearchRouteType[]>([])
  const getVpnRoutes = async (vpnId: string, query: VpnSearchRouteQuery) => {
    try {
      const response = await API.GET<VpnSearchRouteResponse, VpnSearchRouteQuery>(`vpns/${vpnId}/search-route`, {
        query,
      })
      vpnRoutes.value = response.routes ?? []
      return response
    } catch (error) {
      vpnRoutes.value = []
      throw error
    }
  }

  return { vpnRoutes, getVpnRoutes }
}

export const useVpn = () => {
  const { t } = useI18n()

  const VpnRouteResourceTypeTranslation = {
    [VpnRouteResourceTypes.Terminal]: t('terminals.rentalTerminal'),
    [VpnRouteResourceTypes.SelfTerminal]: t('terminals.selfTerminal'),
    [VpnRouteResourceTypes.Guarantee]: t('service.guarantee'),
    [VpnRouteResourceTypes.FicConnection]: t('service.fic'),
    [VpnRouteResourceTypes.Vpn]: t('service.vpn'),
  }

  const VpnRouteResourceTypeRouteName = {
    [VpnRouteResourceTypes.Terminal]: RouteName.Terminal.Detail,
    [VpnRouteResourceTypes.SelfTerminal]: RouteName.SelfTerminal.Detail,
    [VpnRouteResourceTypes.Guarantee]: RouteName.Guarantee.Detail,
    [VpnRouteResourceTypes.FicConnection]: RouteName.FicConnection.Detail,
    [VpnRouteResourceTypes.Vpn]: RouteName.Vpn.Detail,
  }
  return { VpnRouteResourceTypeTranslation, VpnRouteResourceTypeRouteName }
}
