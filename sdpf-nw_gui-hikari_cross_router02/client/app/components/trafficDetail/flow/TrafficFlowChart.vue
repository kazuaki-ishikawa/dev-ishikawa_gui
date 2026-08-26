<script setup lang="ts">
import { sum } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { TrafficFlowRankRankByTypes, TrafficFlowRankIntervalTypes } from '@/api/trafficFlowRank/constants'
import type {
  TrafficFlowRankIntervalType,
  TrafficFlowRankAccessType,
  TrafficFlowRankType,
  TrafficFlowRankCircuitTrafficType,
  TrafficFlowRankCircuitTrafficRateType,
  TrafficFlowRankApplicationType,
} from '@/api/trafficFlowRank/types'
import type { DownloadChartType } from '@/components/button/types'
import { IconTypes } from '@/components/icons/constants'
import { ChartStyleTypes, ChartUnitTypes, ProtocolIdNameMap } from '@/components/trafficDetail/constants'
import type { ChartStyleType, ChartUnitType } from '@/components/trafficDetail/types'

type SeriesType = {
  type: ChartStyleType
  name: string
  data: [number, number][]
  color: string | undefined
}

const OtherTopLabel = 'Others'
const RateLimitRank = 0
const Top10HighChartsColorList = [
  '#2caffe',
  '#544fc5',
  '#00e272',
  '#fe6a35',
  '#6b8abc',
  '#d568fb',
  '#2ee0ca',
  '#c96f5d',
  '#feb56a',
  '#65a39e',
]

type TableItemType = {
  top: string
  color?: string
  rankBy: string
  mbyte?: string
  percent?: string
  average?: string
  rates?: TrafficFlowRankCircuitTrafficRateType
}

type PropType = {
  accessType: TrafficFlowRankAccessType
  trafficFlow: TrafficFlowRankType
  rateLimit: string
  chartType: ChartStyleType
  chartUnit: ChartUnitType
  pdfPreview: boolean
  applications?: TrafficFlowRankApplicationType[]
  interval?: TrafficFlowRankIntervalType
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const rateLimitColor = computed(() => colors.value.error as string)
const initializationShowChartMap = [...Array(12)].map<[number, boolean]>((_, index) => [
  index,
  RateLimitRank < index || props.chartUnit === ChartUnitTypes.BitPerSec,
])
const showChartMap = reactive<Map<number, boolean>>(new Map(initializationShowChartMap))
const showOtherRows = ref(false)

const circuits = computed(
  () => props.trafficFlow.circuits.filter(circuit => circuit.accessType === props.accessType)?.[0],
)
const traffics = computed(() => circuits.value?.traffics ?? [])
const rankBy = computed(() => circuits.value?.rankBy ?? TrafficFlowRankRankByTypes.ApplicationId)
const isTop100 = computed(() => !!traffics.value.find(traffic => traffic.rank === 101))

const tableHeaders = computed(() => {
  return [
    { text: 'TOP', key: 'top', width: 95, class: 'justify-center text-sm' },
    { text: '色', key: 'color', width: 41, class: 'text-sm' },
    { text: '表示', key: 'show', width: 60, class: 'text-sm' },
    { text: t(`trafficFlow.${rankBy.value}`), key: 'rankBy', class: 'text-sm' },
    { text: '通信量(Mbyte)', key: 'mbyte', width: 150, class: 'justify-end text-sm' },
    { text: 'パーセント', key: 'percent', width: 130, class: 'justify-end text-sm' },
    { text: '平均トラフィック(Kbps)', key: 'average', width: 230, class: 'justify-end text-sm' },
  ]
})

const totalBitPerSec = computed(() =>
  traffics.value.reduce((total, traffic) => total + sum(traffic.rates.bitPerSec), 0),
)
const top10TableItems = computed(() => {
  const ranks = [...Array(10)].map<TableItemType>((_, index) => {
    const traffic = traffics.value.find(traffic => traffic.rank === index + 1)
    const values = getTableItemValues(traffic)
    return {
      top: `${traffic?.rank ?? index + 1}`,
      color: Top10HighChartsColorList[index],
      rates: traffic?.rates,
      ...values,
    }
  })
  const rateLimitItem: TableItemType = { top: '-', color: rateLimitColor.value, rankBy: t('trafficFlow.rateLimit') }
  return [rateLimitItem, ...ranks]
})
const top11To101TableItems = computed(() => {
  if (!isTop100.value) {
    return []
  }
  const ranks = [...Array(91)].map<TableItemType>((_, index) => {
    const traffic = traffics.value.find(traffic => traffic.rank === index + 11)
    const values = getTableItemValues(traffic)
    return {
      top: traffic?.rank === 101 ? OtherTopLabel : `${traffic?.rank ?? index + 11}`,
      rates: traffic?.rates,
      ...values,
    }
  })
  return ranks
})
const otherItem = computed<TableItemType>(() => {
  const found = traffics.value.reduce<TrafficFlowRankCircuitTrafficType | undefined>((acc, cur) => {
    if (cur.rank <= 10) {
      return acc
    }

    return {
      group: isTop100.value ? { [rankBy.value]: OtherTopLabel } : cur.group,
      rank: isTop100.value ? 101 : 11,
      // top100 の時の other は 11-101 の合計値になる
      average: (acc?.average ?? 0) + cur.average,
      rates: {
        timestamp: cur.rates.timestamp,
        bitPerSec: cur.rates.bitPerSec.map((b, idx) => (acc?.rates?.bitPerSec?.[idx] ?? 0) + b),
        packetPerSec: cur.rates.packetPerSec.map((p, idx) => (acc?.rates?.packetPerSec?.[idx] ?? 0) + p),
      },
    }
  }, undefined)
  const values = getTableItemValues(found)
  return { top: OtherTopLabel, color: colors.value.info as string, rates: found?.rates, ...values }
})
const tableItems = computed(() => {
  if (showOtherRows.value) {
    return top10TableItems.value.concat(top11To101TableItems.value)
  }
  return top10TableItems.value.concat([otherItem.value])
})

const rateLimitBit = computed(() => convertBandwidthToUnit(props.rateLimit))
const rateLimitSeries = computed<SeriesType[]>(() => {
  const item = {
    type: ChartStyleTypes.Line,
    name: t('trafficFlow.rateLimit'),
    data:
      otherItem.value.rates?.timestamp?.map<[number, number]>(timestamp => {
        const unixtime = new Date(timestamp).getTime()
        return [unixtime, rateLimitBit.value]
      }) ?? [],
    color: rateLimitColor.value,
  }
  return showChartMap.get(RateLimitRank) ? [item] : []
})

const chartSeries = computed(() => {
  const top10OtherSeries = tableItems.value.reduce<SeriesType[]>((series, item, index) => {
    if (!showChartMap.get(index) || index === 0) {
      return series
    }

    const data = item.rates?.timestamp?.map<[number, number]>((timestamp, idx) => {
      const unixtime = new Date(timestamp).getTime()
      if (props.chartUnit === ChartUnitTypes.BitPerSec) {
        return [unixtime, item.rates?.bitPerSec?.[idx] ?? 0]
      } else {
        return [unixtime, item.rates?.packetPerSec?.[idx] ?? 0]
      }
    })
    series.push({
      type: props.chartType,
      name: item.rankBy,
      data: data ?? [],
      color: item.color ?? '#000',
    })

    return series
  }, [])

  return rateLimitSeries.value.concat(top10OtherSeries)
})

const chartOptions = computed<Highcharts.Options>(() => {
  return {
    title: { text: undefined },
    chart: {
      height: 450,
    },
    accessibility: { enabled: false },
    yAxis: {
      title: { text: props.chartUnit },
    },
    xAxis: { type: 'datetime' },
    legend: { enabled: false },
    series: chartSeries.value,
    tooltip: {
      formatter:
        props.chartUnit === ChartUnitTypes.BitPerSec ? highchartsUnitFormatter() : highchartsUnitFormatter('pps'),
    },
    plotOptions: {
      line: {
        marker: { enabled: false },
      },
      area: {
        stacking: 'normal',
        lineWidth: 1,
        marker: {
          enabled: false,
        },
      },
    },
    navigation: {
      buttonOptions: {
        enabled: false,
      },
    },
    credits: {
      enabled: false,
    },
  }
})

const emptyTrafficData = computed(() => traffics.value.length === 0 || rateLimitBit.value === 0)

const getTableItemValues = (traffic?: TrafficFlowRankCircuitTrafficType) => {
  const groupRankByValue = traffic?.group?.[rankBy.value]
  const rankByValue = (() => {
    switch (rankBy.value) {
      case TrafficFlowRankRankByTypes.ApplicationId:
        return (
          props.applications?.find(app => app.applicationId === groupRankByValue)?.applicationName ?? groupRankByValue
        )
      case TrafficFlowRankRankByTypes.Protocol:
        return groupRankByValue ? (ProtocolIdNameMap[groupRankByValue] ?? groupRankByValue) : groupRankByValue
      default:
        return groupRankByValue
    }
  })()
  const sumBitPerSec = sum(traffic?.rates?.bitPerSec ?? [0])

  // 期間(秒)を取得(指定なしの場合は 15 分)
  const interval =
    props.interval === TrafficFlowRankIntervalTypes.Interval1Day
      ? 60 * 60 * 24
      : props.interval === TrafficFlowRankIntervalTypes.Interval5Minutes
        ? 60 * 5
        : 60 * 15

  // 通信量(Mbyte) = bitPerSec * 期間(秒) ÷ 8 ÷ 1000 ÷ 1000
  const mbyte = traffic ? ((sumBitPerSec * interval) / 8 / 10 ** 6).toFixed(3) : undefined
  // 各順位の bitPerSec の合計値 / 全順位の通信量合計
  const percent = traffic
    ? (totalBitPerSec.value ? (sumBitPerSec / totalBitPerSec.value) * 100 : 0).toFixed(3)
    : undefined
  // 平均(KBps)
  const average = traffic ? (traffic.average / 10 ** 3).toFixed(3) : undefined

  return { rankBy: rankByValue ?? '-', mbyte, percent, average }
}

// グラフダウンロード
// https://api.highcharts.com/class-reference/Highcharts.Chart#exportChart
const chartRef = ref<{ chart: Highcharts.Chart }>()
const handleChartDownload = (type: DownloadChartType) => {
  const chartTitle = `${props.trafficFlow.terminalId} / ${props.trafficFlow.customerNote}`
  const filename = `${props.trafficFlow.terminalId}_${props.accessType}_traffic_flow_chart`
  chartRef.value?.chart?.exporting?.exportChart(
    {
      type,
      filename,
    },
    { title: { text: chartTitle } },
  )
}
watch(
  () => props.chartUnit,
  next => {
    // パケット（pps）の場合は契約帯域は表示不可
    if (next === ChartUnitTypes.PacketPerSec) {
      showChartMap.set(RateLimitRank, false)
    }
  },
)
// データの集計数が更新されたら showOtherRows を初期化する
watch(isTop100, () => (showOtherRows.value = false))
watch(showOtherRows, next => {
  if (next) {
    // 11 位以降の行を表示する場合、表示列のチェックボックスを非表示にする
    showChartMap.delete(11)
  } else {
    showChartMap.set(11, true)
  }
})
</script>

<template>
  <InnerCard :title="t(`trafficFlow.${accessType}`)">
    <template v-if="!emptyTrafficData && !pdfPreview" #button>
      <DownloadChartButton @download="handleChartDownload" />
    </template>
    <template v-if="!emptyTrafficData">
      <highcharts ref="chartRef" :options="chartOptions" :modules="['exporting', 'export-data']" />
      <StripedTable class="mt-4" :headers="tableHeaders" :items="tableItems">
        <template #top="{ row }">
          <div
            v-if="row.top === OtherTopLabel && isTop100 && !pdfPreview"
            class="row-content w-100 flex-center-center cursor-pointer"
            @click="showOtherRows = !showOtherRows"
          >
            <SvgIcon
              :type="IconTypes.CaretDown"
              color="secondary"
              size="small"
              :class="{ 'show-other-rows': showOtherRows }"
            />
            <div class="px-1 text-sm">{{ t('common.other') }}</div>
          </div>
          <div v-else class="w-100 flex-center-center text-sm">
            {{ row.top === OtherTopLabel ? t('common.other') : row.top }}
          </div>
        </template>
        <template #color="{ row }">
          <div v-if="row.color" class="table-color-circle" :style="{ backgroundColor: row.color }" />
        </template>
        <template #show="{ index }">
          <div v-if="showChartMap.get(index) !== undefined" class="pl-5px w-100">
            <CheckboxBase
              :value="!!showChartMap.get(index)"
              :disabled="pdfPreview || (chartUnit === ChartUnitTypes.PacketPerSec && index === RateLimitRank)"
              @update:value="value => showChartMap.set(index, value)"
            />
          </div>
        </template>
        <template #mbyte="{ row }">
          <div class="text-right w-100">{{ row.mbyte ?? '-' }}</div>
        </template>
        <template #percent="{ row }">
          <div class="text-right w-100">{{ row.percent ? `${row.percent}%` : '-' }}</div>
        </template>
        <template #average="{ row }">
          <div class="text-right w-100">{{ row.average ?? '-' }}</div>
        </template>
      </StripedTable>
    </template>
    <template v-else>
      <div class="text-center mt-4">{{ t('trafficFlow.emptyTrafficData') }}</div>
    </template>
  </InnerCard>
</template>

<style lang="scss" scoped>
$circle-size: 15px;

.row-content {
  &:hover {
    opacity: 0.5;
  }
}
.show-other-rows {
  padding-bottom: 3.2px;
  transform: rotate(180deg);
}
.table-color-circle {
  width: calc($circle-size + 0.15rem);
  height: $circle-size;
  padding-bottom: 0.15rem;
  border-radius: 50%;
}
.pl-5px {
  padding-left: 5px;
}
</style>
