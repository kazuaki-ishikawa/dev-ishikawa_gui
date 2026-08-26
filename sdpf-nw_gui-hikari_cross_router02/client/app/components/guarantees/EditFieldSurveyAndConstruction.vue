<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  initialGuaranteeFieldSurveyAndConstructionInputData,
  initialGuaranteeFieldSurveyAndConstructionValid,
  GUARANTEE_LINK,
} from '@/api/guarantees/constants'

type PropType = {
  disabled: boolean
  fieldSurveyLess: boolean
  isOrderRequest?: boolean
}
const inputData = defineModel<typeof initialGuaranteeFieldSurveyAndConstructionInputData>('input', { required: true })
const props = withDefaults(defineProps<PropType>(), {
  isOrderRequest: false,
})

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const inputValid = ref(structuredClone(initialGuaranteeFieldSurveyAndConstructionValid))

const fieldSurveyPreContactChecked = ref(false)
const handleFieldSurveySamePreContactClick = (checked: boolean) => {
  fieldSurveyPreContactChecked.value = checked
  if (checked) {
    inputData.value = {
      fieldSurvey: {
        ...inputData.value.fieldSurvey,
        attendanceCompanyName: inputData.value.fieldSurvey.preContactCompanyName,
        attendancePersonName: inputData.value.fieldSurvey.preContactPersonName,
        attendancePhoneNumber: inputData.value.fieldSurvey.preContactPhoneNumber,
      },
      construction: { ...inputData.value.construction },
    }
  }
}
const constructionPreContactChecked = ref(false)
const handleConstructionSamePreContactClick = (checked: boolean) => {
  constructionPreContactChecked.value = checked
  if (checked) {
    inputData.value = {
      fieldSurvey: { ...inputData.value.fieldSurvey },
      construction: {
        ...inputData.value.construction,
        attendanceCompanyName: inputData.value.construction.preContactCompanyName,
        attendancePersonName: inputData.value.construction.preContactPersonName,
        attendancePhoneNumber: inputData.value.construction.preContactPhoneNumber,
      },
    }
  }
}

const invalid = computed(() =>
  props.fieldSurveyLess
    ? Object.values(inputValid.value.construction).some(valid => !valid)
    : Object.values(inputValid.value).some(valid =>
        typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
      ),
)

const fieldSurveyRequired = computed(() => !props.fieldSurveyLess && !props.isOrderRequest)
const constructionRequired = computed(() => !props.isOrderRequest)

watch(
  () => props.fieldSurveyLess,
  next => {
    if (next) {
      constructionPreContactChecked.value = false
      fieldSurveyPreContactChecked.value = false
      inputData.value.fieldSurvey = { ...initialGuaranteeFieldSurveyAndConstructionInputData.fieldSurvey }
    } else {
      inputValid.value.fieldSurvey = { ...initialGuaranteeFieldSurveyAndConstructionValid.fieldSurvey }
    }
  },
)

watch(invalid, next => emits('valid', !next), { immediate: true })
</script>

<template>
  <div>
    <!-- 現地調査詳細情報 -->
    <InnerCard :title="t('guarantees.fieldSurveyDetailsInformation')">
      <template #help>
        <i18n-t keypath="guarantees.help.detailsInformation" scope="global">
          <template #operation>
            {{ t('guarantees.fieldSurvey') }}
          </template>
          <template #linkText>
            <NuxtLink :to="GUARANTEE_LINK.LOCAL_DETAILS" target="_blank">{{ t('common.here') }}</NuxtLink>
          </template>
        </i18n-t>
      </template>
      <!-- 事前連絡先 -->
      <div class="flex-flex-start-center pt-3 text-lg text-secondary">
        {{ t('guarantees.preContact') }}
        <HelpTooltip class="px-2 pt-1 text-base" size="smallMiddle">
          {{ t('guarantees.help.preContact', { operation: t('guarantees.fieldSurvey') }) }}
        </HelpTooltip>
      </div>
      <InputGrid :required="fieldSurveyRequired" :label="t('guarantees.preContactCompanyName')">
        <InputForm
          v-model="inputData.fieldSurvey.preContactCompanyName"
          :required="fieldSurveyRequired"
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
          maxlength="15"
          placeholder="株式会社"
          :disabled="disabled || !fieldSurveyRequired"
          data-cy="edit-field-survey-and-construction-field-survey-pre-contact-company-name"
          @valid="(valid: boolean) => (inputValid.fieldSurvey.preContactCompanyName = valid)"
        />
      </InputGrid>
      <InputGrid :required="fieldSurveyRequired" :label="t('guarantees.preContactPersonName')">
        <InputForm
          v-model="inputData.fieldSurvey.preContactPersonName"
          :required="fieldSurveyRequired"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
          maxlength="6"
          :placeholder="t('placeholder.name')"
          :disabled="disabled || !fieldSurveyRequired"
          data-cy="edit-field-survey-and-construction-field-survey-pre-contact-person-name"
          @valid="(valid: boolean) => (inputValid.fieldSurvey.preContactPersonName = valid)"
        />
      </InputGrid>
      <InputGrid :required="fieldSurveyRequired" :label="t('guarantees.preContactPhoneNumber')">
        <InputForm
          v-model="inputData.fieldSurvey.preContactPhoneNumber"
          :required="fieldSurveyRequired"
          :rules="[rules.phoneNumber]"
          maxlength="13"
          placeholder="03-0000-0000"
          :disabled="disabled || !fieldSurveyRequired"
          data-cy="edit-field-survey-and-construction-field-survey-pre-contact-phone-number"
          @valid="(valid: boolean) => (inputValid.fieldSurvey.preContactPhoneNumber = valid)"
        />
      </InputGrid>
      <!-- 立会者情報 -->
      <AttendanceInformationLabel
        :checked="fieldSurveyPreContactChecked"
        :show-checkbox="fieldSurveyRequired"
        :disabled="disabled"
        :help="t('guarantees.help.attendanceInformation', { operation: t('guarantees.fieldSurvey') })"
        data-cy="edit-field-survey-and-construction-field-survey-attendance-information-label"
        @update:checked="handleFieldSurveySamePreContactClick"
      />
      <InputGrid :required="fieldSurveyRequired" :label="t('guarantees.attendanceCompanyName')">
        <InputForm
          v-model="inputData.fieldSurvey.attendanceCompanyName"
          :required="fieldSurveyRequired"
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
          maxlength="50"
          placeholder="株式会社営業部１課"
          :disabled="disabled || fieldSurveyPreContactChecked || !fieldSurveyRequired"
          data-cy="edit-field-survey-and-construction-field-survey-attendance-company-name"
          @valid="(valid: boolean) => (inputValid.fieldSurvey.attendanceCompanyName = valid)"
        />
      </InputGrid>
      <InputGrid :required="fieldSurveyRequired" :label="t('guarantees.attendancePersonName')">
        <InputForm
          v-model="inputData.fieldSurvey.attendancePersonName"
          :required="fieldSurveyRequired"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
          maxlength="20"
          :placeholder="t('placeholder.name')"
          :disabled="disabled || fieldSurveyPreContactChecked || !fieldSurveyRequired"
          data-cy="edit-field-survey-and-construction-field-survey-attendance-person-name"
          @valid="(valid: boolean) => (inputValid.fieldSurvey.attendancePersonName = valid)"
        />
      </InputGrid>
      <InputGrid :required="fieldSurveyRequired" :label="t('guarantees.attendancePhoneNumber')">
        <InputForm
          v-model="inputData.fieldSurvey.attendancePhoneNumber"
          :required="fieldSurveyRequired"
          :rules="[rules.phoneNumber]"
          maxlength="13"
          placeholder="03-0000-0000"
          :disabled="disabled || fieldSurveyPreContactChecked || !fieldSurveyRequired"
          data-cy="edit-field-survey-and-construction-field-survey-attendance-phone-number"
          @valid="(valid: boolean) => (inputValid.fieldSurvey.attendancePhoneNumber = valid)"
        />
      </InputGrid>
    </InnerCard>

    <!-- 宅内工事詳細情報 -->
    <InnerCard :title="t('guarantees.constructionDetailsInformation')">
      <template #help>
        <i18n-t keypath="guarantees.help.detailsInformation" scope="global">
          <template #operation>
            {{ t('guarantees.construction') }}
          </template>
          <template #linkText>
            <NuxtLink :to="GUARANTEE_LINK.HOUSE_DETAILS" target="_blank">{{ t('common.here') }}</NuxtLink>
          </template>
        </i18n-t>
      </template>
      <!-- 事前連絡先 -->
      <div class="flex-flex-start-center pt-3 text-lg text-secondary">
        {{ t('guarantees.preContact') }}
        <HelpTooltip class="px-2 pt-1 text-base" size="smallMiddle">
          {{ t('guarantees.help.preContact', { operation: t('guarantees.construction') }) }}
        </HelpTooltip>
      </div>
      <InputGrid :required="constructionRequired" :label="t('guarantees.preContactCompanyName')">
        <InputForm
          v-model="inputData.construction.preContactCompanyName"
          :required="constructionRequired"
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
          maxlength="15"
          placeholder="株式会社"
          :disabled="disabled || !constructionRequired"
          data-cy="edit-field-survey-and-construction-construction-pre-contact-company-name"
          @valid="(valid: boolean) => (inputValid.construction.preContactCompanyName = valid)"
        />
      </InputGrid>
      <InputGrid :required="constructionRequired" :label="t('guarantees.preContactPersonName')">
        <InputForm
          v-model="inputData.construction.preContactPersonName"
          :required="constructionRequired"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
          maxlength="6"
          :placeholder="t('placeholder.name')"
          :disabled="disabled || !constructionRequired"
          data-cy="edit-field-survey-and-construction-construction-pre-contact-person-name"
          @valid="(valid: boolean) => (inputValid.construction.preContactPersonName = valid)"
        />
      </InputGrid>
      <InputGrid :required="constructionRequired" :label="t('guarantees.preContactPhoneNumber')">
        <InputForm
          v-model="inputData.construction.preContactPhoneNumber"
          :required="constructionRequired"
          :rules="[rules.phoneNumber]"
          maxlength="13"
          placeholder="03-0000-0000"
          :disabled="disabled || !constructionRequired"
          data-cy="edit-field-survey-and-construction-construction-pre-contact-phone-number"
          @valid="(valid: boolean) => (inputValid.construction.preContactPhoneNumber = valid)"
        />
      </InputGrid>
      <!-- 立会者情報 -->
      <AttendanceInformationLabel
        :checked="constructionPreContactChecked"
        :show-checkbox="constructionRequired"
        :disabled="disabled"
        :help="t('guarantees.help.attendanceInformation', { operation: t('guarantees.construction') })"
        data-cy="edit-field-survey-and-construction-construction-attendance-information-label"
        @update:checked="handleConstructionSamePreContactClick"
      />
      <InputGrid :required="constructionRequired" :label="t('guarantees.attendanceCompanyName')">
        <InputForm
          v-model="inputData.construction.attendanceCompanyName"
          :required="constructionRequired"
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
          maxlength="15"
          placeholder="株式会社"
          :disabled="disabled || constructionPreContactChecked || !constructionRequired"
          data-cy="edit-field-survey-and-construction-construction-attendance-company-name"
          @valid="(valid: boolean) => (inputValid.construction.attendanceCompanyName = valid)"
        />
      </InputGrid>
      <InputGrid :required="constructionRequired" :label="t('guarantees.attendancePersonName')">
        <InputForm
          v-model="inputData.construction.attendancePersonName"
          :required="constructionRequired"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
          maxlength="6"
          :placeholder="t('placeholder.name')"
          :disabled="disabled || constructionPreContactChecked || !constructionRequired"
          data-cy="edit-field-survey-and-construction-construction-attendance-person-name"
          @valid="(valid: boolean) => (inputValid.construction.attendancePersonName = valid)"
        />
      </InputGrid>
      <InputGrid :required="constructionRequired" :label="t('guarantees.attendancePhoneNumber')">
        <InputForm
          v-model="inputData.construction.attendancePhoneNumber"
          :required="constructionRequired"
          :rules="[rules.phoneNumber]"
          maxlength="13"
          placeholder="03-0000-0000"
          :disabled="disabled || constructionPreContactChecked || !constructionRequired"
          data-cy="edit-field-survey-and-construction-construction-attendance-phone-number"
          @valid="(valid: boolean) => (inputValid.construction.attendancePhoneNumber = valid)"
        />
      </InputGrid>
    </InnerCard>
  </div>
</template>
