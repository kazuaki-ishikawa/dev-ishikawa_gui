import { useI18n } from 'vue-i18n'
import { AlertResourceTypes } from '@/api/alerts/constants'
import type {
  AlertListQuery,
  AlertListResponse,
  AlertCountQuery,
  AlertCountResponse,
  AlertResourceType,
} from '@/api/alerts/types'
import type { SortOption } from '@/components/table/types'
import { TenantPages, GuaranteePages } from '@/components/sidebar/constants'

export const useGetAlertList = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const tenantId = computed(() => useRoute().params.tenantId as string)

  const alertListQuery = ref<AlertListQuery>({ limit: 10, offset: 0 })
  const alertList = ref<AlertListResponse | null>(null)
  const getAlertList = async (query?: AlertListQuery) => {
    try {
      alertListQuery.value = { ...query, sortKey: query?.sortKey ?? 'timestamp', direction: query?.direction ?? 'desc' }
      const response = await API.GET<AlertListResponse, AlertListQuery>('monitorings/alerts', {
        query: alertListQuery.value,
      })
      alertList.value = response
      return response
    } catch (error) {
      alertList.value = null
      throw error
    }
  }

  const alertSortOption = computed(() => ({
    sortKey: alertListQuery.value?.sortKey ?? 'timestamp',
    direction: alertListQuery.value?.direction ?? 'desc',
  }))
  const sortAlert = (option?: SortOption) => {
    getAlertList({ ...alertListQuery.value, sortKey: option?.sortKey, direction: option?.direction })
  }

  const alertHeaders = [
    { text: t('alerts.timestamp'), key: 'timestamp', width: 175 },
    { text: t('alerts.resolvedTime'), key: 'resolvedTime', width: 175 },
    { text: t('alerts.alertName'), key: 'alertName', width: 140 },
    { text: t('alerts.terminalId'), key: 'terminalId', width: 136 },
    { text: t('alerts.terminalName'), key: 'customerNote' },
    { text: t('alerts.resourceId'), key: 'resourceId', width: 136 },
    { text: t('alerts.resourceType'), key: 'resourceType', width: 144 },
    { text: t('alerts.info'), key: 'info', width: 150 },
  ]
  const getResourceLink = (resourceType: AlertResourceType, resourceId: string, terminalId: string) => {
    switch (resourceType) {
      case AlertResourceTypes.Mobile:
        return `/tenants/${tenantId.value}/${TenantPages.Terminals}/${terminalId}`
      case AlertResourceTypes.Ipoe:
        return `/tenants/${tenantId.value}/${TenantPages.Ipoes}/${resourceId}`
      case AlertResourceTypes.Vpn:
        return `/tenants/${tenantId.value}/${TenantPages.Vpns}/${resourceId}`
      case AlertResourceTypes.Fic:
        return `/tenants/${tenantId.value}/${TenantPages.Fic}/${resourceId}`
      case AlertResourceTypes.Guarantee:
        return `/tenants/${tenantId.value}/${TenantPages.Guarantees}/${GuaranteePages.Circuits}/${resourceId}`
    }
  }
  const alertItems = computed(
    () =>
      alertList.value?.alerts.map(alert => ({
        ...alert,
        timestamp: formatDateTime(alert.timestamp),
        resolvedTime: formatDateTime(alert.resolvedTime),
        resourceType:
          alert.resourceType === AlertResourceTypes.Fic ? t('service.fic') : t(`service.${alert.resourceType}`),
        resourceLink: getResourceLink(alert.resourceType, alert.resourceId, alert.terminalId),
        info: alert?.info ?? '',
      })) ?? [],
  )

  return {
    alertListQuery,
    alertList,
    alertHeaders,
    alertItems,
    alertSortOption,
    sortAlert,
    getAlertList,
  }
}

export const useGetAlertCount = () => {
  const { API } = useAPI()

  const alertCount = ref<AlertCountResponse | null>(null)
  const getAlertCount = async (query?: AlertCountQuery) => {
    try {
      const response = await API.GET<AlertCountResponse, AlertCountQuery>('monitorings/alerts/count', { query })
      alertCount.value = response
      return response
    } catch (error) {
      alertCount.value = null
      throw error
    }
  }

  return { alertCount, getAlertCount }
}
