<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { TrafficTrendsQuery, TrafficTrendCircuitType, CircuitType, AccessType } from '@/api/trafficTrends/types'
import { IntervalTypes } from '@/api/trafficTrends/constants'
import { CircuitTypes } from '@/api/constants'
import { TrafficTrendChartColors } from '@/components/constants'
import { PeriodTypes } from '@/components/search/constants'

const PeriodList = [PeriodTypes.Last1Month, PeriodTypes.Last1Week, PeriodTypes.Last1Day]

type ChartDataType = {
  bpsIn: Array<[number, number]>
  bpsOut: Array<[number, number]>
}
type PropType = {
  trafficTrendCircuits: TrafficTrendCircuitType[]
  circuitType: CircuitType
  accessType?: AccessType // ギャランティ回線の場合は必須
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'reload', query: TrafficTrendsQuery): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const period = ref<(typeof PeriodList)[number]>(PeriodTypes.Last1Day)

const guaranteeNamePrefix = computed(() =>
  props.accessType ? `${t('trafficDetails.guarantee')}（${t(`trafficDetails.${props.accessType}`)}）` : '',
)
const series = computed(() => {
  const circuit = props.trafficTrendCircuits[0]
  if (!circuit) {
    return
  }

  const { bpsIn, bpsOut } = circuit.timestamp.reduce<ChartDataType>(
    (data, time, index) => {
      const unixtime = new Date(time).getTime()
      const bitPerSecIn: [number, number] = [unixtime, circuit.bitPerSecIn[index] ?? 0]
      const bitPerSecOut: [number, number] = [unixtime, circuit.bitPerSecOut[index] ?? 0]
      return { bpsIn: [...data.bpsIn, bitPerSecIn], bpsOut: [...data.bpsOut, bitPerSecOut] }
    },
    { bpsIn: [], bpsOut: [] },
  )
  return props.circuitType === CircuitTypes.Ipoe
    ? [
        {
          type: 'line' as const,
          name: `${t('trafficDetails.ipoe')}（${t('trafficDetails.internet+vpn')}）${t('trafficDetails.bpsOut')}`,
          data: bpsOut,
          color: TrafficTrendChartColors.ipoe.bpsOut,
          marker: { symbol: 'triangle' },
        },
        {
          type: 'line' as const,
          name: `${t('trafficDetails.ipoe')}（${t('trafficDetails.internet+vpn')}）${t('trafficDetails.bpsIn')}`,
          data: bpsIn,
          color: TrafficTrendChartColors.ipoe.bpsIn,
          marker: { symbol: 'triangle-down' },
        },
      ]
    : [
        {
          type: 'line' as const,
          name: `${guaranteeNamePrefix.value}${t('trafficDetails.bpsOut')}`,
          data: bpsOut,
          color: TrafficTrendChartColors.guarantee.bpsOut,
          marker: { symbol: 'triangle' },
        },
        {
          type: 'line' as const,
          name: `${guaranteeNamePrefix.value}${t('trafficDetails.bpsIn')}`,
          data: bpsIn,
          color: TrafficTrendChartColors.guarantee.bpsIn,
          marker: { symbol: 'triangle-down' },
        },
      ]
})

const chartOptions = computed<Highcharts.Options>(() => ({
  title: { text: undefined },
  chart: {
    height: 300,
  },
  accessibility: { enabled: false },
  yAxis: {
    title: { text: 'bps' },
  },
  xAxis: { type: 'datetime' },
  legend: {
    align: 'center',
    verticalAlign: 'bottom',
  },
  series: series.value,
  tooltip: {
    formatter: highchartsUnitFormatter(),
  },
  navigation: {
    buttonOptions: {
      enabled: false,
    },
  },
  credits: {
    enabled: false,
  },
}))

watch(period, next => {
  const query: TrafficTrendsQuery = { interval: IntervalTypes.Interval1Day }
  query.endTime = dayjs().format()
  if (next === PeriodTypes.Last1Day) {
    query.startTime = dayjs().subtract(1, 'days').format()
    query.interval = IntervalTypes.Interval15Minutes
  } else if (next === PeriodTypes.Last1Week) {
    query.startTime = dayjs().subtract(7, 'days').format()
  } else if (next === PeriodTypes.Last1Month) {
    query.startTime = dayjs().subtract(1, 'months').format()
  }
  emits('reload', query)
})
</script>

<template>
  <div>
    <div class="period-selector d-flex">
      <div
        v-for="value in PeriodList"
        :key="value"
        class="period"
        :class="{ active: period === value }"
        @click.stop="period = value"
      >
        {{ t(`period.${value}`) }}
      </div>
    </div>
    <highcharts :options="chartOptions" />
  </div>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$light-primary-color: rgb(var(--v-theme-light-primary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));

.period-selector {
  width: fit-content;
  border-radius: 1.25rem;
  margin-bottom: 0.25rem;
  overflow: hidden;
  .period {
    font-size: 0.75rem;
    padding: 0.25rem 0.85rem 0.35rem;
    background-color: $light-primary-color;
    color: $secondary-color;
    &.active {
      background-color: $secondary-color;
      color: $light-secondary-color;
    }
    &:hover {
      cursor: pointer;
      opacity: 0.5;
    }
  }
}
</style>
