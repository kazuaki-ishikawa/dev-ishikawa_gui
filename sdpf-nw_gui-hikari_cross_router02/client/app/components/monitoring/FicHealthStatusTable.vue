<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { HealthStatus, BgpSessionStatus } from '@/api/healthStatus/constants'
import type { FicHealthStatusResponse, FicConnectionBgpSessionResponse } from '@/api/healthStatus/types'

const RESETTABLE_SESSION_REQUEST_TIME_HOURS = 1

type PropType = {
  ficHealthStatuses: FicHealthStatusResponse[]
  ficConnectionBgpSessionList: FicConnectionBgpSessionResponse[]
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'resetBgpSession', ficId: string): void
  (e: 'moveToFicRoutes', ficId: string): void
}
const emits = defineEmits<Emits>()

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { t } = useI18n()
const headers = [
  { text: t('monitorings.ficConnectionId'), key: 'ficId' },
  { text: t('monitorings.vpnId'), key: 'vpnId' },
  { text: t('monitorings.ficConnectionStatus'), key: 'ficStatus' },
  { text: t('monitorings.bgpSessionClear'), key: 'bgpSession', width: 280 },
  { text: t('monitorings.showReceiveRoutes'), key: 'receiveRoutes', width: 280 },
]

const items = computed(() =>
  props.ficHealthStatuses.map(ficHealth => {
    const found = props.ficConnectionBgpSessionList.find(bgp => bgp.ficConnectionId === ficHealth.ficId)
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

const handlenResetBgpSession = (ficId: string) => {
  emits('resetBgpSession', ficId)
}
const moveToFicRoutes = (ficId: string) => {
  emits('moveToFicRoutes', ficId)
}
</script>

<template>
  <SeparatedTable :headers="headers" :items="items" :key-items="['ficId']">
    <template #ficId="{ data }">
      <NuxtLink :to="`/tenants/${tenantId}/fic-connections/${data}`">{{ data }}</NuxtLink>
    </template>
    <template #ficStatus="{ data }">
      <StatusIndicator
        v-if="HealthStatus.NG === data || HealthStatus.OK === data || HealthStatus.Warning === data"
        :status="data"
      />
      <div v-else>{{ data }}</div>
    </template>
    <template #bgpSession="{ row }">
      <CustomButton
        icon="right-arrow"
        :text="t('monitorings.bgpSessionClear')"
        :width="200"
        :disabled="row.disabled"
        @click="handlenResetBgpSession(row.ficId)"
      />
    </template>
    <template #receiveRoutes="{ row }">
      <CustomButton
        icon="right-arrow"
        :text="t('monitorings.showReceiveRoutes')"
        :width="200"
        @click="moveToFicRoutes(row.ficId)"
      />
    </template>
  </SeparatedTable>
</template>
