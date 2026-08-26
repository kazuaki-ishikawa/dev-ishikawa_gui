<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { VpnResponse } from '@/api/vpns/types'
import { RouteName } from '@/route/constants'

type PropType = {
  vpn: VpnResponse | null
  isOrder?: boolean
}
defineProps<PropType>()

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const { t } = useI18n()

const { orderStatusTypeTranslation } = useOrders()
</script>

<template>
  <NovaDetailGrid :label="t('nova.vpn.vpnId')">
    <NuxtLink v-if="vpn?.vpnId" :to="{ name: RouteName.Vpn.Detail, params: { tenantId, id: vpn.vpnId } }">
      {{ vpn.vpnId }}
    </NuxtLink>
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.vpn.name')">
    {{ vpn?.customerNote }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.vpn.internalAddress')">
    {{ vpn?.internalAddress }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.resourceStatus')">
    {{ vpn?.resourceStatus }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.orderId')">
    <NuxtLink v-if="vpn?.orderId" :to="{ name: RouteName.Order.Detail, params: { tenantId, id: vpn.orderId } }">
      {{ vpn.orderId }}
    </NuxtLink>
  </NovaDetailGrid>
  <NovaDetailGrid v-if="vpn?.orderStatus && !isOrder" :label="t('nova.details.orderStatus')">
    {{ orderStatusTypeTranslation[vpn.orderStatus] }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.creationTime')">
    {{ formatDateTime(vpn?.creationTime) }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.updateTime')">
    {{ formatDateTime(vpn?.updateTime) }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.serviceStartTime')">
    {{ formatDateTime(vpn?.serviceStartTime) }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.vpn.routeCount')">
    {{ vpn?.routeCount }}
  </NovaDetailGrid>
</template>
