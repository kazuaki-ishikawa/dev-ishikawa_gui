<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SelfTerminalResponse } from '@/api/selfTerminals/types'
import { CircuitTypes } from '@/api/constants'

type PropType = {
  selfTerminal: SelfTerminalResponse | null
  tenantId: string
  isOrder?: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { primaryCircuitTypeOptions } = useTerminalInput()
const { getVpnRouteLimitText } = useSelfTerminals()

const guaranteeIdLink = computed(() =>
  props.selfTerminal?.guarantee?.guaranteeId
    ? `/tenants/${props.tenantId}/guarantees/circuits/${props.selfTerminal.guarantee?.guaranteeId}`
    : '',
)
const vpnIdLink = computed(() =>
  props.selfTerminal?.vpnId ? `/tenants/${props.tenantId}/vpns/${props.selfTerminal.vpnId}` : '',
)
const vpnRouteLimitText = computed(() => getVpnRouteLimitText(props.selfTerminal?.vpnRouteLimit))

const conncetionAddressInformation = computed(() => {
  const headers = [
    { text: '', key: 'label' },
    { text: 'VLAN ID', key: 'vlan' },
    { text: t('terminals.peConnectedIPv4Address'), key: 'peConnectedIPv4Address' },
    { text: t('terminals.cpeConnectedIpv4Address'), key: 'cpeConnectedIpv4Address' },
  ]
  const items = [
    {
      label: t('terminals.internetAct'),
      vlan: `${props.selfTerminal?.guarantee?.internet?.act?.vlan ?? '-'}`,
      peConnectedIPv4Address: props.selfTerminal?.guarantee?.internet?.act?.peConnectedIPv4Address ?? '-',
      cpeConnectedIpv4Address: props.selfTerminal?.guarantee?.internet?.act?.cpeConnectedIpv4Address ?? '-',
    },
    {
      label: t('terminals.internetSby'),
      vlan: `${props.selfTerminal?.guarantee?.internet?.sby?.vlan ?? '-'}`,
      peConnectedIPv4Address: props.selfTerminal?.guarantee?.internet?.sby?.peConnectedIPv4Address ?? '-',
      cpeConnectedIpv4Address: props.selfTerminal?.guarantee?.internet?.sby?.cpeConnectedIpv4Address ?? '-',
    },
    {
      label: t('terminals.vpnAct'),
      vlan: `${props.selfTerminal?.guarantee?.vpn?.act?.vlan ?? '-'}`,
      peConnectedIPv4Address: props.selfTerminal?.guarantee?.vpn?.act?.peConnectedIPv4Address ?? '-',
      cpeConnectedIpv4Address: props.selfTerminal?.guarantee?.vpn?.act?.cpeConnectedIpv4Address ?? '-',
    },
    {
      label: t('terminals.vpnSby'),
      vlan: `${props.selfTerminal?.guarantee?.vpn?.sby?.vlan ?? '-'}`,
      peConnectedIPv4Address: props.selfTerminal?.guarantee?.vpn?.sby?.peConnectedIPv4Address ?? '-',
      cpeConnectedIpv4Address: props.selfTerminal?.guarantee?.vpn?.sby?.cpeConnectedIpv4Address ?? '-',
    },
  ]

  return { headers, items }
})

const primaryCircuitTypeText = computed(() => {
  const found = primaryCircuitTypeOptions.find(
    option => option.value === props.selfTerminal?.primaryCircuit.circuitType,
  )
  return found?.text ?? ''
})

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: props.selfTerminal?.orderId }))
</script>

<template>
  <div>
    <!-- 端末基本設定 -->
    <InnerCard :title="t('terminals.basicConfiguration')">
      <DetailGrid>
        <div>{{ t('terminals.terminalId') }}</div>
        <div>{{ selfTerminal?.terminalId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.name') }}</div>
        <div>{{ selfTerminal?.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.primaryCircuitType') }}</div>
        <div>{{ primaryCircuitTypeText }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.installationPostalCode') }}</div>
        <div>{{ selfTerminal?.installationPostalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.installationAddress') }}</div>
        <div>{{ selfTerminal?.installationAddress }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ selfTerminal?.resourceStatus }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink class="cursor-pointer" :to="orderIdLink"> {{ selfTerminal?.orderId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid v-if="selfTerminal?.orderStatus && !isOrder">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[selfTerminal.orderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div>{{ formatDateTime(selfTerminal?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div>{{ formatDateTime(selfTerminal?.updateTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.serviceStartTime') }}</div>
        <div>{{ formatDateTime(selfTerminal?.serviceStartTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- リソース設定 -->
    <InnerCard :title="t('terminals.resourceSettings')">
      <DetailGrid>
        <div>{{ t('terminals.guaranteeId') }}</div>
        <NuxtLink v-if="guaranteeIdLink" class="cursor-pointer" :to="guaranteeIdLink">
          {{ selfTerminal?.guarantee?.guaranteeId }}
        </NuxtLink>
        <div v-else>{{ selfTerminal?.guarantee?.guaranteeId }}</div>
      </DetailGrid>
      <div class="pl-5 mb-3">
        <!-- インターネット -->
        <DetailGrid :label-width="271" class="mt-2">
          <div class="text-secondary text-lg">{{ t('terminals.internet') }}</div>
          <div>{{ selfTerminal?.guarantee.internet?.advertise ? t('common.use') : t('common.disuse') }}</div>
        </DetailGrid>
        <div class="pl-5 mb-3">
          <DetailGrid :label-width="251">
            <div>{{ t('terminals.globalIpAddress') }}</div>
            <div>{{ selfTerminal?.guarantee?.internet?.globalIpAddress }}</div>
          </DetailGrid>
          <DetailGrid v-if="selfTerminal?.guarantee.internet?.advertise" :label-width="251">
            <div>{{ t('terminals.pingMonitoring') }}</div>
            <div>{{ selfTerminal?.guarantee?.internet?.pingMonitoring ? t('common.use') : t('common.disuse') }}</div>
            <template #footer>
              <div v-if="selfTerminal?.guarantee?.internet?.pingMonitoring" class="text-sm text-error">
                <div>{{ t('selfTerminals.note.pingMonitoring.message-1') }}</div>
                <div class="mt-4">{{ t('selfTerminals.note.pingMonitoring.message-2') }}</div>
                <div class="ml-4">{{ t('selfTerminals.note.pingMonitoring.message-3') }}</div>
                <div class="ml-4">{{ t('selfTerminals.note.pingMonitoring.message-4') }}</div>
                <div class="mt-4">{{ t('selfTerminals.note.pingMonitoring.message-5') }}</div>
                <div class="ml-4">{{ t('selfTerminals.note.pingMonitoring.message-6') }}</div>
              </div>
            </template>
          </DetailGrid>
          <div><!-- Ping監視に border-bottom を表示するためのダミーの要素 --></div>
        </div>
        <!-- VPN -->
        <DetailGrid :label-width="271" class="mt-2">
          <div class="text-secondary text-lg">{{ t('terminals.vpn') }}</div>
          <div>{{ selfTerminal?.vpnId ? t('common.use') : t('common.disuse') }}</div>
        </DetailGrid>
        <div class="pl-5 mb-3">
          <DetailGrid :label-width="251">
            <div>{{ t('terminals.connectionAddressAct') }}</div>
            <div>{{ selfTerminal?.guarantee?.vpn?.act.connectedIpv4Prefix }}</div>
          </DetailGrid>
          <DetailGrid :label-width="251">
            <div>{{ t('terminals.connectionAddressSby') }}</div>
            <div>{{ selfTerminal?.guarantee?.vpn?.sby.connectedIpv4Prefix }}</div>
          </DetailGrid>
          <div><!-- 接続アドレス (Sby)に border-bottom を表示するためのダミーの要素 --></div>
        </div>
        <div class="my-2 text-secondary text-lg">{{ t('terminals.conncetionAddressInformation') }}</div>
        <SeparatedTable :headers="conncetionAddressInformation.headers" :items="conncetionAddressInformation.items" />
      </div>
      <DetailGrid>
        <div>{{ t('terminals.vpnId') }}</div>
        <NuxtLink v-if="vpnIdLink" class="cursor-pointer" :to="vpnIdLink">{{ selfTerminal?.vpnId }}</NuxtLink>
        <div v-else>{{ selfTerminal?.vpnId }}</div>
      </DetailGrid>
      <DetailGrid v-if="selfTerminal?.vpnId">
        <div>{{ t('terminals.vpnRouteLimit') }}</div>
        <div>{{ vpnRouteLimitText }}</div>
      </DetailGrid>
      <DetailGrid v-if="selfTerminal?.vpnId">
        <div>{{ t('terminals.vpnAdvertiseNetworks') }}</div>
        <div class="text-pre-wrap">{{ selfTerminal.vpnAdvertiseNetworks?.join('\n') }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.asNumber') }}</div>
        <div>{{ selfTerminal?.asNumber }}</div>
      </DetailGrid>
    </InnerCard>

    <EditTrafficReportFlowAnalyzer
      :primary-circuit-type="CircuitTypes.Guarantee"
      :initial-traffic-report-flow-analyzer="selfTerminal?.trafficReportFlowAnalyzer"
    />
    <EditSecurityOptions
      :threat-detection="selfTerminal?.threatDetection"
      :flow-collector="selfTerminal?.flowCollector"
      :behavior-detection="selfTerminal?.behaviorDetection"
    />
  </div>
</template>

<style scoped lang="scss">
.ranges {
  display: grid;
  grid-template-columns: 50px minmax(130px, 0.5fr) 50px minmax(130px, 0.5fr);
  gap: 0.5rem;
}
</style>
