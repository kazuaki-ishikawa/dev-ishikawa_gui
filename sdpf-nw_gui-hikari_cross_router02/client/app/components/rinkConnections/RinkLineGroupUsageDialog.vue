<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RinkLineGroupDailyUsageResponse, RinkLineGroupUsageSummaryResponse } from '@/api/rinkLineGroups/types'
import dayjs from 'dayjs'

type PropType = {
  open: boolean
  lineGroupName: string
  rinkLineGroupUsageMonthMap: Map<string, RinkLineGroupDailyUsageResponse>
  rinkLineGroupUsageSummaryMonthMap: Map<string, RinkLineGroupUsageSummaryResponse>
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const ChartTabName = {
  Daily: 'daily',
  Ratio: 'ratio',
  Top10Lines: 'top10Lines',
} as const
type ChartTabNameType = (typeof ChartTabName)[keyof typeof ChartTabName]

const currentDayjs = dayjs()
const currentMonth = ref(currentDayjs.format('YYYY-MM'))
const monthlyTabs = computed(() => {
  return Array.from(props.rinkLineGroupUsageMonthMap.keys()).map(month => {
    const monthDiff = currentDayjs.diff(dayjs(month), 'month')
    const [, MM = ''] = month.split('-')
    return {
      text:
        monthDiff === 0
          ? t('rinkLines.thisMonthTabLabel', { MM })
          : monthDiff === 1
            ? t('rinkLines.lastMonthTabLabel', { MM })
            : t('rinkLines.twoMonthsAgoTabLabel', { MM }),
      name: month,
    }
  })
})
const handleChangeMonthlyTab = (tabName: string) => {
  currentMonth.value = tabName
  // 月タブ変更時にグラフ種別タブを初期化
  if (currentChartTabName.value === ChartTabName.Ratio) {
    currentChartTabName.value = ChartTabName.Daily
  }
}

const currentChartTabName = ref<ChartTabNameType>(ChartTabName.Daily)
const chartTabs = computed(() =>
  Object.values(ChartTabName)
    .map(name => ({
      text: t(`rinkLineGroups.${name}`),
      name,
    }))
    .filter(tab => currentMonth.value === currentDayjs.format('YYYY-MM') || tab.name !== ChartTabName.Ratio),
)
const handleChangeChartTab = (tabName: ChartTabNameType) => {
  currentChartTabName.value = tabName
}

const dailyUsageList = computed(
  () => props.rinkLineGroupUsageMonthMap.get(currentMonth.value)?.lineGroupUsageList ?? [],
)
const rinkLineGroupCurrentUsage = computed(() => {
  const targetMap = props.rinkLineGroupUsageMonthMap.get(currentMonth.value)
  const remainUsage = targetMap?.remainUsage ?? 0
  const usage = targetMap ? targetMap.totalLineGroupLimit - remainUsage : 0
  return {
    usage,
    remainUsage,
  }
})
const lineUsageList = computed(
  () => props.rinkLineGroupUsageSummaryMonthMap.get(currentMonth.value)?.lineGroupUsageList ?? [],
)
const updatedAt = computed(() => {
  const targetMap =
    currentChartTabName.value === ChartTabName.Top10Lines
      ? props.rinkLineGroupUsageSummaryMonthMap
      : props.rinkLineGroupUsageMonthMap
  return targetMap.get(currentMonth.value)?.updatedAt ?? ''
})

const usageTitle = computed(() =>
  t('rinkLineGroups.usageTitle', { month: monthlyTabs.value.find(tab => tab.name === currentMonth.value)?.text ?? '' }),
)

watch(
  () => props.open,
  () => {
    if (!props.open) {
      currentMonth.value = currentDayjs.format('YYYY-MM')
      currentChartTabName.value = ChartTabName.Daily
    }
  },
)
</script>

<template>
  <DialogBase :title="usageTitle" :open="open" :width="1100" @close="emits('close')">
    <div class="mb-4">{{ t('rinkLineGroups.lineGroupName') }}: {{ lineGroupName }}</div>
    <SimpleTab :tabs="monthlyTabs" :current-tab-name="currentMonth" @click="handleChangeMonthlyTab">
      <SimpleTab :tabs="chartTabs" :current-tab-name="currentChartTabName" @click="handleChangeChartTab">
        <template #[ChartTabName.Daily]>
          <DailyUsageChart :month="currentMonth" :daily-usage-list="dailyUsageList" unit="GB" />
        </template>
        <template #[ChartTabName.Ratio]>
          <LatestUsagePieChart :data="rinkLineGroupCurrentUsage" unit="GB" />
        </template>
        <template #[ChartTabName.Top10Lines]>
          <RinkTop10LinesUsageChart :line-usage-list="lineUsageList" />
        </template>
      </SimpleTab>
    </SimpleTab>
    <template #footer>
      <div v-if="updatedAt" class="pa-4">
        {{ t('rinkLines.message.dataAcquisitionTime', { time: formatDateTime(updatedAt, false) }) }}
      </div>
    </template>
  </DialogBase>
</template>
