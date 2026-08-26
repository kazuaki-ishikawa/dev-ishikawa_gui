<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { BreakOutResponse } from '@/api/breakOut/types'
import { TerminalDeviceTypes } from '@/api/constants'
import { OrderRequestTypes } from '@/api/orders/constants'
import type { OrderRequestType } from '@/api/orders/types'
import type { SelfTerminalPostRequest, SelfTerminalPutRequest } from '@/api/selfTerminals/types'
import {
  NetworkTypes,
  initialRemovalInputData,
  initialTerminalInputData,
  initialMobileInputData,
  LanTypes,
} from '@/api/terminals/constants'
import type {
  TerminalPostRequest,
  TerminalPutRequest,
  TerminalDeleteRequest,
  TerminalUserFilter,
  TerminalMobilePostRequest,
  TerminalMobilePutRequest,
  TerminalMobileDeleteRequest,
} from '@/api/terminals/types'
import { initialSelfTerminalInputData } from '@/api/selfTerminals/constants'

type PropType = {
  request:
    | TerminalPostRequest
    | TerminalPutRequest
    | TerminalDeleteRequest
    | SelfTerminalPostRequest
    | SelfTerminalPutRequest
  requestType: OrderRequestType
  breakOutList: BreakOutResponse[]
}
const props = defineProps<PropType>()
const { t } = useI18n()
const isCreate = computed(() => props.requestType === OrderRequestTypes.Create)
const isDelete = computed(() => props.requestType === OrderRequestTypes.Delete)
const showMobile = computed(() => 'mobile' in props.request && !!props.request?.mobile)

const inputRemovalData = ref(structuredClone(initialRemovalInputData))
const {
  contractIdentificationDocumentTypeOptions,
  picIdentificationDocumentTypeOptions,
  auxiliaryIdentificationDocumentTypeOptions,
  employmentDocumentTypeOptions,
  getShowPicIdentificationNumber,
  getShowPicIdentificationBackDocumentFile,
  getShowPicIdentificationAdditionalDocumentFile,
  getShowPicAuxiliaryIdentificationDocumentType,
  getShowPicEmployeeCode,
  getShowCallDetailOption,
  primaryCircuitTypeOptions,
  secondaryCircuitTypeOptions,
  terminalDeviceTypeOptions,
  getLanTypeText,
  getCustomerReceiptRequiredText,
  getCallDetailDesiredText,
  getCallDetailBreakdownText,
  getNetworkTypeText,
  getWanDefaultGatewayVpnRoutingText,
  getMobileRatText,
  getTrafficReportFlowAnalyzerPlanText,
  getTrafficReportFlowAnalyzerAlertText,
  getThreatDetectionPlanText,
  getFlowCollectorPlanText,
  getBehaviorDetectionPlanText,
  formatLansToInputType,
  formatLanStaticRoutesToInputType,
} = useTerminalInput()
const { getBreakOutListOptions } = useBreakOut()
const { vpnRouteLimitOptions: SelfVpnRouteLimitOptions } = useSelfTerminals()

const getVpnRouteLimitText = (value: string) => {
  const foundSelf = SelfVpnRouteLimitOptions.find(option => `${option.value}` === value)
  return foundSelf?.text ?? value
}

const inputData = ref({
  trafficReportFlowAnalyzerPlan: '',
  trafficReportFlowAnalyzerAlert: '',
  threatDetectionPlan: '',
  flowCollectorPlan: '',
  behaviorDetectionPlan: '',
  guarantee: { ...initialTerminalInputData.guarantee, ...initialSelfTerminalInputData.guarantee },
  lans: [...initialTerminalInputData.lans],
  lanStaticRoutes: [...initialTerminalInputData.lanStaticRoutes],
  wanStaticRoutes: [...initialTerminalInputData.wanStaticRoutes],
  defaultGateway: { ...initialTerminalInputData.defaultGateway },
  breakOut: [...initialTerminalInputData.breakOut],
  interceptDnsServers: [...initialTerminalInputData.interceptDnsServers],
  vpnInFilters: { ...initialTerminalInputData.vpnInFilters },
  vpnOutFilters: { ...initialTerminalInputData.vpnOutFilters },
  inet4OutFilters: { ...initialTerminalInputData.inet4OutFilters },
  dhcpRelayServers: [...initialTerminalInputData.dhcpRelayServers],
})
const inputMobileData = ref(structuredClone(initialMobileInputData))

const useGuaranteeVpn = computed(() => {
  // お客さま自営ルーターの場合に VPN 利用する/しないを表示する
  if ('guarantee' in props.request && props.request.guarantee && 'internet' in props.request.guarantee) {
    return (
      !!props.request.vpnId ||
      'vpnRouteLimit' in props.request ||
      'vpnAdvertiseNetworks' in props.request ||
      !!props.request.guarantee.vpn
    )
  }
  return null
})

const breakOutListOptions = computed(() => getBreakOutListOptions(inputData.value.breakOut, props.breakOutList))
const showPicIdentificationNumber = computed(() => getShowPicIdentificationNumber(inputMobileData.value))
const showPicIdentificationBackDocumentFile = computed(() =>
  getShowPicIdentificationBackDocumentFile(inputMobileData.value),
)
const showPicIdentificationAdditionalDocumentFile = computed(() =>
  getShowPicIdentificationAdditionalDocumentFile(inputMobileData.value),
)
const showPicAuxiliaryIdentificationDocumentType = computed(() =>
  getShowPicAuxiliaryIdentificationDocumentType(inputMobileData.value),
)
const showPicEmployeeCode = computed(() => getShowPicEmployeeCode(inputMobileData.value))
const showCallDetailOption = computed(() => getShowCallDetailOption(inputMobileData.value))

const contractIdentificationDocumentTypeText = computed(() => {
  const found = contractIdentificationDocumentTypeOptions.find(
    option => option.value === inputMobileData.value.contractIdentificationDocumentType,
  )
  return found?.text ?? ''
})
const picIdentificationDocumentTypeText = computed(() => {
  const found = picIdentificationDocumentTypeOptions.find(
    option => option.value === inputMobileData.value.picIdentificationDocumentType,
  )
  return found?.text ?? ''
})
const picAuxiliaryIdentificationDocumentTypeText = computed(() => {
  const found = auxiliaryIdentificationDocumentTypeOptions.find(
    option => option.value === inputMobileData.value.picAuxiliaryIdentificationDocumentType,
  )
  return found?.text ?? ''
})
const picEmploymentDocumentTypeText = computed(() => {
  const found = employmentDocumentTypeOptions.find(
    option => option.value === inputMobileData.value.picEmploymentDocumentType,
  )
  return found?.text ?? ''
})

const customerReceiptRequiredText = computed(() =>
  getCustomerReceiptRequiredText(inputMobileData.value.customerReceiptRequired === 'true'),
)
const callDetailDesiredText = computed(() =>
  getCallDetailDesiredText(inputMobileData.value.callDetailDesired === 'true'),
)
const callDetailBreakdownSettingText = computed(() =>
  getCallDetailBreakdownText(inputMobileData.value.callDetailBreakdownSetting),
)
const callDetailDestinationNumberSettingText = computed(() =>
  getCallDetailBreakdownText(inputMobileData.value.callDetailDestinationNumberSetting),
)
const terminalDeviceTypeText = computed(() => {
  const found = terminalDeviceTypeOptions.find(
    option => 'terminalDeviceType' in props.request && option.value === props.request.terminalDeviceType,
  )
  return found?.text ?? ''
})
const hideLanInFilters = computed(
  () => 'terminalDeviceType' in props.request && props.request.terminalDeviceType === TerminalDeviceTypes.Router02,
)
const primaryCircuitTypeText = computed(() => {
  const found = primaryCircuitTypeOptions.find(
    option => 'primaryCircuitType' in props.request && option.value === props.request.primaryCircuitType,
  )
  return found?.text ?? ''
})
const secondaryCircuitTypeText = computed(() => {
  const found = secondaryCircuitTypeOptions.find(
    option => 'secondaryCircuitType' in props.request && option.value === props.request.secondaryCircuitType,
  )
  return found?.text ?? ''
})

const getFilters = (filters?: TerminalUserFilter | null) => {
  if (!filters) {
    return { ...initialTerminalInputData.vpnInFilters }
  } else {
    return {
      defaultPolicy: filters.defaultPolicy,
      accessControlList: filters?.accessControlList ?? [],
    }
  }
}
const getMobile = (mobile?: TerminalMobilePostRequest | TerminalMobilePutRequest | TerminalMobileDeleteRequest) => {
  if (!mobile) {
    return { ...initialMobileInputData }
  }
  return {
    ...initialMobileInputData,
    ...mobile,
    customerReceiptRequired: 'customerReceiptRequired' in mobile ? `${mobile.customerReceiptRequired}` : '',
    callDetailDesired: 'callDetailDesired' in mobile ? `${mobile.callDetailDesired}` : '',
  }
}
const initializeInputData = () => {
  const data = {
    trafficReportFlowAnalyzerPlan:
      'trafficReportFlowAnalyzer' in props.request
        ? String(props.request.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan ?? '')
        : '',
    trafficReportFlowAnalyzerAlert:
      'trafficReportFlowAnalyzer' in props.request
        ? String(props.request.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert ?? '')
        : '',
    threatDetectionPlan:
      'threatDetection' in props.request ? String(props.request.threatDetection?.threatDetectionPlan) : '',
    flowCollectorPlan: 'flowCollector' in props.request ? String(props.request.flowCollector?.flowCollectorPlan) : '',
    behaviorDetectionPlan:
      'behaviorDetection' in props.request ? String(props.request.behaviorDetection?.behaviorDetectionPlan) : '',
    breakOut: 'breakOut' in props.request ? (props.request.breakOut ?? []) : [],
    interceptDnsServers: 'interceptDnsServers' in props.request ? (props.request.interceptDnsServers ?? []) : [],
    guarantee:
      'guarantee' in props.request
        ? {
            guaranteeId: props.request.guarantee?.guaranteeId ?? '',
            internetAdvertise:
              props.request.guarantee && 'internet' in props.request.guarantee
                ? `${!!props.request.guarantee.internet?.advertise}`
                : '',
            internetPingMonitoring:
              props.request.guarantee &&
              'internet' in props.request.guarantee &&
              props.request.guarantee.internet &&
              'pingMonitoring' in props.request.guarantee.internet
                ? `${!!props.request.guarantee.internet.pingMonitoring}`
                : '',
            vpnActConnectedIpv4Prefix: props.request.guarantee?.vpn?.act?.connectedIpv4Prefix ?? '',
            vpnSbyConnectedIpv4Prefix: props.request.guarantee?.vpn?.sby?.connectedIpv4Prefix ?? '',
          }
        : { ...initialTerminalInputData.guarantee, ...initialSelfTerminalInputData.guarantee },
    defaultGateway:
      'defaultGateway' in props.request
        ? {
            nexthopNetwork: props.request.defaultGateway?.nexthopNetwork ?? '',
            nexthopIpv4Address: props.request.defaultGateway?.nexthopIpv4Address ?? '',
            vpnRouting: `${!!props.request?.defaultGateway?.vpnRouting}`,
          }
        : { ...initialTerminalInputData.defaultGateway },
    lans: 'lans' in props.request ? formatLansToInputType(props.request.lans) : [],
    lanStaticRoutes:
      'lanStaticRoutes' in props.request ? formatLanStaticRoutesToInputType(props.request.lanStaticRoutes) : [],
    wanStaticRoutes:
      'wanStaticRoutes' in props.request
        ? (props.request.wanStaticRoutes?.map(wan => ({
            destinationIpv4Prefix: wan.destinationIpv4Prefix,
            nexthopNetwork: wan.nexthopNetwork as string,
          })) ?? [])
        : [],
    vpnInFilters: getFilters('vpnInFilters' in props.request ? props.request.vpnInFilters : null),
    vpnOutFilters: getFilters('vpnOutFilters' in props.request ? props.request.vpnOutFilters : null),
    inet4OutFilters: getFilters('inet4OutFilters' in props.request ? props.request.inet4OutFilters : null),
    dhcpRelayServers:
      'dhcpRelayServers' in props.request
        ? (props.request?.dhcpRelayServers?.map(({ serverIpv4Address }) => serverIpv4Address) ?? [])
        : [],
  }
  const mobile = getMobile('mobile' in props.request ? props.request.mobile : undefined)
  const removal =
    'removalName' in props.request
      ? {
          removalName: props.request.removalName,
          removalCompanyName: props.request.removalCompanyName ?? '',
          removalDepartmentName: props.request.removalDepartmentName,
          removalPostalCode: props.request.removalPostalCode,
          removalAddress: props.request.removalAddress,
          removalAddressKana: props.request.removalAddressKana,
          removalPhoneNumber: props.request.removalPhoneNumber,
        }
      : { ...initialRemovalInputData }

  inputData.value = data
  inputMobileData.value = mobile
  inputRemovalData.value = removal
}

const showBasicConfiguration = computed(() =>
  [
    'customerNote',
    'terminalDeviceType',
    'primaryCircuitType',
    'secondaryCircuitType',
    'installationPostalCode',
    'installationAddress',
  ].some(value => value in props.request),
)
const showGuarantee = computed(() => 'guarantee' in props.request && !!props.request.guarantee)
const showResourceSettings = computed(
  () =>
    ['ipoeId', 'vpnId', 'vpnRouteLimit', 'vpnAdvertiseNetworks'].some(value => value in props.request) ||
    showGuarantee.value,
)
const showNetworkSettings = computed(() =>
  ['loopbackIpv4Address', 'lanType', 'lans', 'defaultGateway', 'breakOut', 'interceptDnsServers'].some(
    value => value in props.request,
  ),
)
const showBreakOut = computed(() => 'breakOut' in props.request)
const showInterceptDnsServers = computed(() => 'interceptDnsServers' in props.request)
const showDefaultGatewayNexthop = computed(() => 'defaultGateway' in props.request)
const showDefaultGateway = computed(
  () => showDefaultGatewayNexthop.value || showBreakOut.value || showInterceptDnsServers.value,
)

const showDetailSettings = computed(() =>
  [
    'lanStaticRoutes',
    'wanStaticRoutes',
    'vpnInFilters',
    'vpnOutFilters',
    'inet4OutFilters',
    'dhcpServer',
    'dhcpRelayServers',
  ].some(value => value in props.request),
)
const showSecurityOption = computed(() =>
  ['threatDetection', 'flowCollector', 'behaviorDetection'].some(value => value in props.request),
)

watch(() => props.request, initializeInputData)
onBeforeMount(initializeInputData)
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <!-- 端末基本設定 -->
    <InnerCard v-if="showBasicConfiguration" :title="t('terminals.basicConfiguration')">
      <DetailGrid v-if="'customerNote' in props.request">
        <div>{{ t('terminals.name') }}</div>
        <div>{{ props.request.customerNote || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid v-if="'terminalDeviceType' in props.request">
        <div>{{ t('terminals.terminalDeviceType') }}</div>
        <div>{{ terminalDeviceTypeText || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid v-if="'primaryCircuitType' in props.request">
        <div>{{ t('terminals.primaryCircuitType') }}</div>
        <div>{{ primaryCircuitTypeText || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid v-if="'secondaryCircuitType' in props.request">
        <div>{{ t('terminals.secondaryCircuitType') }}</div>
        <div>{{ secondaryCircuitTypeText || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid v-if="'installationPostalCode' in props.request">
        <div>{{ t('terminals.installationPostalCode') }}</div>
        <div>{{ props.request.installationPostalCode || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid v-if="'installationAddress' in props.request">
        <div>{{ t('terminals.installationAddress') }}</div>
        <div>{{ props.request.installationAddress || t('orders.none') }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- リソース設定 -->
    <InnerCard v-if="showResourceSettings" :title="t('terminals.resourceSettings')">
      <template v-if="showGuarantee">
        <DetailGrid>
          <div>{{ t('terminals.guaranteeId') }}</div>
          <div>{{ inputData.guarantee.guaranteeId || t('orders.none') }}</div>
        </DetailGrid>
        <div class="pl-5 mb-3">
          <DetailGrid v-if="inputData.guarantee.internetAdvertise" :label-width="271" class="mt-2">
            <div class="text-secondary text-lg">{{ t('terminals.internet') }}</div>
            <div>{{ inputData.guarantee.internetAdvertise === 'true' ? t('common.use') : t('common.disuse') }}</div>
          </DetailGrid>
          <DetailGrid v-if="inputData.guarantee.internetPingMonitoring" :label-width="271" class="mt-2">
            <div>{{ t('terminals.pingMonitoring') }}</div>
            <div>
              {{ inputData.guarantee.internetPingMonitoring === 'true' ? t('common.use') : t('common.disuse') }}
            </div>
          </DetailGrid>
          <DetailGrid v-if="useGuaranteeVpn !== null" :label-width="271" class="mt-2">
            <div class="text-secondary text-lg">{{ t('terminals.vpn') }}</div>
            <div>{{ useGuaranteeVpn ? t('common.use') : t('common.disuse') }}</div>
          </DetailGrid>
          <div v-else class="mt-2 text-secondary text-lg">{{ t('terminals.vpn') }}</div>
          <DetailGrid :label-width="271">
            <div>{{ t('terminals.connectionAddressAct') }}</div>
            <div>{{ inputData.guarantee.vpnActConnectedIpv4Prefix || t('orders.none') }}</div>
          </DetailGrid>
          <DetailGrid :label-width="271">
            <div>{{ t('terminals.connectionAddressSby') }}</div>
            <div>{{ inputData.guarantee.vpnSbyConnectedIpv4Prefix || t('orders.none') }}</div>
          </DetailGrid>
        </div>
      </template>
      <DetailGrid v-if="'ipoeId' in props.request">
        <div>{{ t('terminals.ipoeId') }}</div>
        <div>{{ props.request.ipoeId || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid v-if="'vpnId' in props.request">
        <div>{{ t('terminals.vpnId') }}</div>
        <div>{{ props.request.vpnId || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid v-if="'vpnRouteLimit' in props.request">
        <div>{{ t('terminals.vpnRouteLimit') }}</div>
        <div>{{ getVpnRouteLimitText(`${props.request.vpnRouteLimit}`) || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid v-if="'vpnAdvertiseNetworks' in props.request">
        <div>{{ t('terminals.vpnAdvertiseNetworks') }}</div>
        <div>{{ props.request.vpnAdvertiseNetworks?.join('\n') || t('orders.none') }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- 廃止申し込み情報 -->
    <InnerCard v-if="isDelete" :title="t('terminals.removalInformation')">
      <DetailGrid>
        <div>{{ t('terminals.removalName') }}</div>
        <div>{{ inputRemovalData.removalName }}</div>
      </DetailGrid>
      <DetailGrid v-if="inputRemovalData.removalCompanyName">
        <div>{{ t('terminals.removalCompanyName') }}</div>
        <div>{{ inputRemovalData.removalCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalDepartmentName') }}</div>
        <div>{{ inputRemovalData.removalDepartmentName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalPostalCode') }}</div>
        <div>{{ inputRemovalData.removalPostalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalAddress') }}</div>
        <div>{{ inputRemovalData.removalAddress }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalAddressKana') }}</div>
        <div>{{ inputRemovalData.removalAddressKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.removalPhoneNumber') }}</div>
        <div>{{ inputRemovalData.removalPhoneNumber }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- ネットワーク設定 -->
    <InnerCard v-if="showNetworkSettings" :title="t('terminals.networkSettings')">
      <template v-if="'loopbackIpv4Address' in props.request || 'lanType' in props.request || 'lans' in props.request">
        <div class="mt-3 text-secondary text-lg">{{ t('terminals.basicSettings') }}</div>
        <!-- Loopbackアドレス -->
        <DetailGrid v-if="'loopbackIpv4Address' in props.request">
          <div>{{ t('terminals.loopbackIpv4Address') }}</div>
          <div>{{ props.request.loopbackIpv4Address || t('orders.none') }}</div>
        </DetailGrid>
        <!-- LANタイプ -->
        <DetailGrid v-if="'lanType' in props.request">
          <div>{{ t('terminals.lanType') }}</div>
          <div>{{ props.request.lanType ? getLanTypeText(props.request.lanType) : t('orders.none') }}</div>
        </DetailGrid>
        <!-- 直下セグメント -->
        <template v-if="'lans' in props.request">
          <div class="pt-3">{{ t('terminals.lans') }}</div>
          <EditLans
            v-if="inputData.lans.length > 0"
            :lan-type="inputData.lans.find(lan => !!lan.portNumber) ? LanTypes.RoutedPort : LanTypes.SwitchPort"
            :values="inputData.lans"
            :hide-lan-in-filters="hideLanInFilters"
            disabled
            class="mb-5"
          />
          <div v-else class="mb-5">{{ t('orders.none') }}</div>
        </template>
      </template>
      <!-- デフォルトルート設定 -->
      <template v-if="showDefaultGateway">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.wanDefaultGateWay') }}</div>
        <template v-if="showDefaultGatewayNexthop">
          <DetailGrid>
            <div>{{ t('terminals.nexthopNetwork') }}</div>
            <div>{{ getNetworkTypeText(inputData.defaultGateway.nexthopNetwork) }}</div>
          </DetailGrid>
          <template v-if="inputData.defaultGateway.nexthopNetwork === NetworkTypes.Lan">
            <DetailGrid>
              <div>{{ t('terminals.nexthopIpv4AddressDefaultGateway') }}</div>
              <div>{{ inputData.defaultGateway.nexthopIpv4Address }}</div>
            </DetailGrid>
            <DetailGrid>
              <div>{{ t('terminals.defaultRouteWithinVpn') }}</div>
              <div>
                {{ getWanDefaultGatewayVpnRoutingText(inputData.defaultGateway.vpnRouting === 'true') }}
              </div>
            </DetailGrid>
          </template>
        </template>
        <DetailGrid v-if="showBreakOut">
          <div>{{ t('terminals.breakOut') }}</div>
          <div v-if="breakOutListOptions.length === 0">{{ t('orders.none') }}</div>
          <div v-else class="align-start-important flex-column">
            <div v-for="option in breakOutListOptions" :key="option.value">
              {{ option.text }}
            </div>
          </div>
        </DetailGrid>
        <DetailGrid v-if="showInterceptDnsServers">
          <div>{{ t('terminals.breakOutDnsServers') }}</div>
          <div v-if="inputData.interceptDnsServers.length === 0">{{ t('orders.none') }}</div>
          <div v-else class="align-start-important flex-column">
            <div v-for="(value, index) in inputData.interceptDnsServers" :key="`break-oout-dns-servers-${index}`">
              {{ value }}
            </div>
          </div>
        </DetailGrid>
      </template>
    </InnerCard>

    <!-- フロー可視化 -->
    <InnerCard
      v-if="'trafficReportFlowAnalyzer' in request"
      :title="t('terminals.trafficReportFlowAnalyzerPlanOptions')"
    >
      <DetailGrid v-if="inputData.trafficReportFlowAnalyzerPlan">
        <div>{{ t('terminals.trafficReportFlowAnalyzerPlan') }}</div>
        <div>
          {{ getTrafficReportFlowAnalyzerPlanText(inputData.trafficReportFlowAnalyzerPlan) || t('orders.none') }}
        </div>
      </DetailGrid>
      <DetailGrid v-if="inputData.trafficReportFlowAnalyzerAlert">
        <div>{{ t('terminals.trafficReportFlowAnalyzerAlert') }}</div>
        <div>
          {{
            getTrafficReportFlowAnalyzerAlertText(inputData.trafficReportFlowAnalyzerAlert === 'true') ||
            t('orders.none')
          }}
        </div>
      </DetailGrid>
    </InnerCard>

    <!-- セキュリティオプション -->
    <InnerCard v-if="showSecurityOption" :title="t('terminals.securityOptions')">
      <DetailGrid>
        <div>{{ t('terminals.threatDetectionPlan') }}</div>
        <div>{{ getThreatDetectionPlanText(inputData.threatDetectionPlan) || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.flowCollectorPlan') }}</div>
        <div>{{ getFlowCollectorPlanText(inputData.flowCollectorPlan) || t('orders.none') }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.behaviorDetection') }}</div>
        <div>{{ getBehaviorDetectionPlanText(inputData.behaviorDetectionPlan) || t('orders.none') }}</div>
      </DetailGrid>
    </InnerCard>

    <CollapseCard v-if="showDetailSettings" :title="t('terminals.detailSettings')" default-open>
      <!-- 拠点内セグメント（非直下セグメント） -->
      <template v-if="'lanStaticRoutes' in props.request">
        <div class="flex-flex-start-center">
          <div class="collapse-title text-secondary text-lg">{{ t('terminals.lanStaticRoutes') }}</div>
        </div>
        <EditLanStaticRoutes
          v-if="inputData.lanStaticRoutes.length > 0"
          :values="inputData.lanStaticRoutes"
          disabled
          class="mb-5"
        />
        <div v-else class="mb-5">{{ t('orders.none') }}</div>
      </template>

      <!-- WAN向けスタティックルート設定 -->
      <template v-if="'wanStaticRoutes' in props.request">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.wanStaticRoutes') }}</div>
        <EditWanStaticRoutes
          v-if="inputData.wanStaticRoutes.length > 0"
          :values="inputData.wanStaticRoutes"
          disabled
          class="mb-5"
        />
        <div v-else class="mb-5">{{ t('orders.none') }}</div>
      </template>

      <!-- WANポートフィルタ（VPN → 拠点） -->
      <template v-if="'vpnInFilters' in props.request">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.vpnInFilters') }}</div>
        <EditFilters
          v-if="props.request.vpnInFilters !== null"
          :model-value="inputData.vpnInFilters"
          :editable="false"
          class="mb-5"
        />
        <div v-else class="mb-5">{{ t('orders.none') }}</div>
      </template>

      <!-- WANポートフィルタ（拠点 → VPN） -->
      <template v-if="'vpnOutFilters' in props.request">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.vpnOutFilters') }}</div>
        <EditFilters
          v-if="props.request.vpnOutFilters !== null"
          :model-value="inputData.vpnOutFilters"
          :editable="false"
          class="mb-5"
        />
        <div v-else class="mb-5">{{ t('orders.none') }}</div>
      </template>

      <!-- WANポートフィルタ（拠点 → Internet） -->
      <template v-if="'inet4OutFilters' in props.request">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.inet4OutFilters') }}</div>
        <EditFilters
          v-if="props.request.inet4OutFilters !== null"
          :model-value="inputData.inet4OutFilters"
          :editable="false"
          class="mb-5"
        />
        <div v-else class="mb-5">{{ t('orders.none') }}</div>
      </template>

      <!-- DHCP Relay -->
      <template v-if="'dhcpRelayServers' in props.request">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.relay') }}</div>
        <DetailGrid v-if="props.request.dhcpRelayServers !== null">
          <div>{{ t('terminals.serverIpv4Address') }}</div>
          <div class="text-pre-wrap">
            {{ inputData.dhcpRelayServers.join('\n') }}
          </div>
        </DetailGrid>
        <div v-else class="mb-5">{{ t('orders.none') }}</div>
      </template>
    </CollapseCard>

    <!-- 配送先情報 -->
    <InnerCard v-if="isCreate && 'deliveryName' in request" :title="t('terminals.deliveryInformation')">
      <DetailGrid>
        <div>{{ t('terminals.picName') }}</div>
        <div>{{ request.deliveryName }}</div>
      </DetailGrid>
      <DetailGrid v-if="request.deliveryCompanyName">
        <div>{{ t('terminals.deliveryCompanyName') }}</div>
        <div>{{ request.deliveryCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.picDepartmentName') }}</div>
        <div>{{ request.deliveryDepartmentName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.postalCode') }}</div>
        <div>{{ request.deliveryPostalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.address') }}</div>
        <div>{{ request.deliveryAddress }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.addressKana') }}</div>
        <div>{{ request.deliveryAddressKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.deliveryDate') }}</div>
        <div>{{ request.deliveryDate }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- モバイル申し込み情報 -->
    <InnerCard v-if="showMobile" :title="t('terminals.mobileInformation')">
      <DetailGrid v-if="!!inputMobileData.rat">
        <div>{{ t('terminals.mobileRat') }}</div>
        <div>{{ getMobileRatText(inputMobileData.rat) }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!inputMobileData.japanCorporateNumber">
        <div>{{ t('terminals.japanCorporateNumber') }}</div>
        <div>{{ inputMobileData.japanCorporateNumber }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!inputMobileData.contractIdentificationDocumentType">
        <div>{{ t('terminals.contractIdentificationDocumentType') }}</div>
        <div>{{ contractIdentificationDocumentTypeText }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!inputMobileData.contractIdentificationDocumentId">
        <div>{{ t('terminals.contractIdentificationDocumentId') }}</div>
        <div>{{ inputMobileData.contractIdentificationDocumentId }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!inputMobileData.picName">
        <div>{{ t('terminals.picName') }}</div>
        <div>{{ inputMobileData.picName }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!inputMobileData.picNameKana">
        <div>{{ t('terminals.picNameKana') }}</div>
        <div>{{ inputMobileData.picNameKana }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!inputMobileData.picPhoneNumber">
        <div>{{ t('terminals.picPhoneNumber') }}</div>
        <div>{{ inputMobileData.picPhoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('terminals.useJpkiAuthentication') }}</div>
        <div>
          {{ !!inputMobileData.jpkiRequestId ? t('common.with') : t('common.without') }}
        </div>
      </DetailGrid>

      <template v-if="!!inputMobileData.picIdentificationDocumentType">
        <DetailGrid>
          <div>{{ t('terminals.picIdentificationDocumentType') }}</div>
          <div>{{ picIdentificationDocumentTypeText }}</div>
        </DetailGrid>
        <DetailGrid v-if="showPicIdentificationNumber">
          <div>{{ t('terminals.picIdentificationNumber') }}</div>
          <div>{{ inputMobileData.picIdentificationNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.picIdentificationFrontDocumentId') }}</div>
          <div>{{ inputMobileData.picIdentificationFrontDocumentId }}</div>
        </DetailGrid>
        <DetailGrid v-if="showPicIdentificationBackDocumentFile">
          <div>{{ t('terminals.picIdentificationBackDocumentId') }}</div>
          <div>{{ inputMobileData?.picIdentificationBackDocumentId }}</div>
        </DetailGrid>
        <DetailGrid v-if="showPicIdentificationAdditionalDocumentFile">
          <div>{{ t('terminals.picIdentificationAdditionalDocumentId') }}</div>
          <div>{{ inputMobileData?.picIdentificationAdditionalDocumentId }}</div>
        </DetailGrid>
        <template v-if="showPicAuxiliaryIdentificationDocumentType">
          <DetailGrid>
            <div>{{ t('terminals.picAuxiliaryIdentificationDocumentType') }}</div>
            <div>{{ picAuxiliaryIdentificationDocumentTypeText }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('terminals.picAuxiliaryIdentificationDocumentId') }}</div>
            <div>{{ inputMobileData?.picAuxiliaryIdentificationDocumentId }}</div>
          </DetailGrid>
        </template>
      </template>
      <template v-if="!!inputMobileData.picEmploymentDocumentType">
        <DetailGrid>
          <div>{{ t('terminals.picEmploymentDocumentType') }}</div>
          <div>{{ picEmploymentDocumentTypeText }}</div>
        </DetailGrid>
        <DetailGrid v-if="showPicEmployeeCode">
          <div>{{ t('terminals.picEmployeeCode') }}</div>
          <div>{{ inputMobileData?.picEmployeeCode }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.picEmploymentDocumentId') }}</div>
          <div>{{ inputMobileData.picEmploymentDocumentId }}</div>
        </DetailGrid>
      </template>
      <template v-if="isCreate">
        <DetailGrid>
          <div>{{ t('terminals.networkPinCode') }}</div>
          <div>{{ inputMobileData.networkPinCode }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.customerReceiptRequired') }}</div>
          <div>{{ customerReceiptRequiredText }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.callDetailDesired') }}</div>
          <div>{{ callDetailDesiredText }}</div>
        </DetailGrid>
        <template v-if="showCallDetailOption">
          <DetailGrid>
            <div>{{ t('terminals.callDetailBreakdownSetting') }}</div>
            <div>{{ callDetailBreakdownSettingText }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('terminals.callDetailDestinationNumberSetting') }}</div>
            <div>{{ callDetailDestinationNumberSettingText }}</div>
          </DetailGrid>
        </template>
      </template>
    </InnerCard>
  </InnerCard>
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
