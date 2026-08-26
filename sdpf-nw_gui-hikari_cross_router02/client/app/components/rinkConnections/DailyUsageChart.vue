<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { RinkLineUsageType } from '@/api/rinkLines/types'
import type { RinkLineGroupDailyUsageListType } from '@/api/rinkLineGroups/types'

type PropType = {
  month: string // YYYY-MM
  dailyUsageList: RinkLineUsageType[] | RinkLineGroupDailyUsageListType[]
  unit: 'GB' | 'MB'
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const lineChartData = computed(() => {
  return [...Array(dayjs(props.month).daysInMonth())].reduce<{
    categories: string[]
    dailyUsages: Array<number | null>
    totalUsages: Array<number | null>
  }>(
    (acc, _, index) => {
      const date = dayjs(`${props.month}-${index + 1}`)
      const found = props.dailyUsageList.find(d => date.isSame(d.date, 'date'))
      const usage = found?.usage ?? 0
      const usageInUnit = convertByteToUnitValue(usage, props.unit)
      const total = (acc.totalUsages?.[index - 1] ?? 0) + usageInUnit
      return {
        categories: [...acc.categories, date.format('YYYY/MM/DD')],
        dailyUsages: [...acc.dailyUsages, found ? usageInUnit : null],
        totalUsages: [...acc.totalUsages, found ? total : null],
      }
    },
    { categories: [], dailyUsages: [], totalUsages: [] },
  )
})

const chartOptions = computed<Highcharts.Options>(() => ({
  accessibility: { enabled: false },
  title: { text: undefined },
  chart: {
    height: 500,
    zooming: {
      type: 'xy',
    },
  },
  xAxis: {
    categories: lineChartData.value.categories,
  },
  yAxis: [
    {
      min: 0,
      title: {
        text: `${t('rinkConnections.dailyUsage')}(${props.unit})`,
      },
    },
    {
      min: 0,
      title: {
        text: `${t('rinkConnections.totalUsages')}(${props.unit})`,
      },
      opposite: true,
    },
  ],
  legend: {
    align: 'center',
    verticalAlign: 'top',
  },
  tooltip: {
    formatter: function (this: Highcharts.Point) {
      const roundedValue = Math.ceil((this.y ?? 0) * 100) / 100
      return `<b>${this.category}</b><br/>${this.series.name}: ${roundedValue.toFixed(2)}${props.unit}`
    },
  },
  plotOptions: {
    column: {
      stacking: 'normal',
      dataLabels: {
        enabled: false,
      },
    },
  },
  series: [
    {
      name: t('rinkConnections.dailyUsage'),
      data: lineChartData.value.dailyUsages,
      type: 'column',
      legendIndex: 2,
    },
    {
      name: t('rinkConnections.totalUsages'),
      data: lineChartData.value.totalUsages,
      marker: { symbol: 'square' },
      color: colors.value.primary as string,
      yAxis: 1,
      legendIndex: 1,
      type: 'line',
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
}))
</script>

<template>
  <highcharts :options="chartOptions" />
</template>
