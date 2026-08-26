<script setup lang="ts">
import dayjs from 'dayjs'
import * as Papa from 'papaparse'
import { useI18n } from 'vue-i18n'
import type { RinkLineGroupListType, RinkLineGroupListCurrentUsageType } from '@/api/rinkLineGroups/types'
import type { RinkLineListType } from '@/api/rinkLines/types'
import { TenantPages, RinkMobilePages } from '@/components/sidebar/constants'

type PropType = {
  rinkLineGroupList: RinkLineGroupListType[]
  rinkLineList: RinkLineListType[]
  rinkLineGroupListCurrentUsageMap: Map<string, RinkLineGroupListCurrentUsageType>
}

const props = defineProps<PropType>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const tenantId = computed(() => route.params.tenantId as string)
const rinkMobileId = computed(() => route.params.id as string)

const { downloadCsv } = useDownloadCsv()

const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))

const lineGroupHeaders = [
  {
    text: t('rinkLineGroups.lineGroupName'),
    key: 'lineGroupName',
  },
  {
    text: t('rinkLineGroups.lineCount'),
    key: 'lineCount',
    width: 150,
  },
  {
    text: t('rinkLineGroups.lineGroupLimit'),
    key: 'lineGroupLimit',
    width: 150,
  },
]
const lineGroupItems = computed(() => {
  return props.rinkLineGroupList.map(item => {
    const usageInfo = props.rinkLineGroupListCurrentUsageMap.get(item.lineGroupId)
    return {
      lineGroupName: item.lineGroupName,
      lineCount: t('rinkLineGroups.count', { count: item.lineCount }),
      lineGroupLimit:
        usageInfo?.totalLineGroupLimit === undefined
          ? '-'
          : convertByteToUsageUnit(usageInfo.totalLineGroupLimit, 'GB', 'floor'),
    }
  })
})

const lineHeaders = [
  { text: t('rinkLines.lineNumber'), key: 'lineNumber', width: 180 },
  { text: t('rinkLines.enabledAt'), key: 'enabledAt', width: 180 },
  { text: t('rinkLines.plan'), key: 'planName', width: 200, class: 'text-sm' },
  { text: t('rinkLines.accessType'), key: 'accessType', width: 150, class: 'text-sm' },
  { text: t('rinkLines.simNumber'), key: 'simNumber', width: 200 },
  { text: t('rinkLineGroups.lineGroupName'), key: 'lineGroupName', width: 200, class: 'text-sm' },
  { text: t('rinkLines.deviceName'), key: 'deviceName', width: 180, class: 'text-sm' },
  { text: 'IMEI', key: 'imei', width: 200 },
  { text: t('rinkLines.authenticationId'), key: 'authenticationId', width: 220 },
  { text: t('rinkLines.actIpAddress'), key: 'actIpAddress', width: 240, class: 'text-sm' },
  { text: t('rinkLines.sbyIpAddress'), key: 'sbyIpAddress', width: 240, class: 'text-sm' },
]

const lineItems = computed(() =>
  props.rinkLineList.map(line => ({
    lineNumber: line.lineNumber,
    enabledAt: formatDate(line.enabledAt),
    planName: line.planName,
    accessType: line.accessType,
    simNumber: line.simNumber,
    lineGroupName:
      props.rinkLineGroupList.find(lineGroup => lineGroup.lineGroupId === line.lineGroupId)?.lineGroupName || '-',
    deviceName: line.deviceName,
    imei: line.imei,
    authenticationId: line.authenticationId,
    actIpAddress: line.actIpAddress,
    sbyIpAddress: line.sbyIpAddress,
  })),
)

const handleChangeLimit = (limit: number) => {
  router.push({ query: { ...route.query, limit, page: 1 } })
}
const handleChangePage = (page: number) => {
  router.push({ query: { ...route.query, page } })
}

const tableItems = computed(() => {
  const startIndex = (pagination.value.page - 1) * pagination.value.limit
  const endIndex = startIndex + pagination.value.limit
  return lineItems.value.slice(startIndex, endIndex)
})

const formatCsvData = (data: typeof lineItems.value) => {
  return data.map(item => ({
    [t('rinkLines.lineNumber')]: item.lineNumber,
    [t('rinkLines.enabledAt')]: item.enabledAt,
    [t('rinkLines.plan')]: item.planName,
    [t('rinkLines.accessType')]: t(`rinkLines.accessTypes.${item.accessType}`),
    [t('rinkLines.simNumber')]: item.simNumber,
    [t('rinkLineGroups.lineGroupName')]: item.lineGroupName,
    [t('rinkLines.deviceName')]: item.deviceName,
    ['IMEI']: item.imei,
    [t('rinkLines.authenticationId')]: item.authenticationId,
    [t('rinkLines.actIpAddress')]: item.actIpAddress,
    [t('rinkLines.sbyIpAddress')]: item.sbyIpAddress,
  }))
}

const handleDownloadCsv = async () => {
  try {
    const fileName = `line_contracts_${dayjs().format('YYYYMMDD_HHmmss')}`
    const csv = Papa.unparse(formatCsvData(lineItems.value))
    await downloadCsv(csv, fileName)
  } catch {
    // ダウンロード失敗時は何もしない
  }
}
</script>

<template>
  <InnerCard :title="t('service.rinkLineGroups')">
    <SeparatedTable :headers="lineGroupHeaders" :items="lineGroupItems">
      <template #lineGroupName="{ row }">
        <NuxtLink
          class="pa"
          :to="`/tenants/${tenantId}/${TenantPages.RinkMobile}/${RinkMobilePages.LineGroups}?rinkMobileId=${rinkMobileId}`"
        >
          {{ row.lineGroupName }}
        </NuxtLink>
      </template>
    </SeparatedTable>
  </InnerCard>
  <div class="flex-space-between-center mb-4">
    <div class="text-lg">{{ t('service.rinkLines') }} {{ t('common.list') }}</div>
    <CustomButton
      icon="download"
      :text="t('common.download')"
      :width="180"
      :disabled="!lineItems.length"
      @click="handleDownloadCsv"
    />
  </div>
  <PaginationHeader
    :page="pagination.page"
    :limit="pagination.limit"
    :total="lineItems.length"
    @update:limit="handleChangeLimit"
  />
  <StripedTable :headers="lineHeaders" :items="tableItems" :key-items="['lineNumber']">
    <template #lineNumber="{ row }">
      <NuxtLink
        :to="`/tenants/${tenantId}/${TenantPages.RinkMobile}/${RinkMobilePages.Lines}/edit?rinkMobileId=${rinkMobileId}&lineNumber=${row.lineNumber}`"
      >
        {{ row.lineNumber }}
      </NuxtLink>
    </template>
    <template #planName="{ row }">
      <NuxtLink
        :to="`/tenants/${tenantId}/${TenantPages.RinkMobile}/${RinkMobilePages.Lines}/edit?rinkMobileId=${rinkMobileId}&lineNumber=${row.lineNumber}`"
      >
        {{ row.planName }}
      </NuxtLink>
    </template>
    <template #accessType="{ data }">
      {{ t(`rinkLines.accessTypes.${data}`) }}
    </template>
  </StripedTable>
  <PaginationFooter
    :page="pagination.page"
    :limit="pagination.limit"
    :total="lineItems.length"
    @update:page="handleChangePage"
  />
</template>

<style lang="scss" scoped>
.pa {
  padding: 0.625rem;
}
</style>
