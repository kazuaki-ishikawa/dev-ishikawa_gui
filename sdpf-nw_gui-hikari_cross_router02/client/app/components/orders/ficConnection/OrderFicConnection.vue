<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { FicConnectionPostRequest, FicConnectionPutRequest } from '@/api/ficConnections/types'

type PropType = {
  request: FicConnectionPostRequest | FicConnectionPutRequest
}
defineProps<PropType>()
const { t } = useI18n()
const { getRouteAdvertisementText } = useFicConnections()
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <DetailGrid>
      <div>{{ t('fic.customerNote') }}</div>
      <div>{{ request?.customerNote }}</div>
    </DetailGrid>
    <DetailGrid v-if="'vpnId' in request">
      <div>VPN ID</div>
      <div>{{ request?.vpnId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('fic.routeAdvertisement') }}</div>
      <div>{{ getRouteAdvertisementText(request?.routeAdvertisement) }}</div>
    </DetailGrid>
    <DetailGrid v-if="'ficPremium' in request">
      <div>{{ t('fic.ficPremium') }}</div>
      <div>{{ request?.ficPremium ? t('common.use') : t('common.disuse') }}</div>
    </DetailGrid>
  </InnerCard>
</template>
