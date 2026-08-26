import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import {
  TrafficFlowRankRankByTypes,
  TrafficFlowRankTopTypes,
  TrafficFlowRankDirectionTypes,
  TrafficFlowRankIntervalTypes,
} from '@/api/trafficFlowRank/constants'
import type {
  TrafficFlowRankQuery,
  TrafficFlowRankResponse,
  TrafficFlowRankUsageQuery,
  TrafficFlowRankUsageResponse,
  TrafficFlowRankRankByType,
  TrafficFlowRankFlowFilterType,
  TrafficFlowRankFilterResponse,
  TrafficFlowRankFilterPostRequestType,
  TrafficFlowRankApplicationType,
  TrafficFlowRankApplicationListResponse,
} from '@/api/trafficFlowRank/types'
import type { ErrorResponse } from '@/api/types'

export const useGetTrafficFlowRank = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const trafficFlowRankQuery = ref<TrafficFlowRankQuery>({
    terminalId: '',
    startTime: '',
    endTime: '',
    top: TrafficFlowRankTopTypes.Top10,
    interval: TrafficFlowRankIntervalTypes.Interval15Minutes,
    direction: TrafficFlowRankDirectionTypes.In,
    rankBy: TrafficFlowRankRankByTypes.SourceIpAddress,
  })
  const getTrafficFlowRankResponse = ref<TrafficFlowRankResponse | null>(null)
  const showLoading = ref(false)
  const getTrafficFlowRank = async (query: TrafficFlowRankQuery) => {
    try {
      showLoading.value = true
      trafficFlowRankQuery.value = query
      const response = await API.GET<TrafficFlowRankResponse, TrafficFlowRankQuery>(
        'monitorings/circuit-traffic-flow-rank',
        { query, suppressErrorDialog: true },
      )
      getTrafficFlowRankResponse.value = response
      return response
    } catch (e) {
      const error = e as ErrorResponse
      if (error.statusCode === 504) {
        setNotificationMessageState({ message: t('trafficFlow.message.timeout') })
      } else {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      getTrafficFlowRankResponse.value = null
      throw error
    } finally {
      showLoading.value = false
    }
  }

  // 収集停止期間 の日付を補完するためのタイムスタンプを query から生成
  const timestamps = computed(() => {
    const [amount, unit] = (
      trafficFlowRankQuery.value.interval === TrafficFlowRankIntervalTypes.Interval5Minutes
        ? [5, 'minutes']
        : trafficFlowRankQuery.value.interval === TrafficFlowRankIntervalTypes.Interval1Day
          ? [1, 'days']
          : [15, 'minutes']
    ) satisfies [number, dayjs.ManipulateType]

    const startTime =
      unit === 'days'
        ? dayjs(trafficFlowRankQuery.value.startTime).utc().startOf('day').local()
        : dayjs(trafficFlowRankQuery.value.startTime)
    const endTime = dayjs(trafficFlowRankQuery.value.endTime)

    // 開始時刻から終了時刻までの正確なインターバル数を計算
    const totalIntervals = Math.floor(endTime.diff(startTime, unit) / amount)
    // 指定された間隔でタイムスタンプを生成
    return Array.from({ length: totalIntervals }, (_, index) => startTime.add(index * amount, unit).format())
  })

  const trafficFlowRank = computed(() => {
    const found = getTrafficFlowRankResponse.value?.trafficFlows.find(
      trafficFlow => trafficFlow.terminalId === trafficFlowRankQuery.value.terminalId,
    )
    // もし見つからなければ undefined を返す
    if (!found) {
      return undefined
    }

    const circuits = found.circuits.map(circuit => {
      const traffics = circuit.traffics.map(traffic => {
        // Map 化して検索を高速化する
        const rateMap = new Map(
          traffic.rates.timestamp.map((ts, i) => [
            dayjs(ts).format(),
            { bitPerSec: traffic.rates.bitPerSec[i], packetPerSec: traffic.rates.packetPerSec[i] },
          ]),
        )
        const rates = {
          timestamp: timestamps.value,
          bitPerSec: timestamps.value.map(ts => rateMap.get(ts)?.bitPerSec ?? 0),
          packetPerSec: timestamps.value.map(ts => rateMap.get(ts)?.packetPerSec ?? 0),
        }
        return { ...traffic, rates }
      })
      return { ...circuit, traffics }
    })

    return { ...found, circuits }
  })

  return {
    trafficFlowRankQuery,
    trafficFlowRank,
    showLoading: readonly(showLoading),
    getTrafficFlowRank,
    clearTrafficFlowRank: () => (getTrafficFlowRankResponse.value = null),
  }
}

export const useGetTrafficFlowRankUsage = () => {
  const { API } = useAPI()

  const trafficFlowRankUsageQuery = ref<TrafficFlowRankUsageQuery>({ terminalId: '' })
  const getTrafficFlowRankUsageResponse = ref<TrafficFlowRankUsageResponse | null>(null)
  const getTrafficFlowRankUsage = async (query: TrafficFlowRankUsageQuery) => {
    try {
      trafficFlowRankUsageQuery.value = query
      const response = await API.GET<TrafficFlowRankUsageResponse, TrafficFlowRankUsageQuery>(
        'monitorings/circuit-traffic-flow-rank/usage',
        { query },
      )
      getTrafficFlowRankUsageResponse.value = response
      return response
    } catch (error) {
      getTrafficFlowRankUsageResponse.value = null
      throw error
    }
  }

  const getTotalBytesAndLimit = (guaranteeId: string) => {
    const foundUsages = getTrafficFlowRankUsageResponse.value?.flowUsages.find(
      usage => usage.terminalId === trafficFlowRankUsageQuery.value.terminalId,
    )
    const circuit = foundUsages?.circuits?.find(c => c.circuitId === guaranteeId)
    return { totalBytes: circuit?.totalBytes ?? 0, limit: circuit?.limit ? convertBandwidthToUnit(circuit.limit) : 0 }
  }

  const getLimitReachedDate = (guaranteeId: string) => {
    const foundUsages = getTrafficFlowRankUsageResponse.value?.flowUsages.find(
      usage => usage.terminalId === trafficFlowRankUsageQuery.value.terminalId,
    )
    const circuit = foundUsages?.circuits?.find(c => c.circuitId === guaranteeId)
    const limitBytes = circuit?.limit ? convertBandwidthToUnit(circuit.limit) : 0
    const formattedDailyUsage = circuit?.dailyUsage?.reduce(
      (acc, day) => {
        if (acc.reachedDate) {
          return acc
        }
        const total = acc.total + day.bytes
        const reachedDate = total >= limitBytes ? formatDate(day.date) : ''
        return { total, reachedDate }
      },
      { total: 0, reachedDate: '' },
    )
    return formattedDailyUsage?.reachedDate || ''
  }

  return { getTrafficFlowRankUsage, getTotalBytesAndLimit, getLimitReachedDate }
}

export const useGetTrafficFlowRankApplicationList = () => {
  const { API } = useAPI()

  const applications = ref<TrafficFlowRankApplicationType[]>([])
  const getTrafficFlowRankApplicationList = async () => {
    try {
      const response = await API.GET<TrafficFlowRankApplicationListResponse>('monitorings/applicationId')
      applications.value = response.applications
      return response
    } catch (error) {
      applications.value = []
      throw error
    }
  }

  return { getTrafficFlowRankApplicationList, applications }
}

export const useTrafficFlowRankFilter = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const trafficFlowFilterLoading = ref(false)
  const URL = 'monitorings/circuit-traffic-flow-rank/filter'

  // GET
  const trafficFlowFilters = ref<TrafficFlowRankFlowFilterType[]>([])
  const getTrafficFlowRankFilter = async () => {
    try {
      trafficFlowFilterLoading.value = true
      const response = await API.GET<TrafficFlowRankFilterResponse>(URL)
      trafficFlowFilters.value = response.flowFilters
      return response
    } catch (error) {
      trafficFlowFilters.value = []
      throw error
    } finally {
      trafficFlowFilterLoading.value = false
    }
  }

  // POST
  const createTrafficFlowRankFilter = async (request: TrafficFlowRankFilterPostRequestType) => {
    try {
      trafficFlowFilterLoading.value = true
      const response = await API.POST<TrafficFlowRankFlowFilterType, TrafficFlowRankFilterPostRequestType>(URL, {
        body: request,
      })
      trafficFlowFilters.value = [...trafficFlowFilters.value, response]
      setNotificationMessageState({ message: t('message.saved') })
      return response
    } finally {
      trafficFlowFilterLoading.value = false
    }
  }

  // DELETE
  const deleteTrafficFlowRankFilter = async (filterId: string) => {
    try {
      trafficFlowFilterLoading.value = true
      const response = await API.DELETE<TrafficFlowRankFlowFilterType>(`${URL}/${filterId}`)
      trafficFlowFilters.value = trafficFlowFilters.value.filter(data => data.filterId !== filterId)
      setNotificationMessageState({ message: t('message.deleted') })
      return response
    } finally {
      trafficFlowFilterLoading.value = false
    }
  }

  return {
    trafficFlowFilters,
    getTrafficFlowRankFilter,
    createTrafficFlowRankFilter,
    deleteTrafficFlowRankFilter,
    trafficFlowFilterLoading: readonly(trafficFlowFilterLoading),
  }
}

export const useTrafficFlowRank = () => {
  const { t } = useI18n()

  const translateFilterType = (
    type: TrafficFlowRankRankByType,
    value: string,
    applications: TrafficFlowRankApplicationType[],
  ) => {
    const translatedType = t(`trafficFlow.${type}`)
    const traslatedValue =
      type === TrafficFlowRankRankByTypes.ApplicationId
        ? (applications.find(application => application.applicationId === value)?.applicationName ?? value)
        : value

    return { type: translatedType, value: traslatedValue }
  }

  const intervalOptions = Object.values(TrafficFlowRankIntervalTypes).map(value => ({
    value,
    text: t(`trafficDetails.${value}`),
  }))
  const directionOptions = Object.entries(TrafficFlowRankDirectionTypes).map(([key, value]) => ({
    value,
    text: t(`trafficFlow.direction${key}`),
  }))

  return { translateFilterType, intervalOptions, directionOptions }
}
