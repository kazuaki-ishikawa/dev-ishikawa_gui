<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes, SortDirectionTypes } from '@/api/constants'
import type { SortDirectionType } from '@/api/types'
import { IpoeContractTypes, IpoeTypes } from '@/api/ipoes/constants'
import type { IpoeListQuery } from '@/api/ipoes/types'
import { RouteName } from '@/route/constants'
import type { SortableTableSortByType } from '@/components/nova/table/types'

definePageMeta({
  name: RouteName.Ipoe.List,
})

const { t } = useI18n()
const resourceStatusOptions = useNovaResourceStatusOptions()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { ipoeListOptions, getAllSummaryIpoeList } = useGetAllSummaryIpoeList()
const { ipoeQuery, ipoeTableList, getIpoeTableList } = useGetIpoeTableList()

const headers = [
  {
    title: `${t('nova.ipoes.accessCircuitId')}\n${t('nova.ipoes.accessCircuitName')}`,
    key: 'ipoeId',
    sortable: true,
    width: 180,
  },
  { title: t('nova.ipoes.ipv4Address'), key: 'ipv4Address', sortable: true, width: 130 },
  { title: t('nova.ipoes.contractType'), key: 'contractType', sortable: false, width: 130 },
  { title: t('nova.ipoes.fletsId'), key: 'fletsId', sortable: true, width: 140 },
  { title: t('nova.details.siteName'), key: 'siteName', sortable: false, width: 130 },
  {
    title: `${t('nova.terminals.terminalId')}\n${t('nova.terminals.customerNote')}`,
    key: 'terminalId',
    sortable: true,
    width: 160,
  },
  { title: t('nova.details.resourceStatus'), key: 'resourceStatus', sortable: true, width: 110 },
  { title: t('nova.ipoes.plan'), key: 'ipoeType', sortable: true, width: 100 },
  { title: t('nova.ipoes.widePlusForWebConference'), key: 'appControl', sortable: true, width: 140 },
  { title: t('nova.details.orderId'), key: 'orderId', sortable: true, width: 250 },
  { title: t('nova.details.updateTime'), key: 'updateTime', sortable: true, width: 140 },
  { title: '', key: 'action', sortable: false, width: 100 },
]
const items = computed(() =>
  ipoeTableList.value.ipoes.map(ipoe => ({
    ipoeId: ipoe.ipoeId,
    customerNote: ipoe.customerNote,
    ipv4Address: ipoe.ipv4Address ?? '-',
    contractType: ipoe.ref.includes(IpoeContractTypes.SeparateContract)
      ? t('nova.ipoes.fletsSeparate')
      : t('nova.ipoes.hikariCollabo'),
    fletsId: ipoe.fletsId ?? '-',
    siteName: ipoe.siteName ?? '-',
    terminalId: ipoe.terminalId,
    terminalCustomerNote: ipoe.terminalCustomerNote,
    resourceStatus: ipoe.resourceStatus,
    ipoeType:
      {
        [IpoeTypes.Normal]: t('nova.ipoes.standard'),
        [IpoeTypes.Wide]: t('nova.ipoes.wide'),
        [IpoeTypes.SuperWide]: t('nova.ipoes.superWide'),
      }[ipoe.ipoeType] ?? ipoe.ipoeType,
    appControl: ipoe.appControl ? t('nova.ipoes.enabled') : t('nova.ipoes.disabled'),
    orderId: ipoe.orderId,
    updateTime: ipoe.updateTime ? formatDateTime(ipoe.updateTime) : '-',
  })),
)
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const sortBy = computed<SortableTableSortByType | undefined>(() => {
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
  routerPushQuery({ ...ipoeQuery.value, sortKey: newSortBy?.sortKey, direction: newSortBy?.direction })
}
const handleSearch = () => {
  const query = { ...ipoeQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, query)) {
    getIpoeTableList(query)
  } else {
    routerPushQuery(query)
  }
}
const handleQueryClear = () => {
  ipoeQuery.value = { ...ipoeQuery.value, customerNote: undefined, ipoeId: undefined, resourceStatus: undefined }
}

const updateQueryCustomerNote = (value: string | string[]) => {
  const customerNote = typeof value === 'string' ? value : value[0]
  ipoeQuery.value = { ...ipoeQuery.value, customerNote: customerNote || undefined }
}
const updateQueryIpoeId = (value: string | string[]) => {
  const ipoeIds = Array.isArray(value) ? value : value ? [value] : []
  ipoeQuery.value = { ...ipoeQuery.value, ipoeId: ipoeIds.length ? ipoeIds : undefined }
}
const updateQueryResourceStatus = (value: string | string[]) => {
  const statuses = Array.isArray(value) ? value : value ? [value] : []
  ipoeQuery.value = {
    ...ipoeQuery.value,
    resourceStatus: Object.values(ResourceStatusTypes).filter(status => statuses.includes(status)),
  }
}
const routerPushQuery = (query: IpoeListQuery) => {
  router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1 } })
}
const handleChangeLimit = (limit?: number) => {
  routerPushQuery({ ...ipoeQuery.value, limit, offset: 0 })
}
const handleChangePage = (page?: number) => {
  if (page !== undefined) {
    routerPushQuery({ ...ipoeQuery.value, offset: page - 1 })
  }
}
const moveToDetail = (ipoeId: string) => {
  navigateTo({ name: RouteName.Ipoe.Detail, params: { tenantId: tenantId.value, id: ipoeId } })
}
const moveToCreate = () => {
  navigateTo({ name: RouteName.Ipoe.Create, params: { tenantId: tenantId.value } })
}

const routeQuery = computed<IpoeListQuery>(() =>
  ['limit', 'page', 'customerNote', 'ipoeId', 'resourceStatus', 'sortKey', 'direction'].reduce<IpoeListQuery>(
    (query, key) => {
      const value = route.query[key]
      if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
        return key === 'page'
          ? { ...query, offset: Number(value) < 2 ? 0 : Number(value) - 1 }
          : { ...query, [key]: Number(value) }
      }
      if (['ipoeId', 'resourceStatus'].includes(key) && typeof value === 'string') {
        return { ...query, [key]: [value] }
      }
      return { ...query, [key]: value }
    },
    { limit: 10, offset: 0 },
  ),
)
const changeRouteQuery = () => {
  ipoeQuery.value = routeQuery.value
  getIpoeTableList(routeQuery.value)
}

watch(() => route.query, changeRouteQuery, { immediate: true })
onBeforeMount(getAllSummaryIpoeList)
</script>

<template>
  <div>
    <NovaPageHeader>
      <NovaCustomButton @click="moveToCreate">{{ t('nova.ipoes.apply') }}</NovaCustomButton>
    </NovaPageHeader>

    <NovaSearchFilter @clear="handleQueryClear" @search="handleSearch">
      <NovaSearchInput
        :model-value="ipoeQuery.customerNote ?? ''"
        type="input"
        :label="t('nova.ipoes.accessCircuitName')"
        @update:model-value="updateQueryCustomerNote"
      />
      <NovaSearchInput
        :model-value="ipoeQuery.ipoeId ?? []"
        type="select"
        :options="ipoeListOptions"
        :label="t('nova.ipoes.accessCircuitId')"
        multiple
        @update:model-value="updateQueryIpoeId"
      />
      <NovaSearchInput
        :model-value="ipoeQuery.resourceStatus ?? []"
        type="checkbox"
        :options="resourceStatusOptions"
        :label="t('nova.details.resourceStatus')"
        @update:model-value="updateQueryResourceStatus"
      />
    </NovaSearchFilter>

    <NovaPaginationHeader
      :total="ipoeTableList.total"
      :limit="pagination.limit"
      :page="pagination.page"
      @update:limit="handleChangeLimit"
      @update:page="handleChangePage"
    />

    <NovaSortableDataTable
      :headers="headers"
      :items="items"
      :items-length="ipoeTableList.total"
      height="80vh"
      :sort-by="sortBy"
      @update:sort-by="handleSort"
    >
      <template #[`item.ipoeId`]="{ item }">
        <NuxtLink :to="{ name: RouteName.Ipoe.Detail, params: { tenantId, id: item.ipoeId } }">
          {{ item.ipoeId }}
        </NuxtLink>
        <div class="text-break text-wrap">{{ item.customerNote }}</div>
      </template>
      <template #[`item.resourceStatus`]="{ item }">
        <NovaResourceStatusTag :status="item.resourceStatus" />
      </template>
      <template #[`item.terminalId`]="{ item }">
        <template v-if="item.terminalId">
          <NuxtLink :to="{ name: RouteName.Terminal.Detail, params: { tenantId, id: item.terminalId } }">
            {{ item.terminalId }}
          </NuxtLink>
          <div v-if="item.terminalCustomerNote" class="text-truncate" :title="item.terminalCustomerNote">
            {{ item.terminalCustomerNote }}
          </div>
        </template>
        <template v-else>-</template>
      </template>
      <template #[`item.orderId`]="{ item }">
        <NuxtLink v-if="item.orderId" :to="{ name: RouteName.Order.Detail, params: { tenantId, id: item.orderId } }">
          {{ item.orderId }}
        </NuxtLink>
        <template v-else>-</template>
      </template>
      <template #[`item.action`]="{ item }">
        <NovaCustomButton append-icon="mdi-chevron-right" outlined size="small" @click="moveToDetail(item.ipoeId)">
          {{ t('nova.common.detail') }}
        </NovaCustomButton>
      </template>
    </NovaSortableDataTable>

    <NovaPaginationNavigation
      class="my-5"
      :page="pagination.page"
      :limit="pagination.limit"
      :total="ipoeTableList.total"
      @update:page="handleChangePage"
    />
  </div>
</template>
