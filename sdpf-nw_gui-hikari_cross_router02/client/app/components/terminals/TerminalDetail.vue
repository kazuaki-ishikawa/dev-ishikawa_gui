<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TerminalDeviceTypes } from '@/api/constants'
import type { BreakOutResponse } from '@/api/breakOut/types'
import { NetworkTypes, TERMINAL_LINK } from '@/api/terminals/constants'
import type { TerminalResponse, TerminalLanStaticRoutesInputType, TerminalLansInputType } from '@/api/terminals/types'

type PropType = {
  terminal: TerminalResponse | null
  tenantId: string
  lans: TerminalLansInputType[]
  lanStaticRoutes: TerminalLanStaticRoutesInputType[]
  isTerminated: boolean
  breakOutListOptions: Array<{ text: string; value: string; breakOut?: BreakOutResponse }>
  isOrder?: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const {
  getLanTypeText,
  getNetworkTypeText,
  getWanDefaultGatewayVpnRoutingText,
  getCustomerReceiptRequiredText,
  getCallDetailDesiredText,
  getCallDetailBreakdownText,
  getMobileRatText,
  primaryCircuitTypeOptions,
} = useTerminalInput()

const currentBreakOut = ref<BreakOutResponse>()
const openBreakoutDialog = (breakOut?: BreakOutResponse) => {
  currentBreakOut.value = breakOut
}

const isRouter02 = computed(() => props.terminal?.terminalDeviceType === TerminalDeviceTypes.Router02)

const guaranteeIdLink = computed(() =>
  props.terminal?.guarantee?.guaranteeId
    ? `/tenants/${props.tenantId}/guarantees/circuits/${props.terminal.guarantee?.guaranteeId}`
    : '',
)
const ipoeIdLink = computed(() =>
  props.terminal?.ipoeId ? `/tenants/${props.tenantId}/ipoes/${props.terminal.ipoeId}` : '',
)
const vpnIdLink = computed(() =>
  props.terminal?.vpnId ? `/tenants/${props.tenantId}/vpns/${props.terminal.vpnId}` : '',
)

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
      vlan: `${props.terminal?.guarantee?.internet?.act?.vlan ?? '-'}`,
      peConnectedIPv4Address: props.terminal?.guarantee?.internet?.act?.peConnectedIPv4Address ?? '-',
      cpeConnectedIpv4Address: props.terminal?.guarantee?.internet?.act?.cpeConnectedIpv4Address ?? '-',
    },
    {
      label: t('terminals.internetSby'),
      vlan: `${props.terminal?.guarantee?.internet?.sby?.vlan ?? '-'}`,
      peConnectedIPv4Address: props.terminal?.guarantee?.internet?.sby?.peConnectedIPv4Address ?? '-',
      cpeConnectedIpv4Address: props.terminal?.guarantee?.internet?.sby?.cpeConnectedIpv4Address ?? '-',
    },
    {
      label: t('terminals.vpnAct'),
      vlan: `${props.terminal?.guarantee?.vpn?.act?.vlan ?? '-'}`,
      peConnectedIPv4Address: props.terminal?.guarantee?.vpn?.act?.peConnectedIPv4Address ?? '-',
      cpeConnectedIpv4Address: props.terminal?.guarantee?.vpn?.act?.cpeConnectedIpv4Address ?? '-',
    },
    {
      label: t('terminals.vpnSby'),
      vlan: `${props.terminal?.guarantee?.vpn?.sby?.vlan ?? '-'}`,
      peConnectedIPv4Address: props.terminal?.guarantee?.vpn?.sby?.peConnectedIPv4Address ?? '-',
      cpeConnectedIpv4Address: props.terminal?.guarantee?.vpn?.sby?.cpeConnectedIpv4Address ?? '-',
    },
  ]

  return { headers, items }
})

const primaryCircuitTypeText = computed(() => {
  const found = primaryCircuitTypeOptions.find(option => option.value === props.terminal?.primaryCircuit.circuitType)
  return found?.text ?? ''
})
const secondaryCircuitTypeText = computed(() => {
  const found = primaryCircuitTypeOptions.find(option => option.value === props.terminal?.secondaryCircuit?.circuitType)
  return found?.text ?? ''
})

const filters = computed(() => ({
  vpnInFilters: {
    defaultPolicy: props.terminal?.vpnInFilters?.defaultPolicy ?? '',
    accessControlList: props.terminal?.vpnInFilters?.accessControlList ?? [],
  },
  vpnOutFilters: {
    defaultPolicy: props.terminal?.vpnOutFilters?.defaultPolicy ?? '',
    accessControlList: props.terminal?.vpnOutFilters?.accessControlList ?? [],
  },
  inet4OutFilters: {
    defaultPolicy: props.terminal?.inet4OutFilters?.defaultPolicy ?? '',
    accessControlList: props.terminal?.inet4OutFilters?.accessControlList ?? [],
  },
}))

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: props.terminal?.orderId }))
</script>

<template>
  <div>
    <!-- 端末基本設定 -->
    <InnerCard :title="t('terminals.basicConfiguration')">
      <DetailGrid>
        <div>{{ t('terminals.terminalId') }}</div>
        <div>{{ terminal?.terminalId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.name') }}</div>
        <div>{{ terminal?.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.primaryCircuitType') }}</div>
        <div>{{ primaryCircuitTypeText }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.secondaryCircuitType') }}</div>
        <div>{{ secondaryCircuitTypeText }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>SIM</div>
        <div>{{ terminal?.mobileId ? t('terminals.withSim') : t('terminals.withoutSim') }}</div>
      </DetailGrid>
      <DetailGrid v-if="terminal?.mobile">
        <div>{{ t('terminals.msisdn') }}</div>
        <div>{{ terminal?.mobile.msisdn ?? '' }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.installationPostalCode') }}</div>
        <div>{{ terminal?.installationPostalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.installationAddress') }}</div>
        <div>{{ terminal?.installationAddress }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ terminal?.resourceStatus }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink class="cursor-pointer" :to="orderIdLink"> {{ terminal?.orderId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid v-if="terminal?.orderStatus && !isOrder">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[terminal.orderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div>{{ formatDateTime(terminal?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div>{{ formatDateTime(terminal?.updateTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.serviceStartTime') }}</div>
        <div>{{ formatDateTime(terminal?.serviceStartTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- リソース設定 -->
    <InnerCard :title="t('terminals.resourceSettings')">
      <DetailGrid>
        <div>{{ t('terminals.guaranteeId') }}</div>
        <NuxtLink class="cursor-pointer" :to="guaranteeIdLink">
          {{ terminal?.guarantee?.guaranteeId }}
        </NuxtLink>
      </DetailGrid>
      <div v-if="!!terminal?.guarantee" class="pl-5 mb-3">
        <!-- インターネット -->
        <div class="mt-2 text-secondary text-lg">{{ t('terminals.internet') }}</div>
        <DetailGrid :label-width="271">
          <div>{{ t('terminals.globalIpAddress') }}</div>
          <div>{{ terminal.guarantee.internet?.globalIpAddress }}</div>
        </DetailGrid>
        <!-- VPN -->
        <div class="mt-2 text-secondary text-lg">{{ t('terminals.vpn') }}</div>
        <DetailGrid :label-width="271">
          <div>{{ t('terminals.connectionAddressAct') }}</div>
          <div>{{ terminal.guarantee.vpn?.act.connectedIpv4Prefix }}</div>
        </DetailGrid>
        <DetailGrid :label-width="271">
          <div>{{ t('terminals.connectionAddressSby') }}</div>
          <div>{{ terminal.guarantee.vpn?.sby.connectedIpv4Prefix }}</div>
        </DetailGrid>
        <div class="my-2 text-secondary text-lg">{{ t('terminals.conncetionAddressInformation') }}</div>
        <SeparatedTable :headers="conncetionAddressInformation.headers" :items="conncetionAddressInformation.items" />
      </div>
      <DetailGrid>
        <div>{{ t('terminals.ipoeId') }}</div>
        <NuxtLink class="cursor-pointer" :to="ipoeIdLink">{{ terminal?.ipoeId }}</NuxtLink>
      </DetailGrid>
      <div v-if="!!terminal?.ipoeId" class="pl-5">
        <!-- インターネット -->
        <div class="mt-2 text-secondary text-lg">{{ t('terminals.internet') }}</div>
        <DetailGrid :label-width="271">
          <div>{{ t('terminals.ipoeIpv4Address') }}</div>
          <div>{{ terminal?.ipoeIpv4Address }}</div>
        </DetailGrid>
        <div />
      </div>
      <DetailGrid>
        <div>{{ t('terminals.mobileId') }}</div>
        <div>{{ terminal?.mobile?.mobileId }}</div>
      </DetailGrid>
      <div v-if="!!terminal?.mobile" class="pl-5">
        <!-- インターネット -->
        <div class="mt-2 text-secondary text-lg">{{ t('terminals.internet') }}</div>
        <DetailGrid :label-width="271">
          <div class="flex-flex-start-center mr-5">
            <div class="text-pre-wrap">{{ t('terminals.globalIpv4Address') }}</div>
            <HelpTooltip class="px-2 pt-1" size="smallMiddle">
              <i18n-t keypath="terminals.help.globalIpv4Address" scope="global" tag="span">
                <template #linkText>
                  <NuxtLink :to="TERMINAL_LINK.TICKET" target="_blank">
                    {{ t('common.here') }}
                  </NuxtLink>
                </template>
              </i18n-t>
            </HelpTooltip>
          </div>
          <div>{{ terminal?.mobile.ipv4Address }}</div>
        </DetailGrid>
        <DetailGrid :label-width="271">
          <div class="text-pre-wrap">{{ t('terminals.assignedIpv4Addresses') }}</div>
          <div>{{ terminal?.mobile.assignedIpv4Addresses?.join(' , ') }}</div>
        </DetailGrid>
        <div />
      </div>
      <DetailGrid>
        <div>{{ t('terminals.vpnId') }}</div>
        <NuxtLink v-if="vpnIdLink" class="cursor-pointer" :to="vpnIdLink">{{ terminal?.vpnId }}</NuxtLink>
        <div v-else>{{ t('vpn.unselected') }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- 廃止申し込み情報 -->
    <InnerCard v-if="isTerminated" :title="t('terminals.removalInformation')">
      <DetailGrid>
        <div>{{ t('terminals.removalName') }}</div>
        <div>{{ terminal?.removalName }}</div>
      </DetailGrid>
      <DetailGrid v-if="terminal?.removalCompanyName">
        <div>{{ t('terminals.removalCompanyName') }}</div>
        <div>{{ terminal?.removalCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalDepartmentName') }}</div>
        <div>{{ terminal?.removalDepartmentName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalPostalCode') }}</div>
        <div>{{ terminal?.removalPostalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalAddress') }}</div>
        <div>{{ terminal?.removalAddress }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalAddressKana') }}</div>
        <div>{{ terminal?.removalAddressKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalPhoneNumber') }}</div>
        <div>{{ terminal?.removalPhoneNumber }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- ルーター情報 -->
    <TerminalDevices :terminal="terminal" />

    <!-- ネットワーク設定 -->
    <InnerCard :title="t('terminals.networkSettings')">
      <div class="mt-3 text-secondary text-lg">{{ t('terminals.basicSettings') }}</div>
      <!-- Loopbackアドレス -->
      <DetailGrid>
        <div>{{ t('terminals.loopbackIpv4Address') }}</div>
        <div>{{ terminal?.loopbackIpv4Address }}</div>
      </DetailGrid>
      <!-- LANタイプ -->
      <DetailGrid>
        <div>{{ t('terminals.lanType') }}</div>
        <div>{{ getLanTypeText(terminal?.lanType) }}</div>
      </DetailGrid>
      <!-- 直下セグメント -->
      <div class="mt-3">{{ t('terminals.lans') }}</div>
      <EditLans
        v-if="terminal?.lanType"
        disabled
        :lan-type="terminal.lanType"
        :values="lans"
        :hide-lan-in-filters="isRouter02"
        data-cy="terminal-detail-lans"
      />
      <!-- デフォルトルート設定 -->
      <div class="text-secondary text-lg pt-5">{{ t('terminals.wanDefaultGateWay') }}</div>
      <DetailGrid>
        <div>{{ t('terminals.nexthopNetwork') }}</div>
        <div>{{ getNetworkTypeText(terminal?.defaultGateway?.nexthopNetwork) }}</div>
      </DetailGrid>
      <template v-if="terminal?.defaultGateway?.nexthopNetwork === NetworkTypes.Lan">
        <DetailGrid>
          <div>{{ t('terminals.nexthopIpv4AddressDefaultGateway') }}</div>
          <div>{{ terminal?.defaultGateway?.nexthopIpv4Address }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.defaultRouteWithinVpn') }}</div>
          <div>{{ getWanDefaultGatewayVpnRoutingText(terminal?.defaultGateway?.vpnRouting) }}</div>
        </DetailGrid>
      </template>
      <template v-if="terminal?.defaultGateway?.nexthopNetwork === NetworkTypes.Vpn">
        <DetailGrid>
          <div>{{ t('terminals.breakOut') }}</div>
          <div v-if="breakOutListOptions.length > 0" class="align-start-important flex-column">
            <div
              v-for="option in breakOutListOptions"
              :key="option.value"
              :class="{
                'text-decoration-underline': !!option.breakOut,
                'text-secondary': !!option.breakOut,
                'cursor-pointer': !!option.breakOut,
              }"
              @click.stop="openBreakoutDialog(option.breakOut)"
            >
              {{ option.text }}
            </div>
          </div>
          <div v-else>{{ t('breakOut.unselected') }}</div>
        </DetailGrid>
        <DetailGrid v-if="breakOutListOptions.length > 0">
          <div>{{ t('terminals.breakOutDnsServers') }}</div>
          <div class="align-start-important flex-column">
            <div
              v-for="(value, index) in terminal.interceptDnsServers ?? terminal.breakOutDnsServers"
              :key="`break-oout-dns-servers-${index}`"
            >
              {{ value }}
            </div>
          </div>
        </DetailGrid>
      </template>
    </InnerCard>

    <!-- フロー可視化 -->
    <EditTrafficReportFlowAnalyzer
      :initial-traffic-report-flow-analyzer="terminal?.trafficReportFlowAnalyzer"
      :primary-circuit-type="props.terminal?.primaryCircuit.circuitType ?? ''"
    />

    <!-- セキュリティオプション -->
    <EditSecurityOptions
      :threat-detection="terminal?.threatDetection"
      :flow-collector="terminal?.flowCollector"
      :behavior-detection="terminal?.behaviorDetection"
    />

    <!-- 端末詳細設定 -->
    <CollapseCard :title="t('terminals.detailSettings')" default-open>
      <!-- 拠点内セグメント（非直下セグメント） -->
      <div class="collapse-title text-secondary text-lg">{{ t('terminals.lanStaticRoutes') }}</div>
      <EditLanStaticRoutes disabled :values="lanStaticRoutes" />

      <!-- WAN向けスタティックルート設定 -->
      <div class="collapse-title mt-5 text-secondary text-lg">{{ t('terminals.wanStaticRoutes') }}</div>
      <EditWanStaticRoutes disabled :values="terminal?.wanStaticRoutes ?? []" />

      <!-- WANポートフィルタ（VPN → 拠点） -->
      <div class="collapse-title mt-5 text-secondary text-lg">{{ t('terminals.vpnInFilters') }}</div>
      <EditFilters :model-value="filters.vpnInFilters" :editable="false" />

      <!-- WANポートフィルタ（拠点 → VPN） -->
      <div class="collapse-title mt-5 text-secondary text-lg">{{ t('terminals.vpnOutFilters') }}</div>
      <EditFilters :model-value="filters.vpnOutFilters" :editable="false" />

      <!-- WANポートフィルタ（拠点 → Internet） -->
      <div class="collapse-title mt-5 text-secondary text-lg">{{ t('terminals.inet4OutFilters') }}</div>
      <EditFilters :model-value="filters.inet4OutFilters" :editable="false" />

      <!-- DHCP Relay -->
      <template v-if="!!terminal?.dhcpRelayServers">
        <div class="collapse-title mt-5 text-secondary text-lg">{{ t('terminals.relay') }}</div>
        <DetailGrid>
          <div>{{ t('terminals.serverIpv4Address') }}</div>
          <div class="text-pre-wrap">
            {{ terminal.dhcpRelayServers.map(({ serverIpv4Address }) => serverIpv4Address).join('\n') }}
          </div>
        </DetailGrid>
      </template>
    </CollapseCard>

    <!-- 配送先情報 -->
    <InnerCard :title="t('terminals.deliveryInformation')">
      <DetailGrid>
        <div>{{ t('terminals.picName') }}</div>
        <div>{{ terminal?.deliveryName }}</div>
      </DetailGrid>
      <DetailGrid v-if="terminal?.deliveryCompanyName">
        <div>{{ t('terminals.deliveryCompanyName') }}</div>
        <div>{{ terminal?.deliveryCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.picDepartmentName') }}</div>
        <div>{{ terminal?.deliveryDepartmentName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.phoneNumber') }}</div>
        <div>{{ terminal?.deliveryPhoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.postalCode') }}</div>
        <div>{{ terminal?.deliveryPostalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.address') }}</div>
        <div>{{ terminal?.deliveryAddress }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.addressKana') }}</div>
        <div>{{ terminal?.deliveryAddressKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.deliveryDate') }}</div>
        <div>{{ terminal?.deliveryDate }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- モバイル申し込み情報 -->
    <InnerCard v-if="!!terminal?.mobile" :title="t('terminals.mobileInformation')">
      <DetailGrid>
        <div>{{ t('terminals.mobileRat') }}</div>
        <div>{{ getMobileRatText(terminal.mobile.rat) }}</div>
      </DetailGrid>

      <DetailGrid>
        <div>{{ t('terminals.picName') }}</div>
        <div>{{ terminal.mobile.picName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.picNameKana') }}</div>
        <div>{{ terminal.mobile.picNameKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.picPhoneNumber') }}</div>
        <div>{{ terminal.mobile.picPhoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.customerReceiptRequired') }}</div>
        <div>{{ getCustomerReceiptRequiredText(terminal.mobile.customerReceiptRequired) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.callDetailDesired') }}</div>
        <div>{{ getCallDetailDesiredText(terminal.mobile.callDetailDesired) }}</div>
      </DetailGrid>
      <template v-if="terminal.mobile.callDetailDesired">
        <DetailGrid>
          <div>{{ t('terminals.callDetailBreakdownSetting') }}</div>
          <div>{{ getCallDetailBreakdownText(terminal.mobile.callDetailBreakdownSetting) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.callDetailDestinationNumberSetting') }}</div>
          <div>{{ getCallDetailBreakdownText(terminal.mobile.callDetailDestinationNumberSetting) }}</div>
        </DetailGrid>
      </template>
    </InnerCard>

    <!-- ブレイクアウトの詳細表示ダイアログ -->
    <BreakOutDetailDialog :break-out="currentBreakOut" @close="() => (currentBreakOut = undefined)" />
  </div>
</template>

<style scoped lang="scss">
.align-start-important {
  align-items: flex-start !important;
}
.collapse-title {
  padding-top: 0.75rem;
  padding-bottom: 0.25rem;
}
.ranges {
  display: grid;
  grid-template-columns: 50px minmax(130px, 0.5fr) 50px minmax(130px, 0.5fr);
  gap: 0.5rem;
}
</style>
