<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IPOE_LINK } from '@/api/ipoes/constants'
import type { HikariCollaboResponse } from '@/api/ipoes/types'
import {
  ScheduledTime,
  ReserveDateTypes,
  initialReserveAttendances,
  initialReserveDates,
  initialReserveConstructionDateValid,
  AdmissionApplicationInfoTypes,
} from '@/api/hikariCollaboUtil/constants'
import type { ReserveDateType, AdmissionApplicationInfoType, TimeType } from '@/api/hikariCollaboUtil/types'

const Steps = {
  Input: 0,
  SelectPossibleDates: 1,
  Finished: 2,
} as const

type PropType = {
  open: boolean
  type: ReserveDateType
  hikariCollabo: HikariCollaboResponse
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'submit'): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const rules = useRules()
const { t } = useI18n()

const ipoeId = computed(() => props.hikariCollabo?.ipoeId ?? '')

const reserveDates = ref(structuredClone(initialReserveDates))
const tempReserveDates = ref(structuredClone(initialReserveDates))
const attendances = ref(structuredClone(initialReserveAttendances))
const inputValid = ref(structuredClone(initialReserveConstructionDateValid))
const isConfirmation = ref(false)
const step = ref(0)
const inputRef = ref<HTMLElement>()
const isAdmissionApplicationRequired = ref<string>('')
const reserveConstructionDateError = ref(false)

const { admissionApplicationInfoOptions } = useHikariCollaboUtils()
const { reserveConstructionDate } = useReserveConstructionDate()
const { NecessaryOptions } = useGuarantees()
const { loading } = useLoading()

const showFieldSurveyDateReserveMessage = computed(
  () => step.value === Steps.Input && props.type === ReserveDateTypes.FieldSurvey,
)
const admissionApplicationInfoHelp = computed(() => {
  switch (props.type) {
    case ReserveDateTypes.FieldSurvey:
      return {
        keypath: 'ipoes.help.fieldSurveyAdmissionApplicationInfo',
        link: IPOE_LINK.FIBER_FIELD_SURVEY_CONTACT,
      }
    case ReserveDateTypes.Construction:
      return {
        keypath: 'ipoes.help.constructionAdmissionApplicationInfo',
        link: IPOE_LINK.FIBER_CONSTRUCTION,
      }
    default:
      return undefined
  }
})

const submitDisabled = computed(() => {
  switch (step.value) {
    case Steps.Input:
      return Object.values(inputValid.value).some(valid => !valid)
    case Steps.SelectPossibleDates:
      return !reserveDates.value.date
    default:
      return false
  }
})
const submitLabel = computed(() => {
  switch (step.value) {
    case Steps.Input:
      return isConfirmation.value ? t('common.register') : t('common.confirm')
    case Steps.SelectPossibleDates:
      return t('common.save')
    case Steps.Finished: {
      if (props.type === ReserveDateTypes.FieldSurvey) {
        return t('ipoeConstruction.constructionDateReserve')
      } else {
        return t('common.close')
      }
    }
    default:
      return t('common.close')
  }
})
const cancelLabel = computed(() => {
  if (step.value === Steps.Input) {
    return isConfirmation.value ? t('common.return') : t('common.close')
  }
  if (step.value === Steps.SelectPossibleDates) {
    return t('common.close')
  }
  if (step.value === Steps.Finished && props.type === ReserveDateTypes.FieldSurvey) {
    return t('common.close')
  }
  return undefined
})

const title = computed(() => {
  switch (props.type) {
    case ReserveDateTypes.Construction:
      return t('ipoeConstruction.construction')
    case ReserveDateTypes.FieldSurvey:
      return t('ipoeConstruction.fieldSurvey')
    case ReserveDateTypes.Removal:
      return t('ipoeConstruction.visitCollection')
    default:
      return t('ipoeConstruction.possibleDates')
  }
})
const reserveTimeValue = computed(() =>
  reserveDates.value.time ? ScheduledTime[reserveDates.value.time as TimeType] : '',
)
// attendances.admissionApplicationInfo が有効な AdmissionApplicationInfoTypes の値でない場合（空文字など）は
// undefined を返し、APIクエリに含めないようにする
const admissionApplicationInfo = computed(() =>
  Object.values(AdmissionApplicationInfoTypes).find(value => value === attendances.value.admissionApplicationInfo),
)
const filteredAdmissionApplicationInfoOptions = admissionApplicationInfoOptions.filter(
  value => value.value !== AdmissionApplicationInfoTypes.NoApplication,
)
const reserve = async () => {
  try {
    await reserveConstructionDate(ipoeId.value, {
      ...attendances.value,
      admissionApplicationInfo: attendances.value.admissionApplicationInfo as AdmissionApplicationInfoType,
      type: props.type,
      time: reserveDates.value.time as TimeType,
      date: reserveDates.value.date,
    })
    step.value = Steps.Finished
    isConfirmation.value = true
  } catch {
    // エラーが発生した場合 最初の画面にもどる
    reserveConstructionDateError.value = true
    step.value = Steps.Input
    isConfirmation.value = false
  }
}
const handleSubmit = () => {
  if (step.value === Steps.Input && isConfirmation.value) {
    reserve()
  } else if (step.value === Steps.Input) {
    isConfirmation.value = true
  } else if (step.value === Steps.SelectPossibleDates) {
    step.value = Steps.Input
    inputValid.value = { ...inputValid.value, date: true, time: true }
  } else if (step.value === Steps.Finished) {
    emits('submit')
  } else {
    emits('close')
  }
}
const handleClose = () => {
  if (step.value === Steps.Input && isConfirmation.value) {
    isConfirmation.value = false
  } else if (step.value === Steps.Input) {
    emits('close')
  } else if (step.value === Steps.SelectPossibleDates) {
    step.value = Steps.Input
    reserveDates.value = { ...tempReserveDates.value }
  } else if (step.value === Steps.Finished) {
    if (props.type === ReserveDateTypes.FieldSurvey) {
      emits('close')
    }
  }
}

const handleUpdateAdmissionApplicationRequired = (value: string) => {
  isAdmissionApplicationRequired.value = value
  attendances.value.admissionApplicationInfo = value === 'true' ? '' : AdmissionApplicationInfoTypes.NoApplication
  inputValid.value.admissionApplicationInfo = value !== 'true'
}

watch(
  () => props.open,
  next => {
    if (!next) {
      step.value = Steps.Input
      isConfirmation.value = false
      reserveConstructionDateError.value = false
      reserveDates.value = structuredClone(initialReserveDates)
      tempReserveDates.value = structuredClone(initialReserveDates)
      attendances.value = structuredClone(initialReserveAttendances)
      inputValid.value = structuredClone(initialReserveConstructionDateValid)
    }
  },
)
watch(step, next => {
  if (next === Steps.SelectPossibleDates) {
    tempReserveDates.value = { ...reserveDates.value }
  }
})
watch(isConfirmation, () => {
  inputRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})
</script>

<template>
  <DialogBase
    :open="open"
    :disabled="submitDisabled || loading"
    :submit-label="submitLabel"
    :cancel-label="cancelLabel"
    :cancel-icon="isConfirmation ? 'left-arrow' : 'right-arrow'"
    @submit="handleSubmit"
    @close="handleClose"
  >
    <div v-if="step === Steps.Input" ref="inputRef" class="px-5">
      <div v-if="showFieldSurveyDateReserveMessage" class="mb-2 text-warning text-pre-wrap">
        {{ t('ipoeConstruction.fieldSurveyDateReserveMessage') }}
      </div>
      <div
        v-if="!isConfirmation && reserveConstructionDateError"
        class="mb-2 text-error"
        data-cy="reserve-date-dialog-reserve-construction-date-error"
      >
        {{ t('ipoeConstruction.reserveDateError') }}
      </div>
      <div v-if="isConfirmation" class="mb-2">{{ t('ipoeConstruction.reserve', { type: title }) }}</div>
      <InnerCard :title="`${title}${t('ipoeConstruction.possibleDates')}`">
        <template v-if="type === ReserveDateTypes.FieldSurvey" #help>
          <i18n-t keypath="ipoes.help.fieldSurvey" scope="global">
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.FIBER_FIELD_SURVEY_DATE" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <template v-else-if="type === ReserveDateTypes.Construction" #help>
          <i18n-t keypath="ipoes.help.construction" scope="global">
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.FIBER_CONSTRUCTION_DATE" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <template #button>
          <CustomButton
            icon="right-arrow"
            :text="t('ipoeConstruction.selectPossibleDates')"
            :width="180"
            :disabled="isConfirmation || !attendances.admissionApplicationInfo"
            data-cy="reserve-date-dialog-select-reserve-date-time-button"
            @click="step++"
          />
        </template>
        <InputGrid required :label="t('ipoeConstruction.reserveDate')">
          <InputForm
            :model-value="reserveDates.date.replaceAll('-', '/')"
            disabled
            data-cy="reserve-date-dialog-reserve-date"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoeConstruction.reserveTime')">
          <InputForm :model-value="reserveTimeValue" disabled data-cy="reserve-date-dialog-reserve-time" />
        </InputGrid>
      </InnerCard>
      <InnerCard :title="t('ipoeConstruction.contacts')">
        <template v-if="type === ReserveDateTypes.FieldSurvey" #help>
          <i18n-t keypath="ipoes.help.fieldSurveyContacts" scope="global">
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.FIBER_FIELD_SURVEY_CONTACT" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>

        <template v-else-if="type === ReserveDateTypes.Construction" #help>
          <i18n-t keypath="ipoes.help.constructionContacts" scope="global">
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.FIBER_CONSTRUCTION" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <InputGrid
          required
          :label="t('ipoes.admissionApplicationRequired')"
          :help="t('ipoes.help.admissionApplicationRequired')"
        >
          <RadioForm
            :model-value="isAdmissionApplicationRequired"
            required
            :options="NecessaryOptions"
            :disabled="isConfirmation"
            data-cy="reserve-date-dialog-admission-application-required"
            @update:model-value="handleUpdateAdmissionApplicationRequired"
          />
        </InputGrid>
        <InputGrid
          v-if="isAdmissionApplicationRequired === 'true'"
          required
          :label="t('ipoes.admissionApplicationInfo')"
        >
          <template v-if="!!admissionApplicationInfoHelp" #help>
            <i18n-t :keypath="admissionApplicationInfoHelp.keypath" scope="global">
              <template #linkText>
                <NuxtLink :to="admissionApplicationInfoHelp.link" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <SelectForm
            v-model="attendances.admissionApplicationInfo"
            required
            :options="filteredAdmissionApplicationInfoOptions"
            :placeholder="filteredAdmissionApplicationInfoOptions[0]?.text"
            :disabled="isConfirmation"
            size="middle"
            data-cy="reserve-date-dialog-admission-application-info"
            @valid="(valid: boolean) => (inputValid.admissionApplicationInfo = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.companyName')">
          <InputForm
            v-model="attendances.attendanceCompanyName"
            :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
            required
            maxlength="41"
            :placeholder="t('placeholder.companyName')"
            :disabled="isConfirmation"
            data-cy="reserve-date-dialog-attendance-company-name"
            @valid="(valid: boolean) => (inputValid.attendanceCompanyName = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.departmentName')">
          <InputForm
            v-model="attendances.attendanceDepartmentName"
            :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
            required
            maxlength="20"
            placeholder="１部"
            :disabled="isConfirmation"
            data-cy="reserve-date-dialog-attendance-department-name"
            @valid="(valid: boolean) => (inputValid.attendanceDepartmentName = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.personName')">
          <InputForm
            v-model="attendances.attendancePersonName"
            :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
            required
            maxlength="16"
            :placeholder="t('placeholder.name')"
            :disabled="isConfirmation"
            data-cy="reserve-date-dialog-attendance-person-name"
            @valid="(valid: boolean) => (inputValid.attendancePersonName = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.personNameKana')">
          <InputForm
            v-model="attendances.attendancePersonNameKana"
            required
            :rules="[rules.nameKanaForHikariCollabo, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
            maxlength="32"
            :placeholder="t('placeholder.nameKana')"
            :disabled="isConfirmation"
            data-cy="reserve-date-dialog-attendance-person-name-kana"
            @valid="(valid: boolean) => (inputValid.attendancePersonNameKana = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.phoneNumber')">
          <InputForm
            v-model="attendances.attendancePhoneNumber"
            required
            :rules="[rules.phoneNumber]"
            maxlength="13"
            placeholder="03-0000-0000"
            :disabled="isConfirmation"
            data-cy="reserve-date-dialog-attendance-phone-number"
            @valid="(valid: boolean) => (inputValid.attendancePhoneNumber = valid)"
          />
        </InputGrid>
      </InnerCard>
    </div>
    <div v-else-if="step === Steps.SelectPossibleDates" class="pa-5">
      <ReserveDateTable
        v-model="reserveDates"
        :type="type"
        :ipoe-id="ipoeId"
        :admission-application-info="admissionApplicationInfo"
        data-cy="reserve-date-dialog-reserve-date-table"
      />
    </div>
    <div v-else-if="step === Steps.Finished" class="px-5 text-center">
      <div class="mb-1 text-pre-wrap">
        {{
          t('ipoeConstruction.reservedMessage', {
            type: title,
            date: formatDate(reserveDates.date),
            time: reserveTimeValue,
          })
        }}
      </div>
      <template v-if="props.type === ReserveDateTypes.FieldSurvey">
        <div class="mt-4 font-weight-bold">{{ t('ipoeConstruction.construcionRequiredMessage') }}</div>
        <div class="mb-4">{{ t('ipoeConstruction.construcionResetMessage') }}</div>
      </template>
    </div>
  </DialogBase>
</template>
