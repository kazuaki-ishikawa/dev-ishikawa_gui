import type { JpkiRequestResponse, JpkiRequestStatusResponse } from '@/api/jpki/types'
import { JpkiRequestStatusTypes } from '~/api/jpki/constants'

export const useCreateJpkiRequest = () => {
  const { API } = useAPI()

  const jpkiRequestLoadingState = useState('jpkiRequestLoadingState', () => false)
  const jpkiRequest = ref<JpkiRequestResponse>()
  const createJpkiRequest = async () => {
    try {
      jpkiRequestLoadingState.value = true
      const response = await API.POST<JpkiRequestResponse>('jpki/jpki-requests')
      jpkiRequest.value = response
      return response
    } catch (error) {
      jpkiRequest.value = undefined
      throw error
    } finally {
      jpkiRequestLoadingState.value = false
    }
  }

  return { jpkiRequestLoading: readonly(jpkiRequestLoadingState), jpkiRequest, createJpkiRequest }
}

export const useGetJpkiRequestStatus = () => {
  const { API } = useAPI()

  const jpkiRequestStatusState = useState<JpkiRequestStatusResponse>('jpkiRequestStatusState', () => ({
    status: JpkiRequestStatusTypes.Applied,
  }))

  const isJpkiAuthenticationCompleted = computed(
    () => jpkiRequestStatusState.value.status === JpkiRequestStatusTypes.Completed,
  )

  const isJpkiAuthenticationAborted = computed(
    () => jpkiRequestStatusState.value.status === JpkiRequestStatusTypes.Aborted,
  )

  const resetJpkiRequestStatus = () => {
    jpkiRequestStatusState.value = { status: JpkiRequestStatusTypes.Applied }
  }

  const getJpkiRequestStatus = async (jpkiRequestId: string) => {
    try {
      const response = await API.GET<JpkiRequestStatusResponse>(`jpki/jpki-requests/${jpkiRequestId}`)
      jpkiRequestStatusState.value = response
      return response
    } catch (error) {
      resetJpkiRequestStatus()
      throw error
    }
  }

  return { isJpkiAuthenticationCompleted, isJpkiAuthenticationAborted, resetJpkiRequestStatus, getJpkiRequestStatus }
}
