<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircuitTypes, TrafficReportFlowAnalyzerPlanTypes } from '@/api/constants'
import type { TrafficReportFlowAnalyzerPlanType } from '@/api/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { TERMINAL_LINK } from '@/api/terminals/constants'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages, ContractsPages } from '@/components/sidebar/constants'

type PropType = {
  primaryCircuitType: string
  initialTrafficReportFlowAnalyzer?: {
    trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanType
    trafficReportFlowAnalyzerAlert?: boolean
  }
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
})

const trafficReportFlowAnalyzer = defineModel<{
  trafficReportFlowAnalyzerPlan: string
  trafficReportFlowAnalyzerAlert: string
}>()
const trafficReportFlowAnalyzerPlanValid = defineModel<{
  trafficReportFlowAnalyzerPlan: boolean
  trafficReportFlowAnalyzerAlert: boolean
}>('valid')

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const {
  trafficReportFlowAnalyzerPlanOptions,
  trafficReportFlowAnalyzerAlertOptions,
  getTrafficReportFlowAnalyzerPlanText,
  getTrafficReportFlowAnalyzerAlertText,
} = useTerminalInput()
const { trafficReportFlowAnalyzerTermsOfServiceAccepted } = useTermsOfService(
  TermsOfServiceBasePath.TrafficReportFlowAnalyzer,
)

const trafficReportFlowAnalyzerPlan = computed({
  get: () => trafficReportFlowAnalyzer.value?.trafficReportFlowAnalyzerPlan ?? '',
  set: value => {
    if (!trafficReportFlowAnalyzer.value) {
      return
    }
    trafficReportFlowAnalyzer.value.trafficReportFlowAnalyzerPlan = value
  },
})
const trafficReportFlowAnalyzerAlert = computed({
  get: () => trafficReportFlowAnalyzer.value?.trafficReportFlowAnalyzerAlert ?? '',
  set: value => {
    if (!trafficReportFlowAnalyzer.value) {
      return
    }
    trafficReportFlowAnalyzer.value.trafficReportFlowAnalyzerAlert = value
  },
})

const buttonLabel = computed(() => {
  return trafficReportFlowAnalyzerTermsOfServiceAccepted?.value
    ? t('terms.agreedTermsLinkButton')
    : t('terms.termsLinkButton')
})
const trafficReportFlowAnalyzerAlertDisabled = computed(
  () =>
    props.disabled ||
    !trafficReportFlowAnalyzer.value ||
    trafficReportFlowAnalyzerPlan.value === TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
)

const setTrafficReportFlowAnalyzerValid = (
  key: 'trafficReportFlowAnalyzerPlan' | 'trafficReportFlowAnalyzerAlert',
  valid: boolean,
) => {
  if (trafficReportFlowAnalyzerPlanValid.value) {
    trafficReportFlowAnalyzerPlanValid.value[key] = valid
  }
}

// フロー可視化を申し込めるのはギャランティ接続を選択した場合のみ
const showTrafficReportFlowAnalyzer = computed(() => props.primaryCircuitType === CircuitTypes.Guarantee)
watch(showTrafficReportFlowAnalyzer, next => {
  if (trafficReportFlowAnalyzer.value) {
    if (next) {
      trafficReportFlowAnalyzerPlan.value =
        props.initialTrafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan ??
        TrafficReportFlowAnalyzerPlanTypes.FreePlan
      // 初期値が設定されていない場合、プランを利用する場合は true、利用しない場合は false とする
      trafficReportFlowAnalyzerAlert.value = `${props.initialTrafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert ?? trafficReportFlowAnalyzerPlan.value !== TrafficReportFlowAnalyzerPlanTypes.NoSubscription}`
    }
  }
})

watch(trafficReportFlowAnalyzerPlan, next => {
  if (next === TrafficReportFlowAnalyzerPlanTypes.NoSubscription) {
    trafficReportFlowAnalyzerAlert.value = 'false'
  }
})

const moveToTermsOfService = async () => {
  await navigateTo(
    `/tenants/${tenantId.value}/${TenantPages.Contracts}/${ContractsPages.SecurityTrafficReportFlowAnalyzer}`,
    { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } },
  )
}

onBeforeMount(() => {
  if (trafficReportFlowAnalyzer.value) {
    if (showTrafficReportFlowAnalyzer.value) {
      trafficReportFlowAnalyzerPlan.value =
        trafficReportFlowAnalyzerPlan.value || TrafficReportFlowAnalyzerPlanTypes.FreePlan
      trafficReportFlowAnalyzerAlert.value = `${props.initialTrafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert ?? trafficReportFlowAnalyzerPlan.value !== TrafficReportFlowAnalyzerPlanTypes.NoSubscription}`
    }
  }
})
</script>

<template>
  <InnerCard v-if="showTrafficReportFlowAnalyzer" :title="t('terminals.trafficReportFlowAnalyzerPlanOptions')">
    <template #button>
      <CustomButton
        icon="up-right-square"
        :width="240"
        :text="buttonLabel"
        data-cy="edit-traffic-report-flow-analyzer-terms-link-button"
        @click="moveToTermsOfService"
      />
    </template>
    <template #description>
      <i18n-t
        keypath="terminals.note.trafficReportFlowAnalyzer.description"
        scope="global"
        tag="div"
        class="text-pre-wrap"
      >
        <template #important>
          <span class="text-error font-weight-bold">{{ t('terminals.note.paidOption') }}</span>
        </template>
        <template #billingText>
          <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
        <template #analyzerLinkText>
          <NuxtLink :to="TERMINAL_LINK.RINK_0143" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </template>
    <!-- トラフィックレポート（フロー分析） -->
    <InputGrid
      v-if="trafficReportFlowAnalyzer"
      required
      :label="t('terminals.trafficReportFlowAnalyzerPlan')"
      :label-width="310"
      :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
    >
      <template #help>
        <i18n-t keypath="terminals.help.trafficReportFlowAnalyzerPlan" scope="global">
          <template #billingText>
            <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <div class="grid-cols ga-2">
        <SelectForm
          v-model="trafficReportFlowAnalyzerPlan"
          :options="trafficReportFlowAnalyzerPlanOptions"
          required
          :placeholder="trafficReportFlowAnalyzerPlanOptions[0]?.text"
          :disabled="props.disabled"
          data-cy="edit-traffic-report-flow-analyzer-plan-select-form"
          @valid="(valid: boolean) => setTrafficReportFlowAnalyzerValid('trafficReportFlowAnalyzerPlan', valid)"
        />
        <div class="text-sm text-error align-self-center text-pre-wrap">
          {{ t('terminals.note.trafficReportFlowAnalyzer.freePlan') }}
        </div>
      </div>
    </InputGrid>
    <DetailGrid v-else>
      <div>{{ t('terminals.trafficReportFlowAnalyzerPlan') }}</div>
      <div data-cy="edit-traffic-report-flow-analyzer-plan-value">
        {{
          getTrafficReportFlowAnalyzerPlanText(props.initialTrafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan)
        }}
      </div>
    </DetailGrid>
    <InputGrid
      v-if="trafficReportFlowAnalyzer"
      required
      :label="t('terminals.trafficReportFlowAnalyzerAlert')"
      :label-width="310"
    >
      <SelectForm
        v-model="trafficReportFlowAnalyzerAlert"
        :options="trafficReportFlowAnalyzerAlertOptions"
        required
        :placeholder="t('common.use')"
        :disabled="trafficReportFlowAnalyzerAlertDisabled"
        data-cy="edit-traffic-report-flow-analyzer-alert-select-form"
        @valid="(valid: boolean) => setTrafficReportFlowAnalyzerValid('trafficReportFlowAnalyzerAlert', valid)"
      />
    </InputGrid>
    <DetailGrid v-else>
      <div>{{ t('terminals.trafficReportFlowAnalyzerAlert') }}</div>
      <div data-cy="edit-traffic-report-flow-analyzer-alert-value">
        {{ getTrafficReportFlowAnalyzerAlertText(initialTrafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert) }}
      </div>
    </DetailGrid>
  </InnerCard>
</template>

<style lang="scss" scoped>
.grid-cols {
  display: grid;
  grid-template-columns: auto 1fr;
}
</style>
