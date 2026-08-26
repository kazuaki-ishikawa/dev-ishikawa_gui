<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ShippingAddressType } from '@/api/rinkLines/types'

type PropType = {
  shippingAddress: ShippingAddressType
}
const props = defineProps<PropType>()
const { t } = useI18n()
</script>

<template>
  <InnerCard :title="t('rinkLines.deliveryAddress')">
    <DetailGrid>
      <div>{{ t('rinkLines.shippingPostalCode') }}</div>
      <div>{{ shippingAddress.shippingPostalCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('rinkLines.shippingPrefecture') }}</div>
      <div>{{ shippingAddress.shippingPrefecture }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('rinkLines.shippingCity') }}</div>
      <div>{{ shippingAddress.shippingCity }}</div>
    </DetailGrid>
    <DetailGrid v-if="props.shippingAddress.shippingCityAdditionalInfo">
      <div>{{ t('rinkLines.shippingCityAdditionalInfo') }}</div>
      <div>{{ shippingAddress.shippingCityAdditionalInfo }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('rinkLines.shippingAddressBlock') }}</div>
      <div>{{ shippingAddress.shippingAddressBlock }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('rinkLines.shippingAddressNumber') }}</div>
      <div>{{ shippingAddress.shippingAddressNumber }}</div>
    </DetailGrid>
    <DetailGrid v-if="props.shippingAddress.shippingBuilding">
      <div>{{ t('rinkLines.shippingBuilding') }}</div>
      <div>{{ shippingAddress.shippingBuilding }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('rinkLines.packageRecipient') }}</div>
      <div>{{ shippingAddress.packageRecipient }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('rinkLines.phoneNumber') }}</div>
      <div>{{ shippingAddress.phoneNumber }}</div>
    </DetailGrid>
  </InnerCard>
</template>
