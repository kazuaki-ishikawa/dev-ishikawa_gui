<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { initialShippingInfoInputData } from '@/api/rinkLines/constants'

type PropType = {
  disabled?: boolean
}
defineProps<PropType>()
const model = defineModel<typeof initialShippingInfoInputData>({ required: true })
const { t } = useI18n()

const { shippingAddressHistoryList, getShippingAddressHistoryList } = useGetShippingAddressHistoryList()
const tableHeaders = [
  { text: '', key: 'selector', width: 60 },
  { text: t('rinkLines.shippingPostalCode'), key: 'shippingPostalCode', class: 'text-sm', width: 100 },
  { text: t('rinkLines.shippingPrefecture'), key: 'shippingPrefecture', class: 'text-sm', width: 100 },
  { text: t('rinkLines.shippingCity'), key: 'shippingCity', class: 'text-sm', width: 180 },
  { text: t('rinkLines.shippingCityAdditionalInfo'), key: 'shippingCityAdditionalInfo', class: 'text-sm', width: 200 },
  { text: t('rinkLines.shippingAddressBlock'), key: 'shippingAddressBlock', class: 'text-sm', width: 100 },
  { text: t('rinkLines.shippingAddressNumber'), key: 'shippingAddressNumber', class: 'text-sm', width: 100 },
  { text: t('rinkLines.shippingBuilding'), key: 'shippingBuilding', class: 'text-sm', width: 200 },
  { text: t('rinkLines.packageRecipient'), key: 'packageRecipient', class: 'text-sm', width: 200 },
  { text: t('rinkLines.phoneNumber'), key: 'phoneNumber', class: 'text-sm', width: 150 },
]

const openDialog = ref(false)
const selected = ref<number | null>(null)
const submitDisabled = computed(() => selected.value === null)

const handleClick = () => {
  getShippingAddressHistoryList()
  selected.value = null
  openDialog.value = true
}
const handleSubmit = () => {
  const found = shippingAddressHistoryList.value.find((_, index) => selected.value === index)
  model.value = {
    ...model.value,
    shippingPostalCode: (found?.shippingPostalCode || '').replaceAll('-', ''),
    shippingPrefecture: found?.shippingPrefecture || '',
    shippingCity: found?.shippingCity || '',
    shippingCityAdditionalInfo: found?.shippingCityAdditionalInfo || '',
    shippingAddressBlock: found?.shippingAddressBlock || '',
    shippingAddressNumber: found?.shippingAddressNumber || '',
    shippingBuilding: found?.shippingBuilding || '',
    packageRecipient: found?.packageRecipient || '',
    phoneNumber: found?.phoneNumber || '',
  }
  openDialog.value = false
}
</script>

<template>
  <CustomButton
    icon="right-arrow"
    :text="t('rinkLines.shippingHistoryButton')"
    :disabled="disabled"
    :width="320"
    data-cy="shipping-history-button-history-button"
    @click="handleClick"
  />
  <DialogBase
    :open="openDialog"
    :cancel-label="t('common.cancel')"
    :submit-label="t('common.confirmed')"
    :disabled="submitDisabled"
    :title="t('rinkLines.shippingHistoryButton')"
    :width="1425"
    @close="openDialog = false"
    @submit="handleSubmit"
  >
    <StripedTable class="my-5" :headers="tableHeaders" :items="shippingAddressHistoryList">
      <template #selector="{ index }">
        <v-sheet class="radio" width="100%" color="transparent" :class="{ checked: selected === index }">
          <div class="shipping-list-item-button" @click="selected = index" />
        </v-sheet>
      </template>
    </StripedTable>
  </DialogBase>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));

.radio {
  display: flex;
  align-items: center;
  justify-content: center;

  &.checked .shipping-list-item-button {
    border: 1px solid $secondary-color;

    &::after {
      width: 12px;
      height: 12px;
    }
  }
}

.shipping-list-item-button {
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid $info-color;
  position: relative;
  background-color: #fff;
  flex-shrink: 0;

  &::after {
    content: '';
    display: block;
    background-color: $secondary-color;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    transform: translate(-50%, -50%);
  }
}
</style>
