<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { initialConstractorData, initialConstractorValid } from '@/api/contractor/constants'
import type { ContractorResponse, ContractorPutRequest } from '@/api/contractor/types'

type PropType = {
  tenantId: string
  confirmText: string
  submitLabel: string
  submitWidth?: number
  showCancel?: boolean
  original?: ContractorResponse
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'submit', request: ContractorPutRequest): void
  (e: 'cancel'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { navigationGuard } = useNavigationGuard()

const inputData = ref({ ...initialConstractorData })
const inputValid = ref({ ...initialConstractorValid })
const searchAddressData = ref({ address: '', postalCode: '', addressCode: '' })

const originalData = computed(() => ({
  name: props.original?.name ?? '',
  nameKana: props.original?.nameKana ?? '',
  picName: props.original?.picName ?? '',
  picNameKana: props.original?.picNameKana ?? '',
  postalCode: props.original?.postalCode ?? '',
  address: props.original?.address ?? '',
  houseNumber: props.original?.houseNumber ?? '',
  buildingName: props.original?.buildingName ?? '',
  addressKana: props.original?.addressKana ?? '',
  phoneNumber: props.original?.phoneNumber ?? '',
  addressCode: props.original?.addressCode ?? '',
}))
const disabled = computed(
  () => Object.values(inputValid.value).some(valid => !valid) || isEqual(inputData.value, originalData.value),
)

const isConfirmation = ref(false)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const switchConfirm = () => (isConfirmation.value = !isConfirmation.value)
const handleSave = () => {
  navigationGuard(false)
  const request = {
    ...inputData.value,
    houseNumber: inputData.value.houseNumber || undefined,
    buildingName: inputData.value.buildingName || undefined,
    addressCode: inputData.value.addressCode || undefined,
  }
  emits('submit', request)
}

const { getOrderIdLink } = useOrders()
const showOrderId = computed(() => !!props.original)
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: props?.original?.orderId }))

const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : switchConfirm
  const text = isConfirmation.value ? props.submitLabel : t('common.confirm')
  const width = isConfirmation.value ? props.submitWidth : 180
  return { click, text, width }
})

const handleUpdateAddressCode = (data: { address: string; postalCode: string; addressCode: string }) => {
  searchAddressData.value = data
  inputData.value = { ...inputData.value, ...data }
}

watchEffect(() => navigationGuard(!isEqual(inputData.value, originalData.value)))
watch(originalData, next => {
  if (next) {
    const valid = Object.keys(inputValid.value).reduce((acc, cur) => ({ ...acc, [cur]: true }), {
      ...initialConstractorValid,
    })
    inputData.value = { ...next, addressCode: next?.addressCode ?? '' }
    inputValid.value = valid
    searchAddressData.value = {
      address: next.address,
      postalCode: next.postalCode,
      addressCode: next.addressCode,
    }
  }
})
</script>

<template>
  <div>
    <div v-if="isConfirmation">{{ confirmText }}</div>
    <InnerCard>
      <DetailGrid v-if="showOrderId">
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink :to="orderIdLink"> {{ original?.orderId }}</NuxtLink>
      </DetailGrid>
      <InputGrid required :label="t('contractor.name')">
        <InputForm
          v-model="inputData.name"
          required
          :placeholder="t('placeholder.companyName')"
          maxlength="40"
          :rules="[
            rules.fullwidthCharacter,
            rules.fullwidthSpace,
            rules.noConsecutiveSpaces,
            rules.contractorName,
          ]"
          :disabled="isConfirmation"
          data-cy="contractor-settings-name"
          @valid="(valid: boolean) => (inputValid.name = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('contractor.nameKana')">
        <InputForm
          v-model="inputData.nameKana"
          required
          :placeholder="t('placeholder.companyNameKana')"
          maxlength="41"
          :rules="[rules.nameKana, rules.fullwidthSpace, rules.noConsecutiveSpaces, rules.contractorName]"
          :disabled="isConfirmation"
          data-cy="contractor-settings-name-kana"
          @valid="(valid: boolean) => (inputValid.nameKana = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picName')">
        <InputForm
          v-model="inputData.picName"
          required
          :placeholder="t('placeholder.name')"
          maxlength="20"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace]"
          :disabled="isConfirmation"
          data-cy="contractor-settings-pic-name"
          @valid="(valid: boolean) => (inputValid.picName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picNameKana')">
        <InputForm
          v-model="inputData.picNameKana"
          required
          :placeholder="t('placeholder.nameKana')"
          maxlength="35"
          :rules="[rules.nameKana, rules.noConsecutiveSpaces, rules.fullwidthSpace]"
          :disabled="isConfirmation"
          data-cy="contractor-settings-pic-name-kana"
          @valid="(valid: boolean) => (inputValid.picNameKana = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('contractor.addressCode')" :help="t('contractor.help.addressCode')">
        <EditAddressCode
          :model-value="searchAddressData"
          :disabled="isConfirmation"
          data-cy="contractor-settings-address-code"
          @update:model-value="handleUpdateAddressCode"
        />
      </InputGrid>
      <div class="text-lg text-warning my-4">{{ t('contractor.help.address') }}</div>
      <InputGrid required :label="t('contractor.postalCode')" :help="t('contractor.help.postalCode')">
        <SearchPostalCode
          v-model="inputData.postalCode"
          v-model:valid="inputValid.postalCode"
          v-model:address="inputData.address"
          required
          :disabled="!!searchAddressData.addressCode || isConfirmation"
          :placeholder="t('placeholder.postalCode')"
          data-cy="contractor-settings-postal-code"
        />
      </InputGrid>
      <InputGrid required :label="t('contractor.address')">
        <InputForm
          v-model="inputData.address"
          required
          placeholder="東京都千代田区大手町２丁目"
          :rules="[rules.fullwidthCharacter]"
          :disabled="!!searchAddressData.addressCode || isConfirmation"
          data-cy="contractor-settings-address"
          @valid="(valid: boolean) => (inputValid.address = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('contractor.houseNumber')">
        <InputForm
          v-model="inputData.houseNumber"
          required
          placeholder="３−１"
          maxlength="40"
          :rules="[rules.fullwidthCharacter]"
          :disabled="isConfirmation"
          data-cy="contractor-settings-house-number"
          @valid="(valid: boolean) => (inputValid.houseNumber = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('contractor.buildingName')">
        <InputForm
          v-model="inputData.buildingName"
          placeholder="大手町プレイス"
          maxlength="40"
          :rules="[rules.fullwidthCharacter]"
          :disabled="isConfirmation"
          data-cy="contractor-settings-building-name"
          @valid="(valid: boolean) => (inputValid.buildingName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('contractor.addressKana')">
        <InputForm
          v-model="inputData.addressKana"
          required
          :placeholder="t('placeholder.addressKana')"
          :rules="[rules.addressKana, rules.noConsecutiveSpaces]"
          :disabled="isConfirmation"
          data-cy="contractor-settings-address-kana"
          @valid="(valid: boolean) => (inputValid.addressKana = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('contractor.phoneNumber')">
        <InputForm
          v-model="inputData.phoneNumber"
          required
          placeholder="03-1234-5678"
          maxlength="13"
          :rules="[rules.phoneNumber]"
          :disabled="isConfirmation"
          data-cy="contractor-settings-phone-number"
          @valid="(valid: boolean) => (inputValid.phoneNumber = valid)"
        />
      </InputGrid>
    </InnerCard>
    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-if="showCancel || isConfirmation"
        v-model:is-confirmation="isConfirmation"
        data-cy="contractor-settings-cancel-button"
        @cancel="emits('cancel')"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="disabled"
        :text="submit.text"
        :width="submit.width"
        data-cy="contractor-settings-submit-button"
        @click="submit.click"
      />
    </div>
  </div>
</template>
