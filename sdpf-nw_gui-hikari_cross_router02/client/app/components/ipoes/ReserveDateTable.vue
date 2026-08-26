<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { ScheduledTime } from '@/api/hikariCollaboUtil/constants'
import type { AdmissionApplicationInfoType, ReserveDateType } from '@/api/hikariCollaboUtil/types'

type PropType = {
  type: ReserveDateType
  ipoeId: string
  admissionApplicationInfo?: AdmissionApplicationInfoType
}
const model = defineModel<{ date: string; time: string }>({ required: true })
const props = defineProps<PropType>()

const yearMonth = ref('')
const yearMonthOptions = ref<Array<{ value: string; text: string }>>([])
const { t } = useI18n()
const { getYearMonthOptions } = useHikariCollaboUtils()
const { constructionDates, searchConstructionDate } = useSearchConstructionDate()

watch(constructionDates, next => {
  if (!next?.[0]) {
    yearMonth.value = dayjs().format('YYYY-MM')
    yearMonthOptions.value = getYearMonthOptions(dayjs().format())
    return
  }
  const constructionMinDateDayjs = dayjs(next[0].scheduledDate)
  if (!yearMonth.value) {
    // 初回(yearMonthが空)の時に yearMonthOptions を設定する
    yearMonthOptions.value = getYearMonthOptions(constructionMinDateDayjs.format())
    if (model.value.date && !constructionMinDateDayjs.isSame(model.value.date, 'months')) {
      // 保存後に、再度開いた場合登録済みの値で再検索
      yearMonthChange(dayjs(model.value.date).format('YYYY-MM'))
    } else {
      yearMonth.value = constructionMinDateDayjs.format('YYYY-MM')
    }
  }
})

const yearMonthChange = (value: string) => {
  yearMonth.value = value
  searchConstructionDate(props.ipoeId, {
    type: props.type,
    yearMonth: value,
    admissionApplicationInfo: props.admissionApplicationInfo,
  })
}

const handleClick = (date: string, time: string) => {
  model.value = { date, time }
}

onBeforeMount(() => {
  // 初回は yearMonth を指定しない
  searchConstructionDate(props.ipoeId, { type: props.type, admissionApplicationInfo: props.admissionApplicationInfo })
})
</script>

<template>
  <div>
    <div class="flex-center-center mb-2">
      <div class="text-size-sm px-3">{{ t('ipoeConstruction.possibleYearMonth') }}</div>
      <SelectForm
        :model-value="yearMonth"
        :options="yearMonthOptions"
        size="xSmall"
        required
        data-cy="reserve-date-table-year-month"
        @update:model-value="yearMonthChange"
      />
    </div>
    <div v-if="constructionDates.length === 0" class="h-200px flex-center-center text-lg">
      {{ t('ipoeConstruction.nothingReservableDate') }}
    </div>
    <div v-else class="d-flex">
      <div class="times">
        <div class="b-t b-l b-b h-30px pt-1" />
        <div
          v-for="[key, value] in Object.entries(ScheduledTime)"
          :key="key"
          class="b-l b-b time-table-cell h-30px text-center pt-1"
        >
          {{ value }}
        </div>
      </div>
      <div class="dates d-flex">
        <div v-for="data in constructionDates" :key="data.scheduledDate">
          <div class="b-t b-r b-b w-100px h-30px text-center pt-1">
            {{ data.scheduledDate.replaceAll('-', '/') }}
          </div>
          <div
            v-for="time in Object.keys(ScheduledTime)"
            :key="`${data.scheduledDate}-${time}`"
            class="b-r b-b time-table-cell h-30px text-center pt-1"
          >
            <div
              v-if="data.scheduledTimes?.find(st => st.scheduledTime === time)"
              class="radio"
              :class="{ checked: model.date === data.scheduledDate && model.time === time }"
              @click="() => handleClick(data.scheduledDate, time)"
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

.text-size-sm {
  font-size: 0.825rem;
}
.w-100px {
  width: 100px;
}
.h-30px {
  height: 30px;
}
.h-200px {
  height: 200px;
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
.time-table-cell:nth-of-type(4) {
  border-bottom-width: 3px;
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
