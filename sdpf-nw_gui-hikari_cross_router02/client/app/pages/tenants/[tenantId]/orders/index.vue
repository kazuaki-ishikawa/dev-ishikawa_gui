<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { OrderListQuery, OrderQueryType, OrderResourceType } from '@/api/orders/types'
import { OrderResourceTypes } from '@/api/orders/constants'
import { IconTypes } from '@/components/icons/constants'
import type { SortOption } from '@/components/table/types'
import { TenantPages, GuaranteePages, SecurityContractsPages, RinkMobilePages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const textSmRequestTypeSet = new Set<string>([
  OrderResourceTypes.Terminal,
  OrderResourceTypes.SelfTerminal,
  OrderResourceTypes.Ipoe,
  OrderResourceTypes.RegistrationAddress,
  OrderResourceTypes.BreakOutList,
  OrderResourceTypes.SecurityHelpDesk,
])

const { orderRequestTypeTranslation, orderResourceTypeTranslation, orderStatusTypeTranslation } = useOrders()
const { orderQuery, orderTableList, getOrderTableList } = useGetOrderTableList()
const orderFilterQuery = computed<OrderQueryType>({
  get: () => ({
    bulkOrderId: orderQuery.value.bulkOrderId,
    resourceId: orderQuery.value.resourceId,
    orderStatus: orderQuery.value.orderStatus,
    requestType: orderQuery.value.requestType,
    resourceType: orderQuery.value.resourceType,
  }),
  set: (value: OrderQueryType) => {
    orderQuery.value = { ...orderQuery.value, ...value }
  },
})

const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const tableHeaders = [
  { text: t('details.orderId'), key: 'orderId' },
  { text: t('orders.customerNote'), key: 'customerNote', width: 200 },
  { text: t('orders.bulkOrderId'), key: 'bulkOrderId', width: 200 },
  { text: t('orders.requestType'), key: 'requestType', width: 180 },
  { text: t('orders.resourceType'), key: 'resourceType', width: 184 },
  { text: t('orders.resourceId'), key: 'resourceId', width: 150 },
  { text: t('details.orderStatus'), key: 'orderStatus', width: 184, class: 'text-sm' },
  { text: t('details.updateTime'), key: 'updateTime', width: 175 },
]
const tableItems = computed(() => {
  const items = orderTableList.value?.orders.map(order => ({
    orderId: order.orderId,
    bulkOrderId: order?.bulkOrderId ?? '',
    requestType: orderRequestTypeTranslation[order.requestType],
    customerNote: order?.customerNote ?? '',
    resourceType: order.resourceType,
    resourceId: order?.resourceId ?? '',
    resourceLink: getResourceLink(order.resourceType, order?.resourceId ?? ''),
    orderStatus: orderStatusTypeTranslation[order.orderStatus],
    updateTime: formatDateTime(order?.updateTime),
  }))
  return items ?? []
})
const sortOption = computed<Partial<SortOption>>(() => ({
  sortKey: orderQuery.value?.sortKey,
  direction: orderQuery.value?.direction,
}))

const getResourceLink = (resourceType: OrderResourceType, resourceId: string) => {
  switch (resourceType) {
    case OrderResourceTypes.Terminal:
      return `/tenants/${tenantId.value}/${TenantPages.Terminals}/${resourceId}`
    case OrderResourceTypes.SelfTerminal:
      return `/tenants/${tenantId.value}/${TenantPages.SelfTerminals}/${resourceId}`
    case OrderResourceTypes.Guarantee:
      return `/tenants/${tenantId.value}/${TenantPages.Guarantees}/${GuaranteePages.Circuits}/${resourceId}`
    case OrderResourceTypes.Ipoe:
      return `/tenants/${tenantId.value}/${TenantPages.Ipoes}/${resourceId}`
    case OrderResourceTypes.Vpn:
      return `/tenants/${tenantId.value}/${TenantPages.Vpns}/${resourceId}`
    case OrderResourceTypes.Fic:
      return `/tenants/${tenantId.value}/${TenantPages.Fic}/${resourceId}`
    case OrderResourceTypes.Contractor:
      return `/tenants/${tenantId.value}/${TenantPages.Contracts}/contractor`
    case OrderResourceTypes.Mobile:
      return `/tenants/${tenantId.value}/${TenantPages.Contracts}/mobile`
    case OrderResourceTypes.BreakOutList:
      return `/tenants/${tenantId.value}/${TenantPages.BreakOutLists}/${resourceId}`
    case OrderResourceTypes.SecurityHelpDesk:
      return `/tenants/${tenantId.value}/${TenantPages.SecurityContracts}/${SecurityContractsPages.SecurityHelpDesk}`
    case OrderResourceTypes.RinkMobile:
      return `/tenants/${tenantId.value}/${TenantPages.RinkMobile}/${RinkMobilePages.Contracts}/${resourceId}`
    case OrderResourceTypes.Msb:
      return `/tenants/${tenantId.value}/${TenantPages.Msb}/${resourceId}`
  }
}

const routerPushQuery = (query: OrderListQuery) => {
  router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1 } })
}

const handleChangeLimit = (limit?: number) => {
  routerPushQuery({ ...orderQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  routerPushQuery({ ...orderQuery.value, offset: page - 1 })
}
const handleSort = (option?: SortOption) => {
  routerPushQuery({ ...orderQuery.value, sortKey: option?.sortKey, direction: option?.direction })
}
const handleSearch = () => {
  const newQuery = { ...orderQuery.value, ...orderFilterQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, newQuery)) {
    // パスクエリの変更がない場合は直接 getOrderTableList を実行する
    getOrderTableList(newQuery)
  } else {
    routerPushQuery(newQuery)
  }
}

const routeQuery = computed(() =>
  [
    'limit',
    'page',
    'sortKey',
    'direction',
    'resourceId',
    'bulkOrderId',
    'orderStatus',
    'requestType',
    'resourceType',
  ].reduce((q, key) => {
    const value = route.query[key]
    if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
      if (key === 'page') {
        return Object.assign(q, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
      }
      return Object.assign(q, { [key]: Number(value) })
    } else if (['orderStatus', 'requestType'].includes(key) && typeof value === 'string') {
      return Object.assign(q, { [key]: [value] })
    } else if (['resourceType'].includes(key) && !!value) {
      const values = typeof value === 'string' ? [value] : (value as string[])
      const resourceType = Object.values(OrderResourceTypes).filter(type => {
        if (type === OrderResourceTypes.SelfTerminal || type === OrderResourceTypes.Terminal) {
          return values.includes(OrderResourceTypes.SelfTerminal) || values.includes(OrderResourceTypes.Terminal)
        } else {
          return values.includes(type)
        }
      })
      return Object.assign(q, { resourceType })
    } else {
      return Object.assign(q, { [key]: value })
    }
  }, {}),
)

watch(
  () => route.query,
  () => {
    getOrderTableList(routeQuery.value)
  },
  { immediate: true },
)
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center pb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Order" color="secondary" />
      <div class="ml-2 text-lg">{{ t('sideBar.orders') }}</div>
    </div>
    <OrderFilter v-model:query="orderFilterQuery" @search="handleSearch" />
    <PaginationHeader
      :page="pagination.page"
      :limit="pagination.limit"
      :total="orderTableList?.total"
      @update:limit="handleChangeLimit"
    />
    <SortableTable
      :headers="tableHeaders"
      :items="tableItems"
      :key-items="['orderId']"
      :unsortable-keys="['customerNote']"
      :sort="sortOption"
      @sort="handleSort"
    >
      <template #orderId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.Orders}/${data}`" class="text-truncate">{{ data }}</NuxtLink>
      </template>
      <template #customerNote="{ data }">
        <div truncate :title="data">{{ data }}</div>
      </template>
      <template #bulkOrderId="{ data }">
        <div class="text-truncate">{{ data }}</div>
      </template>
      <template #resourceType="{ row }">
        <div :class="{ 'text-sm': textSmRequestTypeSet.has(row.resourceType) }" class="text-pre-wrap">
          {{ orderResourceTypeTranslation[row.resourceType] }}
        </div>
      </template>
      <template #resourceId="{ row, data }">
        <NuxtLink v-if="row.resourceLink" :to="row.resourceLink" class="text-truncate">{{ data }}</NuxtLink>
        <div v-else class="text-truncate">{{ data }}</div>
      </template>
    </SortableTable>
    <PaginationFooter
      :page="pagination.page"
      :limit="pagination.limit"
      :total="orderTableList?.total"
      @update:page="handleChangePage"
    />
  </CardContainer>
</template>
