<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { SearchDateTypes } from '@/api/iwanUtil/constants'
import type { SearchDateType } from '@/api/iwanUtil/types'
import { initialGuaranteeFieldSurveyAndConstructionInputData, ReserveStatusTypes } from '@/api/guarantees/constants'
import type { GuaranteeResponse, GuaranteeFieldSurveyAndConstructionOrderPutRequest } from '@/api/guarantees/types'

const Steps = {
  Input: 0,
  Confirm: 1,
  ReservedDate: 2,
} as const

type PropType = {
  open: boolean
  guarantee: GuaranteeResponse
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'submit', request: GuaranteeFieldSurveyAndConstructionOrderPutRequest): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const { NecessaryOptions } = useGuarantees()

const {
  searchedDate,
  iwanUtilSearchDate,
  yearMonth,
  yearMonthOptions,
  getFirstReservableDate,
  addOriginalReservedDate,
} = useIwanUtilSearchDate()
const { getTimeText } = useHikariCollaboUtils()

const step = ref(0)
const inputData = ref({ fieldSurvey: { date: '', time: '' }, construction: { date: '', time: '' } })
const inputValid = ref({ fieldSurvey: { date: true, time: true }, construction: { date: true, time: true } })
const originalInputData = computed(() => ({
  fieldSurvey: { date: props.guarantee.fieldSurvey?.date ?? '', time: props.guarantee.fieldSurvey?.time ?? '' },
  construction: { date: props.guarantee.construction.date ?? '', time: props.guarantee.construction.time ?? '' },
}))
const constructionsInputData = ref(structuredClone(initialGuaranteeFieldSurveyAndConstructionInputData))
const constructionsValid = ref(false)
const inputRef = ref<HTMLElement>()

const invalid = computed(() => {
  if (!constructionsValid.value) {
    return true
  }

  if (props.guarantee.fieldSurveyLess) {
    return Object.values(inputValid.value.construction).some(valid => !valid)
  } else {
    return Object.values(inputValid.value).some(valid =>
      typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
    )
  }
})

const isConfirmation = computed(() => step.value === Steps.Confirm)
watch(isConfirmation, () => {
  inputRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

// 現地調査の希望日選択は 現調レス=true または 稼働調整依頼・訪問時刻指定=true の場合は選択不可
const fieldSurveyReserveDateButtonDisabled = computed(
  () => isConfirmation.value || props.guarantee.fieldSurveyLess || props.guarantee.fieldSurvey?.operationAdjustment,
)
// 宅内工事日は 現調レス=false かつ 現場調査日を入力されない または 稼働調整依頼・訪問時刻指定=true の場合は選択不可
const constructionReserveDateButtonDisabled = computed(
  () =>
    isConfirmation.value ||
    (!props.guarantee.fieldSurveyLess && !inputData.value.fieldSurvey.date) ||
    props.guarantee.construction.operationAdjustment,
)
const fieldSurveyReserveTime = computed(() => getTimeText(inputData.value.fieldSurvey.time))
const constructionReserveTime = computed(() => getTimeText(inputData.value.construction.time))

// 希望日選択ダイアログ
const searchDateType = ref<SearchDateType>()
const reservedDate = ref({ date: '', time: '' })

const getReservedDate = (type: SearchDateType) => {
  if (type === SearchDateTypes.FieldSurvey) {
    return { date: inputData.value.fieldSurvey.date, time: inputData.value.fieldSurvey.time }
  } else if (type === SearchDateTypes.Construction) {
    return { date: inputData.value.construction.date, time: inputData.value.construction.time }
  } else {
    return { date: '', time: '' }
  }
}

const handleReserveDateTableOpen = async (type: SearchDateType) => {
  searchDateType.value = type
  reservedDate.value = getReservedDate(type)
  // 入力済みの date がある場合
  const currentYearMonth = reservedDate.value.date ? dayjs(reservedDate.value.date).format('YYYY-MM') : undefined

  await getFirstReservableDate({
    searchDateRequest: {
      type,
      installationPlaceCode: props.guarantee.installationPlaceCode,
      admissionApplicationRequired: !!props.guarantee.fieldSurvey?.admissionApplicationRequired,
      fieldSurveyDate: inputData.value.fieldSurvey.date,
      fieldSurveyLess: props.guarantee.fieldSurveyLess,
    },
    currentYearMonth,
  })

  // 工事日の場合は、初回希望日時の追加をする
  if (searchDateType.value === SearchDateTypes.Construction) {
    addOriginalReservedDate(
      props.guarantee.construction.date || '',
      props.guarantee.construction.time,
      inputData.value.fieldSurvey.date,
      yearMonth.value,
    )
  }
  step.value = Steps.ReservedDate
}
const yearMonthChange = async (value: string) => {
  yearMonth.value = value
  if (searchDateType.value) {
    await iwanUtilSearchDate({
      type: searchDateType.value,
      installationPlaceCode: props.guarantee.installationPlaceCode,
      admissionApplicationRequired: !!props.guarantee.fieldSurvey?.admissionApplicationRequired,
      fieldSurveyDate: inputData.value.fieldSurvey.date,
      yearMonth: value,
    })
    if (searchDateType.value === SearchDateTypes.Construction) {
      addOriginalReservedDate(
        props.guarantee.construction.date || '',
        props.guarantee.construction.time,
        inputData.value.fieldSurvey.date,
        value,
      )
    }
  }
}

const handleReserveDateSubmit = () => {
  if (searchDateType.value === SearchDateTypes.FieldSurvey) {
    // 現地調査の場合は、宅内工事と開通希望日を初期化する
    // 入力済みの宅内工事日が再現調日＋16暦日以降の場合は初期化しない
    const noInitialization =
      dayjs(inputData.value.construction.date || reservedDate.value.date).diff(reservedDate.value.date, 'days') >= 16 ||
      props.guarantee.construction.operationAdjustment
    inputValid.value = {
      fieldSurvey: { date: true, time: true },
      construction: { date: noInitialization, time: noInitialization },
    }
    inputData.value = {
      fieldSurvey: { ...reservedDate.value },
      construction: noInitialization ? { ...inputData.value.construction } : { date: '', time: '' },
    }
  } else if (searchDateType.value === SearchDateTypes.Construction) {
    inputData.value = {
      fieldSurvey: { ...inputData.value.fieldSurvey },
      construction: { ...reservedDate.value },
    }
    inputValid.value = {
      fieldSurvey: { ...inputValid.value.fieldSurvey },
      construction: { date: true, time: true },
    }
  }
  searchDateType.value = undefined
  step.value = Steps.Input
}

const handleSubmit = () => {
  if (searchDateType.value) {
    handleReserveDateSubmit()
  } else if (step.value === Steps.Input) {
    step.value++
  } else {
    const request = {
      fieldSurvey: !isEqual(originalInputData.value.fieldSurvey, inputData.value.fieldSurvey)
        ? inputData.value.fieldSurvey
        : undefined,
      construction: !isEqual(originalInputData.value.construction, inputData.value.construction)
        ? inputData.value.construction
        : undefined,
    }
    emits('submit', request)
  }
}
const handleClose = () => {
  if (searchDateType.value) {
    searchDateType.value = undefined
    step.value = Steps.Input
  } else if (step.value === Steps.Input) {
    emits('close')
  } else {
    step.value = Steps.Input
  }
}

const includesSearchedDate = computed(() => {
  const found = searchedDate.value?.constructionDates.find(date => {
    const times = date.scheduledTimes?.map(time => time.scheduledTime) ?? []
    return (
      reservedDate.value.time &&
      date.scheduledDate === reservedDate.value.date &&
      times.includes(reservedDate.value.time)
    )
  })
  return !!found
})

const confirmationDisabled = computed(() => {
  if (searchDateType.value) {
    // カレンダーを表示中の場合
    return !reservedDate.value.date || !reservedDate.value.time || !includesSearchedDate.value
  } else {
    // それ以外
    return invalid.value || isEqual(originalInputData.value, inputData.value)
  }
})
const submitLabel = computed(() => (step.value === Steps.Input ? t('common.confirm') : t('common.save')))
const closeLabel = computed(() => {
  if (searchDateType.value || !isConfirmation.value) {
    // カレンダーの表示中もしくは入力欄表示中
    return t('common.close')
  } else {
    return t('common.return')
  }
})

const initializeInputData = () => {
  // 現地調査日が選択可能な今日以前の場合は、初期化・確認ボタンを押せないようにする
  const isFieldSurveyInvalid =
    !!props.guarantee.fieldSurvey?.date && dayjs().isAfter(props.guarantee.fieldSurvey.date, 'days')
  // 予約状況が予約完了の場合は、既存の値で補完する
  const isFieldSurveyApproved = props.guarantee.fieldSurvey?.reserveStatus === ReserveStatusTypes.Approved

  // 宅内工事日が現地調査日以前の場合 or 現地調査日が空文字になる場合は、初期化・確認ボタンを押せないようにする
  const isConstructionInvalid =
    isFieldSurveyInvalid ||
    (!!props.guarantee.construction.date && dayjs().isAfter(props.guarantee.construction.date, 'days'))
  // 予約状況が予約完了の場合は、既存の値で補完する
  const isConstructionApproved = props.guarantee.construction?.reserveStatus === ReserveStatusTypes.Approved

  const fieldSurvey =
    isFieldSurveyInvalid || !isFieldSurveyApproved ? { date: '', time: '' } : { ...originalInputData.value.fieldSurvey }
  const construction =
    isConstructionInvalid || !isConstructionApproved
      ? { date: '', time: '' }
      : { ...originalInputData.value.construction }

  inputData.value = { fieldSurvey, construction }
  inputValid.value = {
    fieldSurvey: {
      date: !isFieldSurveyInvalid && isFieldSurveyApproved,
      time: !isFieldSurveyInvalid && isFieldSurveyApproved,
    },
    construction: {
      date: !isConstructionInvalid && isConstructionApproved,
      time: !isConstructionInvalid && isConstructionApproved,
    },
  }
}

watch(
  () => props.open,
  next => {
    if (!next) {
      return
    }
    step.value = Steps.Input
    initializeInputData()
    constructionsInputData.value = {
      fieldSurvey: {
        operationAdjustment: `${!!props.guarantee.fieldSurvey?.operationAdjustment}`,
        preContactCompanyName: props.guarantee.fieldSurvey?.preContactCompanyName ?? '',
        preContactPersonName: props.guarantee.fieldSurvey?.preContactPersonName ?? '',
        preContactPhoneNumber: props.guarantee.fieldSurvey?.preContactPhoneNumber ?? '',
        attendanceCompanyName: props.guarantee.fieldSurvey?.attendanceCompanyName ?? '',
        attendancePersonName: props.guarantee.fieldSurvey?.attendancePersonName ?? '',
        attendancePhoneNumber: props.guarantee.fieldSurvey?.attendancePhoneNumber ?? '',
      },
      construction: {
        operationAdjustment: `${!!props.guarantee.construction?.operationAdjustment}`,
        preContactCompanyName: props.guarantee.construction?.preContactCompanyName ?? '',
        preContactPersonName: props.guarantee.construction?.preContactPersonName ?? '',
        preContactPhoneNumber: props.guarantee.construction?.preContactPhoneNumber ?? '',
        attendanceCompanyName: props.guarantee.construction?.attendanceCompanyName ?? '',
        attendancePersonName: props.guarantee.construction?.attendancePersonName ?? '',
        attendancePhoneNumber: props.guarantee.construction?.attendancePhoneNumber ?? '',
      },
    }
  },
)
</script>

<template>
  <DialogBase
    :open="open"
    :submit-label="submitLabel"
    :cancel-label="closeLabel"
    :cancel-icon="isConfirmation ? 'left-arrow' : 'right-arrow'"
    :disabled="confirmationDisabled"
    @submit="handleSubmit"
    @close="handleClose"
  >
    <div v-if="step === Steps.ReservedDate" class="px-5">
      <GuaranteeReserveDateTable
        v-if="!!yearMonth"
        v-model:reserved-date="reservedDate"
        :searched-date="searchedDate"
        :year-month="yearMonth"
        :year-month-options="yearMonthOptions"
        :field-survey-less="props.guarantee.fieldSurveyLess"
        @update:year-month="yearMonthChange"
      />
    </div>
    <div v-else ref="inputRef" class="px-5">
      <div v-if="isConfirmation" class="mb-2">{{ t('guarantees.applicationConfirmation') }}</div>
      <!-- 現地調査・宅内工事希望日 -->
      <InnerCard :title="t('guarantees.fieldSurveyConstructionReserveDate')">
        <div class="pt-3 flex-space-between-center">
          <div class="text-lg text-secondary">{{ t('guarantees.fieldSurvey') }}</div>
          <CustomButton
            icon="right-arrow"
            :text="t('guarantees.selectFieldSurveyDateTime')"
            :width="250"
            :disabled="fieldSurveyReserveDateButtonDisabled"
            data-cy="edit-field-survey-and-construction-dialog-field-survey-reserve-date-button"
            @click="handleReserveDateTableOpen(SearchDateTypes.FieldSurvey)"
          />
        </div>
        <InputGrid :label="t('guarantees.fieldSurveyLess')">
          <CheckboxBase
            :value="props.guarantee.fieldSurveyLess"
            disabled
            data-cy="edit-field-survey-and-construction-dialog-field-survey-less"
          />
        </InputGrid>
        <InputGrid
          :label="t('guarantees.admissionApplicationRequired')"
          :help="t('guarantees.help.admissionApplicationRequired')"
        >
          <RadioForm
            :model-value="`${guarantee.fieldSurvey?.admissionApplicationRequired ?? ''}`"
            :options="NecessaryOptions"
            :required="!props.guarantee.fieldSurveyLess"
            disabled
            data-cy="edit-field-survey-and-construction-dialog-field-survey-admission-application-required"
          />
        </InputGrid>
        <InputGrid :required="!props.guarantee.fieldSurveyLess" :label="t('guarantees.reserveDate')">
          <InputForm
            :model-value="`${inputData.fieldSurvey.date}  ${fieldSurveyReserveTime}`"
            placeholder="2024-01-01"
            disabled
            data-cy="edit-field-survey-and-construction-dialog-field-survey-date-time"
          />
        </InputGrid>
        <InputGrid :label="t('guarantees.operationAdjustmentSpecifiedVisitDateTime')">
          <CheckboxBase
            :value="constructionsInputData.fieldSurvey.operationAdjustment === 'true'"
            disabled
            data-cy="edit-field-survey-and-construction-dialog-field-survey-operation-adjustment"
          />
        </InputGrid>
        <div class="pt-3 flex-space-between-center">
          <div class="text-lg text-secondary">{{ t('guarantees.construction') }}</div>
          <CustomButton
            icon="right-arrow"
            :text="t('guarantees.selectConstructionDateTime')"
            :width="250"
            :disabled="constructionReserveDateButtonDisabled"
            data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"
            @click="handleReserveDateTableOpen(SearchDateTypes.Construction)"
          />
        </div>
        <InputGrid
          :label="t('guarantees.admissionApplicationRequired')"
          :help="t('guarantees.help.admissionApplicationRequired')"
        >
          <RadioForm
            :model-value="`${guarantee.construction.admissionApplicationRequired}`"
            :options="NecessaryOptions"
            required
            disabled
            data-cy="edit-field-survey-and-construction-dialog-construction-admission-application-required"
          />
        </InputGrid>
        <InputGrid required :label="t('guarantees.reserveDate')">
          <InputForm
            :model-value="`${inputData.construction.date}  ${constructionReserveTime}`"
            placeholder="2024-01-01"
            disabled
            data-cy="edit-field-survey-and-construction-dialog-construction-date-time"
          />
        </InputGrid>
        <InputGrid :label="t('guarantees.operationAdjustmentSpecifiedVisitDateTime')">
          <CheckboxBase
            :value="constructionsInputData.construction.operationAdjustment === 'true'"
            disabled
            data-cy="edit-field-survey-and-construction-dialog-construction-operation-adjustment"
          />
        </InputGrid>
      </InnerCard>

      <!-- 現地調査・宅内工事希望日 -->
      <EditFieldSurveyAndConstruction
        v-model:input="constructionsInputData"
        :field-survey-less="props.guarantee.fieldSurveyLess"
        :disabled="isConfirmation"
        is-order-request
        @valid="valid => (constructionsValid = valid)"
      />
    </div>
  </DialogBase>
</template>
