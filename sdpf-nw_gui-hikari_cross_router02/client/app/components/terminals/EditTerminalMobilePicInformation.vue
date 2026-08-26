<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { DocumentServiceTypes } from '@/api/constants'
import { PicVerificationMethodTypes } from '@/api/terminals/constants'
import type { DocumentFileKey, TerminalMobileInputDataType, TerminalMobileValidType } from '@/api/terminals/types'

type PropsType = {
  disabled?: boolean
  isQuickSetup?: boolean
}
const props = defineProps<PropsType>()
const inputMobileData = defineModel<TerminalMobileInputDataType>('mobile', { required: true })
const inputMobileValid = defineModel<TerminalMobileValidType>('valid', { required: true })

const { t } = useI18n()
const rules = useRules()

const { jpkiRequestLoading } = useCreateJpkiRequest()
const {
  picVerificationMethodOptions,
  picIdentificationDocumentTypeOptions,
  auxiliaryIdentificationDocumentTypeOptions,
  defaultBirthDate,
  getShowPicIdentificationNumber,
  getShowPicIdentificationBackDocumentFile,
  getShowPicIdentificationAdditionalDocumentFile,
  getShowPicAuxiliaryIdentificationDocumentType,
} = useTerminalInput()

// 入力画面用
const selectedVerificationMethod = ref<string>(
  inputMobileData.value.picIdentificationDocumentType
    ? PicVerificationMethodTypes.InPersonVerification
    : inputMobileData.value.picName
      ? PicVerificationMethodTypes.MyNumberCard
      : '',
)

// 本人確認方法
const picVerificationMethod = computed({
  get: () => {
    // 確認画面の場合はpicIdentificationDocumentTypeの有無から自動判定
    if (props.disabled) {
      return inputMobileData.value.picIdentificationDocumentType
        ? PicVerificationMethodTypes.InPersonVerification
        : PicVerificationMethodTypes.MyNumberCard
    }
    // 入力画面の場合はユーザーが選択した値を返す
    return selectedVerificationMethod.value
  },
  set: (value: string) => {
    // 入力画面でのみ値を設定
    selectedVerificationMethod.value = value
  },
})

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

const { handleUploadIdentificationDocument } = useUploadDocument()
const handleFileUpload = (file: File, key: DocumentFileKey) => {
  handleUploadIdentificationDocument(file, DocumentServiceTypes.Mobile, (id: string) => {
    inputMobileData.value[key] = id
    inputMobileValid.value[key] = !!id
  })
}

// 本人確認書類種別が変更されたときの処理
const handlePicIdentificationDocumentTypeChange = () => {
  inputMobileData.value.picIdentificationNumber = ''
  inputMobileData.value.picIdentificationFrontDocumentId = ''
  inputMobileData.value.picIdentificationBackDocumentId = ''
  inputMobileData.value.picIdentificationAdditionalDocumentId = ''
  inputMobileData.value.picAuxiliaryIdentificationDocumentType = ''
  inputMobileData.value.picAuxiliaryIdentificationDocumentId = ''
  inputMobileValid.value.picIdentificationNumber = !showPicIdentificationNumber.value
  inputMobileValid.value.picIdentificationFrontDocumentId = false
  inputMobileValid.value.picIdentificationBackDocumentId = !showPicIdentificationBackDocumentFile.value
  inputMobileValid.value.picIdentificationAdditionalDocumentId = !showPicIdentificationAdditionalDocumentFile.value
  inputMobileValid.value.picAuxiliaryIdentificationDocumentType = !showPicAuxiliaryIdentificationDocumentType.value
  inputMobileValid.value.picAuxiliaryIdentificationDocumentId = !showPicAuxiliaryIdentificationDocumentType.value
}

// 補助書類種別が変更されたときの処理
const handlePicAuxiliaryIdentificationDocumentTypeChange = () => {
  inputMobileData.value.picAuxiliaryIdentificationDocumentId = ''
  inputMobileValid.value.picAuxiliaryIdentificationDocumentId = false
}

// 本人確認方法が選択されたときの処理
watch(
  selectedVerificationMethod,
  (newValue, oldValue) => {
    if (!newValue) {
      return
    }

    // 確認画面では表示のみのため、watch で入力値/バリデーションを変更しない
    if (props.disabled) {
      return
    }

    const changedVerificationMethod = oldValue !== undefined && oldValue !== newValue

    // 初回マウント時（immediate）は既存データを維持し、本人確認方法が変更された場合のみリセット
    if (changedVerificationMethod) {
      inputMobileData.value.picIdentificationDocumentType = ''
      inputMobileData.value.picIdentificationNumber = ''
      inputMobileData.value.picIdentificationFrontDocumentId = ''
      inputMobileData.value.picIdentificationBackDocumentId = ''
      inputMobileData.value.picIdentificationAdditionalDocumentId = ''
      inputMobileData.value.picAuxiliaryIdentificationDocumentType = ''
      inputMobileData.value.picAuxiliaryIdentificationDocumentId = ''
      inputMobileData.value.jpkiRequestId = ''

      const isMyNumberCard = newValue === PicVerificationMethodTypes.MyNumberCard

      // バリデーション状態の設定
      inputMobileValid.value.picIdentificationDocumentType = isMyNumberCard
      inputMobileValid.value.picIdentificationNumber = isMyNumberCard
      inputMobileValid.value.picIdentificationFrontDocumentId = isMyNumberCard
      inputMobileValid.value.picIdentificationBackDocumentId = isMyNumberCard
      inputMobileValid.value.picIdentificationAdditionalDocumentId = true
      inputMobileValid.value.picAuxiliaryIdentificationDocumentType = true
      inputMobileValid.value.picAuxiliaryIdentificationDocumentId = true
      inputMobileValid.value.jpkiRequestId = !isMyNumberCard || !!inputMobileData.value.jpkiRequestId
    }
  },
  { immediate: true },
)
</script>

<template>
  <InputGrid :label="t('terminals.picVerificationMethod')">
    <RadioForm
      v-model="picVerificationMethod"
      :options="picVerificationMethodOptions"
      :disabled="disabled || jpkiRequestLoading"
      data-cy="edit-terminal-mobile-pic-information-pic-verification-method"
    />
  </InputGrid>

  <div v-if="!isQuickSetup && !disabled" class="my-2">{{ t('terminals.message.saveInputData') }}</div>
  <div v-if="picVerificationMethod === PicVerificationMethodTypes.MyNumberCard" class="my-4">
    <div
      v-if="!disabled"
      class="text-pre-wrap"
      data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-my-number-card"
    >
      {{ t('terminals.message.picInformationWithMyNumberCard') }}
    </div>
    <div class="text-warning" data-cy="edit-terminal-mobile-pic-information-note-my-number-card">
      {{ t('terminals.note.myNumberCard') }}
    </div>
  </div>
  <div v-if="picVerificationMethod === PicVerificationMethodTypes.InPersonVerification" class="my-2">
    <div
      v-if="!disabled"
      data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-in-person-verification"
    >
      {{ t('terminals.message.picInformationWithInPersonVerification') }}
    </div>
    <div class="text-warning" data-cy="edit-terminal-mobile-pic-information-note-in-person-verification">
      {{ t('terminals.note.picVerificationInPersonVerification') }}
    </div>
  </div>

  <InputGrid required :label="t('terminals.picName')" :help="t('terminals.help.mobilePics')">
    <InputForm
      v-model="inputMobileData.picName"
      maxlength="64"
      required
      :rules="[rules.fullwidthSpace, rules.noConsecutiveSpaces]"
      :placeholder="t('placeholder.name')"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-pic-information-pic-name"
      @valid="(valid: boolean) => (inputMobileValid.picName = valid)"
    />
  </InputGrid>

  <InputGrid required :label="t('terminals.picNameKana')" :help="t('terminals.help.mobilePics')">
    <InputForm
      v-model="inputMobileData.picNameKana"
      maxlength="128"
      required
      :rules="[rules.nameKana]"
      :placeholder="t('placeholder.nameKana')"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-pic-information-pic-name-kana"
      @valid="(valid: boolean) => (inputMobileValid.picNameKana = valid)"
    />
  </InputGrid>

  <InputGrid required :label="t('terminals.picPostalCode')" :help="t('terminals.help.mobilePics')">
    <SearchPostalCode
      v-model="inputMobileData.picPostalCode"
      v-model:address="inputMobileData.picAddress"
      v-model:valid="inputMobileValid.picPostalCode"
      required
      :disabled="disabled"
      :placeholder="t('placeholder.picPostalCode')"
      data-cy="edit-terminal-mobile-pic-information-pic-postal-code"
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
      :disabled="disabled"
      data-cy="edit-terminal-mobile-pic-information-pic-address"
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
      :disabled="disabled"
      data-cy="edit-terminal-mobile-pic-information-pic-address-kana"
      @valid="(valid: boolean) => (inputMobileValid.picAddressKana = valid)"
    />
  </InputGrid>

  <InputGrid required :label="t('terminals.picDateOfBirth')" :help="t('terminals.help.mobilePics')">
    <DatePicker
      v-model="inputMobileData.picDateOfBirth"
      required
      :max-date="dayjs().format()"
      :start-date="defaultBirthDate"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-pic-information-pic-date-of-birth"
      @valid="(valid: boolean) => (inputMobileValid.picDateOfBirth = valid)"
    />
  </InputGrid>

  <InputGrid required :label="t('terminals.picPhoneNumber')" :help="t('terminals.help.picPhoneNumber')">
    <InputForm
      v-model="inputMobileData.picPhoneNumber"
      :rules="[rules.phoneNumber]"
      maxlength="13"
      required
      placeholder="03-1234-5678"
      :disabled="disabled"
      data-cy="edit-terminal-mobile-pic-information-pic-phone-number"
      @valid="(valid: boolean) => (inputMobileValid.picPhoneNumber = valid)"
    />
  </InputGrid>

  <template v-if="picVerificationMethod !== PicVerificationMethodTypes.MyNumberCard">
    <InputGrid required :label="t('terminals.picIdentificationDocumentType')">
      <SelectForm
        v-model="inputMobileData.picIdentificationDocumentType"
        :options="picIdentificationDocumentTypeOptions"
        size="middle"
        required
        :placeholder="picIdentificationDocumentTypeOptions[0]?.text"
        :disabled="disabled"
        data-cy="edit-terminal-mobile-pic-information-pic-identification-document-type"
        @update:model-value="handlePicIdentificationDocumentTypeChange"
        @valid="(valid: boolean) => (inputMobileValid.picIdentificationDocumentType = valid)"
      />
    </InputGrid>

    <InputGrid v-if="showPicIdentificationNumber" required :label="t('terminals.picIdentificationNumber')">
      <InputForm
        v-model="inputMobileData.picIdentificationNumber"
        maxlength="12"
        :rules="[rules.alphanumeric]"
        required
        placeholder="123456789012"
        :disabled="disabled"
        data-cy="edit-terminal-mobile-pic-information-pic-identification-number"
        @valid="(valid: boolean) => (inputMobileValid.picIdentificationNumber = valid)"
      />
    </InputGrid>

    <InputGrid required :label="t('terminals.picIdentificationFrontDocumentId')">
      <FileUpload
        :file-name="inputMobileData.picIdentificationFrontDocumentId"
        required
        :disabled="disabled"
        data-cy="edit-terminal-mobile-pic-information-pic-identification-front-document-id"
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
        :disabled="disabled"
        data-cy="edit-terminal-mobile-pic-information-pic-identification-back-document-id"
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
        :disabled="disabled"
        data-cy="edit-terminal-mobile-pic-information-pic-identification-additional-document-id"
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
          :disabled="disabled"
          data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-type"
          @update:model-value="handlePicAuxiliaryIdentificationDocumentTypeChange"
          @valid="(valid: boolean) => (inputMobileValid.picAuxiliaryIdentificationDocumentType = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picAuxiliaryIdentificationDocumentId')">
        <FileUpload
          :file-name="inputMobileData.picAuxiliaryIdentificationDocumentId"
          required
          :disabled="disabled"
          data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-id"
          @submit="(file: File) => handleFileUpload(file, 'picAuxiliaryIdentificationDocumentId')"
        />
      </InputGrid>
    </template>
  </template>

  <!-- マイナンバーカード認証用QRコード -->
  <JpkiQrCode
    v-if="!disabled && picVerificationMethod === PicVerificationMethodTypes.MyNumberCard"
    v-model:jpki-request-id="inputMobileData.jpkiRequestId"
    @valid="(valid: boolean) => (inputMobileValid.jpkiRequestId = valid)"
  />
</template>
