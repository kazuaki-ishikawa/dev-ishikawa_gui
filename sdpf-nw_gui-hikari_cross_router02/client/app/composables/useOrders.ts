import { useI18n } from 'vue-i18n'
import { OrderStatusTypes } from '@/api/constants'
import { OrderRequestTypes, OrderResourceTypes } from '@/api/orders/constants'
import type { OrderResponse, OrderListQuery, OrderListResponse } from '@/api/orders/types'

export const useGetOrderTableList = () => {
  const { API } = useAPI()

  const orderQuery = ref<OrderListQuery>({ limit: 10, offset: 0 })
  const orderTableList = ref<OrderListResponse>({ total: 0, offset: 0, limit: 0, orders: [] })
  const getOrderTableList = async (query: OrderListQuery) => {
    try {
      orderQuery.value = query
      const response = await API.GET<OrderListResponse, OrderListQuery>('resource-summary/orders', { query })
      orderTableList.value = response
      return response
    } catch (error) {
      orderTableList.value = { total: 0, offset: 0, limit: 0, orders: [] }
      throw error
    }
  }

  return { orderQuery, orderTableList, getOrderTableList }
}

export const useGetOrder = () => {
  const { API } = useAPI()

  const order = ref<OrderResponse | null>(null)
  const getOrder = async (orderId: string) => {
    try {
      const response = await API.GET<OrderResponse>(`orders/${orderId}`)
      order.value = response
      return response
    } catch (error) {
      order.value = null
      throw error
    }
  }

  const disabledOrderReapply = computed(() => order.value?.orderStatus !== OrderStatusTypes.Rejected)
  const reappliable = computed(
    () =>
      // コピーして再申請できるのはサービスルーターの新規作成で一括ではないオーダー
      order.value?.resourceType === OrderResourceTypes.Terminal &&
      order.value?.requestType === OrderRequestTypes.Create &&
      !order.value?.bulkOrderId,
  )

  // モバイルアクセスのオーダーで使う日付データ
  const rinkMobileOrderDates = computed(() => {
    if (!order.value || order.value.resourceType !== OrderResourceTypes.RinkMobile) {
      return { reservedCompletionDate: '', reservedConstructionDate: '', cancellationDeadline: '' }
    }

    const reservedCompletionDate =
      'reservedCompletionDate' in order.value.request ? formatDateTime(order.value.request.reservedCompletionDate) : ''
    const reservedConstructionDate =
      'reservedConstructionDate' in order.value.request ? formatDate(order.value.request.reservedConstructionDate) : ''
    const cancellationDeadline =
      'cancellationDeadline' in order.value.request
        ? formatDateTime(order.value.request.cancellationDeadline, false)
        : ''
    return { reservedCompletionDate, reservedConstructionDate, cancellationDeadline }
  })

  return { order, disabledOrderReapply, reappliable, rinkMobileOrderDates, getOrder }
}

export const useDeleteOrder = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteOrder = async (orderId: string) => {
    const response = await API.DELETE<OrderResponse>(`orders/${orderId}`)
    setNotificationMessageState({ message: t('message.deleted') })
    return response
  }

  return { deleteOrder }
}

export const useDeleteRinkMobileOrder = () => {
  const { RINK_MOBILE_API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteRinkMobileOrder = async (orderId: string) => {
    const response = await RINK_MOBILE_API.DELETE<{ id: string }>(`mobile-order/self-add/${orderId}`)
    setNotificationMessageState({ message: t('message.deleted') })
    return response
  }

  return { deleteRinkMobileOrder }
}

export const useOrders = () => {
  const { t } = useI18n()

  const getOrderIdLink = ({ tenantId, orderId }: { tenantId: string; orderId?: string | null }) => {
    if (orderId) {
      return `/tenants/${tenantId}/orders/${orderId}`
    } else {
      return ''
    }
  }

  const orderRequestTypeTranslation = {
    [OrderRequestTypes.Create]: t('common.createNew'),
    [OrderRequestTypes.Update]: t('common.edit'),
    [OrderRequestTypes.Delete]: t('common.delete'),
  } as const

  const orderResourceTypeTranslation = {
    [OrderResourceTypes.Fic]: t('service.fic'),
    [OrderResourceTypes.Guarantee]: t('trafficDetails.guarantee'),
    [OrderResourceTypes.RegistrationAddress]: t('sideBar.addressRegistrationRequest'),
    [OrderResourceTypes.PhoneTicketingSupport]: t('sideBar.phoneTicketingSupport'),
    [OrderResourceTypes.Ipoe]: t('sideBar.ipoes'),
    [OrderResourceTypes.Terminal]: t('sideBar.terminal'),
    [OrderResourceTypes.SelfTerminal]: t('sideBar.terminal'),
    [OrderResourceTypes.Vpn]: t('service.vpn'),
    [OrderResourceTypes.Contractor]: t('sideBar.contractor'),
    [OrderResourceTypes.Mobile]: t('sideBar.mobile'),
    [OrderResourceTypes.BreakOutList]: t('breakOut.title'),
    [OrderResourceTypes.SecurityHelpDesk]: t('securityContracts.securityHelpDesk'),
    [OrderResourceTypes.RinkMobile]: t('sideBar.rinkMobile'),
    [OrderResourceTypes.Msb]: t('sideBar.mySecureBusinesses'),
  }

  const orderStatusTypeTranslation = {
    [OrderStatusTypes.Applied]: t('orders.applied'),
    [OrderStatusTypes.Processing]: t('orders.processing'),
    [OrderStatusTypes.Completed]: t('orders.completed'),
    [OrderStatusTypes.Canceled]: t('orders.canceled'),
    [OrderStatusTypes.Rejected]: t('orders.rejected'),
    [OrderStatusTypes.Aborted]: t('orders.aborted'),
  } as const

  return { getOrderIdLink, orderRequestTypeTranslation, orderResourceTypeTranslation, orderStatusTypeTranslation }
}
