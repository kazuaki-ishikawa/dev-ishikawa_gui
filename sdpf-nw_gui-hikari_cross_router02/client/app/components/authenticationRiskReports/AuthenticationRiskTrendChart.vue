<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ThreatTrendListResponse } from '@/api/threatInfo/types'
import { RiskTypes } from '@/api/threatInfo/constants'
import { ColorMap } from './constants'

type PropsType = {
  data: ThreatTrendListResponse | null
}
const props = defineProps<PropsType>()

const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const months = computed(() => props.data?.trends.map(trend => trend.month.replace('-', '/')) ?? [])

const chartData = computed(() => {
  const series = Object.values(RiskTypes).map(risk => {
    return {
      type: 'column' as const,
      name: risk,
      data: props.data?.trends.map(trend => trend[risk]) ?? [],
      color: ColorMap.get(risk),
    }
  })
  return {
    categories: months.value,
    series,
  }
})
const chartOptions = computed<Highcharts.Options>(() => ({
  chart: {
    backgroundColor: colors.value.highlight as string,
  },
  accessibility: { enabled: false },
  title: { text: undefined },
  xAxis: {
    categories: chartData.value.categories,
  },
  yAxis: {
    title: {
      enabled: true,
      text: t('idaas.numberOfThreats'),
    },
  },
  legend: {
    align: 'center',
    verticalAlign: 'bottom',
  },
  tooltip: {
    headerFormat: '<b>{point.category}</b><br/>',
    pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
  },
  plotOptions: {
    column: {
      stacking: 'normal',
      dataLabels: {
        enabled: false,
      },
    },
  },
  series: chartData.value.series,
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
  <div class="mt-6">
    <highcharts :options="chartOptions" />
  </div>
</template>
