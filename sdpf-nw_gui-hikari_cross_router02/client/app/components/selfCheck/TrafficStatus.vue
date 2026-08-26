<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import { HealthStatus } from '@/api/healthStatus/constants'
import { AccessTypes } from '@/api/trafficTrends/constants'
import type { HealthStatusResponse } from '@/api/healthStatus/types'
import type { PrimaryCircuitType } from '@/api/terminals/types'
import type { TrafficTrendsQuery, TrafficTrendType } from '@/api/trafficTrends/types'

type PropType = {
  type: PrimaryCircuitType
  healthStatus?: HealthStatusResponse
  trafficTrend?: TrafficTrendType | null
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'click'): void
  (e: 'reload', query: TrafficTrendsQuery): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const headers = [
  { text: t('monitorings.resourceId'), key: 'resourceId' },
  { text: t('monitorings.circuitPriority'), key: 'situation' },
  { text: t('monitorings.status'), key: 'status' },
]
const items = computed(() => {
  if (props.type === CircuitTypes.Ipoe) {
    return [
      {
        resourceId: props.healthStatus?.ipoe?.ipoeId ?? '-',
        situation: props.healthStatus?.ipoe?.ipoeSituation
          ? t(`monitorings.${props.healthStatus?.ipoe?.ipoeSituation}`)
          : '-',
        status: props.healthStatus?.ipoe?.ipoeStatus ?? '-',
      },
    ]
  } else if (props.type === CircuitTypes.Guarantee) {
    return [
      {
        resourceId: props.healthStatus?.guarantee?.guaranteeId ?? '-',
        situation: props.healthStatus?.guarantee?.guaranteeSituation
          ? t(`monitorings.${props.healthStatus?.guarantee?.guaranteeSituation}`)
          : '-',
        status: props.healthStatus?.guarantee?.guaranteeStatus ?? '-',
      },
    ]
  } else {
    return [
      {
        resourceId: props.healthStatus?.mobile?.mobileId ?? '-',
        situation: props.healthStatus?.mobile?.mobileSituation
          ? t(`monitorings.${props.healthStatus?.mobile?.mobileSituation}`)
          : '-',
        status: props.healthStatus?.mobile?.mobileStatus ?? '-',
      },
    ]
  }
})
const button = computed(() => {
  if (props.type === CircuitTypes.Ipoe || props.type === CircuitTypes.Guarantee) {
    return { text: t('sideBar.trafficDetails'), icon: 'up-right-square' as const }
  } else {
    return { text: t('monitorings.moveToMydocomo'), icon: 'up-right-square' as const }
  }
})
const title = computed(() => {
  if (props.type === CircuitTypes.Ipoe) {
    return `${t('selfCheck.trafficStatus')} (${t('monitorings.ipoe')})`
  } else if (props.type === CircuitTypes.Guarantee) {
    return `${t('selfCheck.trafficStatus')} (${t('monitorings.guarantee')})`
  } else {
    return `${t('selfCheck.trafficStatus')} (${t('monitorings.mobile')})`
  }
})

const guaranteeTrafficTrendChart = computed(() => {
  const circuits = props.trafficTrend?.circuits ?? []
  const accessType =
    circuits.find(circuit => circuit.accessType === AccessTypes.InternetVpn)?.accessType ??
    circuits.find(circuit => circuit.accessType === AccessTypes.Internet)?.accessType ??
    AccessTypes.Vpn
  return {
    circuits: circuits.filter(
      circuit => circuit.circuitType === CircuitTypes.Guarantee && circuit.accessType === accessType,
    ),
    accessType,
  }
})
const ipoeTrafficTrendCircuits = computed(
  () => props.trafficTrend?.circuits.filter(circuit => circuit.circuitType === CircuitTypes.Ipoe) ?? [],
)

const reloadChartData = (query: TrafficTrendsQuery) => {
  emits('reload', query)
}
</script>

<template>
  <div>
    <div class="mb-2 text-secondary">{{ title }}</div>
    <SeparatedTable :headers="headers" :items="items">
      <template #status="{ data }">
        <StatusIndicator
          v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
          :status="data"
        />
        <div v-else>{{ data }}</div>
      </template>
    </SeparatedTable>
    <div v-if="type === CircuitTypes.Guarantee" class="my-4">
      <TrafficTrendChart
        :circuit-type="type"
        :traffic-trend-circuits="guaranteeTrafficTrendChart.circuits"
        :access-type="guaranteeTrafficTrendChart.accessType"
        @reload="reloadChartData"
      />
    </div>
    <div v-if="type === CircuitTypes.Ipoe" class="my-4">
      <TrafficTrendChart
        :circuit-type="type"
        :traffic-trend-circuits="ipoeTrafficTrendCircuits"
        @reload="reloadChartData"
      />
    </div>
    <div v-if="type === CircuitTypes.Mobile" class="my-4">{{ t('selfCheck.trafficMobileMessage') }}</div>
    <CustomButton class="mx-auto" :width="230" :icon="button.icon" :text="button.text" @click="emits('click')" />
  </div>
</template>
