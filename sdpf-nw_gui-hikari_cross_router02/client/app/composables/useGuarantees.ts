import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes, OrderStatusTypes, TerminalTypes, BandwidthUnitTypes } from '@/api/constants'
import type { ErrorResponse, ResourceStatusType } from '@/api/types'
import {
  GUARANTEE_MAX_LIMIT,
  RESOURCE_SUMMARY_GUARANTEE_MAX_LIMIT,
  CommunicationModeTypes,
  PhysicalBandwidthTypes,
  UserInterfaceTypes,
  InternetRateLimitTypes,
  VpnRateLimitTypes,
  ReserveStatusTypes,
  ThresholdTypes,
  DurationTypes,
  NotificationIntervalTypes,
  FieldSurveyLessResultSurveyLessTypes,
  FieldSurveyLessResultDrawingResendRequestTypes,
  initialGuaranteeInputData,
  initialGuaranteeValid,
} from '@/api/guarantees/constants'
import type {
  GuaranteeListQuery,
  GuaranteeListResponse,
  ResourceSummaryGuaranteeListResponse,
  GuaranteeResponse,
  GuaranteePostRequest,
  GuaranteePutRequest,
  GuaranteeDeleteRequest,
  GuaranteeOrderPutRequest,
  BgpSessionClearRequest,
  BgpSessionClearResponse,
} from '@/api/guarantees/types'
import type { OrderGuaranteeResponse } from '@/api/orders/types'

export const useGetAllResourceSummaryGuaranteeList = () => {
  const { API } = useAPI()

  const resourceSummaryGuaranteeList = ref<ResourceSummaryGuaranteeListResponse>()
  const getAllResourceSummaryGuaranteeList = async () => {
    try {
      const response = await API.ALL<ResourceSummaryGuaranteeListResponse, { limit: number }>(
        'resource-summary/guarantees',
        {
          query: { limit: RESOURCE_SUMMARY_GUARANTEE_MAX_LIMIT },
        },
      )
      resourceSummaryGuaranteeList.value = {
        limit: RESOURCE_SUMMARY_GUARANTEE_MAX_LIMIT,
        offset: 0,
        total: response?.[0]?.total ?? 0,
        guarantees: response?.flatMap(val => (val ? val.guarantees : [])) ?? [],
      }
      return response
    } catch (error) {
      resourceSummaryGuaranteeList.value = undefined
      throw error
    }
  }

  const customerNoteList = computed(() =>
    (resourceSummaryGuaranteeList.value?.guarantees ?? [])
      .filter(guarantee => guarantee.resourceStatus !== ResourceStatusTypes.Terminated)
      .map(({ guaranteeId: id, customerNote }) => ({ id, customerNote })),
  )

  const resourceSummaryGuaranteeListOptions = computed(() =>
    (resourceSummaryGuaranteeList.value?.guarantees ?? []).map(guarantee => ({
      text: `${guarantee.guaranteeId} / ${guarantee.customerNote}`,
      value: guarantee.guaranteeId,
    })),
  )

  return {
    customerNoteList,
    resourceSummaryGuaranteeList,
    resourceSummaryGuaranteeListOptions,
    getAllResourceSummaryGuaranteeList,
  }
}

export const useGetAllGuaranteeList = () => {
  const { API } = useAPI()

  // レスポンスの vpn/internet を使うので、/v1/resource-summary/guarantees で単純な置き換えは不可
  const guaranteeList = ref<GuaranteeListResponse>({ offset: 0, total: 0, guarantees: [] })
  const getAllGuaranteeList = async () => {
    try {
      const response = await API.ALL<GuaranteeListResponse, { limit: number }>('guarantees', {
        query: { limit: GUARANTEE_MAX_LIMIT },
      })
      guaranteeList.value = {
        offset: 0,
        total: response?.[0]?.total ?? 0,
        guarantees: response?.flatMap(val => (val ? val.guarantees : [])) ?? [],
      }
      return response
    } catch (error) {
      guaranteeList.value = { offset: 0, total: 0, guarantees: [] }
      throw error
    }
  }

  // ルーターに紐付け可能なギャラティ回線の一覧を取得する
  // ルーターに紐付け済みのギャラティ回線は除外する
  const getAttachableGuaranteeList = (terminalId?: string, statuses?: ResourceStatusType[]) => {
    const attachables = statuses ?? [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive]
    return guaranteeList.value.guarantees.filter(
      guarantee =>
        attachables.includes(guarantee.resourceStatus) &&
        (!guarantee.terminalId || guarantee.terminalId === terminalId),
    )
  }

  return { guaranteeList, getAllGuaranteeList, getAttachableGuaranteeList }
}

export const useGetGuaranteeTableList = () => {
  const { API } = useAPI()

  const guaranteeQuery = ref<GuaranteeListQuery>({ limit: 10, offset: 0 })
  const guaranteeTableList = ref<GuaranteeListResponse>({ offset: 0, total: 0, guarantees: [] })
  const getGuaranteeTableList = async (query: GuaranteeListQuery) => {
    try {
      guaranteeQuery.value = query
      const response = await API.GET<GuaranteeListResponse, GuaranteeListQuery>('guarantees', { query })
      guaranteeTableList.value = response
      return response
    } catch (error) {
      guaranteeTableList.value = { offset: 0, total: 0, guarantees: [] }
      throw error
    }
  }

  return { guaranteeQuery, guaranteeTableList, getGuaranteeTableList }
}

export const useGetGuarantee = () => {
  const { API } = useAPI()

  const guarantee = ref<GuaranteeResponse | null>(null)
  const getGuarantee = async (guaranteeId: string) => {
    try {
      const response = await API.GET<GuaranteeResponse>(`guarantees/${guaranteeId}`)
      guarantee.value = response
      return response
    } catch (error) {
      guarantee.value = null
      throw error
    }
  }

  const editable = computed(
    () =>
      !!guarantee.value &&
      guarantee.value?.resourceStatus === ResourceStatusTypes.Active &&
      (!guarantee.value?.orderStatus || guarantee.value.orderStatus === OrderStatusTypes.Completed),
  )
  const removable = computed(
    () =>
      !guarantee.value?.removal ||
      (guarantee.value.orderStatus === OrderStatusTypes.Applied &&
        guarantee.value.removal.reserveStatus === ReserveStatusTypes.Rejected),
  )

  return { guarantee, editable, removable, getGuarantee }
}

export const useCreateGuarantee = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const guarantee = ref<GuaranteeResponse | null>(null)
  const createGuarantee = async (request: GuaranteePostRequest) => {
    try {
      const response = await API.POST<GuaranteeResponse, GuaranteePostRequest>('guarantees', {
        body: request,
        suppressErrorDialog: true,
      })
      guarantee.value = response
      return response
    } catch (e) {
      guarantee.value = null
      const error = e as ErrorResponse
      const message =
        error.data?.errorCode === 500
          ? t('guarantees.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { guarantee, createGuarantee }
}

export const useUpdateGuarantee = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const updateGuarantee = async (guaranteeId: string, request: GuaranteePutRequest) => {
    const response = await API.PUT<GuaranteeResponse, GuaranteePutRequest>(`guarantees/${guaranteeId}`, {
      body: request,
    })
    setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })
    return response
  }

  return { updateGuarantee }
}

export const useUpdateGuaranteeOrder = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const updateGuaranteeOrder = async (orderId: string, request: GuaranteeOrderPutRequest) => {
    try {
      const response = await API.PUT<OrderGuaranteeResponse, GuaranteeOrderPutRequest>(`orders/${orderId}`, {
        body: request,
        suppressErrorDialog: true,
      })
      // 現地調査・工事日の更新の 成功メッセージ を表示する
      if ('construction' in request.request || 'fieldSurvey' in request.request) {
        setNotificationMessageState({ message: t('guarantees.updateFieldSurveyAndConstructionOrderMessage') })
      } else if ('fieldSurveyLessInfo' in request.request) {
        // 現調レスファイルの更新の 成功メッセージ を表示する
        setNotificationMessageState({ message: t('guarantees.updateFieldSurveyLessInfoOrderMessage') })
      }
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error.data?.errorCode === 500
          ? t('guarantees.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { updateGuaranteeOrder }
}

export const useDeleteGuarantee = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteGuarantee = async (guaranteeId: string, body: GuaranteeDeleteRequest) => {
    try {
      const response = await API.DELETE<OrderGuaranteeResponse, GuaranteeDeleteRequest>(`guarantees/${guaranteeId}`, {
        body,
        suppressErrorDialog: true,
      })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error.data?.errorCode === 500
          ? t('guarantees.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { deleteGuarantee }
}

export const useBgpSessionClear = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const bgpSessionClear = async (guaranteeId: string, request: BgpSessionClearRequest) => {
    const response = await API.POST<BgpSessionClearResponse, BgpSessionClearRequest>(
      `guarantees/${guaranteeId}/bgp-session`,
      { body: request },
    )
    setNotificationMessageState({ message: t('guarantees.bgpSessionClear') })
    return response
  }

  return { bgpSessionClear }
}

export const useGetBgpSessionStatus = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const bgpSessionStatus = ref<BgpSessionClearResponse | null>(null)
  const getBgpSessionStatus = async (guaranteeId: string) => {
    try {
      const response = await API.GET<BgpSessionClearResponse>(`guarantees/${guaranteeId}/bgp-session`, {
        suppressErrorDialog: true,
      })
      bgpSessionStatus.value = response
      return response
    } catch (e) {
      bgpSessionStatus.value = null
      const error = e as ErrorResponse
      // 一度も BGP リセットを実行していない場合には 404 が返って来るが、正常な状態なのでエラーメッセージを表示しない
      if (error.statusCode !== 404) {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      throw error
    }
  }

  return { bgpSessionStatus, getBgpSessionStatus }
}

export const useGuarantees = () => {
  const { t } = useI18n()

  const inputData = ref<typeof initialGuaranteeInputData>(structuredClone(initialGuaranteeInputData))
  const inputValid = ref<typeof initialGuaranteeValid>(structuredClone(initialGuaranteeValid))

  const basicInformationRefState = useState<HTMLElement>()
  const fieldSurveyRefState = useState<HTMLElement>()
  const constructionRefState = useState<HTMLElement>()
  const scrollToAnchor = (element?: HTMLElement) => {
    const top = element?.offsetTop ?? 0
    scrollTo({ top, behavior: 'smooth' })
  }

  const duringReceptionHours = computed(() => {
    const today = dayjs().tz()
    // 第３月曜日の判定
    if (today.day() === 1 && today.date() >= 15 && today.date() <= 21) {
      // 第３月曜日の場合には 9:00～17:00(日本時間) に変わる
      return today.hour() >= 9 && today.hour() < 17
    } else {
      // 9:00～20:00(日本時間)
      return today.hour() >= 9 && today.hour() < 20
    }
  })

  const NecessaryOptions = [
    { text: t('common.necessary'), value: 'true' },
    { text: t('common.unnecessary'), value: 'false' },
  ]
  const CommunicationModeOptions = [
    { text: t('guarantees.autoNego'), value: CommunicationModeTypes.AutoNego },
    { text: t('guarantees.fullDuplex'), value: CommunicationModeTypes.FullDuplex },
  ]
  const getCommunicationModeText = (value?: string) => {
    const found = CommunicationModeOptions.find(option => option.value === value)
    return found?.text ?? value
  }
  const PhysicalBandwidthOptions = PhysicalBandwidthTypes.map(value => ({ text: value, value }))
  const UserInterfaceTypeOptions = UserInterfaceTypes.map(value => ({ text: value, value }))

  const getNecessaryText = (value?: boolean) => {
    const found = NecessaryOptions.find(option => option.value === `${value}`)
    return found?.text ?? ''
  }

  const thresholdOptions = ThresholdTypes.map(value => ({
    value,
    text: t('guarantees.thresholdOptionText', { value }),
  }))
  const durationOptions = Object.values(DurationTypes).map(value => ({
    value,
    text: t(`guarantees.${value}`),
  }))
  const notificationIntervalOptions = Object.values(NotificationIntervalTypes).map(value => ({
    value,
    text: t(`guarantees.notificationInterval${value}`),
  }))
  const getThresholdText = (value?: string | null) => {
    const found = thresholdOptions.find(option => option.value === value)
    return found?.text ?? value
  }
  const getDurationText = (value?: string | null) => {
    const found = durationOptions.find(option => option.value === value)
    return found?.text ?? value
  }
  const getNotificationIntervalText = (value?: string | null) => {
    const found = notificationIntervalOptions.find(option => option.value === value)
    return found?.text ?? value
  }

  const rateLimitRule = (data: {
    target: 'internet' | 'vpn'
    terminalType: string
    physicalBandwidth: string
    internetRateLimit: string
    vpnRateLimit: string
  }) => {
    const physicalBandwidthNumber = convertBandwidthToUnit(data.physicalBandwidth, BandwidthUnitTypes.MB)
    const internetRateLimitNumber = convertBandwidthToUnit(data.internetRateLimit, BandwidthUnitTypes.MB)
    const vpnRateLimitNumber = convertBandwidthToUnit(data.vpnRateLimit, BandwidthUnitTypes.MB)
    if (data.physicalBandwidth === '1G' && internetRateLimitNumber + vpnRateLimitNumber < 100) {
      return t('guarantees.rateLimitInvalid1000Lower')
    } else if (
      data.physicalBandwidth === '1G' &&
      data.terminalType === TerminalTypes.Rental &&
      internetRateLimitNumber + vpnRateLimitNumber > 300
    ) {
      return t('guarantees.rateLimitInvalidRental1000M')
    } else if (internetRateLimitNumber + vpnRateLimitNumber > physicalBandwidthNumber) {
      return t('guarantees.rateLimitInvalid')
    } else if (
      data.target === 'vpn' &&
      data.terminalType === TerminalTypes.Rental &&
      vpnRateLimitNumber >= physicalBandwidthNumber
    ) {
      return t('guarantees.rateLimitInvalidRentalVpn')
    }
    return true
  }

  const getInternetRateLimitOptions = (physicalBandwidth: string, terminalType: string) => {
    return InternetRateLimitTypes.filter(v => {
      if (physicalBandwidth === '100M') {
        return convertBandwidthToUnit(v, BandwidthUnitTypes.MB) <= 100
      }
      if (physicalBandwidth === '1G' && terminalType === TerminalTypes.Rental) {
        return (
          100 <= convertBandwidthToUnit(v, BandwidthUnitTypes.MB) &&
          convertBandwidthToUnit(v, BandwidthUnitTypes.MB) <= 300
        )
      }
      return (
        100 <= convertBandwidthToUnit(v, BandwidthUnitTypes.MB) &&
        convertBandwidthToUnit(v, BandwidthUnitTypes.MB) <=
          convertBandwidthToUnit(physicalBandwidth, BandwidthUnitTypes.MB)
      )
    }).map(v => ({ text: v, value: v }))
  }

  const getVpnRateLimitOptions = (physicalBandwidth: string, terminalType: string) => {
    return VpnRateLimitTypes.filter(v => {
      if (physicalBandwidth === '100M') {
        return convertBandwidthToUnit(v, BandwidthUnitTypes.MB) <= (terminalType === TerminalTypes.Rental ? 90 : 100)
      }
      if (physicalBandwidth === '1G' && terminalType === TerminalTypes.Rental) {
        return (
          100 <= convertBandwidthToUnit(v, BandwidthUnitTypes.MB) &&
          convertBandwidthToUnit(v, BandwidthUnitTypes.MB) <= 300
        )
      }
      return (
        100 <= convertBandwidthToUnit(v, BandwidthUnitTypes.MB) &&
        convertBandwidthToUnit(v, BandwidthUnitTypes.MB) <=
          convertBandwidthToUnit(physicalBandwidth, BandwidthUnitTypes.MB)
      )
    }).map(v => ({ text: v, value: v }))
  }

  const getSurveyLessText = (value?: boolean) => {
    if (typeof value === 'boolean') {
      return value === FieldSurveyLessResultSurveyLessTypes.OK ? 'OK' : 'NG'
    }
    return value
  }
  const getDrawingResendRequestText = (value?: boolean) => {
    return value === FieldSurveyLessResultDrawingResendRequestTypes.Required
      ? t('common.exist')
      : value === FieldSurveyLessResultDrawingResendRequestTypes.NotRequired
        ? t('common.nonExist')
        : ''
  }

  const updateInternetRateLimit = (internetRateLimit: string) => {
    inputData.value = {
      ...inputData.value,
      internetRateLimit,
      internetThreshold: internetRateLimit ? inputData.value.internetThreshold : '',
      internetDuration: internetRateLimit ? inputData.value.internetDuration : '',
      internetNotificationInterval: internetRateLimit ? inputData.value.internetNotificationInterval : '',
    }
    inputValid.value = {
      ...inputValid.value,
      internetThreshold: true,
      internetDuration: inputData.value.internetThreshold ? !!inputData.value.internetDuration : true,
      internetNotificationInterval: inputData.value.internetThreshold
        ? !!inputData.value.internetNotificationInterval
        : true,
    }
  }

  const updateVpnRateLimit = (vpnRateLimit: string) => {
    inputData.value = {
      ...inputData.value,
      vpnRateLimit,
      vpnThreshold: vpnRateLimit ? inputData.value.vpnThreshold : '',
      vpnDuration: vpnRateLimit ? inputData.value.vpnDuration : '',
      vpnNotificationInterval: vpnRateLimit ? inputData.value.vpnNotificationInterval : '',
    }
    inputValid.value = {
      ...inputValid.value,
      vpnThreshold: true,
      vpnDuration: inputData.value.vpnThreshold ? !!inputData.value.vpnDuration : true,
      vpnNotificationInterval: inputData.value.vpnThreshold ? !!inputData.value.vpnNotificationInterval : true,
    }
  }

  const updateInternetThreshold = (internetThreshold: string) => {
    inputData.value = {
      ...inputData.value,
      internetThreshold,
      internetDuration: internetThreshold ? inputData.value.internetDuration : '',
      internetNotificationInterval: internetThreshold ? inputData.value.internetNotificationInterval : '',
    }
    inputValid.value = {
      ...inputValid.value,
      internetThreshold: true,
      internetDuration: inputData.value.internetThreshold ? !!inputData.value.internetDuration : true,
      internetNotificationInterval: inputData.value.internetThreshold
        ? !!inputData.value.internetNotificationInterval
        : true,
    }
  }

  const updateVpnThreshold = (vpnThreshold: string) => {
    inputData.value = {
      ...inputData.value,
      vpnThreshold,
      vpnDuration: vpnThreshold ? inputData.value.vpnDuration : '',
      vpnNotificationInterval: vpnThreshold ? inputData.value.vpnNotificationInterval : '',
    }
    inputValid.value = {
      ...inputValid.value,
      vpnThreshold: true,
      vpnDuration: inputData.value.vpnThreshold ? !!inputData.value.vpnDuration : true,
      vpnNotificationInterval: inputData.value.vpnThreshold ? !!inputData.value.vpnNotificationInterval : true,
    }
  }

  return {
    inputData,
    inputValid,
    basicInformationRefState,
    fieldSurveyRefState,
    constructionRefState,
    scrollToAnchor,
    duringReceptionHours,
    NecessaryOptions,
    getNecessaryText,
    thresholdOptions,
    durationOptions,
    notificationIntervalOptions,
    getThresholdText,
    getDurationText,
    getNotificationIntervalText,
    CommunicationModeOptions,
    getCommunicationModeText,
    PhysicalBandwidthOptions,
    UserInterfaceTypeOptions,
    rateLimitRule,
    getInternetRateLimitOptions,
    getVpnRateLimitOptions,
    getSurveyLessText,
    getDrawingResendRequestText,
    updateInternetRateLimit,
    updateVpnRateLimit,
    updateInternetThreshold,
    updateVpnThreshold,
  }
}
