<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type {
  TrafficFlowRankTopType,
  TrafficFlowRankIntervalType,
  TrafficFlowRankDirectionType,
} from '@/api/trafficFlowRank/types'
import { TrafficFlowRankTopTypes, TrafficFlowRankIntervalTypes } from '@/api/trafficFlowRank/constants'
import { IconTypes } from '@/components/icons/constants'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'

type PropType = {
  isPaidPlan: boolean
  minutesSpan: 5 | 15 | 60
  disabled?: boolean
  hideSearchButton?: boolean
}
const props = defineProps<PropType>()
const periodType = defineModel<PeriodType>('periodType', { required: true })
const model = defineModel<{
  startTime: string
  endTime: string
  top: TrafficFlowRankTopType
  interval: TrafficFlowRankIntervalType
  direction: TrafficFlowRankDirectionType
}>({ required: true })
const validSearchPeriodDateTime = defineModel<boolean>('valid', { required: true })

type Emits = {
  (e: 'search'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const { intervalOptions, directionOptions } = useTrafficFlowRank()

const selectablePeriodTypes = Object.values(PeriodTypes).filter(value => value !== PeriodTypes.Last2Weeks)

const showSearchButton = computed(() => !props.hideSearchButton && !props.disabled)
// 有償プランの場合、期間は184日前まで・無償プランの場合、31日前まで指定可
const selectableBeforeDays = computed(() => (props.isPaidPlan ? 184 : 31))
// startTime と endTime の間隔は上限92日・無償プランの場合は31日
const maxGapMinutes = computed(() => (props.isPaidPlan ? 92 : 31) * 24 * 60)
const diffMinutes = computed(() => Math.abs(dayjs(model.value.endTime).diff(model.value.startTime, 'minutes')))

// top=100の場合は interval は選択不可
const intervalDisabled = computed(() => model.value.top === TrafficFlowRankTopTypes.Top100)
// 期間が1日未満の場合は 1日平均 は選択不可
const interval1DayDisabled = computed(() => diffMinutes.value < PeriodMinutesGapMap[PeriodTypes.Last1Day])

watch([diffMinutes, intervalDisabled], () => {
  // top=100の場合は interval は固定値にする
  // 7日以下: 5min, 14日以下: 15min, 14日より上: 1day
  if (intervalDisabled.value) {
    model.value.interval =
      diffMinutes.value <= PeriodMinutesGapMap[PeriodTypes.Last1Week]
        ? TrafficFlowRankIntervalTypes.Interval5Minutes
        : diffMinutes.value <= 14 * 24 * 60
          ? TrafficFlowRankIntervalTypes.Interval15Minutes
          : TrafficFlowRankIntervalTypes.Interval1Day
  }
})
watch(interval1DayDisabled, next => {
  // 1日平均が選択不可の場合は interval を 15分にする
  if (next && model.value.interval === TrafficFlowRankIntervalTypes.Interval1Day) {
    model.value.interval = TrafficFlowRankIntervalTypes.Interval15Minutes
  }
})

const filteredIntervalOptions = computed(() =>
  intervalOptions.map(option => ({
    ...option,
    disabled: interval1DayDisabled.value && option.value === TrafficFlowRankIntervalTypes.Interval1Day,
  })),
)

const countOptions = computed(() => {
  return [
    { value: TrafficFlowRankTopTypes.Top10, text: t('trafficFlow.top10') },
    {
      value: TrafficFlowRankTopTypes.Top100,
      text: t('trafficFlow.top100'),
      disabled: !props.isPaidPlan,
      icon: !props.isPaidPlan ? IconTypes.Lock : undefined,
    },
  ]
})
</script>

<template>
  <InnerCard :title="t('trafficDetails.filterTitle')">
    <SeparatedGrid class="mt-n2" :label="t('trafficFlow.counts')">
      <RadioForm v-model="model.top" :options="countOptions" :disabled="disabled" col-min-width="120px" />
    </SeparatedGrid>
    <SearchPeriodDateTime
      v-model:period-type="periodType"
      v-model:start-date-time="model.startTime"
      v-model:end-date-time="model.endTime"
      :minutes-span="minutesSpan"
      :disabled="disabled"
      :selectable-before-days="selectableBeforeDays"
      :max-gap-minutes="maxGapMinutes"
      :min-gap-minutes="60"
      :period-types="selectablePeriodTypes"
      @valid="(valid: boolean) => (validSearchPeriodDateTime = valid)"
    />
    <SeparatedGrid class="mt-2" :label="t('trafficDetails.interval')">
      <RadioForm
        v-model="model.interval"
        :options="filteredIntervalOptions"
        :disabled="intervalDisabled || disabled"
        col-min-width="120px"
      />
    </SeparatedGrid>
    <SeparatedGrid class="mt-2" :label="t('trafficFlow.direction')">
      <RadioForm v-model="model.direction" :options="directionOptions" :disabled="disabled" col-min-width="120px" />
    </SeparatedGrid>
    <div class="flex-flex-end-center pt-3">
      <CustomButton
        v-if="showSearchButton"
        icon="reload"
        :text="t('common.update')"
        :width="180"
        :disabled="!validSearchPeriodDateTime"
        @click="emits('search')"
      />
    </div>
  </InnerCard>
</template>
