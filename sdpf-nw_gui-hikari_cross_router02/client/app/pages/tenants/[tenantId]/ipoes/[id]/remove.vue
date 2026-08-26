<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { RemovalCollectTypes, initialRemovalInputData, initialRemovalValid } from '@/api/ipoes/constants'
import { initialSearchAddressInputData, initialSearchAddressValid } from '@/api/hikariCollaboUtil/constants'
import type { HikariCollaboResponse } from '@/api/ipoes/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rules = useRules()

const { loading } = useLoading()
const { setNotificationMessageState } = useNotificationDialog()
const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const ipoeId = computed(() => route.params.id as string)

const inputData = ref(structuredClone(initialRemovalInputData))
const inputValid = ref(structuredClone(initialRemovalValid))
const searchAddressInputData = ref(structuredClone(initialSearchAddressInputData))
const searchAddressValid = ref(structuredClone(initialSearchAddressValid))
const openReserveDate = ref(false)
const openSearchAddress = ref(false)
const address = ref('')
const addressCode = ref('')
const deletedHikariCollaboResponse = ref<HikariCollaboResponse | null>(null)

const { searchAddress, addressCandidate, searchAddressErrorMessage, selectedRequestKeys, clearSearchAddress } =
  useSearchAddress()
const { collectTypeOptions, kitSendInstallAddressSameOptions } = useIpoes()
const { getHikariCollabo, hikariCollabo, editable } = useGetIpoe()
const { deleteHikariCollabo } = useDeleteHikariCollabo()

const selectedVisit = computed(() => inputData.value.collectType === RemovalCollectTypes.Visit)
const selectedKit = computed(() => inputData.value.collectType === RemovalCollectTypes.Kit)
const sameAddress = computed(() => inputData.value.kitSendInstallAddressSame === 'false')

const submitDisabled = computed(() => {
  const invalid = Object.values(inputValid.value).some(valid =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  )
  return invalid || !editable.value
})
watch(addressCode, () => {
  inputValid.value.kitSendAddress.addressCode =
    selectedVisit.value || (inputData.value.kitSendInstallAddressSame === 'false' && !!addressCode.value)
})
watch(sameAddress, () => {
  if (sameAddress.value) {
    clearSearchAddress()
    searchAddressInputData.value = { ...initialSearchAddressInputData }
    searchAddressValid.value = { ...initialSearchAddressValid }
    address.value = ''
    addressCode.value = ''
  }
})

const handleSearchedAddressClose = () => {
  openSearchAddress.value = false
  if (!address.value && !addressCode.value) {
    clearSearchAddress()
    searchAddressInputData.value = { ...initialSearchAddressInputData }
    searchAddressValid.value = { ...initialSearchAddressValid }
  }
}
const handleSearchedAddressSubmit = () => {
  address.value = [
    addressCandidate.value?.prefecture,
    addressCandidate.value?.municipalityList,
    addressCandidate.value?.largerSectionList,
    addressCandidate.value?.sectionList,
  ]
    .flat()
    .join('')
  addressCode.value = addressCandidate.value?.addressCode ?? ''
  handleSearchedAddressClose()
}

const handleCollectTypeChange = (collectType: string) => {
  const isKit = collectType === RemovalCollectTypes.Kit
  inputData.value = {
    collectType,
    kitSendInstallAddressSame: '',
    kitSendAddress: { ...initialRemovalInputData.kitSendAddress },
  }
  inputValid.value = {
    ...inputValid.value,
    kitSendInstallAddressSame: !isKit,
    kitSendAddress: { ...initialRemovalValid.kitSendAddress },
  }
}

const handleKitSendInstallAddressSameChange = (value: string) => {
  const kitSendAddressInputData = Object.keys(inputData.value.kitSendAddress).reduce(
    (acc, key) => ({ ...acc, [key]: '' }),
    {
      ...inputData.value.kitSendAddress,
    },
  )
  const kitSendAddressValid = Object.keys(inputValid.value.kitSendAddress).reduce(
    (acc, key) => ({ ...acc, [key]: key === 'buildingName' || value !== 'false' }),
    { ...inputValid.value.kitSendAddress },
  )
  inputData.value = { ...inputData.value, kitSendInstallAddressSame: value, kitSendAddress: kitSendAddressInputData }
  inputValid.value = { ...inputValid.value, kitSendAddress: kitSendAddressValid }
}

const handleDelete = async () => {
  if (selectedVisit.value) {
    const request = {
      collectType: RemovalCollectTypes.Visit,
      lanCollect: true,
    }
    deletedHikariCollaboResponse.value = await deleteHikariCollabo(ipoeId.value, request)
    // 光コラボ回線の廃止(作業者が訪問して回収)に成功した場合
    // 工事日予約画面が開くので、notificationDialogは閉じる
    setNotificationMessageState()
    openReserveDate.value = true
  } else if (selectedKit.value) {
    const request = {
      collectType: RemovalCollectTypes.Kit,
      kitSendInstallAddressSame: inputData.value.kitSendInstallAddressSame === 'true',
      kitSendAddress:
        inputData.value.kitSendInstallAddressSame === 'true'
          ? undefined
          : { ...inputData.value.kitSendAddress, addressCode: addressCode.value, address: address.value },
    }
    deletedHikariCollaboResponse.value = await deleteHikariCollabo(ipoeId.value, request)
    // 光コラボ回線の廃止(返送キットによる回収)に成功した場合
    // 直前の画面（詳細）に戻る
    navigationGuard(false)
    router.back()
  }
}

const handleDialogClose = () => {
  openReserveDate.value = false
  navigationGuard(false)
  router.back()
}

const isConfirmation = ref(false)
const switchConfirm = () => (isConfirmation.value = !isConfirmation.value)

const submit = computed(() => {
  const click = isConfirmation.value ? handleDelete : switchConfirm
  const text = isConfirmation.value ? t('common.abolition') : t('common.confirm')
  return { click, text }
})

watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
onBeforeMount(() => getHikariCollabo(ipoeId.value))
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-5">
      {{ t('confirm.abolition') }}
    </div>
    <InnerCard :title="t('sideBar.ipoes')">
      <DetailGrid>
        <div>{{ t('ipoes.ipoeId') }}</div>
        <div>{{ hikariCollabo?.ipoeId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.customerNote') }}</div>
        <div>{{ hikariCollabo?.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.addressCode') }}</div>
        <div>{{ hikariCollabo?.installationPlaceCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ hikariCollabo?.resourceStatus }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="t('ipoes.removalInformation')">
      <InputGrid required :label="t('ipoes.removalCollectType')">
        <SelectForm
          :model-value="inputData.collectType"
          required
          :options="collectTypeOptions"
          :placeholder="collectTypeOptions[0]?.text"
          size="middle"
          :disabled="isConfirmation"
          data-cy="ipoes-id-remove-collect-type"
          @valid="(valid: boolean) => (inputValid.collectType = valid)"
          @update:model-value="handleCollectTypeChange"
        />
      </InputGrid>
    </InnerCard>

    <InnerCard v-if="selectedKit" :title="t('ipoes.kitSendAddress')">
      <InputGrid required class="mb-5" :label="t('ipoes.kitSendInstallAddressSame')">
        <RadioForm
          :model-value="inputData.kitSendInstallAddressSame"
          required
          :options="kitSendInstallAddressSameOptions"
          :disabled="isConfirmation"
          data-cy="ipoes-id-remove-kit-send-install-address-same"
          @valid="(valid: boolean) => (inputValid.kitSendInstallAddressSame = valid)"
          @update:model-value="handleKitSendInstallAddressSameChange"
        />
      </InputGrid>
      <template v-if="sameAddress">
        <InputGrid required :label="t('ipoes.kitSendAddressCompanyName')">
          <InputForm
            v-model="inputData.kitSendAddress.companyName"
            required
            :rules="[rules.fullwidthCharacter]"
            maxlength="40"
            :placeholder="t('placeholder.companyName')"
            :disabled="isConfirmation"
            data-cy="ipoes-id-remove-kit-send-address-company-name"
            @valid="(valid: boolean) => (inputValid.kitSendAddress.companyName = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.kitSendAddressPersonName')">
          <InputForm
            v-model="inputData.kitSendAddress.personName"
            required
            :rules="[rules.fullwidthCharacter, rules.fullwidthSpace]"
            maxlength="32"
            :placeholder="t('placeholder.name')"
            :disabled="isConfirmation"
            data-cy="ipoes-id-remove-kit-send-address-person-name"
            @valid="(valid: boolean) => (inputValid.kitSendAddress.personName = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.addressCode')">
          <div class="d-flex flex-wrap ga-5">
            <InputForm
              :model-value="addressCode"
              disabled
              data-cy="ipoes-id-remove-kit-send-address-address-code"
              @valid="(valid: boolean) => (inputValid.kitSendAddress.addressCode = valid)"
            />
            <CustomButton
              icon="search"
              :text="t('ipoes.searchAddress')"
              :width="150"
              :disabled="isConfirmation"
              data-cy="ipoes-id-remove-search-address-button"
              @click="openSearchAddress = true"
            />
          </div>
        </InputGrid>
        <InputGrid required :label="t('contractor.address')">
          <InputForm
            :model-value="address"
            disabled
            required
            maxlength="46"
            data-cy="ipoes-id-remove-kit-send-address-address"
          />
        </InputGrid>
        <InputGrid required :label="t('contractor.houseNumber')">
          <InputForm
            v-model="inputData.kitSendAddress.houseNumber"
            required
            :rules="[rules.fullwidthCharacter]"
            maxlength="40"
            placeholder="２−３"
            :disabled="isConfirmation"
            data-cy="ipoes-id-remove-kit-send-address-house-number"
            @valid="(valid: boolean) => (inputValid.kitSendAddress.houseNumber = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('contractor.buildingName')">
          <InputForm
            v-model="inputData.kitSendAddress.buildingName"
            :rules="[rules.fullwidthCharacter]"
            maxlength="40"
            placeholder="ハイツ１００"
            :disabled="isConfirmation"
            data-cy="ipoes-id-remove-kit-send-address-building-name"
            @valid="(valid: boolean) => (inputValid.kitSendAddress.buildingName = valid)"
          />
        </InputGrid>
      </template>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="ipoes-id-remove-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :text="submit.text"
        :disabled="submitDisabled || loading"
        :width="180"
        data-cy="ipoes-id-remove-submit-button"
        @click="submit.click"
      />
    </div>

    <ReserveDateDialog
      v-if="!!deletedHikariCollaboResponse"
      type="removal"
      :open="openReserveDate"
      :hikari-collabo="deletedHikariCollaboResponse"
      @submit="handleDialogClose"
      @close="handleDialogClose"
    />
    <DialogBase
      :open="openSearchAddress"
      :disabled="!addressCandidate?.addressCode"
      :submit-label="t('common.save')"
      :cancel-label="t('common.cancel')"
      @submit="handleSearchedAddressSubmit"
      @close="handleSearchedAddressClose"
    >
      <div class="px-5 pb-5">
        <SearchAddress
          v-model:input="searchAddressInputData"
          v-model:valid="searchAddressValid"
          :selected-request-keys="selectedRequestKeys"
          :disabled="loading"
          :address-candidate="addressCandidate"
          :finished="!!addressCandidate?.addressCode"
          :error-message="searchAddressErrorMessage"
          @search="searchAddress"
        />
        <InputGrid v-if="!!addressCandidate?.addressCode" class="mt-3" :label="t('ipoes.addressCode')">
          <div>{{ addressCandidate?.addressCode }}</div>
        </InputGrid>
      </div>
    </DialogBase>
  </CardContainer>
</template>
