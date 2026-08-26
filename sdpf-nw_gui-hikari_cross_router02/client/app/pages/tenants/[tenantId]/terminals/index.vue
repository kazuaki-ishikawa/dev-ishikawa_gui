<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusOptions, ResourceStatusTypes } from '@/api/constants'
import { SecurityContractsPages, TenantPages } from '@/components/sidebar/constants'
import type { MultiLevelHeaderType } from '@/components/table/types'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { terminalIdOptions, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const {
  terminalTableList,
  terminalTableQuery,
  terminalSortOption,
  terminalTableItems,
  terminalTablePagination,
  getTerminalTableList,
  routerPushQuery,
  handleChangeLimit,
  handleChangePage,
  handleSort,
  handleQueryClear,
  updateQueryTerminalId,
  updateQueryTerminalType,
  updateQueryResourceStatus,
} = useGetTerminalTableList()
const {
  terminalTypeOptions,
  getTrafficReportFlowAnalyzerPlanText,
  getTrafficReportFlowAnalyzerAlertText,
  getFlowCollectorPlanText,
  getThreatDetectionPlanText,
  getBehaviorDetectionPlanText,
} = useTerminalInput()

const { getQuery } = useSidebar()
const moveToBreakOutLists = async () => {
  const query = getQuery(TenantPages.BreakOutLists)
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.BreakOutLists}`, query })
}
const moveToCreate = async () => {
  await navigateTo(`/tenants/${tenantId.value}/${TenantPages.Terminals}/create`)
}
const moveToCreateBulk = async () => {
  await navigateTo(`/tenants/${tenantId.value}/${TenantPages.Terminals}/create-bulk`)
}
const moveToEditBulk = async () => {
  await navigateTo(`/tenants/${tenantId.value}/${TenantPages.Terminals}/edit-bulk`)
}
const moveToFirmwareUpdateBulk = async () => {
  await navigateTo(`/tenants/${tenantId.value}/terminals-firmware/update-bulk`)
}
const moveToSecurityContractsSummary = async (terminalId: string) => {
  await navigateTo({
    path: `/tenants/${tenantId.value}/${TenantPages.SecurityContracts}/${SecurityContractsPages.Summary}`,
    query: { terminalId },
  })
}

const columnWidth = [
  { key: 'terminalId', width: 125 },
  { key: 'terminalType', width: 160 },
  { key: 'customerNote', width: 184 },
  { key: 'primaryCircuit', width: 144 },
  { key: 'primaryCircuitId', width: 121 },
  { key: 'secondaryCircuit', width: 144 },
  { key: 'secondaryCircuitId', width: 121 },
  { key: 'vpnId', width: 176 },
  { key: 'resourceStatus', width: 173 },
  { key: 'orderId', width: 136 },
  { key: 'updateTime', width: 146 },
  { key: 'threatDetectionPlan', width: 120 },
  { key: 'flowCollectorPlan', width: 120 },
  { key: 'behaviorDetectionPlan', width: 112 },
  { key: 'trafficReportFlowAnalyzerPlan', width: 180 },
  { key: 'trafficReportFlowAnalyzerAlert', width: 160 },
  { key: 'securitySettings', width: 200 },
]
const multiLevelHeaders: MultiLevelHeaderType[][] = [
  [
    { key: undefined, text: t('terminals.routerRelatedInformation'), colSpan: 7, class: 'text-sm' },
    { key: undefined, text: t('terminals.routerDetailInformation'), colSpan: 4, class: 'text-sm' },
    { key: undefined, text: t('terminals.routeOptionInformation'), colSpan: 6, class: 'text-sm' },
  ],
  [
    // ルーター紐づけ情報
    { key: 'terminalId', text: t('terminals.terminalId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    {
      key: 'terminalType',
      text: t('guarantees.terminalTypeWithDeviceType'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-sm mr-1',
    },
    { key: 'customerNote', text: t('terminals.name'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    { key: undefined, text: t('terminals.primary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
    { key: undefined, text: t('terminals.secondary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
    // ルーター詳細情報
    { key: 'vpnId', text: t('terminals.vpnId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm' },
    {
      key: 'resourceStatus',
      text: t('details.resourceStatus'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm mr-1',
    },
    { key: 'orderId', text: t('details.orderId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    { key: 'updateTime', text: t('details.updateTime'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    // オプション情報
    {
      key: 'threatDetectionPlan',
      text: t('terminals.threatDetectionPlan'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm mr-1',
    },
    {
      key: 'flowCollectorPlan',
      text: t('terminals.flowCollectorPlan'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-sm mr-1',
    },
    {
      key: 'behaviorDetectionPlan',
      text: t('terminals.behaviorDetection'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-sm mr-1',
    },
    {
      key: undefined,
      text: t('terminals.trafficReportFlowAnalyzerPlanOptions'),
      colSpan: 2,
      rowSpan: 1,
      class: 'text-sm',
    },
    {
      key: 'securitySettings',
      text: t('terminals.securitySettings'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm mx-auto',
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
    {
      key: 'trafficReportFlowAnalyzerPlan',
      text: t('terminals.trafficReportFlowAnalyzerPlan'),
      colSpan: 1,
      rowSpan: 1,
      bottom: true,
      class: 'text-sm',
    },
    {
      key: 'trafficReportFlowAnalyzerAlert',
      text: t('terminals.trafficReportFlowAnalyzerAlert'),
      colSpan: 1,
      rowSpan: 1,
      bottom: true,
      class: 'text-sm text-pre-wrap',
    },
  ],
]
const slotNames = [
  'terminalId',
  'terminalType',
  'customerNote',
  'primaryCircuit',
  'primaryCircuitId',
  'secondaryCircuit',
  'secondaryCircuitId',
  'vpnId',
  'resourceStatus',
  'orderId',
  'updateTime',
  'threatDetectionPlan',
  'flowCollectorPlan',
  'behaviorDetectionPlan',
  'trafficReportFlowAnalyzerPlan',
  'trafficReportFlowAnalyzerAlert',
  'securitySettings',
]
const routeQuery = computed(() =>
  ['limit', 'page', 'terminalId', 'terminalType', 'customerNote', 'resourceStatus', 'sortKey', 'direction'].reduce(
    (q, key) => {
      const value = route.query[key]
      if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
        if (key === 'page') {
          return Object.assign(q, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
        }
        return Object.assign(q, { [key]: Number(value) })
      } else if (['terminalId', 'resourceStatus'].includes(key) && typeof value === 'string') {
        return Object.assign(q, { [key]: [value] })
      } else if (key === 'sortKey') {
        // デフォルトは"updateTime"を指定
        return Object.assign(q, { [key]: value || 'updateTime' })
      } else if (key === 'direction') {
        // デフォルトは"desc"を指定
        return Object.assign(q, { [key]: value || 'desc' })
      } else if (value) {
        return Object.assign(q, { [key]: value })
      }
      return q
    },
    {},
  ),
)

const handleUpdateCustomerNote = (customerNote: string) => {
  terminalTableQuery.value = { ...terminalTableQuery.value, customerNote: customerNote || undefined }
}

const handleSearch = () => {
  const newQuery = { ...terminalTableQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, newQuery)) {
    // パスクエリの変更がない場合は直接 getTerminalTableList を実行する
    getTerminalTableList(newQuery)
  } else {
    routerPushQuery(newQuery)
  }
}

watch(
  () => route.query,
  () => {
    getTerminalTableList(routeQuery.value)
  },
  { immediate: true },
)
onBeforeMount(() => {
  getAllResourceSummaryTerminalList()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center pb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Terminal" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ `${t('sideBar.terminal')} ${t('common.list')}` }}</div>
    </div>

    <div class="flex-space-between-flex-end flex-wrap">
      <SearchFilter @search="handleSearch" @clear="handleQueryClear">
        <InputGrid :label="t('terminals.name')" :label-width="180">
          <InputForm
            :model-value="terminalTableQuery?.customerNote ?? ''"
            :placeholder="t('terminals.name')"
            @update:model-value="handleUpdateCustomerNote"
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
        <InputGrid :label="t('guarantees.terminalType')" :label-width="180">
          <SelectForm
            :model-value="terminalTableQuery?.terminalType ?? ''"
            :options="terminalTypeOptions"
            size="middle"
            :placeholder="t('terminals.rentalTerminal')"
            @update:model-value="updateQueryTerminalType"
          />
        </InputGrid>
        <InputGrid :label="t('details.resourceStatus')" :label-width="180">
          <MultipleSelectForm
            :model-value="terminalTableQuery?.resourceStatus ?? []"
            :options="ResourceStatusOptions"
            placeholder="inactive..."
            @update:model-value="updateQueryResourceStatus"
          />
        </InputGrid>
      </SearchFilter>
      <div class="mb-5 w-100 d-flex flex-wrap">
        <div class="grid-flow-col ga-2 mr-auto">
          <CustomButton
            icon="right-arrow"
            :text="t('common.createNew')"
            :width="180"
            data-cy="terminals-index-create-button"
            @click="moveToCreate()"
          />
          <CustomButton icon="right-arrow" :text="t('terminals.createBulk')" :width="180" @click="moveToCreateBulk()" />
          <a
            class="text-decoration-none"
            href="/sample.csv"
            download="docomobusinessRINK_ルーター・ワイヤレスアクセス_一括作成サンプル.csv"
          >
            <CustomButton icon="right-arrow" :text="t('terminals.csvSample')" :width="180" />
          </a>
          <CustomButton
            icon="right-arrow"
            :text="t('terminals.editBulk')"
            :width="180"
            data-cy="terminals-index-edit-bulk-button"
            @click="moveToEditBulk()"
          />
        </div>
        <div class="grid-flow-col ga-2">
          <CustomButton
            icon="right-arrow"
            :text="t('terminals.firmwareUpdateBulk')"
            :width="280"
            data-cy="terminals-index-firmware-update-button"
            @click="moveToFirmwareUpdateBulk()"
          />
          <CustomButton icon="right-arrow" :text="t('breakOut.moveToList')" :width="330" @click="moveToBreakOutLists" />
        </div>
      </div>
    </div>

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
        'primaryCircuit',
        'primaryCircuitId',
        'secondaryCircuit',
        'secondaryCircuitId',
        'securitySettings',
      ]"
      @sort="handleSort"
    >
      <template #terminalId="{ row }">
        <NuxtLink :to="`/tenants/${tenantId}/${row.terminalPath}/${row.terminalId}`">{{ row.terminalId }}</NuxtLink>
      </template>
      <template #terminalType="{ row }">
        <div class="text-xs">{{ row.terminalType }}<br />（{{ row.terminalDeviceType }}）</div>
      </template>
      <template #customerNote="{ row }">
        <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
      </template>
      <template #primaryCircuit="{ data }">
        <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
      </template>
      <template #primaryCircuitId="{ row, data }">
        <NuxtLink v-if="row.primaryCircuitPath" :to="`/tenants/${tenantId}/${row.primaryCircuitPath}/${data}`">
          {{ data }}
        </NuxtLink>
        <div v-else>
          {{ data }}
        </div>
      </template>
      <template #secondaryCircuit="{ data }">
        <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
      </template>
      <template #secondaryCircuitId="{ row, data }">
        <NuxtLink v-if="row.secondaryCircuitPath" :to="`/tenants/${tenantId}/${row.secondaryCircuitPath}/${data}`">
          {{ data }}
        </NuxtLink>
        <div v-else>
          {{ data || '-' }}
        </div>
      </template>
      <template #vpnId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.Vpns}/${data}`">{{ data }}</NuxtLink>
      </template>
      <template #orderId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.Orders}/${data}`" class="text-truncate">{{ data }}</NuxtLink>
      </template>
      <template #updateTime="{ row }">
        <div class="text-xs">{{ formatDateTime(row.updateTime) }}</div>
      </template>
      <template #threatDetectionPlan="{ row }">
        <div class="text-xs text-pre-wrap">{{ getThreatDetectionPlanText(row.threatDetectionPlan) || '-' }}</div>
      </template>
      <template #flowCollectorPlan="{ row }">
        <div class="text-xs text-pre-wrap">{{ getFlowCollectorPlanText(row.flowCollectorPlan) || '-' }}</div>
      </template>
      <template #behaviorDetectionPlan="{ row }">
        <div class="text-xs text-pre-wrap">{{ getBehaviorDetectionPlanText(row.behaviorDetectionPlan) || '-' }}</div>
      </template>
      <template #trafficReportFlowAnalyzerPlan="{ row }">
        <div class="text-xs text-pre-wrap">
          {{ getTrafficReportFlowAnalyzerPlanText(row.trafficReportFlowAnalyzerPlan) || '-' }}
        </div>
      </template>
      <template #trafficReportFlowAnalyzerAlert="{ row }">
        <div class="text-xs text-pre-wrap">
          {{ getTrafficReportFlowAnalyzerAlertText(row.trafficReportFlowAnalyzerAlert) || '-' }}
        </div>
      </template>
      <template #securitySettings="{ row }">
        <CustomButton
          v-if="row.resourceStatus === ResourceStatusTypes.Active"
          icon="right-arrow"
          :text="t('terminals.securitySettings')"
          @click="moveToSecurityContractsSummary(row.terminalId)"
        />
      </template>
    </MultiLevelHeaderSortableTable>
    <PaginationFooter
      :page="terminalTablePagination.page"
      :limit="terminalTablePagination.limit"
      :total="terminalTableList.total"
      @update:page="handleChangePage"
    />
  </CardContainer>
</template>

<style lang="scss" scoped>
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
