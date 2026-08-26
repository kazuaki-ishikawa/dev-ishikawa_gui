<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RinkConnectionTypes } from '@/api/rinkConnections/constants'
import type { RinkConnectionResponse, RinkConnectionCustomLocalBreakOutType } from '@/api/rinkConnections/types'

type PropType = {
  rinkConnection: RinkConnectionResponse
  customLocalBreakOutList: RinkConnectionCustomLocalBreakOutType[]
}
const props = defineProps<PropType>()

const route = useRoute()
const { t } = useI18n()
const { rinkConnectionTypeTranslation, getBreakOutText, getUseableText } = useRinkConnections()

const isVpnOnly = computed(() => props.rinkConnection.connectionType === RinkConnectionTypes.VpnOnly)
const isInternetVpn = computed(() => props.rinkConnection.connectionType === RinkConnectionTypes.InternetVpn)
const isVpnBreakOut = computed(() => props.rinkConnection.connectionType === RinkConnectionTypes.VpnBreakOut)
const requiredVpnId = computed(() => isVpnOnly.value || isInternetVpn.value || isVpnBreakOut.value)

const vpnIdLink = computed(() =>
  props.rinkConnection.vpnId ? `/tenants/${route.params.tenantId}/vpns/${props.rinkConnection.vpnId}` : '',
)
</script>

<template>
  <div>
    <InnerCard :title="t('rinkConnections.basicInformation')">
      <DetailGrid>
        <div>{{ t('rinkConnections.connectionType') }}</div>
        <div data-cy="rink-connection-detail-connection-type">
          {{ rinkConnectionTypeTranslation[rinkConnection.connectionType] }}
        </div>
      </DetailGrid>
      <DetailGrid v-if="requiredVpnId">
        <div>{{ t('rinkConnections.vpnId') }}</div>
        <NuxtLink :to="vpnIdLink" data-cy="rink-connection-detail-vpn-id">{{ rinkConnection.vpnId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('rinkConnections.apn') }}</div>
        <div data-cy="rink-connection-detail-apn">{{ rinkConnection.apn }}</div>
      </DetailGrid>

      <!-- ブレイクアウト -->
      <slot name="breakOut" />
      <template v-if="isVpnBreakOut && !$slots.breakOut">
        <DetailGrid>
          <div>{{ t('rinkConnections.breakOut') }}</div>
          <div class="align-start-important flex-column" data-cy="rink-connection-detail-break-out">
            <div v-for="{ name } in rinkConnection.systemLocalBreakOutList" :key="name">
              {{ getBreakOutText(name) }}
            </div>
          </div>
        </DetailGrid>
        <CustomLocalBreakOutListTable :custom-local-break-out-list="customLocalBreakOutList" />
      </template>
      <slot name="vpnConnectionPrefix" />
      <DetailGrid v-if="isInternetVpn && !$slots.vpnConnectionPrefix">
        <div>{{ t('rinkConnections.vpnConnectionPrefix') }}</div>
        <div class="align-start-important flex-column" data-cy="rink-connection-detail-vpn-connection-prefix">
          <div v-for="value in rinkConnection.vpnConnectionPrefix" :key="value">
            {{ value }}
          </div>
        </div>
      </DetailGrid>
      <slot name="dnsServer" />
      <template v-if="!$slots.dnsServer">
        <DetailGrid>
          <div>{{ t('rinkConnections.dnsIpAddressPrimary') }}</div>
          <div data-cy="rink-connection-detail-dns-ip-address-primary">{{ rinkConnection.dnsIpAddressPrimary }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('rinkConnections.dnsIpAddressSecondary') }}</div>
          <div data-cy="rink-connection-detail-dns-ip-address-secondary">
            {{ rinkConnection.dnsIpAddressSecondary }}
          </div>
        </DetailGrid>
      </template>
      <DetailGrid>
        <div>{{ t('rinkConnections.authDomainName') }}</div>
        <div data-cy="rink-connection-detail-auth-domain-name">{{ rinkConnection.authDomainName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('rinkConnections.poiRedundancy') }}</div>
        <div data-cy="rink-connection-detail-poi-redundancy">{{ getUseableText(!!rinkConnection.poiRedundancy) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('rinkConnections.lineActPrefix') }}</div>
        <div class="align-start-important flex-column" data-cy="rink-connection-detail-line-act-prefix">
          <div v-for="value in rinkConnection.lineActPrefix" :key="value">
            {{ value }}
          </div>
        </div>
      </DetailGrid>
      <DetailGrid v-if="!!rinkConnection.poiRedundancy">
        <div>{{ t('rinkConnections.lineSbyPrefix') }}</div>
        <div class="align-start-important flex-column" data-cy="rink-connection-detail-line-sby-prefix">
          <div v-for="value in rinkConnection.lineSbyPrefix" :key="value">
            {{ value }}
          </div>
        </div>
      </DetailGrid>

      <template v-if="requiredVpnId">
        <!-- VPN構内利用アドレス -->
        <DetailGrid>
          <div>{{ t('rinkConnections.vpnNetworkPrefix') }}</div>
          <div data-cy="rink-connection-detail-vpn-network-prefix">{{ rinkConnection.vpnNetworkPrefix }}</div>
        </DetailGrid>
      </template>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div data-cy="rink-connection-detail-created-at">{{ formatDateTime(rinkConnection.createdAt) }}</div>
      </DetailGrid>
      <DetailGrid v-if="rinkConnection.deletedAt">
        <div>{{ t('details.serviceEndTime') }}</div>
        <div>{{ formatDateTime(rinkConnection.deletedAt) }}</div>
      </DetailGrid>
    </InnerCard>
  </div>
</template>

<style lang="scss" scoped>
.align-start-important {
  align-items: flex-start !important;
}
</style>
