<script setup lang="ts">
import { difference, intersection, isEqual, pick } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { SortDirectionTypes } from '@/api/constants'
import type { SortDirectionType } from '@/api/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import {
  ThreatDetectionSharedRequestDirectionTypes,
  ThreatDetectionSharedRequestStatusTypes,
  ThreatDetectionSharedRequestTypes,
  ThreatDetectionSharedTerminalDirectionTypes,
} from '@/api/threatDetectionShared/constants'
import type {
  ThreatDetectionSharedRequestDirectionType,
  ThreatDetectionSharedRequestListQuery,
} from '@/api/threatDetectionShared/types'
import type { SortOption, TableHeaderType } from '@/components/table/types'

const MAX_LIMIT = 100
const INPUT_QUERY_KEYS = ['requestId', 'sharedTenantId', 'status'] as const
const DEFAULT_SORT_OPTION = {
  sortKey: 'creationTime',
  direction: SortDirectionTypes.Desc,
} as const

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { loading } = useLoading()

const { requestStatusOptions, getRequestStatusText, getBillingMethodText } = useThreatDetectionShared()
const { threatDetectionSharedRequestList, getAllThreatDetectionSharedRequestList } =
  useGetAllThreatDetectionSharedRequestList()
const { threatDetectionSharedRequestTableList, getThreatDetectionSharedRequestTableList } =
  useGetThreatDetectionSharedRequestTableList()
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)

const tenantId = computed(() => route.params.tenantId as string)
const selectedRequestIdList = ref<string[]>([])
const query = ref<Pick<ThreatDetectionSharedRequestListQuery, (typeof INPUT_QUERY_KEYS)[number]>>({})

const buttonList = [
  { key: 'createAuthKey', page: 'create-auth-key' },
  { key: 'receivedList', page: 'received-list' },
  { key: 'startSharing', page: 'start-sharing' },
  { key: 'providedList', page: 'provided-list' },
] as const

const moveToMenuPage = async (page: string) => {
  if (buttonList.some(b => b.page === page)) {
    if (page === 'provided-list') {
      await navigateTo({
        path: `${route.path}/terminals`,
        query: { terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Provided },
      })
    } else if (page === 'received-list') {
      await navigateTo({
        path: `${route.path}/terminals`,
        query: { terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Received },
      })
    } else {
      await navigateTo(`${route.path}/${page}`)
    }
  } else {
    await navigateTo({ path: `${route.path}/request`, query: { type: page, requestId: selectedRequestIdList.value } })
  }
}

const requestIdOptions = computed(() =>
  threatDetectionSharedRequestList.value
    .filter(({ requestDirection }) => requestDirection === tabName.value)
    .map(({ requestId }) => ({
      value: requestId,
      text: requestId,
    })),
)
const tenantIdOptions = computed(() => {
  const tenantIdMap = threatDetectionSharedRequestList.value
    .filter(({ requestDirection }) => requestDirection === tabName.value)
    .map<[string, string]>(request => [request.sharedTenantId, `${request.contractorName} / ${request.sharedTenantId}`])

  // 重複が起きるので削除する
  return Array.from(new Map(tenantIdMap)).map(([value, text]) => ({ value, text }))
})

const tabName = computed(() =>
  route.query.requestDirection === ThreatDetectionSharedRequestDirectionTypes.Sent
    ? ThreatDetectionSharedRequestDirectionTypes.Sent
    : ThreatDetectionSharedRequestDirectionTypes.Received,
)
const isReceivedTab = computed(() => tabName.value === ThreatDetectionSharedRequestDirectionTypes.Received)
const Tabs = computed(() => [
  {
    text: t('threatDetectionShared.inbox'),
    name: ThreatDetectionSharedRequestDirectionTypes.Received,
    bg: isReceivedTab.value ? ('secondary' as const) : ('info' as const),
  },
  {
    text: t('threatDetectionShared.outbox'),
    name: ThreatDetectionSharedRequestDirectionTypes.Sent,
    bg: !isReceivedTab.value ? ('secondary' as const) : ('info' as const),
  },
])

const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const sortOption = computed<Partial<SortOption>>(() => ({
  sortKey: (route.query.sortKey as string | undefined) ?? DEFAULT_SORT_OPTION.sortKey,
  direction: (route.query.direction as SortDirectionType | undefined) ?? DEFAULT_SORT_OPTION.direction,
}))
const routeQuery = computed<ThreatDetectionSharedRequestListQuery>(() =>
  ['limit', 'page', 'sortKey', 'direction', 'requestId', 'sharedTenantId', 'status'].reduce((q, key) => {
    const value = route.query[key]
    const firstValue = Array.isArray(value) ? value[0] : value
    if (['requestId', 'sharedTenantId'].includes(key)) {
      const values = typeof value === 'string' ? [value] : Array.isArray(value) ? value : undefined
      return values?.length ? Object.assign(q, { [key]: values }) : q
    }
    if (key === 'page') {
      const pageNumber = isNaN(Number(firstValue)) ? 1 : Number(firstValue)
      return Object.assign(q, { offset: pageNumber < 2 ? 0 : pageNumber - 1 })
    }
    if (key === 'limit') {
      const limitNumber = isNaN(Number(firstValue)) ? 10 : Number(firstValue)
      return Object.assign(q, { limit: limitNumber })
    }
    if (key === 'status' && typeof firstValue === 'string') {
      const status = Object.values(ThreatDetectionSharedRequestStatusTypes).find(v => v === firstValue)
      return status ? Object.assign(q, { status }) : q
    }
    if (key === 'sortKey') {
      return Object.assign(q, { sortKey: firstValue ?? DEFAULT_SORT_OPTION.sortKey })
    }
    if (key === 'direction') {
      return Object.assign(q, { direction: firstValue ?? DEFAULT_SORT_OPTION.direction })
    }
    if (typeof firstValue === 'string') {
      return Object.assign(q, { [key]: firstValue })
    }
    return Object.assign(q, { [key]: undefined })
  }, {}),
)

const contractorNameLabel = computed(() =>
  isReceivedTab.value
    ? t('threatDetectionShared.receivedContractorName')
    : t('threatDetectionShared.sentContractorName'),
)
const tableHeaders = computed(() => {
  const list: TableHeaderType[] = isReceivedTab.value ? [{ text: '', key: 'action', width: 70 }] : []

  list.push(
    { text: t('threatDetectionShared.request'), key: 'requestId', width: 200 },
    { text: t('threatDetectionShared.requestType.label'), key: 'requestType', width: 150 },
    { text: contractorNameLabel.value, key: 'contractorName', width: 250, class: 'text-sm' },
    { text: t('details.tenantId'), key: 'sharedTenantId', width: 320 },
    { text: t('threatDetectionShared.creationTime'), key: 'creationTime', width: 200, class: 'text-sm' },
    { text: t('threatDetectionShared.updateTime.tableLabel'), key: 'updateTime', width: 200, class: 'text-sm' },
    { text: t('threatDetectionShared.billingMethod.label'), key: 'billingMethod', width: 150 },
    { text: t('threatDetectionShared.status.label'), key: 'status', width: 150 },
  )
  return list
})
const tableItems = computed(() =>
  threatDetectionSharedRequestTableList.value.threatDetectionsSharedRequests.map(request => {
    const selected = selectedRequestIdList.value.includes(request.requestId)
    return {
      ...request,
      action: {
        value: selected,
        disabled:
          request.status !== ThreatDetectionSharedRequestStatusTypes.PendingApproval ||
          request.requestType !== ThreatDetectionSharedRequestTypes.Start ||
          (!selected && checkboxDisabled.value),
      },
      billingMethod: getBillingMethodText(request.billingMethod) || '-',
      requestTypeText: t(`threatDetectionShared.requestType.${request.requestType}`),
      creationTime: formatDateTime(request.creationTime),
      updateTime: formatDateTime(request.updateTime),
      statusText: getRequestStatusText(request),
    }
  }),
)

const addableCounts = computed(() => MAX_LIMIT - selectedRequestIdList.value.length)
const selectableTableRequestIdList = computed(() =>
  tableItems.value
    .map(item =>
      item.status === ThreatDetectionSharedRequestStatusTypes.PendingApproval &&
      item.requestType === ThreatDetectionSharedRequestTypes.Start
        ? item.requestId
        : '',
    )
    .filter(Boolean),
)
const areAllVisibleRowsSelected = computed(
  () =>
    // テーブルに表示してるリクエストが全て選択されているかどうか
    !!selectableTableRequestIdList.value.length &&
    selectableTableRequestIdList.value.every(requestId => selectedRequestIdList.value.includes(requestId)),
)
const indeterminate = computed(() => selectedRequestIdList.value.length > 0)
const checkboxDisabled = computed(() => selectedRequestIdList.value.length >= MAX_LIMIT)
const handleSelectAllClick = (checked: boolean) => {
  if (checked) {
    // テーブル表示上の選択可能なリクエストIDだけ取得する
    const newIds = difference(
      selectableTableRequestIdList.value,
      intersection(selectedRequestIdList.value, selectableTableRequestIdList.value),
    )
    // 選択可能な上限を超える場合は選択可能な数だけ追加する
    if (newIds.length > addableCounts.value) {
      selectedRequestIdList.value = [...selectedRequestIdList.value, ...newIds.slice(0, addableCounts.value)]
    } else {
      selectedRequestIdList.value = [...selectedRequestIdList.value, ...newIds]
    }
  } else {
    selectedRequestIdList.value = difference(selectedRequestIdList.value, selectableTableRequestIdList.value)
  }
}
const handleSelectorClick = (checked: boolean, requestId: string) => {
  if (checked) {
    selectedRequestIdList.value.push(requestId)
  } else {
    selectedRequestIdList.value = difference(selectedRequestIdList.value, [requestId])
  }
}

const handleTabNameChange = (requestDirection: ThreatDetectionSharedRequestDirectionType) => {
  // 入力済みの要素を初期化
  selectedRequestIdList.value = []
  // 現在のタブを表す requestDirection は残し、他の条件は初期化する
  router.push({ query: { requestDirection, page: 1, limit: pagination.value.limit } })
}
const handleQueryUpdate = (key: keyof typeof query.value, value: string | string[]) => {
  query.value = {
    ...query.value,
    [key]: value.length ? value : undefined,
  }
}
const handleClear = () => {
  query.value = { requestId: undefined, sharedTenantId: undefined, status: undefined }
}
const handleChangeLimit = (limit?: number) => {
  router.push({ query: { ...route.query, limit, page: 1 } })
}
const handleChangePage = (page: number) => {
  router.push({ query: { ...route.query, page } })
}
const handleSort = (option?: SortOption) => {
  router.push({
    query: {
      ...route.query,
      sortKey: option?.sortKey,
      direction: option?.direction,
    },
  })
}
const createTableListQuery = (
  baseQuery: ThreatDetectionSharedRequestListQuery,
): ThreatDetectionSharedRequestListQuery => ({
  ...baseQuery,
  // 「承認済み」検索時のみ「停止済み」を除外する
  ...(baseQuery.status === ThreatDetectionSharedRequestStatusTypes.Approved && {
    requestType: ThreatDetectionSharedRequestTypes.Start,
  }),
  requestDirection: tabName.value,
})
const handleSearch = () => {
  // テーブル情報が変わるので初期化
  selectedRequestIdList.value = []
  if (isEqual(query.value, pick(routeQuery.value, INPUT_QUERY_KEYS)) && pagination.value.page === 1) {
    getThreatDetectionSharedRequestTableList(createTableListQuery({ ...routeQuery.value, ...query.value }))
  } else {
    router.push({ query: { ...routeQuery.value, ...query.value, requestDirection: tabName.value, page: 1 } })
  }
}

const changeRouteQuery = () => {
  // セキュリティ利用規約に同意していない場合は、検索を行わない
  if (!securityTermsOfServiceAccepted.value) {
    return
  }
  query.value = pick(routeQuery.value, INPUT_QUERY_KEYS)
  getThreatDetectionSharedRequestTableList(createTableListQuery(routeQuery.value))
}
watch(
  () => route.query,
  () => changeRouteQuery(),
)

onBeforeMount(async () => {
  await getSecurityTermsOfServiceAccepted()
  if (securityTermsOfServiceAccepted.value) {
    getAllThreatDetectionSharedRequestList()
    changeRouteQuery()
  }
})
</script>

<template>
  <div>
    <div v-if="!securityTermsOfServiceAccepted">
      <CustomButton
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        class="ml-auto"
        data-cy="security-contracts-threat-detection-shared-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
      <div class="text-warning mb-4" data-cy="security-contracts-threat-detection-shared-terms-of-service-message">
        {{ t('threatDetectionShared.message.requiredSecurityAccepted') }}
      </div>
    </div>
    <div class="buttons">
      <CustomButton
        v-for="{ key, page } in buttonList"
        :key="key"
        :text="t(`threatDetectionShared.${key}`)"
        icon="right-arrow"
        :width="270"
        :disabled="!securityTermsOfServiceAccepted"
        :data-cy="`security-contracts-threat-detection-shared-${page}-button`"
        @click="moveToMenuPage(page)"
      />
    </div>
    <CustomTab :tabs="Tabs" :current-tab-name="tabName" @click="handleTabNameChange">
      <div class="bg-white pa-8 b-rd-b-2">
        <div flex-space-between-flex-end flex-wrap>
          <SearchFilter
            :disabled="loading || !securityTermsOfServiceAccepted"
            @search="handleSearch"
            @clear="handleClear"
          >
            <InputGrid :label="t('threatDetectionShared.requestId')">
              <MultipleSelectForm
                :model-value="query?.requestId ?? []"
                :options="requestIdOptions"
                placeholder="リクエストID"
                @update:model-value="value => handleQueryUpdate('requestId', value)"
              />
            </InputGrid>
            <InputGrid :label="`${contractorNameLabel}/${t('details.tenantId')}`">
              <MultipleSelectForm
                :model-value="query?.sharedTenantId ?? []"
                :options="tenantIdOptions"
                placeholder="A会社 / Z000000001, B会社,..."
                @update:model-value="value => handleQueryUpdate('sharedTenantId', value)"
              />
            </InputGrid>
            <InputGrid :label="t('threatDetectionShared.status.label')">
              <SelectForm
                :model-value="query?.status ?? ''"
                :options="requestStatusOptions"
                :placeholder="requestStatusOptions[0]?.text"
                size="middle"
                data-cy="security-contracts-threat-detection-shared-status-select"
                @update:model-value="value => handleQueryUpdate('status', value)"
              />
            </InputGrid>
          </SearchFilter>
        </div>

        <PaginationHeader
          :page="pagination.page"
          :limit="pagination.limit"
          :total="threatDetectionSharedRequestTableList?.total ?? 0"
          :selected="isReceivedTab ? { max: MAX_LIMIT, counts: selectedRequestIdList.length } : undefined"
          @update:limit="handleChangeLimit"
        />
        <SortableTable
          :items="tableItems"
          :headers="tableHeaders"
          :sort="sortOption"
          :unsortable-keys="['requestId', 'contractorName', 'sharedTenantId', 'billingMethod']"
          data-cy="security-contracts-threat-detection-shared-table"
          @sort="handleSort"
        >
          <template #header-action>
            <div w-full flex justify-center>
              <CheckboxBase
                :value="areAllVisibleRowsSelected"
                :indeterminate="indeterminate"
                :disabled="
                  selectableTableRequestIdList.length === 0 || (checkboxDisabled && !areAllVisibleRowsSelected)
                "
                data-cy="security-contracts-threat-detection-shared-action-all-checkbox"
                @update:value="handleSelectAllClick"
              />
            </div>
          </template>
          <template #action="{ row }">
            <div w-full flex justify-center>
              <CheckboxBase
                :value="row.action.value"
                :disabled="row.action.disabled"
                :data-cy="`security-contracts-threat-detection-shared-action-${row.requestId}-checkbox`"
                @update:value="(checked: boolean) => handleSelectorClick(checked, row.requestId)"
              />
            </div>
          </template>
          <template #requestType="{ row }">
            <span>{{ row.requestTypeText }}</span>
          </template>
          <template #status="{ row }">
            <span>{{ row.statusText }}</span>
          </template>
          <template #requestId="{ row }">
            <NuxtLink :to="`${route.path}/${row.requestId}`">
              {{ t('threatDetectionShared.requestDetail') }}
            </NuxtLink>
          </template>
        </SortableTable>
        <PaginationFooter
          :page="pagination.page"
          :limit="pagination.limit"
          :total="threatDetectionSharedRequestTableList?.total"
          @update:page="handleChangePage"
        />

        <div class="text-right my-4">{{ t('threatDetectionShared.message.billingMethodNotFound') }}</div>
        <div v-if="isReceivedTab" class="flex-flex-end-center ga-6">
          <CustomButton
            :text="t('threatDetectionShared.reject')"
            color="warning"
            icon="right-arrow"
            :width="180"
            :disabled="selectedRequestIdList.length === 0"
            data-cy="security-contracts-threat-detection-shared-reject-button"
            @click="moveToMenuPage('reject')"
          />
          <CustomButton
            :text="t('threatDetectionShared.approve')"
            color="primary"
            icon="right-arrow"
            :width="180"
            :disabled="selectedRequestIdList.length === 0"
            data-cy="security-contracts-threat-detection-shared-approve-button"
            @click="moveToMenuPage('approve')"
          />
        </div>
      </div>
    </CustomTab>
  </div>
</template>

<style lang="scss" scoped>
.buttons {
  display: grid;
  grid-template-columns: repeat(2, 280px);
  justify-content: end;
  gap: 8px;
}
.b-rd-b-2 {
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}
</style>
