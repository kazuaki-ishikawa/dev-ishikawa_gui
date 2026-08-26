<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { SearchDateType } from '@/api/iwanUtil/types'

type PropType = {
  open: boolean
  installationPlaceCode: string
  reservedDates: { date: string; time: string }
  type: SearchDateType
  fieldSurveyLess?: boolean
  fieldSurveyDate?: string
  admissionApplicationRequired?: boolean
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'submit', reservedDates: { date: string; time: string }): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const selected = ref({ date: '', time: '' })

const { yearMonth, yearMonthOptions, getFirstReservableDate, searchedDate, iwanUtilSearchDate } =
  useIwanUtilSearchDate()
const submitDisabled = computed(() => !selected.value.date || !selected.value.time)

const yearMonthChange = (value: string) => {
  yearMonth.value = value
  if (props.type) {
    iwanUtilSearchDate({
      yearMonth: value,
      type: props.type,
      installationPlaceCode: props.installationPlaceCode,
      fieldSurveyLess: props.fieldSurveyLess,
      fieldSurveyDate: props.fieldSurveyDate,
      admissionApplicationRequired: props.admissionApplicationRequired,
    })
  }
}

const handleSubmit = () => {
  emits('submit', selected.value)
}

watch(
  () => props.open,
  next => {
    if (!next) {
      yearMonth.value = undefined
      selected.value = { date: '', time: '' }
      yearMonthOptions.value = []
      return
    }
    selected.value = props.reservedDates
    getFirstReservableDate({
      searchDateRequest: {
        type: props.type,
        installationPlaceCode: props.installationPlaceCode,
        fieldSurveyLess: props.fieldSurveyLess,
        fieldSurveyDate: props.fieldSurveyDate,
        admissionApplicationRequired: props.admissionApplicationRequired,
      },
      // 入力済みの date がある場合
      currentYearMonth: props.reservedDates.date ? dayjs(props.reservedDates.date).format('YYYY-MM') : undefined,
    })
  },
)
</script>

<template>
  <DialogBase
    :open="open"
    :disabled="submitDisabled"
    :submit-label="t('common.save')"
    :cancel-label="t('common.close')"
    @submit="handleSubmit"
    @close="emits('close')"
  >
    <GuaranteeReserveDateTable
      v-if="!!yearMonth"
      v-model:reserved-date="selected"
      :searched-date="searchedDate"
      :year-month="yearMonth"
      :year-month-options="yearMonthOptions"
      @update:year-month="yearMonthChange"
    />
  </DialogBase>
</template>
