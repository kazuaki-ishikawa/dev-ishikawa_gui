<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import { IconTypes } from '@/components/icons/constants'
import { ServiceTypes, StatusTypes } from '@/components/monitoring/constants'
import type { QueryType, MixedHealthStatusResponse } from '@/components/monitoring/types'
import { TenantPages } from '@/components/sidebar/constants'

type ServiceType = Exclude<(typeof ServiceTypes)[number], 'fic-connection'>
const ServiceTypeList = ServiceTypes.filter(type => type !== 'fic-connection') as ServiceType[]
const LIMIT = 10
const operationStatusRef = ref<HTMLElement>()
const alertHistoryRef = ref<HTMLElement>()

const { t } = useI18n()
const route = useRoute()

const tenantId = computed(() => route.params.tenantId as string)
const query = ref<{ service?: ServiceType; status: string[]; keyword: string }>({ status: [], keyword: '' })
const page = ref(1)
const filteredHealthStatuses = ref<MixedHealthStatusResponse[]>([])

const { loading } = useLoading()

const { terminalList, getAllTerminalList } = useGetAllTerminalList()
const { moveToDetail, moveToSelfCheck, moveToFicRoutes, getGuaranteeStatus, getVpnStatus } = useHealthStatus()
const { reconcileTerminalStatus } = useReconcileTerminalStatus()
const reconcilingTerminalIds = ref(new Set<string>())
const { healthStatuses, getAllHealthStatusList } = useGetAllHealthStatusList()
const handleSearch = async () => {
  await Promise.all([getAllTerminalList(), getAllHealthStatusList()])

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
      if (query.value.service === 'mobile' && !!healthStatus.mobile) {
        // サービス: ワイヤレスアクセス
        terms.push(query.value.status.length === 0 || query.value.status.includes(healthStatus.mobile.mobileStatus))
      } else if (query.value.service === 'ipoe' && !!healthStatus.ipoe) {
        // サービス: IPoEアクセス
        terms.push(query.value.status.length === 0 || query.value.status.includes(healthStatus.ipoe.ipoeStatus))
      } else if (query.value.service === 'vpn' && !!healthStatus.vpn) {
        // サービス: VPN
        terms.push(query.value.status.length === 0 || query.value.status.includes(getVpnStatus(healthStatus)))
      } else if (query.value.service === 'guarantee' && !!healthStatus.guarantee) {
        // サービス: ギャランティアクセス
        terms.push(query.value.status.length === 0 || query.value.status.includes(getGuaranteeStatus(healthStatus)))
      } else {
        // サービス: ルーター or 未選択
        terms.push(
          (!query.value.service || query.value.service === 'terminal') &&
            (query.value.status.length === 0 || query.value.status.includes(healthStatus.terminal.terminalStatus)),
        )
      }
      if (query.value.keyword) {
        const customerNote = healthStatus.terminal.customerNote ?? ''
        terms.push(customerNote.includes(query.value.keyword))
      }
      return terms.every(term => term)
    })
  page.value = 1
  filteredHealthStatuses.value = filtered
}

const { ficHealthStatuses, getFicHealthStatusList } = useGetFicHealthStatusList()
const { ficConnectionBgpSessionList, getFicConnectionBgpSessionList } = useGetFicConnectionBgpSessionList()
const { resetFicConnectionBgpSession } = useResetFicConnectionBgpSession()
const { alertHeaders, alertItems, alertSortOption, sortAlert, getAlertList } = useGetAlertList()
const convertedAlertItems = computed(() =>
  alertItems.value.map(alert => {
    const found = terminalList.value.terminals.find(terminal => alert.terminalId === terminal.terminalId)
    const pathType = found ? TenantPages.Terminals : TenantPages.SelfTerminals
    return {
      ...alert,
      terminalPath: `/tenants/${tenantId.value}/${pathType}/${alert.terminalId}`,
    }
  }),
)

const ficConnectionIds = computed(() => ficHealthStatuses.value.map(fic => fic.ficId))
watch(ficConnectionIds, next => {
  getFicConnectionBgpSessionList(next)
})

const handleResetBgpSession = async (ficConnectionId: string) => {
  const data = await resetFicConnectionBgpSession(ficConnectionId)
  // reset 後の値更新
  ficConnectionBgpSessionList.value = ficConnectionBgpSessionList.value.map(item =>
    item.ficConnectionId === data.ficConnectionId ? data : item,
  )
}

const handleQueryUpdate = (newQuery: QueryType) => {
  if (Array.isArray(newQuery.service)) {
    return
  }
  const service = ServiceTypeList.find(key => newQuery.service === key)
  query.value = { ...query.value, service, keyword: newQuery.keyword }
}
const handleQueryClear = () => {
  query.value = { service: undefined, status: [], keyword: '' }
}

const tableHealthStatuses = computed(() => {
  const start = (page.value - 1) * LIMIT
  const end = start + LIMIT
  return filteredHealthStatuses.value.slice(start, end)
})

const statusOptions = computed(() => StatusTypes.map(value => ({ value, text: t(`alerts.${value}`) })))
const statusText = computed(() => {
  const statuses = query.value.status.map(
    status => statusOptions.value.find(option => option.value === status)?.text ?? '',
  )
  return statuses.join(', ')
})
const handleStatusChange = (value: string) => {
  const current = query.value.status.includes(value)
  const status = current ? query.value.status.filter(status => status !== value) : query.value.status.concat([value])
  query.value = { ...query.value, status }
}

const scrollToAnchor = (element?: HTMLElement) => {
  const top = element?.offsetTop ?? 0
  scrollTo({ top, behavior: 'smooth' })
}

const handleMoveToDetail = (terminalId: string) => {
  moveToDetail(tenantId.value, terminalId)
}
const handleMoveToSelfCheck = (terminalId: string) => {
  moveToSelfCheck(tenantId.value, terminalId)
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
const moveToAlertDetails = async () => {
  await navigateTo(`/tenants/${tenantId.value}/monitoring/alert-details`)
}

onBeforeMount(() => {
  getFicHealthStatusList()
  getAlertList()
  handleSearch()
})
</script>

<template>
  <div>
    <!-- アンカーボタン -->
    <div class="mb-3 flex-flex-start-center">
      <AnchorButton
        class="mr-3"
        :icon="IconTypes.OperationStatus"
        :label="t('sideBar.operationStatus')"
        @click="scrollToAnchor(operationStatusRef)"
      />
      <AnchorButton
        :icon="IconTypes.Alert"
        :label="t('monitorings.alertHistory')"
        @click="scrollToAnchor(alertHistoryRef)"
      />
    </div>
    <CardContainer class="mb-5">
      <div ref="operationStatusRef" class="mb-3 flex-flex-start-center">
        <SvgIcon :type="IconTypes.OperationStatus" color="secondary" />
        <div class="flex-grow-1 ml-2 text-lg">{{ t('sideBar.operationStatus') }}</div>
      </div>

      <!-- 検索 -->
      <MonitoringFilter
        :service-type-list="ServiceTypeList"
        :query="query"
        @update:query="handleQueryUpdate"
        @clear="handleQueryClear"
        @search="handleSearch"
      >
        <template #input>
          <div class="pr-2">{{ t('monitorings.resourceStatus') }}</div>
          <div v-for="option in statusOptions" :key="option.value" class="flex-flex-start-center">
            <CheckboxBase
              :value="query.status.includes(option.value)"
              @update:value="handleStatusChange(option.value)"
            />
            <div class="px-2 cursor-pointer" @click="handleStatusChange(option.value)">{{ option.text }}</div>
          </div>
        </template>
        <template #text>
          <span>{{ t('monitorings.resourceStatus') }}</span>
          <span class="px-1">:</span>
          <span>{{ statusText }}</span>
        </template>
      </MonitoringFilter>

      <InnerCard>
        <!-- 運用状況一覧 テーブル -->
        <div class="mb-4">{{ t('monitorings.terminalIdDescription') }}</div>
        <div class="mb-6 text-pre-wrap">{{ t('monitorings.selfCheckDescription') }}</div>
        <OperationStatusTable
          :health-statuses="tableHealthStatuses"
          :reconciling-terminal-ids="reconcilingTerminalIds"
          @move-to-detail="handleMoveToDetail"
          @move-to-self-check="handleMoveToSelfCheck"
          @reconcile-status="handleReconcileStatus"
        />
        <!-- ページネーション -->
        <PaginationFooter v-model:page="page" :limit="LIMIT" :total="filteredHealthStatuses.length" class="my-4" />
        <!-- FIC -->
        <FicHealthStatusTable
          :fic-health-statuses="ficHealthStatuses"
          :fic-connection-bgp-session-list="ficConnectionBgpSessionList"
          @reset-bgp-session="handleResetBgpSession"
          @move-to-fic-routes="(ficId: string) => moveToFicRoutes(tenantId, ficId)"
        />
      </InnerCard>
    </CardContainer>

    <!-- アラート履歴 -->
    <CardContainer>
      <div ref="alertHistoryRef" class="flex-flex-start-center mb-2">
        <SvgIcon class="pt-1" :type="IconTypes.Alert" color="secondary" />
        <div class="mx-2 text-lg">{{ t('monitorings.alertHistory') }}</div>
        <div class="flex-grow-1 text-sm">{{ t('monitorings.latest') }}</div>
        <CustomButton icon="right-arrow" :text="t('monitorings.more')" :width="180" @click="moveToAlertDetails" />
      </div>
      <div v-show="loading" class="text-center font-weight-bold text-xl">{{ t('pagination.dataLoading') }}</div>
      <SortableTable
        :headers="alertHeaders"
        :items="convertedAlertItems"
        :key-items="['timestamp', 'alertName', 'terminalId']"
        :sort="alertSortOption"
        @sort="sortAlert"
      >
        <template #terminalId="{ row }">
          <NuxtLink v-if="!!row.terminalPath" :to="row.terminalPath">{{ row.terminalId }}</NuxtLink>
          <span v-else>{{ row.terminalId }}</span>
        </template>
        <template #resourceId="{ row }">
          <NuxtLink :to="row.resourceLink"> {{ row.resourceId }} </NuxtLink>
        </template>
        <template #customerNote="{ row }">
          <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
        </template>
      </SortableTable>
    </CardContainer>
  </div>
</template>
