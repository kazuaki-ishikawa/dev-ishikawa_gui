<script setup lang="ts">
import { difference, intersection } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes, SecurityOptionTypes } from '@/api/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { TERMINAL_MAX_SELECTABLE_LIMIT } from '@/api/terminals/constants'
import {
  ThreatDetectionSharedBillingMethodTypes,
  ThreatDetectionSharedTerminalDirectionTypes,
  ThreatDetectionSharedRequestTypes,
} from '@/api/threatDetectionShared/constants'
import type { MultiLevelHeaderType, SortOption } from '@/components/table/types'
import { TenantPages } from '@/components/sidebar/constants'

const Steps = {
  InputAuthKey: 1,
  SelectTerminal: 2,
}

const route = useRoute()
const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()
const tenantId = computed(() => route.params.tenantId as string)

const { securityTermsOfServiceAccepted, moveToSecurityTermOfService } = useTermsOfService(
  TermsOfServiceBasePath.Security,
)
const { tenantReferenceAuthKeySearchResponse, tenantReferenceAuthKeySearch } = useTenantReferenceAuthKeySearch()
const { allThreatDetectionSharedTenantList, getAllThreatDetectionSharedTenantList } =
  useGetAllThreatDetectionSharedTenantList()
const { postThreatDetectionSharedRequest } = usePostThreatDetectionSharedRequest()
const {
  terminalTableList,
  terminalTableQuery,
  terminalSortOption,
  terminalTablePagination,
  terminalTableItems,
  getTerminalTableList,
} = useGetTerminalTableList()
const {
  getTrafficReportFlowAnalyzerPlanText,
  getFlowCollectorPlanText,
  getThreatDetectionPlanText,
  getBehaviorDetectionPlanText,
} = useTerminalInput()

const { billingMethodOptions } = useThreatDetectionShared()
const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const step = ref(Steps.InputAuthKey)
const isInputStep = computed(() => step.value === Steps.InputAuthKey)

const authKey = ref({ input: '', valid: false })
const billingMethod = ref('')

// APIで絞り込まれているはずなので providedTerminals と特定される
const providedTerminals = computed(() => allThreatDetectionSharedTenantList.value?.terminals ?? [])
const billingMethodDisabled = computed(() => !!providedTerminals.value[0]?.billingMethod)
const submitDisabled = computed(() => !billingMethod.value || selectedTerminalIds.value.length === 0 || loading.value)

const multiLevelHeaders: MultiLevelHeaderType[][] = [
  [
    { key: undefined, text: '', colSpan: 1, class: 'text-sm' },
    { key: undefined, text: t('terminals.routerRelatedInformation'), colSpan: 4, class: 'text-sm' },
    { key: undefined, text: t('terminals.routeOptionInformation'), colSpan: 4, class: 'text-sm' },
    { key: undefined, text: t('terminals.routerDetailInformation'), colSpan: 8, class: 'text-sm' },
  ],
  [
    // チェックボックス
    { key: 'selector', text: '', colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm' },

    // ルーター紐づけ情報
    { key: 'terminalId', text: t('terminals.terminalId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    {
      key: 'terminalType',
      text: t('guarantees.terminalType'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm mr-1',
    },
    { key: 'customerNote', text: t('terminals.name'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    {
      key: 'shared',
      text: t('threatDetectionStartSharing.sharedState'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm',
    },

    // オプション情報
    {
      key: 'threatDetectionPlan',
      text: t('terminals.threatDetectionPlan'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm mr-1',
    },
    {
      key: 'flowCollectorPlan',
      text: t('terminals.flowCollectorPlan'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-sm mr-1',
    },
    {
      key: 'behaviorDetectionPlan',
      text: t('terminals.behaviorDetection'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-sm mr-1',
    },
    {
      key: 'trafficReportFlowAnalyzerPlan',
      text: t('terminals.trafficReportFlowAnalyzerPlanOptions'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-xs mr-1',
    },

    // ルーター詳細情報
    {
      key: 'resourceStatus',
      text: t('details.resourceStatus'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-sm mr-1',
    },
    { key: undefined, text: t('terminals.primary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
    { key: undefined, text: t('terminals.secondary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
    { key: 'vpnId', text: t('terminals.vpnId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm' },
    { key: 'orderId', text: t('details.orderId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    { key: 'updateTime', text: t('details.updateTime'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
  ],
  [
    { key: 'primaryCircuit', text: t('terminals.circuitType'), colSpan: 1, rowSpan: 1, bottom: true, class: 'text-sm' },
    { key: 'primaryCircuitId', text: t('terminals.circuitId'), colSpan: 1, rowSpan: 1, bottom: true, class: 'text-sm' },
    {
      key: 'secondaryCircuit',
      text: t('terminals.circuitType'),
      colSpan: 1,
      rowSpan: 1,
      bottom: true,
      class: 'text-sm',
    },
    {
      key: 'secondaryCircuitId',
      text: t('terminals.circuitId'),
      colSpan: 1,
      rowSpan: 1,
      bottom: true,
      class: 'text-sm',
    },
  ],
]
const columnWidth = [
  { key: 'selector', width: 75 },
  { key: 'terminalId', width: 125 },
  { key: 'terminalType', width: 145 },
  { key: 'customerNote', width: 184 },
  { key: 'shared', width: 80 },
  { key: 'threatDetectionPlan', width: 120 },
  { key: 'flowCollectorPlan', width: 120 },
  { key: 'behaviorDetectionPlan', width: 112 },
  { key: 'trafficReportFlowAnalyzerPlan', width: 180 },
  { key: 'resourceStatus', width: 120 },
  { key: 'primaryCircuit', width: 144 },
  { key: 'primaryCircuitId', width: 121 },
  { key: 'secondaryCircuit', width: 144 },
  { key: 'secondaryCircuitId', width: 121 },
  { key: 'vpnId', width: 176 },
  { key: 'orderId', width: 136 },
  { key: 'updateTime', width: 146 },
]
const slotNames = [
  'selector',
  'terminalId',
  'terminalType',
  'customerNote',
  'shared',
  'threatDetectionPlan',
  'flowCollectorPlan',
  'behaviorDetectionPlan',
  'trafficReportFlowAnalyzerPlan',
  'resourceStatus',
  'primaryCircuit',
  'primaryCircuitId',
  'secondaryCircuit',
  'secondaryCircuitId',
  'vpnId',
  'orderId',
  'updateTime',
]

const items = computed(() =>
  terminalTableItems.value.map(terminal => {
    // 脅威検知オプションが「利用なし」の場合、共有済みのルーターは選択不可とする
    const isShared = providedTerminals.value?.some(shared => shared.terminalId === terminal.terminalId)
    const unselectable = isShared || terminal.threatDetectionPlan === SecurityOptionTypes.NoSubscription
    return {
      ...terminal,
      shared: isShared ? t('threatDetectionStartSharing.shared') : '',
      selector: selectedTerminalIds.value.includes(terminal.terminalId),
      selectable: !unselectable,
    }
  }),
)

const selectedTerminalIds = ref<string[]>([])
const selectableTableTerminalIdList = computed(() =>
  items.value.filter(item => item.selectable).map(item => item.terminalId),
)
const areAllVisibleRowsSelected = computed(
  () =>
    // テーブルに表示してる端末が全て選択されているかどうか
    !!selectableTableTerminalIdList.value.length &&
    selectableTableTerminalIdList.value.every(terminalId => selectedTerminalIds.value.includes(terminalId)),
)
const indeterminate = computed(() => selectedTerminalIds.value.length > 0)
const checkboxDisabled = computed(() => selectedTerminalIds.value.length >= TERMINAL_MAX_SELECTABLE_LIMIT)
const addableCounts = computed(() => TERMINAL_MAX_SELECTABLE_LIMIT - selectedTerminalIds.value.length)

const handleSelectAllClick = (checked: boolean) => {
  if (checked) {
    // テーブル表示上の選択可能な端末IDだけ取得する
    const newIds = difference(
      selectableTableTerminalIdList.value,
      intersection(selectedTerminalIds.value, selectableTableTerminalIdList.value),
    )
    // 選択可能な上限を超える場合は選択可能な数だけ追加する
    if (newIds.length > addableCounts.value) {
      selectedTerminalIds.value = [...selectedTerminalIds.value, ...newIds.slice(0, addableCounts.value)]
    } else {
      selectedTerminalIds.value = [...selectedTerminalIds.value, ...newIds]
    }
  } else {
    selectedTerminalIds.value = difference(selectedTerminalIds.value, selectableTableTerminalIdList.value)
  }
}
const handleSelectorClick = (checked: boolean, id: string) => {
  if (checked) {
    selectedTerminalIds.value = [...selectedTerminalIds.value, id]
  } else {
    selectedTerminalIds.value = selectedTerminalIds.value.filter(terminalId => terminalId !== id)
  }
}

const handleChangeLimit = (limit: number) => {
  getTerminalTableList({ ...terminalTableQuery.value, offset: 0, limit })
}
const handleSort = (option?: SortOption) => {
  getTerminalTableList({ ...terminalTableQuery.value, sortKey: option?.sortKey, direction: option?.direction })
}
const handleChangePage = (page: number) => {
  getTerminalTableList({ ...terminalTableQuery.value, offset: page - 1 })
}

const handleClear = () => {
  authKey.value = { input: '', valid: false }
}
const handleAuthKeySearch = async () => {
  try {
    await tenantReferenceAuthKeySearch({ key: authKey.value.input })
    await getAllThreatDetectionSharedTenantList({
      sharedTenantId: tenantReferenceAuthKeySearchResponse.value?.tenantId,
      terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Provided,
    })
    getTerminalTableList({
      limit: 10,
      offset: 0,
      resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive],
    })
    step.value = Steps.SelectTerminal
    billingMethod.value = providedTerminals.value[0]?.billingMethod || ''
  } catch {
    // 何もしない
  }
}

const handleCancel = () => {
  step.value = Steps.InputAuthKey
  billingMethod.value = ''
  authKey.value = { input: '', valid: false }
  selectedTerminalIds.value = []
}
const handleSubmit = async () => {
  const foundBillingMethod = Object.values(ThreatDetectionSharedBillingMethodTypes).find(
    method => method === billingMethod.value,
  )
  if (!foundBillingMethod || !tenantReferenceAuthKeySearchResponse.value?.tenantId) {
    // 想定外の値が選択されている場合は何もしない
    return
  }
  try {
    await postThreatDetectionSharedRequest({
      key: authKey.value.input,
      sharedTenantId: tenantReferenceAuthKeySearchResponse.value.tenantId,
      terminalIds: selectedTerminalIds.value,
      billingMethod: foundBillingMethod,
      requestType: ThreatDetectionSharedRequestTypes.Start,
    })
    // 全て初期化
    handleCancel()
  } catch {
    // 何もしない
  }
}
</script>

<template>
  <CardContainer>
    <div class="flex-space-between-center">
      <div class="text-lg mb-4">{{ t('threatDetectionShared.startSharing') }}</div>
      <CustomButton
        v-if="!securityTermsOfServiceAccepted"
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        class="ml-auto"
        data-cy="security-contracts-threat-detection-shared-start-sharing-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
    </div>
    <div
      v-if="!securityTermsOfServiceAccepted"
      class="text-warning mb-4"
      data-cy="security-contracts-threat-detection-shared-start-sharing-terms-of-service-message"
    >
      {{ t('threatDetectionShared.message.requiredSecurityAccepted') }}
    </div>

    <!-- 認証キーの入力 -->
    <InnerCard :title="t('threatDetectionStartSharing.inputAuthKey')">
      <template #description>
        <div class="mt-2">{{ t('threatDetectionStartSharing.message.authKey') }}</div>
      </template>
      <InputGrid v-if="isInputStep" required :label="t('threatDetectionStartSharing.authKey')">
        <InputForm
          v-model="authKey.input"
          placeholder="入力"
          required
          :rules="[rules.authKey]"
          :maxlength="64"
          :disabled="!securityTermsOfServiceAccepted"
          size="large"
          data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"
          @valid="valid => (authKey.valid = valid)"
        />
      </InputGrid>
      <DetailGrid v-else>
        <div>{{ t('threatDetectionStartSharing.authKey') }}</div>
        <div class="break-all" data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key">
          {{ authKey.input }}
        </div>
      </DetailGrid>

      <div v-if="isInputStep" class="flex-flex-end-center ga-6 mt-4">
        <ClearButton :text="t('search.clear')" :width="180" @click="handleClear" />
        <CustomButton
          :text="t('search.button')"
          :width="180"
          icon="search"
          :disabled="!securityTermsOfServiceAccepted || !authKey.valid || loading"
          data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-search-button"
          @click="handleAuthKeySearch"
        />
      </div>
    </InnerCard>

    <template v-if="!isInputStep">
      <!-- テナント -->
      <InnerCard :title="t('threatDetectionStartSharing.tenant')">
        <DetailGrid>
          <div>{{ t('details.tenantId') }}</div>
          <div data-cy="security-contracts-threat-detection-shared-start-sharing-tenant-id">
            {{ tenantReferenceAuthKeySearchResponse?.tenantId }}
          </div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('threatDetectionStartSharing.contractorName') }}</div>
          <div data-cy="security-contracts-threat-detection-shared-start-sharing-contractor-name">
            {{ tenantReferenceAuthKeySearchResponse?.contractorName }}
          </div>
        </DetailGrid>
      </InnerCard>

      <!-- 課金パターン選択 -->
      <InnerCard :title="t('threatDetectionStartSharing.billingMethod')">
        <RadioForm
          v-model="billingMethod"
          :options="billingMethodOptions"
          :disabled="billingMethodDisabled"
          class="mt-4"
          data-cy="security-contracts-threat-detection-shared-start-sharing-billing-method"
        />
      </InnerCard>

      <!-- テーブル -->
      <PaginationHeader
        :page="terminalTablePagination.page"
        :limit="terminalTablePagination.limit"
        :total="terminalTableList?.total ?? 0"
        :selected="{ max: TERMINAL_MAX_SELECTABLE_LIMIT, counts: selectedTerminalIds.length }"
        @update:limit="handleChangeLimit"
      />
      <MultiLevelHeaderSortableTable
        :multi-level-headers="multiLevelHeaders"
        :column-widths="columnWidth"
        :items="items"
        :slot-names="slotNames"
        :key-items="['terminalId']"
        :sort="terminalSortOption"
        :unsortable-keys="[
          'selector',
          'shared',
          'primaryCircuit',
          'primaryCircuitId',
          'secondaryCircuit',
          'secondaryCircuitId',
        ]"
        @sort="handleSort"
      >
        <template #header-selector>
          <div class="w-100 d-flex justify-center">
            <CheckboxBase
              :value="areAllVisibleRowsSelected"
              :indeterminate="indeterminate"
              :disabled="selectableTableTerminalIdList.length === 0 || (checkboxDisabled && !areAllVisibleRowsSelected)"
              data-cy="security-contracts-threat-detection-shared-start-sharing-terminal-table-select-all-checkbox"
              @update:value="handleSelectAllClick"
            />
          </div>
        </template>
        <template #selector="{ row }">
          <div class="w-100 d-flex justify-center">
            <CheckboxBase
              :value="row.selector"
              :disabled="(checkboxDisabled && !row.selector) || !row.selectable"
              :data-cy="`security-contracts-threat-detection-shared-start-sharing-terminal-table-selector-${row.terminalId}`"
              @update:value="(checked: boolean) => handleSelectorClick(checked, row.terminalId)"
            />
          </div>
        </template>
        <template #terminalId="{ row }">
          <NuxtLink v-if="row.terminalPath" :to="`/tenants/${tenantId}/${row.terminalPath}/${row.terminalId}`">
            {{ row.terminalId }}
          </NuxtLink>
          <span v-else>{{ row.terminalId }}</span>
        </template>
        <template #terminalType="{ row }">
          <span class="text-sm">{{ row.terminalType }}</span>
        </template>
        <template #customerNote="{ row }">
          <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
        </template>

        <template #threatDetectionPlan="{ row }">
          <div class="text-xs text-pre-wrap">{{ getThreatDetectionPlanText(row.threatDetectionPlan) || '-' }}</div>
        </template>
        <template #flowCollectorPlan="{ row }">
          <div class="text-xs text-pre-wrap">{{ getFlowCollectorPlanText(row.flowCollectorPlan) || '-' }}</div>
        </template>
        <template #behaviorDetectionPlan="{ row }">
          <div class="text-xs text-pre-wrap">{{ getBehaviorDetectionPlanText(row.behaviorDetectionPlan) || '-' }}</div>
        </template>
        <template #trafficReportFlowAnalyzerPlan="{ row }">
          <div class="text-xs text-pre-wrap">
            {{ getTrafficReportFlowAnalyzerPlanText(row.trafficReportFlowAnalyzerPlan) || '-' }}
          </div>
        </template>
        <template #primaryCircuit="{ data }">
          <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
        </template>
        <template #primaryCircuitId="{ row, data }">
          <NuxtLink v-if="row.primaryCircuitPath" :to="`/tenants/${tenantId}/${row.primaryCircuitPath}/${data}`">
            {{ data }}
          </NuxtLink>
          <div v-else>
            {{ data }}
          </div>
        </template>
        <template #secondaryCircuit="{ data }">
          <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
        </template>
        <template #secondaryCircuitId="{ row, data }">
          <NuxtLink v-if="row.secondaryCircuitPath" :to="`/tenants/${tenantId}/${row.secondaryCircuitPath}/${data}`">
            {{ data }}
          </NuxtLink>
          <div v-else>
            {{ data || '-' }}
          </div>
        </template>
        <template #vpnId="{ data }">
          <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.Vpns}/${data}`">{{ data }}</NuxtLink>
        </template>
        <template #orderId="{ data }">
          <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.Orders}/${data}`" class="text-truncate">
            {{ data }}
          </NuxtLink>
        </template>
        <template #updateTime="{ row }">
          <div text-xs>{{ formatDateTime(row.updateTime) }}</div>
        </template>
      </MultiLevelHeaderSortableTable>
      <PaginationFooter
        :page="terminalTablePagination.page"
        :limit="terminalTablePagination.limit"
        :total="terminalTableList?.total ?? 0"
        @update:page="handleChangePage"
      />

      <div class="flex-flex-end-center ga-6">
        <CustomButton :text="t('common.cancel')" :width="180" icon="left-arrow" color="info" @click="handleCancel" />
        <CustomButton
          :text="t('threatDetectionStartSharing.startSharing')"
          :width="180"
          :disabled="submitDisabled"
          icon="right-arrow"
          data-cy="security-contracts-threat-detection-shared-start-sharing-submit-button"
          @click="handleSubmit"
        />
      </div>
    </template>
  </CardContainer>
</template>

<style lang="scss" scoped>
.break-all {
  word-break: break-all;
}
</style>
