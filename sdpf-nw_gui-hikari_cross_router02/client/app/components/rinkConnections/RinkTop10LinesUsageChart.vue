<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RinkLineUsageListType } from '@/api/rinkLineGroups/types'

type PropType = {
  lineUsageList: RinkLineUsageListType[]
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

// 上位10回線まではID付きで取得し、それ以降はその他としてまとめる
const top10UsageList = computed(() => {
  const sortedUsageList = [...props.lineUsageList].sort((a, b) => b.usage - a.usage)
  const top10 = sortedUsageList.slice(0, 10)
  const othersUsage = {
    lineNumber: t('rinkLineGroups.others'),
    usage: sortedUsageList.slice(10).reduce((acc, usage) => acc + usage.usage, 0),
  }
  return [...top10, othersUsage]
})

const chartOptions = computed<Highcharts.Options>(() => {
  const totalUsage = top10UsageList.value.reduce((acc, usage) => acc + usage.usage, 0)
  const data = top10UsageList.value.map(({ lineNumber, usage }) => ({
    name: lineNumber,
    y: usage,
    labelText: convertByteToUsageUnit(usage, 'GB', 'ceil'),
    color: lineNumber === t('rinkLineGroups.others') ? (colors.value.info as string) : undefined,
  }))
  const subTitleText = `${t('rinkLineGroups.sum')}<br/><b>${convertByteToUsageUnit(totalUsage, 'GB', 'ceil')}</b>`
  return {
    title: { text: undefined },
    accessibility: { enabled: false },
    chart: {
      height: 500,
    },
    subtitle: {
      useHTML: true,
      text: subTitleText,
      style: {
        color: '#000000',
        fontSize: '28px',
      },
      verticalAlign: 'middle',
      y: 20,
      x: -115,
    },
    legend: {
      enabled: true,
      useHTML: true,
      labelFormat:
        '<div style="display: flex; justify-content: space-between; width: 180px; font-weight: bold; margin-bottom: 1.5em; font-size: 1em"><span>{point.name}</span><span>{point.labelText}</span></div>',
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
    },
    tooltip: {
      headerFormat: '',
      pointFormat:
        '<b style="font-size: 16px"><span style="color:{point.color}">{point.name}</span>: {point.labelText}</b>',
    },
    plotOptions: {
      pie: {
        colorByPoint: true,
        size: '100%',
        innerSize: '60%',
        showInLegend: true,
        dataLabels: {
          enabled: false,
        },
      },
    },
    series: [{ type: 'pie', data }],
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
</script>

<template>
  <highcharts :options="chartOptions" />
</template>
