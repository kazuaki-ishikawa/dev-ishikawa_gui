<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { DecodedDownloadDocumentResponse } from '@/api/types'
import type { CustomButtonIconType } from '@/components/button/types'

type PropType = {
  termsOfService: DecodedDownloadDocumentResponse[]
  accepted: boolean
  termsType?: 'mobile' | 'traffic-monitoring' | 'guarantee' | 'security' | 'traffic-report-flow-analyzer'
  showBackButton?: boolean
  backButtonOption?: {
    text: string
    icon?: CustomButtonIconType
    color?: 'primary' | 'info' | 'warning' | 'error'
  }
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  termsType: 'mobile',
  showBackButton: false,
  disabled: false,
})
type Emits = {
  (e: 'back'): void
  (e: 'submit'): void
}
const emits = defineEmits<Emits>()

const { $md } = useNuxtApp()
const { loading } = useLoading()

const { t } = useI18n()
const title = computed(() => {
  switch (props.termsType) {
    case 'mobile':
      return t('mobile.mobileTermsOfService')
    case 'traffic-monitoring':
      return t('sideBar.trafficMonitoring')
    case 'security':
      return t('guarantees.securityTermsOfService')
    case 'traffic-report-flow-analyzer':
      return t('guarantees.trafficReportFlowAnalyzerTermsOfService')
    case 'guarantee':
    default:
      return t('guarantees.termsOfService')
  }
})
const consentsAccepted = ref<boolean[]>(Array(props.termsOfService.length).fill(props.accepted))
const isConsentIncomplete = computed(() => consentsAccepted.value.some(v => !v))
const backButtonDisabled = computed(() => {
  return props.backButtonOption?.text === t('terms.disagreement') && consentsAccepted.value.some(v => v)
})

const backButtonBinding = computed(() => ({
  text: props.backButtonOption?.text || t('common.return'),
  icon: props.backButtonOption?.icon ?? 'left-arrow',
  color: props.backButtonOption?.color ?? 'info',
  disabled: backButtonDisabled.value,
}))

watch(
  () => [props.termsOfService, props.accepted],
  () => {
    consentsAccepted.value = Array(props.termsOfService.length).fill(props.accepted)
  },
)
</script>

<template>
  <div>
    <div class="mb-2 text-xl">{{ title }}</div>
    <div>
      <div v-for="(line, index) in termsOfService" :key="index">
        <TermsOfService :data-cy="`contractor-terms-and-conditions-terms-of-service-${index}`" :height="300">
          <div class="markdown" v-html="$md.render(line.content)" />
        </TermsOfService>
        <div :data-cy="`contractor-contractor-terms-and-conditions-agreement-${index}`" class="flex-flex-end-center mb-5">
          <TermOfServiceCheckbox
            :model-value="consentsAccepted[index] ?? accepted"
            :disabled="accepted"
            :label="accepted ? t('terms.agreed') : t('terms.agreement')"
            @update:model-value="(value: boolean) => (consentsAccepted[index] = value)"
          />
        </div>
      </div>

      <div class="flex-flex-end-center">
        <CustomButton
          v-if="showBackButton"
          v-bind="backButtonBinding"
          :width="180"
          data-cy="contractor-contractor-terms-and-conditions-back-button"
          @click="emits('back')"
        />
        <CustomButton
          class="ml-6"
          :text="accepted ? t('terms.agreed') : t('terms.agreement')"
          color="primary"
          icon="right-arrow"
          :width="180"
          :disabled="disabled || loading || isConsentIncomplete || accepted"
          data-cy="contractor-contractor-terms-and-conditions-submit-button"
          @click="emits('submit')"
        />
      </div>
    </div>
  </div>
</template>
