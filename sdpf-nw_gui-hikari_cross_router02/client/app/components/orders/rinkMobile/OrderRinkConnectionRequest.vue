<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OrderRinkConnectionRequest } from '@/api/rinkConnections/types'
import { TenantPages } from '@/components/sidebar/constants'

type PropType = {
  request: OrderRinkConnectionRequest
}
const props = defineProps<PropType>()

const route = useRoute()
const { t } = useI18n()
const { rinkConnectionTypeTranslation, getBreakOutText, getUseableText } = useRinkConnections()

const vpnId = computed(() => props.request.vpnId)
const customLocalBreakOutList = computed(() =>
  props.request.orderDetailCustomLocalBreakOutList?.map(breakOut => ({
    name: breakOut.name,
    nameAlias: breakOut.nameAlias,
    dstPrefixList: breakOut.dstPrefixList?.map(prefix => ({ prefix })) ?? [],
    fqdnList: breakOut.fqdnList?.map(fqdn => ({ fqdn })) ?? [],
  })),
)

const dnsIpAddressPrimary = computed(() => {
  if ('dnsIpAddressPrimary' in props.request) {
    return props.request.dnsIpAddressPrimary
  }
  if ('deleteColumns' in props.request && props.request.deleteColumns?.includes('dnsIpAddressPrimary')) {
    return t('orders.none')
  }
  return undefined
})
const dnsIpAddressSecondary = computed(() => {
  if ('dnsIpAddressSecondary' in props.request) {
    return props.request.dnsIpAddressSecondary
  }
  if ('deleteColumns' in props.request && props.request.deleteColumns?.includes('dnsIpAddressSecondary')) {
    return t('orders.none')
  }
  return undefined
})
</script>

<template>
  <div>
    <DetailGrid v-if="request.connectionType">
      <div>{{ t('rinkConnections.connectionType') }}</div>
      <div>{{ rinkConnectionTypeTranslation[request.connectionType] }}</div>
    </DetailGrid>
    <DetailGrid v-if="vpnId">
      <div>{{ t('rinkConnections.vpnId') }}</div>
      <NuxtLink :to="`/tenants/${route.params.tenantId}/${TenantPages.Vpns}/${vpnId}`">{{ vpnId }}</NuxtLink>
    </DetailGrid>

    <!-- ブレイクアウト -->
    <DetailGrid v-if="request.systemLocalBreakOutList">
      <div>{{ t('rinkConnections.breakOut') }}</div>
      <div class="align-start-important flex-column">
        <div v-for="{ name } in request.systemLocalBreakOutList" :key="name">
          {{ getBreakOutText(name) }}
        </div>
      </div>
    </DetailGrid>
    <CustomLocalBreakOutListTable
      v-if="customLocalBreakOutList"
      :custom-local-break-out-list="customLocalBreakOutList"
    />

    <!-- VPN接続通信アドレス -->
    <DetailGrid v-if="request.vpnConnectionPrefix">
      <div>{{ t('rinkConnections.vpnConnectionPrefix') }}</div>
      <div class="align-start-important flex-column">
        <div v-for="value in request.vpnConnectionPrefix" :key="value">
          {{ value }}
        </div>
      </div>
    </DetailGrid>
    <DetailGrid v-if="dnsIpAddressPrimary">
      <div>{{ t('rinkConnections.dnsIpAddressPrimary') }}</div>
      <div>{{ dnsIpAddressPrimary }}</div>
    </DetailGrid>
    <DetailGrid v-if="dnsIpAddressSecondary">
      <div>{{ t('rinkConnections.dnsIpAddressSecondary') }}</div>
      <div>{{ dnsIpAddressSecondary }}</div>
    </DetailGrid>
    <DetailGrid v-if="'authDomainName' in request">
      <div>{{ t('rinkConnections.authDomainName') }}</div>
      <div>{{ request.authDomainName }}</div>
    </DetailGrid>
    <DetailGrid v-if="typeof request.poiRedundancy === 'boolean'">
      <div>{{ t('rinkConnections.poiRedundancy') }}</div>
      <div>{{ getUseableText(request.poiRedundancy) }}</div>
    </DetailGrid>
    <DetailGrid v-if="'lineActPrefix' in request">
      <div>{{ t('rinkConnections.lineActPrefix') }}</div>
      <div class="align-start-important flex-column">
        <div v-for="value in request.lineActPrefix" :key="value">
          {{ value }}
        </div>
      </div>
    </DetailGrid>
    <DetailGrid v-if="'lineSbyPrefix' in request">
      <div>{{ t('rinkConnections.lineSbyPrefix') }}</div>
      <div class="align-start-important flex-column">
        <div v-for="value in request.lineSbyPrefix" :key="value">
          {{ value }}
        </div>
      </div>
    </DetailGrid>

    <!-- VPN構内利用アドレス -->
    <DetailGrid v-if="'vpnNetworkPrefix' in request">
      <div>{{ t('rinkConnections.vpnNetworkPrefix') }}</div>
      <div>{{ request.vpnNetworkPrefix }}</div>
    </DetailGrid>
  </div>
</template>

<style lang="scss" scoped>
.align-start-important {
  align-items: flex-start !important;
}
</style>
