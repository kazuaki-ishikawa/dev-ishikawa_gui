import { useI18n } from 'vue-i18n'
import { OrderStatusTypes, SecurityOptionTypes, BehaviorDetectionOptionTypes } from '@/api/constants'
import type {
  TerminalThreatDetectionPlanType,
  TerminalFlowCollectorPlanType,
  TerminalBehaviorDetectionPlanType,
} from '@/api/types'
import type { SecurityHelpDeskResponse } from '@/api/securityHelpDesk/types'

export const SecurityHelpDeskStatus = {
  Unused: 'unused', // 申し込み前の状態
  Creating: 'creating', // 申し込みが完了し利用開始を待っている状態
  Created: 'created', // 利用開始日を過ぎ利用中の状態
  Deleting: 'deleting', // 廃止申し込み後、廃止日を待っている状態
  Deleted: 'deleted', // 廃止された状態
} as const

export const useGetSecurityHelpDesk = () => {
  const { API } = useAPI()

  const securityHelpDesk = ref<SecurityHelpDeskResponse | null>(null)
  const getSecurityHelpDesk = async () => {
    try {
      const response = await API.GET<SecurityHelpDeskResponse>('settings/security-help-desk')
      securityHelpDesk.value = response
      return response
    } catch (error) {
      securityHelpDesk.value = null
      throw error
    }
  }

  const editable = computed(
    () =>
      !!securityHelpDesk.value &&
      (!securityHelpDesk.value?.orderStatus || securityHelpDesk.value.orderStatus === OrderStatusTypes.Completed),
  )

  const status = computed(() => {
    if (!securityHelpDesk.value?.effectiveDate) {
      return SecurityHelpDeskStatus.Unused
    }

    const waitingOrderStatus =
      !!securityHelpDesk.value.orderStatus &&
      [OrderStatusTypes.Applied, OrderStatusTypes.Processing].includes(securityHelpDesk.value.orderStatus)

    if (securityHelpDesk.value.enabled) {
      if (waitingOrderStatus) {
        // サポートが有効で orderStatus が未処理・処理中の場合は Deleting 状態
        return SecurityHelpDeskStatus.Deleting
      } else {
        return SecurityHelpDeskStatus.Created
      }
    }

    if (waitingOrderStatus) {
      // サポートが無効で orderStatus が未処理・処理中の場合は Creating 状態
      return SecurityHelpDeskStatus.Creating
    } else {
      return SecurityHelpDeskStatus.Deleted
    }
  })

  const shouldShowHelpDeskCampaign = (
    threatDetectionPlan: TerminalThreatDetectionPlanType | '',
    flowCollectorPlan: TerminalFlowCollectorPlanType | '',
    behaviorDetectionPlan: TerminalBehaviorDetectionPlanType | '',
  ) => {
    // NoSubscription 以外を選択しているときはキャンペーンを表示する
    const isThreatDetectionPlanSubscribed = [
      SecurityOptionTypes.Plan3Months,
      SecurityOptionTypes.Plan12Months,
    ].includes(threatDetectionPlan)
    const isFlowCollectorPlanSubscribed = [
      SecurityOptionTypes.Plan3Months,
      SecurityOptionTypes.Plan6Months,
      SecurityOptionTypes.Plan12Months,
    ].includes(flowCollectorPlan)
    const isBehaviorDetectionPlanSubscribed = behaviorDetectionPlan === BehaviorDetectionOptionTypes.Subscription
    return (
      status.value === SecurityHelpDeskStatus.Unused &&
      (isThreatDetectionPlanSubscribed || isFlowCollectorPlanSubscribed || isBehaviorDetectionPlanSubscribed)
    )
  }

  return { securityHelpDesk, getSecurityHelpDesk, editable, status, shouldShowHelpDeskCampaign }
}

export const useCreateSecurityHelpDesk = () => {
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()
  const { t } = useI18n()
  const { isNovaView } = useNova()

  const createSecurityHelpDesk = async () => {
    const response = await API.POST<SecurityHelpDeskResponse>('settings/security-help-desk')
    if (!isNovaView.value) {
      setNotificationMessageState({ message: t('securityHelpDesk.confirm.created') })
    }
    return response
  }

  return { createSecurityHelpDesk }
}

export const useDeleteSecurityHelpDesk = () => {
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()
  const { t } = useI18n()
  const { isNovaView } = useNova()

  const deleteSecurityHelpDesk = async () => {
    const response = await API.DELETE<SecurityHelpDeskResponse>('settings/security-help-desk')
    if (!isNovaView.value) {
      setNotificationMessageState({ message: t('securityHelpDesk.confirm.deleted') })
    }
    return response
  }

  return { deleteSecurityHelpDesk }
}
