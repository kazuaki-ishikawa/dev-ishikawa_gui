<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { OrderStatusTypes, ResourceStatusTypes, TerminalTypes } from '@/api/constants'
import {
  TERMINAL_MAX_SELECTABLE_LIMIT,
  FirmwareVersionTypes,
  OperationTypes,
  OperationStatusTypes,
} from '@/api/terminals/constants'
import type { TerminalListQuery } from '@/api/terminals/types'
import type { SortOption } from '@/components/table/types'

definePageMeta({
  layout: 'firmware',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const { loading } = useLoading()

const { terminalIdOptions, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { terminalListQuery, terminalList, terminalsTableItems, getTerminalList } = useGetTerminalList()
const { postTerminalBulkOperation } = usePostTerminalBulkOperation()
const { getTerminalsBulkOperation, terminalsBulkOperationMap } = useGetTerminalsBulkOperation()

const routerPushQuery = (query: TerminalListQuery) =>
  router.push({
    query: {
      ...query,
      offset: undefined,
      page: (query.offset ?? 0) + 1,
    },
  })
const handleChangeLimit = (limit?: number) => {
  routerPushQuery({ ...terminalListQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  routerPushQuery({ ...terminalListQuery.value, offset: page - 1 })
}
const handleSort = (option?: SortOption) => {
  routerPushQuery({ ...terminalListQuery.value, sortKey: option?.sortKey, direction: option?.direction })
}
const handleQueryClear = () => {
  terminalListQuery.value.terminalId = undefined
}
const sortOption = computed<Partial<SortOption>>(() => ({
  sortKey: terminalListQuery.value.sortKey,
  direction: terminalListQuery.value.direction,
}))
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))

const headers = computed(() => [
  ...(!isConfirmation.value ? [{ key: 'selector', text: '', width: 55 }] : []),
  { key: 'terminalId', text: t('terminals.terminalId'), width: 140, class: 'text-sm' },
  { key: 'customerNote', text: t('terminals.name'), class: 'text-sm' },
  { key: 'firmwareVersion', text: t('firmwareUpdate.firmwareVersion'), width: 220, class: 'text-sm' },
  { key: 'primaryCircuit', text: t('terminals.primaryCircuit'), width: 200, class: 'text-xs' },
  { key: 'secondaryCircuit', text: t('terminals.secondaryCircuit'), width: 200, class: 'text-xs' },
])
const unsortableKeys = computed(() =>
  isConfirmation.value
    ? headers.value.map(({ key }) => key)
    : ['selector', 'firmwareVersion', 'primaryCircuit', 'secondaryCircuit'],
)

// 確認画面状態
const isConfirmation = ref(false)

// チェックボックス非活性制御
const disabledTerminalIds = computed(() =>
  terminalList.value.terminals
    .filter(terminal => {
      // editable: orderStatusがCompleted以外の場合は非活性
      const editable = !terminal.orderStatus || terminal.orderStatus === OrderStatusTypes.Completed

      // 全ファームウェアが最新の場合は非活性
      const allFirmwareLatest = terminal.terminalDevices?.every(
        device => device.firmwareVersion?.attribute === FirmwareVersionTypes.Latest,
      )

      // firmwareUpdate の status が Processing の場合は非活性
      const operations = terminalsBulkOperationMap.value.get(terminal.terminalId) ?? []
      const isFirmwareUpdateProcessing = operations.some(
        ({ operation, status }) =>
          operation === OperationTypes.FirmwareUpdate && status === OperationStatusTypes.Processing,
      )
      return !editable || allFirmwareLatest || isFirmwareUpdateProcessing
    })
    .map(terminal => terminal.terminalId),
)

// 選択状態管理
const selectedTerminalsData = ref<Map<string, (typeof terminalsTableItems.value)[number]>>(new Map())
const selectedTerminalIds = computed(() => Array.from(selectedTerminalsData.value.keys()))

const selectableTerminalIds = computed(() =>
  terminalsTableItems.value.map(item => item.terminalId).filter(id => !disabledTerminalIds.value.includes(id)),
)
const checkboxDisabled = computed(() => selectedTerminalIds.value.length >= TERMINAL_MAX_SELECTABLE_LIMIT)
const areAllVisibleRowsSelected = computed(
  () =>
    selectableTerminalIds.value.length > 0 &&
    selectableTerminalIds.value.every(id => selectedTerminalIds.value.includes(id)),
)
const indeterminate = computed(() => selectedTerminalIds.value.length > 0 && !areAllVisibleRowsSelected.value)

const displayItems = computed(() => {
  if (isConfirmation.value) {
    return Array.from(selectedTerminalsData.value.values())
  }
  return terminalsTableItems.value
})

const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.update') : t('common.confirm')
  return { click, text }
})
const handleSubmit = async () => {
  await postTerminalBulkOperation(selectedTerminalIds.value, OperationTypes.FirmwareUpdate)
  getTerminalsBulkOperation()
  selectedTerminalsData.value = new Map()
  isConfirmation.value = false
}

const handleSelectAllClick = (checked: boolean) => {
  if (checked) {
    const addableCounts = TERMINAL_MAX_SELECTABLE_LIMIT - selectedTerminalIds.value.length
    const addableTerminalIds = selectableTerminalIds.value
      .filter(id => !selectedTerminalIds.value.includes(id))
      .slice(0, addableCounts)
    // 選択した端末のデータを保存
    addableTerminalIds.forEach(id => {
      const item = terminalsTableItems.value.find(item => item.terminalId === id)
      if (item) {
        selectedTerminalsData.value.set(id, item)
      }
    })
  } else {
    // 選択解除した端末のデータを削除
    terminalsTableItems.value.forEach(item => {
      selectedTerminalsData.value.delete(item.terminalId)
    })
  }
}

const handleSelectorClick = (checked: boolean, terminalId: string) => {
  if (checked) {
    // 選択した端末のデータを保存
    const item = terminalsTableItems.value.find(item => item.terminalId === terminalId)
    if (item) {
      selectedTerminalsData.value.set(terminalId, item)
    }
  } else {
    // 選択解除した端末のデータを削除
    selectedTerminalsData.value.delete(terminalId)
  }
}

const routeQuery = computed(() =>
  ['limit', 'page', 'terminalId', 'sortKey', 'direction'].reduce(
    (q, key) => {
      const value = route.query[key]
      if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
        if (key === 'page') {
          return Object.assign(q, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
        }
        return Object.assign(q, { [key]: Number(value) })
      } else if (key === 'terminalId') {
        if (typeof value === 'string') {
          return Object.assign(q, { [key]: [value] })
        } else {
          return Object.assign(q, { [key]: value })
        }
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
    { resourceStatus: [ResourceStatusTypes.Active] },
  ),
)

const handleSearch = () => {
  selectedTerminalsData.value = new Map()
  const newQuery = { ...terminalListQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, newQuery)) {
    getTerminalList(newQuery)
  } else {
    routerPushQuery(newQuery)
  }
}

watch(
  () => route.query,
  () => {
    terminalListQuery.value = routeQuery.value
    getTerminalList(routeQuery.value)
  },
  { immediate: true },
)

onBeforeMount(async () => {
  await getAllResourceSummaryTerminalList({
    terminalType: TerminalTypes.Rental,
    resourceStatus: [ResourceStatusTypes.Active],
  })
  getTerminalsBulkOperation()
})
</script>

<template>
  <div>
    <div v-if="!isConfirmation" class="flex-space-between-flex-end flex-wrap">
      <SearchFilter @search="handleSearch" @clear="handleQueryClear">
        <InputGrid :label="t('terminals.terminalId')" :label-width="180">
          <MultipleSelectForm
            :model-value="terminalListQuery?.terminalId ?? []"
            :options="terminalIdOptions"
            placeholder="Z000000001 / ルーター名1, Z000000002 / ルーター名2,..."
            @update:model-value="value => (terminalListQuery.terminalId = value.length > 0 ? value : undefined)"
          />
        </InputGrid>
      </SearchFilter>
    </div>
    <div v-else class="mb-6" data-cy="terminals-firmware-update-bulk-confirm-message">
      {{ t('firmwareUpdate.message.firmwareUpdateBulk') }}
    </div>

    <PaginationHeader
      v-if="!isConfirmation"
      :page="pagination.page"
      :limit="pagination.limit"
      :total="terminalList.total"
      :selected="{ max: TERMINAL_MAX_SELECTABLE_LIMIT, counts: selectedTerminalIds.length }"
      @update:limit="handleChangeLimit"
    />
    <SortableTable
      v-if="!loading"
      :items="displayItems"
      :headers="headers"
      :sort="sortOption"
      :unsortable-keys="unsortableKeys"
      :key-items="['terminalId']"
      data-cy="terminals-firmware-update-bulk-table"
      @sort="handleSort"
    >
      <template v-if="!isConfirmation" #header-selector>
        <div class="w-100 d-flex justify-center">
          <CheckboxBase
            :value="areAllVisibleRowsSelected"
            :indeterminate="indeterminate"
            :disabled="selectableTerminalIds.length === 0 || (checkboxDisabled && !areAllVisibleRowsSelected)"
            @update:value="handleSelectAllClick"
          />
        </div>
      </template>
      <template v-if="!isConfirmation" #selector="{ row }">
        <div class="w-100 d-flex justify-center">
          <CheckboxBase
            :value="selectedTerminalIds.includes(row.terminalId)"
            :disabled="
              disabledTerminalIds.includes(row.terminalId) ||
              (checkboxDisabled && !selectedTerminalIds.includes(row.terminalId))
            "
            @update:value="(checked: boolean) => handleSelectorClick(checked, row.terminalId)"
          />
        </div>
      </template>
      <template #terminalId="{ row }">
        <NuxtLink :to="`/tenants/${tenantId}/terminals/${row.terminalId}`">
          {{ row.terminalId }}
        </NuxtLink>
      </template>
      <template #customerNote="{ row }">
        <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
      </template>
      <template #firmwareVersion="{ row }">
        <div class="text-pre-wrap">
          {{ row.firmwareVersion }}
        </div>
      </template>
    </SortableTable>
    <PaginationFooter
      v-if="!isConfirmation"
      :page="pagination.page"
      :limit="pagination.limit"
      :total="terminalList.total"
      @update:page="handleChangePage"
    />

    <div class="flex-flex-end-center pt-5">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="loading || selectedTerminalIds.length === 0"
        :text="submit.text"
        :width="180"
        data-cy="terminals-firmware-update-bulk-submit-button"
        @click="submit.click"
      />
    </div>
  </div>
</template>
