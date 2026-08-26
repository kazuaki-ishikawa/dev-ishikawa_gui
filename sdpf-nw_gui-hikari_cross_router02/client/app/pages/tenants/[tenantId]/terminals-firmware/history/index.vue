<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { OperationTypes } from '@/api/terminals/constants'

definePageMeta({
  layout: 'firmware',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { terminalsBulkOperationsList, getTerminalsBulkOperationsList } = useGetTerminalsBulkOperationsList()

const headers = [
  { key: 'bulkOperationId', text: t('firmwareUpdate.bulkOperationId') },
  { key: 'status', text: t('firmwareUpdate.bulkUpdateResult'), width: 160 },
  { key: 'requestTime', text: t('firmwareUpdate.requestTime'), width: 200 },
  { key: 'completedTime', text: t('firmwareUpdate.completedTime'), width: 200 },
]

const items = computed(() => terminalsBulkOperationsList.value?.bulkOperations ?? [])

const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))

const handleChangeLimit = (limit?: number) => {
  router.push({ query: { ...route.query, limit: limit ?? 10, page: 1 } })
}

const handleChangePage = (page: number) => {
  router.push({ query: { ...route.query, page } })
}

watch(
  () => route.query,
  () => {
    getTerminalsBulkOperationsList({
      limit: pagination.value.limit,
      offset: pagination.value.page - 1,
      operation: OperationTypes.FirmwareUpdate,
    })
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <div class="text-xl mb-4">{{ t('firmwareUpdate.bulkHistoryList') }}</div>
    <PaginationHeader
      :page="pagination.page"
      :limit="pagination.limit"
      :total="terminalsBulkOperationsList?.total ?? 0"
      @update:limit="handleChangeLimit"
    />
    <StripedTable
      :headers="headers"
      :items="items"
      :key-items="['bulkOperationId']"
      data-cy="terminals-firmware-history-table"
    >
      <template #bulkOperationId="{ row }">
        <NuxtLink
          :to="`/tenants/${route.params.tenantId}/terminals-firmware/history/${row.bulkOperationId}`"
          :data-cy="`terminals-firmware-history-link-${row.bulkOperationId}`"
        >
          {{ row.bulkOperationId }}
        </NuxtLink>
      </template>
      <template #status="{ row }">
        <div>{{ t(`firmwareUpdate.operationStatus.${row.status}`) }}</div>
      </template>
      <template #requestTime="{ row }">
        <div>{{ formatDateTime(row.requestTime) }}</div>
      </template>
      <template #completedTime="{ row }">
        <div>{{ formatDateTime(row.completedTime) }}</div>
      </template>
    </StripedTable>
    <PaginationFooter
      :page="pagination.page"
      :limit="pagination.limit"
      :total="terminalsBulkOperationsList?.total ?? 0"
      @update:page="handleChangePage"
    />
  </div>
</template>
