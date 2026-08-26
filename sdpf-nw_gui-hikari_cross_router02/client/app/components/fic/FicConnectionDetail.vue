<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FicConnectionResponse } from '@/api/ficConnections/types'

type PropType = {
  ficConnection: FicConnectionResponse | null
  tenantId: string
  isOrder?: boolean
}
const props = defineProps<PropType>()
const { t } = useI18n()

const { getRouteAdvertisementText } = useFicConnections()
const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: props.ficConnection?.orderId }))
const vpnIdLink = computed(() =>
  props.ficConnection?.vpnId ? `/tenants/${props.tenantId}/vpns/${props.ficConnection.vpnId}` : '',
)
</script>

<template>
  <div>
    <DetailGrid>
      <div>{{ t('fic.customerNote') }}</div>
      <div>{{ ficConnection?.customerNote }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>VPN ID</div>
      <NuxtLink class="cursor-pointer" :to="vpnIdLink"> {{ ficConnection?.vpnId }}</NuxtLink>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('fic.routeAdvertisement') }}</div>
      <div>{{ getRouteAdvertisementText(ficConnection?.routeAdvertisement) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('fic.ficPremium') }}</div>
      <div>{{ ficConnection?.ficPremium ? t('common.use') : t('common.disuse') }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>
        <div class="flex-flex-start-center">
          {{ t('fic.referenceFicConnectionId') }}
          <HelpTooltip class="px-2 pt-1" v-bind="{ size: 'smallMiddle' }">
            {{ t('fic.help.referenceFicConnectionId') }}
          </HelpTooltip>
        </div>
      </div>
      <div>{{ ficConnection?.referenceFicConnectionId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('fic.publicServiceKey') }}</div>
      <div class="break-all">{{ ficConnection?.publicServiceKey }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('fic.bandwidth') }}</div>
      <div>{{ ficConnection?.bandwidth }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.resourceStatus') }}</div>
      <div>{{ ficConnection?.resourceStatus }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.orderId') }}</div>
      <NuxtLink class="cursor-pointer" :to="orderIdLink"> {{ ficConnection?.orderId }}</NuxtLink>
    </DetailGrid>
    <DetailGrid v-if="ficConnection?.orderStatus && !isOrder">
      <div>{{ t('details.orderStatus') }}</div>
      <div>{{ orderStatusTypeTranslation[ficConnection.orderStatus] }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.creationTime') }}</div>
      <div>{{ formatDateTime(ficConnection?.creationTime) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.updateTime') }}</div>
      <div>{{ formatDateTime(ficConnection?.updateTime) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.serviceStartTime') }}</div>
      <div>{{ formatDateTime(ficConnection?.serviceStartTime) }}</div>
    </DetailGrid>
  </div>
</template>

<style lang="scss" scoped>
.break-all {
  word-break: break-all;
}
</style>
