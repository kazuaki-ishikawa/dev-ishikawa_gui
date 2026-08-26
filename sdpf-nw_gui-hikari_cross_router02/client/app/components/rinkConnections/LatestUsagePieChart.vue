<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  data: { usage: number; remainUsage: number }
  unit: 'GB' | 'MB'
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const pieChartData = computed(() => {
  const usageLabelText =
    props.unit === 'MB'
      ? convertByteToMBWithGB(props.data.usage, 'ceil')
      : convertByteToUsageUnit(props.data.usage, props.unit, 'ceil')
  const remainLabelText =
    props.unit === 'MB'
      ? convertByteToMBWithGB(props.data.remainUsage, 'floor')
      : convertByteToUsageUnit(props.data.remainUsage, props.unit, 'floor')
  const series = [
    {
      type: 'pie' as const,
      data: [
        {
          name: t('rinkConnections.usage'),
          y: props.data.usage,
          labelText: usageLabelText,
        },
        {
          name: t('rinkConnections.remainUsage'),
          color: colors.value['light-primary'] as string,
          y: props.data.remainUsage,
          labelText: remainLabelText,
        },
      ],
    },
  ]
  return {
    series,
    subTitleText: `${t('rinkConnections.remainUsage')}<br/><b>${remainLabelText}</b>`,
  }
})

const chartOptions = computed<Highcharts.Options>(() => ({
  accessibility: { enabled: false },
  title: { text: undefined },
  chart: {
    height: 500,
  },
  subtitle: {
    useHTML: true,
    text: pieChartData.value.subTitleText,
    style: {
      color: '#000000',
      fontSize: '28px',
    },
    floating: true,
    verticalAlign: 'middle',
    y: 50,
  },
  legend: {
    align: 'center',
    verticalAlign: 'top',
  },
  tooltip: {
    enabled: false,
  },
  plotOptions: {
    series: {
      borderWidth: 0,
      borderRadius: 0,
      size: '100%',
      innerSize: '50%',
      showInLegend: true,
      dataLabels: {
        enabled: true,
        crop: false,
        distance: '-25%',
        formatter: function (this: Highcharts.Point & { labelText?: string }) {
          return `<b>${this.name}</b>: ${this.labelText}`
        },
        style: {
          fontWeight: 'bold',
          fontSize: '16px',
        },
        connectorWidth: 0,
      },
    },
  },
  series: pieChartData.value.series,
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
