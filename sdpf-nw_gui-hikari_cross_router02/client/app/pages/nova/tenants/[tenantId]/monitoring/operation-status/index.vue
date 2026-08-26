<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'
import type { MixedHealthStatusResponse } from '@/components/nova/monitoring/types'

definePageMeta({
  name: RouteName.Monitoring.OperationStatus,
})

const { t } = useI18n()

const { loading } = useLoading()
const { terminalList, getAllTerminalList } = useGetAllTerminalList()
const { healthStatuses, getAllHealthStatusList } = useGetAllHealthStatusList()
const { reconcileTerminalStatus } = useReconcileTerminalStatus()
const { getGuaranteeStatus, getVpnStatus } = useHealthStatus()

const CircuitTypeList = ['terminal', 'mobile', 'ipoe', 'guarantee', 'vpn'] as const
const operationStatusTableQuery = ref<{
  customerNote: string
  circuitType: '' | (typeof CircuitTypeList)[number]
  resourceStatus: Array<'ok' | 'ng'>
}>({
  customerNote: '',
  circuitType: '',
  resourceStatus: [],
})
const pagination = ref({ page: 1, limit: 10 })

const filteredHealthStatuses = ref<MixedHealthStatusResponse[]>([])
const reconcilingTerminalIds = ref(new Set<string>())

const tableHealthStatuses = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.limit
  const end = start + pagination.value.limit
  return filteredHealthStatuses.value.slice(start, end)
})

const circuitTypeOptions = computed(() =>
  CircuitTypeList.map(value => ({
    text: t(`nova.resourceName.${value}`),
    value,
  })),
)
const resourceStatusOptions = computed(() => [
  { text: 'OK', value: 'ok' },
  { text: 'NG', value: 'ng' },
])

const handleQueryClear = () => {
  operationStatusTableQuery.value = {
    customerNote: '',
    circuitType: '',
    resourceStatus: [],
  }
}
const handleSearch = async () => {
  await Promise.all([getAllTerminalList(), getAllHealthStatusList()])
  const { customerNote, circuitType, resourceStatus } = operationStatusTableQuery.value

  const filtered = healthStatuses.value
    .map(healthStatus => {
      const found = terminalList.value.terminals.find(
        terminal => healthStatus.terminal.terminalId === terminal.terminalId,
      )
      const terminalType = found ? TerminalTypes.Rental : TerminalTypes.Self
      return {
        ...healthStatus,
        terminal: { ...healthStatus.terminal, terminalType, isSwitchover: !!found?.guarantee?.routeSwitch?.switchover },
      }
    })
    .filter(healthStatus => {
      const terms = [] as boolean[]
      if (circuitType === 'mobile' && !!healthStatus.mobile) {
        // サービス: ワイヤレスアクセス
        terms.push(resourceStatus.length === 0 || resourceStatus.includes(healthStatus.mobile.mobileStatus))
      } else if (circuitType === 'ipoe' && !!healthStatus.ipoe) {
        // サービス: IPoEアクセス
        terms.push(resourceStatus.length === 0 || resourceStatus.includes(healthStatus.ipoe.ipoeStatus))
      } else if (circuitType === 'vpn' && !!healthStatus.vpn) {
        // サービス: VPN
        terms.push(resourceStatus.length === 0 || resourceStatus.includes(getVpnStatus(healthStatus)))
      } else if (circuitType === 'guarantee' && !!healthStatus.guarantee) {
        // サービス: ギャランティアクセス
        terms.push(resourceStatus.length === 0 || resourceStatus.includes(getGuaranteeStatus(healthStatus)))
      } else {
        // サービス: ルーター or 未選択
        terms.push(
          (!circuitType || circuitType === 'terminal') &&
            (resourceStatus.length === 0 || resourceStatus.includes(healthStatus.terminal.terminalStatus)),
        )
      }
      if (customerNote) {
        const terminalCustomerNote = healthStatus.terminal.customerNote ?? ''
        terms.push(terminalCustomerNote.includes(customerNote))
      }
      return terms.every(term => term)
    })
  pagination.value.page = 1
  filteredHealthStatuses.value = filtered
}

const handleReconcileStatus = async (terminalId: string) => {
  if (reconcilingTerminalIds.value.has(terminalId)) {
    return
  }

  reconcilingTerminalIds.value = new Set(reconcilingTerminalIds.value).add(terminalId)
  try {
    await reconcileTerminalStatus(terminalId)
  } catch {
    // エラーは reconcileTerminalStatus 内で通知済みのため何もしない
  } finally {
    const nextReconcilingTerminalIds = new Set(reconcilingTerminalIds.value)
    nextReconcilingTerminalIds.delete(terminalId)
    reconcilingTerminalIds.value = nextReconcilingTerminalIds
  }
}

onBeforeMount(() => {
  handleSearch()
})
</script>

<template>
  <div>
    <NovaPageHeader />
    <v-card variant="outlined" color="#E0E0E0" class="my-5">
      <v-card-title class="text-title-medium font-weight-bold text-black bg-white">
        {{ t('nova.sideBar.core.operationStatus') }}
      </v-card-title>

      <NovaSearchFilter :disabled="loading" @clear="handleQueryClear" @search="handleSearch">
        <NovaSearchInput
          v-model="operationStatusTableQuery.customerNote"
          type="input"
          :label="t('nova.terminals.customerNote')"
        />
        <NovaSearchInput
          v-model="operationStatusTableQuery.circuitType"
          type="select"
          :options="circuitTypeOptions"
          :label="t('nova.details.circuitType')"
        />
        <NovaSearchInput
          v-model="operationStatusTableQuery.resourceStatus"
          type="checkbox"
          :options="resourceStatusOptions"
          :label="t('nova.details.resourceStatus')"
        />
      </NovaSearchFilter>

      <v-card-text class="text-interactive text-pre-wrap pt-0">
        {{ t('nova.monitoring.message.operationStatus') }}
      </v-card-text>

      <v-card-item>
        <NovaColorBorderCard
          :title="t('nova.sideBar.core.operationStatus')"
          color="primary"
          :elevation="1"
          class="mb-3"
        >
          <template #help>{{ t('nova.monitoring.help.operationStatus') }}</template>
          <NovaPaginationHeader
            v-model:limit="pagination.limit"
            v-model:page="pagination.page"
            :total="filteredHealthStatuses.length"
          />
          <NovaOperationStatusTable
            :health-statuses="tableHealthStatuses"
            :reconciling-terminal-ids="reconcilingTerminalIds"
            @reconcile-status="handleReconcileStatus"
          />
          <NovaPaginationNavigation
            v-model:page="pagination.page"
            :total="filteredHealthStatuses.length"
            :limit="pagination.limit"
            class="mt-6 mb-3"
          />
        </NovaColorBorderCard>

        <!-- FIC -->
        <NovaColorBorderCard title="FIC Routes" color="success" :elevation="1" class="mb-3">
          <NovaFicHealthStatusTable />
        </NovaColorBorderCard>
      </v-card-item>
    </v-card>

    <!-- アラート履歴 -->
    <NovaAlertHistory class="my-5" :terminal-list="terminalList" />
  </div>
</template>
