<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FicConnectionResponse } from '@/api/ficConnections/types'
import { RouteName } from '@/route/constants'

type PropType = {
  ficConnection: FicConnectionResponse | null
}

defineProps<PropType>()

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const { t } = useI18n()
</script>

<template>
  <NovaDetailGrid :label="t('nova.fic.customerNote')">
    {{ ficConnection?.customerNote }}
  </NovaDetailGrid>
  <NovaDetailGrid label="VPN ID">
    <NuxtLink
      v-if="ficConnection?.vpnId"
      :to="{ name: RouteName.Vpn.Detail, params: { tenantId, id: ficConnection.vpnId } }"
    >
      {{ ficConnection.vpnId }}
    </NuxtLink>
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.fic.routeAdvertisement')">
    {{ ficConnection?.routeAdvertisement ? t(`nova.fic.${ficConnection.routeAdvertisement}`) : '' }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.fic.ficPremium')">
    {{ ficConnection?.ficPremium ? t('nova.common.use') : t('nova.common.disuse') }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.fic.referenceFicConnectionId')">
    {{ ficConnection?.referenceFicConnectionId }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.fic.publicServiceKey')">
    <span class="break-all">{{ ficConnection?.publicServiceKey }}</span>
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.fic.bandwidth')">
    {{ ficConnection?.bandwidth }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.resourceStatus')">
    {{ ficConnection?.resourceStatus }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.orderId')">
    <NuxtLink
      v-if="ficConnection?.orderId"
      :to="{ name: RouteName.Order.Detail, params: { tenantId, id: ficConnection.orderId } }"
    >
      {{ ficConnection.orderId }}
    </NuxtLink>
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.creationTime')">
    {{ formatDateTime(ficConnection?.creationTime) }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.updateTime')">
    {{ formatDateTime(ficConnection?.updateTime) }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.serviceStartTime')">
    {{ formatDateTime(ficConnection?.serviceStartTime) }}
  </NovaDetailGrid>
</template>

<style lang="scss" scoped>
.break-all {
  word-break: break-all;
}
</style>
