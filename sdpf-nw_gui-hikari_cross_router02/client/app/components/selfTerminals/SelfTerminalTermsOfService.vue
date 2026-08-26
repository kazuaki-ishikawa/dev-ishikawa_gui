<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { SELF_TERMINAL_LINK } from '@/api/selfTerminals/constants'
import { TERMINAL_LINK } from '@/api/terminals/constants'

type PropsType = {
  type: 'self-terminal' | 'wan-security-options' | 'traffic-report-flow-analyzer'
}
const props = defineProps<PropsType>()
const model = defineModel<boolean>({ required: true })
const { t } = useI18n()

const title = computed(() =>
  props.type === 'wan-security-options'
    ? t('terminals.terms.billingOption.title', { optionType: t('terminals.securityOptions') })
    : props.type === 'traffic-report-flow-analyzer'
      ? t('terminals.terms.billingOption.title', { optionType: t('terminals.trafficReportFlowAnalyzerPlanOptions') })
      : t('common.notes'),
)
const priceListLink = computed(() =>
  props.type === 'wan-security-options' ? TERMINAL_LINK.WAN_SECURITY_PRICE : SELF_TERMINAL_LINK.PRICE,
)

const billingOptionTopLink = computed(() =>
  props.type === 'wan-security-options'
    ? TERMINAL_LINK.WAN_SECURITY_TOP
    : TERMINAL_LINK.TRAFFIC_REPORT_FLOW_ANALYZER_TOP,
)
const billingOptionText = computed(() =>
  props.type === 'wan-security-options'
    ? t('terminals.securityOptions')
    : t('terminals.trafficReportFlowAnalyzerPlanOptions'),
)
const campaignPlan = computed(() =>
  props.type === 'wan-security-options' ? t('terminals.threatDetectionPlan') : t('terminals.freePlan'),
)
const checkboxLabel = computed(() =>
  props.type === 'self-terminal' ? t('terms.confirmationAndAgreement') : t('terms.agreement'),
)
const colMinWidth = computed(() => (props.type === 'self-terminal' ? '15rem' : ''))
</script>

<template>
  <InnerCard :title="title">
    <TermsOfService v-if="type === 'self-terminal'" :height="120">
      <div>{{ t('selfTerminals.terms.text') }}</div>
      <NuxtLink :to="SELF_TERMINAL_LINK.CREATION_TERMS_LINK" target="_blank">
        {{ SELF_TERMINAL_LINK.CREATION_TERMS_LINK }}
      </NuxtLink>
    </TermsOfService>
    <TermsOfService
      v-else-if="props.type === 'wan-security-options' || props.type === 'traffic-report-flow-analyzer'"
      :height="120"
    >
      <i18n-t keypath="terminals.terms.billingOption.text" tag="div" scope="global" class="text-pre-wrap my-2">
        <template #optionType>
          <NuxtLink :to="billingOptionTopLink" target="_blank">
            {{ billingOptionText }}
          </NuxtLink>
        </template>
        <template #billingText>
          <NuxtLink :to="priceListLink" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
      <div class="text-error">
        {{ t('terminals.terms.billingOption.campaign', { campaignPlan }) }}
      </div>
    </TermsOfService>

    <div class="flex-flex-end-center" data-cy="self-terminal-terms-of-service-agreement">
      <TermOfServiceCheckbox v-model="model" :col-min-width="colMinWidth" :label="checkboxLabel" />
    </div>
  </InnerCard>
</template>
