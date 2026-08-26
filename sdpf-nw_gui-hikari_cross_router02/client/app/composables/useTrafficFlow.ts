import type {
  TrafficFlowUsageQuery,
  TrafficFlowUsageResponse,
  TrafficFlowUsageType,
  TrafficFlowDownloadResponse,
  TrafficFlowDownloadPostRequest,
  TrafficFlowDownloadRequestResponse,
} from '@/api/trafficFlow/types'
import { TrafficFlowDownloadRequestStatusTypes } from '@/api/trafficFlow/constants'

export const useTrafficFlowUsage = () => {
  const { API } = useAPI()

  const trafficFlowUsages = ref<TrafficFlowUsageType[]>([])
  const trafficFlowUsageQuery = ref<TrafficFlowUsageQuery>({ terminalId: [] })
  const getTrafficFlowUsage = async (query: TrafficFlowUsageQuery) => {
    try {
      trafficFlowUsageQuery.value = query
      const response = await API.ALL<TrafficFlowUsageResponse, TrafficFlowUsageQuery & { limit: number }>(
        'monitorings/circuit-traffic-flow/usage',
        { query: { ...query, limit: 100 } },
      )
      trafficFlowUsages.value = response.flatMap(d => d.flowUsages)
      return response
    } catch (error) {
      trafficFlowUsages.value = []
      throw error
    }
  }

  return { trafficFlowUsageQuery, trafficFlowUsages, getTrafficFlowUsage }
}

export const useTrafficFlowDownload = () => {
  const { API } = useAPI()
  const { setLoadingState } = useLoading()

  const downloadTrafficFlow = async (request: TrafficFlowDownloadPostRequest) => {
    try {
      setLoadingState('start')
      const { requestId } = await API.POST<TrafficFlowDownloadResponse, TrafficFlowDownloadPostRequest>(
        'monitorings/circuit-traffic-flow/download-request',
        { body: request },
      )
      while (true) {
        await sleep(3000)
        const response = await API.GET<TrafficFlowDownloadRequestResponse>(
          `monitorings/circuit-traffic-flow/download-request/${requestId}`,
        )
        if (response.status === TrafficFlowDownloadRequestStatusTypes.Completed) {
          window.open(response.url, '_blank', 'noopener,noreferrer')
          return
        }
      }
    } finally {
      setLoadingState('end')
    }
  }

  return { downloadTrafficFlow }
}
