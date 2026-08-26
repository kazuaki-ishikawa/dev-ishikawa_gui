<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusOptions, ResourceStatusTypes } from '@/api/constants'
import type { GuaranteeListQuery } from '@/api/guarantees/types'
import type { SortOption } from '@/components/table/types'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages, GuaranteePages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { guaranteeQuery, guaranteeTableList, getGuaranteeTableList } = useGetGuaranteeTableList()
const { getAllResourceSummaryGuaranteeList, resourceSummaryGuaranteeListOptions } =
  useGetAllResourceSummaryGuaranteeList()
const { disabledGuaranteeApplication } = useApplicationRestriction()

const headers = [
  { text: t('guarantees.guaranteeId'), key: 'guaranteeId', width: 166 },
  { text: t('guarantees.customerNote'), key: 'customerNote' },
  { text: t('guarantees.terminalId'), key: 'terminalId', width: 136 },
  { text: t('guarantees.physicalBandwidth'), key: 'physicalBandwidth', width: 120 },
  { text: t('details.resourceStatus'), key: 'resourceStatus', width: 200 },
  { text: t('details.orderId'), key: 'orderId', width: 180 },
  { text: t('details.updateTime'), key: 'updateTime', width: 175 },
]
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const sortOption = computed<Partial<SortOption>>(() => ({
  sortKey: guaranteeQuery.value?.sortKey,
  direction: guaranteeQuery.value?.direction,
}))
const items = computed(() =>
  guaranteeTableList.value.guarantees.map(guarantee => ({
    guaranteeId: guarantee.guaranteeId,
    customerNote: guarantee.customerNote,
    terminalId: guarantee?.terminalId || '',
    terminalPath: guarantee?.terminalId
      ? convertTerminalDetailPath(resourceSummaryTerminalList.value, guarantee.terminalId)
      : undefined,
    physicalBandwidth: guarantee?.physicalBandwidth || '',
    resourceStatus: guarantee.resourceStatus,
    orderId: guarantee.orderId || '',
    updateTime: guarantee.updateTime,
  })),
)

const moveToCreate = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.Guarantees}/${GuaranteePages.Circuits}/create` })
}
const routerPushQuery = (query: GuaranteeListQuery) => {
  router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1 } })
}

const handleChangeLimit = (limit?: number) => {
  routerPushQuery({ ...guaranteeQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  routerPushQuery({ ...guaranteeQuery.value, offset: page - 1 })
}
const handleSort = (option?: SortOption) => {
  routerPushQuery({
    ...guaranteeQuery.value,
    sortKey: option?.sortKey,
    direction: option?.direction,
  })
}
const handleSearch = () => {
  const newQuery = { ...guaranteeQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, newQuery)) {
    // パスクエリの変更がない場合は直接 getGuaranteeTableList を実行する
    getGuaranteeTableList(newQuery)
  } else {
    routerPushQuery(newQuery)
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

const updateQueryResourceStatus = (status: string[]) => {
  const resourceStatus = Object.values(ResourceStatusTypes).filter(value => status.includes(value))
  guaranteeQuery.value = {
    ...guaranteeQuery.value,
    resourceStatus: resourceStatus.length > 0 ? resourceStatus : undefined,
  }
}
const updateQueryGuaranteeId = (guaranteeIds: string[]) => {
  guaranteeQuery.value = { ...guaranteeQuery.value, guaranteeId: guaranteeIds.length > 0 ? guaranteeIds : undefined }
}
const routeQuery = computed(() =>
  ['limit', 'page', 'guaranteeId', 'customerNote', 'resourceStatus', 'sortKey', 'direction'].reduce((q, key) => {
    const value = route.query[key]
    if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
      if (key === 'page') {
        return Object.assign(q, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
      }
      return Object.assign(q, { [key]: Number(value) })
    } else if (['guaranteeId', 'resourceStatus'].includes(key) && typeof value === 'string') {
      return Object.assign(q, { [key]: [value] })
    } else {
      return Object.assign(q, { [key]: value })
    }
  }, {}),
)

watch(
  () => route.query,
  () => {
    getGuaranteeTableList(routeQuery.value)
  },
  { immediate: true },
)
onBeforeMount(() => {
  getAllResourceSummaryGuaranteeList()
  getAllResourceSummaryTerminalList()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center pb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Guarantee" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ `${t('sideBar.guarantee')} ${t('common.list')}` }}</div>
    </div>

    <div class="flex-space-between-flex-end flex-wrap">
      <SearchFilter @search="handleSearch" @clear="handleQueryClear">
        <InputGrid :label="t('guarantees.customerNote')" :label-width="210">
          <InputForm
            :model-value="guaranteeQuery?.customerNote ?? ''"
            :placeholder="t('guarantees.customerNote')"
            @update:model-value="(value: string) => (guaranteeQuery.customerNote = value || undefined)"
          />
        </InputGrid>
        <InputGrid :label="t('guarantees.guaranteeId')" :label-width="210">
          <MultipleSelectForm
            :model-value="guaranteeQuery?.guaranteeId ?? []"
            :options="resourceSummaryGuaranteeListOptions"
            placeholder="Z000000001 / ギャランティアクセス名1, Z000000002 / ギャランティアクセス名2,..."
            @update:model-value="updateQueryGuaranteeId"
          />
        </InputGrid>
        <InputGrid :label="t('details.resourceStatus')" :label-width="210">
          <MultipleSelectForm
            :model-value="guaranteeQuery?.resourceStatus ?? []"
            :options="ResourceStatusOptions"
            placeholder="inactive..."
            @update:model-value="updateQueryResourceStatus"
          />
        </InputGrid>
      </SearchFilter>
      <CustomButton
        class="mb-4"
        icon="right-arrow"
        :text="t('common.createNew')"
        :width="180"
        :disabled="disabledGuaranteeApplication"
        data-cy="guarantees-circuits-index-create-new-button"
        @click="moveToCreate"
      />
    </div>
    <PaginationHeader
      :page="pagination.page"
      :limit="pagination.limit"
      :total="guaranteeTableList.total"
      @update:limit="handleChangeLimit"
    />
    <SortableTable :headers="headers" :items="items" :sort="sortOption" :key-items="['guaranteeId']" @sort="handleSort">
      <template #guaranteeId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/guarantees/circuits/${data}`">{{ data }}</NuxtLink>
      </template>
      <template #customerNote="{ data }">
        <div class="text-truncate" :title="data">{{ data }}</div>
      </template>
      <template #terminalId="{ row }">
        <NuxtLink v-if="row.terminalPath" :to="row.terminalPath">{{ row.terminalId }}</NuxtLink>
        <div v-else>{{ row.terminalId }}</div>
      </template>
      <template #orderId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/orders/${data}`" class="text-truncate">{{ data }}</NuxtLink>
      </template>
      <template #updateTime="{ data }">
        {{ formatDateTime(data) }}
      </template>
    </SortableTable>
    <PaginationFooter
      :page="pagination.page"
      :limit="pagination.limit"
      :total="guaranteeTableList.total"
      @update:page="handleChangePage"
    />
  </CardContainer>
</template>
