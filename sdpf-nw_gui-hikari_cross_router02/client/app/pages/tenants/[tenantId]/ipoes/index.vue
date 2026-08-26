<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusOptions, ResourceStatusTypes } from '@/api/constants'
import { IpoeContractTypes } from '@/api/ipoes/constants'
import type { IpoeListQuery } from '@/api/ipoes/types'
import { IconTypes } from '@/components/icons/constants'
import type { SortOption } from '@/components/table/types'
import { TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const { ipoeTypeOptions, existOptions } = useIpoes()
const { ipoeListOptions, getAllSummaryIpoeList } = useGetAllSummaryIpoeList()
const { ipoeTableList, ipoeQuery, getIpoeTableList } = useGetIpoeTableList()
const { disabledIpoeApplication } = useApplicationRestriction()

const headers = [
  { text: t('ipoes.ipoeId'), key: 'ipoeId', width: 166 },
  { text: t('ipoes.customerNote'), key: 'customerNote', width: 156 },
  { text: t('ipoes.ipv4Address'), key: 'ipv4Address', width: 158 },
  { text: t('ipoes.requestType'), key: 'ref', width: 190 },
  { text: t('ipoes.fletsId'), key: 'fletsId', width: 230, class: 'text-sm' },
  { text: t('ipoes.terminalId'), key: 'terminalId', width: 136 },
  { text: t('ipoes.ipoeType'), key: 'ipoeType', width: 190 },
  { text: t('ipoes.appControl'), key: 'appControl', width: 265, class: 'text-sm' },
  { text: t('details.resourceStatus'), key: 'resourceStatus', width: 180, class: 'text-sm' },
  { text: t('details.orderId'), key: 'orderId', width: 160 },
  { text: t('details.updateTime'), key: 'updateTime', width: 175 },
]
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const sortOption = computed<Partial<SortOption>>(() => ({
  sortKey: ipoeQuery.value?.sortKey,
  direction: ipoeQuery.value?.direction,
}))
const items = computed(() =>
  ipoeTableList.value.ipoes.map(ipoe => ({
    ipoeId: ipoe.ipoeId,
    customerNote: ipoe.customerNote,
    ipv4Address: ipoe.ipv4Address ?? '',
    ref: ipoe.ref.includes(IpoeContractTypes.SeparateContract)
      ? t('ipoes.flets')
      : ipoe.ref.includes(IpoeContractTypes.HikariCollabo)
        ? t('ipoes.hikariCollabo')
        : '',
    fletsId: ipoe.fletsId ?? '',
    terminalId: ipoe.terminalId ?? '',
    ipoeType: ipoeTypeOptions.find(({ value }) => value === ipoe.ipoeType)?.text ?? '',
    appControl: existOptions.find(({ value }) => value === `${ipoe.appControl}`)?.text ?? '',
    resourceStatus: ipoe.resourceStatus,
    orderId: ipoe.orderId ?? '',
    updateTime: ipoe.updateTime ?? '',
  })),
)

const moveToCreate = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.Ipoes}/create` })
}

const routerPushQuery = (query: IpoeListQuery) => {
  router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1 } })
}

const handleChangeLimit = (limit?: number) => {
  routerPushQuery({ ...ipoeQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  routerPushQuery({ ...ipoeQuery.value, offset: page - 1 })
}
const handleSort = (option?: SortOption) => {
  routerPushQuery({ ...ipoeQuery.value, sortKey: option?.sortKey, direction: option?.direction })
}
const handleSearch = () => {
  const newQuery = { ...ipoeQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, newQuery)) {
    // パスクエリの変更がない場合は直接 getIpoeTableList を実行する
    getIpoeTableList(newQuery)
  } else {
    routerPushQuery(newQuery)
  }
}
const handleQueryClear = () => {
  ipoeQuery.value = { ...ipoeQuery.value, customerNote: undefined, ipoeId: undefined, resourceStatus: undefined }
}

const updateQueryIpoeId = (ipoeIds: string[]) => {
  ipoeQuery.value = { ...ipoeQuery.value, ipoeId: ipoeIds.length > 0 ? ipoeIds : undefined }
}
const updateQueryResourceStatus = (status: string[]) => {
  ipoeQuery.value = {
    ...ipoeQuery.value,
    resourceStatus: Object.values(ResourceStatusTypes).filter(v => status.includes(v)),
  }
}

const routeQuery = computed(() =>
  ['limit', 'page', 'customerNote', 'ipoeId', 'resourceStatus', 'sortKey', 'direction'].reduce((q, key) => {
    const value = route.query[key]
    if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
      if (key === 'page') {
        return Object.assign(q, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
      }
      return Object.assign(q, { [key]: Number(value) })
    } else if (['ipoeId', 'resourceStatus'].includes(key) && typeof value === 'string') {
      return Object.assign(q, { [key]: [value] })
    } else {
      return Object.assign(q, { [key]: value })
    }
  }, {}),
)

watch(
  () => route.query,
  () => {
    getIpoeTableList(routeQuery.value)
  },
  { immediate: true },
)
onBeforeMount(() => {
  getAllSummaryIpoeList()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center pb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Ipoe" color="secondary" />
      <div class="ml-2 text-lg">{{ t('sideBar.ipoes') }} {{ t('common.list') }}</div>
    </div>

    <div class="flex-space-between-flex-end flex-wrap">
      <SearchFilter @search="handleSearch" @clear="handleQueryClear">
        <InputGrid :label="t('ipoes.customerNote')" :label-width="242">
          <InputForm
            :model-value="ipoeQuery?.customerNote ?? ''"
            :placeholder="t('ipoes.customerNote')"
            @update:model-value="(value: string) => (ipoeQuery.customerNote = value || undefined)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.ipoeId')" :label-width="242">
          <MultipleSelectForm
            :model-value="ipoeQuery?.ipoeId ?? []"
            :options="ipoeListOptions"
            placeholder="Z000000001 / IPoE回線名1, Z000000002 / IPoE回線名2,..."
            @update:model-value="updateQueryIpoeId"
          />
        </InputGrid>
        <InputGrid :label="t('details.resourceStatus')" :label-width="242">
          <MultipleSelectForm
            :model-value="ipoeQuery?.resourceStatus ?? []"
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
        :disabled="disabledIpoeApplication"
        data-cy="ipoes-index-create-button"
        @click="moveToCreate()"
      />
    </div>

    <PaginationHeader
      :page="pagination.page"
      :limit="pagination.limit"
      :total="ipoeTableList.total"
      @update:limit="handleChangeLimit"
    />
    <SortableTable
      :headers="headers"
      :items="items"
      :sort="sortOption"
      :key-items="['ipoeId']"
      :unsortable-keys="['ref']"
      @sort="handleSort"
    >
      <template #ipoeId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/ipoes/${data}`">{{ data }}</NuxtLink>
      </template>
      <template #customerNote="{ data }">
        <div class="text-truncate" :title="data">{{ data }}</div>
      </template>
      <template #terminalId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/terminals/${data}`">{{ data }}</NuxtLink>
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
      :total="ipoeTableList.total"
      @update:page="handleChangePage"
    />
  </CardContainer>
</template>
