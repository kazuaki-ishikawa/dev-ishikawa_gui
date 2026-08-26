<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { OrderStatusTypes } from '@/api/constants'
import { OrderRequestTypes, OrderResourceTypes } from '@/api/orders/constants'
import { RemovalCollectTypes } from '@/api/ipoes/constants'
import { TenantPages, GuaranteePages, SecurityContractsPages, RinkMobilePages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const tenantId = computed(() => route.params.tenantId as string)
const orderId = computed(() => route.params.id as string)
const deleteDialog = ref(false)

const { orderStatusTypeTranslation, orderRequestTypeTranslation, orderResourceTypeTranslation } = useOrders()
const { order, disabledOrderReapply, reappliable, rinkMobileOrderDates, getOrder } = useGetOrder()
const { deleteOrder } = useDeleteOrder()
const { deleteRinkMobileOrder } = useDeleteRinkMobileOrder()

const { getIpoe, fletsSeparate, hikariCollabo } = useGetIpoe()

const { getBreakOutList, breakOutList } = useGetBreakOutList()
const { showRinkMobileMaintenanceNotification, disabledRinkMobileMaintenanceApplication } = useRinkMobileMaintenance()
const requestTypeText = computed(() =>
  order.value?.requestType ? orderRequestTypeTranslation[order.value.requestType] : '',
)
const resourceTypeText = computed(() =>
  order.value?.resourceType ? orderResourceTypeTranslation[order.value.resourceType] : '',
)

const isIpoeCreateOrder = computed(
  () => order.value?.resourceType === OrderResourceTypes.Ipoe && order.value?.requestType === OrderRequestTypes.Create,
)
const removal = computed(() => (hikariCollabo.value ? hikariCollabo.value.removal : undefined))
const isHikariCollaboDeleteWithoutRemoval = computed(
  () =>
    order.value?.resourceType === OrderResourceTypes.Ipoe &&
    order.value?.requestType === OrderRequestTypes.Delete &&
    !!order.value?.request &&
    'collectType' in order.value.request &&
    order.value.request.collectType === RemovalCollectTypes.Visit &&
    !removal.value?.date &&
    !removal.value?.time,
)
const isHikariCollaboDiversionOrder = computed(
  () =>
    order.value?.resourceType === OrderResourceTypes.Ipoe &&
    order.value?.requestType === OrderRequestTypes.Update &&
    !!order.value?.request &&
    'diversionNumber' in order.value.request,
)
const isFletsSeparateCreateOrder = computed(() => {
  return (
    !!order.value?.request &&
    order.value?.resourceType === OrderResourceTypes.Ipoe &&
    order.value?.requestType === OrderRequestTypes.Create &&
    'fletsOpen' in order.value.request
  )
})
const isFicCreateOrder = computed(
  () => order.value?.resourceType === OrderResourceTypes.Fic && order.value?.requestType === OrderRequestTypes.Create,
)
const isRinkMobileOrder = computed(() => order.value?.resourceType === OrderResourceTypes.RinkMobile)
const isSelfTerminalCreateOrder = computed(
  () =>
    order.value?.resourceType === OrderResourceTypes.SelfTerminal &&
    order.value?.requestType === OrderRequestTypes.Create,
)

const isOrderCancelDisabled = computed(() => {
  if (isRinkMobileOrder.value && disabledRinkMobileMaintenanceApplication) {
    return true
  }
  if (isFletsSeparateCreateOrder.value) {
    // フレッツ回線別新規作成の場合、開通日の3日前以降はキャンセル不可
    const ipoeApplicationDate = fletsSeparate.value?.ipoeApplicationDate
    // 開通日が未設定の場合はキャンセル不可
    if (!ipoeApplicationDate) {
      return true
    }

    const applicationDate = dayjs(ipoeApplicationDate)
    const deadline = dayjs().add(3, 'day')
    return applicationDate.isBefore(deadline, 'day')
  } else if (isFicCreateOrder.value) {
    // FIC新規作成の場合、オーダーステータスが受付中、処理中以外はキャンセル不可
    return (
      order.value?.orderStatus !== OrderStatusTypes.Applied && order.value?.orderStatus !== OrderStatusTypes.Processing
    )
  } else {
    // モバイルアクセスオーダー、光コラボ新規作成、自営ルーター新規作成の場合、オーダーステータスが受付中以外はキャンセル不可
    return order.value?.orderStatus !== OrderStatusTypes.Applied
  }
})
const showOrderCancel = computed(
  // オーダー取り下げボタン表示条件
  // IPoEかつ新規作成の場合, 訪問回収日未設定の光コラボ廃止オーダーの場合, FIC新規作成の場合
  // モバイルアクセスオーダーの場合, 自営ルーター新規作成の場合
  () =>
    isIpoeCreateOrder.value ||
    isHikariCollaboDeleteWithoutRemoval.value ||
    isHikariCollaboDiversionOrder.value ||
    isFicCreateOrder.value ||
    isRinkMobileOrder.value ||
    isSelfTerminalCreateOrder.value,
)

const handleReapplyClick = async () => {
  await navigateTo({
    path: `/tenants/${tenantId.value}/${TenantPages.Terminals}/create`,
    query: { orderId: orderId.value },
  })
}

const resourceLink = computed(() => {
  if (!order.value?.resourceType || !order.value?.resourceId) {
    return
  }
  switch (order.value.resourceType) {
    case OrderResourceTypes.Terminal:
      return `/tenants/${tenantId.value}/${TenantPages.Terminals}/${order.value.resourceId}`
    case OrderResourceTypes.SelfTerminal:
      return `/tenants/${tenantId.value}/${TenantPages.SelfTerminals}/${order.value.resourceId}`
    case OrderResourceTypes.Guarantee:
      return `/tenants/${tenantId.value}/${TenantPages.Guarantees}/${GuaranteePages.Circuits}/${order.value.resourceId}`
    case OrderResourceTypes.Ipoe:
      return `/tenants/${tenantId.value}/${TenantPages.Ipoes}/${order.value.resourceId}`
    case OrderResourceTypes.Vpn:
      return `/tenants/${tenantId.value}/${TenantPages.Vpns}/${order.value.resourceId}`
    case OrderResourceTypes.Fic:
      return `/tenants/${tenantId.value}/${TenantPages.Fic}/${order.value.resourceId}`
    case OrderResourceTypes.Contractor:
      return `/tenants/${tenantId.value}/${TenantPages.Contracts}/contractor`
    case OrderResourceTypes.Mobile:
      return `/tenants/${tenantId.value}/${TenantPages.Contracts}/mobile`
    case OrderResourceTypes.BreakOutList:
      return `/tenants/${tenantId.value}/${TenantPages.BreakOutLists}/${order.value.resourceId}`
    case OrderResourceTypes.SecurityHelpDesk:
      return `/tenants/${tenantId.value}/${TenantPages.SecurityContracts}/${SecurityContractsPages.SecurityHelpDesk}`
    case OrderResourceTypes.RinkMobile:
      return `/tenants/${tenantId.value}/${TenantPages.RinkMobile}/${RinkMobilePages.Contracts}/${order.value.resourceId}`
    case OrderResourceTypes.Msb:
      return `/tenants/${tenantId.value}/${TenantPages.Msb}/${order.value.resourceId}`
    default:
      return ''
  }
})

const handleOrderCancel = async () => {
  try {
    if (isRinkMobileOrder.value) {
      await deleteRinkMobileOrder(orderId.value)
    } else {
      await deleteOrder(orderId.value)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    // エラー処理は 削除関数 内で行う
  } finally {
    deleteDialog.value = false
  }
}

onBeforeMount(async () => {
  await getOrder(orderId.value)
  const ipoeId = order.value?.resourceType === OrderResourceTypes.Ipoe ? order.value?.resourceId : ''
  if (ipoeId) {
    getIpoe(ipoeId)
  }
  if (order.value?.resourceType === OrderResourceTypes.Terminal) {
    // ルーターの場合のみ getBreakOutList を実行する
    getBreakOutList({ customerNote: undefined, resourceStatus: undefined })
  }
})
</script>

<template>
  <CardContainer>
    <InnerCard :title="t('orders.detail')">
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <div>{{ order?.orderId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('orders.customerNote') }}</div>
        <div>{{ order?.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('orders.bulkOrderId') }}</div>
        <div>{{ order?.bulkOrderId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('orders.requestType') }}</div>
        <div>{{ requestTypeText }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('orders.resourceType') }}</div>
        <div>{{ resourceTypeText }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('orders.resourceId') }}</div>
        <NuxtLink v-if="!!resourceLink" :to="resourceLink">
          {{ order?.resourceId }}
        </NuxtLink>
        <div v-else>{{ order?.resourceId }}</div>
      </DetailGrid>
      <DetailGrid v-if="order?.orderStatus">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[order.orderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('orders.creationTime') }}</div>
        <div>{{ formatDateTime(order?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div>{{ formatDateTime(order?.updateTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <template v-if="!!order?.request">
      <OrderFicConnection v-if="order?.resourceType === OrderResourceTypes.Fic" :request="order.request" />
      <OrderGuaranteeRequest
        v-else-if="order?.resourceType === OrderResourceTypes.Guarantee"
        :request="order.request"
        :request-type="order.requestType"
      />
      <OrderRegistrationAddressRequest
        v-else-if="order?.resourceType === OrderResourceTypes.RegistrationAddress"
        :request="order.request"
      />
      <OrderIpoeRequest
        v-else-if="order?.resourceType === OrderResourceTypes.Ipoe"
        :request="order.request"
        :request-type="order.requestType"
      />
      <OrderTerminalRequest
        v-else-if="
          order?.resourceType === OrderResourceTypes.Terminal || order?.resourceType === OrderResourceTypes.SelfTerminal
        "
        :request="order.request"
        :request-type="order.requestType"
        :break-out-list="breakOutList"
      />
      <OrderVpn v-else-if="order?.resourceType === OrderResourceTypes.Vpn" :request="order.request" />
      <OrderContractor v-else-if="order?.resourceType === OrderResourceTypes.Contractor" :request="order.request" />
      <OrderMobile v-else-if="order?.resourceType === OrderResourceTypes.Mobile" :request="order.request" />
      <OrderPhoneTicketingSupportRequest
        v-else-if="order?.resourceType === OrderResourceTypes.PhoneTicketingSupport"
        :request="order.request"
        :request-type="order.requestType"
      />
      <OrderBreakOutRequest
        v-else-if="order?.resourceType === OrderResourceTypes.BreakOutList"
        :request="order.request"
      />
      <OrderRinkMobileRequest
        v-else-if="order?.resourceType === OrderResourceTypes.RinkMobile"
        :order="order"
        :order-dates="rinkMobileOrderDates"
      />
      <OrderMsbRequest
        v-else-if="order?.resourceType === OrderResourceTypes.Msb"
        :request="order.request"
        :request-type="order.requestType"
      />
    </template>

    <InnerCard v-if="!isRinkMobileOrder" :title="t('orders.response')" data-cy="orders-id-index-response">
      <DetailGrid>
        <div>{{ t('orders.statusCode') }}</div>
        <div>{{ order?.response.statusCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('orders.remarks') }}</div>
        <div>{{ order?.response?.remarks }}</div>
      </DetailGrid>
      <template v-if="order?.response?.message">
        <FicConnectionDetail
          v-if="order?.resourceType === OrderResourceTypes.Fic"
          :fic-connection="order.response.message"
          :tenant-id="tenantId"
          is-order
        />
        <OrderGuaranteeResponse
          v-else-if="order?.resourceType === OrderResourceTypes.Guarantee"
          :response="order.response.message"
          :tenant-id="tenantId"
        />
        <OrderRegistrationAddressResponse
          v-else-if="order?.resourceType === OrderResourceTypes.RegistrationAddress"
          :response="order.response.message"
        />
        <OrderIpoeResponse
          v-else-if="order?.resourceType === OrderResourceTypes.Ipoe"
          :request="order.request"
          :response="order.response.message"
          :tenant-id="tenantId"
          :downloadable-document-id="order?.downloadableDocumentId"
        />
        <OrderTerminalResponse
          v-else-if="
            order?.resourceType === OrderResourceTypes.Terminal ||
            order?.resourceType === OrderResourceTypes.SelfTerminal
          "
          :terminal="order.response.message"
          :tenant-id="tenantId"
          :request-type="order.requestType"
          :break-out-list="breakOutList"
        />
        <VpnDetail
          v-else-if="order?.resourceType === OrderResourceTypes.Vpn"
          :vpn="order.response.message"
          :tenant-id="tenantId"
          is-order
        />
        <ContractorDetail
          v-else-if="order?.resourceType === OrderResourceTypes.Contractor"
          :contractor="order.response.message"
          :tenant-id="tenantId"
        />
        <MobileDetail
          v-else-if="order?.resourceType === OrderResourceTypes.Mobile"
          :mobile="order.response.message"
          :tenant-id="tenantId"
        />
        <PhoneTicketingSupportDetail
          v-else-if="order?.resourceType === OrderResourceTypes.PhoneTicketingSupport"
          :phone-ticketing-support="order.response.message"
          :tenant-id="tenantId"
          :status="
            order.requestType === OrderRequestTypes.Delete
              ? PhoneTicketingSupportStatus.Deleting
              : PhoneTicketingSupportStatus.Creating
          "
          is-order
        />
        <BreakOutDetail
          v-else-if="order?.resourceType === OrderResourceTypes.BreakOutList"
          :break-out="order.response.message"
          show-times
          is-order
        />
        <OrderSecurityHelpDesk
          v-else-if="order?.resourceType === OrderResourceTypes.SecurityHelpDesk"
          :security-help-desk="order.response.message"
        />
        <MsbDetail v-else-if="order?.resourceType === OrderResourceTypes.Msb" :msb="order.response.message" is-order />
      </template>
    </InnerCard>

    <div
      v-if="isRinkMobileOrder && showRinkMobileMaintenanceNotification"
      class="mb-4 text-warning text-pre-wrap"
      data-cy="orders-id-index-rink-mobile-maintenance-notification"
    >
      {{ t('rinkConnections.message.maintenanceOrderCancellationSuspension') }}
    </div>

    <div class="flex-flex-end-center pt-2">
      <CustomButton
        color="info"
        icon="left-arrow"
        :text="t('common.return')"
        :width="180"
        data-cy="orders-id-index-return-button"
        @click="router.back()"
      />
      <CustomButton
        v-if="showOrderCancel"
        class="ml-6"
        color="warning"
        icon="right-arrow"
        :text="t('orders.cancel')"
        :width="180"
        :disabled="isOrderCancelDisabled"
        data-cy="orders-id-index-cancel-button"
        @click="deleteDialog = true"
      />
      <CustomButton
        v-if="reappliable"
        class="ml-6"
        icon="right-arrow"
        :text="t('orders.reapply')"
        :width="180"
        :disabled="disabledOrderReapply"
        data-cy="orders-id-index-reapply-button"
        @click="handleReapplyClick"
      />
    </div>

    <ConfirmDialog
      :open="deleteDialog"
      :text="t('orders.cancelConfirm')"
      @submit="handleOrderCancel"
      @close="deleteDialog = false"
    />
  </CardContainer>
</template>
