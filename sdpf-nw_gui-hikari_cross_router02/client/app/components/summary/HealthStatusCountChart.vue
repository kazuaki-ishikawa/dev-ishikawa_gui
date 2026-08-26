<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { HealthStatusCountResponse } from '@/api/healthStatus/types'
import { IconTypes, IconSize } from '@/components/icons/constants'

const iconSize = IconSize.xLarge

type PropsType = {
  data: HealthStatusCountResponse
}
const props = defineProps<PropsType>()
const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const series = computed(() => {
  if (props.data.total === 0) {
    return undefined
  }

  const data = [
    { name: 'OK', y: props.data.ok, color: colors.value.success as string },
    { name: 'NG', y: props.data.ng, color: colors.value.error as string },
  ]
  return [{ type: 'pie' as const, data }]
})

const chartOptions = computed<Highcharts.Options>(() => ({
  chart: { backgroundColor: colors.value.highlight as string },
  accessibility: { enabled: false },
  title: { text: t('summary.alertTerminalNumber') },
  subtitle: {
    useHTML: true,
    text: `<br/><span>${props.data.ng}/${props.data.total}</span>`,
    style: {
      color: colors.value.error as string,
      fontSize: '50px',
    },
    floating: true,
    verticalAlign: 'middle',
    y: 65,
  },
  legend: { enabled: false },
  tooltip: {
    headerFormat: '',
    pointFormat: '<b style="font-size: 16px"><span style="color:{point.color}">{point.name}</span>: {point.y}</b>',
  },
  plotOptions: {
    series: {
      borderWidth: 0,
      colorByPoint: true,
      type: 'pie',
      size: '100%',
      innerSize: '80%',
      dataLabels: {
        enabled: true,
        crop: false,
        distance: '-10%',
        style: {
          fontWeight: 'bold',
          fontSize: '16px',
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
    <SvgIcon class="alert-icon" :type="IconTypes.AlertTriangle" color="error" size="xLarge" />
    <highcharts :options="chartOptions" />
  </div>
</template>

<style lang="scss" scoped>
$half-width: calc(v-bind(iconSize) / 2);
.alert-icon {
  position: absolute;
  top: calc(50% - $half-width - 0.75rem);
  left: calc(50% - $half-width);
  z-index: 1;
}
</style>
