<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { BandwidthUnitTypes, ResourceStatusTypes, SortDirectionTypes } from '@/api/constants'
import type { SortDirectionType } from '@/api/types'
import type { GuaranteeListQuery } from '@/api/guarantees/types'
import { RouteName } from '@/route/constants'
import type { SortableTableSortByType } from '@/components/nova/table/types'

definePageMeta({
  name: RouteName.Guarantee.List,
})

const { t } = useI18n()
const resourceStatusOptions = useNovaResourceStatusOptions()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { resourceSummaryGuaranteeListOptions, getAllResourceSummaryGuaranteeList } =
  useGetAllResourceSummaryGuaranteeList()
const { guaranteeQuery, guaranteeTableList, getGuaranteeTableList } = useGetGuaranteeTableList()

const headers = [
  {
    title: `${t('nova.guarantee.accessCircuitId')}\n${t('nova.guarantee.accessCircuitName')}`,
    key: 'guaranteeId',
    sortable: true,
    width: 190,
  },
  { title: t('nova.details.siteName'), key: 'siteName', sortable: false, width: 100 },
  {
    title: `${t('nova.terminals.terminalId')}\n${t('nova.terminals.customerNote')}`,
    key: 'terminalId',
    sortable: false,
    width: 140,
  },
  { title: t('nova.details.resourceStatus'), key: 'resourceStatus', sortable: true, width: 150 },
  {
    title: t('nova.guarantee.contractedBandwidth'),
    key: 'contractedBandwidth',
    sortable: false,
    align: 'center' as const,
    width: 480,
    children: [
      { title: t('nova.guarantee.internet'), key: 'internetRateLimit', sortable: false },
      { title: 'VPN', key: 'vpnRateLimit', sortable: false },
      { title: t('nova.guarantee.total'), key: 'totalRateLimit', sortable: false },
    ],
  },
  { title: t('nova.details.orderId'), key: 'orderId', sortable: true, width: 250 },
  { title: t('nova.details.updateTime'), key: 'updateTime', sortable: true, width: 140 },
  { title: '', key: 'action', sortable: false, width: 100 },
]
const calculateTotalRateLimit = (internetRateLimit?: string | null, vpnRateLimit?: string | null) => {
  if (!internetRateLimit && !vpnRateLimit) {
    return '-'
  }

  const total =
    convertBandwidthToUnit(internetRateLimit ?? '', BandwidthUnitTypes.MB) +
    convertBandwidthToUnit(vpnRateLimit ?? '', BandwidthUnitTypes.MB)
  return total >= 1000 && total % 1000 === 0 ? `${total / 1000}G` : `${total}M`
}
const items = computed(() =>
  guaranteeTableList.value.guarantees.map(guarantee => ({
    guaranteeId: guarantee.guaranteeId,
    customerNote: guarantee.customerNote,
    siteName: guarantee.siteName ?? '-',
    terminalId: guarantee.terminalId,
    terminalCustomerNote: guarantee.terminalCustomerNote,
    resourceStatus: guarantee.resourceStatus,
    internetRateLimit: guarantee.internet?.rateLimit ?? '-',
    vpnRateLimit: guarantee.vpn?.rateLimit ?? '-',
    totalRateLimit: calculateTotalRateLimit(guarantee.internet?.rateLimit, guarantee.vpn?.rateLimit),
    orderId: guarantee.orderId,
    updateTime: guarantee.updateTime ? formatDateTime(guarantee.updateTime) : '-',
  })),
)
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const sortBy = computed(() => {
  if (route.query.sortKey) {
    return {
      sortKey: route.query.sortKey as string,
      direction: (route.query.direction || SortDirectionTypes.Asc) as SortDirectionType,
    }
  } else {
    return undefined
  }
})
const handleSort = (newSortBy?: SortableTableSortByType) => {
  routerPushQuery({ ...guaranteeQuery.value, sortKey: newSortBy?.sortKey, direction: newSortBy?.direction })
}

const handleSearch = () => {
  const query = { ...guaranteeQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, query)) {
    getGuaranteeTableList(query)
  } else {
    routerPushQuery(query)
  }
}
const handleQueryClear = () => {
  guaranteeQuery.value = {
    ...guaranteeQuery.value,
    customerNote: undefined,
    guaranteeId: undefined,
    resourceStatus: undefined,
  }
}

const updateQueryCustomerNote = (value: string | string[]) => {
  const customerNote = typeof value === 'string' ? value : value[0]
  guaranteeQuery.value = { ...guaranteeQuery.value, customerNote: customerNote || undefined }
}
const updateQueryGuaranteeId = (value: string | string[]) => {
  const guaranteeIds = Array.isArray(value) ? value : value ? [value] : []
  guaranteeQuery.value = {
    ...guaranteeQuery.value,
    guaranteeId: guaranteeIds.length ? guaranteeIds : undefined,
  }
}
const updateQueryResourceStatus = (value: string | string[]) => {
  const statuses = Array.isArray(value) ? value : value ? [value] : []
  guaranteeQuery.value = {
    ...guaranteeQuery.value,
    resourceStatus: Object.values(ResourceStatusTypes).filter(status => statuses.includes(status)),
  }
}
const routerPushQuery = (query: GuaranteeListQuery) => {
  router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1 } })
}
const handleChangeLimit = (limit?: number) => {
  routerPushQuery({ ...guaranteeQuery.value, limit, offset: 0 })
}
const handleChangePage = (page?: number) => {
  if (page !== undefined) {
    routerPushQuery({ ...guaranteeQuery.value, offset: page - 1 })
  }
}
const moveToDetail = (guaranteeId: string) => {
  navigateTo({ name: RouteName.Guarantee.Detail, params: { tenantId: tenantId.value, id: guaranteeId } })
}

const routeQuery = computed<GuaranteeListQuery>(() =>
  ['limit', 'page', 'customerNote', 'guaranteeId', 'resourceStatus', 'sortKey', 'direction'].reduce<GuaranteeListQuery>(
    (query, key) => {
      const value = route.query[key]
      if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
        return key === 'page'
          ? { ...query, offset: Number(value) < 2 ? 0 : Number(value) - 1 }
          : { ...query, [key]: Number(value) }
      }
      if (['guaranteeId', 'resourceStatus'].includes(key) && typeof value === 'string') {
        return { ...query, [key]: [value] }
      }
      return { ...query, [key]: value }
    },
    { limit: 10, offset: 0 },
  ),
)
const changeRouteQuery = () => {
  guaranteeQuery.value = routeQuery.value
  getGuaranteeTableList(routeQuery.value)
}

watch(() => route.query, changeRouteQuery, { immediate: true })
onBeforeMount(getAllResourceSummaryGuaranteeList)
</script>

<template>
  <div>
    <NovaPageHeader>
      <div class="d-flex ga-4">
        <NovaCustomButton outlined>
          {{ t('nova.guarantee.requestAddressRegistration') }}
        </NovaCustomButton>
        <NovaCustomButton>{{ t('nova.guarantee.applyForLine') }}</NovaCustomButton>
      </div>
    </NovaPageHeader>

    <NovaSearchFilter class="search-filter" @clear="handleQueryClear" @search="handleSearch">
      <div class="d-flex flex-column align-start ga-4">
        <div class="flex-flex-start-center ga-4">
          <NovaSearchInput
            :model-value="guaranteeQuery.customerNote ?? ''"
            type="input"
            :label="t('nova.guarantee.accessCircuitName')"
            @update:model-value="updateQueryCustomerNote"
          />
          <NovaSearchInput
            :model-value="guaranteeQuery.guaranteeId ?? []"
            type="select"
            :options="resourceSummaryGuaranteeListOptions"
            :label="t('nova.guarantee.accessCircuitId')"
            multiple
            @update:model-value="updateQueryGuaranteeId"
          />
        </div>
        <NovaSearchInput
          :model-value="guaranteeQuery.resourceStatus ?? []"
          type="checkbox"
          :options="resourceStatusOptions"
          :label="t('nova.details.resourceStatus')"
          @update:model-value="updateQueryResourceStatus"
        />
      </div>
    </NovaSearchFilter>

    <NovaPaginationHeader
      :total="guaranteeTableList.total"
      :limit="pagination.limit"
      :page="pagination.page"
      @update:limit="handleChangeLimit"
      @update:page="handleChangePage"
    />

    <NovaSortableDataTable
      class="guarantee-data-table"
      :headers="headers"
      :items="items"
      :items-length="guaranteeTableList.total"
      height="80vh"
      :sort-by="sortBy"
      @update:sort-by="handleSort"
    >
      <template #[`header.resourceStatus`]="{ column }">
        <span class="d-inline-flex align-center ga-1">
          {{ column.title }}
          <NovaHelpTooltip icon="help" size="15">TODO: 未実装</NovaHelpTooltip>
        </span>
      </template>
      <template #[`item.guaranteeId`]="{ item }">
        <NuxtLink :to="{ name: RouteName.Guarantee.Detail, params: { tenantId, id: item.guaranteeId } }">
          {{ item.guaranteeId }}
        </NuxtLink>
        <div class="text-break text-wrap">{{ item.customerNote }}</div>
      </template>
      <template #[`item.siteName`]="{ item }">
        <div class="text-break text-wrap">{{ item.siteName }}</div>
      </template>
      <template #[`item.terminalId`]="{ item }">
        <NuxtLink
          v-if="item.terminalId"
          :to="{ name: RouteName.Terminal.Detail, params: { tenantId, id: item.terminalId } }"
        >
          {{ item.terminalId }}
        </NuxtLink>
        <template v-else>-</template>
        <div v-if="item.terminalCustomerNote" class="text-break text-wrap" :title="item.terminalCustomerNote">
          {{ item.terminalCustomerNote }}
        </div>
      </template>
      <template #[`item.resourceStatus`]="{ item }">
        <NovaResourceStatusTag :status="item.resourceStatus" />
      </template>
      <template #[`item.orderId`]="{ item }">
        <NuxtLink v-if="item.orderId" :to="{ name: RouteName.Order.Detail, params: { tenantId, id: item.orderId } }">
          {{ item.orderId }}
        </NuxtLink>
        <template v-else>-</template>
      </template>
      <template #[`item.action`]="{ item }">
        <NovaCustomButton append-icon="mdi-chevron-right" outlined size="small" @click="moveToDetail(item.guaranteeId)">
          {{ t('nova.common.detail') }}
        </NovaCustomButton>
      </template>
    </NovaSortableDataTable>

    <NovaPaginationNavigation
      class="my-5"
      :page="pagination.page"
      :limit="pagination.limit"
      :total="guaranteeTableList.total"
      @update:page="handleChangePage"
    />
  </div>
</template>

<style lang="scss" scoped>
.guarantee-data-table {
  :deep(.v-table__wrapper) {
    overflow-x: auto;
  }

  :deep(table) {
    min-width: 1570px;
    table-layout: fixed;
  }

  :deep(th) {
    white-space: pre-wrap !important;
  }

  :deep(td) {
    white-space: nowrap !important;
  }
}

.search-filter {
  z-index: 10;
}
</style>
