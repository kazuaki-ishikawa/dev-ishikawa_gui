import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { isEqual } from 'es-toolkit'
import type { ErrorResponse } from '@/api/types'
import { BreakOutTypes } from '@/api/constants'
import type { AvailableLinePrefixResponse } from '@/api/rinkLines/types'
import {
  RINK_MOBILE_ERROR_TEXT,
  RinkConnectionTypes,
  RinkConnectionCustomLocalBreakOutNameList,
  RinkConnectionVpnFilterPatternTypes,
  RinkConnectionEditTypes,
  RinkConnectionDeleteColumnsTypes,
} from '@/api/rinkConnections/constants'
import type {
  InitialRinkConnectionInputDataType,
  RinkConnectionType,
  RinkConnectionEditType,
  RinkConnectionListResponse,
  RinkConnectionListRinkMobileIdResponse,
  RinkConnectionResponse,
  RinkConnectionCustomLocalBreakOutType,
  RinkConnectionPostRequest,
  RinkConnectionPostResponse,
  RinkConnectionPutRequest,
  RinkConnectionDeleteRequest,
  ScheduleNetworkOrderType,
  ScheduleNetworkListQuery,
  ScheduleNetworkListResponse,
  RinkConnectionDeleteColumnsType,
  RinkConnectionWanSecurityNumberOfLinesResponse,
} from '@/api/rinkConnections/types'

export const useGetRinkConnectionLinePrefix = () => {
  const { RINK_MOBILE_API } = useAPI()
  const availableLinePrefix = ref<AvailableLinePrefixResponse>({ lineActPrefix: [], lineSbyPrefix: [] })
  const getRinkConnectionLinePrefix = async (rinkMobileId: string) => {
    try {
      const response = await RINK_MOBILE_API.GET<AvailableLinePrefixResponse>(
        `rink-connections/linePrefix/${rinkMobileId}`,
      )
      availableLinePrefix.value = response
      return response
    } catch (error) {
      availableLinePrefix.value = { lineActPrefix: [], lineSbyPrefix: [] }
      throw error
    }
  }
  return { availableLinePrefix, getRinkConnectionLinePrefix }
}

export const useGetWanSecurityNumberOfLines = () => {
  const { RINK_MOBILE_API } = useAPI()

  const wanSecurityNumberOfLines = ref(0)
  const getWanSecurityNumberOfLines = async () => {
    try {
      const response = await RINK_MOBILE_API.GET<RinkConnectionWanSecurityNumberOfLinesResponse>(
        'lines/wan-security-enabled-count',
      )
      wanSecurityNumberOfLines.value = response.totalWanSecurityNumberOfLines
      return response
    } catch (error) {
      wanSecurityNumberOfLines.value = 0
      throw error
    }
  }

  return { wanSecurityNumberOfLines, getWanSecurityNumberOfLines }
}

export const useGetRinkConnectionList = () => {
  const { RINK_MOBILE_API } = useAPI()

  const rinkConnectionList = ref<RinkConnectionListResponse[]>([])
  const rinkConnectionListIncludingScheduled = ref<RinkConnectionListRinkMobileIdResponse[]>([])
  const getRinkConnectionList = async () => {
    try {
      const response = await RINK_MOBILE_API.GET<RinkConnectionListResponse[]>('rink-connections/self-only')
      rinkConnectionList.value = response
      return response
    } catch (error) {
      rinkConnectionList.value = []
      throw error
    }
  }

  // 未開通の設備も含めて取得する設備一覧取得API
  const getRinkConnectionListIncludingScheduled = async () => {
    try {
      const response = await RINK_MOBILE_API.GET<RinkConnectionListRinkMobileIdResponse[]>(
        'rink-connections/pre-self-only',
      )
      rinkConnectionListIncludingScheduled.value = response
      return response
    } catch (error) {
      rinkConnectionListIncludingScheduled.value = []
      throw error
    }
  }

  const rinkMobileIdOptions = computed(() =>
    rinkConnectionList.value.map(rinkConnection => ({
      text: rinkConnection.zId,
      value: rinkConnection.zId,
    })),
  )
  const rinkMobileIdOptionsIncludingScheduled = computed(() =>
    rinkConnectionListIncludingScheduled.value.map(rinkConnection => ({
      text: rinkConnection.zId,
      value: rinkConnection.zId,
    })),
  )
  return {
    rinkConnectionList,
    getRinkConnectionList,
    getRinkConnectionListIncludingScheduled,
    rinkMobileIdOptions,
    rinkMobileIdOptionsIncludingScheduled,
  }
}

export const useGetRinkConnection = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()

  const rinkConnection = ref<RinkConnectionResponse | null>(null)
  const getRinkConnection = async (rinkMobileId: string) => {
    try {
      const response = await RINK_MOBILE_API.GET<RinkConnectionResponse>(`rink-connections/self-add/${rinkMobileId}`)
      rinkConnection.value = response
      return response
    } catch (error) {
      rinkConnection.value = null
      throw error
    }
  }

  const rinkConnectionEditMenuTranslation = computed(() => ({
    [RinkConnectionEditTypes.ConnectionType]: {
      text: t('rinkConnections.editMenu.connectionType'),
      disabled: !rinkConnection.value?.connectionType,
    },
    [RinkConnectionEditTypes.VpnConnectionPrefix]: {
      text: t('rinkConnections.editMenu.vpnConnectionPrefix'),
      disabled: rinkConnection.value?.connectionType !== RinkConnectionTypes.InternetVpn,
    },
    [RinkConnectionEditTypes.LocalBreakOut]: {
      text: t('rinkConnections.editMenu.localBreakOut'),
      disabled: rinkConnection.value?.connectionType !== RinkConnectionTypes.VpnBreakOut,
    },
    [RinkConnectionEditTypes.DnsServer]: {
      text: t('rinkConnections.editMenu.dnsServer'),
      disabled: !rinkConnection.value?.connectionType,
    },
  }))
  const rinkConnectionEditMenuOptions = computed(() =>
    Object.entries(rinkConnectionEditMenuTranslation.value).map(([value, data]) => ({
      ...data,
      value,
    })),
  )

  return { rinkConnection, getRinkConnection, rinkConnectionEditMenuOptions }
}

export const useCreateRinkConnection = () => {
  const { t } = useI18n()
  const { RINK_MOBILE_API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const createRinkConnection = async (body: RinkConnectionPostRequest) => {
    try {
      const response = await RINK_MOBILE_API.POST<RinkConnectionPostResponse, RinkConnectionPostRequest>(
        'rink-connections/self-only',
        { body, suppressErrorDialog: true },
      )
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error?.data?.moreInfo === RINK_MOBILE_ERROR_TEXT.RECEPTION_IS_CLOSED
          ? t('rinkConnections.message.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { createRinkConnection }
}

export const useUpdateRinkConnection = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const updateRinkConnection = async (
    rinkMobileId: string,
    editMenu: RinkConnectionEditType,
    request: RinkConnectionPutRequest<typeof editMenu>,
  ) => {
    try {
      const response = await RINK_MOBILE_API.PUT<{ id: string }, RinkConnectionPutRequest<typeof editMenu>>(
        `rink-connections/${editMenu}/${rinkMobileId}`,
        { body: request, suppressErrorDialog: true },
      )
      setNotificationMessageState({ message: t('message.finished'), isRinkMobile: true })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error?.data?.moreInfo === RINK_MOBILE_ERROR_TEXT.RECEPTION_IS_CLOSED
          ? t('rinkConnections.message.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { updateRinkConnection }
}

export const useDeleteRinkConnection = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteRinkConnection = async (rinkMobileId: string, request: RinkConnectionDeleteRequest) => {
    try {
      const response = await RINK_MOBILE_API.DELETE<{ id: string }, RinkConnectionDeleteRequest>(
        `rink-connections/self-add/${rinkMobileId}`,
        { body: request, suppressErrorDialog: true },
      )
      setNotificationMessageState({ message: t('message.finished'), isRinkMobile: true })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error?.data?.moreInfo === RINK_MOBILE_ERROR_TEXT.RECEPTION_IS_CLOSED
          ? t('rinkConnections.message.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { deleteRinkConnection }
}

export const useGetCustomLocalBreakoutList = () => {
  const { RINK_MOBILE_API } = useAPI()

  const customLocalBreakOutList = ref<RinkConnectionCustomLocalBreakOutType[]>([])
  const getCustomLocalBreakoutList = async (rinkMobileId: string) => {
    try {
      const response = await RINK_MOBILE_API.GET<RinkConnectionCustomLocalBreakOutType[] | null>(
        `rink-connections/local-breakout-list/${rinkMobileId}`,
      )
      customLocalBreakOutList.value = response ?? []
      return response
    } catch (error) {
      customLocalBreakOutList.value = []
      throw error
    }
  }
  return { customLocalBreakOutList, getCustomLocalBreakoutList }
}

export const useGetScheduleNetworkList = () => {
  const { RINK_MOBILE_API } = useAPI()

  const scheduleNetworkList = ref<string[]>([])
  const getScheduleNetworkList = async (orderType: ScheduleNetworkOrderType) => {
    try {
      const response = await RINK_MOBILE_API.GET<ScheduleNetworkListResponse, ScheduleNetworkListQuery>(
        'schedule-network/self-only',
        { query: { orderType } },
      )
      scheduleNetworkList.value = response.scheduleNetworks
      return response
    } catch (error) {
      scheduleNetworkList.value = []
      throw error
    }
  }

  return { scheduleNetworkList, getScheduleNetworkList }
}

export const useRinkConnections = () => {
  const { t } = useI18n()

  const duringReceptionHours = computed(() => {
    const today = dayjs().tz()
    // 0:00～20:00(日本時間)
    return today.hour() >= 0 && today.hour() < 20
  })

  const rinkConnectionTypeTranslation = {
    [RinkConnectionTypes.InternetOnly]: t('rinkConnections.internetOnly'),
    [RinkConnectionTypes.InternetVpn]: t('rinkConnections.internetVpn'),
    [RinkConnectionTypes.VpnOnly]: t('rinkConnections.vpnOnly'),
    [RinkConnectionTypes.VpnBreakOut]: t('rinkConnections.vpnBreakOut'),
  }
  const rinkConnectionTypeOptions = Object.entries(rinkConnectionTypeTranslation).map(([value, text]) => ({
    text,
    value,
  }))
  const breakOutOptions = Object.values(BreakOutTypes).map(value => ({
    text: t(`rinkConnections.${value}`),
    value,
  }))
  const getBreakOutText = (value: string) => {
    const found = breakOutOptions.find(option => option.value === value)
    return found ? found.text : value
  }
  const customLocalBreakOutNameOptions = RinkConnectionCustomLocalBreakOutNameList.map(value => ({
    text: value,
    value,
  }))
  const vpnFilterPatternOptions = Object.values(RinkConnectionVpnFilterPatternTypes).map(value => ({
    text: t(`rinkConnections.${value}`),
    value,
  }))
  const getVpnFilterPatternText = (value: string) => {
    const found = vpnFilterPatternOptions.find(option => option.value === value)
    return found ? found.text : value
  }

  const useableOptions = [
    { text: t('common.use'), value: true },
    { text: t('common.disuse'), value: false },
  ]
  const getUseableText = (value: boolean) => {
    return value ? t('common.use') : t('common.disuse')
  }
  const duplicateDnsIpAddressRules = (otherIp: string) => (value: string) => {
    const normalize = (ip: string) => ip.replace(/\/\d+$/, '')
    return (
      !otherIp ||
      !value ||
      normalize(otherIp) !== normalize(value) ||
      t('rinkConnections.message.duplicatedDnsServerIpAddress')
    )
  }

  const getRinkConnectionPostRequest = (inputData: InitialRinkConnectionInputDataType): RinkConnectionPostRequest => {
    const isInternetOnly = inputData.connectionType === RinkConnectionTypes.InternetOnly
    const isVpnBreakOut = inputData.connectionType === RinkConnectionTypes.VpnBreakOut
    const vpnConnectionPrefix = inputData.vpnConnectionPrefix.filter(Boolean)
    const customLocalBreakOutList = inputData.customLocalBreakOutList.map(data => {
      const fqdnList = data.fqdnList.filter(Boolean).map(fqdn => ({ fqdn }))
      const dstPrefixList = data.dstPrefixList.filter(Boolean).map(prefix => ({ prefix }))
      return {
        name: data.name,
        nameAlias: data.nameAlias,
        fqdnList: fqdnList.length > 0 ? fqdnList : undefined,
        dstPrefixList: dstPrefixList.length > 0 ? dstPrefixList : undefined,
      }
    })
    const systemLocalBreakOutList = inputData.breakOutList.map(name => ({ name }))

    return {
      connectionType: inputData.connectionType as RinkConnectionType,
      vpnId: !isInternetOnly ? inputData.vpnId : undefined,
      poiRedundancy: inputData.poiRedundancy,
      vpnConnectionPrefix:
        inputData.connectionType === RinkConnectionTypes.InternetVpn && vpnConnectionPrefix.length > 0
          ? vpnConnectionPrefix
          : undefined,
      lineActPrefix: [inputData.lineActPrefix],
      lineSbyPrefix: inputData.lineSbyPrefix ? [inputData.lineSbyPrefix] : undefined,
      dnsIpAddressPrimary: inputData.dnsIpAddressPrimary || undefined,
      dnsIpAddressSecondary: inputData.dnsIpAddressSecondary || undefined,
      vpnNetworkPrefix: !isInternetOnly ? inputData.vpnNetworkPrefix : undefined,
      optionLocalBreakOut: isVpnBreakOut || undefined,
      customLocalBreakOutList:
        isVpnBreakOut && customLocalBreakOutList.length > 0 ? customLocalBreakOutList : undefined,
      systemLocalBreakOutList:
        isVpnBreakOut && systemLocalBreakOutList.length > 0 ? systemLocalBreakOutList : undefined,
      timeFrame: inputData.timeFrame,
    }
  }

  const diffValue = <T extends string | number | boolean | undefined>(before: T, after: T) => {
    return before === after ? undefined : after
  }
  const diffArray = <T>(before: T[] | undefined, after: T[] | undefined) => {
    return isEqual(before, after) ? undefined : after
  }
  const diffDnsIpAddress = (
    originalData: RinkConnectionPostRequest,
    inputData: RinkConnectionPostRequest,
  ): {
    dnsIpAddressPrimary?: string
    dnsIpAddressSecondary?: string
    deleteColumns?: RinkConnectionDeleteColumnsType[]
  } => {
    const dnsIpAddressPrimary = diffValue(originalData.dnsIpAddressPrimary, inputData.dnsIpAddressPrimary)
    const dnsIpAddressSecondary = diffValue(originalData.dnsIpAddressSecondary, inputData.dnsIpAddressSecondary)

    // 「3 VPN通信利用」の場合
    if (inputData.connectionType === RinkConnectionTypes.VpnOnly) {
      if (!!originalData.dnsIpAddressPrimary && !!inputData.dnsIpAddressPrimary) {
        // 「利用あり」→「利用あり」の場合
        return { dnsIpAddressPrimary, dnsIpAddressSecondary }
      } else if (!!originalData.dnsIpAddressPrimary && !inputData.dnsIpAddressPrimary) {
        // 「利用あり」→「利用なし」の場合
        return {
          deleteColumns: [
            RinkConnectionDeleteColumnsTypes.DnsIpAddressPrimary,
            RinkConnectionDeleteColumnsTypes.DnsIpAddressSecondary,
          ],
        }
      }
    }
    // 「3 VPN通信利用」以外の場合
    return { dnsIpAddressPrimary, dnsIpAddressSecondary }
  }

  const getRinkConnectionPutRequest = ({
    originalData,
    inputData,
    editMenu,
  }: {
    originalData: InitialRinkConnectionInputDataType
    inputData: InitialRinkConnectionInputDataType
    editMenu: RinkConnectionEditType
  }) => {
    const originalRequest = getRinkConnectionPostRequest(originalData)
    const inputRequest = getRinkConnectionPostRequest(inputData)

    const { dnsIpAddressPrimary, dnsIpAddressSecondary, deleteColumns } = diffDnsIpAddress(
      originalRequest,
      inputRequest,
    )
    const customLocalBreakOutList = diffArray(
      originalRequest.customLocalBreakOutList,
      inputRequest.customLocalBreakOutList,
    )
    const vpnConnectionPrefix = diffArray(originalRequest.vpnConnectionPrefix, inputRequest.vpnConnectionPrefix)
    const systemLocalBreakOutList = diffArray(
      originalRequest.systemLocalBreakOutList,
      inputRequest.systemLocalBreakOutList,
    )
    const optionLocalBreakOut = inputData.connectionType === RinkConnectionTypes.VpnBreakOut ? true : undefined

    switch (editMenu) {
      case RinkConnectionEditTypes.ConnectionType: {
        const request: RinkConnectionPutRequest<typeof RinkConnectionEditTypes.ConnectionType> = {
          connectionType: inputRequest.connectionType,
          vpnId: originalData.connectionType === RinkConnectionTypes.InternetOnly ? inputRequest.vpnId : undefined,
          vpnConnectionPrefix,
          dnsIpAddressPrimary,
          dnsIpAddressSecondary,
          deleteColumns,
          vpnNetworkPrefix: diffValue(originalRequest.vpnNetworkPrefix, inputRequest.vpnNetworkPrefix),
          optionLocalBreakOut,
          customLocalBreakOutList,
          systemLocalBreakOutList,
          timeFrame: inputData.timeFrame,
        }
        return request
      }
      case RinkConnectionEditTypes.DnsServer: {
        const request: RinkConnectionPutRequest<typeof RinkConnectionEditTypes.DnsServer> = {
          dnsIpAddressPrimary,
          dnsIpAddressSecondary,
          deleteColumns,
          timeFrame: inputData.timeFrame,
        }
        return request
      }
      case RinkConnectionEditTypes.LocalBreakOut: {
        const request: RinkConnectionPutRequest<typeof RinkConnectionEditTypes.LocalBreakOut> = {
          systemLocalBreakOutList: inputRequest.systemLocalBreakOutList ?? [],
          customLocalBreakOutList: inputRequest.customLocalBreakOutList ?? [],
          timeFrame: inputData.timeFrame,
        }
        return request
      }
      case RinkConnectionEditTypes.VpnConnectionPrefix: {
        const request: RinkConnectionPutRequest<typeof RinkConnectionEditTypes.VpnConnectionPrefix> = {
          vpnConnectionPrefix,
          timeFrame: inputData.timeFrame,
        }
        return request
      }
    }
  }

  return {
    duringReceptionHours,
    rinkConnectionTypeTranslation,
    rinkConnectionTypeOptions,
    breakOutOptions,
    getBreakOutText,
    customLocalBreakOutNameOptions,
    vpnFilterPatternOptions,
    getVpnFilterPatternText,
    useableOptions,
    getUseableText,
    duplicateDnsIpAddressRules,
    getRinkConnectionPostRequest,
    getRinkConnectionPutRequest,
  }
}
