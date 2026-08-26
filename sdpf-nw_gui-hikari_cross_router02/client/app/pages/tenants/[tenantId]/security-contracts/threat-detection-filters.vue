<script setup lang="ts">
import { isEqual, omit } from 'es-toolkit'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { OperationStatusTypes } from '@/api/threatDetectionFilters/constants'
import type { ThreatDetectionFiltersQuery, ThreatDetectionFiltersResponse } from '@/api/threatDetectionFilters/types'
import type { PeriodType } from '@/components/search/types'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import { TenantPages } from '@/components/sidebar/constants'
import type { SortOption } from '@/components/table/types'

const unsortableKeys = [
  'action',
  'customerNote',
  'endTime',
  'blockingStatus',
  'operationStatus',
  'threatDestination',
  'filters',
  'latestFilterHitCount',
  'latestGetCounterTime',
  'previousFilterHitCount',
  'previousGetCounterTime',
]

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { navigationGuard } = useNavigationGuard()
const { loading } = useLoading()
const { getThreatDetectionFiltersTableList, threatDetectionFiltersTableList, threatDetectionFiltersQuery } =
  useGetThreatDetectionFiltersTableList()
const { operationStatusOptions, blockingStatusOptions } = useThreatDetectionFilters()
const { postTerminalBulkGetFilterCounts } = usePostTerminalBulkGetFilterCounts()
const { deleteThreatDetectionFilters } = useDeleteThreatDetectionFilters()

const { terminalIdOptions, resourceSummaryTerminalList, getAllResourceSummaryTerminalList } =
  useGetAllResourceSummaryTerminalList()
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)

const selectablePeriodTypes = Object.values(PeriodTypes).filter(value => value !== PeriodTypes.Last2Weeks)
const validSearchPeriodDateTime = ref(true)
const dialogType = ref<'unblock' | 'getFilterCounts' | null>(null)
const dialogOpen = computed(() => !!dialogType.value)

const periodType = ref<PeriodType>(PeriodTypes.Last1Day)
const selectableBeforeDays = computed(() => {
  // 最大12か月前まで選択可能なはず
  const before12Date = dayjs().subtract(12, 'months').format('YYYY-MM-DD')
  return Math.abs(dayjs().diff(before12Date, 'days'))
})
const startDateTime = computed({
  get: () => threatDetectionFiltersQuery.value.startTime ?? '',
  set: startDateTime => {
    threatDetectionFiltersQuery.value.startTime = startDateTime || undefined
  },
})
const endDateTime = computed({
  get: () => threatDetectionFiltersQuery.value.endTime ?? '',
  set: endDateTime => {
    threatDetectionFiltersQuery.value.endTime = endDateTime || undefined
  },
})

const searchDisabled = computed(
  () =>
    !threatDetectionFiltersQuery.value.startTime ||
    !threatDetectionFiltersQuery.value.endTime ||
    !securityTermsOfServiceAccepted.value ||
    !validSearchPeriodDateTime.value,
)

const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const headers = [
  { text: '', key: 'selector', width: 100, sortable: false },
  { text: t('threatDetectionFilters.terminalId'), key: 'terminalId', width: 166 },
  { text: t('threatDetectionFilters.customerNote'), key: 'customerNote', width: 200 },
  { text: t('threatDetectionFilters.creationTime'), key: 'creationTime', width: 175 },
  { text: t('threatDetectionFilters.endTime'), key: 'endTime', width: 175 },
  { text: t('threatDetectionFilters.blockingStatus'), key: 'blockingStatus', width: 170 },
  { text: t('threatDetectionFilters.operationStatus'), key: 'operationStatus', width: 170 },
  { text: t('threatDetectionFilters.threatDestination'), key: 'threatDestination' },
  { text: t('threatDetectionFilters.filters'), key: 'filters', width: 210 },
  { text: t('threatDetectionFilters.latestFilterHitCount'), key: 'latestFilterHitCount', width: 170 },
  { text: t('threatDetectionFilters.latestGetCounterTime'), key: 'latestGetCounterTime', width: 175 },
  { text: t('threatDetectionFilters.previousFilterHitCount'), key: 'previousFilterHitCount', width: 170 },
  { text: t('threatDetectionFilters.previousGetCounterTime'), key: 'previousGetCounterTime', width: 175 },
]

const items = computed(() => {
  const filters = threatDetectionFiltersTableList.value?.filters ?? []
  return filters.map(filter => {
    const terminal = resourceSummaryTerminalList.value.terminals.find(t => t.terminalId === filter.terminalId)
    const customerNote = terminal?.customerNote || ''
    const numOfFilters =
      typeof terminal?.threatFilterEntry === 'number' && typeof terminal?.threatFilterMaxEntry === 'number'
        ? `${terminal.threatFilterEntry} / ${terminal.threatFilterMaxEntry}`
        : '-'
    const latestFilterHitCount =
      !isNaN(Number(filter.latestFilterHitCount)) && !isNaN(Number(filter.previousFilterHitCount))
        ? Number(filter.latestFilterHitCount) - Number(filter.previousFilterHitCount)
        : '-'
    return {
      filterId: filter.filterId,
      selectable: [OperationStatusTypes.BlockCompleted, OperationStatusTypes.UnblockFailed].includes(
        filter.operationStatus,
      ),
      terminalId: filter.terminalId,
      terminalPath:
        terminal?.terminalType === TerminalTypes.Rental
          ? TenantPages.Terminals
          : terminal?.terminalType === TerminalTypes.Self
            ? TenantPages.SelfTerminals
            : '',
      customerNote: customerNote,
      creationTime: formatDateTime(filter.creationTime) || '-',
      endTime: formatDateTime(filter.endTime) || '-',
      blockingStatus:
        filter.blockingStatus === true
          ? t('threatDetectionFilters.blocking')
          : filter.blockingStatus === false
            ? t('threatDetectionFilters.unblock')
            : '-',
      operationStatus: t(`threatDetectionFilters.${filter.operationStatus}`),
      threatDestination: filter.threatDestination,
      filters: numOfFilters,
      latestFilterHitCount,
      latestGetCounterTime: formatDateTime(filter.latestGetCounterTime, true) || '-',
      previousFilterHitCount: filter.previousFilterHitCount ?? '-',
      previousGetCounterTime: formatDateTime(filter.previousGetCounterTime, true) || '-',
    }
  })
})

const selectedFilters = ref<string[]>([])
watch(selectedFilters, () => {
  navigationGuard(0 < selectedFilters.value.length)
})
// テーブル上の選択可能な端末IDを取得する
const selectableFilterIds = computed(() => items.value.filter(item => item.selectable).map(item => item.filterId))
const areAllVisibleRowsSelected = computed(
  () =>
    selectableFilterIds.value.length > 0 &&
    selectableFilterIds.value.every(filterId => selectedFilters.value.includes(filterId)),
)
const indeterminate = computed(() => selectedFilters.value.length > 0)

// selectedFilters を terminalId ごとにグループ化
const groupSelectedFiltersByTerminalId = () => {
  const filters = selectedFilters.value.reduce(
    (acc, filterId) => {
      const targetFilter = threatDetectionFiltersTableList.value?.filters.find(filter => filter.filterId === filterId)
      if (!targetFilter) {
        return acc
      }
      const found = acc.find(f => f.terminalId === targetFilter.terminalId)
      if (found) {
        // 同じfilterが存在する場合はスキップ（filterId以外のフィルター条件を比較）
        const isDuplicate = found.filters.some(
          filter =>
            filter.threatDestination === targetFilter.threatDestination &&
            filter.sourceIp === targetFilter.sourceIp &&
            filter.destinationPort === targetFilter.destinationPort &&
            filter.sourcePort === targetFilter.sourcePort &&
            filter.protocol === targetFilter.protocol,
        )
        if (isDuplicate) {
          return acc
        }
        found.filters.push(targetFilter)
      } else {
        acc.push({ terminalId: targetFilter.terminalId ?? '', filters: [targetFilter] })
      }
      return acc
    },
    [] as Array<{ terminalId: string; filters: ThreatDetectionFiltersResponse[] }>,
  )
  const filterIds = filters.map(filter => {
    return {
      terminalId: filter.terminalId,
      filterIds: filter.filters.map(f => f.filterId),
    }
  })
  return filterIds
}

const handleFilterCountUpdate = async () => {
  try {
    const terminals = groupSelectedFiltersByTerminalId()
    await postTerminalBulkGetFilterCounts({ terminals })
    selectedFilters.value = []
    getThreatDetectionFiltersTableList(threatDetectionFiltersQuery.value)
  } finally {
    dialogType.value = null
  }
}
const handleUnblock = async () => {
  try {
    const terminals = groupSelectedFiltersByTerminalId()
    await deleteThreatDetectionFilters(terminals)
    selectedFilters.value = []
    getThreatDetectionFiltersTableList(threatDetectionFiltersQuery.value)
  } finally {
    dialogType.value = null
  }
}

const confirmDialogData = computed(() => ({
  label:
    dialogType.value === 'unblock'
      ? t('threatDetectionFilters.executeUnblocking')
      : t('threatDetectionFilters.getFilterCountExecute'),
  text:
    dialogType.value === 'unblock'
      ? t('threatDetectionFilters.message.confirmUnblocking')
      : t('threatDetectionFilters.message.confirmGettingFilterCounts'),
  submit: dialogType.value === 'unblock' ? handleUnblock : handleFilterCountUpdate,
  cancel: () => (dialogType.value = null),
}))

const handleSearch = () => {
  routerPushQuery({ ...threatDetectionFiltersQuery.value, offset: 0 })
}
const handleClear = () => {
  threatDetectionFiltersQuery.value = {
    limit: threatDetectionFiltersQuery.value.limit,
    offset: 0,
    sortKey: threatDetectionFiltersQuery.value.sortKey,
    direction: threatDetectionFiltersQuery.value.direction,
    startTime: dayjs().subtract(PeriodMinutesGapMap[PeriodTypes.Last1Day], 'minutes').startOf('minutes').format(),
    endTime: dayjs().format(),
  }
  periodType.value = PeriodTypes.Last1Day
}

const handleOperationStatusChange = (value: string) => {
  threatDetectionFiltersQuery.value = {
    ...threatDetectionFiltersQuery.value,
    operationStatus: Object.values(OperationStatusTypes).find(v => v === value),
  }
}

const routerPushQuery = (query: ThreatDetectionFiltersQuery) => {
  // チェックボックスをクリアするためにselectedFiltersを初期化
  selectedFilters.value = []
  if (isEqual(routeQuery.value, omit(query, ['startTime', 'endTime'])) && route.query.periodType === periodType.value) {
    // パスクエリの変更がない場合は直接 getThreatDetectionFiltersTableList を実行する
    getThreatDetectionFiltersTableList(threatDetectionFiltersQuery.value)
  } else {
    router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1, periodType: periodType.value } })
  }
}
const handleSort = (option?: SortOption) => {
  routerPushQuery({
    ...threatDetectionFiltersQuery.value,
    sortKey: option?.sortKey,
    direction: option?.direction,
  })
}
const handleLimitChange = (limit?: number) => {
  routerPushQuery({ ...threatDetectionFiltersQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  // ページネーションでページ移動したらチェック(selectedFiltersやリクエスト)はクリアされる
  routerPushQuery({ ...threatDetectionFiltersQuery.value, offset: page - 1 })
}
const handleSelectorClick = (checked: boolean, id: string) => {
  if (checked) {
    // リクエストの形に合わせて、terminalIdごとのfilterIdを更新する。
    selectedFilters.value = [...selectedFilters.value, id]
  } else {
    selectedFilters.value = selectedFilters.value.filter(filterId => filterId !== id)
  }
}
const handleSelectAllClick = (checked: boolean) => {
  if (checked) {
    // 選択可能なチェックボックスを全てチェックする。
    selectedFilters.value = [...selectableFilterIds.value]
  } else {
    // チェックボックスをクリアする
    selectedFilters.value = []
  }
}

const sortOption = computed(() => ({
  sortKey: threatDetectionFiltersQuery.value.sortKey,
  direction: threatDetectionFiltersQuery.value.direction,
}))

const routeQuery = computed(() =>
  ['limit', 'page', 'terminalId', 'blockingStatus', 'operationStatus', 'sortKey', 'direction'].reduce((q, key) => {
    const value = route.query[key]
    if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
      if (key === 'page') {
        return Object.assign(q, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
      }
      return Object.assign(q, { [key]: Number(value) })
    } else if (key === 'terminalId' && typeof value === 'string') {
      return Object.assign(q, { [key]: [value] })
    } else if (key === 'sortKey') {
      // デフォルトは"terminalId"を指定
      return Object.assign(q, { [key]: value || 'terminalId' })
    } else if (key === 'direction') {
      // デフォルトは"desc"を指定
      return Object.assign(q, { [key]: value || 'desc' })
    } else if (value !== undefined) {
      return Object.assign(q, { [key]: value })
    }
    return q
  }, {}),
)
const changeRouteQuery = async () => {
  // セキュリティ利用規約に同意していない場合は、検索を行わない
  if (!securityTermsOfServiceAccepted.value) {
    return
  }

  // リロード等の場合のために初期値の設定を行う
  periodType.value = Object.values(PeriodTypes).find(v => v === route.query.periodType) ?? PeriodTypes.Last1Day
  // periodType が Free 以外の場合はここで終了
  if (periodType.value !== PeriodTypes.Free) {
    getThreatDetectionFiltersTableList({
      ...routeQuery.value,
      startTime: dayjs().subtract(PeriodMinutesGapMap[periodType.value], 'minutes').format(),
      endTime: dayjs().format(),
    })
    return
  }

  // periodType.value === PeriodTypes.Free の場合は、startTime と endTime をクエリパラメータから取得
  const startTimeValue = route.query.startTime
  const endTimeValue = route.query.endTime
  const startTimeDayjs =
    startTimeValue && !Array.isArray(startTimeValue) && dayjs(startTimeValue).isValid()
      ? dayjs(startTimeValue)
      : dayjs().subtract(PeriodMinutesGapMap[PeriodTypes.Last1Day], 'minutes')
  const endTimeDayjs =
    endTimeValue && !Array.isArray(endTimeValue) && dayjs(endTimeValue).isValid() ? dayjs(endTimeValue) : dayjs()

  getThreatDetectionFiltersTableList({
    ...routeQuery.value,
    startTime: startTimeDayjs.format(),
    endTime: endTimeDayjs.format(),
  })
}
watch(
  () => route.query,
  () => {
    // 確認ダイアログ表示中にブラウザバックがあった場合フラグとチェックボックスを初期化
    dialogType.value = null
    selectedFilters.value = []
    changeRouteQuery()
  },
)

onBeforeMount(async () => {
  await getSecurityTermsOfServiceAccepted()
  await getAllResourceSummaryTerminalList()
  changeRouteQuery()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center">
      <!-- TODO アイコン変更 -->
      <!-- <SvgIcon :type="IconTypes.AlertChart" color="secondary" /> -->
      <div class="text-lg">{{ t('sideBar.threatDetectionFilters') }}</div>
      <CustomButton
        v-if="!securityTermsOfServiceAccepted"
        class="ml-auto"
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        data-cy="security-contracts-threat-detection-filters-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
    </div>
    <div v-if="!securityTermsOfServiceAccepted" class="text-warning">
      {{ t('threatDetections.message.requiredSecurityAccepted') }}
    </div>
    <SearchFilter class="mt-3" :disabled="searchDisabled" @search="handleSearch" @clear="handleClear">
      <SearchPeriodDateTime
        v-model:period-type="periodType"
        v-model:start-date-time="startDateTime"
        v-model:end-date-time="endDateTime"
        :selectable-before-days="selectableBeforeDays"
        :period-types="selectablePeriodTypes"
        @valid="(valid: boolean) => (validSearchPeriodDateTime = valid)"
      />
      <InputGrid :label="t('threatDetectionFilters.terminalId')">
        <MultipleSelectForm
          :model-value="threatDetectionFiltersQuery?.terminalId ?? []"
          :options="terminalIdOptions"
          placeholder="Z000000001 / ルーター名1, Z000000002 / ルーター名2,..."
          @update:model-value="(value: string[]) => (threatDetectionFiltersQuery.terminalId = value)"
        />
      </InputGrid>
      <InputGrid :label="t('threatDetectionFilters.blockingStatus')">
        <SelectForm
          :model-value="threatDetectionFiltersQuery?.blockingStatus ?? ''"
          :options="blockingStatusOptions"
          size="middle"
          :placeholder="blockingStatusOptions[0]?.text"
          @update:model-value="(value: string) => (threatDetectionFiltersQuery.blockingStatus = value || undefined)"
        />
      </InputGrid>
      <InputGrid :label="t('threatDetectionFilters.operationStatus')">
        <SelectForm
          :model-value="threatDetectionFiltersQuery?.operationStatus ?? ''"
          :options="operationStatusOptions"
          size="middle"
          :placeholder="operationStatusOptions[0]?.text"
          @update:model-value="handleOperationStatusChange"
        />
      </InputGrid>
    </SearchFilter>
    <div class="pt-3 mb-6 d-flex flex-column align-end ga-2">
      <div class="d-flex ga-4">
        <CustomButton
          icon="right-arrow"
          color="warning"
          :text="t('threatDetectionFilters.unblock')"
          :width="180"
          :disabled="!selectedFilters.length"
          data-cy="security-contracts-threat-detection-filters-unblock-button"
          @click="() => (dialogType = 'unblock')"
        />
        <CustomButton
          icon="reload"
          color="primary"
          :text="t('threatDetectionFilters.getFilterCount')"
          :width="220"
          :disabled="!selectedFilters.length"
          data-cy="security-contracts-threat-detection-filters-get-filter-counts-button"
          @click="() => (dialogType = 'getFilterCounts')"
        />
      </div>
      <SecurityHelpDeskButton />
    </div>

    <PaginationHeader
      :page="pagination.page"
      :limit="pagination.limit"
      :total="threatDetectionFiltersTableList?.total"
      @update:limit="handleLimitChange"
    />
    <SortableTable
      :items="items"
      :headers="headers"
      :sort="sortOption"
      :key-items="['filterId']"
      :unsortable-keys="unsortableKeys"
      @sort="handleSort"
    >
      <template #header-selector>
        <div class="w-100px d-flex justify-center">
          <CheckboxBase
            :value="areAllVisibleRowsSelected"
            :indeterminate="indeterminate"
            :disabled="selectableFilterIds.length === 0"
            data-cy="security-contracts-threat-detection-filters-select-all"
            @update:value="handleSelectAllClick"
          />
        </div>
      </template>
      <template #selector="{ row }">
        <div class="w-100px d-flex justify-center">
          <CheckboxBase
            :value="selectedFilters.includes(row.filterId)"
            :disabled="!row.selectable"
            :data-cy="`security-contracts-threat-detection-filters-selector-${row.filterId}`"
            @update:value="(checked: boolean) => handleSelectorClick(checked, row.filterId)"
          />
        </div>
      </template>
      <template #terminalId="{ row }">
        <NuxtLink :to="`/tenants/${tenantId}/${row.terminalPath}/${row.terminalId}`">{{ row.terminalId }}</NuxtLink>
      </template>
      <template #customerNote="{ row }">
        <div class="text-truncate">{{ row.customerNote }}</div>
      </template>
    </SortableTable>
    <PaginationFooter
      :page="pagination.page"
      :limit="pagination.limit"
      :total="threatDetectionFiltersTableList?.total"
      @update:page="handleChangePage"
    />
    <DialogBase
      :open="dialogOpen"
      :submit-label="confirmDialogData.label"
      :submit-color="dialogType === 'unblock' ? 'warning' : 'primary'"
      :submit-width="180"
      :cancel-label="t('common.cancel')"
      :disabled="loading"
      @submit="confirmDialogData.submit"
      @close="confirmDialogData.cancel"
    >
      <div class="text-pre-wrap text-lg flex-center-center text-center">
        {{ confirmDialogData.text }}
      </div>
    </DialogBase>
  </CardContainer>
</template>

<style lang="scss" scoped>
.w-100px {
  width: 100px;
}
</style>
