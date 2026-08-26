import type {
  TrafficTrendsQuery,
  TrafficTrendsSummaryQuery,
  TrafficTrendsResponse,
  TrafficTrendsSummaryResponse,
} from '@/api/trafficTrends/types'

export const useGetTrafficTrends = () => {
  const { API } = useAPI()

  const trafficTrendsQuery = ref<TrafficTrendsQuery>({})
  const trafficTrends = ref<TrafficTrendsResponse | null>(null)
  const getTrafficTrends = async (query: TrafficTrendsQuery) => {
    try {
      trafficTrendsQuery.value = query
      const response = await API.GET<TrafficTrendsResponse, TrafficTrendsQuery>(
        'monitorings/circuit-traffic-trends',
        { query, suppressErrorDialog: true },
      )
      trafficTrends.value = response
      return response
    } catch {
      trafficTrends.value = null
      // #17675 getTrafficTrends のエラーは無視して後続のGET処理に響かないようにする
      return null
    }
  }
  return { trafficTrendsQuery, trafficTrends, getTrafficTrends }
}

export const useGetTrafficTrendsSummary = () => {
  const { API } = useAPI()
  const trafficTrendsSummaryQuery = ref<TrafficTrendsSummaryQuery>({ limit: 10, offset: 0 })
  const trafficTrendsSummary = ref<TrafficTrendsSummaryResponse | null>(null)
  const getTrafficTrendsSummary = async (query: TrafficTrendsSummaryQuery) => {
    try {
      trafficTrendsSummaryQuery.value = query
      const response = await API.GET<TrafficTrendsSummaryResponse, TrafficTrendsSummaryQuery>(
        'monitorings/circuit-traffic-trends/summary',
        { query },
      )
      trafficTrendsSummary.value = response
      return response
    } catch (error) {
      trafficTrendsSummary.value = null
      throw error
    }
  }

  return { trafficTrendsSummaryQuery, trafficTrendsSummary, getTrafficTrendsSummary }
}
