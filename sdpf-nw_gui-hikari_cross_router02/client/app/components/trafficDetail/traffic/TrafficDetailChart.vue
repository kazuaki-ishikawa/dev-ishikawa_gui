<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import { AccessTypes } from '@/api/trafficTrends/constants'
import type { CircuitType, AccessType, TrafficTrendCircuitType, TrafficTrendType } from '@/api/trafficTrends/types'
import { TrafficDetailChartColors as ChartColors } from '@/components/constants'
import type { DownloadChartType } from '@/components/button/types'
import { BpsTypes, GraphContentsTypes, ChartStyleTypes } from '@/components/trafficDetail/constants'
import type {
  TrafficChartDataType,
  UtilizationChartDataType,
  BpsType,
  GraphContentsType,
} from '@/components/trafficDetail/types'

type SeriesType = {
  type: typeof ChartStyleTypes.Line
  name: string
  data: [number, number][]
  color: string
  marker: { symbol: string } | { enabled: false }
}

type PropType = {
  trafficTrend: TrafficTrendType
  contentType: GraphContentsType
  circuitTypes: CircuitType[]
  accessTypes: AccessType[]
  bpsType: BpsType[]
}
const props = defineProps<PropType>()
const { t } = useI18n()

const getTrafficSeries = (trend: TrafficTrendCircuitType) => {
  return trend.timestamp.reduce<TrafficChartDataType>(
    (data, time, index) => {
      const unixtime = new Date(time).getTime()
      const bitPerSecIn: [number, number] = [unixtime, trend.bitPerSecIn[index] ?? 0]
      const bitPerSecOut: [number, number] = [unixtime, trend.bitPerSecOut[index] ?? 0]
      const rateLimit: [number, number] = [unixtime, convertBandwidthToUnit(trend?.rateLimit ?? '')]
      return {
        bpsIn: [...data.bpsIn, bitPerSecIn],
        bpsOut: [...data.bpsOut, bitPerSecOut],
        rateLimit: [...data.rateLimit, rateLimit],
      }
    },
    { bpsIn: [], bpsOut: [], rateLimit: [] },
  )
}

const getUtilization = (bitPerSec: number, rateLimit: string) => {
  const rateLimitBit = convertBandwidthToUnit(rateLimit)
  const per = (bitPerSec / rateLimitBit) * 100
  const fixed = per.toFixed(5)
  return parseFloat(fixed)
}

const getUtilizationSeries = (trend: TrafficTrendCircuitType) => {
  const rateLimit = trend?.rateLimit
  if (!rateLimit) {
    return
  }
  return trend.timestamp.reduce<UtilizationChartDataType>(
    (data, time, index) => {
      const unixtime = new Date(time).getTime()
      const bitPerSecIn: [number, number] = [unixtime, getUtilization(trend.bitPerSecIn[index] ?? 0, rateLimit)]
      const bitPerSecOut: [number, number] = [unixtime, getUtilization(trend.bitPerSecOut[index] ?? 0, rateLimit)]
      return {
        bpsIn: [...data.bpsIn, bitPerSecIn],
        bpsOut: [...data.bpsOut, bitPerSecOut],
      }
    },
    { bpsIn: [], bpsOut: [] },
  )
}
const getChartName = (data: {
  circuit: 'ipoe' | 'guarantee'
  type: 'rateLimit' | 'bpsOut' | 'bpsIn'
  accessType?: AccessType
  prefix?: string
}) => {
  const { circuit, type, accessType = AccessTypes.InternetVpn, prefix = t('trafficDetails.main') } = data
  return `[${prefix}] ${t(`trafficDetails.${circuit}`)}（${t(`trafficDetails.${accessType}`)}）${t(
    `trafficDetails.${type}`,
  )}`
}
const marker = {
  bpsOut: { symbol: 'triangle' },
  bpsIn: { symbol: 'triangle-down' },
}

const ipoeList = computed(() =>
  props.trafficTrend.circuits.filter(circuit => circuit.circuitType === CircuitTypes.Ipoe),
)
const ipoeSeries = computed(() => {
  // 表示回線に設定されてない場合は空配列を返す
  if (
    !props.circuitTypes.includes(CircuitTypes.Ipoe) ||
    props.bpsType.length === 0 ||
    !props.accessTypes.includes(AccessTypes.InternetVpn)
  ) {
    return []
  }
  const prefix = props.trafficTrend.circuits.find(circuit => circuit.circuitType === CircuitTypes.Guarantee)
    ? t('trafficDetails.backup')
    : t('trafficDetails.main')
  const bpsOutName = getChartName({ circuit: 'ipoe', type: 'bpsOut', prefix })
  const bpsInName = getChartName({ circuit: 'ipoe', type: 'bpsIn', prefix })

  return ipoeList.value.flatMap(trend => {
    const { bpsIn, bpsOut } = getTrafficSeries(trend)
    const series: SeriesType[] = []
    if (props.bpsType.includes(BpsTypes.Out)) {
      series.push({
        type: ChartStyleTypes.Line,
        name: bpsOutName,
        data: bpsOut,
        color: ChartColors.ipoe,
        marker: marker.bpsOut,
      })
    }
    if (props.bpsType.includes(BpsTypes.In)) {
      series.push({
        type: ChartStyleTypes.Line,
        name: bpsInName,
        data: bpsIn,
        color: ChartColors.ipoe,
        marker: marker.bpsIn,
      })
    }
    return series
  })
})

const guaranteeList = computed(() =>
  props.trafficTrend.circuits.filter(circuit => {
    const foundAccessType = props.accessTypes.find(accessType => accessType === circuit.accessType)
    return circuit.circuitType === CircuitTypes.Guarantee && !!foundAccessType
  }),
)
const guaranteeSeries = computed(() => {
  // 表示回線に設定されてない場合は空配列を返す
  if (!props.circuitTypes.includes(CircuitTypes.Guarantee)) {
    return []
  }
  return guaranteeList.value
    .toSorted((a, b) =>
      a.accessType === AccessTypes.InternetVpn
        ? -1
        : a.accessType === AccessTypes.Internet && b.accessType !== AccessTypes.InternetVpn
          ? -1
          : 1,
    )
    .flatMap(trend => {
      const { bpsIn, bpsOut, rateLimit } = getTrafficSeries(trend)
      const series: SeriesType[] = [
        {
          type: ChartStyleTypes.Line,
          name: getChartName({ circuit: 'guarantee', type: 'rateLimit', accessType: trend.accessType }),
          data: rateLimit,
          color: ChartColors.guarantee[trend.accessType!],
          marker: { enabled: false },
        },
      ]
      if (props.bpsType.includes(BpsTypes.Out)) {
        series.push({
          type: ChartStyleTypes.Line,
          name: getChartName({ circuit: 'guarantee', type: 'bpsOut', accessType: trend.accessType }),
          data: bpsOut,
          color: ChartColors.guarantee[trend.accessType!],
          marker: marker.bpsOut,
        })
      }
      if (props.bpsType.includes(BpsTypes.In)) {
        series.push({
          type: ChartStyleTypes.Line,
          name: getChartName({ circuit: 'guarantee', type: 'bpsIn', accessType: trend.accessType }),
          data: bpsIn,
          color: ChartColors.guarantee[trend.accessType!],
          marker: marker.bpsIn,
        })
      }
      return series
    })
})

const utilizationGuaranteeSeries = computed(() => {
  // 表示回線に設定されてない場合は空配列を返す
  if (!props.circuitTypes.includes(CircuitTypes.Guarantee) || props.bpsType.length === 0) {
    return []
  }
  return guaranteeList.value.flatMap(trend => {
    const series = getUtilizationSeries(trend)
    if (!series) {
      return []
    }

    const bpsSeries: SeriesType[] = []
    if (props.bpsType.includes(BpsTypes.Out)) {
      bpsSeries.push({
        type: ChartStyleTypes.Line,
        name: getChartName({ circuit: 'guarantee', type: 'bpsOut', accessType: trend.accessType }),
        data: series.bpsOut,
        color: ChartColors.guarantee[trend.accessType!],
        marker: marker.bpsOut,
      })
    }
    if (props.bpsType.includes(BpsTypes.In)) {
      bpsSeries.push({
        type: ChartStyleTypes.Line,
        name: getChartName({ circuit: 'guarantee', type: 'bpsIn', accessType: trend.accessType }),
        data: series.bpsIn,
        color: ChartColors.guarantee[trend.accessType!],
        marker: marker.bpsIn,
      })
    }
    return bpsSeries
  })
})

const chartOptions = computed<Highcharts.Options>(() => {
  const isTraffic = props.contentType === GraphContentsTypes.Traffic
  const series = isTraffic ? guaranteeSeries.value.concat(ipoeSeries.value) : utilizationGuaranteeSeries.value
  const yAxisTitleText = isTraffic ? 'bps' : 'percent'
  return {
    title: { text: undefined },
    chart: {
      height: 450,
    },
    accessibility: { enabled: false },
    yAxis: {
      title: { text: yAxisTitleText },
    },
    xAxis: { type: 'datetime' },
    legend: {
      maxHeight: 120,
      align: 'center',
      alignColumns: false,
      verticalAlign: 'bottom',
    },
    series,
    tooltip: { formatter: isTraffic ? highchartsUnitFormatter() : highchartsFormatter('%') },
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

const terminalId = computed(() => props.trafficTrend.terminalId)
const chartTitle = computed(() => `${props.trafficTrend.customerNote || 'notitle'}(${terminalId.value})`)

// グラフダウンロード
// https://api.highcharts.com/class-reference/Highcharts.Chart#exportChart
const chartRef = ref<{ chart: Highcharts.Chart }>()
const download = (type: DownloadChartType) => {
  const filename = `${terminalId.value}_traffic_trends_chart`
  chartRef.value?.chart?.exporting?.exportChart(
    {
      type,
      filename,
    },
    { title: { text: chartTitle.value } },
  )
}
</script>

<template>
  <InnerCard :title="chartTitle">
    <template #button>
      <DownloadChartButton @download="download" />
    </template>
    <template #default>
      <highcharts ref="chartRef" :options="chartOptions" :modules="['exporting', 'export-data']" />
    </template>
  </InnerCard>
</template>
