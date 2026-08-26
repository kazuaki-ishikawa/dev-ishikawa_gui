import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import { RINK_MOBILE_ERROR_TEXT } from '@/api/rinkConnections/constants'
import {
  RinkLineAdditionalLimitTypes,
  RinkLineEditMenuTypes,
  RinkLineAccessTypes,
  RinkLineStatusTypes,
  initialShippingInfoInputData,
  initialShippingInfoValid,
} from '@/api/rinkLines/constants'
import type {
  RinkLineAdditionalLimitType,
  RinkLineEditInputDataType,
  RinkLineEditInputValidType,
  RinkLineEditMenuType,
  RinkLinePostRequest,
  RinkLinePostPutResponse,
  RinkLineReissuePutRequest,
  RinkLinePutRequest,
  RinkLineBulkPutRequest,
  RinkLineDeleteRequest,
  RinkLineListQuery,
  RinkLineListResponse,
  RinkLineStatusType,
  AvailableLinePrefixResponse,
  AvailablePlanLimitResponse,
  AvailablePlanLimitPlanType,
  AvailablePlanLimitDeviceType,
  RinkLineAvailableDateResponse,
  ShippingAddressType,
  ShippingAddressHistoryListResponse,
  RinkLinesUsageSummaryResponse,
  RinkLinesCurrentUsageResponse,
  RinkLinesUsageResponse,
  RinkLineAvailableDateRequest,
  RinkLineAvailableDateApplicationInfoType,
  RinkLineAvailableDateOrderType,
  RinkLineListType,
} from '@/api/rinkLines/types'
import type { RinkLineGroupListType } from '@/api/rinkLineGroups/types'
import { UNSELECTED_VALUE } from '@/components/input/constants'

export const useGetRinkLineTableList = () => {
  const { RINK_MOBILE_API } = useAPI()

  const rinkLineTableList = ref<Array<RinkLineListType & { rinkMobileId: string }>>([])
  const getRinkLineTableList = async (
    query: { rinkMobileId: string; lineNumber: string },
    rinkMobileIdOptions: Array<{ text: string; value: string }>,
  ) => {
    try {
      // rinkMobileId がある場合はそのままAPIを叩く
      if (query.rinkMobileId) {
        const response = await RINK_MOBILE_API.ALL<RinkLineListResponse, RinkLineListQuery & { limit: 20 }>(
          `lines/self-add/${query.rinkMobileId}`,
          { query: { lineNumber: query.lineNumber || undefined, limit: 20 } },
        )
        rinkLineTableList.value =
          response.flatMap(res => res.lineList.map(line => ({ ...line, rinkMobileId: query.rinkMobileId }))) ?? []
        return response
      } else if (query.lineNumber) {
        // rinkMobileId がない場合は rinkMobileIdList の全ての rinkMobileId についてAPIを叩く
        const responses = await Promise.all(
          rinkMobileIdOptions.map(async ({ value }) => {
            try {
              const response = await RINK_MOBILE_API.ALL<RinkLineListResponse, RinkLineListQuery & { limit: 20 }>(
                `lines/self-add/${value}`,
                { query: { lineNumber: query.lineNumber, limit: 20 }, suppressErrorDialog: true },
              )
              return {
                total: response?.[0]?.total ?? 0,
                lineList: response.flatMap(res => res.lineList.map(line => ({ ...line, rinkMobileId: value }))) ?? [],
              }
            } catch {
              return { total: 0, lineList: [] }
            }
          }),
        )

        rinkLineTableList.value = responses.flatMap(res => res.lineList) ?? []
        return responses
      }
      return undefined
    } catch (error) {
      rinkLineTableList.value = []
      throw error
    }
  }

  const selectableRinkMobileIdOptions = computed(() => {
    const rinkMobileIdList = [...new Set(rinkLineTableList.value.map(line => line.rinkMobileId))]
    return rinkMobileIdList.map(value => ({ text: value, value }))
  })
  return { rinkLineTableList, getRinkLineTableList, selectableRinkMobileIdOptions }
}

export const useGetAllRinkLineList = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()

  const allRinkLineList = ref<RinkLineListResponse>({ total: 0, lineList: [] })
  const getAllRinkLineList = async (rinkMobileId: string, query?: RinkLineListQuery) => {
    try {
      const response = await RINK_MOBILE_API.ALL<RinkLineListResponse, RinkLineListQuery & { limit: 20 }>(
        `lines/self-add/${rinkMobileId}`,
        { query: { ...query, limit: 20 } },
      )
      allRinkLineList.value = {
        total: response?.[0]?.total ?? 0,
        lineList: response.flatMap(val => (val ? val.lineList : [])) ?? [],
      }
      return response
    } catch (error) {
      allRinkLineList.value = { total: 0, lineList: [] }
      throw error
    }
  }
  const formatCsvData = (data: RinkLineListType[], rinkLineGroupList: RinkLineGroupListType[]) => {
    return data.map(item => ({
      [t('rinkLines.lineNumber')]: item.lineNumber,
      [t('rinkLines.plan')]: item.planName,
      [t('rinkLineGroups.lineGroupName')]:
        rinkLineGroupList.find(group => group.lineGroupId === item.lineGroupId)?.lineGroupName || '-',
    }))
  }

  return { allRinkLineList, getAllRinkLineList, formatCsvData }
}

export const useCreateRinkLine = () => {
  const { t } = useI18n()
  const { RINK_MOBILE_API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const createRinkLine = async (rinkMobileId: string, body: RinkLinePostRequest) => {
    try {
      const response = await RINK_MOBILE_API.POST<RinkLinePostPutResponse, RinkLinePostRequest>(
        `lines/self-add/${rinkMobileId}`,
        { body, suppressErrorDialog: true },
      )
      setNotificationMessageState({ message: t('message.finished'), isRinkMobile: true })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error?.data?.moreInfo === RINK_MOBILE_ERROR_TEXT.RECEPTION_IS_CLOSED
          ? t('rinkConnections.message.outsideReceptionHourApiError')
          : error?.data?.moreInfo === RINK_MOBILE_ERROR_TEXT.INCOMPATIBLE_DEVICE_AND_ACCESS_TYPE
            ? t('rinkConnections.message.incompatibleDeviceAndAccessTypeApiError')
            : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { createRinkLine }
}

export const useUpdateBulkRinkLine = () => {
  const { t } = useI18n()
  const { RINK_MOBILE_API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const inputData = ref<RinkLineEditInputDataType>({})
  const inputValid = ref<RinkLineEditInputValidType>({})

  const getUpdateBulkRinkLineErrorMessage = (error: ErrorResponse, editMenu: RinkLineEditMenuType) => {
    const moreInfo = error?.data?.moreInfo
    if (moreInfo === RINK_MOBILE_ERROR_TEXT.RECEPTION_IS_CLOSED) {
      return t('rinkConnections.message.outsideReceptionHourApiError')
    }
    if (moreInfo === RINK_MOBILE_ERROR_TEXT.INVALID_IP_ADDRESS && editMenu === RinkLineEditMenuTypes.LinePrefix) {
      return t('rinkLines.message.invalidIpAddressApiError')
    }
    return `${t('message.failed')}\n${errorFormat(error)}`
  }

  const updateBulkRinkLine = async (editMenu: Exclude<RinkLineEditMenuType, typeof RinkLineEditMenuTypes.Reissue>) => {
    const linesList = Object.entries(inputData.value).map(([lineNumber, data], index) => {
      const lineIndex = index + 1
      switch (editMenu) {
        case RinkLineEditMenuTypes.AdditionalLimit: {
          const request: RinkLinePutRequest<typeof editMenu> = {
            lineIndex,
            lineNumber,
            additionalLimit: parseInt(data.additionalLimit) as RinkLineAdditionalLimitType,
          }
          return request
        }
        case RinkLineEditMenuTypes.Authentication: {
          const request: RinkLinePutRequest<typeof editMenu> = {
            lineIndex,
            lineNumber,
            authenticationId: data.authenticationId,
            authenticationPassword: data.authenticationPassword || undefined,
          }
          return request
        }
        case RinkLineEditMenuTypes.LinePrefix: {
          const request: RinkLinePutRequest<typeof editMenu> = {
            lineIndex,
            lineNumber,
            actIpAddress: data.actIpAddress,
            sbyIpAddress: data.sbyIpAddress || undefined,
          }
          return request
        }
        case RinkLineEditMenuTypes.Plan: {
          const request: RinkLinePutRequest<typeof editMenu> = {
            lineIndex,
            lineNumber,
            planLimitAlias: data.planLimitAlias,
          }
          return request
        }
        default: {
          const request: RinkLinePutRequest<typeof editMenu> = {
            lineIndex,
            lineNumber,
          }
          return request
        }
      }
    })
    try {
      const response = await RINK_MOBILE_API.PUT<RinkLinePostPutResponse, RinkLineBulkPutRequest<typeof editMenu>>(
        `lines/${editMenu}`,
        { body: { linesList }, suppressErrorDialog: true },
      )
      setNotificationMessageState({ message: t('rinkLines.message.accepted'), isRinkMobile: true })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message = getUpdateBulkRinkLineErrorMessage(error, editMenu)
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { inputData, inputValid, updateBulkRinkLine }
}

export const useUpdateReissueRinkLine = () => {
  const { t } = useI18n()
  const { RINK_MOBILE_API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const reissueInputData = ref(structuredClone(initialShippingInfoInputData))
  const reissueInputValid = ref(structuredClone(initialShippingInfoValid))
  const updateReissueRinkLine = async (request: RinkLineReissuePutRequest) => {
    try {
      const response = await RINK_MOBILE_API.PUT<RinkLinePostPutResponse, RinkLineReissuePutRequest>('lines/reissue', {
        body: request,
        suppressErrorDialog: true,
      })
      setNotificationMessageState({ message: t('rinkLines.message.accepted'), isRinkMobile: true })
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

  return { reissueInputData, reissueInputValid, updateReissueRinkLine }
}

export const useDeleteRinkLine = () => {
  const { t } = useI18n()
  const { RINK_MOBILE_API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteRinkLine = async (request: RinkLineDeleteRequest) => {
    try {
      const response = await RINK_MOBILE_API.DELETE<{ id: string }, RinkLineDeleteRequest>('lines/self-only', {
        body: request,
        suppressErrorDialog: true,
      })
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

  return { deleteRinkLine }
}

export const useGetAvailableLinePrefix = () => {
  const { RINK_MOBILE_API } = useAPI()

  const availableLinePrefix = ref<AvailableLinePrefixResponse>({ lineActPrefix: [], lineSbyPrefix: [] })
  const getAvailableLinePrefix = async () => {
    try {
      const response = await RINK_MOBILE_API.GET<AvailableLinePrefixResponse>('available-line-prefix/self-only')
      availableLinePrefix.value = response
      return response
    } catch (error) {
      availableLinePrefix.value = { lineActPrefix: [], lineSbyPrefix: [] }
      throw error
    }
  }

  const lineActPrefixOptions = computed(() => {
    return availableLinePrefix.value.lineActPrefix.map(prefix => ({
      text: prefix,
      value: prefix,
    }))
  })
  const lineSbyPrefixOptions = computed(() => {
    return availableLinePrefix.value.lineSbyPrefix.map(prefix => ({
      text: prefix,
      value: prefix,
    }))
  })
  return { lineActPrefixOptions, lineSbyPrefixOptions, getAvailableLinePrefix }
}

export const useGetAvailablePlanDeviceList = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()

  const planList = ref<AvailablePlanLimitPlanType[]>([])
  const deviceList = ref<AvailablePlanLimitDeviceType[]>([])
  const getAvailablePlanDeviceList = async (rinkMobileId: string) => {
    try {
      const response = await RINK_MOBILE_API.GET<AvailablePlanLimitResponse>(
        `rink-connections/available-plan-limit/${rinkMobileId}`,
      )
      planList.value = response.planList
      deviceList.value = response.deviceList
      return response
    } catch (error) {
      planList.value = []
      deviceList.value = []
      throw error
    }
  }

  const planOptions = computed(() => {
    const lte = planList.value
      .filter(plan => plan.availableAccessType.includes(RinkLineAccessTypes.Lte))
      .map(plan => ({
        text: plan.planName,
        value: plan.planLimitAlias,
      }))

    const nsa5g = planList.value
      .filter(plan => plan.availableAccessType.includes(RinkLineAccessTypes.Nsa5g))
      .map(plan => ({
        text: plan.planName,
        value: plan.planLimitAlias,
      }))

    return { [RinkLineAccessTypes.Lte]: lte, [RinkLineAccessTypes.Nsa5g]: nsa5g }
  })

  const deviceOptions = computed(() => {
    const options = deviceList.value.map(device => ({
      text: device.deviceName,
      value: device.deviceNameAlias,
    }))
    return [{ value: UNSELECTED_VALUE, text: t('rinkLines.unselectedDevice') }, ...options]
  })

  return { planOptions, deviceOptions, getAvailablePlanDeviceList }
}

export const usePostRinkLineAvailableDate = () => {
  const { RINK_MOBILE_API } = useAPI()

  const availableDate = ref<RinkLineAvailableDateResponse | null>(null)

  const postRinkLineAvailableDate = async (data: RinkLineAvailableDateRequest) => {
    const body = 'applicationInfo' in data ? { applicationInfo: data.applicationInfo } : {}
    const query =
      'rinkMobileId' in data ? { orderType: data.orderType, zId: data.rinkMobileId } : { orderType: data.orderType }
    try {
      const response = await RINK_MOBILE_API.POST<
        RinkLineAvailableDateResponse,
        { applicationInfo?: RinkLineAvailableDateApplicationInfoType[] },
        { orderType: RinkLineAvailableDateOrderType; zId?: string }
      >('line-available-date/self-only', { body, query })
      availableDate.value = response
      return response
    } catch (error) {
      availableDate.value = null
      throw error
    }
  }

  const availableDateNumber = computed(() => ({
    availableServiceInDate: availableDate.value?.availableServiceInDate
      ? new Date(availableDate.value.availableServiceInDate).setHours(0, 0, 0, 0)
      : new Date().setHours(0, 0, 0, 0),
    availableDateDeadline: availableDate.value?.availableDateDeadline
      ? new Date(availableDate.value.availableDateDeadline).setHours(0, 0, 0, 0)
      : undefined,
  }))
  const disabledDates = (date: Date) => {
    // from=availableServiceInDate, to=availableDateDeadline 内の日付が選択可能
    const currentDate = date.setHours(0, 0, 0, 0)
    const max =
      !!availableDateNumber.value?.availableDateDeadline &&
      availableDateNumber.value.availableDateDeadline < currentDate
    return currentDate < availableDateNumber.value.availableServiceInDate || max
  }

  return { postRinkLineAvailableDate, disabledDates }
}

export const useGetShippingAddressHistoryList = () => {
  const { RINK_MOBILE_API } = useAPI()

  const shippingAddressHistoryList = ref<ShippingAddressType[]>([])
  const getShippingAddressHistoryList = async () => {
    try {
      const response = await RINK_MOBILE_API.GET<ShippingAddressHistoryListResponse>(
        'shipping-address-history/self-only',
      )
      shippingAddressHistoryList.value = response.shippingAddresses.filter(Boolean)
      return response
    } catch (error) {
      shippingAddressHistoryList.value = []
      throw error
    }
  }

  return { shippingAddressHistoryList, getShippingAddressHistoryList }
}

export const useGetRinkLineCurrentUsage = () => {
  const { RINK_MOBILE_API } = useAPI()

  const rinkLineCurrentUsage = ref<RinkLinesCurrentUsageResponse>({ usage: 0, remainUsage: 0 })

  const getRinkLineCurrentUsage = async (lineNumber: string) => {
    try {
      const response = await RINK_MOBILE_API.GET<RinkLinesCurrentUsageResponse>(`lines/current-usage/${lineNumber}`)
      rinkLineCurrentUsage.value = response
      return response
    } catch (error) {
      rinkLineCurrentUsage.value = { usage: 0, remainUsage: 0 }
      throw error
    }
  }

  return { rinkLineCurrentUsage, getRinkLineCurrentUsage }
}

export const useGetRinkLineUsage = () => {
  const { RINK_MOBILE_API } = useAPI()
  // 単一回線の3ヶ月分の利用量
  const rinkLineUsageMonthMap = ref<Map<string, RinkLinesUsageResponse>>(new Map())
  // 複数回線の当月利用量
  const rinkLineListCurrentUsageMap = ref<Map<string, { usage: number; remainUsage: number }>>(new Map())

  const getRinkLineUsage = (lineNumber: string, query: { targetMonth: string }) =>
    RINK_MOBILE_API.GET<RinkLinesUsageResponse, { targetMonth: string }>(`lines/usage/${lineNumber}`, {
      query,
      suppressErrorDialog: true,
    })

  const getCurrentUsageData = (data?: RinkLinesUsageResponse) => {
    return {
      usage: data?.lineUsageList.reduce((acc, cur) => acc + cur.usage, 0) ?? 0,
      remainUsage: data?.remainUsage ?? 0,
    }
  }

  // 単一回線の3ヶ月分データ取得
  const getRinkLineUsageMonthMap = async (lineNumber: string) => {
    const responses = [...Array(3)].map(async (_, i) => {
      const targetMonth = dayjs().subtract(i, 'month').format('YYYY-MM')
      try {
        const data = await getRinkLineUsage(lineNumber, { targetMonth })
        return [targetMonth, data] as [string, RinkLinesUsageResponse]
      } catch {
        return [targetMonth, { lineNumber, totalLimit: 0, lineUsageList: [], updatedAt: '' }] as [
          string,
          RinkLinesUsageResponse,
        ]
      }
    })
    rinkLineUsageMonthMap.value = new Map(await Promise.all(responses))
  }

  // 複数回線の当月利用量データ取得
  const getRinkLineListCurrentUsageMap = async (lineNumbers: string[]) => {
    const promises = lineNumbers.map<Promise<[string, { usage: number; remainUsage: number }]>>(async lineNumber => {
      try {
        const response = await getRinkLineUsage(lineNumber, { targetMonth: dayjs().format('YYYY-MM') })
        const currentUsageData = getCurrentUsageData(response)
        return [lineNumber, currentUsageData]
      } catch {
        return [lineNumber, { usage: 0, remainUsage: 0 }]
      }
    })
    const results = await Promise.all(promises)
    rinkLineListCurrentUsageMap.value = new Map(results)
  }

  return {
    rinkLineUsageMonthMap,
    rinkLineListCurrentUsageMap,
    getCurrentUsageData,
    getRinkLineUsageMonthMap,
    getRinkLineListCurrentUsageMap,
  }
}

export const useGetRinkLinesUsageSummaryMonthMap = () => {
  const { RINK_MOBILE_API } = useAPI()

  const rinkLineUsageSummaryMonthMap = ref<Map<string, RinkLinesUsageSummaryResponse>>(new Map())

  const getRinkLinesUsageSummaryList = (rinkMobileId: string, query: { targetMonth: string }) =>
    RINK_MOBILE_API.GET<RinkLinesUsageSummaryResponse, { targetMonth: string }>(`lines/usage-summary/${rinkMobileId}`, {
      query,
      suppressErrorDialog: true,
    })

  const getRinkLinesUsageSummaryMonthMap = async (rinkMobileId: string) => {
    const responses = [...Array(3)].map(async (_, i) => {
      const targetMonth = dayjs().subtract(i, 'month').format('YYYY-MM')
      try {
        const data = await getRinkLinesUsageSummaryList(rinkMobileId, { targetMonth })
        return [targetMonth, { updatedAt: data.updatedAt, lineUsageList: data.lineUsageList }] as [
          string,
          RinkLinesUsageSummaryResponse,
        ]
      } catch {
        return [targetMonth, { updatedAt: '', lineUsageList: [] }] as [string, RinkLinesUsageSummaryResponse]
      }
    })
    rinkLineUsageSummaryMonthMap.value = new Map(await Promise.all(responses))
  }
  return { rinkLineUsageSummaryMonthMap, getRinkLinesUsageSummaryMonthMap }
}

export const useRinkLines = () => {
  const { t } = useI18n()

  const rinkLineEditMenuTranslation = {
    [RinkLineEditMenuTypes.Plan]: t('rinkLines.editMenu.plan'),
    [RinkLineEditMenuTypes.Reissue]: t('rinkLines.editMenu.reissue'),
    [RinkLineEditMenuTypes.Authentication]: t('rinkLines.editMenu.authentication'),
    [RinkLineEditMenuTypes.AdditionalLimit]: t('rinkLines.editMenu.additionalLimit'),
    [RinkLineEditMenuTypes.Deactivate]: t('rinkLines.editMenu.deactivate'),
    [RinkLineEditMenuTypes.Reactivate]: t('rinkLines.editMenu.reactivate'),
    [RinkLineEditMenuTypes.LinePrefix]: t('rinkLines.editMenu.linePrefix'),
  }
  const rinkLineEditMenuOptions = Object.entries(rinkLineEditMenuTranslation).map(([value, text]) => ({
    text,
    value,
  }))

  const additionalLimitOptions = Object.entries(RinkLineAdditionalLimitTypes).map(([text, value]) => {
    return { text, value: `${value}` }
  })

  const rinkLineRules = {
    authenticationId: (value: string) => {
      return !value || /^[a-zA-Z0-9._=+-]+$/.test(value) || t('rinkLines.message.invalidValue')
    },
    password: (value: string) => {
      return !value || /^[a-zA-Z0-9!$%&'()/;<?[\]^{}-]+$/.test(value) || t('rinkLines.message.invalidValue')
    },
  }

  const getRinkLineStatusText = (lineStatus: RinkLineStatusType) => {
    switch (lineStatus) {
      case RinkLineStatusTypes.Deleted:
        return t('rinkLines.deleted')
      case RinkLineStatusTypes.Suspend:
        return t('rinkLines.suspended')
      default: // RinkLineStatusTypes.Active
        return t('rinkLines.active')
    }
  }

  return {
    rinkLineEditMenuOptions,
    additionalLimitOptions,
    rinkLineRules,
    getRinkLineStatusText,
  }
}
