<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import { HealthStatus } from '@/api/healthStatus/constants'
import type { MixedHealthStatusResponse } from '@/components/nova/monitoring/types'
import { RouteName } from '@/route/constants'

type PropType = {
  healthStatuses: MixedHealthStatusResponse[]
  reconcilingTerminalIds: Set<string>
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'reconcileStatus', terminalId: string): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const headers = computed(() => [
  { title: t('nova.monitoring.selfCheck'), key: 'selfCheck', minWidth: 120, sortable: false },
  { title: t('nova.details.siteName'), key: 'siteName', minWidth: 120, sortable: false },
  {
    title: `${t('nova.terminals.terminalId')}/${t('nova.terminals.customerNote')}/${t('nova.monitoring.terminalStatus')}`,
    key: 'terminalId',
    width: 210,
    sortable: false,
  },
  {
    title: `${t('nova.details.circuitId')}/${t('nova.details.circuitType')}/${t('nova.monitoring.internetCommunication')}`,
    key: 'circuitId',
    width: 210,
    sortable: false,
  },
  {
    title: `VPN ID/\n${t('nova.monitoring.vpnStatus')}`,
    key: 'vpnId',
    width: 210,
    sortable: false,
  },
  { title: t('nova.monitoring.reconcileStatus'), key: 'reconcileStatus', width: 150, sortable: false },
  { title: '', key: 'action', maxWidth: 180, sortable: false },
])
const headerWidthMap = computed(() =>
  headers.value.reduce<Map<string, number | undefined>>((acc, header) => {
    acc.set(header.key, header.width)
    return acc
  }, new Map<string, number | undefined>()),
)

const { getGuaranteeStatus, getVpnStatus } = useHealthStatus()

const tableItems = computed(() =>
  props.healthStatuses.map(row => {
    const isSwitchover = row.terminal.isSwitchover
    const guaranteeStatus = row.guarantee ? getGuaranteeStatus(row) : undefined
    // ギャランティステータスが warning で 迂回実行中の場合は 「迂回実行中」と表示する
    const guaranteeStatusText =
      guaranteeStatus === HealthStatus.Warning && isSwitchover ? t('terminals.isSwitchover') : undefined
    const vpnStatus = getVpnStatus(row)
    // VPNステータスが warning の時は「迂回実行中」と表示する
    const vpnStatusText = vpnStatus === HealthStatus.Warning ? t('terminals.isSwitchover') : undefined
    return {
      ...row,
      terminalPath: {
        name:
          row.terminal.terminalType === TerminalTypes.Rental
            ? RouteName.Terminal.Detail
            : RouteName.SelfTerminal.Detail,
        params: { tenantId: tenantId.value, id: row.terminal.terminalId },
      },
      isSwitchover,
      guaranteeStatus,
      guaranteeStatusText,
      vpnStatus,
      vpnStatusText,
      // ステータス再取得の通信中はボタンを非活性化する
      isReconcileDisabled: props.reconcilingTerminalIds.has(row.terminal.terminalId),
      circuitCounts: [!!row.guarantee, !!row.ipoe, !!row.mobile].filter(Boolean).length,
    }
  }),
)

const moveTo = (name: string, terminalId: string) => {
  return navigateTo({
    name,
    params: { id: terminalId, tenantId: tenantId.value },
  })
}
</script>

<template>
  <NovaDataTable :headers="headers" :items="tableItems" height="600px">
    <template #[`header.reconcileStatus`]="{ column }">
      <span class="d-inline-flex align-center ga-1">
        {{ column.title }}
        <NovaHelpTooltip size="15">
          {{ t('nova.monitoring.help.reconcileStatus') }}
        </NovaHelpTooltip>
      </span>
    </template>

    <template #[`item.selfCheck`]="{ item }">
      <NovaCustomButton
        outlined
        append-icon="mdi-chevron-right"
        size="small"
        :disabled="item.terminal.terminalType === TerminalTypes.Self"
        class="py-1"
        @click="moveTo(RouteName.Monitoring.SelfCheck, item.terminal.terminalId)"
      >
        <span class="text-pre-wrap text-left">{{ t('nova.monitoring.selfCheckButton') }}</span>
      </NovaCustomButton>
    </template>

    <template #[`item.terminalId`]="{ item }">
      <v-sheet :width="headerWidthMap.get('terminalId')" height="100%" class="operation-status-table-grid-column">
        <div class="flex-flex-start-center">
          <NuxtLink :to="item.terminalPath">
            {{ item.terminal.terminalId }}
          </NuxtLink>
        </div>
        <div :class="{ 'text-truncate': item.circuitCounts <= 1 }" :title="item.terminal.customerNote">
          {{ item.terminal.customerNote }}
        </div>
        <NovaStatusTag class="mb-1" :status="item.terminal.terminalStatus" />
      </v-sheet>
    </template>

    <template #[`item.circuitId`]="{ item }">
      <!-- ギャランティアクセス -->
      <v-sheet
        v-if="!!item.guarantee"
        :width="headerWidthMap.get('circuitId')"
        class="pb-1"
        :class="{ 'border-b-md': !!item.mobile || !!item.ipoe }"
      >
        <NuxtLink :to="{ name: RouteName.Guarantee.Detail, params: { tenantId, id: item.guarantee.guaranteeId } }">
          {{ item.guarantee.guaranteeId }}
        </NuxtLink>
        <div>{{ t('nova.resourceName.guarantee') }}</div>
        <div v-if="item.guaranteeStatus === 'none'">-</div>
        <NovaStatusTag v-else :status="item.guaranteeStatus" :text="item.guaranteeStatusText" />
      </v-sheet>
      <!-- ベストエフォートIPoEアクセス -->
      <v-sheet
        v-if="!!item.ipoe"
        :width="headerWidthMap.get('circuitId')"
        class="pb-1"
        :class="{ 'border-b-md': !!item.mobile }"
      >
        <NuxtLink :to="{ name: RouteName.Ipoe.Detail, params: { tenantId, id: item.ipoe.ipoeId } }">
          {{ item.ipoe.ipoeId }}
        </NuxtLink>
        <div>{{ t('nova.resourceName.ipoe') }}</div>
        <NovaStatusTag :status="item.ipoe.ipoeStatus" />
      </v-sheet>
      <!-- ワイヤレスアクセス -->
      <v-sheet v-if="!!item.mobile" :width="headerWidthMap.get('circuitId')" class="pb-1">
        <div>{{ item.mobile.mobileId }}</div>
        <div>{{ t('nova.resourceName.mobile') }}</div>
        <NovaStatusTag :status="item.mobile.mobileStatus" />
      </v-sheet>
    </template>

    <template #[`item.vpnId`]="{ item }">
      <v-sheet
        v-if="item.vpn"
        height="100%"
        :width="headerWidthMap.get('vpnId')"
        class="operation-status-table-grid-column"
      >
        <div class="flex-flex-start-center">
          <NuxtLink :to="{ name: RouteName.Vpn.Detail, params: { tenantId, id: item.vpn.vpnId } }">
            {{ item.vpn.vpnId }}
          </NuxtLink>
        </div>
        <div v-if="item.vpnStatus === 'none'">-</div>
        <NovaStatusTag v-else class="mb-1" :status="item.vpnStatus" :text="item.vpnStatusText" />
      </v-sheet>
      <div v-else class="ml-5">-</div>
    </template>

    <template #[`item.reconcileStatus`]="{ item }">
      <NovaCustomButton
        outlined
        append-icon="mdi-chevron-right"
        size="small"
        :disabled="item.isReconcileDisabled"
        class="py-1"
        @click="emits('reconcileStatus', item.terminal.terminalId)"
      >
        {{ t('nova.monitoring.reconcileStatus') }}
      </NovaCustomButton>
    </template>

    <template #[`item.action`]="{ item }">
      <NovaCustomButton
        outlined
        append-icon="mdi-chevron-right"
        size="small"
        class="py-1"
        @click="moveTo(RouteName.Monitoring.OperationStatusDetail, item.terminal.terminalId)"
      >
        {{ t('nova.common.detail') }}
      </NovaCustomButton>
    </template>
  </NovaDataTable>
</template>

<style lang="scss" scoped>
.operation-status-table-grid-column {
  display: flex;
  flex-direction: column;
  > * {
    flex: 1 1 0;
  }
  > div:last-of-type {
    flex: 0 0 auto;
  }
}
</style>
