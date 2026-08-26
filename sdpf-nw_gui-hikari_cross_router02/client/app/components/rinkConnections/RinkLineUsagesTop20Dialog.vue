<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { RinkLinesUsageSummaryResponse } from '@/api/rinkLines/types'

type PropsType = {
  open: boolean
  rinkLineUsageSummaryMonthMap: Map<string, RinkLinesUsageSummaryResponse>
}
const props = defineProps<PropsType>()
type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

// currentTab は 今月
const currentDayjs = dayjs()
const currentTabName = ref(currentDayjs.format('YYYY-MM'))

const tabs = computed(() =>
  Array.from(props.rinkLineUsageSummaryMonthMap.keys()).map(month => {
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
const tabText = computed(() => tabs.value.find(tab => tab.name === currentTabName.value)?.text ?? '')
const handleTabChange = (tabName: string) => {
  currentTabName.value = tabName
}

const foundSummaryMap = computed(() => {
  return props.rinkLineUsageSummaryMonthMap.get(currentTabName.value)
})
const updatedAt = computed(() => {
  return foundSummaryMap.value?.updatedAt ? formatDateTime(foundSummaryMap.value.updatedAt, false) : ''
})

const chartOptions = computed<Highcharts.Options>(() => {
  const usageSummaryList =
    foundSummaryMap.value?.lineUsageList?.toSorted((a, b) => (b.usage ?? 0) - (a.usage ?? 0)).slice(0, 20) || []
  return {
    title: { text: undefined },
    accessibility: { enabled: false },
    chart: {
      height: usageSummaryList.length * 23 + 100,
    },
    yAxis: {
      title: { text: 'MB' },
    },
    xAxis: {
      type: 'category',
      title: { text: t('rinkLines.lineNumber') },
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      formatter: function (this: Highcharts.Point) {
        return `<b>${this.name}</b>: ${(Math.ceil((this.y ?? 0) * 100) / 100).toFixed(2)}MB`
      },
    },
    plotOptions: {
      series: {
        colorByPoint: true,
        dataSorting: {
          enabled: true,
          matchByName: true,
        },
        dataLabels: {
          enabled: true,
          formatter: function (this: Highcharts.Point) {
            return `${(Math.ceil((this.y ?? 0) * 100) / 100).toFixed(2)}MB`
          },
        },
      },
    },
    series: [
      {
        type: 'bar',
        name: 'usage',
        data: usageSummaryList.map(usageSummary => [
          usageSummary.lineNumber,
          convertByteToUnitValue(usageSummary.usage ?? 0, 'MB'),
        ]),
      },
    ],
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

watch(
  () => props.open,
  newVal => {
    if (newVal) {
      currentTabName.value = currentDayjs.format('YYYY-MM')
    }
  },
)
</script>

<template>
  <DialogBase :title="t('rinkLines.usagesTop20Title', { month: tabText })" :open="open" @close="emits('close')">
    <SimpleTab class="mt-4" :tabs="tabs" :current-tab-name="currentTabName" @click="handleTabChange">
      <highcharts class="pt-3" :options="chartOptions" />
    </SimpleTab>
    <template #footer>
      <div v-if="updatedAt" class="pa-4">
        {{ t('rinkLines.message.dataAcquisitionTime', { time: updatedAt }) }}
      </div>
    </template>
  </DialogBase>
</template>
