<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TerminalsBulkOperationsStatusTypes } from '@/api/terminalsBulk/constants'

definePageMeta({
  layout: 'firmware',
})

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { loading } = useLoading()
const { terminalsTableItems, getTerminalList } = useGetTerminalList()
const { terminalsBulkOperations, getTerminalsBulkOperations } = useGetTerminalsBulkOperations()
const { deleteTerminalsBulkOperations } = useDeleteTerminalsBulkOperations()

const open = ref(false)
const disabled = computed(
  () => terminalsBulkOperations?.value?.status !== TerminalsBulkOperationsStatusTypes.Processing,
)

const headers = [
  { key: 'terminalId', text: t('terminals.terminalId'), width: 120, class: 'text-sm' },
  { key: 'customerNote', text: t('terminals.name'), class: 'text-sm' },
  { key: 'firmwareVersion', text: t('firmwareUpdate.firmwareVersion'), width: 220, class: 'text-sm' },
  { key: 'status', text: t('firmwareUpdate.firmwareUpdateResult'), width: 160, class: 'text-sm' },
  { key: 'completedTime', text: t('firmwareUpdate.completedTime'), width: 200, class: 'text-sm' },
]

const items = computed(() => {
  const operations = terminalsBulkOperations.value?.operations ?? []
  return operations.map(operation => {
    const terminal = terminalsTableItems.value.find(t => t.terminalId === operation.terminalId)
    return {
      terminalId: operation.terminalId,
      customerNote: terminal?.customerNote,
      firmwareVersion: terminal?.firmwareVersion,
      status: operation.status,
      completedTime: operation.completedTime,
    }
  })
})

const fetchData = async () => {
  await getTerminalsBulkOperations(route.params.id as string)
  const terminalIds = terminalsBulkOperations.value?.operations.map(op => op.terminalId) ?? []
  if (terminalIds.length > 0) {
    await getTerminalList({ terminalId: terminalIds, limit: 100 })
  }
}

const handleOpenDialog = async () => {
  await fetchData()
  open.value = true
}

const handleDelete = async () => {
  try {
    await deleteTerminalsBulkOperations(route.params.id as string)
    router.back()
  } finally {
    open.value = false
  }
}

onBeforeMount(() => {
  fetchData()
})
</script>

<template>
  <div>
    <div class="text-xl">{{ t('firmwareUpdate.bulkDetail') }}</div>
    <div class="flex-flex-end-center ga-4 mb-4">
      <CustomButton
        :text="t('firmwareUpdate.cancelInProgress')"
        icon="right-arrow"
        color="warning"
        :width="180"
        :disabled="disabled || loading"
        data-cy="terminals-firmware-history-id-cancel-in-progress-button"
        @click="handleOpenDialog"
      />
      <CustomButton
        :text="t('firmwareUpdate.refreshData')"
        icon="reload"
        color="primary"
        :width="180"
        :disabled="disabled || loading"
        data-cy="terminals-firmware-history-id-refresh-button"
        @click="fetchData"
      />
    </div>
    <StripedTable
      :headers="headers"
      :items="items"
      :key-items="['terminalId']"
      data-cy="terminals-firmware-history-id-table"
    >
      <template #terminalId="{ row }">
        <NuxtLink :to="`/tenants/${tenantId}/terminals/${row.terminalId}`">
          {{ row.terminalId }}
        </NuxtLink>
      </template>
      <template #customerNote="{ row }">
        <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
      </template>
      <template #firmwareVersion="{ row }">
        <div class="text-pre-wrap">{{ row.firmwareVersion }}</div>
      </template>
      <template #status="{ row }">
        <div>{{ t(`firmwareUpdate.operationStatus.${row.status}`) }}</div>
      </template>
      <template #completedTime="{ row }">
        <div>{{ formatDateTime(row.completedTime) }}</div>
      </template>
    </StripedTable>
    <div class="flex-flex-end-center pt-5">
      <CustomButton :text="t('common.return')" icon="left-arrow" color="info" :width="180" @click="router.back()" />
    </div>
    <DialogBase
      :open="open"
      :submit-label="t('firmwareUpdate.executeCancelInProgress')"
      :cancel-label="t('common.cancel')"
      cancel-icon="left-arrow"
      :cancel-width="200"
      submit-color="warning"
      :submit-width="200"
      :disabled="disabled || loading"
      data-cy="terminals-firmware-history-id-dialog"
      @close="() => (open = false)"
      @submit="handleDelete"
    >
      <div class="text-center text-lg pt-4">{{ t('firmwareUpdate.message.cancelInProgress') }}</div>
    </DialogBase>
  </div>
</template>
