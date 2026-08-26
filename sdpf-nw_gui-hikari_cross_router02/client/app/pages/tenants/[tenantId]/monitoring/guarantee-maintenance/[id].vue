<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SortDirectionTypes, TerminalTypes } from '@/api/constants'
import { TenantPages, GuaranteePages } from '@/components/sidebar/constants'
import type { SortOption } from '@/components/table/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const maintenanceId = computed(() => route.params.id as string)

const { getAllResourceSummaryGuaranteeList, resourceSummaryGuaranteeList } = useGetAllResourceSummaryGuaranteeList()
const { maintenances, getGuaranteeMaintenance } = useGuaranteeMaintenance()

const sortOption = ref<Partial<SortOption>>({})

const affectedCircuits = computed(
  () =>
    maintenances.value.find(maintenance => maintenance.maintenanceId === maintenanceId.value)?.affectedCircuits ?? [],
)

const tableHeaders = [
  { text: t('guarantees.guaranteeId'), key: 'guaranteeId', width: 160, class: 'text-sm' },
  { text: t('guarantees.customerNote'), key: 'customerNote', class: 'text-sm' },
  { text: t('guarantees.terminalType'), key: 'terminalType', width: 200, class: 'text-sm' },
  { text: t('guarantees.terminalId'), key: 'terminalId', width: 140 },
  { text: t('guarantees.physicalBandwidth'), key: 'physicalBandwidth', width: 120, class: 'text-sm' },
  { text: t('details.resourceStatus'), key: 'resourceStatus', width: 190, class: 'text-sm' },
  { text: t('guaranteeMaintenance.status'), width: 130, key: 'status' },
]

const tableItems = computed(() => {
  const items = affectedCircuits.value.map(circuit => {
    const found = resourceSummaryGuaranteeList.value?.guarantees?.find(
      guarantee => circuit.guaranteeId === guarantee.guaranteeId,
    )?.physicalBandwidth

    return {
      guaranteeId: circuit.guaranteeId,
      customerNote: circuit.customerNote,
      terminalType: circuit.terminalType ? t(`terminals.${circuit.terminalType}`) : '',
      terminalId: circuit.terminalId,
      terminalPath:
        circuit.terminalType === TerminalTypes.Rental && circuit.terminalId
          ? `/tenants/${tenantId.value}/${TenantPages.Terminals}/${circuit.terminalId}`
          : '',
      physicalBandwidth: found ?? '',
      resourceStatus: circuit.resourceStatus,
      status: circuit.switchover ? t('guaranteeMaintenance.switchoverTrue') : t('guaranteeMaintenance.switchoverFalse'),
    }
  })

  const { sortKey, direction } = sortOption.value
  if (!sortKey || !direction) {
    return items
  }

  return items.toSorted((a, b) => {
    const aValue = a[sortKey as keyof typeof a] ?? ''
    const bValue = b[sortKey as keyof typeof b] ?? ''
    if (aValue < bValue) {
      return direction === SortDirectionTypes.Asc ? -1 : 1
    }
    if (aValue > bValue) {
      return direction === SortDirectionTypes.Asc ? 1 : -1
    }
    return 0
  })
})

const handleSort = (option?: SortOption) => {
  sortOption.value = option ? { sortKey: option.sortKey, direction: option.direction } : {}
}

onBeforeMount(() => {
  getGuaranteeMaintenance()
  getAllResourceSummaryGuaranteeList()
})
</script>

<template>
  <CardContainer>
    <SortableTable
      :headers="tableHeaders"
      :items="tableItems"
      :sort="sortOption"
      :key-items="['guaranteeId']"
      @sort="handleSort"
    >
      <template #guaranteeId="{ row }">
        <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.Guarantees}/${GuaranteePages.Circuits}/${row.guaranteeId}`">
          {{ row.guaranteeId }}
        </NuxtLink>
      </template>
      <template #terminalId="{ row }">
        <NuxtLink v-if="row.terminalPath" :to="row.terminalPath">
          {{ row.terminalId }}
        </NuxtLink>
        <span v-else>{{ row.terminalId }}</span>
      </template>
    </SortableTable>
    <div class="flex-flex-end-center mt-4">
      <CustomButton :text="t('common.return')" :width="180" icon="left-arrow" color="info" @click="router.back()" />
    </div>
  </CardContainer>
</template>
