<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'

type PropType = {
  disabled?: boolean
  selectableBeforeDays?: number
  minutesSpan?: 1 | 5 | 15 | 30 | 60
  maxGapMinutes?: number
  minGapMinutes?: number
  periodTypes: PeriodType[]
}
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
  selectableBeforeDays: 0,
  maxGapMinutes: 0,
  minGapMinutes: 0,
  minutesSpan: 1,
})
const periodType = defineModel<PeriodType>('periodType', { required: true })
const startDateTime = defineModel<string>('startDateTime', { required: true })
const endDateTime = defineModel<string>('endDateTime', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const todayDayjs = dayjs().second(0).millisecond(0)
const { t } = useI18n()

const periodOptions = props.periodTypes.map(value => ({
  value,
  text: t(`period.${value}`),
}))
const periodDisabled = computed(() => periodType.value !== PeriodTypes.Free)
const maxGapDays = computed(() => (0 < props.maxGapMinutes ? Math.floor(props.maxGapMinutes / (60 * 24)) : 0))
const minGapHours = computed(() => (0 < props.minGapMinutes ? Math.floor(props.minGapMinutes / 60) : 0))

const errorMessage = computed(() => {
  if (!startDateTime.value || !endDateTime.value) {
    return t('period.invalid.required')
  }
  if (dayjs(startDateTime.value).isAfter(endDateTime.value, 'minutes')) {
    return t('period.invalid.startAfterEnd')
  }
  if (dayjs().isBefore(startDateTime.value, 'minutes') || dayjs().isBefore(endDateTime.value, 'minutes')) {
    return t('period.invalid.futureDateTime')
  }

  // minDateTime は minutesSpan で切り上げ
  const minDateTime = dayjs().subtract(props.selectableBeforeDays, 'days').ceil(props.minutesSpan, 'minute')
  if (
    props.selectableBeforeDays &&
    (minDateTime.isAfter(startDateTime.value, 'minutes') || minDateTime.isAfter(endDateTime.value, 'minutes'))
  ) {
    return t('period.invalid.pastDateTime', { dateTime: minDateTime.format('YYYY/MM/DD HH:mm') })
  }

  const diffMinutes = Math.abs(dayjs(endDateTime.value).diff(startDateTime.value, 'minutes'))
  if (0 < props.maxGapMinutes && props.maxGapMinutes < diffMinutes) {
    return t('period.invalid.maxRange', { days: maxGapDays.value })
  }
  if (0 < props.minGapMinutes && diffMinutes < props.minGapMinutes) {
    return t('period.invalid.minRange', { hours: minGapHours.value })
  }
  return ''
})
watch(errorMessage, next => emits('valid', !next), { immediate: true })

const startDateTimeInputValue = computed({
  get: () => {
    const [date, time] = startDateTime.value.split('T')
    const [hours, minutes] = time ? time.split(':') : ['00', '00']
    return { date: date || '', hours: hours || '00', minutes: minutes || '00' }
  },
  set: data => {
    if (data.date) {
      startDateTime.value = dayjs(`${data.date} ${data.hours || '00'}:${data.minutes || '00'}`).format()
    } else {
      startDateTime.value = ''
    }
  },
})
const endDateTimeInputValue = computed({
  get: () => {
    const [date, time] = endDateTime.value.split('T')
    const [hours, minutes] = time ? time.split(':') : ['00', '00']
    return { date: date || '', hours: hours || '00', minutes: minutes || '00' }
  },
  set: data => {
    if (data.date) {
      endDateTime.value = dayjs(`${data.date} ${data.hours || '00'}:${data.minutes || '00'}`).format()
    } else {
      endDateTime.value = ''
    }
  },
})

const minDate = computed(() => {
  return props.selectableBeforeDays
    ? dayjs().subtract(props.selectableBeforeDays, 'days').format('YYYY-MM-DD')
    : undefined
})
const startDateLimit = computed(() => {
  if (!maxGapDays.value || !endDateTime.value) {
    return { max: todayDayjs.format('YYYY-MM-DD'), min: minDate.value }
  }
  // 選択済みの日付から前後にdays日間の範囲を設定する
  const min = dayjs(endDateTime.value).subtract(maxGapDays.value, 'days')
  const max = dayjs(endDateTime.value).add(maxGapDays.value, 'days')
  return {
    min: min.isBefore(minDate.value, 'days') ? minDate.value : min.format('YYYY-MM-DD'),
    max: max.isAfter(todayDayjs, 'days') ? todayDayjs.format('YYYY-MM-DD') : max.format('YYYY-MM-DD'),
  }
})
const endDateLimit = computed(() => {
  if (!maxGapDays.value || !startDateTime.value) {
    return { max: todayDayjs.format('YYYY-MM-DD'), min: minDate.value }
  }
  // 選択済みの日付から前後にdays日間の範囲を設定する
  const min = dayjs(startDateTime.value).subtract(maxGapDays.value, 'days')
  const max = dayjs(startDateTime.value).add(maxGapDays.value, 'days')
  return {
    min: min.isBefore(minDate.value, 'days') ? minDate.value : min.format('YYYY-MM-DD'),
    max: max.isAfter(todayDayjs, 'days') ? todayDayjs.format('YYYY-MM-DD') : max.format('YYYY-MM-DD'),
  }
})

watch(
  () => [props.minutesSpan, periodType.value],
  () => {
    if (periodType.value !== PeriodTypes.Free) {
      const gap = PeriodMinutesGapMap[periodType.value]
      // 自由入力以外の期間を選択した場合は startTime と endTime を初期化
      startDateTime.value = dayjs().subtract(gap, 'minutes').floor(props.minutesSpan, 'minute').format()
      endDateTime.value = dayjs().floor(props.minutesSpan, 'minute').format()
    } else {
      // 自由入力を選択した場合は startTime と endTime の切り捨てをする
      startDateTime.value = dayjs(startDateTime.value).floor(props.minutesSpan, 'minute').format()
      endDateTime.value = dayjs(endDateTime.value).floor(props.minutesSpan, 'minute').format()
    }
  },
)
</script>

<template>
  <SeparatedGrid class="mt-2" :label="t('period.label')">
    <RadioForm v-model="periodType" :options="periodOptions.slice(0, -1)" :disabled="disabled" col-min-width="120px" />
    <div class="flex-flex-start-center mt-3">
      <RadioForm v-model="periodType" :options="periodOptions.slice(-1)" :disabled="disabled" col-min-width="150px" />
      <div class="max-w-900px flex-flex-start-center flex-wrap">
        <DateTimePicker
          v-model="startDateTimeInputValue"
          :minutes-span="minutesSpan"
          :max-date="startDateLimit?.max"
          :min-date="startDateLimit?.min"
          :start-date="startDateLimit?.max"
          :disabled="periodDisabled || disabled"
          :size="['xSmall', 'xxSmall']"
        />
        <div class="w-20px text-center">~</div>
        <DateTimePicker
          v-model="endDateTimeInputValue"
          :minutes-span="minutesSpan"
          :max-date="endDateLimit?.max"
          :min-date="endDateLimit?.min"
          :start-date="endDateLimit?.max"
          :disabled="periodDisabled || disabled"
          :size="['xSmall', 'xxSmall']"
        />
      </div>
    </div>
    <div v-if="errorMessage" class="ml-160px text-warning text-sm">{{ errorMessage }}</div>
  </SeparatedGrid>
</template>

<style lang="scss" scoped>
.max-w-900px {
  max-width: 900px;
}
.w-20px {
  width: 20px;
}
.ml-160px {
  margin-left: 160px;
}
</style>
