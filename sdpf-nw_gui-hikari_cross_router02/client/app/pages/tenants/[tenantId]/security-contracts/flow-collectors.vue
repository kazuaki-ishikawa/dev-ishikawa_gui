<script setup lang="ts">
import * as Papa from 'papaparse'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { SecurityOptionTypes } from '@/api/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import type { ResourceSummaryTerminalQuery } from '@/api/terminals/types'
import type { MultiLevelHeaderType, SortOption } from '@/components/table/types'
import { TenantPages } from '@/components/sidebar/constants'

type CsvType = {
  terminalId: string
  customerNote: string
  primaryCircuit: string
  primaryCircuitId: string
  secondaryCircuit: string
  secondaryCircuitId: string
  flowCollectorPlan: string
  flowCollectorStartDate: string
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { primaryCircuitTypeOptions, flowCollectorPlanOptions } = useTerminalInput()
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)
const { terminalIdOptions, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const {
  terminalTableList,
  terminalTableQuery,
  terminalSortOption,
  terminalTablePagination,
  terminalTableItems,
  getTerminalTableList,
  handleQueryClear,
  updateQueryTerminalId,
  updateQueryPrimaryCircuitType,
  updateQueryFlowCollectorPlan,
} = useGetTerminalTableList()
const { downloadCsv } = useDownloadCsv()

// フローデータダウンロードタブのダウンロード
const trafficFlowDownloadRequest = ref({
  terminalId: '',
  time: { startTime: '', endTime: '' },
})
const resetDownloadRequest = () => {
  trafficFlowDownloadRequest.value = {
    terminalId: '',
    time: { startTime: '', endTime: '' },
  }
}

const selectedTerminalFlowCollectorPlan = computed(() => {
  const terminal = terminalTableItems.value.find(
    terminal => terminal.terminalId === trafficFlowDownloadRequest.value.terminalId,
  )
  return terminal?.flowCollectorPlan
})

const TabName = {
  Usages: 'usages',
  Download: 'download',
} as const
const currentTabName = computed(() => (route.query.tab as string) || TabName.Usages)
const tabs = computed(() => [
  { text: t('flowCollectors.flowCollectorUsages'), name: TabName.Usages },
  { text: t('flowCollectors.flowCollectorDownload'), name: TabName.Download },
])
const handleTabChange = (tabName: string) => {
  // タブが切り替わったタイミングでデータを初期化する
  resetDownloadRequest()
  trafficFlowUsageQuery.value = { terminalId: [] }
  trafficFlowUsages.value = []
  router.push({ query: { tab: tabName } })
}

const columnWidth = [
  { key: 'selector', width: 55 },
  { key: 'terminalId', width: 125 },
  { key: 'customerNote' },
  { key: 'primaryCircuit', width: 143 },
  { key: 'primaryCircuitId', width: 121 },
  { key: 'secondaryCircuit', width: 143 },
  { key: 'secondaryCircuitId', width: 121 },
  { key: 'flowCollectorPlan', width: 130 },
  { key: 'flowCollectorStartDate', width: 130 },
]
const multiLevelHeaders: MultiLevelHeaderType[][] = [
  [
    { key: 'selector', text: '', colSpan: 1, rowSpan: 2, bottom: true },
    { key: 'terminalId', text: t('terminals.terminalId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    { key: 'customerNote', text: t('terminals.name'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    { key: undefined, text: t('terminals.primary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
    { key: undefined, text: t('terminals.secondary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
    {
      key: 'flowCollectorPlan',
      text: t('flowCollectors.plan'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm mr-1',
    },
    {
      key: 'flowCollectorStartDate',
      text: t('flowCollectors.period'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm',
    },
  ],
  [
    { key: 'primaryCircuit', text: t('terminals.circuitType'), colSpan: 1, rowSpan: 1, bottom: true, class: 'text-sm' },
    { key: 'primaryCircuitId', text: t('terminals.circuitId'), colSpan: 1, rowSpan: 1, bottom: true, class: 'text-sm' },
    {
      key: 'secondaryCircuit',
      text: t('terminals.circuitType'),
      colSpan: 1,
      rowSpan: 1,
      bottom: true,
      class: 'text-sm',
    },
    {
      key: 'secondaryCircuitId',
      text: t('terminals.circuitId'),
      colSpan: 1,
      rowSpan: 1,
      bottom: true,
      class: 'text-sm',
    },
  ],
]
const slotNames = [
  'selector',
  'terminalId',
  'customerNote',
  'primaryCircuit',
  'primaryCircuitId',
  'secondaryCircuit',
  'secondaryCircuitId',
  'flowCollectorPlan',
  'flowCollectorStartDate',
]

// フローコレクター利用状況
const { trafficFlowUsageQuery, trafficFlowUsages, getTrafficFlowUsage } = useTrafficFlowUsage()
const selectedTerminalIds = computed(() => trafficFlowUsageQuery.value.terminalId)

const selectableTerminalItems = computed(() =>
  terminalTableItems.value.filter(terminal => terminal.flowCollectorPlan !== SecurityOptionTypes.NoSubscription),
)
const areAllVisibleRowsSelected = computed(
  () =>
    // テーブルに表示してる選択可能な端末が全て選択されているかどうか
    0 < selectableTerminalItems.value.length &&
    selectableTerminalItems.value.every(terminal => selectedTerminalIds.value.includes(terminal.terminalId)),
)
const indeterminate = computed(() => trafficFlowUsageQuery.value.terminalId.length > 0)

const isDownloadDisabled = computed(
  () =>
    !securityTermsOfServiceAccepted.value ||
    !trafficFlowDownloadRequest.value.time.startTime ||
    !trafficFlowDownloadRequest.value.time.endTime ||
    !trafficFlowDownloadRequest.value.terminalId,
)

const handleSelectAllClick = (checked: boolean) => {
  if (checked) {
    // テーブル表示上の選択可能な端末IDだけ取得する
    trafficFlowUsageQuery.value.terminalId = selectableTerminalItems.value.map(item => item.terminalId)
  } else {
    trafficFlowUsageQuery.value.terminalId = []
  }
}
const handleSelectorClick = (checked: boolean, id: string) => {
  if (checked) {
    trafficFlowUsageQuery.value.terminalId = [...selectedTerminalIds.value, id]
  } else {
    trafficFlowUsageQuery.value.terminalId = selectedTerminalIds.value.filter(terminalId => terminalId !== id)
  }
}

const handleDownloadCsv = async () => {
  try {
    const data = terminalTableList.value.terminals.reduce<CsvType[]>((acc, cur) => {
      acc.push({
        terminalId: cur.terminalId,
        customerNote: cur.customerNote,
        primaryCircuit: cur.primaryCircuit.circuitType,
        primaryCircuitId: cur.primaryCircuit.circuitId,
        secondaryCircuit: cur.secondaryCircuit?.circuitType ?? '',
        secondaryCircuitId: cur.secondaryCircuit?.circuitId ?? '',
        flowCollectorPlan: cur.flowCollector.flowCollectorPlan,
        flowCollectorStartDate: cur.flowCollector.flowCollectorStartDate ?? '',
      })
      return acc
    }, [])
    const csv = Papa.unparse(data ?? [])
    await downloadCsv(csv, 'flow_data_collectors')
  } catch {
    // error の場合は何もしない
  }
}
const handleTerminalTableSearch = (query: ResourceSummaryTerminalQuery) => {
  getTerminalTableList(query)
  resetDownloadRequest()
  // ルーターが更新されたら usage を初期化する
  trafficFlowUsageQuery.value = { ...trafficFlowUsageQuery.value, terminalId: [] }
  trafficFlowUsages.value = []
}
const handleChangeLimit = (limit?: number) => {
  handleTerminalTableSearch({ ...terminalTableQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  handleTerminalTableSearch({ ...terminalTableQuery.value, offset: page - 1 })
}
const handleSort = (option?: SortOption) => {
  handleTerminalTableSearch({ ...terminalTableQuery.value, sortKey: option?.sortKey, direction: option?.direction })
}
const handleTerminalSelect = (terminalId: string, flowCollectorPlan: string) => {
  if (flowCollectorPlan === SecurityOptionTypes.NoSubscription) {
    return
  }
  trafficFlowDownloadRequest.value.terminalId = terminalId
  trafficFlowDownloadRequest.value.time.startTime = dayjs().startOf('day').format()
  trafficFlowDownloadRequest.value.time.endTime = dayjs().format()
}
const moveToDownload = async () =>
  await navigateTo(
    {
      path: `/tenants/${tenantId.value}/${TenantPages.SecurityContracts}/download`,
      query: {
        terminalId: trafficFlowDownloadRequest.value.terminalId,
        startTime: trafficFlowDownloadRequest.value.time.startTime,
        endTime: trafficFlowDownloadRequest.value.time.endTime,
      },
    },
    { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } },
  )

onBeforeMount(() => {
  getSecurityTermsOfServiceAccepted()
  getAllResourceSummaryTerminalList()
  getTerminalTableList(terminalTableQuery.value)
})
</script>

<template>
  <SimpleTab :tabs="tabs" :current-tab-name="currentTabName" @click="handleTabChange">
    <template #default>
      <div class="bg-white pa-8">
        <!-- セキュリティ同意 -->
        <div v-if="!securityTermsOfServiceAccepted" class="flex-flex-start-center mb-3">
          <div class="text-warning">{{ t('flowCollectors.message.requiredSecurityAccepted') }}</div>
          <div class="ml-auto">
            <CustomButton
              icon="up-right-square"
              :text="t('terms.confirmation')"
              :width="180"
              @click="() => moveToSecurityTermOfService(tenantId)"
            />
          </div>
        </div>
        <!-- ルーターのフィルタ -->
        <div class="flex-space-between-flex-end flex-wrap">
          <SearchFilter
            :disabled="!securityTermsOfServiceAccepted"
            @search="() => handleTerminalTableSearch(terminalTableQuery)"
            @clear="handleQueryClear"
          >
            <InputGrid :label="t('terminals.name')" :label-width="180">
              <InputForm
                :model-value="terminalTableQuery?.customerNote ?? ''"
                :placeholder="t('terminals.name')"
                @update:model-value="(value: string) => (terminalTableQuery.customerNote = value || undefined)"
              />
            </InputGrid>
            <InputGrid :label="t('flowCollectors.primaryCircuitType')" :label-width="180">
              <SelectForm
                :model-value="terminalTableQuery?.primaryCircuitType ?? ''"
                :options="primaryCircuitTypeOptions"
                :placeholder="primaryCircuitTypeOptions[0]?.text"
                size="middle"
                @update:model-value="updateQueryPrimaryCircuitType"
              />
            </InputGrid>
            <InputGrid :label="t('terminals.terminalId')" :label-width="180">
              <MultipleSelectForm
                :model-value="terminalTableQuery?.terminalId ?? []"
                :options="terminalIdOptions"
                placeholder="Z000000001 / ルーター名1, Z000000002 / ルーター名2,..."
                @update:model-value="updateQueryTerminalId"
              />
            </InputGrid>
            <InputGrid :label="t('flowCollectors.plan')" :label-width="180">
              <SelectForm
                :model-value="terminalTableQuery?.flowCollectorPlan ?? ''"
                :options="flowCollectorPlanOptions"
                :placeholder="flowCollectorPlanOptions[0]?.text"
                size="middle"
                @update:model-value="updateQueryFlowCollectorPlan"
              />
            </InputGrid>
          </SearchFilter>
          <div class="mb-4 d-flex flex-column ga-2">
            <!-- ダウンロードボタン -->
            <CustomButton
              v-if="currentTabName === TabName.Usages"
              icon="download"
              :text="t('flowCollectors.downloadCsv')"
              :width="230"
              :disabled="!securityTermsOfServiceAccepted || terminalTableItems.length === 0"
              @click="handleDownloadCsv"
            />
            <SecurityHelpDeskButton />
          </div>
        </div>
        <!-- ルーターテーブル -->
        <PaginationHeader
          :page="terminalTablePagination.page"
          :limit="terminalTablePagination.limit"
          :total="terminalTableList.total"
          @update:limit="handleChangeLimit"
        />
        <MultiLevelHeaderSortableTable
          :multi-level-headers="multiLevelHeaders"
          :column-widths="columnWidth"
          :items="terminalTableItems"
          :slot-names="slotNames"
          :key-items="['terminalId']"
          :sort="terminalSortOption"
          :unsortable-keys="[
            'selector',
            'primaryCircuit',
            'primaryCircuitId',
            'secondaryCircuit',
            'secondaryCircuitId',
          ]"
          @sort="handleSort"
        >
          <template v-if="currentTabName === TabName.Usages" #header-selector>
            <div class="mx-auto">
              <CheckboxBase
                :value="areAllVisibleRowsSelected"
                :indeterminate="indeterminate"
                :disabled="selectableTerminalItems.length === 0"
                @update:value="handleSelectAllClick"
              />
            </div>
          </template>
          <template #selector="{ row }">
            <div v-if="currentTabName === TabName.Usages" class="mx-auto">
              <CheckboxBase
                :value="selectedTerminalIds.includes(row.terminalId)"
                :disabled="row.flowCollectorPlan === SecurityOptionTypes.NoSubscription"
                @update:value="(checked: boolean) => handleSelectorClick(checked, row.terminalId)"
              />
            </div>
            <div
              v-else
              class="radio h-100 w-100"
              :class="{
                checked: trafficFlowDownloadRequest.terminalId === row.terminalId,
                disabled: row.flowCollectorPlan === SecurityOptionTypes.NoSubscription,
              }"
            >
              <div class="button" @click="handleTerminalSelect(row.terminalId, row.flowCollectorPlan)" />
            </div>
          </template>
          <template #terminalId="{ row }">
            <div>{{ row.terminalId }}</div>
          </template>
          <template #customerNote="{ row }">
            <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
          </template>
          <template #primaryCircuit="{ data }">
            <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
          </template>
          <template #primaryCircuitId="{ data }">
            <div>{{ data }}</div>
          </template>
          <template #secondaryCircuit="{ data }">
            <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
          </template>
          <template #secondaryCircuitId="{ data }">
            <div>{{ data || '-' }}</div>
          </template>
          <template #flowCollectorPlan="{ data }">
            <div class="text-xs">{{ !!data ? t(`terminals.flowCollectorOptions.${data}`) : '-' }}</div>
          </template>
          <template #flowCollectorStartDate="{ data }">
            <div class="text-xs">{{ !!data ? `${data}〜` : '-' }}</div>
          </template>
        </MultiLevelHeaderSortableTable>
        <PaginationFooter
          :page="terminalTablePagination.page"
          :limit="terminalTablePagination.limit"
          :total="terminalTableList.total"
          @update:page="handleChangePage"
        />
      </div>
    </template>

    <template #[TabName.Usages]>
      <FlowCollectorUsages
        v-model:query="trafficFlowUsageQuery"
        :usages="trafficFlowUsages"
        :disabled="!securityTermsOfServiceAccepted || selectedTerminalIds.length === 0"
        @submit="() => getTrafficFlowUsage(trafficFlowUsageQuery)"
      />
    </template>

    <template #[TabName.Download]>
      <FlowCollectorDownload
        v-model="trafficFlowDownloadRequest.time"
        :flow-collector-plan="selectedTerminalFlowCollectorPlan"
        :disabled="isDownloadDisabled"
        @submit="moveToDownload()"
      />
    </template>
  </SimpleTab>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));
$light-info-color: rgb(var(--v-theme-light-info));

.radio {
  position: relative;

  &.checked .button {
    border: 1px solid $secondary-color;
    &::after {
      width: 12px;
      height: 12px;
    }
  }

  &.disabled {
    color: $info-color;
    .button {
      cursor: auto;
      border: 1px solid $light-info-color;
      background-color: v.$light-info-alpha-color;
    }
  }
  .button {
    cursor: pointer;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid $info-color;
    position: absolute;
    top: 9px;
    left: 4.5px;
    background-color: #fff;
    &::after {
      content: '';
      display: block;
      background-color: $secondary-color;
      border-radius: 50%;
      position: absolute;
      top: 0.25rem;
      left: 0.25rem;
    }
  }
}
</style>
