<script setup lang="ts">
import { difference, omit } from 'es-toolkit'
import dayjs from 'dayjs'
import * as Papa from 'papaparse'
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import type { CircuitType } from '@/api/types'
import {
  BlockingStatusTypes,
  ThreatLevelTypes,
  TrafficDirectionTypes,
  BlockingStatusOptionTypes,
} from '@/api/threatDetections/constants'
import type { ThreatDetectionsList } from '@/api/threatDetections/types'
import type { ResourceSummaryTerminalListResponse } from '@/api/terminals/types'
import type { SortOption } from '@/components/table/types'
import { GuaranteePages, SecurityContractsPages, TenantPages } from '@/components/sidebar/constants'

const HeaderKeys = [
  { key: 'action', width: 170 },
  { key: 'timestamp', width: 175, sortable: true },
  { key: 'terminalId', width: 166, sortable: true },
  { key: 'customerNote', width: 200 },
  { key: 'detectionType', width: 140 },
  { key: 'blockingStatus', width: 170 },
  { key: 'filters', width: 210 },
  { key: 'threatLevel' },
  { key: 'threatType' },
  { key: 'threatDestination', width: 200 },
  { key: 'circuitId', width: 166 },
  { key: 'threatPort', width: 190 },
  { key: 'applicationCategory', width: 190 },
  { key: 'protocol', width: 130 },
  { key: 'direction', width: 130 },
  { key: 'sourceIp', width: 180 },
  { key: 'sourcePort' },
  { key: 'destinationIp', width: 180 },
  { key: 'destinationPort', sortable: true },
  { key: 'circuitType', width: 260 },
  { key: 'lineType', width: 170 },
  { key: 'circuitPriority', width: 140 },
]

type PropType = {
  threatDetectionList: ThreatDetectionsList | null
  terminalList?: ResourceSummaryTerminalListResponse
  page: number
  limit: number
  sortOption: Partial<SortOption>
  isConfirmation?: boolean
}

const props = withDefaults(defineProps<PropType>(), {
  isConfirmation: false,
})
const selectedList = defineModel<number[]>('selectedList', { default: () => [] })

type Emits = {
  (e: 'change', data: { page: number; limit?: number; sortOption?: Partial<SortOption> }): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const isBlock = computed(() => 0 <= route.path.lastIndexOf(`${SecurityContractsPages.ThreatDetections}/block`))
const isShared = computed(
  () =>
    0 <=
    route.path.lastIndexOf(
      `${SecurityContractsPages.ThreatDetectionShared}/${SecurityContractsPages.ThreatDetections}`,
    ),
)

const getBlockingStatusText = (blockingStatus: string) => {
  const displayStatus = [BlockingStatusTypes.AutoBlocked, BlockingStatusTypes.UnBlockable].includes(blockingStatus)
    ? BlockingStatusOptionTypes.NotApplicable
    : blockingStatus
  return t(`threatDetections.${displayStatus}`)
}
const getBlockingStatusTextCsv = (blockingStatus: string) =>
  [BlockingStatusTypes.AutoBlocked, BlockingStatusTypes.UnBlockable].includes(blockingStatus)
    ? 'N/A'
    : t(`threatDetections.${blockingStatus}`)
const unsortableKeys = computed(() => HeaderKeys.filter(h => !h.sortable || props.isConfirmation).map(h => h.key))

const headers = computed(() =>
  HeaderKeys.filter(({ key }) => {
    if (key === 'action') {
      // action 列は、確認画面と脅威情報共有画面では表示しない
      return !props.isConfirmation && !isShared.value
    }
    return true
  }).map(({ key, width }) => ({
    text: t(`threatDetections.${key}`),
    key,
    width: key === 'action' && isBlock.value ? 70 : width,
  })),
)

const items = computed(() => {
  const threatDetections = props.threatDetectionList?.threatDetections ?? []
  return threatDetections
    .filter((_, index) => !props.isConfirmation || selectedList.value.includes(index))
    .map(detection => {
      const terminal = props.terminalList?.terminals?.find(t => t.terminalId === detection.terminalId)
      const filters = terminal?.threatFilterEntry ?? '-'
      const maxFilters = terminal?.threatFilterMaxEntry ?? '-'
      const action =
        (detection.blockingStatus === BlockingStatusTypes.NoBlocked &&
          filters !== '-' &&
          maxFilters !== '-' &&
          maxFilters <= filters) ||
        detection.blockingStatus === BlockingStatusTypes.Blocked
          ? 'confirm'
          : detection.blockingStatus === BlockingStatusTypes.NoBlocked &&
              detection.direction === TrafficDirectionTypes.Out
            ? 'block'
            : 'none'

      return {
        action: !props.isConfirmation ? action : undefined,
        timestamp: formatDateTime(detection.timestamp, true),
        terminalId: detection.terminalId,
        terminalPath: props.terminalList
          ? convertTerminalDetailPath(props.terminalList, detection.terminalId)
          : undefined,
        customerNote: detection.customerNote,
        detectionType: detection.detectionType,
        blockingStatus: detection.blockingStatus,
        filters: isShared.value ? '' : `${filters}/${maxFilters}`,
        threatLevel: detection.threatLevel,
        threatType: detection.threatType,
        threatDestination: detection.threatDestination,
        circuitId: detection.circuitId,
        threatPort: detection.threatPort,
        applicationCategory: detection.applicationCategory,
        protocol: detection.protocol,
        direction: t(`threatDetections.${detection.direction}`),
        sourceIp: detection.sourceIp,
        sourcePort: detection.sourcePort,
        destinationIp: detection.destinationIp,
        destinationPort: detection.destinationPort,
        circuitType: detection.circuitId?.substring(0, 1) === 'V' ? undefined : detection.circuitType,
        lineType: t(`threatDetections.${detection.lineType}`),
        circuitPriority:
          detection.circuitId?.substring(0, 1) === 'V' ? undefined : t(`threatDetections.${detection.circuitPriority}`),
      }
    })
})

const selectableItems = computed(() =>
  items.value.map((item, index) => (item.action === 'block' ? index : '')).filter(index => index !== ''),
)
const areAllVisibleRowsSelected = computed(
  () => selectedList.value.length > 0 && selectedList.value.length === selectableItems.value.length,
)
const indeterminate = computed(() => selectedList.value.length > 0)
const handleSelectAllClick = (checked: boolean) => {
  if (checked) {
    selectedList.value = selectableItems.value
  } else {
    selectedList.value = []
  }
}
const handleSelectorClick = (checked: boolean, index: number) => {
  if (checked) {
    selectedList.value = [...selectedList.value, index]
  } else {
    selectedList.value = difference(selectedList.value, [index])
  }
}

const getCircuitLink = (circuitId: string, circuitType: Exclude<CircuitType, typeof CircuitTypes.Mobile>) => {
  switch (circuitType) {
    case CircuitTypes.Ipoe:
      return `/tenants/${tenantId.value}/${TenantPages.Ipoes}/${circuitId}`
    case CircuitTypes.Guarantee:
      return `/tenants/${tenantId.value}/${TenantPages.Guarantees}/${GuaranteePages.Circuits}/${circuitId}`
  }
}

const handleSort = (option?: SortOption) => {
  emits('change', { page: props.page, limit: props.limit, sortOption: option })
}
const handleChangeLimit = (limit?: number) => {
  emits('change', { page: 1, limit, sortOption: props.sortOption })
}
const handleChangePage = (page: number) => {
  emits('change', { page, limit: props.limit, sortOption: props.sortOption })
}
const moveToThreatDetectionFilters = async () => {
  await navigateTo(
    `/tenants/${tenantId.value}/${TenantPages.SecurityContracts}/${SecurityContractsPages.ThreatDetectionFilters}`,
  )
}
const moveToBlock = async (terminalId: string) => {
  await navigateTo({
    path: `/tenants/${tenantId.value}/${TenantPages.SecurityContracts}/${SecurityContractsPages.ThreatDetections}/block`,
    query: {
      terminalId,
      periodType: route.query.periodType,
      startTime: route.query.startTime,
      endTime: route.query.endTime,
    },
  })
}

const { downloadCsv } = useDownloadCsv()

const downloadFailed = ref(false)
const handleDownload = async () => {
  try {
    const fileName = `threat_detections_${dayjs().format('YYYYMMDD_HHmmss')}`
    const csvData = items.value.map(item => ({
      ...omit(item, ['action', 'terminalPath']),
      blockingStatus: getBlockingStatusTextCsv(item.blockingStatus),
      detectionType: t(`threatDetections.${item.detectionType}`),
    }))
    const csv = Papa.unparse(csvData)
    await downloadCsv(csv, fileName)
  } catch {
    downloadFailed.value = true
  }
}
</script>

<template>
  <div>
    <div v-if="!isBlock" class="mb-3 flex-flex-end-center ga-2">
      <CustomButton
        icon="download"
        :text="t('trafficDetails.download')"
        :width="180"
        :disabled="items.length === 0"
        class="ml-auto"
        data-cy="threat-detection-table-download-button"
        @click="handleDownload"
      />
      <SecurityHelpDeskButton v-if="!isShared" />
    </div>

    <PaginationHeader
      v-if="!isConfirmation"
      :page="page"
      :limit="limit"
      :total="threatDetectionList?.total"
      @update:limit="handleChangeLimit"
    />
    <SortableTable
      :items="items"
      :headers="headers"
      :sort="sortOption"
      :unsortable-keys="unsortableKeys"
      @sort="handleSort"
    >
      <template v-if="isBlock" #header-action>
        <div class="w-100 d-flex justify-center">
          <CheckboxBase
            :value="areAllVisibleRowsSelected"
            :indeterminate="indeterminate"
            :disabled="selectableItems.length === 0"
            data-cy="threat-detection-table-select-all-checkbox"
            @update:value="handleSelectAllClick"
          />
        </div>
      </template>
      <template #action="{ row, index }">
        <div v-if="!isBlock" class="flex-flex-start-center">
          <CustomButton
            v-if="row.action === 'confirm'"
            color="primary"
            icon="right-arrow"
            :text="t('threatDetections.confirmBlockingStatus')"
            :width="150"
            data-cy="threat-detection-table-confirm-blocking-status-button"
            @click="moveToThreatDetectionFilters"
          />
          <CustomButton
            v-else-if="row.action === 'block'"
            color="error"
            icon="right-arrow"
            :text="t('threatDetections.block')"
            :width="150"
            data-cy="threat-detection-table-block-button"
            @click="moveToBlock(row.terminalId)"
          />
          <div v-else-if="row.action === 'none'" class="w-176px" />
        </div>
        <div v-else class="w-100 d-flex justify-center">
          <CheckboxBase
            :value="selectedList.includes(index)"
            :disabled="row.action !== 'block'"
            data-cy="threat-detection-table-checkbox"
            @update:value="(checked: boolean) => handleSelectorClick(checked, index)"
          />
        </div>
      </template>
      <template #terminalId="{ row }">
        <NuxtLink v-if="row.terminalPath" :to="row.terminalPath">
          {{ row.terminalId }}
        </NuxtLink>
        <span v-else>{{ row.terminalId }}</span>
      </template>
      <template #customerNote="{ row }">
        <div class="text-truncate">{{ row.customerNote }}</div>
      </template>
      <template #detectionType="{ row }">
        <span>{{ t(`threatDetections.${row.detectionType}`) }}</span>
      </template>
      <template #blockingStatus="{ row }">
        <span
          :class="{
            'text-primary': row.blockingStatus === BlockingStatusTypes.Blocked,
            'text-info': [BlockingStatusTypes.UnBlockable, BlockingStatusTypes.AutoBlocked].includes(
              row.blockingStatus,
            ),
          }"
        >
          {{ getBlockingStatusText(row.blockingStatus) }}
        </span>
      </template>
      <template #threatLevel="{ row }">
        <span
          :class="{
            'text-error': row.threatLevel === ThreatLevelTypes.Critical,
            'text-warning': row.threatLevel === ThreatLevelTypes.High,
            'font-weight-bold': [ThreatLevelTypes.Critical, ThreatLevelTypes.High].includes(row.threatLevel),
          }"
        >
          {{ t(`threatDetections.level.${row.threatLevel}`) }}
        </span>
      </template>
      <template #circuitId="{ row }">
        <NuxtLink
          v-if="!isShared && row.circuitId && row.circuitType && row.circuitType !== CircuitTypes.Mobile"
          :to="getCircuitLink(row.circuitId, row.circuitType)"
        >
          {{ row.circuitId }}
        </NuxtLink>
        <span v-else>{{ row.circuitId }}</span>
      </template>
      <template #circuitType="{ row }">
        <span>{{ row.circuitType ? t(`threatDetections.${row.circuitType}`) : '' }}</span>
      </template>
    </SortableTable>
    <PaginationFooter
      v-if="!isConfirmation"
      :page="page"
      :limit="limit"
      :total="threatDetectionList?.total"
      @update:page="handleChangePage"
    />
    <DialogBase :open="downloadFailed" :cancel-label="t('common.close')" @close="downloadFailed = false">
      <div class="text-2xl h-100 text-center flex-center-center text-pre-wrap">
        {{ t('trafficFlow.message.downloadFailed') }}
      </div>
    </DialogBase>
  </div>
</template>

<style lang="scss" scoped>
.w-176px {
  width: 176px;
}
</style>
