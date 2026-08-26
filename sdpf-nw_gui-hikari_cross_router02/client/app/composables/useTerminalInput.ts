import { isEqual, merge, omit, pick } from 'es-toolkit'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import {
  CircuitTypes,
  TerminalTypes,
  TerminalDeviceTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
  BreakOutTypes,
} from '@/api/constants'
import type { TerminalType, TrafficReportFlowAnalyzerPlanType } from '@/api/types'
import type { SelfTerminalPutRequest } from '@/api/selfTerminals/types'
import {
  TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE,
  REMOVE_MOBILE_PARAMETERS,
  type TERMINAL_EDIT_BULK_KEYS,
  CorporateVerificationMethodTypes,
  PicVerificationMethodTypes,
  ContractIdentificationDocumentTypes,
  PicIdentificationDocumentTypes,
  AuxiliaryIdentificationDocumentTypes,
  EmploymentDocumentTypes,
  CallDetailBreakdownSettingTypes,
  NetworkTypes,
  ActionTypes,
  LanTypes,
  LansTypes,
  NatTypes,
  LansPortNumberList,
} from '@/api/terminals/constants'
import type {
  TerminalInputDataType,
  TerminalMobileInputDataType,
  TerminalFiltersInputType,
  TerminalUserFilter,
  TerminalPostRequest,
  TerminalBulkUnitParameter,
  TerminalPutRequest,
  TerminalDeleteRequest,
  TerminalMobilePostRequest,
  ContractIdentificationDocumentType,
  PicIdentificationDocumentType,
  AuxiliaryIdentificationDocumentType,
  EmploymentDocumentType,
  CallDetailBreakdownSettingType,
  NetworkType,
  ProtocolType,
  LanType,
  TerminalLansType,
  TerminalLansInputType,
  TerminalLanStaticType,
  TerminalLanStaticRoutesInputType,
  PrimaryCircuitType,
  SecondaryCircuitType,
  MobileRatType,
  TerminalBulkPutRequest,
  InitialEditBulkTerminalInputDataType,
  InitialRemovalInputDataType,
  InitialDhcpServerInputDataType,
} from '@/api/terminals/types'
import type { GuaranteeResponse } from '@/api/guarantees/types'
import { UNSELECTED_VALUE } from '@/components/input/constants'

type TerminalParams = {
  mobile: TerminalMobileInputDataType
  terminal: TerminalInputDataType
}
type TerminalUpdateParams = {
  original: { terminal: TerminalInputDataType; mobile: { rat: MobileRatType } }
  terminal: TerminalInputDataType
  mobile: { rat: MobileRatType }
}
type TerminalDeleteParams = {
  mobile: TerminalMobileInputDataType
  terminal: InitialRemovalInputDataType
  isMobile: boolean
}

type TrafficReportFlowAnalyzer = {
  trafficReportFlowAnalyzerPlan?: string
  trafficReportFlowAnalyzerAlert?: string
}

export const useTerminalInput = () => {
  const { t } = useI18n()

  const defaultBirthDate = dayjs('1995-01').format()

  const checkCircuitTypeSelected = (inputData: TerminalInputDataType, circuitType: PrimaryCircuitType) => {
    return inputData.primaryCircuitType === circuitType || inputData.secondaryCircuitType === circuitType
  }
  const getShowBreakOut = (inputData: TerminalInputDataType) => {
    return inputData.defaultGateway.nexthopNetwork === NetworkTypes.Vpn
  }
  const getShowDefaultGatewayNexthop = (inputData: TerminalInputDataType) => {
    return inputData.defaultGateway.nexthopNetwork === NetworkTypes.Lan
  }
  const getShowPicIdentificationNumber = (inputMobileData: TerminalMobileInputDataType) => {
    const array = [
      PicIdentificationDocumentTypes.IndivisualNumberCard,
      PicIdentificationDocumentTypes.BasicResidentRegistrationCard,
    ] as string[]
    return !array.includes(inputMobileData.picIdentificationDocumentType)
  }
  const getShowPicIdentificationBackDocumentFile = (inputMobileData: TerminalMobileInputDataType) => {
    const array = [PicIdentificationDocumentTypes.IndivisualNumberCard] as string[]
    return !array.includes(inputMobileData.picIdentificationDocumentType)
  }
  const getShowPicIdentificationAdditionalDocumentFile = (inputMobileData: TerminalMobileInputDataType) => {
    const array = [PicIdentificationDocumentTypes.ResidenceCardAndPassport] as string[]
    return array.includes(inputMobileData.picIdentificationDocumentType)
  }
  const getShowPicAuxiliaryIdentificationDocumentType = (inputMobileData: TerminalMobileInputDataType) => {
    const array = [
      PicIdentificationDocumentTypes.BasicResidentRegistrationCard,
      PicIdentificationDocumentTypes.AlienRegistrationCard,
      PicIdentificationDocumentTypes.ResidenceCardAndPassport,
    ] as string[]
    return array.includes(inputMobileData.picIdentificationDocumentType)
  }
  const getShowPicEmployeeCode = (inputMobileData: TerminalMobileInputDataType) => {
    const array = [EmploymentDocumentTypes.EmployeeIdCard] as string[]
    return array.includes(inputMobileData.picEmploymentDocumentType)
  }
  const getShowCallDetailOption = (inputMobileData: TerminalMobileInputDataType) => {
    return inputMobileData.callDetailDesired === 'true'
  }
  const getGuaranteeListFilterPatterns = (guarantee: GuaranteeResponse) => {
    const internetRateLimit = guarantee.internet?.rateLimit
      ? /^\d+M$/.test(guarantee.internet.rateLimit)
        ? parseInt(guarantee.internet.rateLimit)
        : parseInt(guarantee.internet.rateLimit) * 1000
      : 0
    const vpnRateLimit = guarantee.vpn?.rateLimit
      ? /^\d+M$/.test(guarantee.vpn.rateLimit)
        ? parseInt(guarantee.vpn.rateLimit)
        : parseInt(guarantee.vpn.rateLimit) * 1000
      : 0

    // サービスルーターに紐付け可能なギャランティ回線の条件
    // * physicalBandwidth が 100M かつ vpn.rateLimit が 90M 以下 の場合
    // * physicalBandwidth が 1G かつ rateLimit 契約帯域の合計が 300M 以下 かつ userInterfaceType が 1000BASE-T の場合
    const pattern100M = guarantee.physicalBandwidth === '100M' && vpnRateLimit <= 90
    const pattern1G =
      guarantee.physicalBandwidth === '1G' &&
      internetRateLimit + vpnRateLimit <= 300 &&
      guarantee.userInterfaceType === '1000BASE-T'

    return { pattern100M, pattern1G }
  }

  const primaryCircuitTypeOptions = Object.values(CircuitTypes).map(value => ({ value, text: t(`service.${value}`) }))
  const secondaryCircuitTypeOptions = [
    { value: CircuitTypes.Ipoe, text: t('service.ipoe') },
    { value: CircuitTypes.Mobile, text: t('service.mobile') },
  ]

  const contractIdentificationDocumentTypeOptions = Object.values(ContractIdentificationDocumentTypes).map(value => ({
    value,
    text: t(`documentType.${value}`),
  }))
  const picIdentificationDocumentTypeOptions = Object.values(PicIdentificationDocumentTypes).map(value => ({
    value,
    text: t(`documentType.${value}`),
  }))
  const auxiliaryIdentificationDocumentTypeOptions = Object.values(AuxiliaryIdentificationDocumentTypes).map(value => ({
    value,
    text: t(`documentType.${value}`),
  }))
  const employmentDocumentTypeOptions = Object.values(EmploymentDocumentTypes).map(value => ({
    value,
    text: t(`documentType.${value}`),
  }))

  const customerReceiptRequiredOptions = [
    { value: 'true', text: t('terminals.customerReceiptRequiredTrue') },
    { value: 'false', text: t('terminals.customerReceiptRequiredFalse') },
  ]
  const callDetailDesiredOptions = [
    { value: 'true', text: t('terminals.callDetailDesiredTrue') },
    { value: 'false', text: t('terminals.callDetailDesiredFalse') },
  ]
  const callDetailBreakdownOptions = Object.values(CallDetailBreakdownSettingTypes).map(value => ({
    value,
    text: t(`terminals.${value}`),
  }))
  const lanTypeOptions = Object.values(LanTypes).map(value => ({ value, text: t(`terminals.${value}`) }))

  const networkTypeOptions = [
    { text: 'Internet', value: NetworkTypes.Internet },
    { text: 'VPN', value: NetworkTypes.Vpn },
    { text: 'LAN', value: NetworkTypes.Lan },
  ]
  const vpnRoutingOptions = [
    { text: t('common.advertise'), value: 'true' },
    { text: t('common.doNotAdvertise'), value: 'false' },
  ]
  const wanDefaultGatewayVpnRoutingOptions = [
    { text: t('terminals.isDefaultRoute'), value: 'true' },
    { text: t('terminals.isNotDefaultRoute'), value: 'false' },
  ]
  const breakOutOptions = Object.values(BreakOutTypes).map(value => ({
    value,
    text: t(`terminals.${value}`),
  }))

  const mobileRatOptions = [
    { value: 'auto', text: t('terminals.mobileRatAuto') },
    { value: 'lte', text: t('terminals.mobileRatLte') },
  ]
  const corporateVerificationMethodOptions = [
    {
      text: t('terminals.corporateNumberVerification'),
      value: CorporateVerificationMethodTypes.CorporateNumberVerification,
    },
    {
      text: t('terminals.corporateVerificationInPersonVerification'),
      value: CorporateVerificationMethodTypes.InPersonVerification,
    },
  ]
  const picVerificationMethodOptions = [
    {
      text: t('terminals.myNumberCard'),
      value: PicVerificationMethodTypes.MyNumberCard,
    },
    {
      text: t('terminals.picVerificationInPersonVerification'),
      value: PicVerificationMethodTypes.InPersonVerification,
    },
  ]

  const terminalTypeOptions = Object.values(TerminalTypes).map(value => ({
    text: t(`terminals.${value}`),
    value,
  }))
  const terminalDeviceTypeOptions = Object.values(TerminalDeviceTypes).map(value => ({
    text: t(`terminals.${value}`),
    value,
  }))
  const trafficReportFlowAnalyzerPlanOptions: Array<{ value: TrafficReportFlowAnalyzerPlanType; text: string }> =
    Object.values(TrafficReportFlowAnalyzerPlanTypes)
      .map(value => {
        if (value === TrafficReportFlowAnalyzerPlanTypes.FreePlan) {
          return { value, text: t('terminals.planOption', { plan: t('terminals.freePlan') }) }
        } else if (value === TrafficReportFlowAnalyzerPlanTypes.NoSubscription) {
          return { value, text: t('terminals.noSubscription') }
        } else {
          return value.map(plan => ({ value: plan, text: t('terminals.planOption', { plan }) }))
        }
      })
      .flat()

  const trafficReportFlowAnalyzerAlertOptions = [
    { text: t('common.use'), value: 'true' },
    { text: t('common.disuse'), value: 'false' },
  ]

  const threatDetectionPlanOptions = [
    SecurityOptionTypes.NoSubscription,
    SecurityOptionTypes.Plan3Months,
    SecurityOptionTypes.Plan12Months,
  ].map(value => ({
    text: t(`terminals.threatDetectionOptions.${value}`),
    value,
  }))
  const flowCollectorPlanOptions = Object.values(SecurityOptionTypes).map(value => ({
    text: t(`terminals.flowCollectorOptions.${value}`),
    value,
  }))
  const behaviorDetectionPlanOptions = [
    { text: t('common.disuse'), value: BehaviorDetectionOptionTypes.NoSubscription },
    { text: t('common.use'), value: BehaviorDetectionOptionTypes.Subscription },
  ]

  const getLanTypeText = (value?: string) => {
    const found = lanTypeOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getNetworkTypeText = (value?: string) => {
    const found = networkTypeOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getVpnRoutingText = (value?: boolean) => {
    const found = vpnRoutingOptions.find(option => option.value === `${value}`)
    return found?.text ?? ''
  }
  const getWanDefaultGatewayVpnRoutingText = (value?: boolean) => {
    const found = wanDefaultGatewayVpnRoutingOptions.find(option => option.value === `${value}`)
    return found?.text ?? ''
  }
  const getCustomerReceiptRequiredText = (value?: boolean) => {
    const found = customerReceiptRequiredOptions.find(option => option.value === `${value}`)
    return found?.text ?? ''
  }
  const getCallDetailDesiredText = (value?: boolean) => {
    const found = callDetailDesiredOptions.find(option => option.value === `${value}`)
    return found?.text ?? ''
  }
  const getCallDetailBreakdownText = (value?: string) => {
    const found = callDetailBreakdownOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getMobileRatText = (value?: string) => {
    const found = mobileRatOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getTrafficReportFlowAnalyzerPlanText = (value?: string) => {
    const found = trafficReportFlowAnalyzerPlanOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getTrafficReportFlowAnalyzerAlertText = (value?: boolean) => {
    const found = trafficReportFlowAnalyzerAlertOptions.find(option => option.value === `${value}`)
    return found?.text ?? ''
  }
  const getTrafficReportFlowAnalyzerPostRequest = (value?: TrafficReportFlowAnalyzer) => {
    // post APIのリクエストボディはプランが必須になるため、プランがない場合は NoSubscription を返す
    const foundPlan = trafficReportFlowAnalyzerPlanOptions.find(
      option => option.value === value?.trafficReportFlowAnalyzerPlan,
    )
    if (!foundPlan?.value) {
      return { trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanTypes.NoSubscription }
    }
    return {
      trafficReportFlowAnalyzerPlan: foundPlan.value,
      trafficReportFlowAnalyzerAlert: value?.trafficReportFlowAnalyzerAlert === 'true',
    }
  }
  const getTrafficReportFlowAnalyzerPutRequest = (
    value?: TrafficReportFlowAnalyzer,
    original?: TrafficReportFlowAnalyzer,
  ) => {
    // put APIのリクエストボディは変更のあった項目のみ
    const foundPlan = trafficReportFlowAnalyzerPlanOptions.find(
      option => option.value === value?.trafficReportFlowAnalyzerPlan,
    )
    const planChanged = !original || value?.trafficReportFlowAnalyzerPlan !== original.trafficReportFlowAnalyzerPlan
    const alertChanged = !original || value?.trafficReportFlowAnalyzerAlert !== original.trafficReportFlowAnalyzerAlert
    const trafficReportFlowAnalyzer = {
      trafficReportFlowAnalyzerPlan: planChanged ? foundPlan?.value : undefined,
      trafficReportFlowAnalyzerAlert:
        alertChanged && value?.trafficReportFlowAnalyzerAlert
          ? value.trafficReportFlowAnalyzerAlert === 'true'
          : undefined,
    }
    return Object.values(trafficReportFlowAnalyzer).some(value => value !== undefined)
      ? trafficReportFlowAnalyzer
      : undefined
  }
  const getFlowCollectorPlanText = (value?: string) => {
    const found = flowCollectorPlanOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getFlowCollector = (value?: string) => {
    const found = flowCollectorPlanOptions.find(option => option.value === value)
    return found?.value ? { flowCollectorPlan: found.value } : undefined
  }
  const getThreatDetectionPlanText = (value?: string) => {
    const found = threatDetectionPlanOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getThreatDetection = (value?: string) => {
    const found = threatDetectionPlanOptions.find(option => option.value === value)
    return found?.value ? { threatDetectionPlan: found.value } : undefined
  }
  const getBehaviorDetectionPlanText = (value?: string) => {
    const found = behaviorDetectionPlanOptions.find(option => option.value === value)
    return found?.text ?? ''
  }
  const getBehaviorDetection = (value?: string) => {
    const found = behaviorDetectionPlanOptions.find(option => option.value === value)
    return found?.value ? { behaviorDetectionPlan: found.value } : undefined
  }

  // corporateVerificationMethod が不要なので直接抽出にする
  const getMobilePostRequest = (mobile: TerminalMobileInputDataType): TerminalMobilePostRequest => {
    const hasJpkiRequestId = !!mobile.jpkiRequestId
    const hasPicIdentificationDocumentType = !!mobile.picIdentificationDocumentType

    return {
      rat: mobile.rat as MobileRatType,
      picName: mobile.picName,
      picNameKana: mobile.picNameKana,
      picPostalCode: mobile.picPostalCode,
      picAddress: mobile.picAddress,
      picAddressKana: convertHyphen(mobile.picAddressKana),
      picPhoneNumber: mobile.picPhoneNumber,
      picDateOfBirth: mobile.picDateOfBirth,
      japanCorporateNumber:
        mobile.japanCorporateNumber.length === 12
          ? `${calculateJapanCorporateNumberDigit(mobile.japanCorporateNumber)}${mobile.japanCorporateNumber}`
          : mobile.japanCorporateNumber,
      contractIdentificationDocumentType: Object.values(ContractIdentificationDocumentTypes).find(
        type => type === mobile.contractIdentificationDocumentType,
      ),
      contractIdentificationDocumentId: mobile.contractIdentificationDocumentId || undefined,
      // マイナンバーカード認証の場合のみjpkiRequestIdを送信
      jpkiRequestId: hasJpkiRequestId ? mobile.jpkiRequestId : undefined,
      // 対面確認の場合のみpicIdentificationDocumentType関連を送信
      picIdentificationDocumentType: hasPicIdentificationDocumentType
        ? Object.values(PicIdentificationDocumentTypes).find(type => type === mobile.picIdentificationDocumentType)
        : undefined,
      picIdentificationNumber: hasPicIdentificationDocumentType
        ? mobile.picIdentificationNumber || undefined
        : undefined,
      picIdentificationFrontDocumentId: hasPicIdentificationDocumentType
        ? mobile.picIdentificationFrontDocumentId || undefined
        : undefined,
      picIdentificationBackDocumentId: hasPicIdentificationDocumentType
        ? mobile.picIdentificationBackDocumentId || undefined
        : undefined,
      picIdentificationAdditionalDocumentId: hasPicIdentificationDocumentType
        ? mobile.picIdentificationAdditionalDocumentId || undefined
        : undefined,
      picAuxiliaryIdentificationDocumentType: hasPicIdentificationDocumentType
        ? (mobile.picAuxiliaryIdentificationDocumentType as AuxiliaryIdentificationDocumentType) || undefined
        : undefined,
      picAuxiliaryIdentificationDocumentId: hasPicIdentificationDocumentType
        ? mobile.picAuxiliaryIdentificationDocumentId || undefined
        : undefined,
      picEmploymentDocumentType: mobile.picEmploymentDocumentType as EmploymentDocumentType,
      picEmployeeCode: mobile.picEmployeeCode || undefined,
      picEmploymentDocumentId: mobile.picEmploymentDocumentId,
      networkPinCode: mobile.networkPinCode,
      customerReceiptRequired: mobile.customerReceiptRequired === 'true',
      callDetailDesired: mobile.callDetailDesired === 'true',
      callDetailBreakdownSetting: (mobile.callDetailBreakdownSetting as CallDetailBreakdownSettingType) || undefined,
      callDetailDestinationNumberSetting:
        (mobile.callDetailDestinationNumberSetting as CallDetailBreakdownSettingType) || undefined,
    }
  }

  const getTerminalFilters = (filters: TerminalFiltersInputType): TerminalUserFilter | null => {
    if (!filters.defaultPolicy) {
      return null
    }
    const accessControlList = filters.accessControlList.map(list => ({
      ...list,
      protocol: list.protocol as ProtocolType,
      action: list.action === ActionTypes.Accept ? ActionTypes.Accept : ActionTypes.Discard,
    }))
    return {
      defaultPolicy: filters.defaultPolicy === ActionTypes.Accept ? ActionTypes.Accept : ActionTypes.Discard,
      accessControlList: accessControlList.length > 0 ? accessControlList : null,
    }
  }
  const getTerminalDhcpServer = (
    dhcpServer: InitialDhcpServerInputDataType | InitialEditBulkTerminalInputDataType['dhcpServer'],
  ) => {
    const ipv4AddressRanges =
      'ipv4AddressRanges' in dhcpServer
        ? dhcpServer.ipv4AddressRanges
            .filter(([start, end]) => !!start && !!end)
            .map(([start, end]) => ({ start, end }))
        : []
    const data = {
      ipv4AddressRanges,
      domain: dhcpServer.domain || undefined,
      primaryDnsServer: dhcpServer.primaryDnsServer || undefined,
      secondaryDnsServer: dhcpServer.secondaryDnsServer || undefined,
      primaryWinsServer: dhcpServer.primaryWinsServer || undefined,
      secondaryWinsServer: dhcpServer.secondaryWinsServer || undefined,
    }
    return Object.values(data).some(value => (Array.isArray(value) ? value.length > 0 : !!value)) ? data : undefined
  }
  const getTerminalGuaranteeRequest = (terminal: TerminalInputDataType, original?: TerminalInputDataType) => {
    if (terminal.primaryCircuitType !== CircuitTypes.Guarantee) {
      // original に guarantee がない場合は undefined になる
      return original?.primaryCircuitType === CircuitTypes.Guarantee ? null : undefined
    }
    // vpnId が空の場合、guarantee.vpn を送信しない
    if (!terminal.vpnId || terminal.vpnId === UNSELECTED_VALUE) {
      return {
        guaranteeId: terminal.guarantee.guaranteeId,
      }
    }
    const vpn = {
      act: terminal.guarantee.vpnActConnectedIpv4Prefix
        ? { connectedIpv4Prefix: terminal.guarantee.vpnActConnectedIpv4Prefix }
        : original
          ? { connectedIpv4Prefix: null }
          : undefined,
      sby: terminal.guarantee.vpnSbyConnectedIpv4Prefix
        ? { connectedIpv4Prefix: terminal.guarantee.vpnSbyConnectedIpv4Prefix }
        : original
          ? { connectedIpv4Prefix: null }
          : undefined,
    }
    return {
      guaranteeId: terminal.guarantee.guaranteeId,
      vpn: Object.values(vpn).some(Boolean) ? vpn : undefined,
    }
  }
  const getTerminalPostRequestWithoutMobile = (
    terminal: TerminalInputDataType,
  ): Omit<TerminalPostRequest, 'mobile'> => {
    const filteredInterceptDnsServers = terminal.interceptDnsServers.filter(val => !!val)
    const lanStaticRoutes = terminal.lanStaticRoutes.map(lan => {
      const vpnNats = lan.vpnNats.map(vpnNat => ({
        ...vpnNat,
        type: vpnNat.type === NatTypes.Nat ? NatTypes.Nat : NatTypes.PartialNat,
      }))
      return {
        ...lan,
        vpnRouting: lan.vpnRouting === 'true',
        vpnNats: vpnNats.length > 0 ? vpnNats : undefined,
      }
    })
    const wanStaticRoutes = terminal.wanStaticRoutes.map(lan => ({
      ...lan,
      nexthopNetwork: lan.nexthopNetwork === NetworkTypes.Internet ? NetworkTypes.Internet : NetworkTypes.Vpn,
    }))
    const filteredDhcpRelayServers = terminal.dhcpRelayServers.filter(val => !!val)
    const trafficReportFlowAnalyzer = getTrafficReportFlowAnalyzerPostRequest(terminal.trafficReportFlowAnalyzer)
    const threatDetection = getThreatDetection(terminal.threatDetection.threatDetectionPlan)
    const flowCollector = getFlowCollector(terminal.flowCollector.flowCollectorPlan)
    const behaviorDetection = getBehaviorDetection(terminal.behaviorDetection.behaviorDetectionPlan)

    return {
      customerNote: terminal.customerNote,
      terminalDeviceType: terminal.terminalDeviceType,
      deliveryName: terminal.deliveryName,
      deliveryCompanyName: terminal.deliveryCompanyName || undefined,
      deliveryDepartmentName: terminal.deliveryDepartmentName,
      deliveryPhoneNumber: terminal.deliveryPhoneNumber,
      deliveryPostalCode: terminal.deliveryPostalCode,
      deliveryAddress: terminal.deliveryAddress,
      deliveryAddressKana: convertHyphen(terminal.deliveryAddressKana),
      deliveryDate: terminal.deliveryDate,
      installationPostalCode: terminal.installationPostalCode,
      installationAddress: terminal.installationAddress,
      primaryCircuitType: terminal.primaryCircuitType as PrimaryCircuitType,
      secondaryCircuitType: (terminal.secondaryCircuitType || undefined) as SecondaryCircuitType | undefined,
      loopbackIpv4Address: terminal.loopbackIpv4Address,
      breakOut:
        terminal.breakOut.length > 0 && !terminal.breakOut.includes(UNSELECTED_VALUE) ? terminal.breakOut : undefined,
      interceptDnsServers: filteredInterceptDnsServers.length > 0 ? filteredInterceptDnsServers : undefined,
      guarantee: getTerminalGuaranteeRequest(terminal) ?? undefined,
      ipoeId: terminal.ipoeId || undefined,
      vpnId: !!terminal.vpnId && terminal.vpnId !== UNSELECTED_VALUE ? terminal.vpnId : undefined,
      lanType: terminal.lanType as LanType,
      lans: terminal.lans.map<TerminalLansType>(lan => {
        const portNumber = LansPortNumberList.find(port => `${port}` === lan.portNumber)
        const vpnNats = lan.vpnNats.map(vpnNat => ({
          ...vpnNat,
          type: vpnNat.type === NatTypes.Nat ? NatTypes.Nat : NatTypes.PartialNat,
        }))
        const isPrimary = lan.type === LansTypes.Primary
        return {
          portNumber,
          type: isPrimary ? LansTypes.Primary : LansTypes.Secondary,
          ipv4Address: lan.ipv4Address,
          ipv4PrefixLength: lan.ipv4PrefixLength,
          vpnRouting: lan.vpnRouting === 'true',
          vpnNats: vpnNats.length > 0 ? vpnNats : undefined,
          dhcpServer: isPrimary ? getTerminalDhcpServer(lan.dhcpServer) : undefined,
          lanInFilters: isPrimary ? getTerminalFilters(lan.lanInFilters) : undefined,
        }
      }),
      defaultGateway: {
        nexthopNetwork: terminal.defaultGateway.nexthopNetwork as NetworkType,
        nexthopIpv4Address: terminal.defaultGateway.nexthopIpv4Address || undefined,
        vpnRouting: terminal.defaultGateway.vpnRouting ? terminal.defaultGateway.vpnRouting === 'true' : undefined,
      },
      lanStaticRoutes: lanStaticRoutes.length > 0 ? lanStaticRoutes : undefined,
      wanStaticRoutes: wanStaticRoutes.length > 0 ? wanStaticRoutes : undefined,
      vpnInFilters: getTerminalFilters(terminal.vpnInFilters),
      vpnOutFilters: getTerminalFilters(terminal.vpnOutFilters),
      inet4OutFilters: getTerminalFilters(terminal.inet4OutFilters),
      dhcpRelayServers:
        filteredDhcpRelayServers.length > 0
          ? filteredDhcpRelayServers.map(serverIpv4Address => ({ serverIpv4Address }))
          : undefined,
      trafficReportFlowAnalyzer,
      threatDetection: threatDetection ?? { threatDetectionPlan: SecurityOptionTypes.NoSubscription },
      flowCollector: flowCollector ?? { flowCollectorPlan: SecurityOptionTypes.NoSubscription },
      behaviorDetection: behaviorDetection ?? { behaviorDetectionPlan: BehaviorDetectionOptionTypes.NoSubscription },
    }
  }

  const getTerminalBulkPostRequestWithoutMobile = (
    terminal: TerminalInputDataType,
  ): Omit<TerminalBulkUnitParameter, 'mobile'> =>
    omit(getTerminalPostRequestWithoutMobile(terminal), [
      'lanStaticRoutes',
      'wanStaticRoutes',
      'vpnInFilters',
      'vpnOutFilters',
      'inet4OutFilters',
      'terminalDeviceType',
    ])

  const getTerminalBulkPutRequest = (
    data: InitialEditBulkTerminalInputDataType,
    submitParams: Record<(typeof TERMINAL_EDIT_BULK_KEYS)[number], boolean>,
    selectedItems: Array<{ terminalId: string; terminalType: TerminalType }>,
  ): {
    rental?: TerminalBulkPutRequest
    self?: { terminalIds: string[]; request: SelfTerminalPutRequest }
  } => {
    const vpnId = submitParams.vpnId ? (data.vpnId && data.vpnId !== UNSELECTED_VALUE ? data.vpnId : null) : undefined
    const defaultGateway = submitParams.nexthopNetwork
      ? {
          nexthopNetwork:
            data.defaultGateway.nexthopNetwork === NetworkTypes.Internet ? NetworkTypes.Internet : NetworkTypes.Vpn,
        }
      : undefined
    const wanStaticRoutes = data.wanStaticRoutes.map(lan => ({
      ...lan,
      nexthopNetwork: lan.nexthopNetwork === NetworkTypes.Internet ? NetworkTypes.Internet : NetworkTypes.Vpn,
    }))
    const getDhcpServerValue = getTerminalDhcpServer(data.dhcpServer)
    const dhcpServer = getDhcpServerValue ? omit(getDhcpServerValue, ['ipv4AddressRanges']) : null
    const dhcpRelayServers = data.dhcpRelayServers
      .filter(val => !!val)
      .map(serverIpv4Address => ({ serverIpv4Address }))
    const breakOut = data.breakOut.length > 0 && !data.breakOut.includes(UNSELECTED_VALUE) ? data.breakOut : null
    const interceptDnsServers = data.interceptDnsServers.filter(val => !!val)
    const trafficReportFlowAnalyzer = getTrafficReportFlowAnalyzerPutRequest(data.trafficReportFlowAnalyzer)
    const threatDetection = getThreatDetection(data.threatDetectionPlan)
    const flowCollector = getFlowCollector(data.flowCollectorPlan)
    const behaviorDetection = getBehaviorDetection(data.behaviorDetectionPlan)

    const rentalTerminalIds = selectedItems
      .filter(item => item.terminalType === TerminalTypes.Rental)
      .map(item => item.terminalId)
    const selfTerminalIds = selectedItems
      .filter(item => item.terminalType === TerminalTypes.Self)
      .map(item => item.terminalId)
    return {
      rental:
        rentalTerminalIds.length > 0
          ? {
              terminalIds: rentalTerminalIds,
              vpnId,
              breakOut: submitParams.breakOut ? breakOut : undefined,
              interceptDnsServers: submitParams.interceptDnsServers
                ? interceptDnsServers.length > 0
                  ? interceptDnsServers
                  : null
                : undefined,
              defaultGateway,
              wanStaticRoutes: submitParams.wanStaticRoutes
                ? wanStaticRoutes.length > 0
                  ? wanStaticRoutes
                  : null
                : undefined,
              vpnInFilters: submitParams.vpnInFilters ? getTerminalFilters(data.vpnInFilters) : undefined,
              vpnOutFilters: submitParams.vpnOutFilters ? getTerminalFilters(data.vpnOutFilters) : undefined,
              inet4OutFilters: submitParams.inet4OutFilters ? getTerminalFilters(data.inet4OutFilters) : undefined,
              dhcpServer: submitParams.dhcp ? dhcpServer : undefined,
              dhcpRelayServers: submitParams.dhcp ? (dhcpRelayServers.length > 0 ? dhcpRelayServers : null) : undefined,
              trafficReportFlowAnalyzer,
              threatDetection,
              flowCollector,
              behaviorDetection,
            }
          : undefined,
      self:
        selfTerminalIds.length > 0
          ? {
              terminalIds: selfTerminalIds,
              request: {
                vpnId,
                trafficReportFlowAnalyzer,
                threatDetection,
                flowCollector,
                behaviorDetection,
              },
            }
          : undefined,
    }
  }

  const getPostRequest = (data: TerminalParams): TerminalPostRequest => {
    const hasMobile = checkCircuitTypeSelected(data.terminal, CircuitTypes.Mobile)
    const mobile = hasMobile ? getMobilePostRequest(data.mobile) : undefined

    const terminal = getTerminalPostRequestWithoutMobile(data.terminal)
    return merge(terminal, { mobile })
  }

  const getPutRequest = (data: TerminalUpdateParams): TerminalPutRequest => {
    const mobile = isEqual(data.mobile, data.original.mobile) ? undefined : data.mobile
    const putData = TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE.reduce<TerminalPutRequest>((acc, key) => {
      if (isEqual(data.terminal[key], data.original.terminal[key])) {
        return acc
      }
      if (key === 'guarantee') {
        const guarantee = getTerminalGuaranteeRequest(data.terminal, data.original.terminal)
        Object.assign(acc, { guarantee })
      } else if (key === 'vpnId') {
        // vpnId が空 または unselected の場合、vpnId と guarantee.vpn を null にする
        Object.assign(
          acc,
          data.terminal.vpnId && data.terminal.vpnId !== UNSELECTED_VALUE
            ? { vpnId: data.terminal.vpnId }
            : { vpnId: null, guarantee: getTerminalGuaranteeRequest(data.terminal, data.original.terminal) },
        )
      } else if (key === 'lanType') {
        Object.assign(acc, {
          lanType: data.terminal.lanType === LanTypes.RoutedPort ? LanTypes.RoutedPort : LanTypes.SwitchPort,
        })
      } else if (key === 'breakOut') {
        Object.assign(acc, {
          breakOut:
            data.terminal.breakOut.length > 0 && !data.terminal.breakOut.includes(UNSELECTED_VALUE)
              ? data.terminal.breakOut
              : null,
        })
      } else if (key === 'interceptDnsServers') {
        const interceptDnsServers = data.terminal.interceptDnsServers.filter(val => !!val)
        Object.assign(acc, {
          interceptDnsServers: interceptDnsServers.length > 0 ? interceptDnsServers : null,
        })
      } else if (key === 'lans') {
        const lans = data.terminal.lans.map<TerminalLansType>(lan => {
          const type = lan.type === LansTypes.Primary ? LansTypes.Primary : LansTypes.Secondary
          const portNumber = LansPortNumberList.find(portNumber => `${portNumber}` === lan.portNumber)
          const vpnNats = lan.vpnNats.map(vpnNat => ({
            ...vpnNat,
            type: vpnNat.type === NatTypes.Nat ? NatTypes.Nat : NatTypes.PartialNat,
          }))
          const isPrimary = lan.type === LansTypes.Primary
          return {
            type,
            portNumber,
            ipv4Address: lan.ipv4Address,
            ipv4PrefixLength: lan.ipv4PrefixLength,
            vpnRouting: lan.vpnRouting === 'true',
            vpnNats: lan.vpnNats.length > 0 ? vpnNats : undefined,
            dhcpServer: isPrimary ? (getTerminalDhcpServer(lan.dhcpServer) ?? null) : undefined,
            lanInFilters: isPrimary ? getTerminalFilters(lan.lanInFilters) : undefined,
          }
        })
        Object.assign(acc, { lans })
      } else if (key === 'defaultGateway') {
        const defaultGateway = {
          nexthopNetwork: data.terminal.defaultGateway.nexthopNetwork as NetworkType,
          nexthopIpv4Address: data.terminal.defaultGateway.nexthopIpv4Address || undefined,
          vpnRouting: data.terminal.defaultGateway.vpnRouting
            ? data.terminal.defaultGateway.vpnRouting === 'true'
            : undefined,
        }
        Object.assign(acc, { defaultGateway })
      } else if (key === 'lanStaticRoutes') {
        const lanStaticRoutes = data.terminal.lanStaticRoutes.map(lan => {
          const vpnNats = lan.vpnNats.map(vpnNat => ({
            ...vpnNat,
            type: vpnNat.type === NatTypes.Nat ? NatTypes.Nat : NatTypes.PartialNat,
          }))
          return {
            ...lan,
            vpnRouting: lan.vpnRouting === 'true',
            vpnNats: vpnNats.length > 0 ? lan.vpnNats : undefined,
          }
        })
        Object.assign(acc, { lanStaticRoutes: lanStaticRoutes.length > 0 ? lanStaticRoutes : null })
      } else if (key === 'wanStaticRoutes') {
        const wanStaticRoutes = data.terminal.wanStaticRoutes
        Object.assign(acc, { wanStaticRoutes: wanStaticRoutes.length > 0 ? wanStaticRoutes : null })
      } else if (key === 'vpnInFilters' || key === 'vpnOutFilters' || key === 'inet4OutFilters') {
        const filters = getTerminalFilters(data.terminal[key])
        Object.assign(acc, { [key]: filters })
      } else if (key === 'dhcpRelayServers') {
        const dhcpRelayServers = data.terminal.dhcpRelayServers
          .filter(val => !!val)
          .map(serverIpv4Address => ({ serverIpv4Address }))
        Object.assign(acc, { dhcpRelayServers: dhcpRelayServers.length > 0 ? dhcpRelayServers : null })
      } else if (key === 'trafficReportFlowAnalyzer') {
        const trafficReportFlowAnalyzer = getTrafficReportFlowAnalyzerPutRequest(
          data.terminal.trafficReportFlowAnalyzer,
          data.original.terminal.trafficReportFlowAnalyzer,
        )
        Object.assign(acc, { trafficReportFlowAnalyzer })
      } else if (key === 'threatDetection') {
        const threatDetection = getThreatDetection(data.terminal.threatDetection.threatDetectionPlan)
        Object.assign(acc, { threatDetection })
      } else if (key === 'flowCollector') {
        const flowCollector = getFlowCollector(data.terminal.flowCollector.flowCollectorPlan)
        Object.assign(acc, { flowCollector })
      } else {
        Object.assign(acc, { [key]: data.terminal[key] || null })
      }
      return acc
    }, {})
    return Object.assign(putData, { mobile })
  }

  const getDeleteRequest = (data: TerminalDeleteParams): TerminalDeleteRequest => {
    const mobile = pick(data.mobile, [...REMOVE_MOBILE_PARAMETERS])
    const japanCorporateNumber =
      data.mobile.japanCorporateNumber.length === 12
        ? `${calculateJapanCorporateNumberDigit(data.mobile.japanCorporateNumber)}${data.mobile.japanCorporateNumber}`
        : data.mobile.japanCorporateNumber
    const picAuxiliaryIdentificationDocumentType = data.mobile
      .picAuxiliaryIdentificationDocumentType as AuxiliaryIdentificationDocumentType

    return {
      removalName: data.terminal.removalName,
      removalCompanyName: data.terminal.removalCompanyName || undefined,
      removalDepartmentName: data.terminal.removalDepartmentName,
      removalPostalCode: data.terminal.removalPostalCode,
      removalAddress: data.terminal.removalAddress,
      removalAddressKana: convertHyphen(data.terminal.removalAddressKana),
      removalPhoneNumber: data.terminal.removalPhoneNumber,
      mobile: data.isMobile
        ? {
            ...mobile,
            picAddressKana: convertHyphen(data.mobile.picAddressKana),
            japanCorporateNumber,
            contractIdentificationDocumentType: data.mobile
              .contractIdentificationDocumentType as ContractIdentificationDocumentType,
            picIdentificationDocumentType: data.mobile.picIdentificationDocumentType as PicIdentificationDocumentType,
            picIdentificationNumber: data.mobile.picIdentificationNumber || undefined,
            picIdentificationBackDocumentId: data.mobile.picIdentificationBackDocumentId || undefined,
            picIdentificationAdditionalDocumentId: data.mobile.picIdentificationAdditionalDocumentId || undefined,
            picAuxiliaryIdentificationDocumentType: picAuxiliaryIdentificationDocumentType || undefined,
            picAuxiliaryIdentificationDocumentId: data.mobile.picAuxiliaryIdentificationDocumentId || undefined,
            picEmploymentDocumentType: data.mobile.picEmploymentDocumentType as EmploymentDocumentType,
          }
        : undefined,
    }
  }

  const formatLansToInputType = (lans?: TerminalLansType[] | null): TerminalLansInputType[] => {
    if (!lans || !lans.length) {
      return []
    }
    return lans.map(lan => ({
      ...lan,
      type: lan.type as string,
      portNumber: `${lan.portNumber ?? ''}`,
      vpnRouting: `${lan.vpnRouting}`,
      vpnNats: lan.vpnNats?.map(nat => ({ ...nat, type: nat.type })) ?? [],
      dhcpServer: {
        ipv4AddressRanges:
          lan.dhcpServer?.ipv4AddressRanges?.map<[string, string]>(({ start, end }) => [start, end]) ?? [],
        domain: lan.dhcpServer?.domain ?? '',
        primaryDnsServer: lan.dhcpServer?.primaryDnsServer ?? '',
        secondaryDnsServer: lan.dhcpServer?.secondaryDnsServer ?? '',
        primaryWinsServer: lan.dhcpServer?.primaryWinsServer ?? '',
        secondaryWinsServer: lan.dhcpServer?.secondaryWinsServer ?? '',
      },
      lanInFilters: {
        defaultPolicy: lan.lanInFilters?.defaultPolicy ?? '',
        accessControlList: lan.lanInFilters?.accessControlList ?? [],
      },
    }))
  }

  const formatLanStaticRoutesToInputType = (
    lanStaticRoutes?: TerminalLanStaticType[] | null,
  ): TerminalLanStaticRoutesInputType[] => {
    if (!lanStaticRoutes || !lanStaticRoutes.length) {
      return []
    }
    return lanStaticRoutes.map(route => ({
      ...route,
      vpnRouting: `${route.vpnRouting}`,
      vpnNats: route.vpnNats?.map(nat => ({ ...nat, type: nat.type })) ?? [],
    }))
  }

  return {
    checkCircuitTypeSelected,
    getShowBreakOut,
    getShowDefaultGatewayNexthop,
    getShowPicIdentificationNumber,
    getShowPicIdentificationBackDocumentFile,
    getShowPicIdentificationAdditionalDocumentFile,
    getShowPicAuxiliaryIdentificationDocumentType,
    getShowPicEmployeeCode,
    getShowCallDetailOption,
    getGuaranteeListFilterPatterns,
    primaryCircuitTypeOptions,
    secondaryCircuitTypeOptions,
    corporateVerificationMethodOptions,
    picVerificationMethodOptions,
    contractIdentificationDocumentTypeOptions,
    picIdentificationDocumentTypeOptions,
    auxiliaryIdentificationDocumentTypeOptions,
    employmentDocumentTypeOptions,
    customerReceiptRequiredOptions,
    callDetailBreakdownOptions,
    callDetailDesiredOptions,
    lanTypeOptions,
    networkTypeOptions,
    vpnRoutingOptions,
    wanDefaultGatewayVpnRoutingOptions,
    breakOutOptions,
    mobileRatOptions,
    terminalTypeOptions,
    terminalDeviceTypeOptions,
    trafficReportFlowAnalyzerPlanOptions,
    trafficReportFlowAnalyzerAlertOptions,
    threatDetectionPlanOptions,
    flowCollectorPlanOptions,
    behaviorDetectionPlanOptions,
    getLanTypeText,
    getNetworkTypeText,
    getVpnRoutingText,
    getWanDefaultGatewayVpnRoutingText,
    getCustomerReceiptRequiredText,
    getCallDetailDesiredText,
    getCallDetailBreakdownText,
    getMobileRatText,
    getTrafficReportFlowAnalyzerPlanText,
    getTrafficReportFlowAnalyzerAlertText,
    getTrafficReportFlowAnalyzerPutRequest,
    getFlowCollectorPlanText,
    getThreatDetectionPlanText,
    getFlowCollector,
    getThreatDetection,
    getBehaviorDetection,
    getBehaviorDetectionPlanText,
    getMobilePostRequest,
    getTerminalBulkPostRequestWithoutMobile,
    getPostRequest,
    getPutRequest,
    getTerminalBulkPutRequest,
    getDeleteRequest,
    defaultBirthDate,
    formatLansToInputType,
    formatLanStaticRoutesToInputType,
  }
}
