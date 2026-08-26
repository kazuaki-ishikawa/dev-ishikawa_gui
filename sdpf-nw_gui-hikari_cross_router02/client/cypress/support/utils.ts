// テスト用の utils なので実装の手間を考えて any を許容する
/* eslint-disable @typescript-eslint/no-explicit-any */

import dayjs from 'dayjs'
import { createI18n } from 'vue-i18n'
import { isEqual } from 'es-toolkit'
import en from '@app/locales/en.json'
import ja from '@app/locales/ja.json'
import novaEn from '@app/locales/nova/en.json'
import novaJa from '@app/locales/nova/ja.json'

import {
  CircuitTypes,
  OrderStatusTypes,
  SecurityOptionTypes,
  TrafficReportFlowAnalyzerPlanTypes,
} from '@app/api/constants'
import {
  NetworkTypes,
  DhcpTypes,
  PicIdentificationDocumentTypes,
  EmploymentDocumentTypes,
  TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE,
  LansTypes,
  LanTypes,
} from '@app/api/terminals/constants'
import type { TerminalLansType } from '@app/api/terminals/types'
import { SearchDateTypes } from '@app/api/iwanUtil/constants'

// 期間限定の申込規制(useApplicationRestriction)の影響を受けないよう、規制期間外の日時に固定するために使う
// 規制期間終了後、この定数と参照している cy.clock はまとめて削除する
export const OUTSIDE_APPLICATION_RESTRICTION_AT = '2026-08-20T09:00:00+09:00'

// 規制期間外の日付で、指定した時刻の Date を返す(cy.clock 用)
export const outsideApplicationRestrictionAt = (hours: number, minutes = 0, seconds = 0, milliseconds = 0) =>
  new Date(new Date(OUTSIDE_APPLICATION_RESTRICTION_AT).setHours(hours, minutes, seconds, milliseconds))

export const GuaranteeReserveDateAddCount = {
  [SearchDateTypes.FieldSurvey]: 6,
  [SearchDateTypes.Construction]: 16,
  [SearchDateTypes.Removal]: 9,
} as const

// 法人番号のチェックデジットを算出するメソッド(詳細は https://redmine.tok.access-company.com/nwvpn/issues/13747 参照)
const calculateJapanCorporateNumberDigit = (value: string) => {
  const newValue = Array.from(value.slice(-12)).reduceRight((acc, digit, index) => {
    if (index % 2 === 0) {
      return acc + Number(digit) * 2
    } else {
      return acc + Number(digit)
    }
  }, 0)
  return String(9 - (newValue % 9))
}

export const generateRandomHex = (length: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(length / 2)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

/** CIDR表記からプレフィックス部分を除去する (例: '1.1.1.1/32' → '1.1.1.1') */
export const stripPrefix = (v: string) => v.replace(/\/\d+$/, '')

const i18n = () => {
  const locale = navigator.language.split('-')[0]
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: {
      en: {
        ...en,
        nova: novaEn,
      },
      ja: {
        ...ja,
        nova: novaJa,
      },
    },
  })
}
export const t = i18n().global.t

const getTerminalFiltersRequest = (filters: any) => {
  if (filters?.defaultPolicy) {
    return {
      defaultPolicy: filters.defaultPolicy,
      accessControlList: filters.accessControlList,
    }
  } else {
    return null
  }
}

export const getShowPicIdentificationNumber = (picIdentificationDocumentType: string) => {
  const array = [
    PicIdentificationDocumentTypes.IndivisualNumberCard,
    PicIdentificationDocumentTypes.BasicResidentRegistrationCard,
  ] as string[]
  return !array.includes(picIdentificationDocumentType)
}
export const getShowPicIdentificationBackDocumentFile = (picIdentificationDocumentType: string) => {
  const array = [PicIdentificationDocumentTypes.IndivisualNumberCard] as string[]
  return !array.includes(picIdentificationDocumentType)
}
export const getShowPicIdentificationAdditionalDocumentFile = (picIdentificationDocumentType: string) => {
  const array = [PicIdentificationDocumentTypes.ResidenceCardAndPassport] as string[]
  return array.includes(picIdentificationDocumentType)
}
export const getShowPicAuxiliaryIdentificationDocumentType = (picIdentificationDocumentType: string) => {
  const array = [
    PicIdentificationDocumentTypes.BasicResidentRegistrationCard,
    PicIdentificationDocumentTypes.AlienRegistrationCard,
    PicIdentificationDocumentTypes.ResidenceCardAndPassport,
  ] as string[]
  return array.includes(picIdentificationDocumentType)
}
export const getShowPicEmployeeCode = (picEmploymentDocumentType: string) => {
  const array = [EmploymentDocumentTypes.EmployeeIdCard] as string[]
  return array.includes(picEmploymentDocumentType)
}

export const getTerminalMobileRequest = (mobile: any) => ({
  ...mobile,
  japanCorporateNumber:
    mobile.japanCorporateNumber?.length === 12
      ? `${calculateJapanCorporateNumberDigit(mobile.japanCorporateNumber)}${mobile.japanCorporateNumber}`
      : mobile.japanCorporateNumber,
  contractIdentificationDocumentType: mobile.contractIdentificationDocumentType,
  picIdentificationDocumentType: mobile.picIdentificationDocumentType,
  picIdentificationNumber: getShowPicIdentificationNumber(mobile.picIdentificationDocumentType)
    ? mobile?.picIdentificationNumber
    : undefined,
  picIdentificationBackDocumentId: getShowPicIdentificationBackDocumentFile(mobile.picIdentificationDocumentType)
    ? mobile.picIdentificationBackDocumentId
    : undefined,
  picIdentificationAdditionalDocumentId: getShowPicIdentificationAdditionalDocumentFile(
    mobile.picIdentificationDocumentType,
  )
    ? mobile.picIdentificationAdditionalDocumentId
    : undefined,
  picAuxiliaryIdentificationDocumentType: getShowPicAuxiliaryIdentificationDocumentType(
    mobile.picIdentificationDocumentType,
  )
    ? mobile.picAuxiliaryIdentificationDocumentType
    : undefined,
  picAuxiliaryIdentificationDocumentId: getShowPicAuxiliaryIdentificationDocumentType(
    mobile.picIdentificationDocumentType,
  )
    ? mobile.picAuxiliaryIdentificationDocumentId
    : undefined,
  picEmploymentDocumentType: mobile.picEmploymentDocumentType,
  picEmployeeCode: getShowPicEmployeeCode(mobile.picEmploymentDocumentType) ? mobile?.picEmployeeCode : undefined,
  customerReceiptRequired: mobile?.customerReceiptRequired,
  callDetailDesired: mobile?.callDetailDesired,
  callDetailBreakdownSetting: mobile?.callDetailDesired ? mobile.callDetailBreakdownSetting : undefined,
  callDetailDestinationNumberSetting: mobile?.callDetailDesired ? mobile.callDetailDestinationNumberSetting : undefined,
})

const getBreakOutRequest = (inputTerminal: any) => {
  if (inputTerminal.defaultGateway.nexthopNetwork !== NetworkTypes.Vpn) {
    return { breakOut: undefined, interceptDnsServers: undefined }
  }
  return {
    breakOut: inputTerminal.breakOut.length > 0 ? inputTerminal.breakOut : undefined,
    interceptDnsServers: inputTerminal.interceptDnsServers.length > 0 ? inputTerminal.interceptDnsServers : undefined,
  }
}
export const getTerminalPostRequest = ({ inputTerminal, inputMobile }: { inputTerminal: any; inputMobile: any }) => {
  const mobile =
    inputTerminal.primaryCircuitType === CircuitTypes.Mobile ||
    inputTerminal.secondaryCircuitType === CircuitTypes.Mobile
      ? getTerminalMobileRequest(inputMobile)
      : undefined
  const vpnInFilters = getTerminalFiltersRequest(inputTerminal.vpnId ? inputTerminal.vpnInFilters : null) as any
  const vpnOutFilters = getTerminalFiltersRequest(inputTerminal.vpnId ? inputTerminal.vpnOutFilters : null) as any
  const inet4OutFilters = getTerminalFiltersRequest(inputTerminal.inet4OutFilters) as any
  const dhcpRelayServers = inputTerminal?.dhcpRelayServers ? inputTerminal.dhcpRelayServers : undefined

  const guarantee = {
    guaranteeId: inputTerminal.guarantee?.guaranteeId,
    vpn: inputTerminal.vpnId
      ? {
          act: inputTerminal.guarantee?.vpn?.act?.connectedIpv4Prefix
            ? { connectedIpv4Prefix: inputTerminal.guarantee.vpn.act.connectedIpv4Prefix }
            : undefined,
          sby: inputTerminal.guarantee?.vpn?.sby?.connectedIpv4Prefix
            ? { connectedIpv4Prefix: inputTerminal.guarantee.vpn.sby.connectedIpv4Prefix }
            : undefined,
        }
      : undefined,
  }
  const { breakOut, interceptDnsServers } = getBreakOutRequest(inputTerminal)
  const terminal = {
    mobile,
    vpnInFilters,
    vpnOutFilters,
    inet4OutFilters,
    customerNote: inputTerminal.customerNote,
    terminalDeviceType: inputTerminal.terminalDeviceType,
    deliveryName: inputTerminal.deliveryName,
    deliveryCompanyName: inputTerminal.deliveryCompanyName || undefined,
    deliveryDepartmentName: inputTerminal.deliveryDepartmentName,
    deliveryPhoneNumber: inputTerminal.deliveryPhoneNumber,
    deliveryPostalCode: inputTerminal.deliveryPostalCode,
    deliveryAddress: inputTerminal.deliveryAddress,
    deliveryAddressKana: inputTerminal.deliveryAddressKana,
    deliveryDate: inputTerminal.deliveryDate,
    installationPostalCode: inputTerminal.installationPostalCode,
    installationAddress: inputTerminal.installationAddress,
    primaryCircuitType: inputTerminal.primaryCircuitType,
    secondaryCircuitType: inputTerminal.secondaryCircuitType || undefined,
    loopbackIpv4Address: inputTerminal.loopbackIpv4Address,
    breakOut,
    interceptDnsServers,
    guarantee: inputTerminal.primaryCircuitType === CircuitTypes.Guarantee ? guarantee : undefined,
    ipoeId: inputTerminal.ipoeId || undefined,
    vpnId: inputTerminal.vpnId || undefined,
    lanType: inputTerminal.lanType,
    lans: inputTerminal.lans.map((lan: any) => {
      const dhcpServer = lan?.dhcpServer
        ? {
            ipv4AddressRanges:
              lan.dhcpServer.ipv4AddressRanges.length > 0 ? lan.dhcpServer.ipv4AddressRanges : undefined,
            domain: lan.dhcpServer.domain || undefined,
            primaryDnsServer: lan.dhcpServer.primaryDnsServer || undefined,
            secondaryDnsServer: lan.dhcpServer.secondaryDnsServer || undefined,
            primaryWinsServer: lan.dhcpServer.primaryWinsServer || undefined,
            secondaryWinsServer: lan.dhcpServer.secondaryWinsServer || undefined,
          }
        : undefined
      const lanInFilters = lan.type === LansTypes.Primary ? getTerminalFiltersRequest(lan.lanInFilters) : undefined
      return {
        ...lan,
        portNumber: inputTerminal.lanType === LanTypes.RoutedPort ? lan.portNumber : undefined,
        dhcpServer,
        lanInFilters,
      }
    }),
    defaultGateway: {
      nexthopNetwork: inputTerminal.defaultGateway.nexthopNetwork,
      nexthopIpv4Address:
        inputTerminal.defaultGateway.nexthopNetwork === NetworkTypes.Lan
          ? inputTerminal.defaultGateway.nexthopIpv4Address
          : undefined,
      vpnRouting:
        inputTerminal.defaultGateway.nexthopNetwork === NetworkTypes.Lan
          ? inputTerminal.defaultGateway.vpnRouting
          : undefined,
    },
    lanStaticRoutes:
      inputTerminal.lanStaticRoutes && inputTerminal.lanStaticRoutes.length > 0
        ? inputTerminal.lanStaticRoutes
        : undefined,
    wanStaticRoutes:
      inputTerminal.wanStaticRoutes && inputTerminal.wanStaticRoutes.length > 0
        ? inputTerminal.wanStaticRoutes
        : undefined,
    dhcpRelayServers,
    trafficReportFlowAnalyzer: inputTerminal.trafficReportFlowAnalyzer,
    threatDetection: inputTerminal.threatDetection,
    flowCollector: inputTerminal.flowCollector,
    behaviorDetection: inputTerminal.behaviorDetection,
  }
  return terminal
}

export const getTerminalPutRequest = (terminal: { input: any; original: any }) => {
  const originalDhcpType = terminal.original.lans.some(
    (lan: TerminalLansType) => lan.type === LansTypes.Primary && !!lan.dhcpServer,
  )
    ? DhcpTypes.Server
    : terminal.original?.dhcpRelayServers
      ? DhcpTypes.Relay
      : DhcpTypes.None

  const hasMobile =
    terminal.original.primaryCircuit.circuitType === CircuitTypes.Mobile ||
    terminal.original.secondaryCircuit?.circuitType === CircuitTypes.Mobile
  const mobile =
    hasMobile && terminal.original?.mobile?.rat !== terminal.input?.mobile?.rat ? terminal.input.mobile : undefined

  const putData = TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE.reduce((acc, key) => {
    if (['primaryCircuitType', 'secondaryCircuitType'].includes(key)) {
      // 利用回線が変わらない場合は undefined にする
      const primaryCircuitType =
        terminal.original.primaryCircuit.circuitType === terminal.input.primaryCircuitType
          ? undefined
          : terminal.input.primaryCircuitType
      const secondaryCircuitType =
        terminal.original.secondaryCircuit?.circuitType === terminal.input.secondaryCircuitType
          ? undefined
          : (terminal.input.secondaryCircuitType ?? null)
      const ipoeId = [terminal.input.primaryCircuitType, terminal.input.secondaryCircuitType].includes(
        CircuitTypes.Ipoe,
      )
        ? terminal.input.ipoeId
        : terminal.original.ipoeId
          ? null
          : undefined
      Object.assign(acc, { primaryCircuitType, secondaryCircuitType, ipoeId })
      return acc
    }
    if (isEqual(terminal.input[key], terminal.original[key]) || key === 'ipoeId') {
      return acc
    }
    if (key === 'guarantee') {
      // original に guarantee がない場合は undefined になる
      const empty =
        terminal.input.primaryCircuitType !== CircuitTypes.Guarantee &&
        terminal.original.primaryCircuit.circuitType === CircuitTypes.Guarantee
          ? null
          : undefined
      const includesGuarantee = terminal.input.primaryCircuitType === CircuitTypes.Guarantee
      const guarantee = {
        guaranteeId: terminal.input.guarantee?.guaranteeId,
        vpn: terminal.input.vpnId
          ? {
              act: {
                connectedIpv4Prefix: terminal.input.guarantee?.vpn?.act?.connectedIpv4Prefix || null,
              },
              sby: {
                connectedIpv4Prefix: terminal.input.guarantee?.vpn?.sby?.connectedIpv4Prefix || null,
              },
            }
          : undefined,
      }
      Object.assign(acc, { guarantee: includesGuarantee ? guarantee : empty })
    } else if (key === 'lans') {
      const lans = terminal.input.lans.map((lan: any) => {
        const isPrimary = lan.type === LansTypes.Primary
        const lanInFilters = isPrimary ? getTerminalFiltersRequest(lan.lanInFilters) : undefined
        return {
          ...lan,
          lanInFilters,
        }
      })
      Object.assign(acc, { lans })
    } else if (key === 'defaultGateway') {
      const defaultGateway = {
        nexthopNetwork: terminal.input.defaultGateway.nexthopNetwork,
        nexthopIpv4Address:
          terminal.input.defaultGateway.nexthopNetwork === NetworkTypes.Lan
            ? terminal.input.defaultGateway.nexthopIpv4Address
            : undefined,
        vpnRouting:
          terminal.input.defaultGateway.nexthopNetwork === NetworkTypes.Lan
            ? terminal.input.defaultGateway.vpnRouting
            : undefined,
      }
      Object.assign(acc, { defaultGateway })
    } else if (key === 'lanStaticRoutes') {
      Object.assign(acc, { lanStaticRoutes: terminal.input.lanStaticRoutes })
    } else if (key === 'wanStaticRoutes') {
      Object.assign(acc, { wanStaticRoutes: terminal.input.wanStaticRoutes })
    } else if (key === 'inet4OutFilters') {
      const filters = getTerminalFiltersRequest(terminal.input[key])
      Object.assign(acc, { [key]: filters })
    } else if (key === 'vpnInFilters' || key === 'vpnOutFilters') {
      const filters = getTerminalFiltersRequest(terminal.input.vpnId ? terminal.input[key] : null)
      Object.assign(acc, { [key]: filters })
    } else if (key === 'dhcpRelayServers') {
      if (originalDhcpType === DhcpTypes.Relay) {
        Object.assign(acc, { dhcpRelayServers: null })
      } else {
        Object.assign(acc, { dhcpRelayServers: terminal.input.dhcpRelayServers ?? undefined })
      }
    } else if (key === 'breakOut') {
      const breakOut =
        terminal.input.defaultGateway.nexthopNetwork === NetworkTypes.Vpn
          ? terminal.input.breakOut
          : terminal.original.defaultGateway.nexthopNetwork === NetworkTypes.Vpn
            ? null
            : undefined
      Object.assign(acc, { breakOut })
    } else if (key === 'interceptDnsServers') {
      const interceptDnsServers =
        terminal.input.defaultGateway.nexthopNetwork === NetworkTypes.Vpn
          ? terminal.input.interceptDnsServers
          : terminal.original.defaultGateway.nexthopNetwork === NetworkTypes.Vpn
            ? null
            : undefined
      Object.assign(acc, { interceptDnsServers })
    } else if (key === 'trafficReportFlowAnalyzer') {
      const planChanged =
        terminal.original.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan !==
        terminal.input.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan
      const alertChanged =
        terminal.original.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert !==
        terminal.input.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert
      if (planChanged || alertChanged) {
        Object.assign(acc, {
          trafficReportFlowAnalyzer: {
            ...(planChanged && {
              trafficReportFlowAnalyzerPlan: terminal.input.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan,
            }),
            ...(alertChanged && {
              trafficReportFlowAnalyzerAlert: terminal.input.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert,
            }),
          },
        })
      }
    } else {
      Object.assign(acc, { [key]: terminal.input[key] })
    }
    return acc
  }, {})
  return Object.assign(putData, { mobile })
}

export const getTerminalBulkPostRequest = ({
  inputTerminals,
  inputMobile,
}: {
  inputTerminals: any
  inputMobile: any
}) => {
  const terminals = inputTerminals.map((terminal: any) => {
    const request = getTerminalPostRequest({ inputTerminal: terminal, inputMobile })
    delete request.mobile
    delete request.vpnInFilters
    delete request.vpnOutFilters
    delete request.inet4OutFilters
    delete request.lanStaticRoutes
    delete request.wanStaticRoutes
    delete request.terminalDeviceType

    return request
  })
  const mobile = getTerminalMobileRequest(inputMobile)

  return { mobile, terminals }
}

const isBetweenNovemberAndBeginningOfYear = (date: dayjs.Dayjs) => {
  return date.month() >= 10 || (date.month() === 0 && date.date() < 4)
}
// base は cy.clock で日時を固定しているテストのために指定する(通常は当日基準でよい)
export const nDaysLater = (days = 0, base = dayjs()) => {
  const today = base
  if (isBetweenNovemberAndBeginningOfYear(today)) {
    // 11月〜1月始め 〜 +days日の間に休業日を挟むので、休業明けの 1/4 を 1 日目とした days 日後を返す
    return today.add(2, 'months').month(0).date(3).add(days, 'days').format('YYYY-MM-DD')
  } else {
    return today.add(days, 'days').format('YYYY-MM-DD')
  }
}

export const getGuaranteeYearMonthOptions = (minYearMonth: string) =>
  [...Array(6)]
    .map((_, index) =>
      // 基準月は今月で、+5か月先までリストにする
      dayjs().add(index, 'months').format('YYYY-MM'),
    )
    // minYearMonth より前の月はリストから除外する
    .filter(value => dayjs(value).isSameOrAfter(dayjs(minYearMonth), 'months'))

export const orderStatusTypeTranslation = {
  [OrderStatusTypes.Applied]: t('orders.applied'),
  [OrderStatusTypes.Processing]: t('orders.processing'),
  [OrderStatusTypes.Completed]: t('orders.completed'),
  [OrderStatusTypes.Canceled]: t('orders.canceled'),
  [OrderStatusTypes.Rejected]: t('orders.rejected'),
  [OrderStatusTypes.Aborted]: t('orders.aborted'),
} as const

export const getGuaranteeCustomerNote = (id?: string, list?: Array<{ guaranteeId: string; customerNote: string }>) =>
  list?.find(g => g.guaranteeId === id)?.customerNote

export const getTrafficReportFlowAnalyzerPlanInputValue = (trafficReportFlowAnalyzerPlan: string) => {
  if (trafficReportFlowAnalyzerPlan === TrafficReportFlowAnalyzerPlanTypes.NoSubscription) {
    return t('terminals.noSubscription')
  } else if (trafficReportFlowAnalyzerPlan === TrafficReportFlowAnalyzerPlanTypes.FreePlan) {
    return t('terminals.planOption', { plan: t('terminals.freePlan') })
  } else {
    return t('terminals.planOption', { plan: trafficReportFlowAnalyzerPlan })
  }
}

export const getTrafficReportFlowAnalyzerAlertInputValue = (trafficReportFlowAnalyzerAlert: boolean) => {
  return trafficReportFlowAnalyzerAlert ? t('common.use') : t('common.disuse')
}

export const getThreatDetectionPlanInputValue = (threatDetectionPlan: string) => {
  const plans = [
    SecurityOptionTypes.NoSubscription,
    SecurityOptionTypes.Plan3Months,
    SecurityOptionTypes.Plan12Months,
  ] as string[]
  return plans.includes(threatDetectionPlan)
    ? t(`terminals.threatDetectionOptions.${threatDetectionPlan}`)
    : t('terminals.threatDetectionOptions.noSubscription')
}

export const getFlowCollectorPlanInputValue = (flowCollectorPlan: string) => {
  const plans = Object.values(SecurityOptionTypes) as string[]
  return plans.includes(flowCollectorPlan)
    ? t(`terminals.flowCollectorOptions.${flowCollectorPlan}`)
    : t('terminals.flowCollectorOptions.noSubscription')
}

export const getBehaviorDetectionPlanInputValue = (behaviorDetectionPlan: string): string => {
  switch (behaviorDetectionPlan) {
    case 'noSubscription':
      return t('common.disuse')
    case 'subscription':
      return t('common.use')
    default:
      return t('common.disuse')
  }
}

export const getTermsLinkButtonLabel = (termsOfServiceAccepted: boolean) =>
  termsOfServiceAccepted ? t('terms.agreedTermsLinkButton') : t('terms.termsLinkButton')

export const convertByteToString = (byte: number, decimalPlaces = 0) => {
  if (byte < 1024) {
    return `${byte}B`
  }

  const kB = byte / 1024
  if (kB < 1024) {
    return `${kB.toFixed(decimalPlaces)}KB`
  }
  const mB = kB / 1024
  if (mB < 1024) {
    return `${mB.toFixed(decimalPlaces)}MB`
  }
  const gB = mB / 1024
  if (gB < 1024) {
    return `${gB.toFixed(decimalPlaces)}GB`
  }
  const tB = gB / 1024
  return `${tB.toFixed(decimalPlaces)}TB`
}

export const getScheduleNetworks = () => {
  const times = [8, 10, 12, 14]
  return [...Array(3)]
    .flatMap((_, i) => {
      const date = dayjs().add(i, 'day').hour(times[i]).minute(0).second(0)
      const hours = date
        .hour(times[i + 1])
        .minute(0)
        .second(0)
      const nextMonth = date.add(1, 'month')
      return [date.format(), hours.format(), nextMonth.format()]
    })
    .sort()
}

export const formatDate = (date: string) => {
  return dayjs(date).format('YYYY/MM/DD')
}
