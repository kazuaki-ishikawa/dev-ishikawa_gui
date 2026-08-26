import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import {
  ThreatLevelTypes,
  ThreatTypes,
  TrafficDirectionTypes,
  BlockingStatusOptionTypes,
  DetectionTypes,
} from '@/api/threatDetections/constants'
import type { ThreatDetectionsList, ThreatDetectionsQuery } from '@/api/threatDetections/types'

export const useGetThreatDetectionsTableList = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const threatDetectionsTableList = ref<ThreatDetectionsList | null>(null)
  const getThreatDetectionsTableList = async (query: ThreatDetectionsQuery) => {
    try {
      const response = await API.GET<ThreatDetectionsList, ThreatDetectionsQuery>('threat-detections', {
        query,
        suppressErrorDialog: true,
      })
      threatDetectionsTableList.value = response
      return response
    } catch (e) {
      const error = e as ErrorResponse
      threatDetectionsTableList.value = null
      if (error.statusCode === 504) {
        setNotificationMessageState({ message: t('threatDetections.message.timeout') })
      } else {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      throw error
    }
  }

  return { threatDetectionsTableList, getThreatDetectionsTableList }
}

export const useThreatDetections = () => {
  const { t } = useI18n()
  const blockingStatusOptions = Object.values(BlockingStatusOptionTypes).map(value => ({
    value,
    text: t(`threatDetections.${value}`),
  }))
  const threatTypeOptions = ThreatTypes.map(value => ({ value, text: value }))
  const threatLevelOptions = Object.values(ThreatLevelTypes).map(value => ({
    value,
    text: t(`threatDetections.level.${value}`),
  }))
  const trafficDirectionOptions = Object.values(TrafficDirectionTypes).map(value => ({
    value,
    text: t(`threatDetections.${value}`),
  }))
  const detectionTypeOptions = Object.values(DetectionTypes).map(value => ({
    value,
    text: t(`threatDetections.${value}`),
  }))

  return { blockingStatusOptions, threatTypeOptions, threatLevelOptions, trafficDirectionOptions, detectionTypeOptions }
}
