<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OrderRinkDeviceRequest } from '@/api/rinkDevices/types'

type PropType = {
  request: OrderRinkDeviceRequest
}
const props = defineProps<PropType>()
const { t } = useI18n()

const headers = [
  { text: 'No.', key: 'lineIndex', width: 80 },
  { text: t('rinkDevices.deviceName'), key: 'deviceName' },
  { text: t('rinkDevices.imei'), key: 'imei' },
]
const items = computed(
  () =>
    props.request.orderDetailLine?.map(item => ({
      lineIndex: item.lineIndex,
      deviceName: item.deviceName || item.initialDeviceName || '',
      imei: item.imei || '',
    })) ?? [],
)
</script>

<template>
  <div>
    <InnerCard :title="t('rinkDevices.list')">
      <div class="bg-white">
        <StripedTable :headers="headers" :items="items" :key-items="['lineIndex']" />
      </div>
    </InnerCard>
    <OrderShippingInformation
      :shipping-address="{
        shippingPostalCode: request.shippingPostalCode,
        shippingPrefecture: request.shippingPrefecture,
        shippingCity: request.shippingCity,
        shippingCityAdditionalInfo: request.shippingCityAdditionalInfo || null,
        shippingAddressBlock: request.shippingAddressBlock,
        shippingAddressNumber: request.shippingAddressNumber,
        shippingBuilding: request.shippingBuilding || null,
        packageRecipient: request.packageRecipient,
        phoneNumber: request.phoneNumber,
      }"
    />
  </div>
</template>
