<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { IntervalTypes } from '@/api/trafficTrends/constants'
import type { IntervalType } from '@/api/trafficTrends/types'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'

type PropType = {
  downloadDisabled: boolean
}
defineProps<PropType>()
const periodType = defineModel<PeriodType>('periodType', { required: true })
const model = defineModel<{ startTime: string; endTime: string; interval: IntervalType }>({ required: true })

type Emits = {
  (e: 'search'): void
  (e: 'download'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const selectablePeriodTypes = Object.values(PeriodTypes).filter(value => value !== PeriodTypes.Last2Weeks)
const validSearchPeriodDateTime = ref(true)
const diffMinutes = computed(() => Math.abs(dayjs(model.value.startTime).diff(model.value.endTime, 'minutes')))
watch(diffMinutes, next => {
  if (PeriodMinutesGapMap[PeriodTypes.Last1Week] < next) {
    // 期間が7日を超える場合はデータ間隔は1日にする
    model.value.interval = IntervalTypes.Interval1Day
  } else if (next < PeriodMinutesGapMap[PeriodTypes.Last1Day]) {
    // 期間が24時間未満の場合はデータ間隔1日は選択不可
    model.value.interval =
      model.value.interval === IntervalTypes.Interval1Day ? IntervalTypes.Interval15Minutes : model.value.interval
  }
})

const intervalOptions = computed(() => {
  // 期間が1週間以上 の場合は 1日平均 のみ選択可能
  const interval1DayOnly =
    PeriodMinutesGapMap[PeriodTypes.Last1Week] < diffMinutes.value || periodType.value === PeriodTypes.Last1Month
  // 期間が1日未満の場合は 1日平均 は選択不可
  const interval1DayDisabled = diffMinutes.value < PeriodMinutesGapMap[PeriodTypes.Last1Day]

  return Object.values(IntervalTypes).map(value => ({
    text: t(`trafficDetails.${value}`),
    value,
    disabled:
      (interval1DayOnly && value !== IntervalTypes.Interval1Day) ||
      (interval1DayDisabled && value === IntervalTypes.Interval1Day),
    help: value === IntervalTypes.Interval5Minutes ? t('trafficDetails.help.interval') : undefined,
  }))
})
</script>

<template>
  <InnerCard :title="t('trafficDetails.filterTitle')">
    <SearchPeriodDateTime
      v-model:period-type="periodType"
      v-model:start-date-time="model.startTime"
      v-model:end-date-time="model.endTime"
      :selectable-before-days="90"
      :min-gap-minutes="60"
      :period-types="selectablePeriodTypes"
      @valid="(valid: boolean) => (validSearchPeriodDateTime = valid)"
    />
    <SeparatedGrid class="mt-2" :label="t('trafficDetails.interval')">
      <RadioForm v-model="model.interval" :options="intervalOptions" col-min-width="120px" />
    </SeparatedGrid>
    <div class="flex-flex-end-center pt-3">
      <CustomButton
        icon="download"
        :text="t('trafficDetails.download')"
        :width="180"
        :disabled="downloadDisabled"
        @click="emits('download')"
      />
      <CustomButton
        class="ml-2"
        icon="reload"
        :text="t('common.update')"
        :width="180"
        :disabled="!validSearchPeriodDateTime"
        @click="emits('search')"
      />
    </div>
  </InnerCard>
</template>
