<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GUARANTEE_LINK } from '@/api/guarantees/constants'
import { SearchAddressResponseListKeys, initialIwanUtilSearchAddressInputData } from '@/api/iwanUtil/constants'
import type {
  InitialRegistrationAddressInputDataType,
  SearchAddressRequest,
  SearchAddressResponse,
} from '@/api/iwanUtil/types'

// 表示順に関係するのでリストの順番は固定
const SearchAddressNullableRequestKeys = [
  'section',
  'houseNumber1',
  'houseNumber2',
  'houseNumber3',
  'buildingName1',
  'buildingName2',
  'buildingName3',
] as const

type PropsType = {
  addressCandidate: SearchAddressResponse | null
  selectedRequestKeys: string[]
  hideSelector?: keyof typeof SearchAddressResponseListKeys
  serviceAvailable?: boolean
  disabled?: boolean
}
const inputData = defineModel<InitialRegistrationAddressInputDataType>('data', { required: true })
const props = defineProps<PropsType>()

type Emits = {
  (e: 'search', data: SearchAddressRequest): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()

const inputValid = ref({ postalCode: false })

const currentListKey = computed(() => {
  // 現在 SelectButton で表示するべき List の key を取得
  const list = Object.keys(SearchAddressResponseListKeys) as Array<keyof typeof SearchAddressResponseListKeys>
  const foundKey = list.reverse().find(key => !!props.addressCandidate?.[key]?.length)
  return foundKey
})

const showSelector = computed(() => !props.hideSelector || !props.addressCandidate?.[props.hideSelector])
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

const getAddressValue = (showBool: boolean, list?: string[]) => {
  return (!showBool || finished.value) && list?.length === 1 ? list[0] : undefined
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
  }
})

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
  } = searchedAddress.value

  const list = [prefecture, municipality, largerSection, section].filter(Boolean)
  const houseNumber = [houseNumber1, houseNumber2, houseNumber3].filter(Boolean)
  const building = [buildingName1, buildingName2, buildingName3].filter(Boolean)

  if (props?.hideSelector === 'municipalityList') {
    const otherList = [prefecture].filter(Boolean)
    return `${otherList.join('')}`
  }
  if (props?.hideSelector === 'largerSectionList') {
    const otherList = [prefecture, municipality].filter(Boolean)
    return `${otherList.join('')}`
  }
  if (props?.hideSelector === 'sectionList') {
    const otherList = [prefecture, municipality, largerSection].filter(Boolean)
    return `${otherList.join('')}`
  }
  if (props?.hideSelector === 'houseNumber1List') {
    return `${list.join('')}`
  }
  if (props?.hideSelector === 'houseNumber2List') {
    const otherHouseNumber = [houseNumber1].filter(Boolean)
    return `${list.join('')} ${otherHouseNumber.join('ー')}`
  }
  if (props?.hideSelector === 'houseNumber3List') {
    const otherHouseNumber = [houseNumber1, houseNumber2].filter(Boolean)
    return `${list.join('')} ${otherHouseNumber.join('ー')}`
  }
  if (props?.hideSelector === 'buildingName1List') {
    return `${list.join('')} ${houseNumber.join('ー')}`
  }
  if (props?.hideSelector === 'buildingName2List') {
    const otherBuilding = [buildingName1].filter(Boolean)
    return `${list.join('')} ${houseNumber.join('ー')} ${otherBuilding.join(' ')}`
  }
  if (props?.hideSelector === 'buildingName3List') {
    const otherBuilding = [buildingName1, buildingName2].filter(Boolean)
    return `${list.join('')} ${houseNumber.join('ー')} ${otherBuilding.join(' ')}`
  }

  return `${list.join('')} ${houseNumber.join('ー')} ${building.join(' ')}`
})

// installationPlaceCode がある場合はこれ以上の検索は不要
const finished = computed(() => !!props.addressCandidate?.installationPlaceCode)

const searchAddressRequest = computed<SearchAddressRequest | undefined>(() => {
  const postalCode = props.addressCandidate?.postalCode ?? ''
  const prefecture = props.addressCandidate?.prefecture
  const key = currentListKey.value?.split('List')[0]

  if (!key || !postalCode) {
    return
  }

  const foundIndex = SearchAddressNullableRequestKeys.findIndex(nullableKey => nullableKey === key)
  if (foundIndex < 0) {
    return { ...searchedAddress.value, postalCode, prefecture }
  }
  // 検索済み かつ searchedAddress.value で undefined になる項目を null に書き換える
  const request = SearchAddressNullableRequestKeys.slice(0, foundIndex).reduce<SearchAddressRequest>(
    (acc, foundKey) => {
      return { ...acc, [foundKey]: searchedAddress.value[foundKey] ?? null }
    },
    { ...searchedAddress.value, postalCode, prefecture },
  )
  return request
})

watch(searchAddressRequest, () => {
  // 入力値の初期化
  if (searchAddressRequest.value) {
    inputData.value = {
      ...inputData.value,
      ...Object.entries(searchAddressRequest.value).reduce((acc, [key, value]) => {
        if (!value) {
          return { ...acc, [key]: '' }
        }
        return { ...acc, [key]: value }
      }, {}),
    }
  } else {
    inputData.value = {
      ...inputData.value,
      ...initialIwanUtilSearchAddressInputData,
      postalCode: inputData.value.postalCode,
      prefecture: inputData.value.prefecture,
    }
  }
})

const handleSearchAddress = (addressObject?: { key: keyof SearchAddressRequest; value: string }) => {
  const common = {
    postalCode: inputData.value.postalCode,
    // 郵便番号検索時には都道府県名は不要なので undefined を送り、それ以外のときにはレスポンス中の都道府県名をそのまま送る
    prefecture: addressObject && props.addressCandidate?.prefecture,
  }
  // request 送信
  const request = addressObject
    ? {
        ...common,
        ...searchAddressRequest.value,
        [addressObject.key]: addressObject.value === t('ipoes.none') ? null : addressObject.value,
      }
    : common
  emits('search', request)
}

onBeforeMount(() => {
  const postalCode = props.addressCandidate?.postalCode ?? inputData.value.postalCode
  inputValid.value = { postalCode: !!postalCode }
})
</script>

<template>
  <div>
    <InputGrid required :label="t('ipoes.installationPlacePostalCode')">
      <template #help>
        <i18n-t keypath="guarantees.help.addressSearch" scope="global">
          <template #linkText>
            <NuxtLink :to="GUARANTEE_LINK.IWAN_APPLICATION" target="_blank">{{ t('common.here') }}</NuxtLink>
          </template>
        </i18n-t>
      </template>
      <InputButtonForm
        v-model="inputData.postalCode"
        required
        :placeholder="t('placeholder.postalCode')"
        :disabled="disabled"
        :button-disabled="!inputValid.postalCode || disabled"
        :rules="[rules.postalCode]"
        :button-label="t('ipoes.searchAddress')"
        size="small"
        data-cy="guarantee-search-address-postal-code"
        @submit="handleSearchAddress"
        @valid="(valid: boolean) => (inputValid.postalCode = valid)"
      />
    </InputGrid>

    <InputGrid v-if="!!address" :label="t('ipoes.selectedAddress')">
      <span data-cy="guarantee-search-address-address">{{ address.trim() }}</span>
    </InputGrid>
    <div v-if="showSelector && !finished" data-cy="guarantee-search-address-selector">
      <SelectButton
        v-if="showMunicipality"
        :value="inputData.municipality"
        :label="t('ipoes.municipality')"
        :list="addressCandidate?.municipalityList"
        :disabled="disabled"
        data-cy="guarantee-search-address-municipality-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'municipality', value })"
      />
      <SelectButton
        v-if="showLargerSection"
        :value="inputData.largerSection"
        :label="t('ipoes.largerSection')"
        :list="addressCandidate?.largerSectionList"
        :disabled="disabled"
        data-cy="guarantee-search-address-larger-section-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'largerSection', value })"
      />
      <SelectButton
        v-if="showSection"
        :value="inputData.section"
        :label="t('ipoes.section')"
        :list="[...(addressCandidate?.sectionList ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="guarantee-search-address-section-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'section', value })"
      />
      <SelectButton
        v-if="showHouseNumber1"
        :value="inputData.houseNumber1"
        :label="t('ipoes.houseNumber1')"
        :list="[...(addressCandidate?.houseNumber1List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="guarantee-search-address-house-number1-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'houseNumber1', value })"
      />
      <SelectButton
        v-if="showHouseNumber2"
        :value="inputData.houseNumber2"
        :label="t('ipoes.houseNumber2')"
        :list="[...(addressCandidate?.houseNumber2List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="guarantee-search-address-house-number2-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'houseNumber2', value })"
      />
      <SelectButton
        v-if="showHouseNumber3"
        :value="inputData.houseNumber3"
        :label="t('ipoes.houseNumber3')"
        :list="[...(addressCandidate?.houseNumber3List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="guarantee-search-address-house-number3-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'houseNumber3', value })"
      />
      <SelectButton
        v-if="showBuildingName1"
        :value="inputData.buildingName1"
        :label="t('ipoes.buildingName1')"
        :list="[...(addressCandidate?.buildingName1List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="guarantee-search-address-building-name1-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'buildingName1', value })"
      />
      <SelectButton
        v-if="showBuildingName2"
        :value="inputData.buildingName2"
        :label="t('ipoes.buildingName2')"
        :list="[...(addressCandidate?.buildingName2List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="guarantee-search-address-building-name2-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'buildingName2', value })"
      />
      <SelectButton
        v-if="showBuildingName3"
        :value="inputData.buildingName3"
        :label="t('ipoes.buildingName3')"
        :list="[...(addressCandidate?.buildingName3List ?? []), t('ipoes.none')]"
        :disabled="disabled"
        data-cy="guarantee-search-address-building-name3-list-button"
        @click="(value: string) => handleSearchAddress({ key: 'buildingName3', value })"
      />
      <CustomButton
        v-if="!!addressCandidate?.nextRequestNumber"
        :text="t('ipoes.nextRequestButton')"
        icon="search"
        :width="180"
        :disabled="disabled"
        class="mb-6"
        data-cy="guarantee-search-address-next-request-button"
        @click="handleSearchAddress({ key: 'nextRequestNumber', value: addressCandidate.nextRequestNumber })"
      />
    </div>
    <div v-else-if="!serviceAvailable && !loading" class="mt-6" data-cy="guarantee-search-address-unable-to-service">
      {{ t('message.unableToProvideServices') }}
    </div>
    <slot name="address-not-found" />
  </div>
</template>
