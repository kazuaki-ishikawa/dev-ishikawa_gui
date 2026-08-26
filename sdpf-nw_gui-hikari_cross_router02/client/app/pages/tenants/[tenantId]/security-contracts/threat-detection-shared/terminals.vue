<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import {
  ThreatDetectionSharedTerminalDirectionTypes,
  ThreatDetectionSharedRequestTypes,
} from '@/api/threatDetectionShared/constants'
import type { ThreatDetectionSharedTenantListQuery } from '@/api/threatDetectionShared/types'
import type { TenantTerminalTableItemType } from '@/components/threatDetectionShared/types'

const Steps = {
  List: 1,
  StopSharing: 2,
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { navigationGuard } = useNavigationGuard()
const { loading } = useLoading()
const { setNotificationMessageState } = useNotificationDialog()

const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)
const { getAllThreatDetectionSharedTenantList, tenantIdOptions, terminalIdOptions } =
  useGetAllThreatDetectionSharedTenantList()
const { threatDetectionSharedTenantList, getThreatDetectionSharedTenantList } = useGetThreatDetectionSharedTenantList()
const { postThreatDetectionSharedRequest } = usePostThreatDetectionSharedRequest()
const { getBillingMethodText } = useThreatDetectionShared()
const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()

const step = ref(Steps.List)
const selectedItems = ref<TenantTerminalTableItemType[]>([])
const query = ref<ThreatDetectionSharedTenantListQuery>({})

const basePath = computed(() => route.path.split('/').slice(0, -1).join('/'))
const isListView = computed(() => step.value <= Steps.List)
const terminalDirection = computed(() =>
  route.query.terminalDirection === ThreatDetectionSharedTerminalDirectionTypes.Provided
    ? ThreatDetectionSharedTerminalDirectionTypes.Provided
    : ThreatDetectionSharedTerminalDirectionTypes.Received,
)

const title = computed(() => {
  return isListView.value
    ? t(`threatDetectionSharedStop.${terminalDirection.value}.list`)
    : t('threatDetectionSharedStop.stopSharingTitle')
})

const submitDisabled = computed(() => {
  if (isListView.value) {
    return selectedItems.value.length === 0
  } else {
    return selectedItems.value.every(item => !item.selector) || loading.value
  }
})

const routeQuery = computed(() =>
  ['limit', 'page', 'sharedTenantId', 'terminalDirection', 'terminalId', 'sortKey', 'direction'].reduce((q, key) => {
    const value = route.query[key]
    const firstValue = Array.isArray(value) ? value[0] : value
    if (key === 'terminalDirection') {
      // route.query.terminalDirection に適当な値が入らないようにする
      const terminalDirection = Object.values(ThreatDetectionSharedTerminalDirectionTypes).find(
        value => value === firstValue,
      )
      return Object.assign(q, { [key]: terminalDirection ?? ThreatDetectionSharedTerminalDirectionTypes.Provided })
    } else if (['limit', 'page'].includes(key) && !isNaN(Number(firstValue))) {
      if (key === 'page') {
        return Object.assign(q, { offset: Number(firstValue) < 2 ? 0 : Number(firstValue) - 1 })
      }
      return Object.assign(q, { [key]: Number(firstValue) })
    }
    return Object.assign(q, { [key]: firstValue })
  }, {}),
)

const moveToStartSharing = async () => {
  await navigateTo(`${basePath.value}/start-sharing`)
}
const handleSearch = (q: ThreatDetectionSharedTenantListQuery) => {
  if (isEqual(q, routeQuery.value)) {
    changeRouteQuery()
  } else {
    router.replace({ query: { ...q, offset: undefined, page: (q.offset ?? 0) + 1 } })
  }
}

const handleSubmit = async () => {
  if (isListView.value) {
    selectedItems.value = selectedItems.value.map(item => ({ ...item, selector: true }))
    step.value++
    return
  }

  const requestMap = selectedItems.value.reduce<Map<string, string[]>>((acc, cur) => {
    if (!cur.selector) {
      return acc
    }
    if (acc.has(cur.sharedTenantId)) {
      acc.set(cur.sharedTenantId, [...(acc.get(cur.sharedTenantId) ?? []), cur.terminalId])
    } else {
      acc.set(cur.sharedTenantId, [cur.terminalId])
    }
    return acc
  }, new Map())

  const results = await Promise.allSettled(
    Array.from(requestMap).map(([sharedTenantId, terminalIds]) =>
      postThreatDetectionSharedRequest({
        sharedTenantId,
        terminalIds,
        requestType: ThreatDetectionSharedRequestTypes.Stop,
      }),
    ),
  )
  const rejectedList = results.filter(data => data.status === 'rejected')
  const fulfilledSet = new Set(
    results.flatMap(result =>
      result.status === 'fulfilled'
        ? result.value.terminals.map(({ terminalId }) => `${result.value.sharedTenantId}-${terminalId}`)
        : [],
    ),
  )
  // selectedItem を fulfilledList に含まれないもののみにする
  selectedItems.value = selectedItems.value.filter(
    item => !fulfilledSet.has(`${item.sharedTenantId}-${item.terminalId}`),
  )
  // 失敗したもののテナントID / ルーターID を取得する
  const rejectedTerminalList = selectedItems.value.reduce<string[]>((acc, cur) => {
    if (cur.selector) {
      acc.push(`${cur.sharedTenantId} / ${cur.terminalId}`)
    }
    return acc
  }, [])
  if (rejectedList.length > 0) {
    // 失敗したものが1件でもあればエラーメッセージを表示する
    setNotificationMessageState({
      message: t('threatDetectionSharedStop.message.failed', {
        terminal: rejectedTerminalList.join('\n'),
      }),
    })
  } else {
    // 全件成功したら一覧画面に戻る
    step.value = selectedItems.value.length === 0 ? Steps.List : step.value
    setNotificationMessageState({ message: t('threatDetectionSharedStop.message.success') })
  }
}

const changeRouteQuery = () => {
  if (!securityTermsOfServiceAccepted.value) {
    return
  }
  query.value = { ...routeQuery.value }
  getThreatDetectionSharedTenantList(routeQuery.value)
}

watch(selectedItems, () => navigationGuard(selectedItems.value.length > 0))
watch(() => route.query, changeRouteQuery)
onBeforeMount(async () => {
  await getSecurityTermsOfServiceAccepted()
  if (!securityTermsOfServiceAccepted.value) {
    return
  }

  if (terminalDirection.value === ThreatDetectionSharedTerminalDirectionTypes.Provided) {
    await getAllResourceSummaryTerminalList()
  }
  // フィルタ用のデータを取得する
  await getAllThreatDetectionSharedTenantList({ terminalDirection: terminalDirection.value })

  if (
    // route.query.terminalDirection に適当な値が入らないようにする
    !Object.values(ThreatDetectionSharedTerminalDirectionTypes).some(value => value === route.query.terminalDirection)
  ) {
    await router.replace({
      path: route.path,
      query: { terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Provided },
    })
    return
  }

  // route.query に変更がない場合はこれでデータ取得する
  changeRouteQuery()
})
</script>

<template>
  <CardContainer>
    <div class="flex-space-between-center">
      <div data-cy="security-contracts-threat-detection-shared-terminals-title">
        {{ title }}
      </div>
      <CustomButton
        v-if="!securityTermsOfServiceAccepted"
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        data-cy="security-contracts-threat-detection-shared-terminals-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
    </div>
    <div
      v-if="!securityTermsOfServiceAccepted"
      class="text-warning mb-4"
      data-cy="security-contracts-threat-detection-shared-terminals-terms-of-service-message"
    >
      {{ t('threatDetectionShared.message.requiredSecurityAccepted') }}
    </div>

    <template v-if="isListView">
      <CustomButton
        class="ml-auto mb-4"
        icon="right-arrow"
        :text="t('threatDetectionShared.startSharing')"
        :width="270"
        :disabled="!securityTermsOfServiceAccepted"
        data-cy="security-contracts-threat-detection-shared-terminals-start-sharing-button"
        @click="moveToStartSharing"
      />

      <TenantTerminalTable
        v-model:selected="selectedItems"
        v-model:query="query"
        :threat-detection-shared-tenant-list="threatDetectionSharedTenantList"
        :tenant-id-options="tenantIdOptions"
        :terminal-id-options="terminalIdOptions"
        :disabled="!securityTermsOfServiceAccepted"
        :terminal-list="resourceSummaryTerminalList"
        data-cy="security-contracts-threat-detection-shared-terminals-terminal-table"
        @search="handleSearch"
      />
    </template>
    <div v-else class="mt-4">
      <CollapseCardSwitch
        v-for="(item, i) in selectedItems"
        :key="`${item.sharedTenantId}-${item.terminalId}`"
        :model-value="item.selector"
        :title="`${t('threatDetectionSharedStop.terminalInformation') + (i + 1)}`"
        :disabled="loading"
        :data-cy="`security-contracts-threat-detection-shared-terminals-${item.sharedTenantId}-${item.terminalId}`"
        @update:model-value="value => (item.selector = value)"
      >
        <DetailGrid>
          <div>{{ t(`threatDetectionSharedStop.${terminalDirection}.contractorName`) }}</div>
          <div>{{ item.contractorName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('details.tenantId') }}</div>
          <div>{{ item.sharedTenantId }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.terminalId') }}</div>
          <NuxtLink
            v-if="item.terminalPath"
            :to="item.terminalPath"
            :data-cy="`terminal-id-link-${item.sharedTenantId}-${item.terminalId}`"
          >
            {{ item.terminalId }}
          </NuxtLink>
          <div v-else :data-cy="`terminal-id-${item.sharedTenantId}-${item.terminalId}`">{{ item.terminalId }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.name') }}</div>
          <div>{{ item.customerNote }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('terminals.installationAddress') }}</div>
          <div>{{ item.installationAddress }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('threatDetectionShared.requestId') }}</div>
          <NuxtLink :to="`${basePath}/${item.requestId}`">
            {{ item.requestId }}
          </NuxtLink>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('threatDetectionShared.updateTime.start') }}</div>
          <div>{{ item.approvalTime }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('threatDetectionShared.billingMethod.label') }}</div>
          <div>{{ getBillingMethodText(item.billingMethod) }}</div>
        </DetailGrid>
      </CollapseCardSwitch>
    </div>

    <div class="flex-flex-end-center ga-6 mt-4">
      <CustomButton
        icon="left-arrow"
        color="info"
        :width="180"
        :text="isListView ? t('common.return') : t('common.cancel')"
        data-cy="security-contracts-threat-detection-shared-terminals-cancel-button"
        @click="() => (isListView ? router.back() : step--)"
      />
      <CustomButton
        icon="right-arrow"
        color="warning"
        :width="180"
        :disabled="submitDisabled"
        :text="t('threatDetectionSharedStop.stopSharing')"
        data-cy="security-contracts-threat-detection-shared-terminals-submit-button"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
