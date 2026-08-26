<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { HealthStatus } from '@/api/healthStatus/constants'
import { ConnectionTypes } from '@/api/guarantees/constants'
import type { ConnectionType } from '@/api/guarantees/types'
import type { HealthStatusResponse } from '@/api/healthStatus/types'

type PropType = {
  headerType: ConnectionType
  healthStatus?: HealthStatusResponse
}
const props = defineProps<PropType>()

const { t } = useI18n()

const internetBgpStatusHeaders = [
  { text: t('monitorings.internetAct'), key: 'act', width: 200 },
  { text: t('monitorings.internetSby'), key: 'sby', width: 200 },
]
const internetBgpStatusItems = computed(() => [
  {
    act: props.healthStatus?.guaranteeBgp?.internetBgpStatus?.act ?? '-',
    sby: props.healthStatus?.guaranteeBgp?.internetBgpStatus?.sby ?? '-',
  },
])
const vpnBgpStatusHeaders = [
  { text: t('monitorings.vpnAct'), key: 'act', width: 200 },
  { text: t('monitorings.vpnSby'), key: 'sby', width: 200 },
]
const vpnBgpStatusItems = computed(() => [
  {
    act: props.healthStatus?.guaranteeBgp?.vpnBgpStatus?.act ?? '-',
    sby: props.healthStatus?.guaranteeBgp?.vpnBgpStatus?.sby ?? '-',
  },
])

const tableData = computed(() => {
  if (props.headerType === ConnectionTypes.Internet) {
    return {
      headers: internetBgpStatusHeaders,
      items: internetBgpStatusItems.value,
    }
  } else {
    return {
      headers: vpnBgpStatusHeaders,
      items: vpnBgpStatusItems.value,
    }
  }
})
</script>

<template>
  <div class="bgp-status-table-card">
    <SeparatedTable :headers="tableData.headers" :items="tableData.items">
      <template #act="{ data }">
        <StatusIndicator
          v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
          :status="data"
        />
      </template>
      <template #sby="{ data }">
        <StatusIndicator
          v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
          :status="data"
        />
      </template>
    </SeparatedTable>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-primary));
$light-primary-color: #fff;

.bgp-status-table-card {
  padding: 0.5rem;
  border-radius: v.$child-border-radius;
  background-color: $light-primary-color;
  border-style: solid;
  border-width: 2px;
  border-color: $primary-color;
}
</style>
