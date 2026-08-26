<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { Prefectures } from '@/api/constants'
import type { initialShippingInfoInputData, initialShippingInfoValid } from '@/api/rinkLines/constants'

type PropType = {
  disabledDates: (date: Date) => boolean
  disabled?: boolean
  isEdit?: boolean
}
const props = defineProps<PropType>()
const model = defineModel<typeof initialShippingInfoInputData>({ required: true })
const inputValid = defineModel<typeof initialShippingInfoValid>('valid', { required: true })

const { t } = useI18n()
const rules = useRules()
const { postalCodeMap, loadPostalCodeMap } = usePostalCode()

const label = computed(() => (props.isEdit ? t('rinkLines.updateRequestedDate') : t('rinkLines.startRequestedDate')))

const PrefectureOptions = Prefectures.map(pref => ({
  value: pref.name,
  text: pref.name,
}))

const addressRule = (value: string) => {
  return (
    !value ||
    model.value.shippingPrefecture.length +
      model.value.shippingCity.length +
      model.value.shippingCityAdditionalInfo.length <=
      16 ||
    t('rinkLines.message.invalidAddress')
  )
}

const postalCodeInputValue = computed(() => {
  const postalCode = model.value.shippingPostalCode
  if (postalCode.includes('-')) {
    return postalCode
  }
  return 3 <= postalCode.length ? postalCode.slice(0, 3) + '-' + postalCode.slice(3) : postalCode
})
const lastAutoFilled = ref({ prefecture: '', city: '', additionalInfo: '' })
const canAutoFill = computed(() => {
  const { shippingPrefecture, shippingCity, shippingCityAdditionalInfo } = model.value
  const isEmpty = !shippingPrefecture && !shippingCity && !shippingCityAdditionalInfo
  const isAutoFilled =
    shippingPrefecture === lastAutoFilled.value.prefecture &&
    shippingCity === lastAutoFilled.value.city &&
    shippingCityAdditionalInfo === lastAutoFilled.value.additionalInfo
  return isEmpty || isAutoFilled
})

const updatePostalCode = (postalCode: string) => {
  // model.shippingPostalCode にハイフンなしで保存する
  model.value.shippingPostalCode = postalCode.replaceAll('-', '')

  if (!canAutoFill.value) {
    return
  }
  if (postalCode.length <= 7) {
    model.value = {
      ...model.value,
      shippingPrefecture: '',
      shippingCity: '',
      shippingCityAdditionalInfo: '',
    }
    lastAutoFilled.value = { prefecture: '', city: '', additionalInfo: '' }
    return
  }
  //  郵便番号から都道府県、市区町村、町字を自動入力
  const { prefecture, city, additionalInfo } = postalCodeMap.value.get(model.value.shippingPostalCode) || {
    prefecture: '',
    city: '',
    additionalInfo: '',
  }
  model.value = {
    ...model.value,
    shippingPrefecture: prefecture,
    shippingCity: city,
    shippingCityAdditionalInfo: additionalInfo,
  }
  lastAutoFilled.value = { prefecture, city, additionalInfo }
}

onBeforeMount(() => loadPostalCodeMap())
</script>

<template>
  <InnerCard :title="t('rinkLines.deliveryAddress')" class="mt-4">
    <template #button>
      <ShippingHistoryButton v-model="model" :disabled="disabled" />
    </template>
    <InputGrid :label="t('rinkLines.shippingPostalCode')" required>
      <InputForm
        :model-value="postalCodeInputValue"
        required
        size="xSmall"
        maxlength="8"
        :disabled="disabled"
        :placeholder="t('placeholder.postalCode')"
        :rules="[rules.postalCode]"
        data-cy="edit-shipping-information-shipping-postal-code"
        @update:model-value="updatePostalCode"
        @valid="(valid: boolean) => (inputValid.shippingPostalCode = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('rinkLines.shippingPrefecture')" required>
      <SelectForm
        v-model="model.shippingPrefecture"
        :options="PrefectureOptions"
        required
        :disabled="disabled"
        placeholder="東京都"
        :rules="[addressRule]"
        data-cy="edit-shipping-information-shipping-prefecture"
        @valid="(valid: boolean) => (inputValid.shippingPrefecture = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('rinkLines.shippingCity')" required>
      <InputForm
        v-model="model.shippingCity"
        required
        size="small"
        :disabled="disabled"
        placeholder="千代田区"
        :rules="[rules.fullwidthCharacter, addressRule]"
        data-cy="edit-shipping-information-shipping-city"
        @valid="(valid: boolean) => (inputValid.shippingCity = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('rinkLines.shippingCityAdditionalInfo')">
      <InputForm
        v-model="model.shippingCityAdditionalInfo"
        size="small"
        :disabled="disabled"
        placeholder="大手町"
        :rules="[rules.fullwidthCharacter, addressRule]"
        data-cy="edit-shipping-information-shipping-city-additional-info"
        @valid="(valid: boolean) => (inputValid.shippingCityAdditionalInfo = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('rinkLines.shippingAddressBlock')" required>
      <InputForm
        v-model="model.shippingAddressBlock"
        required
        size="small"
        maxlength="8"
        :disabled="disabled"
        placeholder="２丁目"
        :rules="[rules.fullwidthCharacter]"
        data-cy="edit-shipping-information-shipping-address-block"
        @valid="(valid: boolean) => (inputValid.shippingAddressBlock = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('rinkLines.shippingAddressNumber')" required>
      <InputForm
        v-model="model.shippingAddressNumber"
        required
        size="small"
        maxlength="8"
        :disabled="disabled"
        placeholder="３番１号"
        :rules="[rules.fullwidthCharacter]"
        data-cy="edit-shipping-information-shipping-address-number"
        @valid="(valid: boolean) => (inputValid.shippingAddressNumber = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('rinkLines.shippingBuilding')">
      <InputForm
        v-model="model.shippingBuilding"
        maxlength="16"
        :disabled="disabled"
        placeholder="大手町プレイスウエストタワー"
        :rules="[rules.fullwidthCharacter]"
        data-cy="edit-shipping-information-shipping-building"
        @valid="(valid: boolean) => (inputValid.shippingBuilding = valid)"
      />
    </InputGrid>

    <InputGrid :label="t('rinkLines.packageRecipient')" required>
      <InputForm
        v-model="model.packageRecipient"
        required
        size="small"
        maxlength="16"
        :disabled="disabled"
        :placeholder="t('placeholder.name')"
        :rules="[rules.fullwidthCharacter]"
        data-cy="edit-shipping-information-package-recipient"
        @valid="(valid: boolean) => (inputValid.packageRecipient = valid)"
      />
      <template #footer>
        <div class="text-warning">
          {{ t('rinkLines.note.packageRecipient') }}
        </div>
      </template>
    </InputGrid>
    <InputGrid :label="t('rinkLines.phoneNumber')" required>
      <InputForm
        v-model="model.phoneNumber"
        required
        size="small"
        maxlength="11"
        placeholder="0312345678"
        :disabled="disabled"
        :rules="[rules.phoneNumberWithoutHyphen]"
        data-cy="edit-shipping-information-phone-number"
        @valid="(valid: boolean) => (inputValid.phoneNumber = valid)"
      />
    </InputGrid>
  </InnerCard>
  <InnerCard :title="label">
    <InputGrid :label="label" required>
      <DatePicker
        v-model="model.requestDate"
        required
        :min-date="dayjs().format()"
        :disabled="disabled"
        :disabled-dates="disabledDates"
        size="small"
        data-cy="edit-shipping-information-request-date"
        @valid="(valid: boolean) => (inputValid.requestDate = valid)"
      />
    </InputGrid>
  </InnerCard>
</template>
