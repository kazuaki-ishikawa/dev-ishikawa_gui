<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { initialSearchAddressInputData, initialSearchAddressValid } from '@/api/hikariCollaboUtil/constants'

type ModelValueType = { address: string; postalCode: string; addressCode: string }
type PropType = {
  disabled?: boolean
}
const model = defineModel<ModelValueType>({ required: true })
defineProps<PropType>()

const { t } = useI18n()

const { loading } = useLoading()
const { availableTime, checkAvailableTime } = useCheckAvailableTime()
const { searchAddress, addressCandidate, searchAddressErrorMessage, selectedRequestKeys, clearSearchAddress } =
  useSearchAddress()
const searchAddressInputData = ref({ ...initialSearchAddressInputData })
const searchAddressValid = ref({ ...initialSearchAddressValid })
const openSearchAddress = ref(false)

const handleSearchAddressSubmit = () => {
  const address = [
    addressCandidate.value?.prefecture,
    addressCandidate.value?.municipalityList,
    addressCandidate.value?.largerSectionList,
    addressCandidate.value?.sectionList,
  ]
    .flat()
    .join('')
  const data = {
    address,
    postalCode: addressCandidate.value?.postalCode ?? '',
    addressCode: addressCandidate.value?.addressCode ?? '',
  }
  model.value = data
  openSearchAddress.value = false
}
const handleClear = () => {
  clearSearchAddress()
  searchAddressInputData.value = { ...initialSearchAddressInputData }
  searchAddressValid.value = { ...initialSearchAddressValid }
  const data = {
    address: '',
    postalCode: '',
    addressCode: '',
  }
  model.value = data
}

onBeforeMount(checkAvailableTime)
</script>

<template>
  <div>
    <div class="flex-flex-start-center flex-wrap">
      <CustomButton
        icon="search"
        :text="t('contractor.registerAddressCode')"
        :width="350"
        :disabled="!availableTime?.available || disabled"
        data-cy="edit-address-code-register-address-code-button"
        @click="openSearchAddress = true"
      />
      <div v-if="!availableTime?.available" class="text-size-sm text-warning ml-2">
        {{ t('ipoes.message.outsideReceptionHour') }}
      </div>
    </div>
    <div class="d-flex flex-wrap ga-5 my-2">
      <InputForm :model-value="model.addressCode" disabled />
      <ClearButton
        :text="t('search.clear')"
        :width="100"
        :disabled="disabled || !model.addressCode"
        data-cy="edit-address-code-clear-button"
        @click="handleClear"
      />
    </div>

    <DialogBase
      :open="openSearchAddress"
      :disabled="!addressCandidate?.addressCode"
      :submit-label="t('common.save')"
      :cancel-label="t('common.cancel')"
      :title="t('ipoes.hikariCollaboSearchAddress')"
      @submit="handleSearchAddressSubmit"
      @close="openSearchAddress = false"
    >
      <div class="px-5 pb-5">
        <SearchAddress
          v-model:input="searchAddressInputData"
          v-model:valid="searchAddressValid"
          :selected-request-keys="selectedRequestKeys"
          :disabled="disabled || loading"
          :address-candidate="addressCandidate"
          :finished="!!addressCandidate?.addressCode"
          :error-message="searchAddressErrorMessage"
          @search="searchAddress"
        />
        <InputGrid v-if="!!addressCandidate?.addressCode" class="mt-3" :label="t('contractor.addressCode')">
          <div>{{ addressCandidate?.addressCode }}</div>
        </InputGrid>
      </div>
    </DialogBase>
  </div>
</template>

<style lang="scss" scoped>
.text-size-sm {
  font-size: 0.875rem;
}
</style>
