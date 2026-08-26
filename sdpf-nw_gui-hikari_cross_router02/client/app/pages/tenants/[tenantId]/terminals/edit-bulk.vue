<script lang="ts" setup>
import { difference, intersection, isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import {
  CircuitTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  ResourceStatusTypes,
  TerminalTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
} from '@/api/constants'
import {
  type TERMINAL_EDIT_BULK_KEYS,
  TERMINAL_LINK,
  TERMINAL_MAX_SELECTABLE_LIMIT,
  DhcpTypes,
  NetworkTypes,
  initialEditBulkTerminalInputData,
  initialEditBulkTerminalValid,
  initialTermsOfServiceAgreement,
  initialEditBulkPutKeyParams,
} from '@/api/terminals/constants'
import type { BreakOutResponse } from '@/api/breakOut/types'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import type { ResourceSummaryTerminalResponse } from '@/api/terminals/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { IconTypes } from '@/components/icons/constants'
import { UNSELECTED_VALUE } from '@/components/input/constants'
import { TenantPages, SecurityContractsPages, GuaranteePages } from '@/components/sidebar/constants'
import type { MultiLevelHeaderType, SortOption } from '@/components/table/types'

const SELF_TERMINAL_EDITABLE_KEYS = [
  'vpnId',
  'trafficReportFlowAnalyzerPlan',
  'trafficReportFlowAnalyzerAlert',
  'threatDetectionPlan',
  'flowCollectorPlan',
  'behaviorDetectionPlan',
] as const
const CircuitTypeRoutePath = {
  [CircuitTypes.Guarantee]: `${TenantPages.Guarantees}/${GuaranteePages.Circuits}`,
  [CircuitTypes.Ipoe]: `${TenantPages.Ipoes}`,
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rules = useRules()
const tenantId = computed(() => route.params.tenantId as string)

const securityOptionRef = ref<HTMLElement>()
const prevPath = computed(() => router.options.history.state.back?.toString() ?? '')
const isPreviousPageSecurityContractsSummary = computed(() => {
  return prevPath.value.includes(`${TenantPages.SecurityContracts}/${SecurityContractsPages.Summary}`)
})
const previousPageTerminalIds = computed(() => {
  const params = new URLSearchParams(prevPath.value.split('?')[1] ?? '')
  return isPreviousPageSecurityContractsSummary.value ? params.getAll('terminalId') : undefined
})

const { updateTerminalBulk } = useUpdateTerminalBulk()
const { terminalIdOptions, resourceSummaryTerminalList, getAllResourceSummaryTerminalList } =
  useGetAllResourceSummaryTerminalList()
const { terminalTableList, terminalTableQuery, terminalSortOption, terminalTablePagination, getTerminalTableList } =
  useGetTerminalTableList()
const {
  networkTypeOptions,
  breakOutOptions,
  trafficReportFlowAnalyzerPlanOptions,
  trafficReportFlowAnalyzerAlertOptions,
  threatDetectionPlanOptions,
  flowCollectorPlanOptions,
  behaviorDetectionPlanOptions,
  getTerminalBulkPutRequest,
  getTrafficReportFlowAnalyzerPlanText,
  getTrafficReportFlowAnalyzerAlertText,
  getFlowCollectorPlanText,
  getThreatDetectionPlanText,
  getBehaviorDetectionPlanText,
} = useTerminalInput()

const { navigationGuard } = useNavigationGuard()
const { getSummaryVpnList, unterminatedVpnListOptions } = useGetSummaryVpnList()
const { getBreakOutList, breakOutList } = useGetBreakOutList()
const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)
const { getSecurityHelpDesk, shouldShowHelpDeskCampaign } = useGetSecurityHelpDesk()

const { currentSettingsBehaviorDetectionPlan, getSettingsBehaviorDetection } = useGetSettingsBehaviorDetection()

const inputData = ref(structuredClone(initialEditBulkTerminalInputData))
const inputValid = ref(structuredClone(initialEditBulkTerminalValid))
const isConfirmation = ref(false)
const openTermsOfServiceDialog = ref(false)
const openSuccessDialog = ref(false)

const submitParams = ref({ ...initialEditBulkPutKeyParams })

const columnWidths = computed(() => {
  const cw = [
    { key: 'selector', width: 100 },
    { key: 'terminalId', width: 125 },
    { key: 'terminalType', width: 160 },
    { key: 'customerNote' },
    { key: 'primaryCircuit', width: 144 },
    { key: 'primaryCircuitId', width: 121 },
    { key: 'secondaryCircuit', width: 144 },
    { key: 'secondaryCircuitId', width: 121 },
    { key: 'vpnId', width: 176 },
    { key: 'threatDetectionPlan', width: 121 },
    { key: 'flowCollectorPlan', width: 163 },
    { key: 'behaviorDetectionPlan', width: 163 },
    { key: 'trafficReportFlowAnalyzerPlan', width: 163 },
    { key: 'trafficReportFlowAnalyzerAlert', width: 150 },
  ]
  return isConfirmation.value ? cw.slice(1) : cw
})

const multiLevelHeaders = computed<MultiLevelHeaderType[][]>(() => {
  const mh = [
    [
      { key: 'selector', text: '', colSpan: 1, rowSpan: 2, bottom: true },
      {
        key: 'terminalId',
        text: t('terminals.terminalId'),
        colSpan: 1,
        rowSpan: 2,
        bottom: true,
        class: 'text-sm mr-1',
      },
      {
        key: 'terminalType',
        text: t('guarantees.terminalType'),
        colSpan: 1,
        rowSpan: 2,
        bottom: true,
        class: 'text-sm mr-1',
      },
      { key: 'customerNote', text: t('terminals.name'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
      { key: undefined, text: t('terminals.primary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
      { key: undefined, text: t('terminals.secondary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
      { key: 'vpnId', text: t('terminals.vpnId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm' },
      {
        key: 'threatDetectionPlan',
        text: t('terminals.threatDetectionPlan'),
        colSpan: 1,
        rowSpan: 2,
        bottom: true,
        class: 'text-sm mr-1',
      },
      {
        key: 'flowCollectorPlan',
        text: t('terminals.flowCollectorPlan'),
        colSpan: 1,
        rowSpan: 2,
        bottom: true,
        class: 'text-sm mr-1',
      },
      {
        key: 'behaviorDetectionPlan',
        text: t('terminals.behaviorDetection'),
        colSpan: 1,
        rowSpan: 2,
        bottom: true,
        class: 'text-sm mr-1',
      },
      {
        key: undefined,
        text: t('terminals.trafficReportFlowAnalyzerPlanOptions'),
        colSpan: 2,
        rowSpan: 1,
        class: 'text-sm',
      },
    ],
    [
      {
        key: 'primaryCircuit',
        text: t('terminals.circuitType'),
        colSpan: 1,
        rowSpan: 1,
        bottom: true,
        class: 'text-sm',
      },
      {
        key: 'primaryCircuitId',
        text: t('terminals.circuitId'),
        colSpan: 1,
        rowSpan: 1,
        bottom: true,
        class: 'text-sm',
      },
      {
        key: 'secondaryCircuit',
        text: t('terminals.circuitType'),
        colSpan: 1,
        rowSpan: 1,
        bottom: true,
        class: 'text-sm',
      },
      {
        key: 'secondaryCircuitId',
        text: t('terminals.circuitId'),
        colSpan: 1,
        rowSpan: 1,
        bottom: true,
        class: 'text-sm',
      },
      {
        key: 'trafficReportFlowAnalyzerPlan',
        text: t('terminals.trafficReportFlowAnalyzerPlan'),
        colSpan: 1,
        rowSpan: 1,
        bottom: true,
        class: 'text-xs',
      },
      {
        key: 'trafficReportFlowAnalyzerAlert',
        text: t('terminals.trafficReportFlowAnalyzerAlert'),
        colSpan: 1,
        rowSpan: 1,
        bottom: true,
        class: 'text-xs text-pre-wrap',
      },
    ],
  ]
  return isConfirmation.value ? [mh[0]?.slice(1) ?? [], mh[1] ?? []] : mh
})
const slotNames = computed(() => {
  const names = [
    'selector',
    'terminalId',
    'terminalType',
    'customerNote',
    'primaryCircuit',
    'primaryCircuitId',
    'secondaryCircuit',
    'secondaryCircuitId',
    'vpnId',
    'threatDetectionPlan',
    'flowCollectorPlan',
    'behaviorDetectionPlan',
    'trafficReportFlowAnalyzerPlan',
    'trafficReportFlowAnalyzerAlert',
  ]
  return isConfirmation.value ? names.slice(1) : names
})

const selectedTerminalIds = ref<string[]>([])
const areAllVisibleRowsSelected = computed(() =>
  // テーブルに表示してる端末が全て選択されているかどうか
  items.value.every(terminal => selectedTerminalIds.value.includes(terminal.terminalId)),
)
const indeterminate = computed(() => selectedTerminalIds.value.length > 0)
const checkboxDisabled = computed(() => selectedTerminalIds.value.length >= TERMINAL_MAX_SELECTABLE_LIMIT)

const getTableItems = (terminal: ResourceSummaryTerminalResponse) => ({
  terminalId: terminal.terminalId,
  terminalType: terminal.terminalType,
  terminalPath: terminal.terminalType === TerminalTypes.Rental ? TenantPages.Terminals : TenantPages.SelfTerminals,
  customerNote: terminal.customerNote,
  primaryCircuit: terminal.primaryCircuit.circuitType,
  primaryCircuitId: terminal.primaryCircuit?.circuitId,
  secondaryCircuit: terminal.secondaryCircuit?.circuitType,
  secondaryCircuitId: terminal.secondaryCircuit?.circuitId,
  vpnId: terminal.vpnId,
  threatDetectionPlan: terminal.threatDetection.threatDetectionPlan,
  flowCollectorPlan: terminal.flowCollector.flowCollectorPlan,
  behaviorDetectionPlan: terminal.behaviorDetection.behaviorDetectionPlan,
  trafficReportFlowAnalyzerPlan: terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
  trafficReportFlowAnalyzerAlert: terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert,
})
const selectedItems = computed(() =>
  resourceSummaryTerminalList.value.terminals
    .filter(terminal => selectedTerminalIds.value.includes(terminal.terminalId))
    .map(terminal => {
      const data = getTableItems(terminal)
      return { ...data, selector: true, selectable: true }
    }),
)
const items = computed(() =>
  terminalTableList.value.terminals.map(terminal => {
    const data = getTableItems(terminal)
    // フロー可視化にチェックが入っている場合はギャランティに紐づかないルーターは選択できない
    const unselectable =
      (submitParams.value.trafficReportFlowAnalyzerPlan || submitParams.value.trafficReportFlowAnalyzerAlert) &&
      terminal.primaryCircuit.circuitType !== CircuitTypes.Guarantee
    return {
      ...data,
      selector: selectedTerminalIds.value.includes(terminal.terminalId),
      selectable: !unselectable && (terminal.terminalType === TerminalTypes.Rental || !unselectableSelfTerminal.value),
    }
  }),
)

// 自営ルーターを選択した時は 更新できる要素が制限される
const unselectableSelfTerminal = computed(() =>
  Object.entries(submitParams.value).some(([key, checked]) => !SELF_TERMINAL_EDITABLE_KEYS.includes(key) && checked),
)
const selectedSelfTerminal = computed(() =>
  selectedItems.value.some(terminal => terminal.terminalType === TerminalTypes.Self),
)
// ギャランティに紐づかないルーターを選択した場合はフロー可視化の更新不可
const trafficReportFlowAnalyzerDisabled = computed(() =>
  selectedItems.value.some(terminal => terminal.primaryCircuit !== CircuitTypes.Guarantee),
)
const isPlanNoSubscription = computed(
  () =>
    inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
    TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
)
watch(
  () => inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
  next => {
    // プランを「利用しない」にした場合 アラートは自動でチェックされ「利用しない」が選択される
    if (next === TrafficReportFlowAnalyzerPlanTypes.NoSubscription) {
      submitParams.value.trafficReportFlowAnalyzerAlert = true
      inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert = 'false'
    }
  },
)
const vpnIdNameListOptions = computed(() => [
  { text: t('vpn.unselected'), value: UNSELECTED_VALUE },
  ...unterminatedVpnListOptions.value,
])

const showWanDefaultGateWayLabel = computed(
  () =>
    submitParams.value.nexthopNetwork ||
    submitParams.value.breakOut ||
    submitParams.value.interceptDnsServers ||
    !isConfirmation.value,
)

const breakOutDisabled = computed(() => inputData.value.defaultGateway.nexthopNetwork === NetworkTypes.Internet)
watch(breakOutDisabled, next => {
  // breakOutDisabled = true の場合は breakOut と interceptDnsServers のチェックボックスを常に true にして入力値は空にする
  if (next) {
    submitParams.value.breakOut = true
    submitParams.value.interceptDnsServers = true
    inputData.value.breakOut = [UNSELECTED_VALUE] // breakOut の空状態
    inputData.value.interceptDnsServers = []
    inputValid.value.breakOut = true
    inputValid.value.interceptDnsServers = true
  } else {
    inputData.value.breakOut = []
    submitParams.value.breakOut = false
    submitParams.value.interceptDnsServers = false
  }
})

const isBreakOutEmpty = computed(
  () =>
    submitParams.value.breakOut &&
    (inputData.value.breakOut.length === 0 || inputData.value.breakOut.includes(UNSELECTED_VALUE)),
)
watch(isBreakOutEmpty, next => {
  if (next) {
    // breakOut が空の場合は interceptDnsServers のチェックボックスを常に true にして入力値は空にする
    submitParams.value.interceptDnsServers = true
    inputData.value.interceptDnsServers = []
    inputValid.value.interceptDnsServers = true
  } else {
    submitParams.value.interceptDnsServers = false
  }
})

const isBulkUpdateParameterSelected = computed(() => {
  // submit.trafficReportFlowAnalyzerPlanとsubmit.threatDetectionPlan, submit.flowCollectorPlan以外の項目が選択された場合はtrue
  return Object.entries(submitParams.value).some(
    ([key, value]) =>
      !['trafficReportFlowAnalyzerPlan', 'threatDetectionPlan', 'flowCollectorPlan'].includes(key) && value,
  )
})

const nexthopNetworkOptions = computed(() => networkTypeOptions.filter(v => v.value !== NetworkTypes.Lan))
const dhcpType = ref('')
const updateDhcpType = (type: string) => {
  dhcpType.value = type
  if (type === DhcpTypes.Server) {
    inputData.value.dhcpRelayServers = []
    inputValid.value.dhcpRelayServers = true
    inputData.value.dhcpServer = {
      ...inputData.value.dhcpServer,
      primaryDnsServer: '202.234.232.6',
      secondaryDnsServer: '221.113.139.250',
    }
    inputValid.value.dhcpServer = {
      ...inputValid.value.dhcpServer,
      primaryDnsServer: true,
      secondaryDnsServer: true,
    }
  } else if (type === DhcpTypes.Relay) {
    inputData.value.dhcpServer = { ...initialEditBulkTerminalInputData.dhcpServer }
    inputValid.value.dhcpServer = { ...initialEditBulkTerminalValid.dhcpServer }
  } else {
    inputData.value.dhcpServer = { ...initialEditBulkTerminalInputData.dhcpServer }
    inputValid.value.dhcpServer = { ...initialEditBulkTerminalValid.dhcpServer }
    inputData.value.dhcpRelayServers = []
    inputValid.value.dhcpRelayServers = true
  }
}

const currentBreakOut = ref<BreakOutResponse>()
const openBreakoutDialog = (breakOut: BreakOutResponse) => {
  currentBreakOut.value = breakOut
}
const concatBreakOutOptions = computed(() =>
  breakOutList.value.reduce<Array<{ text: string; value: string; button?: { click: () => void } }>>(
    (options, breakOut) => {
      options.push({
        text: breakOut.customerNote || breakOut.breakOutListId,
        value: breakOut.breakOutListId,
        button: { click: () => openBreakoutDialog(breakOut) },
      })
      return options
    },
    [{ text: t('breakOut.unselected'), value: UNSELECTED_VALUE }, ...breakOutOptions],
  ),
)

// 利用規約の表示
const termsOfServiceAgreementRef = ref(structuredClone(initialTermsOfServiceAgreement))
const termsOfServiceAgreement = computed({
  get: () =>
    termsOfServiceAgreementRef.value.filter(checked => {
      switch (checked.key) {
        case 'vpn-id':
          //  VPN IDが入力されている場合
          return !!inputData.value.vpnId && inputData.value.vpnId !== UNSELECTED_VALUE
        case 'break-out':
          // ブレイクアウトが選択されている場合
          return inputData.value.breakOut.length > 0 && !inputData.value.breakOut.includes(UNSELECTED_VALUE)
        case 'wan-security-options':
          // セキュリティオプションが選択されている場合
          return (
            (inputData.value.threatDetectionPlan &&
              inputData.value.threatDetectionPlan !== SecurityOptionTypes.NoSubscription) ||
            (inputData.value.flowCollectorPlan &&
              inputData.value.flowCollectorPlan !== SecurityOptionTypes.NoSubscription) ||
            (inputData.value.behaviorDetectionPlan &&
              inputData.value.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription)
          )
        case 'traffic-report-flow-analyzer':
          // フロー可視化オプションが選択されている場合
          return (
            inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan &&
            inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
              TrafficReportFlowAnalyzerPlanTypes.NoSubscription
          )
        default:
          return false
      }
    }),
  set: val => {
    termsOfServiceAgreementRef.value = val
  },
})

watchEffect(() => {
  navigationGuard(!isEqual(inputData.value, structuredClone(initialEditBulkTerminalInputData)))
})

const saveDisabled = computed(() => {
  const invalid = Object.values(inputValid.value).some(valid =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  )
  const isInputDataEmpty = isEqual(inputData.value, initialEditBulkTerminalInputData)
  const agreed = termsOfServiceAgreement.value.every(checked => checked.value)
  return (
    invalid ||
    isInputDataEmpty ||
    selectedTerminalIds.value.length === 0 ||
    Object.values(submitParams.value).every(v => !v) ||
    (isConfirmation.value && !agreed)
  )
})
watch(isConfirmation, () => {
  termsOfServiceAgreementRef.value = structuredClone(initialTermsOfServiceAgreement)
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

const isSubscribed = (plan: string) => ![TrafficReportFlowAnalyzerPlanTypes.NoSubscription, ''].includes(plan)

const requiredTrafficReportFlowAnalyzer = computed(
  () =>
    isSubscribed(inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan) &&
    !trafficReportFlowAnalyzerTermsOfServiceAccepted.value,
)

const requiredSecurity = computed(
  () =>
    (isSubscribed(inputData.value.threatDetectionPlan) ||
      isSubscribed(inputData.value.flowCollectorPlan) ||
      isSubscribed(inputData.value.behaviorDetectionPlan)) &&
    !securityTermsOfServiceAccepted.value,
)

const requiredBehaviorDetection = computed(
  () =>
    isSubscribed(inputData.value.behaviorDetectionPlan) &&
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
    inputData.value.threatDetectionPlan,
    inputData.value.flowCollectorPlan,
    inputData.value.behaviorDetectionPlan,
  ),
)

const handleSubmit = async () => {
  await getAllResourceSummaryTerminalList({
    resourceStatus: [ResourceStatusTypes.Active],
  })
  try {
    const request = getTerminalBulkPutRequest(inputData.value, submitParams.value, selectedItems.value)
    await updateTerminalBulk(request)
  } catch (error) {
    console.error(error)
  } finally {
    // error は無視して完了ダイアログを表示する
    openSuccessDialog.value = true
    navigationGuard(false)
  }
}
const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : switchConfirm
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})
const { loading } = useLoading()

const handleSearch = () => {
  selectedTerminalIds.value = []
  getTerminalTableList({ ...terminalTableQuery.value, offset: 0 })
}
const handleChangeLimit = (limit?: number) => {
  getTerminalTableList({ ...terminalTableQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  getTerminalTableList({ ...terminalTableQuery.value, offset: page - 1 })
}
const handleSort = (option?: SortOption) => {
  getTerminalTableList({ ...terminalTableQuery.value, sortKey: option?.sortKey, direction: option?.direction })
}
const handleSelectorClick = (checked: boolean, id: string) => {
  if (checked) {
    selectedTerminalIds.value = [...selectedTerminalIds.value, id]
  } else {
    selectedTerminalIds.value = selectedTerminalIds.value.filter(terminalId => terminalId !== id)
  }
}

const tableTerminalIds = computed(() => items.value.filter(item => item.selectable).map(item => item.terminalId))
const addableCounts = computed(() => TERMINAL_MAX_SELECTABLE_LIMIT - selectedTerminalIds.value.length)
const handleSelectAllClick = (checked: boolean) => {
  if (checked) {
    // テーブル表示上の選択可能な端末IDだけ取得する
    const newIds = difference(tableTerminalIds.value, intersection(selectedTerminalIds.value, tableTerminalIds.value))
    // 選択可能な上限を超える場合は選択可能な数だけ追加する
    if (newIds.length > addableCounts.value) {
      selectedTerminalIds.value = [...selectedTerminalIds.value, ...newIds.slice(0, addableCounts.value)]
    } else {
      selectedTerminalIds.value = [...selectedTerminalIds.value, ...newIds]
    }
  } else {
    selectedTerminalIds.value = difference(selectedTerminalIds.value, tableTerminalIds.value)
  }
}
const handleSubmitParamsCheckboxClick = (checked: boolean, key: (typeof TERMINAL_EDIT_BULK_KEYS)[number]) => {
  submitParams.value[key] = checked
  switch (key) {
    case 'trafficReportFlowAnalyzerPlan':
      inputData.value.trafficReportFlowAnalyzer[key] = checked ? TrafficReportFlowAnalyzerPlanTypes.FreePlan : ''
      inputValid.value.trafficReportFlowAnalyzer[key] = true
      break
    case 'trafficReportFlowAnalyzerAlert':
      inputData.value.trafficReportFlowAnalyzer[key] = checked ? 'true' : ''
      inputValid.value.trafficReportFlowAnalyzer[key] = true
      break
    case 'vpnId':
    case 'threatDetectionPlan':
    case 'flowCollectorPlan':
    case 'behaviorDetectionPlan':
      inputData.value[key] = ''
      inputValid.value[key] = !checked
      break
    case 'nexthopNetwork':
      inputData.value.defaultGateway.nexthopNetwork = ''
      inputValid.value.defaultGateway.nexthopNetwork = !checked
      break
    case 'breakOut':
    case 'interceptDnsServers':
    case 'wanStaticRoutes':
      inputData.value[key] = []
      inputValid.value[key] = key !== 'breakOut' || !checked
      break
    case 'vpnInFilters':
    case 'vpnOutFilters':
    case 'inet4OutFilters':
      inputData.value[key].defaultPolicy = ''
      inputData.value[key].accessControlList = []
      inputValid.value[key] = true
      break
    case 'dhcp':
      dhcpType.value = !checked ? '' : DhcpTypes.None
      inputData.value.dhcpServer = { ...initialEditBulkTerminalInputData.dhcpServer }
      inputValid.value.dhcpServer = { ...initialEditBulkTerminalValid.dhcpServer }
      inputData.value.dhcpRelayServers = []
      inputValid.value.dhcpRelayServers = true
      break
    default:
      break
  }
}

onMounted(async () => {
  // securityOptionRef.value が表示されるまで少し待つ
  await sleep(300)
  if (isPreviousPageSecurityContractsSummary.value && securityOptionRef.value) {
    securityOptionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
onBeforeMount(() => {
  getSummaryVpnList()
  getBreakOutList()
  getAllResourceSummaryTerminalList({
    resourceStatus: [ResourceStatusTypes.Active],
  })
  selectedTerminalIds.value = previousPageTerminalIds.value ?? []
  getTerminalTableList({
    direction: 'desc',
    sortKey: 'terminalId',
    terminalId: previousPageTerminalIds.value,
    resourceStatus: [ResourceStatusTypes.Active],
  })
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Terminal" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ `${t('sideBar.terminal')} ${t('terminals.editBulk')}` }}</div>
    </div>
    <div v-if="isConfirmation" class="mb-5">
      {{ t('confirm.update') }}
    </div>
    <template v-if="!isConfirmation">
      <SearchFilter @search="handleSearch" @clear="terminalTableQuery.terminalId = undefined">
        <InputGrid :label="`${t('terminals.terminalId')} / ${t('terminals.name')}`" :label-width="180">
          <MultipleSelectForm
            :model-value="terminalTableQuery?.terminalId ?? []"
            :options="terminalIdOptions"
            placeholder="Z000000001 / ルーター名1, Z000000002 / ルーター名2,..."
            @update:model-value="
              (value: string[]) => (terminalTableQuery.terminalId = value.length > 0 ? value : undefined)
            "
          />
        </InputGrid>
      </SearchFilter>
      <PaginationHeader
        :page="terminalTablePagination.page"
        :limit="terminalTablePagination.limit"
        :total="terminalTableList?.total ?? 0"
        :selected="{ max: TERMINAL_MAX_SELECTABLE_LIMIT, counts: selectedTerminalIds.length }"
        @update:limit="handleChangeLimit"
      />
    </template>

    <MultiLevelHeaderSortableTable
      :multi-level-headers="multiLevelHeaders"
      :column-widths="columnWidths"
      :items="isConfirmation ? selectedItems : items"
      :slot-names="slotNames"
      :key-items="['terminalId']"
      :sort="terminalSortOption"
      :unsortable-keys="['selector', 'primaryCircuit', 'primaryCircuitId', 'secondaryCircuit', 'secondaryCircuitId']"
      @sort="handleSort"
    >
      <template #header-selector>
        <div class="w-100px d-flex justify-center">
          <CheckboxBase
            :value="areAllVisibleRowsSelected"
            :indeterminate="indeterminate"
            :disabled="checkboxDisabled && !areAllVisibleRowsSelected"
            @update:value="handleSelectAllClick"
          />
        </div>
      </template>
      <template #selector="{ row }">
        <div class="w-100px d-flex justify-center">
          <CheckboxBase
            :value="row.selector"
            :disabled="(checkboxDisabled && !row.selector) || !row.selectable"
            :data-cy="`terminals-edit-bulk-selector-${row.terminalId}`"
            @update:value="(checked: boolean) => handleSelectorClick(checked, row.terminalId)"
          />
        </div>
      </template>
      <template #terminalId="{ row }">
        <NuxtLink
          :to="`/tenants/${tenantId}/${row.terminalPath}/${row.terminalId}`"
          data-cy="terminals-edit-bulk-terminal-id"
        >
          {{ row.terminalId }}
        </NuxtLink>
      </template>
      <template #terminalType="{ row }">
        <div class="text-xs">
          {{ row.terminalType === TerminalTypes.Rental ? t('terminals.rentalTerminal') : t('terminals.selfTerminal') }}
        </div>
      </template>
      <template #customerNote="{ row }">
        <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
      </template>
      <template #primaryCircuit="{ data }">
        <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
      </template>
      <template #primaryCircuitId="{ data, row }">
        <div v-if="!row.primaryCircuit || !data || row.primaryCircuit === CircuitTypes.Mobile">
          {{ data || '-' }}
        </div>
        <NuxtLink v-else :to="`/tenants/${tenantId}/${CircuitTypeRoutePath[row.primaryCircuit]}/${data}`">
          {{ data }}
        </NuxtLink>
      </template>
      <template #secondaryCircuit="{ data }">
        <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
      </template>
      <template #secondaryCircuitId="{ data, row }">
        <div v-if="!row.secondaryCircuit || !data || row.secondaryCircuit === CircuitTypes.Mobile">
          {{ data || '-' }}
        </div>
        <NuxtLink v-else :to="`/tenants/${tenantId}/${CircuitTypeRoutePath[row.secondaryCircuit]}/${data}`">
          {{ data }}
        </NuxtLink>
      </template>
      <template #vpnId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/vpns/${data}`">{{ data }}</NuxtLink>
      </template>
      <template #threatDetectionPlan="{ row }">
        <div class="text-xs text-pre-wrap">{{ getThreatDetectionPlanText(row.threatDetectionPlan) || '-' }}</div>
      </template>
      <template #flowCollectorPlan="{ row }">
        <div class="text-xs text-pre-wrap">{{ getFlowCollectorPlanText(row.flowCollectorPlan) || '-' }}</div>
      </template>
      <template #behaviorDetectionPlan="{ row }">
        <div class="text-xs text-pre-wrap">{{ getBehaviorDetectionPlanText(row.behaviorDetectionPlan) || '-' }}</div>
      </template>
      <template #trafficReportFlowAnalyzerPlan="{ row }">
        <div class="text-xs text-pre-wrap">
          {{ getTrafficReportFlowAnalyzerPlanText(row.trafficReportFlowAnalyzerPlan) || '-' }}
        </div>
      </template>
      <template #trafficReportFlowAnalyzerAlert="{ row }">
        <div class="text-xs text-pre-wrap">
          {{ getTrafficReportFlowAnalyzerAlertText(row.trafficReportFlowAnalyzerAlert) || '-' }}
        </div>
      </template>
    </MultiLevelHeaderSortableTable>
    <PaginationFooter
      v-if="!isConfirmation"
      :page="terminalTablePagination.page"
      :limit="terminalTablePagination.limit"
      :total="terminalTableList?.total ?? 0"
      @update:page="handleChangePage"
    />
    <div v-if="!isConfirmation" class="ml-3 my-3 text-lg text-warning text-pre-wrap">
      {{ t('terminals.note.bulk.description') }}
    </div>
    <InnerCard
      v-if="!isConfirmation || isBulkUpdateParameterSelected"
      class="mt-5"
      :title="t('terminals.bulkUpdateParameter')"
    >
      <!-- VPN ID -->
      <EditBulkInputGrid
        :checked="submitParams.vpnId"
        :label="t('terminals.vpnId')"
        :is-confirmation="isConfirmation"
        :note="t('terminals.note.bulk.vpnId')"
        :required="submitParams.vpnId"
        data-cy="terminals-edit-bulk-vpn-id"
        @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'vpnId')"
      >
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
          v-model="inputData.vpnId"
          :options="vpnIdNameListOptions"
          :required="submitParams.vpnId"
          placeholder="V000000002 / 拠点間通信用VPN"
          :disabled="isConfirmation || !submitParams.vpnId"
          size="middle"
          data-cy="terminals-edit-bulk-vpn-id-input"
          @valid="(valid: boolean) => (inputValid.vpnId = valid)"
        />
      </EditBulkInputGrid>
      <!-- デフォルトルート設定 -->
      <div v-if="showWanDefaultGateWayLabel" class="text-secondary text-lg pt-3">
        {{ t('terminals.wanDefaultGateWay') }}
      </div>
      <div :class="{ divider: showWanDefaultGateWayLabel }">
        <EditBulkInputGrid
          :checked="submitParams.nexthopNetwork"
          :label="t('terminals.nexthopNetwork')"
          :is-confirmation="isConfirmation"
          :disabled="selectedSelfTerminal"
          :note="t('terminals.note.bulk.nexthopNetwork')"
          :required="submitParams.nexthopNetwork"
          data-cy="terminals-edit-bulk-default-gateway-nexthop-network"
          @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'nexthopNetwork')"
        >
          <SelectForm
            v-model="inputData.defaultGateway.nexthopNetwork"
            :options="nexthopNetworkOptions"
            :required="submitParams.nexthopNetwork"
            size="middle"
            :placeholder="nexthopNetworkOptions[0]?.text"
            :disabled="isConfirmation || !submitParams.nexthopNetwork"
            data-cy="terminals-edit-bulk-default-gateway-nexthop-network-input"
            @valid="(valid: boolean) => (inputValid.defaultGateway.nexthopNetwork = valid)"
          />
          <i18n-t
            v-if="inputData.defaultGateway.nexthopNetwork"
            keypath="terminals.note.nexthopNetwork"
            tag="div"
            scope="global"
            class="ml-4"
          >
            <template #here>
              <NuxtLink :to="TERMINAL_LINK.BASE" target="_blank">{{ t('common.here') }}</NuxtLink>
            </template>
          </i18n-t>
        </EditBulkInputGrid>
        <EditBulkInputGrid
          :checked="submitParams.breakOut"
          :label="t('terminals.breakOut')"
          :is-confirmation="isConfirmation"
          :disabled="breakOutDisabled || selectedSelfTerminal"
          :note="t('terminals.note.bulk.breakOut')"
          :required="submitParams.breakOut"
          data-cy="terminals-edit-bulk-break-out"
          @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'breakOut')"
        >
          <template #help>
            <i18n-t keypath="terminals.help.breakOut" scope="global" class="text-pre-wrap">
              <template #linkText>
                <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">{{ t('common.here') }}</NuxtLink>
              </template>
            </i18n-t>
          </template>
          <MultipleSelectForm
            v-model="inputData.breakOut"
            :options="concatBreakOutOptions"
            :required="submitParams.breakOut"
            :disabled="isConfirmation || !submitParams.breakOut || breakOutDisabled"
            :max-itemas="8"
            :placeholder="breakOutOptions[0]?.text"
            data-cy="terminals-edit-bulk-break-out-input"
            @valid="(valid: boolean) => (inputValid.breakOut = valid)"
          />
        </EditBulkInputGrid>
        <EditBulkInputGrid
          :checked="submitParams.interceptDnsServers"
          :label="t('terminals.breakOutDnsServers')"
          :is-confirmation="isConfirmation"
          :disabled="breakOutDisabled || isBreakOutEmpty || selectedSelfTerminal"
          :note="t('terminals.note.bulk.breakOutDnsServers')"
          data-cy="terminals-edit-bulk-break-out-dns-servers"
          @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'interceptDnsServers')"
        >
          <MultipleInputForm
            v-model:values="inputData.interceptDnsServers"
            :rules="[rules.ipAddress]"
            maxlength="15"
            placeholder="192.168.1.5"
            :max-items="8"
            :disabled="isConfirmation || !submitParams.interceptDnsServers || breakOutDisabled || isBreakOutEmpty"
            data-cy="terminals-edit-bulk-break-out-dns-servers-input"
            @valid="(valid: boolean) => (inputValid.interceptDnsServers = valid)"
          />
        </EditBulkInputGrid>
      </div>

      <!-- WAN向けスタティックルート設定 -->
      <EditBulkInputGrid
        :checked="submitParams.wanStaticRoutes"
        :label="t('terminals.wanStaticRoutes')"
        :is-confirmation="isConfirmation"
        :disabled="selectedSelfTerminal"
        :note="t('terminals.note.bulk.wanStaticRoutes')"
        data-cy="terminals-edit-bulk-wan-static-routes"
        @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'wanStaticRoutes')"
      />
      <EditWanStaticRoutes
        v-if="submitParams.wanStaticRoutes || !isConfirmation"
        v-model:values="inputData.wanStaticRoutes"
        :disabled="isConfirmation || !submitParams.wanStaticRoutes"
        has-vpn
        data-cy="terminals-edit-bulk-wan-static-routes-input"
        @valid="(valid: boolean) => (inputValid.wanStaticRoutes = valid)"
      />

      <!-- WANポートフィルタ（VPN → 拠点） -->
      <EditBulkInputGrid
        :checked="submitParams.vpnInFilters"
        :label="t('terminals.vpnInFilters')"
        :is-confirmation="isConfirmation"
        :disabled="selectedSelfTerminal"
        :note="t('terminals.note.bulk.packetFilters')"
        data-cy="terminals-edit-bulk-vpn-in-filters"
        @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'vpnInFilters')"
      />
      <EditFilters
        v-if="submitParams.vpnInFilters || !isConfirmation"
        v-model="inputData.vpnInFilters"
        :disabled="isConfirmation || !submitParams.vpnInFilters"
        :edit-access-list-option="{
          title: t('terminals.vpnInFilters'),
          sourceIpv4PrefixPlaceholder: '192.168.3.0/24',
          destinationIpv4PrefixPlaceholder: '192.168.1.0/24',
          destinationIpv4PrefixStaticValue: '0.0.0.0/0',
        }"
        data-cy="terminals-edit-bulk-vpn-in-filters-input"
        @valid="(valid: boolean) => (inputValid.vpnInFilters = valid)"
      />

      <!-- WANポートフィルタ（拠点 → VPN） -->
      <EditBulkInputGrid
        :checked="submitParams.vpnOutFilters"
        :label="t('terminals.vpnOutFilters')"
        :is-confirmation="isConfirmation"
        :disabled="selectedSelfTerminal"
        :note="t('terminals.note.bulk.packetFilters')"
        data-cy="terminals-edit-bulk-vpn-out-filters"
        @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'vpnOutFilters')"
      />
      <EditFilters
        v-if="submitParams.vpnOutFilters || !isConfirmation"
        v-model="inputData.vpnOutFilters"
        :disabled="isConfirmation || !submitParams.vpnOutFilters"
        :edit-access-list-option="{
          title: t('terminals.vpnOutFilters'),
          sourceIpv4PrefixPlaceholder: '192.168.1.0/24',
          destinationIpv4PrefixPlaceholder: '192.168.3.0/24',
          sourceIpv4PrefixStaticValue: '0.0.0.0/0',
        }"
        data-cy="terminals-edit-bulk-vpn-out-filters-input"
        @valid="(valid: boolean) => (inputValid.vpnOutFilters = valid)"
      />

      <!-- WANポートフィルタ（拠点 → Internet） -->
      <EditBulkInputGrid
        :checked="submitParams.inet4OutFilters"
        :label="t('terminals.inet4OutFilters')"
        :is-confirmation="isConfirmation"
        :disabled="selectedSelfTerminal"
        :note="t('terminals.note.bulk.packetFilters')"
        data-cy="terminals-edit-bulk-inet4-out-filters"
        @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'inet4OutFilters')"
      />
      <EditFilters
        v-if="submitParams.inet4OutFilters || !isConfirmation"
        v-model="inputData.inet4OutFilters"
        :disabled="isConfirmation || !submitParams.inet4OutFilters"
        :edit-access-list-option="{
          title: t('terminals.inet4OutFilters'),
          sourceIpv4PrefixPlaceholder: '192.168.1.0/24',
          destinationIpv4PrefixPlaceholder: '8.8.8.8/32',
          sourceIpv4PrefixStaticValue: '0.0.0.0/0',
        }"
        data-cy="terminals-edit-bulk-inet4-out-filters-input"
        @valid="(valid: boolean) => (inputValid.inet4OutFilters = valid)"
      />

      <!-- DHCPの方式 -->
      <EditBulkInputGrid
        :checked="submitParams.dhcp"
        :label="t('terminals.dhcpType')"
        :is-confirmation="isConfirmation"
        :disabled="selectedSelfTerminal"
        data-cy="terminals-edit-bulk-dhcp-type"
        @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'dhcp')"
      />
      <template v-if="submitParams.dhcp || !isConfirmation">
        <RadioForm
          :model-value="dhcpType"
          :options="
            Object.values(DhcpTypes).map(value => ({
              value,
              text: t(`terminals.${value}`),
            }))
          "
          :disabled="isConfirmation || !submitParams.dhcp"
          class="py-3"
          data-cy="terminals-edit-bulk-dhcp-type-input"
          @update:model-value="updateDhcpType"
        />
        <!-- DHCP None -->
        <template v-if="dhcpType === DhcpTypes.None">
          <div v-if="!isConfirmation" class="text-warning text-pre-wrap ml-8">
            {{ t('terminals.note.bulk.dhcpNone') }}
          </div>
        </template>

        <!-- DHCP Server -->
        <template v-if="dhcpType === DhcpTypes.Server">
          <div v-if="!isConfirmation" class="text-warning text-pre-wrap ml-8">
            {{ t('terminals.note.bulk.dhcpServer') }}
          </div>
          <InputGrid :label="t('terminals.domain')">
            <InputForm
              v-model="inputData.dhcpServer.domain"
              :rules="[rules.domain]"
              maxlength="200"
              placeholder="example.com"
              :disabled="isConfirmation"
              data-cy="terminals-edit-bulk-dhcp-server-domain"
              @valid="(valid: boolean) => (inputValid.dhcpServer.domain = valid)"
            />
          </InputGrid>
          <InputGrid :label="t('terminals.primaryDnsServer')">
            <InputForm
              v-model="inputData.dhcpServer.primaryDnsServer"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="202.234.232.6"
              :disabled="isConfirmation"
              data-cy="terminals-edit-bulk-dhcp-server-primary-dns-server"
              @valid="(valid: boolean) => (inputValid.dhcpServer.primaryDnsServer = valid)"
            />
          </InputGrid>
          <InputGrid :label="t('terminals.secondaryDnsServer')">
            <InputForm
              v-model="inputData.dhcpServer.secondaryDnsServer"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="221.113.139.250"
              :disabled="isConfirmation"
              data-cy="terminals-edit-bulk-dhcp-server-secondary-dns-server"
              @valid="(valid: boolean) => (inputValid.dhcpServer.secondaryDnsServer = valid)"
            />
          </InputGrid>
          <InputGrid :label="t('terminals.primaryWinsServer')">
            <InputForm
              v-model="inputData.dhcpServer.primaryWinsServer"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="192.168.1.3"
              :disabled="isConfirmation"
              data-cy="terminals-edit-bulk-dhcp-server-primary-wins-server"
              @valid="(valid: boolean) => (inputValid.dhcpServer.primaryWinsServer = valid)"
            />
          </InputGrid>
          <InputGrid :label="t('terminals.secondaryWinsServer')">
            <InputForm
              v-model="inputData.dhcpServer.secondaryWinsServer"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="192.168.1.4"
              :disabled="isConfirmation"
              data-cy="terminals-edit-bulk-dhcp-server-secondary-wins-server"
              @valid="(valid: boolean) => (inputValid.dhcpServer.secondaryWinsServer = valid)"
            />
          </InputGrid>
        </template>
        <template v-if="dhcpType === DhcpTypes.Relay">
          <!-- DHCP Relay -->
          <div v-if="!isConfirmation" class="text-warning text-pre-wrap ml-8">
            {{ t('terminals.note.bulk.dhcpRelay') }}
          </div>
          <InputGrid class="mt-2 mb-3" :label="t('terminals.serverIpv4Address')">
            <MultipleInputForm
              v-model:values="inputData.dhcpRelayServers"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="192.168.1.5"
              :max-items="4"
              :disabled="isConfirmation"
              data-cy="terminals-edit-bulk-dhcp-relay-servers"
              @valid="(valid: boolean) => (inputValid.dhcpRelayServers = valid)"
            />
          </InputGrid>
        </template>
      </template>
    </InnerCard>
    <InnerCard
      v-if="!isConfirmation || submitParams.trafficReportFlowAnalyzerPlan"
      class="mt-5"
      :title="t('terminals.trafficReportFlowAnalyzerPlanOptions')"
    >
      <template #description>
        <i18n-t
          keypath="terminals.note.trafficReportFlowAnalyzer.description"
          scope="global"
          tag="div"
          class="text-pre-wrap"
        >
          <template #important>
            <span class="text-error font-weight-bold">{{ t('terminals.note.paidOption') }}</span>
          </template>
          <template #billingText>
            <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
          <template #analyzerLinkText>
            <NuxtLink :to="TERMINAL_LINK.RINK_0143" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <template #button>
        <CustomButton
          icon="up-right-square"
          :width="240"
          :text="
            trafficReportFlowAnalyzerTermsOfServiceAccepted
              ? t('terms.agreedTermsLinkButton')
              : t('terms.termsLinkButton')
          "
          @click="() => moveToSecurityTermOfService(tenantId)"
        />
      </template>
      <!-- トラフィックレポート（フロー分析） -->
      <EditBulkInputGrid
        :checked="submitParams.trafficReportFlowAnalyzerPlan"
        :label="t('terminals.trafficReportFlowAnalyzerPlan')"
        :is-confirmation="isConfirmation"
        :required="submitParams.trafficReportFlowAnalyzerPlan"
        :disabled="trafficReportFlowAnalyzerDisabled"
        data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"
        @update:checked="
          (checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'trafficReportFlowAnalyzerPlan')
        "
      >
        <template #help>
          <i18n-t keypath="terminals.help.trafficReportFlowAnalyzerPlan" scope="global">
            <template #billingText>
              <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <SelectForm
          v-model="inputData.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan"
          :options="trafficReportFlowAnalyzerPlanOptions"
          :required="submitParams.trafficReportFlowAnalyzerPlan"
          :placeholder="trafficReportFlowAnalyzerPlanOptions[0]?.text"
          :disabled="isConfirmation || !submitParams.trafficReportFlowAnalyzerPlan"
          data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan-input"
          @valid="(valid: boolean) => (inputValid.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan = valid)"
        />
        <div class="max-w-400px ml-2 mt-2 text-sm text-error">
          {{ t('terminals.note.trafficReportFlowAnalyzer.freePlan') }}
        </div>
      </EditBulkInputGrid>
      <EditBulkInputGrid
        :checked="submitParams.trafficReportFlowAnalyzerAlert"
        :label="t('terminals.trafficReportFlowAnalyzerAlert')"
        :is-confirmation="isConfirmation"
        :required="submitParams.trafficReportFlowAnalyzerAlert"
        :disabled="trafficReportFlowAnalyzerDisabled || isPlanNoSubscription"
        data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert"
        @update:checked="
          (checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'trafficReportFlowAnalyzerAlert')
        "
      >
        <SelectForm
          v-model="inputData.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert"
          :options="trafficReportFlowAnalyzerAlertOptions"
          :required="submitParams.trafficReportFlowAnalyzerAlert"
          :placeholder="t('common.use')"
          :disabled="isConfirmation || !submitParams.trafficReportFlowAnalyzerAlert || isPlanNoSubscription"
          data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert-input"
        />
      </EditBulkInputGrid>
    </InnerCard>
    <InnerCard
      v-if="
        !isConfirmation ||
        submitParams.threatDetectionPlan ||
        submitParams.flowCollectorPlan ||
        submitParams.behaviorDetectionPlan
      "
      class="mt-5"
      :title="t('terminals.securityOptions')"
    >
      <template #description>
        <i18n-t keypath="terminals.note.securityOptions.description" scope="global">
          <template #important>
            <span class="text-error font-weight-bold">{{ t('terminals.note.paidOption') }}</span>
          </template>
          <template #billingText>
            <NuxtLink :to="TERMINAL_LINK.WAN_SECURITY_PRICE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <template #button>
        <CustomButton
          icon="up-right-square"
          :width="240"
          :text="securityTermsOfServiceAccepted ? t('terms.agreedTermsLinkButton') : t('terms.termsLinkButton')"
          @click="() => moveToSecurityTermOfService(tenantId)"
        />
      </template>
      <!-- セキュリティオプション -->
      <div ref="securityOptionRef" class="pt-3">
        <EditBulkInputGrid
          v-if="!isConfirmation || submitParams.threatDetectionPlan"
          :checked="submitParams.threatDetectionPlan"
          :label="t('terminals.threatDetectionPlan')"
          :is-confirmation="isConfirmation"
          :required="submitParams.threatDetectionPlan"
          data-cy="terminals-edit-bulk-threat-detection-plan"
          @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'threatDetectionPlan')"
        >
          <SelectForm
            v-model="inputData.threatDetectionPlan"
            :options="threatDetectionPlanOptions"
            :required="submitParams.threatDetectionPlan"
            :placeholder="threatDetectionPlanOptions[0]?.text"
            :disabled="isConfirmation || !submitParams.threatDetectionPlan"
            data-cy="terminals-edit-bulk-threat-detection-plan-input"
            @valid="(valid: boolean) => (inputValid.threatDetectionPlan = valid)"
          />
          <div class="max-w-400px ml-2 mt-2 text-sm text-error">{{ t('terminals.note.securityOptions.campaign') }}</div>
          <template #help>
            <i18n-t keypath="terminals.help.wanSecurityPlan" scope="global">
              <template #billingText>
                <NuxtLink :to="TERMINAL_LINK.WAN_SECURITY_PRICE" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
        </EditBulkInputGrid>

        <EditBulkInputGrid
          v-if="!isConfirmation || submitParams.flowCollectorPlan"
          :checked="submitParams.flowCollectorPlan"
          :label="t('terminals.flowCollectorPlan')"
          :is-confirmation="isConfirmation"
          :required="submitParams.flowCollectorPlan"
          data-cy="terminals-edit-bulk-flow-collector-plan"
          @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'flowCollectorPlan')"
        >
          <SelectForm
            v-model="inputData.flowCollectorPlan"
            :options="flowCollectorPlanOptions"
            :required="submitParams.flowCollectorPlan"
            :placeholder="flowCollectorPlanOptions[0]?.text"
            :disabled="isConfirmation || !submitParams.flowCollectorPlan"
            data-cy="terminals-edit-bulk-flow-collector-plan-input"
            @valid="(valid: boolean) => (inputValid.flowCollectorPlan = valid)"
          />
          <template #help>
            <i18n-t keypath="terminals.help.wanSecurityPlan" scope="global">
              <template #billingText>
                <NuxtLink :to="TERMINAL_LINK.WAN_SECURITY_PRICE" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
        </EditBulkInputGrid>
        <EditBulkInputGrid
          v-if="!isConfirmation || submitParams.behaviorDetectionPlan"
          :checked="submitParams.behaviorDetectionPlan"
          :label="t('terminals.behaviorDetection')"
          :is-confirmation="isConfirmation"
          :required="submitParams.behaviorDetectionPlan"
          data-cy="terminals-edit-bulk-behavior-detection-plan"
          @update:checked="(checked: boolean) => handleSubmitParamsCheckboxClick(checked, 'behaviorDetectionPlan')"
        >
          <SelectForm
            v-model="inputData.behaviorDetectionPlan"
            :options="behaviorDetectionPlanOptions"
            :required="submitParams.behaviorDetectionPlan"
            :placeholder="behaviorDetectionPlanOptions[0]?.text ?? t('common.disuse')"
            :disabled="isConfirmation || !submitParams.behaviorDetectionPlan"
            data-cy="terminals-edit-bulk-behavior-detection-plan-input"
            @valid="(valid: boolean) => (inputValid.behaviorDetectionPlan = valid)"
          />
          <template #help>
            <i18n-t keypath="terminals.help.wanSecurityPlan" scope="global">
              <template #billingText>
                <NuxtLink :to="TERMINAL_LINK.WAN_SECURITY_PRICE" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <i18n-t
            v-if="currentSettingsBehaviorDetectionPlan"
            :keypath="
              currentSettingsBehaviorDetectionPlan === BehaviorDetectionPlanTypes.None
                ? `terminals.note.securityOptions.behaviorDetectionPlanUnselected`
                : `terminals.note.securityOptions.behaviorDetection`
            "
            tag="div"
            scope="global"
            class="text-warning"
          >
            <template #plan>
              {{ t(`securityContracts.behaviorDetectionPlan.${currentSettingsBehaviorDetectionPlan}`) }}
            </template>
            <template #linkText>
              <NuxtLink :to="`/tenants/${tenantId}/security-contracts/summary`">
                {{ t('securityContracts.securityListPage') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </EditBulkInputGrid>
      </div>
    </InnerCard>
    <template v-if="isConfirmation">
      <TerminalTermsOfService
        v-for="agreement in termsOfServiceAgreement"
        :key="agreement.key"
        v-model="agreement.value"
        :type="agreement.key"
        :data-cy="`terminals-edit-bulk-terminal-terms-of-service-${agreement.key}`"
      />
    </template>
    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="terminals-edit-bulk-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="saveDisabled || loading"
        :text="submit.text"
        :width="180"
        data-cy="terminals-edit-bulk-submit-button"
        @click="submit.click"
      />
    </div>
    <!-- ブレイクアウトの詳細表示ダイアログ -->
    <BreakOutDetailDialog :break-out="currentBreakOut" @close="() => (currentBreakOut = undefined)" />
    <!-- フロー可視化とセキュリティの規約確認ダイアログ -->
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
      :show-help-desk-campaign="showHelpDeskCampaign"
      @close="router.back()"
    />
  </CardContainer>
</template>

<style lang="scss" scoped>
$light-secondary-color: rgb(var(--v-theme-light-secondary));

.divider {
  border-bottom: 2px solid $light-secondary-color;
}

.max-w-400px {
  max-width: 400px;
}

.w-100px {
  width: 100px;
}
</style>
