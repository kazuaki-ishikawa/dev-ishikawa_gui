<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { AuthenticationStatusResponse } from '@/api/threatInfo/types'

type PropsType = {
  data: AuthenticationStatusResponse | null
  total: number
}
const props = defineProps<PropsType>()
const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const series = computed(() => {
  if (props.total === 0) {
    return []
  }

  const data = [
    { name: t('idaas.authenticationSuccess'), y: props.data?.success ?? 0, color: colors.value.success as string },
    { name: t('idaas.authenticationFailure'), y: props.data?.failed ?? 0, color: colors.value.info as string },
  ]
  return [{ type: 'pie' as const, data }]
})

const chartOptions = computed<Highcharts.Options>(() => ({
  chart: {
    backgroundColor: colors.value.highlight as string,
    height: 250,
  },
  accessibility: { enabled: false },
  title: { text: undefined },
  subtitle: {
    useHTML: true,
    text: `<div style="white-space: pre-wrap">${t('idaas.total', { count: props.total })}</div>`,
    style: {
      fontSize: '40px',
    },
    floating: true,
    verticalAlign: 'middle',
    y: 45,
    x: -95,
  },
  legend: {
    enabled: true,
    useHTML: true,
    labelFormat:
      '<div style="display: flex; justify-content: space-between; text-align: center; width: 140px; font-weight: bold; margin-bottom: 1em; font-size: 1em"><span>{point.name}</span></div>',
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    fontSize: '1.2em',
  },
  tooltip: {
    headerFormat: '',
    pointFormat: '<b style="font-size: 16px"><span style="color:{point.color}">{point.name}</span>: {point.y}</b>',
  },
  plotOptions: {
    pie: {
      colorByPoint: true,
      size: '100%',
      innerSize: '80%',
      showInLegend: true,
      dataLabels: {
        enabled: true,
        crop: false,
        distance: '-10%',
        format: '{point.y}',
        style: {
          fontWeight: 'bold',
          color: '#fff',
          fontSize: '20px',
        },
        connectorWidth: 0,
      },
    },
  },
  series: series.value,
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
  <div class="position-relative">
    <highcharts :options="chartOptions" />
  </div>
</template>
