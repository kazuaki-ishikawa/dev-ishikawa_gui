<script lang="ts" setup>
import { pick } from 'es-toolkit'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { DocumentServiceTypes } from '@/api/constants'
import {
  initialMobileInputData,
  initialRemovalInputData,
  initialRemovalValid,
  initialMobileValid,
  PIC_REMOVE_MOBILE_RESPONSES,
  REMOVE_MOBILE_PARAMETERS,
  initialConfirmationChecked as initChecked,
} from '@/api/terminals/constants'
import type { DocumentFileKey } from '@/api/terminals/types'

type MobileValidKeys = keyof typeof initialMobileValid
const initialConfirmationChecked = initChecked.filter(({ key }) =>
  ['pic-information', 'contractor-address'].includes(key),
)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rules = useRules()

const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const inputData = ref(structuredClone(initialRemovalInputData))
const inputValid = ref(structuredClone(initialRemovalValid))
const inputMobileData = ref(structuredClone(initialMobileInputData))
const inputMobileValid = ref(structuredClone(initialMobileValid))

const isConfirmation = ref(false)
const tenantId = computed(() => route.params.tenantId as string)
const terminalId = computed(() => route.params.id as string)

const confirmationChecked = ref(structuredClone(initialConfirmationChecked))

const { deleteTerminal } = useDeleteTerminal()
const { terminal, editable, getTerminal } = useGetTerminal()
const {
  contractIdentificationDocumentTypeOptions,
  picIdentificationDocumentTypeOptions,
  auxiliaryIdentificationDocumentTypeOptions,
  employmentDocumentTypeOptions,
  defaultBirthDate,
  getShowPicIdentificationNumber,
  getShowPicIdentificationBackDocumentFile,
  getShowPicIdentificationAdditionalDocumentFile,
  getShowPicAuxiliaryIdentificationDocumentType,
  getShowPicEmployeeCode,
  getDeleteRequest,
} = useTerminalInput()

const showPicIdentificationNumber = computed(() => getShowPicIdentificationNumber(inputMobileData.value))
const showPicIdentificationBackDocumentFile = computed(() =>
  getShowPicIdentificationBackDocumentFile(inputMobileData.value),
)
const showPicIdentificationAdditionalDocumentFile = computed(() =>
  getShowPicIdentificationAdditionalDocumentFile(inputMobileData.value),
)
const showPicAuxiliaryIdentificationDocumentType = computed(() =>
  getShowPicAuxiliaryIdentificationDocumentType(inputMobileData.value),
)
const showPicEmployeeCode = computed(() => getShowPicEmployeeCode(inputMobileData.value))

const { handleUploadIdentificationDocument } = useUploadDocument()
const handleFileUpload = (file: File, key: DocumentFileKey) => {
  handleUploadIdentificationDocument(file, DocumentServiceTypes.Mobile, (id: string) => {
    inputMobileData.value[key] = id
    inputMobileValid.value[key] = !!id
  })
}
const isMobile = computed(() => !!terminal.value?.mobile)
watch(terminal, () => {
  if (!terminal.value?.mobile) {
    inputMobileData.value = { ...initialMobileInputData }
    inputMobileValid.value = { ...initialMobileValid }
    return
  }
  inputMobileData.value = {
    ...initialMobileInputData,
    ...pick(terminal.value.mobile, [...PIC_REMOVE_MOBILE_RESPONSES]),
  }
  const mobileValid = Object.keys(initialMobileValid).reduce(
    (acc, key) => {
      if (!REMOVE_MOBILE_PARAMETERS.find(param => param === key)) {
        return { ...acc, [key]: true }
      }
      if (inputMobileData.value?.[key as MobileValidKeys]) {
        return { ...acc, [key]: true }
      }
      return acc
    },
    { ...initialMobileValid },
  )
  inputMobileValid.value = mobileValid
})
watch(isConfirmation, next => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (!next) {
    confirmationChecked.value = structuredClone(initialConfirmationChecked)
  }
})

watch(showPicIdentificationNumber, next => {
  inputMobileData.value.picIdentificationNumber = ''
  inputMobileValid.value.picIdentificationNumber = !next
})
watch(showPicIdentificationBackDocumentFile, next => {
  inputMobileData.value.picIdentificationBackDocumentId = ''
  inputMobileValid.value.picIdentificationBackDocumentId = !next
})
watch(showPicIdentificationAdditionalDocumentFile, next => {
  if (!next) {
    inputMobileData.value.picIdentificationAdditionalDocumentId = ''
  }
  inputMobileValid.value.picIdentificationAdditionalDocumentId =
    !next || !!inputMobileData.value.picIdentificationAdditionalDocumentId
})
watch(showPicAuxiliaryIdentificationDocumentType, next => {
  if (!next) {
    inputMobileData.value.picAuxiliaryIdentificationDocumentType = ''
    inputMobileData.value.picAuxiliaryIdentificationDocumentId = ''
  }
  inputMobileValid.value.picAuxiliaryIdentificationDocumentType =
    !next || !!inputMobileData.value.picAuxiliaryIdentificationDocumentType
  inputMobileValid.value.picAuxiliaryIdentificationDocumentId =
    !next || !!inputMobileData.value.picAuxiliaryIdentificationDocumentId
})
watch(showPicEmployeeCode, next => {
  if (!next) {
    inputMobileData.value.picEmployeeCode = ''
  }
})

const abolitionDisabled = computed(() => {
  const invalid = Object.values(inputValid.value).some(valid => !valid)
  const mobile = isMobile.value && Object.values(inputMobileValid.value).some(valid => !valid)
  const checked = !isMobile.value || confirmationChecked.value.every(checked => checked.value)
  return !editable.value || invalid || mobile || (isConfirmation.value && !checked)
})

const switchConfirm = () => (isConfirmation.value = !isConfirmation.value)
const handleSubmit = async () => {
  const request = getDeleteRequest({
    mobile: inputMobileData.value,
    terminal: inputData.value,
    isMobile: isMobile.value,
  })
  await deleteTerminal(terminalId.value, request)
  navigationGuard(false)
  return navigateTo(`/tenants/${tenantId.value}/terminals`)
}
const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : switchConfirm
  const text = isConfirmation.value ? t('common.abolition') : t('common.confirm')
  return { click, text }
})

onBeforeMount(async () => {
  getTerminal(terminalId.value)
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-5">
      {{ t('confirm.abolition') }}
    </div>
    <!-- 端末基本設定 -->
    <InnerCard :title="t('terminals.basicConfiguration')">
      <DetailGrid>
        <div>{{ t('terminals.terminalId') }}</div>
        <div>{{ terminal?.terminalId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.name') }}</div>
        <div>{{ terminal?.customerNote }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- 廃止申し込み情報 -->
    <InnerCard :title="t('terminals.removalInformation')">
      <InputGrid required :label="t('terminals.removalName')">
        <InputForm
          v-model="inputData.removalName"
          required
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
          maxlength="64"
          :placeholder="t('placeholder.name')"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-removal-name"
          @valid="(valid: boolean) => (inputValid.removalName = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('terminals.removalCompanyName')">
        <InputForm
          v-model="inputData.removalCompanyName"
          maxlength="40"
          :rules="[
            rules.fullwidthCharacter,
            rules.fullwidthSpace,
            rules.noConsecutiveSpaces,
            rules.contractorName,
          ]"
          :placeholder="t('placeholder.companyName')"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-removal-company-name"
          @valid="(valid: boolean) => (inputValid.removalCompanyName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.removalDepartmentName')">
        <InputForm
          v-model="inputData.removalDepartmentName"
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
          required
          maxlength="20"
          placeholder="営業部１課"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-removal-department-name"
          @valid="(valid: boolean) => (inputValid.removalDepartmentName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.removalPostalCode')">
        <SearchPostalCode
          v-model="inputData.removalPostalCode"
          v-model:address="inputData.removalAddress"
          v-model:valid="inputValid.removalPostalCode"
          required
          :disabled="isConfirmation"
          :placeholder="t('placeholder.postalCode')"
          data-cy="terminals-id-remove-removal-postal-code"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.removalAddress')" :help="t('terminals.help.address')">
        <InputForm
          v-model="inputData.removalAddress"
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
          size="large"
          required
          maxlength="300"
          :placeholder="t('placeholder.address')"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-removal-address"
          @valid="(valid: boolean) => (inputValid.removalAddress = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.removalAddressKana')">
        <InputForm
          v-model="inputData.removalAddressKana"
          required
          :rules="[rules.addressKana, rules.noConsecutiveSpaces]"
          size="large"
          maxlength="300"
          :placeholder="t('placeholder.addressKana')"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-removal-address-kana"
          @valid="(valid: boolean) => (inputValid.removalAddressKana = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.removalPhoneNumber')">
        <InputForm
          v-model="inputData.removalPhoneNumber"
          required
          :rules="[rules.phoneNumber]"
          maxlength="13"
          placeholder="03-1234-5678"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-removal-phone-number"
          @valid="(valid: boolean) => (inputValid.removalPhoneNumber = valid)"
        />
      </InputGrid>
    </InnerCard>

    <!-- モバイル申し込み情報 -->
    <InnerCard v-if="isMobile" :title="t('terminals.mobileInformation')" data-cy="terminals-id-remove-removal-mobile">
      <InputGrid required :label="t('terminals.japanCorporateNumber')">
        <InputForm
          v-model="inputMobileData.japanCorporateNumber"
          :rules="[rules.japanCorporateNumber]"
          maxlength="13"
          required
          placeholder="1234567890122"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-japan-corporate-number"
          @valid="(valid: boolean) => (inputMobileValid.japanCorporateNumber = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.contractIdentificationDocumentType')">
        <SelectForm
          v-model="inputMobileData.contractIdentificationDocumentType"
          :options="contractIdentificationDocumentTypeOptions"
          size="middle"
          required
          :placeholder="contractIdentificationDocumentTypeOptions[0]?.text"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-contract-identification-document-type"
          @valid="(valid: boolean) => (inputMobileValid.contractIdentificationDocumentType = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.contractIdentificationDocumentId')">
        <FileUpload
          :file-name="inputMobileData.contractIdentificationDocumentId"
          required
          :disabled="isConfirmation"
          :rules="[rules.fileMaxSizeMB(10)]"
          data-cy="terminals-id-remove-mobile-contract-identification-document-id"
          @submit="(file: File) => handleFileUpload(file, 'contractIdentificationDocumentId')"
        />
        <template #footer>
          <div text-warning>{{ t('fileUpload.maxSizeNote', { max: 10 }) }}</div>
        </template>
      </InputGrid>

      <InputGrid required :label="t('terminals.picName')" :help="t('terminals.help.mobilePics')">
        <InputForm
          v-model="inputMobileData.picName"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
          maxlength="64"
          required
          :placeholder="t('placeholder.name')"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-name"
          @valid="(valid: boolean) => (inputMobileValid.picName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picNameKana')" :help="t('terminals.help.mobilePics')">
        <InputForm
          v-model="inputMobileData.picNameKana"
          :rules="[rules.nameKana, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
          maxlength="128"
          required
          :placeholder="t('placeholder.nameKana')"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-name-kana"
          @valid="(valid: boolean) => (inputMobileValid.picNameKana = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picPostalCode')" :help="t('terminals.help.mobilePics')">
        <SearchPostalCode
          v-model="inputMobileData.picPostalCode"
          v-model:address="inputMobileData.picAddress"
          v-model:valid="inputMobileValid.picPostalCode"
          required
          :disabled="isConfirmation"
          :placeholder="t('placeholder.picPostalCode')"
          data-cy="terminals-id-remove-mobile-pic-postal-code"
        />
      </InputGrid>
      <InputGrid
        required
        :label="t('terminals.picAddress')"
        :help="[t('terminals.help.mobilePics'), t('terminals.help.address')].join('\n')"
      >
        <InputForm
          v-model="inputMobileData.picAddress"
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
          size="large"
          maxlength="300"
          required
          :placeholder="t('placeholder.picAddress')"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-address"
          @valid="(valid: boolean) => (inputMobileValid.picAddress = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picAddressKana')" :help="t('terminals.help.mobilePics')">
        <InputForm
          v-model="inputMobileData.picAddressKana"
          :rules="[rules.addressKana, rules.noConsecutiveSpaces]"
          size="large"
          maxlength="300"
          required
          :placeholder="t('placeholder.picAddressKana')"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-address-kana"
          @valid="(valid: boolean) => (inputMobileValid.picAddressKana = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picPhoneNumber')" :help="t('terminals.help.picPhoneNumber')">
        <InputForm
          v-model="inputMobileData.picPhoneNumber"
          :rules="[rules.phoneNumber]"
          maxlength="13"
          required
          placeholder="03-1234-5678"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-phone-number"
          @valid="(valid: boolean) => (inputMobileValid.picPhoneNumber = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picDateOfBirth')" :help="t('terminals.help.mobilePics')">
        <DatePicker
          v-model="inputMobileData.picDateOfBirth"
          required
          :start-date="defaultBirthDate"
          :max-date="dayjs().format()"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-date-of-birth"
          @valid="(valid: boolean) => (inputMobileValid.picDateOfBirth = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picIdentificationDocumentType')">
        <SelectForm
          v-model="inputMobileData.picIdentificationDocumentType"
          :options="picIdentificationDocumentTypeOptions"
          size="middle"
          required
          :placeholder="picIdentificationDocumentTypeOptions[0]?.text"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-identification-document-type"
          @valid="(valid: boolean) => (inputMobileValid.picIdentificationDocumentType = valid)"
        />
      </InputGrid>
      <InputGrid v-if="showPicIdentificationNumber" required :label="t('terminals.picIdentificationNumber')">
        <InputForm
          v-model="inputMobileData.picIdentificationNumber"
          maxlength="12"
          :rules="[rules.alphanumeric]"
          required
          placeholder="12345"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-identification-number"
          @valid="(valid: boolean) => (inputMobileValid.picIdentificationNumber = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picIdentificationFrontDocumentId')">
        <FileUpload
          :file-name="inputMobileData.picIdentificationFrontDocumentId"
          required
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-identification-front-document-id"
          @submit="(file: File) => handleFileUpload(file, 'picIdentificationFrontDocumentId')"
        />
      </InputGrid>
      <InputGrid
        v-if="showPicIdentificationBackDocumentFile"
        required
        :label="t('terminals.picIdentificationBackDocumentId')"
      >
        <FileUpload
          :file-name="inputMobileData.picIdentificationBackDocumentId"
          required
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-identification-back-document-id"
          @submit="(file: File) => handleFileUpload(file, 'picIdentificationBackDocumentId')"
        />
      </InputGrid>
      <InputGrid
        v-if="showPicIdentificationAdditionalDocumentFile"
        required
        :label="t('terminals.picIdentificationAdditionalDocumentId')"
      >
        <FileUpload
          :file-name="inputMobileData.picIdentificationAdditionalDocumentId"
          required
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-identification-additional-document-id"
          @submit="(file: File) => handleFileUpload(file, 'picIdentificationAdditionalDocumentId')"
        />
      </InputGrid>

      <template v-if="showPicAuxiliaryIdentificationDocumentType">
        <InputGrid required :label="t('terminals.picAuxiliaryIdentificationDocumentType')">
          <SelectForm
            v-model="inputMobileData.picAuxiliaryIdentificationDocumentType"
            :options="auxiliaryIdentificationDocumentTypeOptions"
            size="middle"
            required
            :placeholder="auxiliaryIdentificationDocumentTypeOptions[0]?.text"
            :disabled="isConfirmation"
            data-cy="terminals-id-remove-mobile-pic-auxiliary-identification-document-type"
            @valid="(valid: boolean) => (inputMobileValid.picAuxiliaryIdentificationDocumentType = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('terminals.picAuxiliaryIdentificationDocumentId')">
          <FileUpload
            :file-name="inputMobileData.picAuxiliaryIdentificationDocumentId"
            required
            :disabled="isConfirmation"
            data-cy="terminals-id-remove-mobile-pic-auxiliary-identification-document-id"
            @submit="(file: File) => handleFileUpload(file, 'picAuxiliaryIdentificationDocumentId')"
          />
        </InputGrid>
      </template>

      <InputGrid required :label="t('terminals.picEmploymentDocumentType')">
        <SelectForm
          v-model="inputMobileData.picEmploymentDocumentType"
          :options="employmentDocumentTypeOptions"
          size="middle"
          required
          :placeholder="employmentDocumentTypeOptions[0]?.text"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-employment-document-type"
          @valid="(valid: boolean) => (inputMobileValid.picEmploymentDocumentType = valid)"
        />
      </InputGrid>
      <InputGrid v-if="showPicEmployeeCode" :label="t('terminals.picEmployeeCode')">
        <InputForm
          v-model="inputMobileData.picEmployeeCode"
          maxlength="100"
          placeholder="12345"
          :disabled="isConfirmation"
          data-cy="terminals-id-remove-mobile-pic-employee-code"
          @valid="(valid: boolean) => (inputMobileValid.picEmployeeCode = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picEmploymentDocumentId')">
        <FileUpload
          :file-name="inputMobileData.picEmploymentDocumentId"
          required
          :disabled="isConfirmation"
          :rules="[rules.fileMaxSizeMB(10)]"
          data-cy="terminals-id-remove-mobile-pic-employment-document-id"
          @submit="(file: File) => handleFileUpload(file, 'picEmploymentDocumentId')"
        />
        <template #footer>
          <div text-warning>{{ t('fileUpload.maxSizeNote', { max: 10 }) }}</div>
        </template>
      </InputGrid>
    </InnerCard>

    <InnerCard v-if="isConfirmation && isMobile" :title="t('terminals.confirm.title')">
      <div
        v-for="checked in confirmationChecked"
        :key="checked.key"
        :data-cy="`terminals-id-remove-checkbox-${checked.key}`"
        class="flex-flex-start-center mt-2"
      >
        <CheckboxBase v-model:value="checked.value" />
        <i18n-t :keypath="checked.keypath" tag="span" scope="global" class="text-pre-wrap ml-6 text-warning">
          <template #here>
            <NuxtLink :to="checked.link" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </div>
    </InnerCard>
    <div v-if="!loading && isConfirmation" data-cy="terminals-id-remove-abolition-notice" class="text-warning">
      {{ t('terminals.note.abolitionNotice') }}
    </div>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="terminals-id-remove-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        icon="right-arrow"
        :width="180"
        :disabled="abolitionDisabled || loading"
        :text="submit.text"
        class="ml-6"
        data-cy="terminals-id-remove-submit-button"
        @click="submit.click"
      />
    </div>
  </CardContainer>
</template>
