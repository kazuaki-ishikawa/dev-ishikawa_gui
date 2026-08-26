import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import type {
  BehaviorDetectionPlanType,
  BehaviorDetectionResponse,
  BehaviorDetectionSSOResponse,
} from '@/api/behaviorDetection/types'

export const useGetSettingsBehaviorDetection = () => {
  const { API } = useAPI()

  const settingsBehaviorDetectionState = useState<BehaviorDetectionResponse | null>(
    'settingsBehaviorDetectionState',
    () => null,
  )
  const currentSettingsBehaviorDetectionPlan = computed(
    () => settingsBehaviorDetectionState.value?.nextMonthBehaviorDetectionPlan,
  )
  const getSettingsBehaviorDetection = async () => {
    try {
      const response = await API.GET<BehaviorDetectionResponse>('settings/behavior-detection')
      settingsBehaviorDetectionState.value = response
      return response
    } catch (error) {
      settingsBehaviorDetectionState.value = null
      throw error
    }
  }

  const updateSettingsBehaviorDetectionState = (data: BehaviorDetectionResponse) => {
    settingsBehaviorDetectionState.value = data
  }

  return {
    settingsBehaviorDetection: readonly(settingsBehaviorDetectionState),
    currentSettingsBehaviorDetectionPlan,
    getSettingsBehaviorDetection,
    updateSettingsBehaviorDetectionState,
  }
}

export const useUpdateBehaviorDetection = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const updateBehaviorDetection = async (request: { behaviorDetectionPlan: BehaviorDetectionPlanType }) => {
    const response = await API.PUT<BehaviorDetectionResponse, { behaviorDetectionPlan: BehaviorDetectionPlanType }>(
      'settings/behavior-detection',
      { body: request },
    )
    setNotificationMessageState({ message: t('securityContracts.message.behaviorDetectionPlanChanged') })
    return response
  }

  return { updateBehaviorDetection }
}

export const usePostBehaviorDetectionSSO = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const behaviorDetectionSSO = ref<BehaviorDetectionSSOResponse | null>(null)
  const postBehaviorDetectionSSO = async () => {
    try {
      const response = await API.POST<BehaviorDetectionSSOResponse>('settings/behavior-detection-sso', {
        suppressErrorDialog: true,
      })
      behaviorDetectionSSO.value = response
      return response
    } catch (error) {
      behaviorDetectionSSO.value = null
      setNotificationMessageState({
        message: `${t('message.behaviorDetectionSSOError')}\n${errorFormat(error as ErrorResponse)}`,
      })
      throw error
    }
  }

  return { behaviorDetectionSSO, postBehaviorDetectionSSO }
}
