<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type {
  TerminalFlowCollectorPlanType,
  TerminalThreatDetectionPlanType,
  TerminalFlowCollectorResponseType,
  TerminalThreatDetectionType,
  TerminalBehaviorDetectionPlanType,
  TerminalBehaviorDetectionType,
} from '@/api/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import { IconTypes } from '@/components/icons/constants'
import { TERMINAL_LINK } from '@/api/terminals/constants'

type PropType = {
  threatDetection?: TerminalThreatDetectionType
  flowCollector?: TerminalFlowCollectorResponseType
  behaviorDetection?: TerminalBehaviorDetectionType
  disabled?: boolean
}

withDefaults(defineProps<PropType>(), {
  disabled: false,
})

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const {
  flowCollectorPlanOptions,
  threatDetectionPlanOptions,
  behaviorDetectionPlanOptions,
  getFlowCollectorPlanText,
  getThreatDetectionPlanText,
  getBehaviorDetectionPlanText,
} = useTerminalInput()
const { securityTermsOfServiceAccepted, moveToSecurityTermOfService } = useTermsOfService(
  TermsOfServiceBasePath.Security,
)

const { currentSettingsBehaviorDetectionPlan } = useGetSettingsBehaviorDetection()

const buttonLabel = computed(() => {
  return securityTermsOfServiceAccepted?.value ? t('terms.agreedTermsLinkButton') : t('terms.termsLinkButton')
})

const threatDetectionPlan = defineModel<TerminalThreatDetectionPlanType>('threatDetectionPlan')
const threatDetectionPlanValid = defineModel<boolean>('threatDetectionPlanValid')
const flowCollectorPlan = defineModel<TerminalFlowCollectorPlanType>('flowCollectorPlan')
const flowCollectorPlanValid = defineModel<boolean>('flowCollectorPlanValid')
const behaviorDetectionPlan = defineModel<TerminalBehaviorDetectionPlanType>('behaviorDetectionPlan')
const behaviorDetectionPlanValid = defineModel<boolean>('behaviorDetectionPlanValid')
</script>

<template>
  <InnerCard :title="t('terminals.securityOptions')">
    <template #button>
      <CustomButton
        icon="up-right-square"
        :width="240"
        :text="buttonLabel"
        data-cy="edit-security-options-terms-link-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
    </template>
    <template #description>
      <i18n-t keypath="terminals.note.securityOptions.description" scope="global">
        <template #important>
          <span class="text-error font-weight-bold">{{ t('terminals.note.paidOption') }}</span>
        </template>
        <template #billingText>
          <NuxtLink :to="TERMINAL_LINK.WAN_SECURITY_PRICE" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </template>

    <!-- 脅威検知 -->
    <InputGrid
      v-if="typeof threatDetectionPlan === 'string'"
      required
      :label="t('terminals.threatDetectionPlan')"
      :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
    >
      <template #help>
        <i18n-t keypath="terminals.help.wanSecurityPlan" scope="global">
          <template #billingText>
            <NuxtLink :to="TERMINAL_LINK.WAN_SECURITY_PRICE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <div class="grid-cols ga-2">
        <SelectForm
          v-model="threatDetectionPlan"
          :options="threatDetectionPlanOptions"
          :disabled="disabled"
          required
          data-cy="edit-security-options-threat-detection-plan"
          @valid="(valid: boolean) => (threatDetectionPlanValid = valid)"
        />
        <div class="text-sm text-error align-self-center text-pre-wrap">
          {{ t('terminals.note.securityOptions.campaign') }}
        </div>
      </div>
    </InputGrid>
    <DetailGrid v-else>
      <div>{{ t('terminals.threatDetectionPlan') }}</div>
      <div data-cy="edit-security-options-threat-detection-plan-value">
        {{ getThreatDetectionPlanText(threatDetection?.threatDetectionPlan) }}
      </div>
    </DetailGrid>

    <!-- フローコレクター -->
    <InputGrid
      v-if="typeof flowCollectorPlan === 'string'"
      required
      :label="t('terminals.flowCollectorPlan')"
      :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
    >
      <template #help>
        <i18n-t keypath="terminals.help.wanSecurityPlan" scope="global">
          <template #billingText>
            <NuxtLink :to="TERMINAL_LINK.WAN_SECURITY_PRICE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <SelectForm
        v-model="flowCollectorPlan"
        :options="flowCollectorPlanOptions"
        :disabled="disabled"
        required
        data-cy="edit-security-options-flow-collector-plan"
        @valid="(valid: boolean) => (flowCollectorPlanValid = valid)"
      />
    </InputGrid>
    <DetailGrid v-else>
      <div>{{ t('terminals.flowCollectorPlan') }}</div>
      <div data-cy="edit-security-options-flow-collector-plan-value">
        {{ getFlowCollectorPlanText(flowCollector?.flowCollectorPlan) }}
      </div>
    </DetailGrid>
    <DetailGrid v-if="!!flowCollector">
      <div class="pl-5">{{ t('terminals.flowCollectorUsage') }}</div>
      <div data-cy="edit-security-options-flow-collector-usage-value">
        {{
          typeof flowCollector?.flowCollectorUsage !== 'undefined'
            ? convertByteToString(flowCollector.flowCollectorUsage)
            : '-'
        }}
      </div>
    </DetailGrid>
    <DetailGrid v-if="!!flowCollector">
      <div class="pl-5">{{ t('details.serviceStartDate') }}</div>
      <div data-cy="edit-security-options-flow-collector-start-date-value">
        {{ formatDate(flowCollector?.flowCollectorStartDate) || '-' }}
      </div>
    </DetailGrid>
    <div />

    <!-- ふるまい検知 -->
    <InputGrid
      v-if="typeof behaviorDetectionPlan === 'string'"
      required
      :label="t('terminals.behaviorDetection')"
      :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
    >
      <template #help>
        <i18n-t keypath="terminals.help.wanSecurityPlan" scope="global">
          <template #billingText>
            <NuxtLink :to="TERMINAL_LINK.WAN_SECURITY_PRICE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <SelectForm
        v-model="behaviorDetectionPlan"
        :options="behaviorDetectionPlanOptions"
        :disabled="disabled"
        required
        data-cy="edit-security-options-behavior-detection-plan"
        @valid="(valid: boolean) => (behaviorDetectionPlanValid = valid)"
      />
    </InputGrid>
    <DetailGrid v-else>
      <div>{{ t('terminals.behaviorDetection') }}</div>
      <div data-cy="edit-security-options-behavior-detection-plan-value">
        {{ getBehaviorDetectionPlanText(behaviorDetection?.behaviorDetectionPlan) }}
      </div>
    </DetailGrid>
    <i18n-t
      v-if="currentSettingsBehaviorDetectionPlan"
      :keypath="
        currentSettingsBehaviorDetectionPlan === BehaviorDetectionPlanTypes.None
          ? `terminals.note.securityOptions.behaviorDetectionPlanUnselected`
          : `terminals.note.securityOptions.behaviorDetection`
      "
      tag="div"
      scope="global"
      class="text-warning"
    >
      <template #plan>
        {{ t(`securityContracts.behaviorDetectionPlan.${currentSettingsBehaviorDetectionPlan}`) }}
      </template>
      <template #linkText>
        <NuxtLink :to="`/tenants/${tenantId}/security-contracts/summary`">
          {{ t('securityContracts.securityListPage') }}
        </NuxtLink>
      </template>
    </i18n-t>
  </InnerCard>
</template>

<style lang="scss" scoped>
.grid-cols {
  display: grid;
  grid-template-columns: auto 1fr;
}
</style>
