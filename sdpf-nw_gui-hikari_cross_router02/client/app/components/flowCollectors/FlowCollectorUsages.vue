<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { formatSeries, defaultChartOptions } from '@/components/flowCollectors/utlis'
import {
  FlowCollectorPeriodTypes,
  DisplayCircuitTypes,
  DisplayAggregationMethodTypes,
} from '@/api/trafficFlow/constants'
import type {
  DisplayCircuitType,
  DisplayAggregationMethodType,
  TrafficFlowUsageType,
  TrafficFlowUsageQuery,
} from '@/api/trafficFlow/types'

type FlowCollectorPeriodType = (typeof FlowCollectorPeriodTypes)[keyof typeof FlowCollectorPeriodTypes]
const minDate = dayjs().subtract(366, 'days').format('YYYY-MM-DD')
const yesterday = dayjs().subtract(1, 'days').format('YYYY-MM-DD')
const USAGE_PERIOD_MONTHS = {
  [FlowCollectorPeriodTypes.Last1Month]: 1,
  [FlowCollectorPeriodTypes.Last3Months]: 3,
  [FlowCollectorPeriodTypes.Last6Months]: 6,
  [FlowCollectorPeriodTypes.Last12Months]: 12,
} as const

type PropType = {
  usages: TrafficFlowUsageType[]
  disabled?: boolean
}
const props = defineProps<PropType>()
const model = defineModel<TrafficFlowUsageQuery>('query', { required: true })

type Emits = {
  (e: 'submit'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const periodType = ref<FlowCollectorPeriodType>(FlowCollectorPeriodTypes.CurrentMonth)
const periodOptions = computed(() =>
  Object.values(FlowCollectorPeriodTypes).map(value => ({
    value,
    text: t(`flowCollectors.${value}`),
  })),
)
const periodDisabled = computed(() => periodType.value !== FlowCollectorPeriodTypes.Free)
watch(
  periodType,
  period => {
    if (period === FlowCollectorPeriodTypes.Free || period === FlowCollectorPeriodTypes.CurrentMonth) {
      model.value = {
        ...model.value,
        startDate: undefined,
        endDate: undefined,
      }
    } else {
      model.value = {
        ...model.value,
        startDate: dayjs().subtract(USAGE_PERIOD_MONTHS[period], 'month').format('YYYY-MM-DD'),
        endDate: yesterday,
      }
    }
  },
  { immediate: true },
)

const displayCircuitType = ref<DisplayCircuitType>(DisplayCircuitTypes.Main)
const displayCircuitTypeOptions = Object.values(DisplayCircuitTypes).map(value => ({
  value,
  text: t(`flowCollectors.${value}`),
}))

const aggregationMethod = ref<DisplayAggregationMethodType>(DisplayAggregationMethodTypes.Daily)
const aggregationMethodOptions = Object.values(DisplayAggregationMethodTypes).map(value => ({
  value,
  text: t(`flowCollectors.${value}`),
}))

watch(
  () => [model.value.startDate, model.value.endDate],
  ([startDate, endDate]) => {
    if (!startDate || !endDate) {
      return
    }
    if (dayjs(endDate).isBefore(startDate)) {
      model.value = { ...model.value, startDate: endDate, endDate: startDate }
    }
  },
)

const series = computed(() => formatSeries(props.usages, displayCircuitType.value, aggregationMethod.value))
const chartOptions = computed<Highcharts.Options>(() => ({
  ...defaultChartOptions,
  series: series.value,
  tooltip: { formatter: highchartsUnitFormatter('B', false) },
}))
</script>

<template>
  <div class="rounded-b-lg bg-white pa-8">
    <InnerCard :title="t('flowCollectors.chartDisplay')">
      <SeparatedGrid class="mt-n2" :label="t('period.label')">
        <RadioForm v-model="periodType" :options="periodOptions.slice(0, -1)" />
        <div class="flex-flex-start-center mt-3">
          <RadioForm v-model="periodType" :options="periodOptions.slice(-1)" col-min-width="90px" />
          <DatePicker
            :model-value="model?.startDate ?? ''"
            size="xSmall"
            :min-date="minDate"
            :max-date="yesterday"
            :start-date="yesterday"
            :disabled="periodDisabled"
            @update:model-value="(value: string) => (model.startDate = value || undefined)"
          />
          <div class="px-3">~</div>
          <DatePicker
            :model-value="model?.endDate ?? ''"
            size="xSmall"
            :min-date="minDate"
            :max-date="yesterday"
            :start-date="yesterday"
            :disabled="periodDisabled"
            @update:model-value="(value: string) => (model.endDate = value || undefined)"
          />
        </div>
      </SeparatedGrid>
      <div class="flex-flex-end-center mt-3">
        <CustomButton
          :text="t('flowCollectors.submitButton')"
          icon="right-arrow"
          :width="150"
          :disabled="disabled"
          @click="emits('submit')"
        />
      </div>
    </InnerCard>
    <template v-if="usages.length > 0">
      <InnerCard :title="t('flowCollectors.options')">
        <template #help>
          <div>{{ t('flowCollectors.note.vpnLogDisplayRule') }}</div>
        </template>
        <SeparatedGrid class="mt-n2" :label="t('flowCollectors.circuit')">
          <RadioForm v-model="displayCircuitType" :options="displayCircuitTypeOptions" col-min-width="120px" />
        </SeparatedGrid>
        <SeparatedGrid class="mt-2" :label="t('flowCollectors.aggregationMethod')">
          <RadioForm v-model="aggregationMethod" :options="aggregationMethodOptions" col-min-width="120px" />
        </SeparatedGrid>
      </InnerCard>
      <InnerCard :title="t('flowCollectors.usage')">
        <highcharts :options="chartOptions" :modules="['no-data-to-display']" />
      </InnerCard>
    </template>
  </div>
</template>
