<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { VpnResponse } from '@/api/vpns/types'

type PropType = {
  vpn: VpnResponse | null
  tenantId: string
  isOrder?: boolean
}
const props = defineProps<PropType>()
const { t } = useI18n()

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: props.vpn?.orderId }))
</script>

<template>
  <div>
    <DetailGrid>
      <div>{{ t('vpn.name') }}</div>
      <div>{{ vpn?.customerNote }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('vpn.internalAddress') }}</div>
      <div>{{ vpn?.internalAddress }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.resourceStatus') }}</div>
      <div>{{ vpn?.resourceStatus }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.orderId') }}</div>
      <NuxtLink class="cursor-pointer" :to="orderIdLink"> {{ vpn?.orderId }}</NuxtLink>
    </DetailGrid>
    <DetailGrid v-if="vpn?.orderStatus && !isOrder">
      <div>{{ t('details.orderStatus') }}</div>
      <div>{{ orderStatusTypeTranslation[vpn.orderStatus] }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.creationTime') }}</div>
      <div>{{ formatDateTime(vpn?.creationTime) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.updateTime') }}</div>
      <div>{{ formatDateTime(vpn?.updateTime) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.serviceStartTime') }}</div>
      <div>{{ formatDateTime(vpn?.serviceStartTime) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('vpn.routeCount') }}</div>
      <div>{{ vpn?.routeCount }}</div>
    </DetailGrid>
  </div>
</template>
