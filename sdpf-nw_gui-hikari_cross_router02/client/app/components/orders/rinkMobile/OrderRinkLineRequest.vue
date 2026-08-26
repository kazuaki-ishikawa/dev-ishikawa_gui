<script setup lang="ts">
import type { OrderRinkLineRequest } from '@/api/rinkLines/types'

type PropType = {
  request: OrderRinkLineRequest
}
const props = defineProps<PropType>()

const shippingAddress = computed(() => ({
  shippingPostalCode: props.request.shippingPostalCode || '',
  shippingPrefecture: props.request.shippingPrefecture || '',
  shippingCity: props.request.shippingCity || '',
  shippingCityAdditionalInfo: props.request.shippingCityAdditionalInfo || null,
  shippingAddressBlock: props.request.shippingAddressBlock || '',
  shippingAddressNumber: props.request.shippingAddressNumber || '',
  shippingBuilding: props.request.shippingBuilding || null,
  packageRecipient: props.request.packageRecipient || '',
  phoneNumber: props.request.phoneNumber || '',
}))
</script>

<template>
  <div>
    <OrderRinkLineTable :list="request.orderDetailLine ?? []" :order-type="request.orderType" />
    <OrderShippingInformation v-if="!!shippingAddress.shippingPostalCode" :shipping-address="shippingAddress" />
  </div>
</template>
