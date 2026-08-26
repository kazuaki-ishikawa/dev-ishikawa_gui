<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SortDirectionType } from '@/api/types'
import type { ResourceSummaryTerminalListResponse } from '@/api/terminals/types'
import { ThreatDetectionSharedTerminalDirectionTypes } from '@/api/threatDetectionShared/constants'
import type {
  ThreatDetectionSharedTenantListQuery,
  ThreatDetectionSharedTenantListResponse,
} from '@/api/threatDetectionShared/types'
import type { TenantTerminalTableItemType } from '@/components/threatDetectionShared/types'
import type { OptionType } from '@/components/input/types'

const MAX_LIMIT = 100

type PropType = {
  threatDetectionSharedTenantList: ThreatDetectionSharedTenantListResponse | null
  tenantIdOptions: OptionType<string>[]
  terminalIdOptions: OptionType<string>[]
  terminalList: ResourceSummaryTerminalListResponse
  disabled?: boolean
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'search', query: ThreatDetectionSharedTenantListQuery): void
}
const emits = defineEmits<Emits>()

const selectedTableItemList = defineModel<TenantTerminalTableItemType[]>('selected', { required: true })
const query = defineModel<ThreatDetectionSharedTenantListQuery>('query', { required: true })

const route = useRoute()
const { t } = useI18n()
const { getThreatDetectionPlanText } = useTerminalInput()
const { getBillingMethodText } = useThreatDetectionShared()

const requestDetailBasePath = computed(() => route.path.split('/').slice(0, -1).join('/'))

const pagination = computed(() => ({
  limit: query.value.limit || 10,
  page: (query.value.offset ?? 0) + 1,
}))

const terminalDirection = computed(() =>
  query.value.terminalDirection === ThreatDetectionSharedTerminalDirectionTypes.Provided
    ? ThreatDetectionSharedTerminalDirectionTypes.Provided
    : ThreatDetectionSharedTerminalDirectionTypes.Received,
)

const contractorLabel = computed(() => t(`threatDetectionSharedStop.${terminalDirection.value}.contractorName`))
const approvalTimeLabel = computed(() =>
  terminalDirection.value === ThreatDetectionSharedTerminalDirectionTypes.Provided
    ? t('threatDetectionShared.updateTime.tableLabel')
    : t('threatDetectionShared.updateTime.start'),
)

const tableHeaders = computed(() => [
  { text: '', key: 'selector', width: 60 },
  { text: contractorLabel.value, key: 'contractorName', width: 250 },
  { text: t('details.tenantId'), key: 'sharedTenantId', width: 320 },
  { text: t('terminals.terminalId'), key: 'terminalId', width: 150 },
  { text: t('terminals.name'), key: 'customerNote', width: 200 },
  { text: t('terminals.threatDetectionPlan'), key: 'threatDetectionPlan', width: 150 },
  { text: t('threatDetectionShared.request'), key: 'requestId', width: 150 },
  { text: approvalTimeLabel.value, key: 'approvalTime', width: 200 },
  { text: t('threatDetectionShared.billingMethod.label'), key: 'billingMethod', width: 150 },
])
const unsortableKeys = computed(() =>
  tableHeaders.value.filter(({ key }) => key !== 'approvalTime').map(({ key }) => key),
)

const tableItems = computed(
  () =>
    props.threatDetectionSharedTenantList?.terminals?.map(terminal => ({
      ...terminal,
      selector: selectedTableItemList.value.some(
        item => item.sharedTenantId === terminal.sharedTenantId && item.terminalId === terminal.terminalId,
      ),
      approvalTime: formatDateTime(terminal.approvalTime),
      terminalPath:
        terminalDirection.value === ThreatDetectionSharedTerminalDirectionTypes.Provided
          ? convertTerminalDetailPath(props.terminalList, terminal.terminalId)
          : '',
    })) ?? [],
)

const areAllVisibleRowsSelected = computed(
  () =>
    tableItems.value.length > 0 &&
    tableItems.value.every(tableItem =>
      // sharedTenantId と terminalId の組み合わせでユニークになる
      selectedTableItemList.value.some(
        item => item.sharedTenantId === tableItem.sharedTenantId && item.terminalId === tableItem.terminalId,
      ),
    ),
)
const indeterminate = computed(() => selectedTableItemList.value.length > 0)
const checkboxDisabled = computed(() => selectedTableItemList.value.length >= MAX_LIMIT)

const handleSearch = () => {
  // 選択済みの要素を初期化
  selectedTableItemList.value = []
  emits('search', { ...query.value, offset: 0 })
}
const handleClear = () => {
  query.value = {
    ...query.value,
    sharedTenantId: undefined,
    terminalId: undefined,
  }
}

const handleChangeLimit = (limit: number) => {
  emits('search', { ...query.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  emits('search', { ...query.value, offset: page - 1 })
}
const handleSort = (option?: { sortKey: string; direction: SortDirectionType }) => {
  emits('search', { ...query.value, ...option })
}
const handleSelectAllClick = (checked: boolean) => {
  // 選択不可要素がないので単純に全選択/全解除する
  if (checked) {
    selectedTableItemList.value = tableItems.value.slice(0, MAX_LIMIT)
  } else {
    selectedTableItemList.value = []
  }
}
const handleSelectorClick = (checked: boolean, row: TenantTerminalTableItemType) => {
  if (checked) {
    selectedTableItemList.value = [...selectedTableItemList.value, row]
  } else {
    selectedTableItemList.value = selectedTableItemList.value.filter(
      item => item.sharedTenantId !== row.sharedTenantId || item.terminalId !== row.terminalId,
    )
  }
}
</script>

<template>
  <div>
    <div class="flex-space-between-flex-end flex-wrap">
      <SearchFilter :disabled="disabled" @search="handleSearch" @clear="handleClear">
        <InputGrid :label="`${contractorLabel} / ${t('details.tenantId')}`">
          <SelectForm
            :model-value="query.sharedTenantId ?? ''"
            placeholder="A社/tenantA"
            :options="tenantIdOptions"
            size="middle"
            @update:model-value="value => (query.sharedTenantId = value || undefined)"
          />
        </InputGrid>
        <InputGrid :label="`${t('terminals.terminalId')} / ${t('terminals.name')}`">
          <SelectForm
            :model-value="query.terminalId ?? ''"
            placeholder="Z000000001 / ルーター名1"
            :options="terminalIdOptions"
            size="middle"
            @update:model-value="value => (query.terminalId = value || undefined)"
          />
        </InputGrid>
      </SearchFilter>
    </div>

    <!-- テーブル -->
    <PaginationHeader
      :page="pagination.page"
      :limit="pagination.limit"
      :total="threatDetectionSharedTenantList?.total ?? 0"
      :selected="{ max: MAX_LIMIT, counts: selected.length }"
      @update:limit="handleChangeLimit"
    />
    <SortableTable
      :items="tableItems"
      :headers="tableHeaders"
      :sort="{ sortKey: query.sortKey, direction: query.direction }"
      :unsortable-keys="unsortableKeys"
      :key-items="['sharedTenantId', 'terminalId']"
      @sort="handleSort"
    >
      <template #header-selector>
        <div class="w-100 d-flex justify-center">
          <CheckboxBase
            :value="areAllVisibleRowsSelected"
            :indeterminate="indeterminate"
            :disabled="tableItems.length === 0 || (checkboxDisabled && !areAllVisibleRowsSelected)"
            data-cy="tenant-terminal-table-selector-all-checkbox"
            @update:value="handleSelectAllClick"
          />
        </div>
      </template>
      <template #selector="{ row }">
        <div class="w-100 d-flex justify-center">
          <CheckboxBase
            :value="row.selector"
            :disabled="!row.selector && checkboxDisabled"
            :data-cy="`tenant-terminal-table-selector-${row.sharedTenantId}-${row.terminalId}`"
            @update:value="(checked: boolean) => handleSelectorClick(checked, row)"
          />
        </div>
      </template>
      <template #terminalId="{ row }">
        <NuxtLink
          v-if="row.terminalPath"
          :to="row.terminalPath"
          :data-cy="`tenant-terminal-table-terminal-id-link-${row.sharedTenantId}-${row.terminalId}`"
        >
          {{ row.terminalId }}
        </NuxtLink>
        <span v-else :data-cy="`tenant-terminal-table-terminal-id-${row.sharedTenantId}-${row.terminalId}`">{{
          row.terminalId
        }}</span>
      </template>
      <template #threatDetectionPlan="{ row }">
        <span class="text-sm">{{ getThreatDetectionPlanText(row.threatDetectionPlan) }}</span>
      </template>
      <template #requestId="{ row }">
        <NuxtLink :to="`${requestDetailBasePath}/${row.requestId}`">
          {{ t('threatDetectionShared.requestDetail') }}
        </NuxtLink>
      </template>
      <template #billingMethod="{ row }">
        <span class="text-sm">{{ getBillingMethodText(row.billingMethod) || '-' }}</span>
      </template>
    </SortableTable>
    <PaginationFooter
      :page="pagination.page"
      :limit="pagination.limit"
      :total="threatDetectionSharedTenantList?.total ?? 0"
      @update:page="handleChangePage"
    />
  </div>
</template>
