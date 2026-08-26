<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CircuitTypes, TerminalTypes } from '@/api/constants'
import type { ResourceSummaryTerminalListResponse, PrimaryCircuitType } from '@/api/terminals/types'
import { TenantPages } from '@/components/sidebar/constants'
import type { SortOption } from '@/components/table/types'

type PropType = {
  terminalList: ResourceSummaryTerminalListResponse
  tenantId: string
  page: number
  limit: number
  sortOption: Partial<SortOption>
}
const props = defineProps<PropType>()
const checkedId = defineModel<string>('checkedId', { required: true })
type Emits = {
  (e: 'change', data: { page: number; limit?: number; sortOption?: Partial<SortOption> }): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const tableHeaders = [
  { text: '', key: 'selector', width: 80 },
  { text: t('terminals.terminalId'), key: 'terminalId', width: 150 },
  { text: t('terminals.name'), key: 'terminalName' },
  { text: t('terminals.circuitPriority'), key: 'circuitPriority', width: 200 },
  { text: t('terminals.circuitId'), key: 'circuitId', width: 150 },
  { text: t('terminals.circuitType'), key: 'circuitType', width: 260 },
]
const tableItems = computed(() => {
  const trends = props.terminalList.terminals.map(terminal => {
    return {
      selector: terminal.terminalId,
      terminalId: terminal.terminalId,
      terminalType: terminal.terminalType,
      terminalName: terminal.customerNote,
      circuitPriority: {
        main: t('monitorings.main'),
        backup: terminal.secondaryCircuit ? t('monitorings.backup') : '-',
      },
      circuitId: {
        primary: terminal.primaryCircuit.circuitId,
        secondary: terminal.secondaryCircuit?.circuitId,
      },
      circuitType: {
        primary: terminal.primaryCircuit.circuitType,
        secondary: terminal.secondaryCircuit?.circuitType,
      },
    }
  })
  return trends ?? []
})

const handleChangeLimit = (limit?: number) => {
  emits('change', { page: 1, limit, sortOption: props.sortOption })
}
const handleChangePage = (page: number) => {
  emits('change', { page, limit: props.limit, sortOption: props.sortOption })
}
const getCircuitLink = (type: PrimaryCircuitType | undefined, id: string) => {
  if (type === CircuitTypes.Ipoe) {
    return `/tenants/${props.tenantId}/ipoes/${id}`
  } else if (type === CircuitTypes.Guarantee) {
    return `/tenants/${props.tenantId}/guarantees/circuits/${id}`
  }
}
</script>

<template>
  <div>
    <PaginationHeader :page="page" :limit="limit" :total="terminalList?.total" @update:limit="handleChangeLimit" />
    <StripedTable :headers="tableHeaders" :items="tableItems" :key-items="['terminalId']">
      <template #selector="{ row }">
        <div class="radio h-100 w-100" :class="{ checked: checkedId === row.terminalId }">
          <div class="button" @click="checkedId = row.terminalId" />
        </div>
      </template>
      <template #terminalId="{ row }">
        <NuxtLink
          :to="`/tenants/${tenantId}/${row.terminalType === TerminalTypes.Rental ? TenantPages.Terminals : TenantPages.SelfTerminals}/${row.terminalId}`"
        >
          {{ row.terminalId }}
        </NuxtLink>
      </template>
      <template #terminalName="{ row }">
        <div class="text-truncate" :title="row.terminalName">{{ row.terminalName }}</div>
      </template>
      <template #circuitPriority="{ row }">
        <div>
          <div class="h-28px">{{ row.circuitPriority.main }}</div>
          <div class="h-28px">{{ row.circuitPriority.backup }}</div>
        </div>
      </template>
      <template #circuitId="{ row }">
        <div>
          <div class="h-28px">
            <NuxtLink
              v-if="row.circuitId.primary && row.circuitType.primary !== CircuitTypes.Mobile"
              :to="getCircuitLink(row.circuitType.primary, row.circuitId.primary)"
            >
              {{ row.circuitId.primary }}
            </NuxtLink>
            <span v-else>{{ row.circuitId.primary || '-' }}</span>
          </div>
          <div class="h-28px">
            <NuxtLink
              v-if="row.circuitId.secondary && row.circuitType.secondary !== CircuitTypes.Mobile"
              :to="getCircuitLink(row.circuitType.secondary, row.circuitId.secondary)"
            >
              {{ row.circuitId.secondary }}
            </NuxtLink>
            <span v-else>{{ row.circuitId.secondary || '-' }}</span>
          </div>
        </div>
      </template>
      <template #circuitType="{ row }">
        <div>
          <div class="h-28px">{{ row.circuitType.primary ? t(`service.${row.circuitType.primary}`) : '-' }}</div>
          <div class="h-28px">
            {{ row.circuitType.secondary ? t(`service.${row.circuitType.secondary}`) : '-' }}
          </div>
        </div>
      </template>
    </StripedTable>
    <PaginationFooter :page="page" :limit="limit" :total="terminalList?.total" @update:page="handleChangePage" />
  </div>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));

.h-28px {
  height: 28px;
}

.radio {
  position: relative;

  &.checked .button {
    border: 1px solid $secondary-color;
    &::after {
      width: 12px;
      height: 12px;
    }
  }

  .button {
    cursor: pointer;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid $info-color;
    position: absolute;
    top: 17px;
    left: 15px;
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
