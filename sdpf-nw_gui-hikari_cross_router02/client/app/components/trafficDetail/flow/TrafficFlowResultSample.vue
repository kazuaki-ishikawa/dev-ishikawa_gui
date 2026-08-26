<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import type { GuaranteeResponse } from '@/api/guarantees/types'
import type { ResourceSummaryTerminalResponse } from '@/api/terminals/types'
import {
  TrafficFlowRankRankByTypes,
  TrafficFlowRankDirectionTypes,
  type TrafficFlowRankTabValues,
} from '@/api/trafficFlowRank/constants'
import type { TrafficFlowRankType } from '@/api/trafficFlowRank/types'
import { AccessTypes } from '@/api/trafficTrends/constants'
import { ChartStyleTypes, ChartUnitTypes } from '@/components/trafficDetail/constants'

type PropType = {
  tabName: (typeof TrafficFlowRankTabValues)[number]
  terminal: ResourceSummaryTerminalResponse
  guarantee: GuaranteeResponse
}
const props = defineProps<PropType>()
const { t } = useI18n()

const chartTypeOptions = Object.values(ChartStyleTypes).map(value => ({ text: t(`trafficFlow.${value}`), value }))
const chartUnitOptions = Object.values(ChartUnitTypes).map(value => ({ text: t(`trafficFlow.${value}`), value }))
const rateLimitText = computed(() => {
  const internet = props.guarantee?.internet?.rateLimit ?? t('trafficFlow.noContract')
  const vpn = props.guarantee?.vpn?.rateLimit ?? t('trafficFlow.noContract')
  return `${t('trafficDetails.internet')}: ${internet} / VPN: ${vpn}`
})

const rateLimit = computed(() => {
  const internet = convertBandwidthToUnit(props.guarantee.internet?.rateLimit ?? '')
  const vpn = convertBandwidthToUnit(props.guarantee.vpn?.rateLimit ?? '')
  return { internet, vpn }
})

const dataList = computed(() => [
  {
    label: t('trafficFlow.selectedTerminal'),
    value: `${props.terminal.terminalId} (${props.terminal.customerNote})`,
  },
  {
    label: t('trafficFlow.selectedCircuit'),
    value: `${props.guarantee.guaranteeId} (${props.guarantee.customerNote})`,
  },
  { label: t('trafficFlow.rateLimit'), value: rateLimitText.value },
])

const rankBy = computed(
  () =>
    Object.values(TrafficFlowRankRankByTypes).find(value => value === props.tabName) ??
    TrafficFlowRankRankByTypes.ApplicationId,
)

const trafficFlowRank = computed<TrafficFlowRankType>(() => {
  const timestamps = [...Array((24 * 60) / 15)].map((_, index) =>
    new Date(new Date().setMinutes(index * 15)).toISOString(),
  )
  return {
    terminalId: props.terminal.terminalId,
    customerNote: props.terminal.customerNote,
    circuits: [AccessTypes.Internet, AccessTypes.Vpn].map(accessType => ({
      circuitId: props.guarantee.guaranteeId,
      circuitType: CircuitTypes.Guarantee,
      accessType,
      direction: TrafficFlowRankDirectionTypes.In,
      rankBy: rankBy.value,
      traffics: [...Array(11)]
        .map(() => ({
          group: { [rankBy.value]: 'sample' },
          rates: {
            timestamp: timestamps,
            bitPerSec: timestamps.map((_, idx) =>
              Math.floor(rateLimit.value[accessType] / timestamps.length + Math.random() * 10 ** 5 * idx),
            ),
            packetPerSec: timestamps.map(() => Math.floor(Math.random() * 10 ** 3)),
          },
        }))
        .map(traffic => ({
          ...traffic,
          average: traffic.rates.bitPerSec.reduce((acc, rate) => acc + rate, 0) / traffic.rates.bitPerSec.length,
        }))
        .sort((a, b) => b.average - a.average)
        .map((traffic, index) => ({ ...traffic, rank: index + 1 })),
    })),
  }
})
</script>

<template>
  <div>
    <InnerCard :title="t('trafficFlow.result')">
      <div v-for="data in dataList" :key="data.value" class="grid-cols mt-4">
        <div>{{ data.label }}</div>
        <div>{{ data.value }}</div>
      </div>
      <div class="mt-4 text-secondary text-lg">{{ t('trafficFlow.chartStyle') }}</div>
      <SeparatedGrid class="mt-2" :label="t('trafficFlow.chartType')">
        <RadioForm :model-value="ChartStyleTypes.Area" disabled :options="chartTypeOptions" col-min-width="180px" />
      </SeparatedGrid>
      <SeparatedGrid class="mt-2" :label="t('trafficFlow.chartUnit')">
        <RadioForm :model-value="ChartUnitTypes.BitPerSec" disabled :options="chartUnitOptions" col-min-width="180px" />
      </SeparatedGrid>
    </InnerCard>
    <div v-for="accessType in [AccessTypes.Internet, AccessTypes.Vpn]" :key="accessType" class="position-relative">
      <TrafficFlowChart
        :access-type="accessType"
        :traffic-flow="trafficFlowRank"
        :rate-limit="guarantee?.[accessType]?.rateLimit ?? ''"
        :chart-type="ChartStyleTypes.Area"
        :chart-unit="ChartUnitTypes.BitPerSec"
        pdf-preview
      />
      <div class="sample-cover flex-center-center position-absolute w-100 h-100">
        <div
          class="sample"
          :class="{
            'text-5xl': !guarantee?.[accessType]?.rateLimit,
            'font-large': !!guarantee?.[accessType]?.rateLimit,
          }"
        >
          sample
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid-cols {
  display: grid;
  grid-template-columns: 200px 1fr;
}
.sample-cover {
  z-index: 100;
  top: 0;
  left: 0;
  border-radius: 0.75rem;
  background-color: v.$light-info-alpha-color;
}
.sample {
  transform: rotate(-15deg);
  opacity: 0.45;
}
.font-large {
  font-size: 14rem;
}
</style>
