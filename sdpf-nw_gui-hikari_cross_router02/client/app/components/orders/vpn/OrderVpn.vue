<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { VpnPostRequest, VpnPutRequest } from '@/api/vpns/types'

type PropType = {
  request: VpnPostRequest | VpnPutRequest
}
defineProps<PropType>()
const { t } = useI18n()
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <DetailGrid>
      <div>{{ t('vpn.name') }}</div>
      <div>{{ request?.customerNote }}</div>
    </DetailGrid>
    <DetailGrid v-if="'internalAddress' in request">
      <div>{{ t('vpn.internalAddress') }}</div>
      <div>{{ request?.internalAddress }}</div>
    </DetailGrid>
  </InnerCard>
</template>
