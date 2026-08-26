<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { MobilePutRequest } from '@/api/mobile/types'

type PropType = {
  request: MobilePutRequest
}
defineProps<PropType>()
const { t } = useI18n()
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <DetailGrid>
      <div>{{ t('mobile.mobileDiscountCode') }}</div>
      <div>{{ request.mobileDiscountCode }}</div>
    </DetailGrid>
  </InnerCard>
</template>
