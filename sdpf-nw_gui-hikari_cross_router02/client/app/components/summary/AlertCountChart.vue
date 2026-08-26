<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { AlertCountResponse } from '@/api/alerts/types'
import { IconTypes } from '@/components/icons/constants'

const NUMBER_OF_DAYS = 7

type PropsType = {
  data: AlertCountResponse
}
const props = defineProps<PropsType>()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const { t } = useI18n()
const currentDate = ref('')
const lastDate = computed(() => props.data.dates.slice(-1)[0])
const firstDate = computed(() => props.data.dates[0])

const foundIndex = computed(() => props.data.dates.findLastIndex(date => date === currentDate.value))
const chartData = computed(() => {
  const lastIndex = foundIndex.value + 1
  if (lastIndex > 0) {
    const startIndex = Math.max(0, lastIndex - NUMBER_OF_DAYS)
    return {
      categories: props.data.dates.slice(startIndex, lastIndex),
      series: [
        {
          name: t('alerts.unsolvedAlerts'),
          data: props.data.notResolved.slice(startIndex, lastIndex),
          color: colors.value.error,
        },
        {
          name: t('alerts.resolvedAlerts'),
          data: props.data.resolved.slice(startIndex, lastIndex),
          color: colors.value.info,
        },
      ],
    }
  }
  return {
    categories: props.data.dates,
    series: [
      { name: t('alerts.unsolvedAlerts'), data: props.data.notResolved, color: colors.value.error },
      { name: t('alerts.resolvedAlerts'), data: props.data.resolved, color: colors.value.info },
    ],
  }
})

const showRightArrow = computed(() => currentDate.value !== lastDate.value)
const showLeftArrow = computed(() => chartData.value.categories[0] !== firstDate.value)

const chartOptions = computed<Highcharts.Options>(() => ({
  chart: { type: 'column', backgroundColor: colors.value.highlight as string },
  accessibility: { enabled: false },
  title: { text: undefined },
  xAxis: {
    categories: chartData.value.categories,
  },
  yAxis: {
    title: {
      text: undefined,
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
        enabled: true,
      },
    },
  },
  series: chartData.value.series as Highcharts.SeriesOptionsType[],
  navigation: {
    buttonOptions: {
      enabled: false,
    },
  },
  credits: {
    enabled: false,
  },
}))

const updateCurrentDate = (date: string) => {
  currentDate.value = date
}
const leftArrowClick = () => {
  const nextCurrentIndex = foundIndex.value - NUMBER_OF_DAYS
  currentDate.value = props.data.dates[nextCurrentIndex] ?? ''
}
const rightArrowClick = () => {
  const nextCurrentIndex = foundIndex.value + NUMBER_OF_DAYS
  currentDate.value = props.data.dates[nextCurrentIndex] ?? ''
}

watch(lastDate, () => updateCurrentDate(lastDate.value ?? ''))
onBeforeMount(() => updateCurrentDate(lastDate.value ?? ''))
</script>

<template>
  <div class="flex-center-stretch">
    <div v-if="showLeftArrow" class="arrow" @click="leftArrowClick">
      <SvgIcon :type="IconTypes.ChevronLeft" color="primary" class="align-self-center" />
    </div>
    <div v-else class="w-20px" />
    <div class="flex-grow-1">
      <highcharts :options="chartOptions" />
    </div>
    <div v-if="showRightArrow" class="arrow" @click="rightArrowClick">
      <SvgIcon :type="IconTypes.ChevronRight" color="primary" class="align-self-center" />
    </div>
    <div v-else class="w-20px" />
  </div>
</template>

<style lang="scss" scoped>
.arrow {
  display: flex;
  width: 20px;
  cursor: pointer;
  &:hover {
    opacity: 0.3;
  }
}
.w-20px {
  width: 20px;
}
</style>
