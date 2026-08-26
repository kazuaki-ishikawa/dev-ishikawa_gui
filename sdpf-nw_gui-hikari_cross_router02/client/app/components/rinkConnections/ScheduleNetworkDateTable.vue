<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

const ScheduleNetworkTime = {
  '08:00': '08:00-10:00',
  '10:00': '10:00-12:00',
  '12:00': '12:00-14:00',
  '14:00': '14:00-16:00',
} as const
type ScheduleNetworkTimeKeyType = keyof typeof ScheduleNetworkTime

type PropType = {
  scheduleNetworkList: string[]
}
const props = defineProps<PropType>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const selectedYearMonth = ref('')
const sortedScheduleNetworkList = computed(() => props.scheduleNetworkList.toSorted())

const scheduleNetworkDateTimeMap = computed<Map<string, { date: string; time: ScheduleNetworkTimeKeyType }>>(() => {
  return sortedScheduleNetworkList.value.reduce((acc, scheduleTime) => {
    const [date, time] = dayjs(scheduleTime).format('YYYY-MM-DD HH:mm').split(' ')
    if (date && time && Object.keys(ScheduleNetworkTime).includes(time)) {
      return acc.set(scheduleTime, { date, time: time as ScheduleNetworkTimeKeyType })
    }
    return acc
  }, new Map<string, { date: string; time: ScheduleNetworkTimeKeyType }>())
})

const selectedDateTime = computed(() => {
  return scheduleNetworkDateTimeMap.value.get(model.value) || { date: '', time: '' }
})

const yearMonthOptions = computed(() => {
  if (!sortedScheduleNetworkList.value.length) {
    return []
  }

  const yearMonthList = sortedScheduleNetworkList.value.map(date => date.substring(0, 7))
  return Array.from(new Set<string>(yearMonthList)).map(yearMonth => ({
    value: yearMonth,
    text: yearMonth.replace('-', '/'),
  }))
})

// yearMonthOptions の各年月に対して、scheduleNetworkDateTimeMap から日付と時間のマップを作成する
const tableDataMap = computed<Map<string, Array<[string, ScheduleNetworkTimeKeyType[]]>>>(() => {
  const isSameMinDateAndThisMonth = dayjs().isSame(sortedScheduleNetworkList.value[0], 'month')

  // レスポンスに入ってない日付を補完する
  const dateList = yearMonthOptions.value
    .map((option, index) => {
      // option.value が今月の場合はレスポンスの最小値が基準日、それ以外は1日が基準日
      const foundBaseDateDayjs =
        isSameMinDateAndThisMonth && index === 0
          ? dayjs(sortedScheduleNetworkList.value[0])
          : dayjs(`${option.value}-01`)
      const diffDays = foundBaseDateDayjs.endOf('month').diff(foundBaseDateDayjs, 'day') + 1
      return Array.from({ length: diffDays }, (_, i) => foundBaseDateDayjs.add(i, 'day').format('YYYY-MM-DD'))
    })
    .flat()

  const mapList = yearMonthOptions.value.map<[string, Array<[string, ScheduleNetworkTimeKeyType[]]>]>(option => {
    const dateTimeMap = Array.from(scheduleNetworkDateTimeMap.value.values()).reduce((acc, { date, time }) => {
      if (date.startsWith(option.value)) {
        const found = acc.get(date)
        if (found) {
          acc.set(date, [...found, time])
        } else {
          acc.set(date, [time])
        }
      }
      return acc
    }, new Map<string, ScheduleNetworkTimeKeyType[]>())

    const replaceDateTimeMap = dateList.reduce((acc, date) => {
      if (!date.startsWith(option.value)) {
        return acc
      }
      const foundTimes = dateTimeMap.get(date)
      acc.set(date, foundTimes || [])
      return acc
    }, new Map<string, ScheduleNetworkTimeKeyType[]>())

    return [option.value, Array.from(replaceDateTimeMap.entries())]
  })

  return new Map(mapList)
})
const tableData = computed<Array<[string, ScheduleNetworkTimeKeyType[]]>>(() => {
  return tableDataMap.value.get(selectedYearMonth.value) || []
})

const handleTimeSelect = (data: { date: string; time: string }) => {
  const matchedScheduleTime = Array.from(scheduleNetworkDateTimeMap.value.entries()).find(
    ([, { date, time }]) => date === data.date && time === data.time,
  )
  model.value = matchedScheduleTime?.[0] || ''
}

watch(
  [yearMonthOptions, model],
  ([newYearMonths, newTimeFrame]) => {
    if (newYearMonths.length > 0 && !selectedYearMonth.value) {
      // selectedYearMonth 未設定時、最初の年月を設定
      selectedYearMonth.value =
        scheduleNetworkDateTimeMap.value.get(newTimeFrame)?.date?.substring(0, 7) || newYearMonths[0]?.value || ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <div data-cy="schedule-network-date-table">
    <div class="flex-center-center mb-2">
      <div text-size-sm px-3>{{ t('ipoeConstruction.possibleYearMonth') }}</div>
      <SelectForm v-model="selectedYearMonth" :options="yearMonthOptions" required size="xSmall" />
    </div>
    <div v-if="!tableData.length" class="flex-center-center h-200px text-lg">
      {{ t('ipoeConstruction.nothingReservableDate') }}
    </div>
    <div v-else class="d-flex">
      <div class="times">
        <div class="b-t b-l b-b date-cell h-30px pt-1" />
        <div
          v-for="timeValue in Object.values(ScheduleNetworkTime)"
          :key="timeValue"
          class="b-l b-b text-center h-30px pt-1"
        >
          {{ timeValue }}
        </div>
      </div>
      <div class="dates">
        <div v-for="[date, times] in tableData" :key="date">
          <div class="b-t b-r b-b date-cell w-100px h-30px text-center pt-1">
            {{ date.replaceAll('-', '/') }}
          </div>
          <div
            v-for="timeKey in Object.keys(ScheduleNetworkTime)"
            :key="`${date}-${timeKey}`"
            class="b-r b-b text-center h-30px pt-1"
          >
            <div
              v-if="times.includes(timeKey)"
              class="radio"
              :class="{
                checked: selectedDateTime.date === date && selectedDateTime.time === timeKey,
              }"
              @click="() => handleTimeSelect({ date, time: timeKey })"
            >
              <div class="button" />
            </div>
            <div v-else>-</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));

.h-200px {
  height: 200px;
}
.h-30px {
  height: 30px;
}
.w-100px {
  width: 100px;
}
.times {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;
  background: #fff;
  border-right: v.$split-bold-border;
  min-width: 100px;
}
.dates {
  display: flex;
  overflow: auto;
  width: calc(100% - 100px);
}
.b-t {
  border-top: v.$split-border;
}
.b-l {
  border-left: v.$split-border;
}
.b-r {
  border-right: v.$split-border;
}
.b-b {
  border-bottom: v.$split-border;
}
.date-cell {
  border-bottom-width: 2px;
}

.radio {
  position: relative;
  cursor: pointer;
  &.checked .button {
    border: 1px solid $secondary-color;
    &::after {
      width: 12px;
      height: 12px;
    }
  }

  .button {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid $info-color;
    position: absolute;
    top: 0.2rem;
    left: calc(50% - 10px);
    background-color: #fff;
    &::after {
      content: '';
      display: block;
      background-color: $secondary-color;
      border-radius: 50%;
      position: absolute;
      top: 0.25rem;
      left: 0.25rem;
    }
  }
}
</style>
