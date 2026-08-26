<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MobileResponse } from '@/api/mobile/types'

type PropType = {
  mobile: MobileResponse | null
  tenantId: string
}
const props = defineProps<PropType>()
const { t } = useI18n()
const { getOrderIdLink } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: props.mobile?.orderId }))
</script>

<template>
  <div>
    <DetailGrid>
      <div>{{ t('details.orderId') }}</div>
      <NuxtLink :to="orderIdLink"> {{ mobile?.orderId }}</NuxtLink>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('mobile.mobileDiscountCode') }}</div>
      <div>{{ mobile?.mobileDiscountCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('mobile.mobileTermsOfServiceAccepted') }}</div>
      <div>{{ mobile?.mobileTermsOfServiceAccepted ? t('terms.agreed') : t('terms.disagreed') }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('mobile.mobileRepresentativeNumber') }}</div>
      <div>{{ mobile?.mobileRepresentativeNumber }}</div>
    </DetailGrid>
  </div>
</template>
