<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { RinkLinesUsageResponse } from '@/api/rinkLines/types'

const ChartTypes = {
  Lines: 'dailyUsage',
  Pie: 'usageAmount',
} as const
type ChartType = (typeof ChartTypes)[keyof typeof ChartTypes]

type PropsType = {
  open: boolean
  rinkLineUsageMonthMap: Map<string, RinkLinesUsageResponse>
}
const props = defineProps<PropsType>()
type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

// currentTab は 今月
const currentDayjs = dayjs()
const currentMonthly = ref(currentDayjs.format('YYYY-MM'))
const currentChartType = ref<ChartType>(ChartTypes.Lines)

const monthlyTabs = computed(() =>
  Array.from(props.rinkLineUsageMonthMap.keys()).map(month => {
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
  }),
)
const monthlyTabText = computed(() => monthlyTabs.value.find(tab => tab.name === currentMonthly.value)?.text ?? '')
const handleMonthlyTabChange = (tabName: string) => {
  currentMonthly.value = tabName
  // 月タブ変更時にグラフ種別タブを初期化
  currentChartType.value = ChartTypes.Lines
}

const chartTypeTabs = computed(() =>
  [
    { text: t('rinkLines.dailyUsageTabLabel'), name: ChartTypes.Lines },
    { text: t('rinkLines.usageAmountTabLabel'), name: ChartTypes.Pie },
  ].filter(tab => currentMonthly.value === monthlyTabs.value[0]?.name || tab.name === ChartTypes.Lines),
)
const handleChartTypeTabChange = (tabName: ChartType) => {
  currentChartType.value = tabName
}
const currentTabUsage = computed(() => {
  return (
    props.rinkLineUsageMonthMap.get(currentMonthly.value) ?? {
      lineNumber: '',
      totalLimit: 0,
      lineUsageList: [],
      updatedAt: '',
    }
  )
})
const updatedAt = computed(() => {
  return props.rinkLineUsageMonthMap.get(currentMonthly.value)?.updatedAt ?? ''
})

const lineNumber = computed(() => currentTabUsage.value.lineNumber)
const rinkLineCurrentUsage = computed(() => {
  const targetMap = props.rinkLineUsageMonthMap.get(currentMonthly.value)
  const remainUsage = targetMap?.remainUsage ?? 0
  const usage = targetMap ? targetMap.totalLimit - remainUsage : 0
  return {
    usage,
    remainUsage,
  }
})

watch(
  () => props.open,
  newVal => {
    if (newVal) {
      currentMonthly.value = currentDayjs.format('YYYY-MM')
      currentChartType.value = ChartTypes.Lines
    }
  },
)
</script>

<template>
  <DialogBase
    :open="open"
    :title="t('rinkLines.usageTitle', { month: monthlyTabText })"
    :width="1200"
    @close="emits('close')"
  >
    <div class="mb-4">{{ t('rinkLines.lineNumber') }}: {{ lineNumber }}</div>
    <SimpleTab :tabs="monthlyTabs" :current-tab-name="currentMonthly" @click="handleMonthlyTabChange">
      <SimpleTab :tabs="chartTypeTabs" :current-tab-name="currentChartType" @click="handleChartTypeTabChange">
        <DailyUsageChart
          v-if="currentChartType === ChartTypes.Lines"
          :month="currentMonthly"
          :daily-usage-list="currentTabUsage.lineUsageList ?? []"
          unit="MB"
        />
        <LatestUsagePieChart v-else-if="currentChartType === ChartTypes.Pie" :data="rinkLineCurrentUsage" unit="MB" />
      </SimpleTab>
    </SimpleTab>
    <template #footer>
      <div v-if="updatedAt" class="pa-4">
        {{ t('rinkLines.message.dataAcquisitionTime', { time: formatDateTime(updatedAt, false) }) }}
      </div>
    </template>
  </DialogBase>
</template>
