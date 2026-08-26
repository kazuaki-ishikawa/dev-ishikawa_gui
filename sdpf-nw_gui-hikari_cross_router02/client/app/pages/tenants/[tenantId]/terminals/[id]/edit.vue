<script lang="ts" setup>
import { cloneDeep, isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import {
  ResourceStatusTypes,
  CircuitTypes,
  TerminalTypes,
  TerminalDeviceTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
} from '@/api/constants'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import type { BreakOutResponse } from '@/api/breakOut/types'
import type { InternetRateLimitType, VpnRateLimitType } from '@/api/guarantees/types'
import { HikariPlans } from '@/api/ipoes/constants'
import {
  TERMINAL_LINK,
  TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE,
  NetworkTypes,
  LanTypes,
  initialTerminalInputData,
  initialTerminalValid,
  initialFiltersInputData,
  initialTermsOfServiceAgreement,
} from '@/api/terminals/constants'
import type { MobileRatType, PrimaryCircuitType, SecondaryCircuitType } from '@/api/terminals/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import type { InputCircuitType } from '@/components/terminals/EditCircuitTypes.vue'
import { IconTypes } from '@/components/icons/constants'
import { UNSELECTED_VALUE } from '@/components/input/constants'

type ValidKeys = keyof typeof initialTerminalValid
type FilteredGuaranteeType = {
  guaranteeId: string
  customerNote: string
  internetRateLimit: InternetRateLimitType | null
  vpnRateLimit: VpnRateLimitType | null
  pattern1G: boolean
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rules = useRules()
const { navigationGuard } = useNavigationGuard()

const tenantId = computed(() => route.params.tenantId as string)
const terminalId = computed(() => route.params.id as string)
const { loading } = useLoading()

const { terminal, editable, requiredFirmwareUpdate, inProgressSwitchover, getTerminal } = useGetTerminal()
const { updateTerminal } = useUpdateTerminal()
const { customerNoteList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const {
  checkCircuitTypeSelected,
  getShowBreakOut,
  getShowDefaultGatewayNexthop,
  getGuaranteeListFilterPatterns,
  networkTypeOptions,
  wanDefaultGatewayVpnRoutingOptions,
  breakOutOptions,
  mobileRatOptions,
  lanTypeOptions,
  getPutRequest,
  getCustomerReceiptRequiredText,
  getCallDetailDesiredText,
  getCallDetailBreakdownText,
  formatLansToInputType,
  formatLanStaticRoutesToInputType,
} = useTerminalInput()
const { getAllGuaranteeList, getAttachableGuaranteeList } = useGetAllGuaranteeList()
const { getSummaryVpnList, unterminatedVpnListOptions } = useGetSummaryVpnList()
const { getAllIpoeList, getAttachableIpoeListOptions } = useGetAllIpoeList()
const { getBreakOutList, breakOutList } = useGetBreakOutList()
const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)
const { securityTermsOfServiceAccepted, getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted } =
  useTermsOfService(TermsOfServiceBasePath.Security)
const { getSecurityHelpDesk, shouldShowHelpDeskCampaign } = useGetSecurityHelpDesk()

const { currentSettingsBehaviorDetectionPlan, getSettingsBehaviorDetection } = useGetSettingsBehaviorDetection()

const updatedOrderId = ref('')
const openTermsOfServiceDialog = ref(false)
const openSuccessDialog = ref(false)
const inputData = ref(structuredClone(initialTerminalInputData))
const inputValid = ref(structuredClone(initialTerminalValid))
const inputMobileRat = ref<MobileRatType>('auto')
const inputMobileRatValid = ref(true)

const isRouter01 = computed(() => terminal.value?.terminalDeviceType === TerminalDeviceTypes.Router01)
const isRouter02 = computed(() => terminal.value?.terminalDeviceType === TerminalDeviceTypes.Router02)
const attachableIpoeListOptions = computed(() =>
  // 変更時に紐付け可能なIPoE回線は active のもののみ
  getAttachableIpoeListOptions(terminalId.value, [ResourceStatusTypes.Active])
    // RINKルーター01 は光ネクストのみ利用可能なため、光クロスの回線は選択肢に表示しない
    .filter(({ hikariPlan }) => !isRouter01.value || hikariPlan !== HikariPlans.Cross),
)
const filteredGuaranteeList = computed(() => {
  // 変更時に紐付け可能なギャランティ回線は active のもののみ
  const attachableGuaranteeList = getAttachableGuaranteeList(terminalId.value, [ResourceStatusTypes.Active])
  return attachableGuaranteeList.reduce<FilteredGuaranteeType[]>((arr, guarantee) => {
    const { pattern100M, pattern1G } = getGuaranteeListFilterPatterns(guarantee)
    // サービスルーターに紐付け可能なギャランティ回線のみを表示する
    if (pattern100M || pattern1G) {
      arr.push({
        guaranteeId: guarantee.guaranteeId,
        customerNote: guarantee.customerNote,
        internetRateLimit: guarantee.internet?.rateLimit ?? null,
        vpnRateLimit: guarantee.vpn?.rateLimit ?? null,
        pattern1G,
      })
    }
    return arr
  }, [])
})
const guaranteeListOptions = computed(() =>
  filteredGuaranteeList.value.map(guarantee => ({
    text: `${guarantee.guaranteeId} / ${guarantee.customerNote}`,
    value: guarantee.guaranteeId,
  })),
)
const selectedGuarantee = computed(() =>
  filteredGuaranteeList.value.find(guarantee => guarantee.guaranteeId === inputData.value.guarantee.guaranteeId),
)
watch(selectedGuarantee, next => {
  if (next?.pattern1G) {
    inputData.value.lanType = inputData.value.lanType === LanTypes.SwitchPort ? '' : inputData.value.lanType
  }
})
const hasGuaranteeInternetRateLimit = computed(
  () =>
    // ギャランティ以外の場合は常に true になるようにする
    inputData.value.primaryCircuitType !== CircuitTypes.Guarantee ||
    !selectedGuarantee.value ||
    !!selectedGuarantee.value.internetRateLimit,
)
const hasGuaranteeVpnRateLimit = computed(
  () =>
    // ギャランティ以外の場合は常に true になるようにする
    inputData.value.primaryCircuitType !== CircuitTypes.Guarantee ||
    !selectedGuarantee.value ||
    !!selectedGuarantee.value.vpnRateLimit,
)

const isGuaranteeSelected = computed(() => checkCircuitTypeSelected(inputData.value, CircuitTypes.Guarantee))
const isIpoeSelected = computed(() => checkCircuitTypeSelected(inputData.value, CircuitTypes.Ipoe))
const showRouteSwitchStatus = computed(() => terminal.value?.primaryCircuit?.circuitType === CircuitTypes.Guarantee)
const showDefaultGatewayNexthop = computed(() => getShowDefaultGatewayNexthop(inputData.value))
const isVpnIdEmpty = computed(() => !inputData.value.vpnId || inputData.value.vpnId === UNSELECTED_VALUE)
const isBreakOutEmpty = computed(
  () => inputData.value.breakOut.length === 0 || inputData.value.breakOut.includes(UNSELECTED_VALUE),
)
watch(isBreakOutEmpty, next => {
  if (next) {
    // breakOut が空の場合は interceptDnsServers は入力不可になる
    inputData.value.interceptDnsServers = []
    inputValid.value.interceptDnsServers = true
  } else if (isEqual(inputData.value, originalData.value)) {
    // 初期値の場合は初期化させない
    inputData.value.interceptDnsServers = originalData.value.interceptDnsServers
    inputValid.value.interceptDnsServers = true
  } else {
    // breakOut が選択された場合は interceptDnsServers は入力必須になる
    inputData.value.interceptDnsServers = ['']
    inputValid.value.interceptDnsServers = false
  }
})
const showBreakOut = computed(() => getShowBreakOut(inputData.value))
watch(showBreakOut, next => {
  if (!next) {
    inputData.value.breakOut = []
    inputData.value.interceptDnsServers = []
    inputValid.value.interceptDnsServers = true
  }
  inputValid.value.breakOut = !next
})

watch([showBreakOut, hasGuaranteeInternetRateLimit], () => {
  if (!hasGuaranteeInternetRateLimit.value) {
    // ギャランティ回線のインターネット帯域制限が未選択の場合は、特定通信ブレイクアウトを利用無しにする
    inputData.value.breakOut = [UNSELECTED_VALUE]
    inputValid.value.breakOut = true
  }
})

const currentBreakOut = ref<BreakOutResponse>()
const openBreakoutDialog = (breakOut: BreakOutResponse) => {
  currentBreakOut.value = breakOut
}
const concatBreakOutOptions = computed(() =>
  breakOutList.value.reduce<Array<{ text: string; value: string; button?: { click: () => void } }>>(
    (options, breakOut) => {
      options.push({
        text: breakOut.customerNote,
        value: breakOut.breakOutListId,
        button: { click: () => openBreakoutDialog(breakOut) },
      })
      return options
    },
    [{ text: t('breakOut.unselected'), value: UNSELECTED_VALUE }, ...breakOutOptions],
  ),
)
// ipv4AddressRanges は必須項目なのでここに値があれば入力済みと判定する
const showDhcpRelayServers = computed(
  () => !inputData.value.lans.some(lan => lan.dhcpServer.ipv4AddressRanges.length > 0),
)
watch(showDhcpRelayServers, () => {
  inputData.value.dhcpRelayServers = []
  inputValid.value.dhcpRelayServers = true
})
const dhcpServerDisabled = computed(() => inputData.value.dhcpRelayServers.filter(Boolean).length > 0)

const updateVpnId = (value: string) => {
  inputData.value.vpnId = value
  // vpnId が空の場合は inputData.defaultGateway.nexthopNetwork は VPN を選べない
  if ((!value || value === UNSELECTED_VALUE) && inputData.value.defaultGateway.nexthopNetwork === NetworkTypes.Vpn) {
    inputData.value.defaultGateway.nexthopNetwork = ''
    inputValid.value.defaultGateway.nexthopNetwork = false
    inputData.value.breakOut = []
  }
  if (!value || value === UNSELECTED_VALUE) {
    // vpnId が空の場合は inputData.wanStaticRoutes.nexthopNetwork は VPN を選べない
    inputData.value.wanStaticRoutes = inputData.value.wanStaticRoutes.filter(
      wan => wan.nexthopNetwork !== NetworkTypes.Vpn,
    )
    // vpnId が空の場合は inputData.vpnInFilters, inputData.vpnOutFilters は入力不可
    inputData.value.vpnInFilters = { ...initialFiltersInputData }
    inputData.value.vpnOutFilters = { ...initialFiltersInputData }
    inputValid.value.vpnInFilters = true
    inputValid.value.vpnOutFilters = true
    // vpnId が空の場合は vpnActConnectedIpv4Prefix vpnSbyConnectedIpv4Prefix を初期化し入力不可
    inputData.value.guarantee.vpnActConnectedIpv4Prefix = ''
    inputData.value.guarantee.vpnSbyConnectedIpv4Prefix = ''
  }
}
watch(hasGuaranteeVpnRateLimit, next => !next && updateVpnId(UNSELECTED_VALUE))

const nexthopNetworkOptions = computed(() =>
  networkTypeOptions
    .filter(({ value }) => !isVpnIdEmpty.value || value !== NetworkTypes.Vpn)
    .filter(({ value }) => hasGuaranteeInternetRateLimit.value || value !== NetworkTypes.Internet),
)
watch(hasGuaranteeInternetRateLimit, next => {
  if (!next) {
    // インターネットの利用を設定する欄を空にする
    if (inputData.value.defaultGateway.nexthopNetwork === NetworkTypes.Internet) {
      inputData.value.defaultGateway.nexthopNetwork = ''
      inputValid.value.defaultGateway.nexthopNetwork = false
    }
    inputData.value.wanStaticRoutes = inputData.value.wanStaticRoutes.filter(
      wan => wan.nexthopNetwork !== NetworkTypes.Internet,
    )
  }
})

const vpnIdNameListOptions = computed(() => [
  { text: t('vpn.unselected'), value: UNSELECTED_VALUE },
  ...unterminatedVpnListOptions.value,
])
const filteredLanTypeOptions = computed(() =>
  lanTypeOptions
    // 選択したギャランティ回線の物理帯域が 1G の場合は スイッチポート方式 は選択できない
    .filter(({ value }) => !selectedGuarantee.value?.pattern1G || value === LanTypes.RoutedPort)
    // RINKルーター02 はスイッチポート方式のみ利用可能
    .filter(({ value }) => !isRouter02.value || value === LanTypes.SwitchPort),
)

const originalData = computed(() => {
  const picked = TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE.reduce((data, key) => {
    if (key === 'primaryCircuitType') {
      const primaryCircuitType = terminal.value?.primaryCircuit?.circuitType ?? ''
      Object.assign(data, { primaryCircuitType })
    } else if (key === 'secondaryCircuitType') {
      const secondaryCircuitType = terminal.value?.secondaryCircuit?.circuitType ?? ''
      Object.assign(data, { secondaryCircuitType })
    } else if (key === 'guarantee') {
      const guarantee = {
        guaranteeId: terminal.value?.guarantee?.guaranteeId ?? '',
        vpnActConnectedIpv4Prefix: terminal.value?.guarantee?.vpn?.act?.connectedIpv4Prefix ?? '',
        vpnSbyConnectedIpv4Prefix: terminal.value?.guarantee?.vpn?.sby?.connectedIpv4Prefix ?? '',
      }
      Object.assign(data, { guarantee })
    } else if (key === 'vpnId') {
      Object.assign(data, { vpnId: terminal.value?.vpnId ?? UNSELECTED_VALUE })
    } else if (key === 'breakOut') {
      const breakOut =
        terminal.value?.defaultGateway.nexthopNetwork === NetworkTypes.Vpn
          ? terminal.value?.breakOut || [UNSELECTED_VALUE]
          : []
      Object.assign(data, { breakOut })
    } else if (key === 'interceptDnsServers') {
      const interceptDnsServers = terminal.value?.interceptDnsServers ?? terminal.value?.breakOutDnsServers ?? []
      Object.assign(data, { interceptDnsServers })
    } else if (key === 'defaultGateway') {
      const defaultGateway = {
        nexthopNetwork: terminal.value?.defaultGateway?.nexthopNetwork ?? '',
        nexthopIpv4Address: terminal.value?.defaultGateway?.nexthopIpv4Address ?? '',
        vpnRouting: `${!!terminal.value?.defaultGateway?.vpnRouting}`,
      }
      Object.assign(data, { defaultGateway })
    } else if (key === 'lans') {
      const lans = formatLansToInputType(terminal.value?.lans)
      Object.assign(data, { lans })
    } else if (key === 'lanStaticRoutes') {
      const lanStaticRoutes = formatLanStaticRoutesToInputType(terminal.value?.lanStaticRoutes)
      Object.assign(data, { lanStaticRoutes })
    } else if (key === 'wanStaticRoutes') {
      const wanStaticRoutes = terminal.value?.wanStaticRoutes ?? []
      Object.assign(data, { wanStaticRoutes })
    } else if (key === 'vpnInFilters') {
      const vpnInFilters = {
        defaultPolicy: terminal.value?.vpnInFilters?.defaultPolicy ?? '',
        accessControlList: terminal.value?.vpnInFilters?.accessControlList ?? [],
      }
      Object.assign(data, { vpnInFilters })
    } else if (key === 'vpnOutFilters') {
      const vpnOutFilters = {
        defaultPolicy: terminal.value?.vpnOutFilters?.defaultPolicy ?? '',
        accessControlList: terminal.value?.vpnOutFilters?.accessControlList ?? [],
      }
      Object.assign(data, { vpnOutFilters })
    } else if (key === 'inet4OutFilters') {
      const inet4OutFilters = {
        defaultPolicy: terminal.value?.inet4OutFilters?.defaultPolicy ?? '',
        accessControlList: terminal.value?.inet4OutFilters?.accessControlList ?? [],
      }
      Object.assign(data, { inet4OutFilters })
    } else if (key === 'dhcpRelayServers') {
      const dhcpRelayServers = terminal.value?.dhcpRelayServers?.map(({ serverIpv4Address }) => serverIpv4Address) ?? []
      Object.assign(data, { dhcpRelayServers })
    } else if (key === 'trafficReportFlowAnalyzer') {
      Object.assign(data, {
        trafficReportFlowAnalyzer: {
          trafficReportFlowAnalyzerPlan: terminal.value?.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan ?? '',
          trafficReportFlowAnalyzerAlert: `${terminal.value?.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert ?? ''}`,
        },
      })
    } else if (key === 'threatDetection') {
      Object.assign(data, {
        threatDetection: {
          threatDetectionPlan: terminal.value?.threatDetection?.threatDetectionPlan ?? '',
        },
      })
    } else if (key === 'flowCollector') {
      Object.assign(data, {
        flowCollector: {
          flowCollectorPlan: terminal.value?.flowCollector?.flowCollectorPlan ?? '',
        },
      })
    } else {
      Object.assign(data, { [key]: terminal.value?.[key] ?? '' })
    }
    return data
  }, structuredClone(initialTerminalInputData))
  return picked
})

watch(originalData, () => {
  inputData.value = cloneDeep(originalData.value)
})

const originalMobileRat = computed(() => terminal.value?.mobile?.rat ?? 'auto')
watch(originalMobileRat, () => (inputMobileRat.value = originalMobileRat.value))
const changed = computed(
  () => !isEqual(inputData.value, originalData.value) || inputMobileRat.value !== originalMobileRat.value,
)
watchEffect(() => navigationGuard(changed.value))

// IPoE単独の場合は変更可能対象が IPoE ID のみ or それ以外の2パターンになる
const singleIpoeChanged = computed(
  () =>
    inputData.value.primaryCircuitType === CircuitTypes.Ipoe && !inputData.value.secondaryCircuitType && changed.value,
)
const singleIpoeDisabled = computed(
  () => singleIpoeChanged.value && inputData.value.ipoeId !== originalData.value.ipoeId,
)
const ipoeIdDisabled = computed(() => singleIpoeChanged.value && inputData.value.ipoeId === originalData.value.ipoeId)

const originalCircuitType = computed(() => ({
  primary: originalData.value.primaryCircuitType as PrimaryCircuitType,
  secondary: (originalData.value.secondaryCircuitType as SecondaryCircuitType) || undefined,
}))
const handleCircuitTypesChecked = (item: InputCircuitType) => {
  const commonValid = {
    primaryCircuitType: true,
    secondaryCircuitType: true,
    ipoeId: item.primary !== CircuitTypes.Ipoe && item.secondary !== CircuitTypes.Ipoe,
  }
  inputValid.value = {
    ...inputValid.value,
    ...commonValid,
    guarantee: {
      guaranteeId: item.primary !== CircuitTypes.Guarantee,
      vpnActConnectedIpv4Prefix: true,
      vpnSbyConnectedIpv4Prefix: true,
    },
    trafficReportFlowAnalyzer: {
      trafficReportFlowAnalyzerPlan: true,
      trafficReportFlowAnalyzerAlert: true,
    },
  }
  inputData.value = {
    ...inputData.value,
    primaryCircuitType: item.primary,
    secondaryCircuitType: item.secondary || '',
    ipoeId: '',
    guarantee: {
      guaranteeId: '',
      vpnActConnectedIpv4Prefix: '',
      vpnSbyConnectedIpv4Prefix: '',
    },
    trafficReportFlowAnalyzer: {
      trafficReportFlowAnalyzerPlan:
        item.primary === CircuitTypes.Guarantee
          ? inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan
          : TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
      trafficReportFlowAnalyzerAlert:
        item.primary === CircuitTypes.Guarantee
          ? inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert
          : 'false',
    },
  }
}

const isConfirmation = ref(false)
const termsOfServiceAgreementRef = ref(structuredClone(initialTermsOfServiceAgreement))
const termsOfServiceAgreement = computed({
  get: () =>
    termsOfServiceAgreementRef.value.filter(checked => {
      switch (checked.key) {
        case 'vpn-id':
          // vpnId を空から入力ありにした場合に規約を表示する
          return originalData.value.vpnId === UNSELECTED_VALUE && !isVpnIdEmpty.value
        case 'break-out':
          // breakOut を空から入力ありにした場合に規約を表示する
          return (
            (originalData.value.breakOut.length === 0 || originalData.value.breakOut.includes(UNSELECTED_VALUE)) &&
            !isBreakOutEmpty.value
          )
        case 'wan-security-options':
          // WANセキュリティオプションを新規に申し込んだ場合に表示する
          return (
            (originalData.value.threatDetection.threatDetectionPlan === SecurityOptionTypes.NoSubscription &&
              inputData.value.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription) ||
            (originalData.value.flowCollector.flowCollectorPlan === SecurityOptionTypes.NoSubscription &&
              inputData.value.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription) ||
            (originalData.value.behaviorDetection.behaviorDetectionPlan ===
              BehaviorDetectionOptionTypes.NoSubscription &&
              inputData.value.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription)
          )
        case 'traffic-report-flow-analyzer':
          // トラフィックレポート・フローアナライザーを新規に申し込んだ場合に表示する
          return (
            originalData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
              TrafficReportFlowAnalyzerPlanTypes.NoSubscription &&
            inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
              TrafficReportFlowAnalyzerPlanTypes.NoSubscription
          )
        default:
          return true
      }
    }),
  set: val => {
    termsOfServiceAgreementRef.value = val
  },
})
const guaranteeCheckedConfirmation = ref(false)
const needGuaranteeConfirmation = computed(
  () =>
    originalData.value.guarantee?.vpnActConnectedIpv4Prefix !== inputData.value.guarantee.vpnActConnectedIpv4Prefix ||
    originalData.value.guarantee?.vpnSbyConnectedIpv4Prefix !== inputData.value.guarantee.vpnSbyConnectedIpv4Prefix,
)
const saveDisabled = computed(() => {
  const invalid = Object.values(inputValid.value).some(valid =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  )
  const agreed = termsOfServiceAgreement.value.every(checked => checked.value)
  const checked = !needGuaranteeConfirmation.value || guaranteeCheckedConfirmation.value
  return (
    !editable.value ||
    requiredFirmwareUpdate.value ||
    invalid ||
    !inputMobileRatValid.value ||
    !changed.value ||
    (isConfirmation.value && (!agreed || !checked))
  )
})

watch(isConfirmation, () => {
  termsOfServiceAgreementRef.value = structuredClone(initialTermsOfServiceAgreement)
  guaranteeCheckedConfirmation.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

const requiredTrafficReportFlowAnalyzer = computed(
  () =>
    inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
      TrafficReportFlowAnalyzerPlanTypes.NoSubscription && !trafficReportFlowAnalyzerTermsOfServiceAccepted.value,
)
const requiredSecurity = computed(
  () =>
    ([inputData.value.threatDetection.threatDetectionPlan, inputData.value.flowCollector.flowCollectorPlan].some(
      plan => plan !== SecurityOptionTypes.NoSubscription,
    ) ||
      inputData.value.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription) &&
    !securityTermsOfServiceAccepted.value,
)
const requiredBehaviorDetection = computed(
  () =>
    inputData.value.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription &&
    currentSettingsBehaviorDetectionPlan.value === BehaviorDetectionPlanTypes.None,
)
const switchConfirm = async () => {
  await getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
  await getSecurityTermsOfServiceAccepted()
  await getSecurityHelpDesk()
  await getSettingsBehaviorDetection()

  openTermsOfServiceDialog.value =
    requiredTrafficReportFlowAnalyzer.value || requiredSecurity.value || requiredBehaviorDetection.value
  isConfirmation.value = !openTermsOfServiceDialog.value
}

const showHelpDeskCampaign = computed(() =>
  shouldShowHelpDeskCampaign(
    inputData.value.threatDetection.threatDetectionPlan,
    inputData.value.flowCollector.flowCollectorPlan,
    inputData.value.behaviorDetection.behaviorDetectionPlan,
  ),
)

const handleSubmit = async () => {
  const request = getPutRequest({
    original: { terminal: originalData.value, mobile: { rat: originalMobileRat.value } },
    terminal: inputData.value,
    mobile: { rat: inputMobileRat.value },
  })
  const response = await updateTerminal(terminalId.value, request)
  updatedOrderId.value = response.orderId ?? ''
  openSuccessDialog.value = true
  navigationGuard(false)
}

const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : switchConfirm
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})

const updateDefaultGatewayNexthopNetwork = (value: string) => {
  // nexthopNetwork を LAN 以外にしたときは nexthopIpv4Address と vpnRouting をクリアする
  if (value !== NetworkTypes.Lan) {
    inputData.value.defaultGateway = {
      ...inputData.value.defaultGateway,
      nexthopIpv4Address: '',
      vpnRouting: '',
    }
  } else {
    inputData.value.defaultGateway.vpnRouting = 'false'
  }
  inputData.value.defaultGateway.nexthopNetwork = value
  inputValid.value.defaultGateway.nexthopIpv4Address = value !== NetworkTypes.Lan
}

onBeforeMount(async () => {
  getAllGuaranteeList()
  getSummaryVpnList()
  getAllIpoeList()
  getAllResourceSummaryTerminalList({ terminalType: TerminalTypes.Rental })
  getBreakOutList()

  await getTerminal(terminalId.value)

  const valid = Object.keys(inputValid.value).reduce((acc, cur) => {
    if (typeof inputValid.value[cur as ValidKeys] === 'boolean') {
      return { ...acc, [cur]: true }
    }
    const objectValid = Object.keys(inputValid.value[cur as ValidKeys]).reduce((acc, cur) => {
      return { ...acc, [cur]: true }
    }, {})
    return { ...acc, [cur]: objectValid }
  }, structuredClone(initialTerminalValid))
  inputValid.value = valid
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-5">
      {{ t('confirm.update') }}
    </div>
    <!-- 利用回線選択 -->
    <EditCircuitTypes
      :primary-circuit-type="inputData.primaryCircuitType"
      :secondary-circuit-type="inputData.secondaryCircuitType"
      :disabled="isConfirmation || singleIpoeDisabled || inProgressSwitchover"
      :original="originalCircuitType"
      data-cy="terminals-id-edit-circuit-types"
      @checked="handleCircuitTypesChecked"
    />
    <!-- ルーター基本設定 -->
    <InnerCard :title="t('terminals.basicConfiguration')">
      <template #help>
        <i18n-t keypath="terminals.help.basicConfiguration" scope="global">
          <template #linkText>
            <NuxtLink :to="TERMINAL_LINK.BASE_SETTING" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <DetailGrid>
        <div>{{ t('terminals.terminalId') }}</div>
        <div>{{ terminal?.terminalId }}</div>
      </DetailGrid>
      <InputGrid required :label="t('terminals.name')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList, terminalId)]"
          required
          maxlength="64"
          placeholder="東京本社A館１号機"
          :disabled="isConfirmation || singleIpoeDisabled"
          data-cy="terminals-id-edit-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.installationPostalCode')">
        <SearchPostalCode
          v-model="inputData.installationPostalCode"
          v-model:address="inputData.installationAddress"
          v-model:valid="inputValid.installationPostalCode"
          :rules="[rules.postalCode]"
          required
          :disabled="isConfirmation || singleIpoeDisabled"
          :placeholder="t('placeholder.postalCode')"
          data-cy="terminals-id-edit-installation-postal-code"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.installationAddress')" :help="t('terminals.help.address')">
        <InputForm
          v-model="inputData.installationAddress"
          size="large"
          maxlength="300"
          required
          placeholder="東京都千代田区大手町２−３−１"
          :disabled="isConfirmation || singleIpoeDisabled"
          :rules="[
            rules.fullwidthCharacter,
            rules.forbiddenControlCharacter,
            rules.noSpaceAtBeginningAndEnd,
            rules.noConsecutiveSpaces,
            rules.startsWithPrefecture,
          ]"
          data-cy="terminals-id-edit-installation-address"
          @valid="(valid: boolean) => (inputValid.installationAddress = valid)"
        />
      </InputGrid>
    </InnerCard>

    <!-- リソース設定 -->
    <InnerCard :title="t('terminals.resourceSettings')">
      <InputGrid :required="isGuaranteeSelected" :label="t('terminals.guaranteeId')">
        <SelectForm
          v-model="inputData.guarantee.guaranteeId"
          :required="isGuaranteeSelected"
          :options="guaranteeListOptions"
          placeholder="Z000000002 / ギャランティアクセス名"
          :disabled="isConfirmation || !isGuaranteeSelected || inProgressSwitchover"
          size="middle"
          data-cy="terminals-id-edit-guarantee-guarantee-id"
          @valid="(valid: boolean) => (inputValid.guarantee.guaranteeId = valid)"
        />
      </InputGrid>
      <div v-if="isGuaranteeSelected" class="pl-5">
        <!-- インターネット -->
        <div class="mt-2 text-secondary text-lg">{{ t('terminals.internet') }}</div>
        <DetailGrid :label-width="271">
          <div>{{ t('terminals.globalIpAddress') }}</div>
          <div>{{ terminal?.guarantee?.internet?.globalIpAddress }}</div>
        </DetailGrid>
        <!-- VPN -->
        <div class="mt-2 text-secondary text-lg">{{ t('terminals.vpn') }}</div>
        <InputGrid :required="!isVpnIdEmpty" :label="t('terminals.connectionAddressAct')" :label-width="271">
          <InputFormWithCheckVpnRoutesButton
            v-model="inputData.guarantee.vpnActConnectedIpv4Prefix"
            :vpn-id="inputData.vpnId"
            :terminal-id="terminalId"
            :prefix="30"
            placeholder="192.0.2.4"
            :disabled="isConfirmation || isVpnIdEmpty"
            :required="!isVpnIdEmpty"
            :rules="[rules.ipAddress]"
            maxlength="15"
            size="small"
            data-cy="terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"
            @valid="(valid: boolean) => (inputValid.guarantee.vpnActConnectedIpv4Prefix = valid)"
          />
        </InputGrid>
        <InputGrid :required="!isVpnIdEmpty" :label="t('terminals.connectionAddressSby')" :label-width="271">
          <InputFormWithCheckVpnRoutesButton
            v-model="inputData.guarantee.vpnSbyConnectedIpv4Prefix"
            :vpn-id="inputData.vpnId"
            :terminal-id="terminalId"
            :prefix="30"
            placeholder="192.0.2.12"
            :disabled="isConfirmation || isVpnIdEmpty"
            :required="!isVpnIdEmpty"
            :rules="[rules.ipAddress]"
            maxlength="15"
            size="small"
            data-cy="terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"
            @valid="(valid: boolean) => (inputValid.guarantee.vpnSbyConnectedIpv4Prefix = valid)"
          />
        </InputGrid>
      </div>
      <InputGrid :required="isIpoeSelected" :label="t('terminals.ipoeId')">
        <SelectForm
          v-model="inputData.ipoeId"
          :options="attachableIpoeListOptions"
          placeholder="Z000000001 / IPoE回線名"
          :required="isIpoeSelected"
          :disabled="isConfirmation || !isIpoeSelected || ipoeIdDisabled"
          data-cy="terminals-id-edit-ipoe-id"
          @valid="(valid: boolean) => (inputValid.ipoeId = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('terminals.vpnIdName')" required :help-option="{ icon: IconTypes.Alert, color: 'warning' }">
        <template #help>
          <i18n-t keypath="terminals.help.vpnId" tag="span" scope="global" class="text-pre-wrap">
            <template #linkText>
              <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <SelectForm
          :model-value="inputData.vpnId"
          :options="vpnIdNameListOptions"
          placeholder="V000000002 / 拠点間通信用VPN"
          :disabled="isConfirmation || !hasGuaranteeVpnRateLimit || singleIpoeDisabled || inProgressSwitchover"
          size="middle"
          required
          data-cy="terminals-id-edit-vpn-id"
          @valid="(valid: boolean) => (inputValid.vpnId = valid)"
          @update:model-value="updateVpnId"
        />
        <template v-if="!hasGuaranteeVpnRateLimit" #footer>
          <TerminalNetworkNote :connection-type="NetworkTypes.Vpn" />
        </template>
      </InputGrid>
    </InnerCard>

    <!-- ルーター情報 -->
    <TerminalDevices :terminal="terminal" />

    <!-- ネットワーク設定 -->
    <InnerCard :title="t('terminals.networkSettings')">
      <template #help>
        <i18n-t keypath="terminals.help.networkSettings" scope="global">
          <template #linkText>
            <NuxtLink :to="TERMINAL_LINK.NETWORK_SETTING" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <div class="text-secondary text-lg pt-3">{{ t('terminals.basicSettings') }}</div>
      <!-- Loopbackアドレス -->
      <InputGrid
        required
        :label="t('terminals.loopbackIpv4Address')"
        :help="t('terminals.help.loopbackIpv4Address')"
        :help-option="{ contentWidth: 500 }"
      >
        <InputFormWithCheckVpnRoutesButton
          v-model="inputData.loopbackIpv4Address"
          :vpn-id="inputData.vpnId"
          :terminal-id="terminalId"
          required
          :rules="[rules.ipAddress, rules.inAcceptableRange]"
          maxlength="15"
          placeholder="172.16.0.1"
          :disabled="isConfirmation || singleIpoeDisabled"
          data-cy="terminals-id-edit-loopback-ipv4-address"
          @valid="(valid: boolean) => (inputValid.loopbackIpv4Address = valid)"
        />
        <template #footer>
          <div class="text-warning mt-2">
            <span>※</span>
            <i18n-t keypath="terminals.note.loopbackIpv4Address" tag="span" scope="global" class="text-pre-wrap">
              <template #linkText>
                <NuxtLink :to="TERMINAL_LINK.NETWORK_SETTING" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </div>
        </template>
      </InputGrid>
      <!-- LANタイプ -->
      <InputGrid
        required
        :label="t('terminals.lanType')"
        :help="t('terminals.help.lanType')"
        :help-option="{ contentWidth: 500 }"
      >
        <SelectForm
          v-model="inputData.lanType"
          :options="filteredLanTypeOptions"
          required
          :placeholder="filteredLanTypeOptions[0]?.text"
          :disabled="isConfirmation || singleIpoeDisabled || isRouter02"
          data-cy="terminals-id-edit-lan-type"
          @valid="(valid: boolean) => (inputValid.lanType = valid)"
        />
      </InputGrid>
      <!-- 直下セグメント -->
      <template v-if="inputData.lanType">
        <div class="flex-flex-start-center">
          <div class="required mt-3">{{ t('terminals.lans') }}</div>
          <HelpTooltip class="px-2 mt-3" size="smallMiddle">{{ t('terminals.help.lans') }}</HelpTooltip>
        </div>
        <EditLans
          v-model:values="inputData.lans"
          :vpn-id="inputData.vpnId"
          :terminal-id="terminalId"
          :lan-type="inputData.lanType"
          :disabled="isConfirmation || singleIpoeDisabled"
          :dhcp-server-disabled="dhcpServerDisabled"
          :hide-lan-in-filters="isRouter02"
          data-cy="terminals-id-edit-lans"
          @valid="(valid: boolean) => (inputValid.lans = valid)"
        />
      </template>
      <!-- デフォルトルート設定 -->
      <div class="flex-flex-start-center pt-3">
        <div class="text-secondary text-lg">{{ t('terminals.wanDefaultGateWay') }}</div>
        <HelpTooltip
          v-if="!hasGuaranteeInternetRateLimit"
          class="mt-2 ml-2"
          size="smallMiddle"
          color="error"
          :icon="IconTypes.AlertTriangle"
          :content-width="665"
        >
          <TerminalNetworkNote :connection-type="NetworkTypes.Internet" />
        </HelpTooltip>
      </div>
      <InputGrid required :label="t('terminals.nexthopNetwork')" :help="t('terminals.help.nexthopNetwork')">
        <SelectForm
          :model-value="inputData.defaultGateway.nexthopNetwork"
          :options="nexthopNetworkOptions"
          size="middle"
          required
          :placeholder="nexthopNetworkOptions[0]?.text"
          :disabled="isConfirmation || singleIpoeDisabled"
          data-cy="terminals-id-edit-default-gateway-nexthop-network"
          @valid="(valid: boolean) => (inputValid.defaultGateway.nexthopNetwork = valid)"
          @update:model-value="updateDefaultGatewayNexthopNetwork"
        />
        <template #footer>
          <i18n-t
            v-if="inputData.defaultGateway.nexthopNetwork"
            keypath="terminals.note.nexthopNetwork"
            tag="div"
            scope="global"
            class="mt-2"
          >
            <template #here>
              <NuxtLink :to="TERMINAL_LINK.NETWORK_SETTING" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
      </InputGrid>
      <template v-if="showDefaultGatewayNexthop">
        <InputGrid required :label="t('terminals.nexthopIpv4AddressDefaultGateway')">
          <InputForm
            v-model="inputData.defaultGateway.nexthopIpv4Address"
            :rules="[rules.ipAddress]"
            maxlength="15"
            placeholder="10.0.0.2"
            required
            :disabled="isConfirmation || singleIpoeDisabled"
            data-cy="terminals-id-edit-default-gateway-nexthop-ipv4-address"
            @valid="(valid: boolean) => (inputValid.defaultGateway.nexthopIpv4Address = valid)"
          />
        </InputGrid>
        <InputGrid
          class="pb-1"
          required
          :label="t('terminals.defaultRouteWithinVpn')"
          :help="t('terminals.help.defaultRouteWithinVpn')"
        >
          <RadioForm
            v-model="inputData.defaultGateway.vpnRouting"
            :options="wanDefaultGatewayVpnRoutingOptions"
            required
            :disabled="isConfirmation || singleIpoeDisabled"
            data-cy="terminals-id-edit-default-gateway-vpn-routing"
            @valid="(valid: boolean) => (inputValid.defaultGateway.vpnRouting = valid)"
          />
        </InputGrid>
      </template>
      <template v-if="showBreakOut">
        <InputGrid :label="t('terminals.breakOut')" required :help-option="{ icon: IconTypes.Alert, color: 'warning' }">
          <template #help>
            <i18n-t keypath="terminals.help.breakOut" tag="span" scope="global" class="text-pre-wrap">
              <template #linkText>
                <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>

          <MultipleSelectForm
            v-model="inputData.breakOut"
            :options="concatBreakOutOptions"
            :disabled="isConfirmation || !hasGuaranteeInternetRateLimit || singleIpoeDisabled"
            :max-itemas="8"
            :placeholder="breakOutOptions[0]?.text"
            data-cy="terminals-id-edit-break-out"
            required
            @valid="(valid: boolean) => (inputValid.breakOut = valid)"
          />
        </InputGrid>
        <InputGrid
          v-if="!isBreakOutEmpty"
          required
          :label="t('terminals.breakOutDnsServers')"
          :help="t('terminals.help.breakOutDnsServers')"
        >
          <MultipleInputForm
            v-model:values="inputData.interceptDnsServers"
            required
            :rules="[rules.ipAddress]"
            maxlength="15"
            :min-items="1"
            :max-items="8"
            placeholder="192.168.1.5"
            :disabled="isConfirmation || singleIpoeDisabled"
            data-cy="terminals-id-edit-break-out-dns-servers"
            @valid="(valid: boolean) => (inputValid.interceptDnsServers = valid)"
          />
        </InputGrid>
      </template>
    </InnerCard>

    <!-- フロー可視化 -->
    <EditTrafficReportFlowAnalyzer
      v-model="inputData.trafficReportFlowAnalyzer"
      v-model:valid="inputValid.trafficReportFlowAnalyzer"
      :initial-traffic-report-flow-analyzer="terminal?.trafficReportFlowAnalyzer"
      :primary-circuit-type="inputData.primaryCircuitType"
      :disabled="isConfirmation || singleIpoeDisabled"
    />

    <!-- セキュリティオプション -->
    <EditSecurityOptions
      v-model:threat-detection-plan="inputData.threatDetection.threatDetectionPlan"
      v-model:threat-detection-plan-valid="inputValid.threatDetection.threatDetectionPlan"
      v-model:flow-collector-plan="inputData.flowCollector.flowCollectorPlan"
      v-model:flow-collector-plan-valid="inputValid.flowCollector.flowCollectorPlan"
      v-model:behavior-detection-plan="inputData.behaviorDetection.behaviorDetectionPlan"
      v-model:behavior-detection-plan-valid="inputValid.behaviorDetection.behaviorDetectionPlan"
      :threat-detection="terminal?.threatDetection"
      :flow-collector="terminal?.flowCollector"
      :behavior-detection="terminal?.behaviorDetection"
      :disabled="isConfirmation || singleIpoeDisabled"
    />

    <!-- 端末詳細設定 -->
    <CollapseCard :title="t('terminals.detailSettings')" default-open>
      <template #help>
        <i18n-t keypath="terminals.help.detailSettings" scope="global">
          <template #linkText>
            <NuxtLink :to="TERMINAL_LINK.DETAIL_SETTING" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <!-- 拠点内セグメント（非直下セグメント） -->
      <div class="flex-flex-start-center">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.lanStaticRoutes') }}</div>
        <HelpTooltip class="mt-3" size="smallMiddle">{{ t('terminals.help.lanStaticRoutes') }}</HelpTooltip>
      </div>
      <EditLanStaticRoutes
        v-model:values="inputData.lanStaticRoutes"
        :vpn-id="inputData.vpnId"
        :terminal-id="terminalId"
        :disabled="isConfirmation || singleIpoeDisabled"
        data-cy="terminals-id-edit-lan-static-routes"
        @valid="(valid: boolean) => (inputValid.lanStaticRoutes = valid)"
      />

      <!-- WAN向けスタティックルート設定 -->
      <div class="flex-flex-start-center">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.wanStaticRoutes') }}</div>
        <HelpTooltip class="mx-2 mt-3" size="smallMiddle">{{ t('terminals.help.wanStaticRoutes') }}</HelpTooltip>
        <HelpTooltip
          v-if="!hasGuaranteeInternetRateLimit"
          class="mt-3"
          size="smallMiddle"
          color="error"
          :icon="IconTypes.AlertTriangle"
          :content-width="665"
        >
          <TerminalNetworkNote :connection-type="NetworkTypes.Internet" />
        </HelpTooltip>
      </div>
      <EditWanStaticRoutes
        v-model:values="inputData.wanStaticRoutes"
        :disabled="isConfirmation || singleIpoeDisabled"
        :has-guarantee-internet-rate-limit="hasGuaranteeInternetRateLimit"
        :has-vpn="!isVpnIdEmpty"
        data-cy="terminals-id-edit-wan-static-routes"
        @valid="(valid: boolean) => (inputValid.wanStaticRoutes = valid)"
      />

      <!-- WANポートフィルタ（VPN → 拠点） -->
      <div class="flex-flex-start-center">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.vpnInFilters') }}</div>
        <HelpTooltip class="mx-2 mt-3" size="smallMiddle" :content-width="700">
          <div>{{ t('terminals.help.vpnInFilters') }}</div>
          <div class="font-weight-bold text-decoration-underline mt-4">
            {{ t('terminals.help.filtersImage', { filterName: t('terminals.vpnInFilters') }) }}
          </div>
          <img src="~/assets/images/vpn-in-filters.png" width="600px" class="mt-2" />
        </HelpTooltip>
      </div>
      <EditFilters
        v-model="inputData.vpnInFilters"
        :disabled="isConfirmation || isVpnIdEmpty || singleIpoeDisabled"
        :edit-access-list-option="{
          title: t('terminals.vpnInFilters'),
          sourceIpv4PrefixPlaceholder: '192.168.3.0/24',
          destinationIpv4PrefixPlaceholder: '192.168.1.0/24',
        }"
        data-cy="terminals-id-edit-vpn-in-filters"
        @valid="(valid: boolean) => (inputValid.vpnInFilters = valid)"
      />

      <!-- WANポートフィルタ（拠点 → VPN） -->
      <div class="flex-flex-start-center">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.vpnOutFilters') }}</div>
        <HelpTooltip class="mx-2 mt-3" size="smallMiddle" :content-width="700">
          <div>{{ t('terminals.help.vpnOutFilters') }}</div>
          <div class="font-weight-bold text-decoration-underline mt-4">
            {{ t('terminals.help.filtersImage', { filterName: t('terminals.vpnOutFilters') }) }}
          </div>
          <img src="~/assets/images/vpn-out-filters.png" width="600px" class="mt-2" />
        </HelpTooltip>
      </div>
      <EditFilters
        v-model="inputData.vpnOutFilters"
        :disabled="isConfirmation || isVpnIdEmpty || singleIpoeDisabled"
        :edit-access-list-option="{
          title: t('terminals.vpnOutFilters'),
          sourceIpv4PrefixPlaceholder: '192.168.1.0/24',
          destinationIpv4PrefixPlaceholder: '192.168.3.0/24',
        }"
        data-cy="terminals-id-edit-vpn-out-filters"
        @valid="(valid: boolean) => (inputValid.vpnOutFilters = valid)"
      />

      <!-- WANポートフィルタ（拠点 → Internet） -->
      <div class="flex-flex-start-center">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.inet4OutFilters') }}</div>
        <HelpTooltip class="mx-2 mt-3" size="smallMiddle" :content-width="700">
          <div>{{ t('terminals.help.inet4OutFilters') }}</div>
          <div class="font-weight-bold text-decoration-underline mt-4">
            {{ t('terminals.help.filtersImage', { filterName: t('terminals.inet4OutFilters') }) }}
          </div>
          <img src="~/assets/images/inet4-out-filters.png" width="600px" class="mt-2" />
        </HelpTooltip>
      </div>
      <EditFilters
        v-model="inputData.inet4OutFilters"
        :disabled="isConfirmation || singleIpoeDisabled"
        :edit-access-list-option="{
          title: t('terminals.inet4OutFilters'),
          sourceIpv4PrefixPlaceholder: '192.168.1.0/24',
          destinationIpv4PrefixPlaceholder: '8.8.8.8/32',
        }"
        data-cy="terminals-id-edit-inet4-out-filters"
        @valid="(valid: boolean) => (inputValid.inet4OutFilters = valid)"
      />

      <!-- DHCP Relay -->
      <div class="flex-flex-start-center">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.relay') }}</div>
        <HelpTooltip class="mx-2 mt-3" size="smallMiddle">{{ t('terminals.help.dhcpRelay') }}</HelpTooltip>
      </div>
      <div v-if="!showDhcpRelayServers">
        {{ t('terminals.message.dhcpSettings') }}
      </div>
      <InputGrid v-else :label="t('terminals.serverIpv4Address')">
        <MultipleInputForm
          v-model:values="inputData.dhcpRelayServers"
          :rules="[rules.ipAddress]"
          maxlength="15"
          placeholder="192.168.1.5"
          :max-items="4"
          :disabled="isConfirmation || singleIpoeDisabled"
          data-cy="terminals-id-edit-dhcp-relay-servers"
          @valid="(valid: boolean) => (inputValid.dhcpRelayServers = valid)"
        />
      </InputGrid>
    </CollapseCard>

    <!-- 配送先情報 -->
    <InnerCard :title="t('terminals.deliveryInformation')">
      <template #help>
        <i18n-t keypath="terminals.help.deliveryInformation" scope="global">
          <template #linkText>
            <NuxtLink :to="TERMINAL_LINK.DELIVERY" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
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

    <!-- 迂回設定 -->
    <InnerCard v-if="showRouteSwitchStatus" :title="t('terminals.operations.switchover')">
      <DetailGrid>
        <div>{{ t('terminals.routeSwitchStatus') }}</div>
        <div>{{ inProgressSwitchover ? t('terminals.isSwitchover') : t('terminals.isSwitchback') }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- モバイル申し込み情報 -->
    <InnerCard v-if="!!terminal?.mobile" :title="t('terminals.mobileInformation')">
      <InputGrid :label="t('terminals.mobileRat')">
        <RadioForm
          v-model="inputMobileRat"
          :options="mobileRatOptions"
          :disabled="isConfirmation || singleIpoeDisabled"
          data-cy="terminals-id-edit-mobile-rat"
          @valid="(valid: boolean) => (inputMobileRatValid = valid)"
        />
      </InputGrid>
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

    <!-- 規約同意 -->
    <template v-if="isConfirmation">
      <TerminalTermsOfService
        v-for="agreement in termsOfServiceAgreement"
        :key="agreement.key"
        v-model="agreement.value"
        :type="agreement.key"
        :data-cy="`terminal-id-edit-terminal-terms-of-service-${agreement.key}`"
      />
      <!-- ギャランティアクセスのVPNアドレスの変更確認 -->
      <InnerCard v-if="needGuaranteeConfirmation" data-cy="terminals-id-edit-update-guarantee-message">
        <div class="text-center text-pre-wrap text-warning">{{ t('terminals.note.updateGuarantee') }}</div>
        <TermOfServiceCheckbox
          v-model="guaranteeCheckedConfirmation"
          :label="t('confirm.confirmed')"
          class="mt-2 flex-center-center"
        />
      </InnerCard>
      <!-- ギャランティアクセスのVPN/Internetの削除注意事項 -->
      <TerminalEditCaution :edit-data="inputData" :original-data="originalData" />

      <!-- 電源OFF時の変更制限の注意喚起 -->
      <div class="text-warning mb-4">
        <i18n-t keypath="terminals.note.checkRouterPower" scope="global">
          <template #here>
            <NuxtLink :to="TERMINAL_LINK.RINK_0153" target="_blank">{{ t('common.here') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </template>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="terminals-id-edit-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="saveDisabled || loading"
        :text="submit.text"
        :width="180"
        data-cy="terminals-id-edit-submit-button"
        @click="submit.click"
      />
    </div>
    <div v-if="requiredFirmwareUpdate" class="flex-flex-end-center text-error text-pre-wrap">
      {{ t('terminals.message.editRequiredFirmwareUpdate') }}
    </div>

    <!-- ブレイクアウトの詳細表示ダイアログ -->
    <BreakOutDetailDialog :break-out="currentBreakOut" @close="() => (currentBreakOut = undefined)" />
    <TermsOfServiceConfirmDialog
      :open="openTermsOfServiceDialog"
      :tenant-id="tenantId"
      :show-traffic-report-flow-analyzer="requiredTrafficReportFlowAnalyzer"
      :show-security="requiredSecurity"
      :show-behavior-detection="requiredBehaviorDetection"
      @close="openTermsOfServiceDialog = false"
    />
    <TerminalSuccessDialog
      :open="openSuccessDialog"
      :order-id="updatedOrderId"
      :show-help-desk-campaign="showHelpDeskCampaign"
      @close="router.back()"
    />
  </CardContainer>
</template>

<style scoped lang="scss">
.collapse-title {
  padding-top: 0.75rem;
  padding-bottom: 0.25rem;
}
.required::after {
  content: '*';
  color: rgb(var(--v-theme-error));
}
</style>
