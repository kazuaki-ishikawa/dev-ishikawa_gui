import type { HealthDiagnosisResponse, HealthDiagnosisRequestIdResponse } from '@/api/healthDiagnosis/types'

export const useGetHealthDiagnosis = () => {
  const { API } = useAPI()
  const { setLoadingState } = useLoading()

  const healthDiagnosis = ref<HealthDiagnosisResponse | null>(null)
  const getHealthDiagnosis = async (terminalId: string) => {
    try {
      setLoadingState('start')
      const { requestId } = await API.GET<HealthDiagnosisRequestIdResponse>(
        `monitorings/health-diagnosis/${terminalId}`,
      )
      while (true) {
        await sleep(3000)
        const response = await API.GET<HealthDiagnosisResponse>(
          `monitorings/health-diagnosis/${terminalId}/get-requests/${requestId}`,
        )
        if (response?.completed) {
          healthDiagnosis.value = response
          return response
        }
      }
    } catch (error) {
      healthDiagnosis.value = null
      throw error
    } finally {
      setLoadingState('end')
    }
  }

  return { healthDiagnosis, getHealthDiagnosis }
}
