import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import { RINK_MOBILE_ERROR_TEXT } from '@/api/rinkConnections/constants'
import type {
  RinkLineGroupListType,
  RinkLineGroupListResponse,
  RinkLineGroupUsageSummaryQuery,
  RinkLineGroupUsageSummaryResponse,
  RinkLineGroupCurrentUsageResponse,
  RinkLineGroupDeleteRequest,
  RinkLineGroupLineMembersPutRequest,
  RinkLineGroupLineMembersDeleteRequest,
  RinkLineGroupPostRequest,
  RinkLineGroupDailyUsageResponse,
  RinkLineGroupDailyUsageQuery,
  RinkLineGroupListCurrentUsageType,
} from '@/api/rinkLineGroups/types'

export const useGetRinkLineGroupList = () => {
  const { t } = useI18n()
  const { RINK_MOBILE_API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const rinkLineGroupList = ref<RinkLineGroupListType[]>([])
  const getRinkLineGroupList = async (rinkMobileId: string) => {
    try {
      const response = await RINK_MOBILE_API.GET<RinkLineGroupListResponse>(`line-groups/self-add/${rinkMobileId}`, {
        suppressErrorDialog: true,
      })
      rinkLineGroupList.value = response.lineGroupList
      return response
    } catch (e) {
      rinkLineGroupList.value = []
      const error = e as ErrorResponse
      if ((error as ErrorResponse).statusCode !== 404) {
        // 404の場合はrejectしない
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
        throw error
      }
    }
  }
  const customerNoteList = computed(() =>
    rinkLineGroupList.value.map(lineGroup => ({ id: lineGroup.lineGroupId, customerNote: lineGroup.lineGroupName })),
  )

  return { rinkLineGroupList, customerNoteList, getRinkLineGroupList }
}

export const useCreateRinkLineGroup = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const createRinkLineGroup = async (rinkMobileId: string, body: RinkLineGroupPostRequest) => {
    try {
      const response = await RINK_MOBILE_API.POST<{ id: string }, RinkLineGroupPostRequest>(
        `line-groups/self-add/${rinkMobileId}`,
        { body, suppressErrorDialog: true },
      )
      setNotificationMessageState({ message: t('message.finished'), isRinkLineGroup: true })
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

  return { createRinkLineGroup }
}

export const useDeleteRinkLineGroup = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteRinkLineGroup = async (request: RinkLineGroupDeleteRequest) => {
    try {
      const response = await RINK_MOBILE_API.DELETE<{ id: string }, RinkLineGroupDeleteRequest>(
        'line-groups/self-only',
        { body: request, suppressErrorDialog: true },
      )
      setNotificationMessageState({ message: t('message.deleted'), isRinkMobile: true })
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

  return { deleteRinkLineGroup }
}

export const useGetRinkLineGroupCurrentUsage = () => {
  const { RINK_MOBILE_API } = useAPI()

  const rinkLineGroupCurrentUsage = ref<RinkLineGroupCurrentUsageResponse>({ usage: 0, remainUsage: 0 })

  const getRinkLineGroupCurrentUsage = async (lineGroupId: string) => {
    try {
      const response = await RINK_MOBILE_API.GET<RinkLineGroupCurrentUsageResponse>(
        `line-groups/current-usage/${lineGroupId}`,
      )
      rinkLineGroupCurrentUsage.value = response
      return response
    } catch (error) {
      rinkLineGroupCurrentUsage.value = { usage: 0, remainUsage: 0 }
      throw error
    }
  }

  return { rinkLineGroupCurrentUsage, getRinkLineGroupCurrentUsage }
}

export const useGetRinkLineGroupUsageSummaryMonthMap = () => {
  const { RINK_MOBILE_API } = useAPI()
  const rinkLineGroupUsageSummaryMonthMap = ref<Map<string, RinkLineGroupUsageSummaryResponse>>(new Map())

  const getRinkLineGroupUsageSummaryMonthMap = async (lineGroupId: string) => {
    const responses = [...Array(3)].map(async (_, i) => {
      const targetMonth = dayjs().subtract(i, 'month').format('YYYY-MM')
      try {
        const response = await RINK_MOBILE_API.GET<RinkLineGroupUsageSummaryResponse, RinkLineGroupUsageSummaryQuery>(
          `line-groups/usage-summary/${lineGroupId}`,
          { query: { targetMonth }, suppressErrorDialog: true },
        )
        return [targetMonth, response] as [string, RinkLineGroupUsageSummaryResponse]
      } catch {
        return [targetMonth, { lineGroupId, lineGroupUsage: 0, lineGroupUsageList: [] }] as [
          string,
          RinkLineGroupUsageSummaryResponse,
        ]
      }
    })
    rinkLineGroupUsageSummaryMonthMap.value = new Map(await Promise.all(responses))
  }
  return { rinkLineGroupUsageSummaryMonthMap, getRinkLineGroupUsageSummaryMonthMap }
}

export const useGetRinkLineGroupUsageMonthMap = () => {
  const { RINK_MOBILE_API } = useAPI()
  // 単一lineGroupの3ヶ月分データ取得用
  const rinkLineGroupUsageMonthMap = ref<Map<string, RinkLineGroupDailyUsageResponse>>(new Map())
  // 複数lineGroupの当月利用量取得用
  const rinkLineGroupListCurrentUsageMap = ref<Map<string, RinkLineGroupListCurrentUsageType>>(new Map())

  const getRinkLineGroupUsage = (lineGroupId: string, query: { targetMonth: string }) =>
    RINK_MOBILE_API.GET<RinkLineGroupDailyUsageResponse, RinkLineGroupDailyUsageQuery>(
      `line-groups/usage/${lineGroupId}`,
      { query, suppressErrorDialog: true },
    )

  // 単一lineGroupの3ヶ月分データ取得
  const getRinkLineGroupUsageMonthMap = async (lineGroupId: string) => {
    const responses = [...Array(3)].map(async (_, i) => {
      const targetMonth = dayjs().subtract(i, 'month').format('YYYY-MM')
      try {
        const response = await getRinkLineGroupUsage(lineGroupId, { targetMonth })
        return [targetMonth, response] as [string, RinkLineGroupDailyUsageResponse]
      } catch {
        return [targetMonth, { lineGroupId, totalLineGroupLimit: 0, lineGroupUsageList: [], updatedAt: '' }] as [
          string,
          RinkLineGroupDailyUsageResponse,
        ]
      }
    })
    rinkLineGroupUsageMonthMap.value = new Map(await Promise.all(responses))
  }

  // 複数lineGroupの当月利用量取得
  const getRinkLineGroupListCurrentUsageMap = async (lineGroupIdList: string[]) => {
    const promises = lineGroupIdList.map<Promise<[string, RinkLineGroupListCurrentUsageType]>>(async lineGroupId => {
      try {
        const response = await getRinkLineGroupUsage(lineGroupId, { targetMonth: dayjs().format('YYYY-MM') })
        const currentUsage = response.lineGroupUsageList.reduce((sum, usage) => sum + (usage.usage ?? 0), 0)
        return [
          lineGroupId,
          {
            usage: currentUsage,
            remainUsage: response.remainUsage ?? 0,
            totalLineGroupLimit: response.totalLineGroupLimit ?? 0,
          },
        ]
      } catch {
        return [lineGroupId, { usage: 0, remainUsage: 0, totalLineGroupLimit: 0 }]
      }
    })
    const results = await Promise.all(promises)
    rinkLineGroupListCurrentUsageMap.value = new Map(results)
  }

  return {
    rinkLineGroupUsageMonthMap,
    rinkLineGroupListCurrentUsageMap,
    getRinkLineGroupUsageMonthMap,
    getRinkLineGroupListCurrentUsageMap,
  }
}

export const usePutRinkLineGroupLineMembers = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const putRinkLineGroupLineMembers = async (lineGroupId: string, request: RinkLineGroupLineMembersPutRequest) => {
    try {
      const response = await RINK_MOBILE_API.PUT<{ id: string }, RinkLineGroupLineMembersPutRequest>(
        `line-groups/line-members/${lineGroupId}`,
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

  return { putRinkLineGroupLineMembers }
}

export const useDeleteRinkLineGroupLineMembers = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteRinkLineGroupLineMembers = async (
    lineGroupId: string,
    request: RinkLineGroupLineMembersDeleteRequest,
  ) => {
    try {
      const response = await RINK_MOBILE_API.DELETE<{ id: string }, RinkLineGroupLineMembersDeleteRequest>(
        `line-groups/line-members/${lineGroupId}`,
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

  return { deleteRinkLineGroupLineMembers }
}
