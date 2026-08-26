<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertResourceTypes } from '@/api/alerts/constants'
import type { AlertResponse } from '@/api/alerts/types'
import type { TerminalListResponse } from '@/api/terminals/types'
import { RouteName } from '@/route/constants'

type PropType = {
  terminalList: TerminalListResponse
}
const props = defineProps<PropType>()

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { t } = useI18n()

const { alertList, alertSortOption, sortAlert, getAlertList } = useGetAlertList()

const alertHeaders = computed(() => [
  { title: `${t('nova.alerts.timestamp')}/${t('nova.alerts.resolvedTime')}`, key: 'timestamp', width: 175 },
  { title: t('nova.alerts.alertName'), key: 'alertName', width: 140 },
  { title: t('nova.details.siteName'), key: 'siteName', sortable: false, width: 140 },
  { title: `${t('nova.terminals.terminalId')}/${t('nova.terminals.customerNote')}`, key: 'terminalId', width: 200 },
  { title: `${t('nova.alerts.resourceId')}/${t('nova.alerts.resourceType')}`, key: 'resourceId', width: 200 },
  { title: t('nova.alerts.info'), key: 'info', width: 150 },
])

const getResourceLink = (alert: AlertResponse) => {
  switch (alert.resourceType) {
    case AlertResourceTypes.Fic:
      return { name: RouteName.FicConnection.Detail, params: { tenantId: tenantId.value, id: alert.resourceId } }
    case AlertResourceTypes.Guarantee:
      return { name: RouteName.Guarantee.Detail, params: { tenantId: tenantId.value, id: alert.resourceId } }
    case AlertResourceTypes.Ipoe:
      return { name: RouteName.Ipoe.Detail, params: { tenantId: tenantId.value, id: alert.resourceId } }
    case AlertResourceTypes.Mobile:
      return { name: RouteName.Terminal.Detail, params: { tenantId: tenantId.value, id: alert.terminalId } }
    case AlertResourceTypes.Vpn:
      return { name: RouteName.Vpn.Detail, params: { tenantId: tenantId.value, id: alert.resourceId } }
    default:
      return null
  }
}
const convertedAlertItems = computed(
  () =>
    alertList.value?.alerts?.map(alert => {
      const found = props.terminalList.terminals.find(terminal => alert.terminalId === terminal.terminalId)
      const terminalRouteName = found ? RouteName.Terminal.Detail : RouteName.SelfTerminal.Detail
      return {
        ...alert,
        timestamp: formatDateTime(alert.timestamp),
        resolvedTime: formatDateTime(alert.resolvedTime),
        resourceType:
          alert.resourceType === AlertResourceTypes.Fic
            ? t('nova.resourceName.fic')
            : t(`nova.resourceName.${alert.resourceType}`),
        resourceLink: getResourceLink(alert),
        info: alert?.info ?? '',
        terminalRouteName,
      }
    }) ?? [],
)

const moveToAlertList = () => {
  return navigateTo({
    name: RouteName.Monitoring.AlertList,
    params: { tenantId: tenantId.value },
    query: { ...alertSortOption.value },
  })
}

onBeforeMount(() => {
  getAlertList({ limit: 10, offset: 0 })
})
</script>

<template>
  <v-card>
    <v-card-title class="flex-space-between-center">
      <span class="text-title-medium font-weight-bold">{{ t('nova.monitoring.alertHistory') }}</span>
      <NovaCustomButton append-icon="mdi-chevron-right" outlined size="small" @click="moveToAlertList">
        {{ t('nova.monitoring.more') }}
      </NovaCustomButton>
    </v-card-title>
    <v-card-item>
      <NovaSortableDataTable
        :headers="alertHeaders"
        :items="convertedAlertItems"
        :items-length="alertList?.total ?? 0"
        height="80vh"
        :sort-by="alertSortOption"
        @update:sort-by="sortAlert"
      >
        <template #[`item.timestamp`]="{ item }">
          <div>{{ item.timestamp }}</div>
          <div>{{ item.resolvedTime }}</div>
        </template>
        <template #[`item.terminalId`]="{ item }">
          <NuxtLink
            v-if="!!item.terminalId"
            :to="{ name: item.terminalRouteName, params: { tenantId, id: item.terminalId } }"
          >
            {{ item.terminalId }}
          </NuxtLink>
          <div v-else>{{ item.terminalId }}</div>
          <div class="text-truncate">{{ item.customerNote }}</div>
        </template>
        <template #[`item.resourceId`]="{ item }">
          <NuxtLink v-if="item.resourceLink" :to="item.resourceLink">{{ item.resourceId }}</NuxtLink>
          <div v-else>{{ item.resourceId }}</div>
          <div>{{ item.resourceType }}</div>
        </template>
      </NovaSortableDataTable>
    </v-card-item>
  </v-card>
</template>
