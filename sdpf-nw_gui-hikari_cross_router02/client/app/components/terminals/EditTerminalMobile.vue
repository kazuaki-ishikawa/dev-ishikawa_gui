<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CorporateVerificationMethodTypes } from '@/api/terminals/constants'
import { DocumentServiceTypes } from '@/api/constants'
import type { DocumentFileKey, TerminalMobileInputDataType, TerminalMobileValidType } from '@/api/terminals/types'

type PropsType = {
  disabled?: boolean
}
defineProps<PropsType>()
const inputMobileData = defineModel<TerminalMobileInputDataType>('mobile', { required: true })
const inputMobileValid = defineModel<TerminalMobileValidType>('valid', { required: true })

const { t } = useI18n()
const rules = useRules()

const {
  corporateVerificationMethodOptions,
  contractIdentificationDocumentTypeOptions,
  employmentDocumentTypeOptions,
  customerReceiptRequiredOptions,
  callDetailBreakdownOptions,
  callDetailDesiredOptions,
  mobileRatOptions,
  getShowPicEmployeeCode,
  getShowCallDetailOption,
} = useTerminalInput()

const showPicEmployeeCode = computed(() => getShowPicEmployeeCode(inputMobileData.value))
const showCallDetailOption = computed(() => getShowCallDetailOption(inputMobileData.value))

const { handleUploadIdentificationDocument } = useUploadDocument()
const handleFileUpload = (file: File, key: DocumentFileKey) => {
  handleUploadIdentificationDocument(file, DocumentServiceTypes.Mobile, (id: string) => {
    inputMobileData.value[key] = id
    inputMobileValid.value[key] = !!id
  })
}

// 法人確認方法が変更されたときの処理
const handleCorporateVerificationMethodChange = (newValue: string) => {
  const isCorporateNumberVerification = newValue === CorporateVerificationMethodTypes.CorporateNumberVerification
  inputMobileValid.value.contractIdentificationDocumentType = isCorporateNumberVerification
  inputMobileValid.value.contractIdentificationDocumentId = isCorporateNumberVerification
  if (isCorporateNumberVerification) {
    inputMobileData.value.contractIdentificationDocumentType = ''
    inputMobileData.value.contractIdentificationDocumentId = ''
  }
}

watch(showCallDetailOption, next => {
  if (!next) {
    inputMobileData.value.callDetailBreakdownSetting = ''
    inputMobileData.value.callDetailDestinationNumberSetting = ''
  }
  inputMobileValid.value.callDetailBreakdownSetting = !next || !!inputMobileData.value.callDetailBreakdownSetting
  inputMobileValid.value.callDetailDestinationNumberSetting =
    !next || !!inputMobileData.value.callDetailDestinationNumberSetting
})
watch(showPicEmployeeCode, next => {
  if (!next) {
    inputMobileData.value.picEmployeeCode = ''
  }
})
</script>

<template>
  <InputGrid :label="t('terminals.mobileRat')">
    <RadioForm
      v-model="inputMobileData.rat"
      :options="mobileRatOptions"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-rat"
      @valid="(valid: boolean) => (inputMobileValid.rat = valid)"
    />
  </InputGrid>

  <InputGrid required :label="t('terminals.corporateVerificationMethod')">
    <RadioForm
      v-model="inputMobileData.corporateVerificationMethod"
      :options="corporateVerificationMethodOptions"
      :disabled="disabled"
      col-min-width="280px"
      data-cy="edit-terminal-mobile-corporate-verification-method"
      @update:model-value="handleCorporateVerificationMethodChange"
      @valid="(valid: boolean) => (inputMobileValid.corporateVerificationMethod = valid)"
    />
  </InputGrid>

  <InputGrid required :label="t('terminals.japanCorporateNumber')">
    <InputForm
      v-model="inputMobileData.japanCorporateNumber"
      maxlength="13"
      required
      :rules="[rules.japanCorporateNumber]"
      placeholder="1234567890122"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-japan-corporate-number"
      @valid="(valid: boolean) => (inputMobileValid.japanCorporateNumber = valid)"
    />
  </InputGrid>

  <template
    v-if="inputMobileData.corporateVerificationMethod === CorporateVerificationMethodTypes.InPersonVerification"
  >
    <InputGrid required :label="t('terminals.contractIdentificationDocumentType')">
      <SelectForm
        v-model="inputMobileData.contractIdentificationDocumentType"
        :options="contractIdentificationDocumentTypeOptions"
        size="middle"
        required
        :placeholder="contractIdentificationDocumentTypeOptions[0]?.text"
        :disabled="disabled"
        data-cy="edit-terminal-mobile-contract-identification-document-type"
        @valid="(valid: boolean) => (inputMobileValid.contractIdentificationDocumentType = valid)"
      />
    </InputGrid>
    <InputGrid required :label="t('terminals.contractIdentificationDocumentId')">
      <FileUpload
        :file-name="inputMobileData.contractIdentificationDocumentId"
        required
        :disabled="disabled"
        :rules="[rules.fileMaxSizeMB(10)]"
        data-cy="edit-terminal-mobile-contract-identification-document-id"
        @submit="(file: File) => handleFileUpload(file, 'contractIdentificationDocumentId')"
      />
      <template #footer>
        <div text-warning>{{ t('fileUpload.maxSizeNote', { max: 10 }) }}</div>
      </template>
    </InputGrid>
  </template>

  <InputGrid required :label="t('terminals.picEmploymentDocumentType')">
    <SelectForm
      v-model="inputMobileData.picEmploymentDocumentType"
      :options="employmentDocumentTypeOptions"
      size="middle"
      required
      :placeholder="employmentDocumentTypeOptions[0]?.text"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-pic-employment-document-type"
      @valid="(valid: boolean) => (inputMobileValid.picEmploymentDocumentType = valid)"
    />
  </InputGrid>
  <InputGrid v-if="showPicEmployeeCode" :label="t('terminals.picEmployeeCode')">
    <InputForm
      v-model="inputMobileData.picEmployeeCode"
      maxlength="100"
      placeholder="12345"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-pic-employee-code"
      @valid="(valid: boolean) => (inputMobileValid.picEmployeeCode = valid)"
    />
  </InputGrid>
  <InputGrid required :label="t('terminals.picEmploymentDocumentId')">
    <FileUpload
      :file-name="inputMobileData.picEmploymentDocumentId"
      required
      :disabled="disabled"
      :rules="[rules.fileMaxSizeMB(10)]"
      data-cy="edit-terminal-mobile-pic-employment-document-id"
      @submit="(file: File) => handleFileUpload(file, 'picEmploymentDocumentId')"
    />
    <template #footer>
      <div text-warning>{{ t('fileUpload.maxSizeNote', { max: 10 }) }}</div>
    </template>
  </InputGrid>

  <InputGrid required :label="t('terminals.networkPinCode')">
    <InputForm
      v-model="inputMobileData.networkPinCode"
      maxlength="4"
      required
      :rules="[rules.number]"
      placeholder="1234"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-network-pin-code"
      @valid="(valid: boolean) => (inputMobileValid.networkPinCode = valid)"
    />
    <template #footer>
      <div class="text-warning">
        {{ t('terminals.help.networkPinCode') }}
      </div>
    </template>
  </InputGrid>
  <InputGrid
    required
    class="pb-1"
    :label="t('terminals.customerReceiptRequired')"
    :help="t('terminals.help.customerReceiptRequired')"
  >
    <RadioForm
      v-model="inputMobileData.customerReceiptRequired"
      :options="customerReceiptRequiredOptions"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-customer-receipt-required"
      @valid="(valid: boolean) => (inputMobileValid.customerReceiptRequired = valid)"
    />
  </InputGrid>
  <InputGrid required class="pb-1" :label="t('terminals.callDetailDesired')">
    <RadioForm
      v-model="inputMobileData.callDetailDesired"
      :options="callDetailDesiredOptions"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-call-detail-desired"
      @valid="(valid: boolean) => (inputMobileValid.callDetailDesired = valid)"
    />
  </InputGrid>
  <template v-if="showCallDetailOption">
    <InputGrid required :label="t('terminals.callDetailBreakdownSetting')">
      <SelectForm
        v-model="inputMobileData.callDetailBreakdownSetting"
        :options="callDetailBreakdownOptions"
        size="middle"
        required
        :placeholder="callDetailBreakdownOptions[0]?.text"
        :disabled="disabled"
        data-cy="edit-terminal-mobile-call-detail-breakdown-setting"
        @valid="(valid: boolean) => (inputMobileValid.callDetailBreakdownSetting = valid)"
      />
    </InputGrid>
    <InputGrid required :label="t('terminals.callDetailDestinationNumberSetting')">
      <SelectForm
        v-model="inputMobileData.callDetailDestinationNumberSetting"
        :options="callDetailBreakdownOptions"
        size="middle"
        required
        :placeholder="callDetailBreakdownOptions[0]?.text"
        :disabled="disabled"
        data-cy="edit-terminal-mobile-call-detail-destination-number-setting"
        @valid="(valid: boolean) => (inputMobileValid.callDetailDestinationNumberSetting = valid)"
      />
    </InputGrid>
  </template>
</template>
