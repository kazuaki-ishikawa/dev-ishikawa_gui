<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import dayjs from 'dayjs'
import * as Papa from 'papaparse'
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import type { ResourceSummaryTerminalResponse } from '@/api/terminals/types'
import { AccessTypes, IntervalTypes } from '@/api/trafficTrends/constants'
import type { AccessType, CircuitType, IntervalType, TrafficTrendCsvDataType } from '@/api/trafficTrends/types'
import { BpsTypes, GraphContentsTypes } from '@/components/trafficDetail/constants'
import type { GraphContentsType } from '@/components/trafficDetail/types'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'

type PropType = {
  terminal: ResourceSummaryTerminalResponse
  showLoading: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const terminalId = computed(() => props.terminal.terminalId)

// トラフィック取得条件
const periodType = ref<PeriodType>(PeriodTypes.Last1Day)
const searchQuery = ref<{ startTime: string; endTime: string; interval: IntervalType }>({
  startTime: '',
  endTime: '',
  interval: IntervalTypes.Interval15Minutes,
})

const { trafficTrendsQuery, trafficTrends, getTrafficTrends } = useGetTrafficTrends()
const { downloadCsv } = useDownloadCsv()
const updateTrafficTrendsQuery = () => {
  const newQuery = {
    interval: searchQuery.value.interval,
    startTime: periodType.value === PeriodTypes.Free ? searchQuery.value.startTime : undefined,
    endTime: periodType.value === PeriodTypes.Free ? searchQuery.value.endTime : undefined,
    terminalId: terminalId.value,
    periodType: periodType.value,
  }
  const routeQuery = {
    interval: route.query.interval,
    startTime: route.query.startTime,
    endTime: route.query.endTime,
    terminalId: route.query.terminalId,
    periodType: route.query.periodType,
  }
  // パスクエリの変更がない場合は直接 changeRouteQuery を実行する
  if (isEqual(newQuery, routeQuery)) {
    changeRouteQuery()
  } else {
    router.push({ query: newQuery })
  }
}

const downloadDisabled = computed(() => {
  const trafficTorendsTerminalIds = trafficTrends.value?.trafficTrends.map(t => t.terminalId) ?? []
  return trafficTorendsTerminalIds.length === 0
})
const handleDownloadCsv = async () => {
  try {
    const data = trafficTrends.value?.trafficTrends.reduce<TrafficTrendCsvDataType[]>((acc, cur) => {
      if (terminalId.value === cur.terminalId) {
        cur.circuits.forEach(circuit => {
          const newData = circuit.timestamp.map((time, index) => {
            return {
              timestamp: formatDateTime(time),
              terminalId: cur.terminalId,
              customerNote: cur.customerNote,
              circuitId: circuit.circuitId,
              bitPerSecIn: circuit.bitPerSecIn[index] ?? 0,
              bytePerSecIn: circuit.bytePerSecIn[index] ?? 0,
              bitPerSecOut: circuit.bitPerSecOut[index] ?? 0,
              bytePerSecOut: circuit.bytePerSecOut[index] ?? 0,
            }
          })
          acc.push(...newData)
        })
      }
      return acc
    }, [])
    const csv = Papa.unparse(data ?? [])
    await downloadCsv(csv, 'traffic_trends')
  } catch {
    // error の場合は何もしない
  }
}

// 表示グラフ
const contentType = ref<GraphContentsType>(GraphContentsTypes.Traffic)
// 表示回線
const guaranteeChecked = ref(true)
const ipoeChecked = ref(true)
const accessTypeList = ref<AccessType[]>(Object.values(AccessTypes))
const circuitTypeList = computed(() =>
  [
    guaranteeChecked.value ? CircuitTypes.Guarantee : undefined,
    ipoeChecked.value ? CircuitTypes.Ipoe : undefined,
  ].filter((v): v is CircuitType => !!v),
)
const bps = ref(Object.values(BpsTypes))

const initializeChartOptions = () => {
  contentType.value = GraphContentsTypes.Traffic
  guaranteeChecked.value =
    props.terminal.primaryCircuit.circuitType === CircuitTypes.Guarantee ||
    props.terminal.primaryCircuit.circuitType === CircuitTypes.Mobile
  ipoeChecked.value =
    (!guaranteeChecked.value && !!props.terminal.ipoeId) ||
    props.terminal.primaryCircuit.circuitType === CircuitTypes.Mobile
  accessTypeList.value = guaranteeChecked.value
    ? ipoeChecked.value
      ? Object.values(AccessTypes)
      : [AccessTypes.Internet, AccessTypes.Vpn]
    : [AccessTypes.InternetVpn]
}

const changeRouteQuery = () => {
  // リロード等の場合のために初期値の設定を行う
  periodType.value = Object.values(PeriodTypes).find(v => v === route.query.periodType) ?? PeriodTypes.Last1Day
  searchQuery.value = {
    startTime:
      periodType.value !== PeriodTypes.Free
        ? dayjs().subtract(PeriodMinutesGapMap[periodType.value], 'minutes').format()
        : '',
    endTime: periodType.value !== PeriodTypes.Free ? dayjs().format() : '',
    interval: Object.values(IntervalTypes).find(v => v === route.query.interval) ?? IntervalTypes.Interval15Minutes,
  }

  switch (periodType.value) {
    case PeriodTypes.Last1Day:
      getTrafficTrends({
        ...searchQuery.value,
        terminalId: terminalId.value,
      })
      return
    case PeriodTypes.Last3Days:
    case PeriodTypes.Last1Week:
    case PeriodTypes.Last1Month:
      getTrafficTrends({
        ...searchQuery.value,
        interval: periodType.value === PeriodTypes.Last1Month ? IntervalTypes.Interval1Day : searchQuery.value.interval,
        terminalId: terminalId.value,
      })
      return
    default:
      break
  }

  // periodType.value === PeriodTypes.Free の場合は、startTime と endTime をクエリパラメータから取得
  const startTimeValue = route.query.startTime
  const endTimeValue = route.query.endTime
  const startTimeDayjs =
    startTimeValue && !Array.isArray(startTimeValue) && dayjs(startTimeValue).isValid()
      ? dayjs(startTimeValue)
      : dayjs().subtract(PeriodMinutesGapMap[PeriodTypes.Last1Day], 'minutes')
  const endTimeDayjs =
    endTimeValue && !Array.isArray(endTimeValue) && dayjs(endTimeValue).isValid() ? dayjs(endTimeValue) : dayjs()

  // 期間が7日を超える場合はデータ間隔は1日にする
  const diffMinutes = Math.abs(endTimeDayjs.diff(startTimeDayjs, 'minutes'))
  if (diffMinutes < 60) {
    // 1時間未満の場合は何もせず終了
    searchQuery.value = {
      startTime: startTimeDayjs.format(),
      endTime: endTimeDayjs.format(),
      interval: searchQuery.value.interval,
    }
    return
  }

  if (
    diffMinutes < PeriodMinutesGapMap[PeriodTypes.Last1Day] &&
    searchQuery.value.interval === IntervalTypes.Interval1Day
  ) {
    // 1日以下の期間で、interval が 1day の場合は 15min に変更する
    searchQuery.value.interval = IntervalTypes.Interval15Minutes
  } else {
    searchQuery.value.interval =
      diffMinutes <= PeriodMinutesGapMap[PeriodTypes.Last1Week]
        ? searchQuery.value.interval
        : IntervalTypes.Interval1Day
  }

  searchQuery.value = {
    ...searchQuery.value,
    startTime: startTimeDayjs.format(),
    endTime: endTimeDayjs.format(),
  }
  getTrafficTrends({
    startTime: startTimeDayjs.format(),
    endTime: endTimeDayjs.format(),
    interval: searchQuery.value.interval,
    terminalId: terminalId.value,
  })
}

watch(
  () => route.query,
  () => {
    changeRouteQuery()
    initializeChartOptions()
  },
  { immediate: true },
)
</script>

<template>
  <LoadingAnimation v-show="showLoading">
    <div class="text-center">{{ t('trafficDetails.loadingMessage') }}</div>
  </LoadingAnimation>
  <div v-show="!showLoading">
    <TrafficDetailSearch
      v-model="searchQuery"
      v-model:period-type="periodType"
      :traffic-trends-query="trafficTrendsQuery"
      :download-disabled="downloadDisabled"
      @search="updateTrafficTrendsQuery"
      @download="handleDownloadCsv"
    />
    <TrafficDetailChartOption
      v-model:content-type="contentType"
      v-model:guarantee="guaranteeChecked"
      v-model:ipoe="ipoeChecked"
      v-model:access-type-list="accessTypeList"
      v-model:bps="bps"
    />

    <template v-if="!!trafficTrends?.trafficTrends.length">
      <div class="charts mt-3">
        <TrafficDetailChart
          v-for="trend in trafficTrends.trafficTrends"
          :key="`${trend.terminalId}-${trend.circuits?.[0]?.circuitId}`"
          :traffic-trend="trend"
          :content-type="contentType"
          :circuit-types="circuitTypeList"
          :access-types="accessTypeList"
          :bps-type="bps"
        />
      </div>
    </template>
    <template v-else>
      <div>{{ t('trafficDetails.emptyTrafficTrends') }}</div>
    </template>
  </div>
</template>
