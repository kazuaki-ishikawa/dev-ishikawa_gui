<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IPOE_LINK } from '@/api/ipoes/constants'
import type { initialSearchAddressInputData, initialSearchAddressValid } from '@/api/hikariCollaboUtil/constants'
import type { SearchAddressResponse, SearchAddressRequest, BuildingType } from '@/api/hikariCollaboUtil/types'

// 表示順に関係するのでリストの順番は固定
const SearchAddressResponseListKeys = [
  'municipalityList',
  'largerSectionList',
  'sectionList',
  'houseNumber1List',
  'houseNumber2List',
  'houseNumber3List',
  'buildingName1List',
  'buildingName2List',
  'buildingName3List',
  'buildingFacilityNameList',
] as const
// 表示順に関係するのでリストの順番は固定
const SearchAddressNullableRequestKeys = [
  'section',
  'houseNumber1',
  'houseNumber2',
  'houseNumber3',
  'buildingName1',
  'buildingName2',
  'buildingName3',
  'buildingFacilityName',
] as const

type PropsType = {
  addressCandidate: SearchAddressResponse | null
  selectedRequestKeys: string[]
  errorMessage: string
  finished: boolean
  hasBuildingTypeNotice?: boolean
  disabled?: boolean
}
const props = defineProps<PropsType>()
const inputData = defineModel<typeof initialSearchAddressInputData>('input', { required: true })
const inputValid = defineModel<typeof initialSearchAddressValid>('valid', { required: true })

type Emits = {
  (e: 'search', data: SearchAddressRequest): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { buildingTypeOptions } = useHikariCollaboUtils()

const currentListKey = computed(() => {
  // 現在SelectButtonで表示するべきListのkeyを取得
  const foundKey = SearchAddressResponseListKeys.slice()
    .reverse()
    .find(key => !!props.addressCandidate?.[key]?.length)
  return foundKey
})

const showMunicipality = computed(
  () => currentListKey.value === 'municipalityList' && !props.selectedRequestKeys.includes('municipality'),
)
const showLargerSection = computed(
  () => currentListKey.value === 'largerSectionList' && !props.selectedRequestKeys.includes('largerSection'),
)
const showSection = computed(
  () => currentListKey.value === 'sectionList' && !props.selectedRequestKeys.includes('section'),
)
const showHouseNumber1 = computed(
  () => currentListKey.value === 'houseNumber1List' && !props.selectedRequestKeys.includes('houseNumber1'),
)
const showHouseNumber2 = computed(
  () => currentListKey.value === 'houseNumber2List' && !props.selectedRequestKeys.includes('houseNumber2'),
)
const showHouseNumber3 = computed(
  () => currentListKey.value === 'houseNumber3List' && !props.selectedRequestKeys.includes('houseNumber3'),
)
const showBuildingName1 = computed(
  () => currentListKey.value === 'buildingName1List' && !props.selectedRequestKeys.includes('buildingName1'),
)
const showBuildingName2 = computed(
  () => currentListKey.value === 'buildingName2List' && !props.selectedRequestKeys.includes('buildingName2'),
)
const showBuildingName3 = computed(
  () => currentListKey.value === 'buildingName3List' && !props.selectedRequestKeys.includes('buildingName3'),
)
const showBuildingFacilityName = computed(
  () =>
    currentListKey.value === 'buildingFacilityNameList' && !props.selectedRequestKeys.includes('buildingFacilityName'),
)

const getAddressValue = (showBool: boolean, list?: string[]) => {
  return !showBool && list?.length === 1 ? list[0] : undefined
}

const searchedAddress = computed(() => {
  const {
    municipalityList,
    largerSectionList,
    sectionList,
    houseNumber1List,
    houseNumber2List,
    houseNumber3List,
    buildingName1List,
    buildingName2List,
    buildingName3List,
    buildingFacilityNameList,
  } = props.addressCandidate ?? {}

  const municipality = getAddressValue(showMunicipality.value, municipalityList)
  const largerSection = getAddressValue(showLargerSection.value, largerSectionList)
  const section = getAddressValue(showSection.value, sectionList)
  const houseNumber1 = getAddressValue(showHouseNumber1.value, houseNumber1List)
  const houseNumber2 = getAddressValue(showHouseNumber2.value, houseNumber2List)
  const houseNumber3 = getAddressValue(showHouseNumber3.value, houseNumber3List)
  const buildingName1 = getAddressValue(showBuildingName1.value, buildingName1List)
  const buildingName2 = getAddressValue(showBuildingName2.value, buildingName2List)
  const buildingName3 = getAddressValue(showBuildingName3.value, buildingName3List)
  const buildingFacilityName = getAddressValue(showBuildingFacilityName.value, buildingFacilityNameList)

  return {
    municipality,
    largerSection,
    section,
    houseNumber1,
    houseNumber2,
    houseNumber3,
    buildingName1,
    buildingName2,
    buildingName3,
    buildingFacilityName,
  }
})

const searchAddressDisabled = computed(() => Object.values(inputValid.value).some(valid => !valid))
const address = computed(() => {
  if (!props.addressCandidate) {
    return ''
  }
  const { prefecture } = props.addressCandidate
  const {
    municipality,
    largerSection,
    section,
    houseNumber1,
    houseNumber2,
    houseNumber3,
    buildingName1,
    buildingName2,
    buildingName3,
    buildingFacilityName,
  } = inputData.value

  const list = [prefecture, municipality, largerSection, section].filter(Boolean)
  const houseNumber = [houseNumber1, houseNumber2, houseNumber3].filter(Boolean)
  const building = [buildingName1, buildingName2, buildingName3, buildingFacilityName].filter(Boolean)

  return `${list.join('')} ${houseNumber.join('ー')} ${building.join(' ')}`
})
const showAngoraLink = computed(() => !props.finished && !!address.value)

const getSearchAddressRequest = (addressObject?: { [key: string]: string }) => {
  if (!addressObject) {
    return
  }

  const currentKey = currentListKey.value?.split('List')[0]
  const newObject = Object.entries(addressObject).reduce(
    (obj, [key, value]) => {
      // 現在選択中のkeyからindexを取得
      const foundIndex = SearchAddressNullableRequestKeys.findIndex(nullableKey => nullableKey === currentKey)
      if (foundIndex < 0) {
        return obj
      }
      const nullable = SearchAddressNullableRequestKeys.slice(0, foundIndex).reduce(
        (acc, foundKey) => {
          return { ...acc, [foundKey]: searchedAddress.value[foundKey] ?? null }
        },
        { [key]: value === t('ipoes.none') ? null : value },
      )
      Object.assign(obj, nullable)
      return obj
    },
    { ...addressObject },
  )

  return newObject
}

const handleSearchAddress = (addressObject?: { [key: string]: string }) => {
  const common = {
    buildingType: inputData.value.buildingType as BuildingType,
    postalCode: inputData.value.postalCode,
    // 郵便番号検索時には都道府県名は不要なので undefined を送り、それ以外のときにはレスポンス中の都道府県名をそのまま送る
    prefecture: addressObject && props.addressCandidate?.prefecture,
  }
  const newObject = getSearchAddressRequest(addressObject)
  const request = newObject ? Object.assign(common, searchedAddress.value, { ...newObject }) : common
  emits('search', request)
}

watch(searchedAddress, () => {
  inputData.value = Object.entries(searchedAddress.value).reduce(
    (obj, [key, value]) => {
      return { ...obj, [key]: value ?? '' }
    },
    { ...inputData.value },
  )
})
</script>

<template>
  <div>
    <InputGrid
      required
      :label="t('ipoes.buildingType')"
      :help="hasBuildingTypeNotice ? t('ipoes.help.buildingTypeWithNotice') : t('ipoes.help.buildingType')"
    >
      <RadioForm
        v-model="inputData.buildingType"
        :options="buildingTypeOptions"
        :disabled="disabled"
        data-cy="search-address-building-type"
        @valid="(valid: boolean) => (inputValid.buildingType = valid)"
      />
    </InputGrid>
    <InputGrid required :label="t('ipoes.postalCode')" :help="t('ipoes.help.postalCode')">
      <InputButtonForm
        v-model="inputData.postalCode"
        required
        :placeholder="t('placeholder.postalCode')"
        :button-disabled="searchAddressDisabled"
        :rules="[rules.postalCode]"
        :button-label="t('ipoes.searchAddress')"
        :disabled="disabled"
        size="small"
        data-cy="search-address-postal-code"
        @submit="handleSearchAddress"
        @valid="(valid: boolean) => (inputValid.postalCode = valid)"
      />
    </InputGrid>

    <InputGrid v-if="!!address" :label="t('ipoes.selectedAddress')">{{ address }}</InputGrid>
    <template v-if="!finished">
      <SelectButton
        v-if="showMunicipality"
        :value="inputData.municipality"
        :label="t('ipoes.municipality')"
        :list="addressCandidate?.municipalityList"
        :disabled="disabled"
        data-cy="search-address-municipality-list-button"
        @click="(value: string) => handleSearchAddress({ municipality: value })"
      />
      <SelectButton
        v-if="showLargerSection"
        :value="inputData.largerSection"
        :label="t('ipoes.largerSection')"
        :list="addressCandidate?.largerSectionList"
        :disabled="disabled"
        data-cy="search-address-larger-section-list-button"
        @click="(value: string) => handleSearchAddress({ largerSection: value })"
      />
      <SelectButton
        v-if="showSection"
        :value="inputData.section"
        :label="t('ipoes.section')"
        :list="[...(addressCandidate?.sectionList ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="search-address-section-list-button"
        @click="(value: string) => handleSearchAddress({ section: value })"
      />
      <SelectButton
        v-if="showHouseNumber1"
        :value="inputData.houseNumber1"
        :label="t('ipoes.houseNumber1')"
        :list="[...(addressCandidate?.houseNumber1List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="search-address-house-number1-list-button"
        @click="(value: string) => handleSearchAddress({ houseNumber1: value })"
      />
      <SelectButton
        v-if="showHouseNumber2"
        :value="inputData.houseNumber2"
        :label="t('ipoes.houseNumber2')"
        :list="[...(addressCandidate?.houseNumber2List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="search-address-house-number2-list-button"
        @click="(value: string) => handleSearchAddress({ houseNumber2: value })"
      />
      <SelectButton
        v-if="showHouseNumber3"
        :value="inputData.houseNumber3"
        :label="t('ipoes.houseNumber3')"
        :list="[...(addressCandidate?.houseNumber3List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="search-address-house-number3-list-button"
        @click="(value: string) => handleSearchAddress({ houseNumber3: value })"
      />
      <SelectButton
        v-if="showBuildingName1"
        :value="inputData.buildingName1"
        :label="t('ipoes.buildingName1')"
        :list="[...(addressCandidate?.buildingName1List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="search-address-building-name1-list-button"
        @click="(value: string) => handleSearchAddress({ buildingName1: value })"
      />
      <SelectButton
        v-if="showBuildingName2"
        :value="inputData.buildingName2"
        :label="t('ipoes.buildingName2')"
        :list="[...(addressCandidate?.buildingName2List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="search-address-building-name2-list-button"
        @click="(value: string) => handleSearchAddress({ buildingName2: value })"
      />
      <SelectButton
        v-if="showBuildingName3"
        :value="inputData.buildingName3"
        :label="t('ipoes.buildingName3')"
        :list="[...(addressCandidate?.buildingName3List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="search-address-building-name3-list-button"
        @click="(value: string) => handleSearchAddress({ buildingName3: value })"
      />
      <SelectButton
        v-if="showBuildingFacilityName"
        :value="inputData.buildingFacilityName"
        :label="t('ipoes.buildingFacilityName')"
        :list="addressCandidate?.buildingFacilityNameList"
        :disabled="disabled"
        data-cy="search-address-building-facility-name-list-button"
        @click="(value: string) => handleSearchAddress({ buildingFacilityName: value })"
      />
      <CustomButton
        v-if="!!addressCandidate?.nextRequestNumber"
        :text="t('ipoes.nextRequestButton')"
        icon="search"
        :width="180"
        :disabled="disabled"
        data-cy="search-address-next-request-button"
        @click="handleSearchAddress({ nextRequestNumber: addressCandidate.nextRequestNumber })"
      />
      <div v-if="errorMessage" class="mt-4" data-cy="search-address-error-message">{{ errorMessage }}</div>
    </template>
    <i18n-t
      v-if="showAngoraLink"
      class="pt-4 text-pre-wrap"
      tag="div"
      scope="global"
      keypath="message.searchAddressNotFound"
    >
      <template #here>
        <NuxtLink :to="IPOE_LINK.INQUIRY" target="_blank">
          {{ t('common.here') }}
        </NuxtLink>
      </template>
      <template #ticket>
        <NuxtLink :to="IPOE_LINK.REGISTRATION_ADDRESS" target="_blank">
          {{ t('ipoes.addressRegistrationTicket') }}
        </NuxtLink>
      </template>
    </i18n-t>
  </div>
</template>
