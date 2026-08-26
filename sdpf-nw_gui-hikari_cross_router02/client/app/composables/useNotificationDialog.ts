export const useNotificationDialog = () => {
  const openNotificationDialog = useState('openNotificationDialog', () => false)
  const notificationMessage = useState('notificationMessage', () => '')
  const isRinkMobileState = useState('isRinkMobile', () => false)
  const isRinkLineGroupState = useState('isRinkLineGroup', () => false)
  const orderIdState = useState('orderId', () => '')
  const bulkOrderIdState = useState('bulkOrderId', () => '')

  const setNotificationMessageState = (notification?: {
    message: string
    orderId?: string
    bulkOrderId?: string
    isRinkMobile?: boolean
    isRinkLineGroup?: boolean
  }) => {
    // notification?.message に値がある場合はダイアログを開く
    openNotificationDialog.value = !!notification?.message
    notificationMessage.value = notification?.message ?? ''
    // それぞれstateに値を入れる
    orderIdState.value = notification?.orderId ?? ''
    bulkOrderIdState.value = notification?.bulkOrderId ?? ''
    isRinkMobileState.value = !!notification?.isRinkMobile
    isRinkLineGroupState.value = !!notification?.isRinkLineGroup
  }

  return {
    openNotificationDialog,
    notificationMessage,
    orderIdState,
    bulkOrderIdState,
    isRinkMobileState,
    isRinkLineGroupState,
    setNotificationMessageState,
  }
}
