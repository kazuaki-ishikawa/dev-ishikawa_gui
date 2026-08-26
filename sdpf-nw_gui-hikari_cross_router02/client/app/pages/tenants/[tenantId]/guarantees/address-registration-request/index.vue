<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DocumentServiceTypes } from '@/api/constants'
import {
  SearchAddressResponseListKeys,
  initialRegistrationAddressInputData,
  initialRegistrationAddressValid,
} from '@/api/iwanUtil/constants'
import type { SearchAddressRequest } from '@/api/iwanUtil/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { loading } = useLoading()
const rules = useRules()

const inputData = ref({ ...initialRegistrationAddressInputData })
const inputValid = ref({ ...initialRegistrationAddressValid })
const invalid = computed(() => Object.values(inputValid.value).some(valid => !valid))
// ユーザーが選択しないで決まる場合にvalidを更新する
watch(
  () => [inputData.value.prefecture, inputData.value.municipality],
  next => {
    inputValid.value = { ...inputValid.value, prefecture: !!next[0], municipality: !!next[1] }
  },
)

const { handleUploadMapDocument } = useUploadDocument()
const handleFileUpload = (file: File) => {
  handleUploadMapDocument(file, DocumentServiceTypes.Guarantee, (id: string) => {
    inputData.value = { ...inputData.value, mapDocumentId: id }
    inputValid.value = { ...inputValid.value, mapDocumentId: !!id }
  })
}

const isConfirmation = ref(false)
const switchConfirm = () => (isConfirmation.value = !isConfirmation.value)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const { duringReceptionHours } = useGuarantees()
const { iwanUtilAddressCandidate, iwanUtilSearchAddress, clearIwanUtilSearchAddress, selectedRequestKeys } =
  useIwanUtilSearchAddress()
const { registrationAddress } = useRegistrationAddress()
const {
  termsOfServiceAccepted,
  getTermsOfServiceAccepted,
  termsOfService,
  getTermsOfService,
  agreeTermsOfService,
  downloadTermsOfServiceList,
  getDownloadTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.Guarantee)

const agreement = ref(true)
const handleSubmit = async () => {
  await registrationAddress(inputData.value)
  // 初期化する
  inputData.value = { ...initialRegistrationAddressInputData }
  inputValid.value = { ...initialRegistrationAddressValid }
  clearIwanUtilSearchAddress()
  isConfirmation.value = false
  navigationGuard(false)
}
const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : switchConfirm
  const text = isConfirmation.value ? t('addressRegistrationRequest.submit') : t('common.confirm')
  return { click, text }
})

const step = computed(() => (isNaN(Number(route.query.step)) ? 0 : Number(route.query.step)))
const handleSearchAddress = async (request: SearchAddressRequest) => {
  inputValid.value = {
    ...inputValid.value,
    postalCode: !!request.postalCode,
    prefecture: !!request.prefecture,
    municipality: !!request.municipality,
  }
  await iwanUtilSearchAddress(request)
}

// 字・丁目のリストを複数回取得する場合の対応
const showNextRequestButton = computed(() => 1 < (iwanUtilAddressCandidate.value?.sectionList?.length ?? 0))
const sectionOptions = computed(
  () => iwanUtilAddressCandidate.value?.sectionList?.map(value => ({ value, text: value })) ?? [],
)
const handleSectionNextRequestClick = () => {
  handleSearchAddress({
    postalCode: inputData.value.postalCode,
    prefecture: inputData.value.prefecture,
    municipality: inputData.value.municipality,
    largerSection: inputData.value.largerSection,
    nextRequestNumber: iwanUtilAddressCandidate.value?.nextRequestNumber,
  })
}

const submitAgreement = async () => {
  if (typeof termsOfService.value?.agreementCode === 'string') {
    await agreeTermsOfService({ agreementCode: termsOfService.value.agreementCode })
  }
  agreement.value = true
}
onBeforeMount(async () => {
  await getTermsOfServiceAccepted()
  await getTermsOfService()
  if (termsOfService.value?.termsOfService) {
    await getDownloadTermsOfServiceList(termsOfService.value.termsOfService)
  }

  agreement.value = termsOfServiceAccepted.value
  // duringReceptionHours の範囲内で query.step が存在する場合のみ iwanUtilAddressCandidate を使う
  if (
    !duringReceptionHours.value ||
    step.value <= SearchAddressResponseListKeys.largerSectionList ||
    !iwanUtilAddressCandidate.value
  ) {
    clearIwanUtilSearchAddress()
    return
  }

  const postalCode = iwanUtilAddressCandidate.value?.postalCode ?? ''
  const prefecture = iwanUtilAddressCandidate.value?.prefecture ?? ''
  const original = Object.entries(SearchAddressResponseListKeys).reduce((acc, [key, value]) => {
    const listKey = key as keyof typeof SearchAddressResponseListKeys
    const inputKey = key.split('List')[0]!
    return {
      ...acc,
      [inputKey]: step.value > value ? (iwanUtilAddressCandidate.value?.[listKey]?.[0] ?? '') : '',
      prefecture,
      postalCode,
    }
  }, initialRegistrationAddressInputData)

  if (postalCode) {
    await handleSearchAddress({
      postalCode,
      prefecture: prefecture || undefined,
      municipality: iwanUtilAddressCandidate.value?.municipalityList?.[0],
      largerSection: iwanUtilAddressCandidate.value?.largerSectionList?.[0],
    })
  }
  // GuaranteeSearchAddress.vue で inputData が更新されるのでその後に前画面の情報を再投入する
  inputData.value = original
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-4">{{ t('addressRegistrationRequest.confirm') }}</div>
    <div
      v-if="!duringReceptionHours"
      class="mb-2 text-warning text-pre-wrap"
      data-cy="address-registration-request-outside-reception-hour"
    >
      {{ t('guarantees.outsideReceptionHour') }}
    </div>
    <template v-if="!agreement">
      <TermsAndConditions
        terms-type="guarantee"
        :terms-of-service="downloadTermsOfServiceList"
        :accepted="agreement"
        :disabled="typeof termsOfService?.agreementCode !== 'string'"
        show-back-button
        @back="router.back()"
        @submit="submitAgreement"
      />
    </template>
    <template v-if="agreement">
      <InnerCard :title="t('addressRegistrationRequest.installationInformation')">
        <GuaranteeSearchAddress
          v-model:data="inputData"
          service-available
          hide-selector="sectionList"
          :address-candidate="iwanUtilAddressCandidate"
          :selected-request-keys="selectedRequestKeys"
          :disabled="!duringReceptionHours || isConfirmation || loading"
          @search="handleSearchAddress"
        />
        <InputGrid :label="t('ipoes.section')">
          <div class="grid-flow-col justify-start ga-4">
            <SelectForm
              v-model="inputData.section"
              :options="sectionOptions"
              placeholder="１丁目"
              :disabled="isConfirmation"
              data-cy="address-registration-request-section"
              @valid="(valid: boolean) => (inputValid.section = valid)"
            />
            <CustomButton
              v-if="showNextRequestButton"
              :text="t('ipoes.nextRequestButton')"
              icon="search"
              :width="180"
              :disabled="loading || !iwanUtilAddressCandidate?.nextRequestNumber"
              data-cy="address-registration-request-section-next-request-button"
              @click="handleSectionNextRequestClick"
            />
          </div>
        </InputGrid>
        <InputGrid :label="t('ipoes.houseNumber1')">
          <InputForm
            v-model="inputData.houseNumber1"
            maxlength="20"
            placeholder="１"
            :rules="[rules.fullwidthNumber]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-house-number-1"
            @valid="(valid: boolean) => (inputValid.houseNumber1 = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.houseNumber2')">
          <InputForm
            v-model="inputData.houseNumber2"
            maxlength="10"
            placeholder="２"
            :rules="[rules.fullwidthNumber]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-house-number-2"
            @valid="(valid: boolean) => (inputValid.houseNumber2 = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.houseNumber3')">
          <InputForm
            v-model="inputData.houseNumber3"
            maxlength="10"
            placeholder="３"
            :rules="[rules.fullwidthNumber]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-house-number-3"
            @valid="(valid: boolean) => (inputValid.houseNumber3 = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.buildingName1')">
          <InputForm
            v-model="inputData.buildingName1"
            maxlength="20"
            placeholder="ＡＢＣビルディング"
            :rules="[rules.fullwidthCharacter]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-building-name-1"
            @valid="(valid: boolean) => (inputValid.buildingName1 = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.buildingName2')">
          <InputForm
            v-model="inputData.buildingName2"
            maxlength="10"
            placeholder="２４階"
            :rules="[rules.fullwidthCharacter]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-building-name-2"
            @valid="(valid: boolean) => (inputValid.buildingName2 = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.buildingName3')">
          <InputForm
            v-model="inputData.buildingName3"
            maxlength="10"
            placeholder="２４０１号室"
            :rules="[rules.fullwidthCharacter]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-building-name-3"
            @valid="(valid: boolean) => (inputValid.buildingName3 = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('addressRegistrationRequest.latitude')">
          <InputForm
            v-model="inputData.latitude"
            required
            maxlength="9"
            placeholder="35.687046"
            :rules="[rules.decimalPointNumber(9)]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-latitude"
            @valid="(valid: boolean) => (inputValid.latitude = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('addressRegistrationRequest.longitude')">
          <InputForm
            v-model="inputData.longitude"
            required
            maxlength="10"
            placeholder="139.767876"
            :rules="[rules.decimalPointNumber(10)]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-longitude"
            @valid="(valid: boolean) => (inputValid.longitude = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('addressRegistrationRequest.mapDocumentId')">
          <FileUpload
            required
            :file-name="inputData.mapDocumentId"
            :disabled="isConfirmation"
            :rules="[rules.fileNameAlphanumeric]"
            :note="t('addressRegistrationRequest.fileUploadNote')"
            data-cy="address-registration-request-map-document-id"
            @submit="(file: File) => handleFileUpload(file)"
          />
        </InputGrid>
      </InnerCard>
      <InnerCard :title="t('addressRegistrationRequest.contactsInformation')">
        <InputGrid required :label="t('addressRegistrationRequest.companyName')">
          <InputForm
            v-model="inputData.companyName"
            required
            maxlength="190"
            placeholder="ＮＴＴドコモビジネス"
            :rules="[rules.fullwidthCharacter]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-company-name"
            @valid="(valid: boolean) => (inputValid.companyName = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('addressRegistrationRequest.personName')">
          <InputForm
            v-model="inputData.personName"
            required
            maxlength="40"
            :placeholder="t('placeholder.name')"
            :rules="[rules.fullwidthCharacter, rules.fullwidthSpace]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-person-name"
            @valid="(valid: boolean) => (inputValid.personName = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('addressRegistrationRequest.phoneNumber')">
          <InputForm
            v-model="inputData.phoneNumber"
            required
            maxlength="13"
            placeholder="03-1234-5678"
            :rules="[rules.phoneNumber]"
            :disabled="isConfirmation"
            data-cy="address-registration-request-phone-number"
            @valid="(valid: boolean) => (inputValid.phoneNumber = valid)"
          />
        </InputGrid>
      </InnerCard>
      <div class="flex-flex-end-center">
        <CustomButton
          v-if="isConfirmation"
          color="info"
          icon="left-arrow"
          :disabled="loading"
          :text="t('common.return')"
          :width="180"
          @click="switchConfirm"
        />
        <CustomButton
          class="ml-6"
          icon="right-arrow"
          :disabled="!duringReceptionHours || invalid || loading"
          :text="submit.text"
          :width="180"
          data-cy="address-registration-request-submit-button"
          @click="submit.click"
        />
      </div>
    </template>
  </CardContainer>
</template>

<style lang="scss" scoped>
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
