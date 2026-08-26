<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { HealthStatus, BgpSessionStatus } from '@/api/healthStatus/constants'
import { RouteName } from '@/route/constants'

const RESETTABLE_SESSION_REQUEST_TIME_HOURS = 1

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { t } = useI18n()

const { ficHealthStatuses, getFicHealthStatusList } = useGetFicHealthStatusList()
const { ficConnectionBgpSessionList, getFicConnectionBgpSessionList } = useGetFicConnectionBgpSessionList()
const { resetFicConnectionBgpSession } = useResetFicConnectionBgpSession()

const ficConnectionIds = computed(() => ficHealthStatuses.value.map(fic => fic.ficId))
watch(ficConnectionIds, next => {
  getFicConnectionBgpSessionList(next)
})

const headers = [
  { title: `${t('nova.fic.ficId')}/\n${t('nova.monitoring.ficBgpStatus')}`, key: 'ficId', width: 180, sortable: false },
  { title: 'VPN ID', key: 'vpnId', sortable: false },
  { title: t('nova.monitoring.bgpSessionClear'), key: 'bgpSession', width: 180, sortable: false },
  { title: t('nova.monitoring.showReceiveRoutes'), key: 'receiveRoutes', width: 180, sortable: false },
]

const items = computed(() =>
  ficHealthStatuses.value.map(ficHealth => {
    const found = ficConnectionBgpSessionList.value.find(bgp => bgp.ficConnectionId === ficHealth.ficId)
    const diffTime = found?.requestTime
      ? dayjs().diff(found.requestTime, 'hour')
      : RESETTABLE_SESSION_REQUEST_TIME_HOURS
    const disabled =
      diffTime < RESETTABLE_SESSION_REQUEST_TIME_HOURS ||
      found?.status === BgpSessionStatus.Processing ||
      ficHealth.ficStatus !== HealthStatus.NG

    return { ...ficHealth, vpnId: ficHealth?.vpnId ?? '-', disabled }
  }),
)

const handleSessionClear = async (ficConnectionId: string) => {
  const data = await resetFicConnectionBgpSession(ficConnectionId)
  // reset 後の値更新
  ficConnectionBgpSessionList.value = ficConnectionBgpSessionList.value.map(item =>
    item.ficConnectionId === data.ficConnectionId ? data : item,
  )
}

const moveToFicRoutes = (ficConnectionId: string) => {
  return navigateTo({ name: RouteName.Monitoring.FicRoutes, params: { tenantId: tenantId.value, id: ficConnectionId } })
}

onBeforeMount(() => {
  getFicHealthStatusList()
})
</script>

<template>
  <NovaDataTable :headers="headers" :items="items" height="400px">
    <template #[`item.ficId`]="{ item }">
      <NuxtLink
        :to="{ name: RouteName.FicConnection.Detail, params: { tenantId: route.params.tenantId, id: item.ficId } }"
      >
        {{ item.ficId }}
      </NuxtLink>
      <NovaStatusTag :status="item.ficStatus" />
    </template>

    <template #[`item.bgpSession`]="{ item }">
      <NovaCustomButton
        append-icon="mdi-chevron-right"
        outlined
        size="small"
        :disabled="item.disabled"
        @click="handleSessionClear(item.ficId)"
      >
        {{ t('nova.common.clear') }}
      </NovaCustomButton>
    </template>

    <template #[`item.receiveRoutes`]="{ item }">
      <NovaCustomButton append-icon="mdi-chevron-right" outlined size="small" @click="moveToFicRoutes(item.ficId)">
        {{ t('nova.monitoring.showReceiveRoutes') }}
      </NovaCustomButton>
    </template>
  </NovaDataTable>
</template>
