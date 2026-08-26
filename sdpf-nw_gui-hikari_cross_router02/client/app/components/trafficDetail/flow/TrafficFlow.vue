<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { TrafficReportFlowAnalyzerPlanTypes } from '@/api/constants'
import type { ResourceSummaryTerminalResponse } from '@/api/terminals/types'
import type {
  TrafficFlowRankTopType,
  TrafficFlowRankIntervalType,
  TrafficFlowRankDirectionType,
} from '@/api/trafficFlowRank/types'
import {
  TrafficFlowRankRankByTypes,
  TrafficFlowRankTabValues,
  TrafficFlowRankTopTypes,
  TrafficFlowRankIntervalTypes,
  TrafficFlowRankDirectionTypes,
} from '@/api/trafficFlowRank/constants'
import { OnlyFlowRankQueryKeyList, CommonQueryKeyList } from '@/components/trafficDetail/constants'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'

type PropType = {
  guaranteeId: string
  terminal: ResourceSummaryTerminalResponse
  hasBreakOut: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const terminalId = computed(() => props.terminal.terminalId)
const tabName = computed(
  () => TrafficFlowRankTabValues.find(name => name === route.query.tab) ?? TrafficFlowRankTabValues[0],
)

const periodType = ref<PeriodType>(PeriodTypes.Last1Day)
const searchQuery = ref({
  startTime: '',
  endTime: '',
  top: TrafficFlowRankTopTypes.Top10 as TrafficFlowRankTopType,
  interval: TrafficFlowRankIntervalTypes.Interval15Minutes as TrafficFlowRankIntervalType,
  direction: TrafficFlowRankDirectionTypes.In as TrafficFlowRankDirectionType,
})
const validSearchPeriodDateTime = ref(true)

const { trafficFlowRankQuery, trafficFlowRank, showLoading, getTrafficFlowRank, clearTrafficFlowRank } =
  useGetTrafficFlowRank()
const { getTrafficFlowRankUsage, getTotalBytesAndLimit, getLimitReachedDate } = useGetTrafficFlowRankUsage()
const { applications, getTrafficFlowRankApplicationList } = useGetTrafficFlowRankApplicationList()
const { guarantee, getGuarantee } = useGetGuarantee()

const minutesSpan = computed(() => {
  return searchQuery.value.interval === TrafficFlowRankIntervalTypes.Interval5Minutes
    ? 5
    : searchQuery.value.interval === TrafficFlowRankIntervalTypes.Interval15Minutes
      ? 15
      : 60
})
const usages = computed(() => {
  const { totalBytes, limit } = getTotalBytesAndLimit(props.guaranteeId)
  return { total: `${(totalBytes / 1000 ** 3).toFixed(2)}GB`, limit: `${(limit / 1000 ** 3).toFixed(2)}GB` }
})
const flowUsageReachedLimitDate = computed(() => getLimitReachedDate(props.guaranteeId))
const isApplicationIdTab = computed(() => tabName.value === TrafficFlowRankRankByTypes.ApplicationId)
const isCommunicationTab = computed(() => tabName.value === TrafficFlowRankTabValues.slice(-1)[0])
const rankBy = computed(() => Object.values(TrafficFlowRankRankByTypes).find(value => value === tabName.value))

const trafficReportFlowAnalyzerPlan = computed(
  () => props.terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
)
const isNoSubscription = computed(
  () => trafficReportFlowAnalyzerPlan.value === TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
)
const isPaidPlan = computed(() =>
  TrafficReportFlowAnalyzerPlanTypes.PaidPlan.includes(trafficReportFlowAnalyzerPlan.value),
)
const isFreePlan = computed(() => trafficReportFlowAnalyzerPlan.value === TrafficReportFlowAnalyzerPlanTypes.FreePlan)
const planText = computed(() =>
  t('terminals.planOption', { plan: isFreePlan.value ? t('terminals.freePlan') : trafficReportFlowAnalyzerPlan.value }),
)

const trafficFlowDisabled = computed(
  () => isNoSubscription.value || (isFreePlan.value && !isApplicationIdTab.value && !isCommunicationTab.value),
)
const message = computed(() => {
  if (isCommunicationTab.value) {
    if (isNoSubscription.value) {
      return t('trafficDetails.note.noSubscriptionCommunication')
    }
    if (isFreePlan.value) {
      return t('trafficDetails.note.freePlanCommunication')
    }
    if (isPaidPlan.value) {
      return t('trafficDetails.note.paidPlanCommunication')
    }
  }
  if (isNoSubscription.value || (isFreePlan.value && !isApplicationIdTab.value)) {
    return t('trafficDetails.note.sampleView')
  }
  return t(`trafficDetails.note.${tabName.value}`)
})

const isUpdatedRouteQuery = computed(() => {
  return [...OnlyFlowRankQueryKeyList, ...CommonQueryKeyList].some(key => {
    const value = (route.query?.[key] ?? '') as string
    if (key === 'periodType') {
      return value !== periodType.value
    }
    if (periodType.value !== PeriodTypes.Free) {
      // periodType が Free 以外の場合は startTime と endTime は確認しない
      if (key === 'startTime' || key === 'endTime') {
        return false
      }
    }
    return value !== (`${searchQuery.value[key]}` || undefined)
  })
})

const handleSearch = () => {
  if (isUpdatedRouteQuery.value) {
    // route.query が変わることが確定している場合は updateRouteQuery() を実行する
    updateRouteQuery()
  } else {
    // route.query が変わらない場合は fetchTrafficFlowData() を直接実行
    fetchTrafficFlowData()
  }
}
const fetchTrafficFlowData = (isFirstCommunicationTab = false) => {
  if (isCommunicationTab.value) {
    if (isFirstCommunicationTab) {
      // 通信の検索タブの初回遷移の場合はデータをクリアして何もしない
      clearTrafficFlowRank()
      return
    }
    // 通信の検索タブの場合は、通信の検索タブで設定されたクエリ要素を使用する
    getTrafficFlowRank({
      ...trafficFlowRankQuery.value,
      ...searchQuery.value,
      filterId: undefined,
      terminalId: terminalId.value,
    })
  } else {
    if (rankBy.value && !trafficFlowDisabled.value) {
      getTrafficFlowRank({
        ...searchQuery.value,
        rankBy: rankBy.value,
        // 通信の検索タブで設定されたクエリ要素を初期化する
        filterId: undefined,
        [TrafficFlowRankRankByTypes.SourceIpAddress]: undefined,
        [TrafficFlowRankRankByTypes.DestinationIpAddress]: undefined,
        [TrafficFlowRankRankByTypes.SourcePort]: undefined,
        [TrafficFlowRankRankByTypes.DestinationPort]: undefined,
        [TrafficFlowRankRankByTypes.Protocol]: undefined,
        [TrafficFlowRankRankByTypes.ApplicationId]: undefined,
        terminalId: terminalId.value,
      })
    }

    // フローデータ量表示
    if (isPaidPlan.value || (isFreePlan.value && isApplicationIdTab.value)) {
      getTrafficFlowRankUsage({ terminalId: terminalId.value })
    }
  }
}

const updateRouteQuery = () => {
  router.push({
    query: {
      ...searchQuery.value,
      startTime: periodType.value === PeriodTypes.Free ? searchQuery.value.startTime : undefined,
      endTime: periodType.value === PeriodTypes.Free ? searchQuery.value.endTime : undefined,
      periodType: periodType.value,
      terminalId: terminalId.value,
      tab: tabName.value,
    },
  })
}
const getInterval = (periodType: PeriodType, top: TrafficFlowRankTopType) => {
  const interval =
    Object.values(TrafficFlowRankIntervalTypes).find(v => v === route.query.interval) ??
    TrafficFlowRankIntervalTypes.Interval15Minutes

  switch (periodType) {
    case PeriodTypes.Last1Day:
    case PeriodTypes.Last3Days:
    case PeriodTypes.Last1Week:
      // TOP100 の時は 固定の interval を返す
      return top === TrafficFlowRankTopTypes.Top100 ? TrafficFlowRankIntervalTypes.Interval5Minutes : interval
    case PeriodTypes.Last1Month:
      return top === TrafficFlowRankTopTypes.Top100 ? TrafficFlowRankIntervalTypes.Interval1Day : interval
    default:
      return interval
  }
}
const changeRouteQuery = (isFirstCommunicationTab: boolean) => {
  // リロード等の場合のために初期値の設定を行う
  periodType.value = Object.values(PeriodTypes).find(v => v === route.query.periodType) ?? PeriodTypes.Last1Day
  const top = !isPaidPlan.value
    ? TrafficFlowRankTopTypes.Top10
    : (Object.values(TrafficFlowRankTopTypes).find(v => `${v}` === route.query.top) ?? TrafficFlowRankTopTypes.Top10)

  searchQuery.value = {
    startTime:
      periodType.value !== PeriodTypes.Free
        ? dayjs()
            .subtract(PeriodMinutesGapMap[periodType.value], 'minutes')
            .floor(minutesSpan.value, 'minutes')
            .format()
        : '',
    endTime: periodType.value !== PeriodTypes.Free ? dayjs().floor(minutesSpan.value, 'minutes').format() : '',
    top,
    interval: getInterval(periodType.value, top),
    direction:
      Object.values(TrafficFlowRankDirectionTypes).find(v => v === route.query.direction) ??
      TrafficFlowRankDirectionTypes.In,
  }

  // periodType が Free 以外の場合はここで終了
  if (periodType.value !== PeriodTypes.Free) {
    fetchTrafficFlowData(isFirstCommunicationTab)
    return
  }

  // periodType.value === PeriodTypes.Free の場合は、startTime と endTime をクエリパラメータから取得
  const startTimeValue = route.query.startTime
  const endTimeValue = route.query.endTime
  // startTimeDayjs と endTimeDayjs はそれぞれ interval 単位で切り上げ・切り捨てを行う(1dの場合はひとまず15min)
  const startTimeDayjs =
    startTimeValue && !Array.isArray(startTimeValue) && dayjs(startTimeValue).isValid()
      ? dayjs(startTimeValue).floor(minutesSpan.value, 'minutes')
      : dayjs().subtract(PeriodMinutesGapMap[PeriodTypes.Last1Day], 'minutes').floor(minutesSpan.value, 'minutes')
  const endTimeDayjs =
    endTimeValue && !Array.isArray(endTimeValue) && dayjs(endTimeValue).isValid()
      ? dayjs(endTimeValue).floor(minutesSpan.value, 'minutes')
      : dayjs().floor(minutesSpan.value, 'minutes')

  const diffMinutes = Math.abs(endTimeDayjs.diff(startTimeDayjs, 'minutes'))
  if (diffMinutes < 60) {
    // 1時間未満の場合は何もせず終了
    searchQuery.value = {
      ...searchQuery.value,
      startTime: startTimeDayjs.format(),
      endTime: endTimeDayjs.format(),
    }
    return
  }

  if (searchQuery.value.top === TrafficFlowRankTopTypes.Top100) {
    // top=100の場合は interval は固定値にする
    // 7日以下: 5min, 14日以下: 15min, 14日より上: 1day
    searchQuery.value.interval =
      diffMinutes <= PeriodMinutesGapMap[PeriodTypes.Last1Week]
        ? TrafficFlowRankIntervalTypes.Interval5Minutes
        : diffMinutes <= 14 * 24 * 60
          ? TrafficFlowRankIntervalTypes.Interval15Minutes
          : TrafficFlowRankIntervalTypes.Interval1Day
  } else if (
    diffMinutes < PeriodMinutesGapMap[PeriodTypes.Last1Day] &&
    searchQuery.value.interval === TrafficFlowRankIntervalTypes.Interval1Day
  ) {
    // 1日以下の期間で、interval が 1day の場合は 15min に変更する
    searchQuery.value.interval = TrafficFlowRankIntervalTypes.Interval15Minutes
  }

  searchQuery.value = {
    ...searchQuery.value,
    startTime: startTimeDayjs.format(),
    endTime: endTimeDayjs.format(),
  }
  fetchTrafficFlowData(isFirstCommunicationTab)
}

watch(
  () => route.query,
  (next, prev) => {
    const isFirstCommunicationTab = next.tab !== prev?.tab && isCommunicationTab.value
    // searchQuery の初期化のために changeRouteQuery には必ず入る必要がある
    changeRouteQuery(isFirstCommunicationTab)
  },
  { immediate: true },
)
onBeforeMount(() => {
  getTrafficFlowRankApplicationList()
  if (props.guaranteeId) {
    getGuarantee(props.guaranteeId)
  }
})
</script>

<template>
  <LoadingAnimation v-show="showLoading">
    <div class="text-center">{{ t('trafficDetails.loadingMessage') }}</div>
  </LoadingAnimation>
  <div v-show="!showLoading">
    <InnerCard>
      <div class="text-pre-wrap">{{ message }}</div>
      <template v-if="isPaidPlan || (isFreePlan && (isApplicationIdTab || isCommunicationTab))">
        <div class="flex-flex-start-center">
          <div>{{ t('trafficFlow.flowUsages.plan', { planText, plan: trafficReportFlowAnalyzerPlan }) }}</div>
          <HelpTooltip :content-width="800" icon="alert" color="warning">
            {{ t('trafficFlow.help.flowUsagesPlan') }}
          </HelpTooltip>
        </div>
        <div class="flex-flex-start-center">
          <div class="font-weight-bold">
            {{ t('trafficFlow.flowUsages.usedUsages', { total: usages.total, limit: usages.limit }) }}
          </div>
          <div v-if="flowUsageReachedLimitDate" class="text-error">
            {{ t('trafficFlow.flowUsages.reachedLimit', { date: flowUsageReachedLimitDate }) }}
          </div>
          <HelpTooltip v-if="flowUsageReachedLimitDate" :content-width="840" icon="alert" color="warning">
            {{ t('trafficFlow.help.reachedLimit') }}
          </HelpTooltip>
        </div>
        <div>
          {{ isFreePlan ? t('trafficFlow.flowUsages.freePlanSuggestion') : t('trafficFlow.flowUsages.suggestion') }}
        </div>
      </template>
    </InnerCard>
    <TrafficFlowSearch
      v-model="searchQuery"
      v-model:period-type="periodType"
      v-model:valid="validSearchPeriodDateTime"
      :traffic-flow-rank-query="trafficFlowRankQuery"
      :hide-search-button="isCommunicationTab"
      :is-paid-plan="isPaidPlan"
      :disabled="trafficFlowDisabled"
      :minutes-span="minutesSpan"
      @search="handleSearch"
    />
    <TrafficFlowFilterSetting
      v-if="isCommunicationTab"
      v-model:traffic-flow-rank-query="trafficFlowRankQuery"
      :applications="applications"
      :is-paid-plan="isPaidPlan"
      :is-no-subscription="isNoSubscription"
      :disabled="!validSearchPeriodDateTime"
      @search="handleSearch"
    />
    <TrafficFlowResult
      v-if="!trafficFlowDisabled && !!guarantee && trafficFlowRank"
      :traffic-flow-rank-query="trafficFlowRankQuery"
      :traffic-flow="trafficFlowRank"
      :guarantee="guarantee"
      :applications="applications"
      :is-paid-plan="isPaidPlan"
      :is-application-tab="isApplicationIdTab"
      :terminal-type="terminal.terminalType"
      :has-break-out="hasBreakOut"
    />
    <TrafficFlowResultSample
      v-if="trafficFlowDisabled && !!guarantee"
      :tab-name="tabName"
      :terminal="terminal"
      :guarantee="guarantee"
    />
  </div>
</template>
