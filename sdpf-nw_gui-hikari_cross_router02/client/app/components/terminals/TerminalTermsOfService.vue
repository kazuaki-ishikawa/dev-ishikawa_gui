<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TERMINAL_LINK } from '@/api/terminals/constants'

type PropsType = {
  type: 'break-out' | 'vpn-id' | 'wan-security-options' | 'traffic-report-flow-analyzer'
}
const props = defineProps<PropsType>()
const model = defineModel<boolean>({ required: true })
const { t } = useI18n()
const title = computed(() => {
  switch (props.type) {
    case 'wan-security-options':
      return t('terminals.terms.billingOption.title', { optionType: t('terminals.securityOptions') })
    case 'traffic-report-flow-analyzer':
      return t('terminals.terms.billingOption.title', {
        optionType: t('terminals.trafficReportFlowAnalyzerPlanOptions'),
      })
    default:
      return t('common.terms')
  }
})
const priceListLink = computed(() =>
  props.type === 'wan-security-options' ? TERMINAL_LINK.WAN_SECURITY_PRICE : TERMINAL_LINK.PRICE,
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
</script>

<template>
  <InnerCard :title="title">
    <TermsOfService v-if="type === 'break-out'" :height="200">
      <i18n-t keypath="terminals.terms.breakOut" tag="div" scope="global" class="text-pre-wrap my-2">
        <template #here>
          <NuxtLink :to="priceListLink" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </TermsOfService>

    <TermsOfService v-else-if="type === 'vpn-id'" :height="120">
      <i18n-t keypath="terminals.terms.vpnId" tag="div" scope="global" class="text-pre-wrap my-2">
        <template #here>
          <NuxtLink :to="priceListLink" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </TermsOfService>

    <TermsOfService
      v-else-if="type === 'wan-security-options' || type === 'traffic-report-flow-analyzer'"
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

    <div class="flex-flex-end-center" data-cy="terminal-terms-of-service-agreement">
      <TermOfServiceCheckbox v-model="model" :label="t('terms.agreement')" />
    </div>
  </InnerCard>
</template>
