<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Breadcrumbs } from './constants'
import { TrafficReportFlowAnalyzerPlanTypes, SecurityOptionTypes, BehaviorDetectionOptionTypes } from '@/api/constants'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import type { BreakOutResponse } from '@/api/breakOut/types'
import type { GuaranteeResponse } from '@/api/guarantees/types'
import {
  TERMINAL_LINK,
  MOBILE_INFORMATION_KEYS,
  MOBILE_PIC_INFORMATION_KEYS,
  initialTerminalInputData,
  initialTerminalValid,
  initialMobileInputData,
  initialMobileValid,
} from '@/api/terminals/constants'
import type { TerminalMobileInputDataType, TerminalInputDataType, TerminalInputValidType } from '@/api/terminals/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import type { ResourceSummaryVpnResponse } from '@/api/vpns/types'
import type { IpoeListOptionType } from '@/components/terminals/types'

const Steps = {
  Mobile: 0,
  MobilePicInformation: 1,
  NumberOfTerminals: 2,
  Terminal: 3,
  Confirm: 4,
} as const

type PropsType = {
  tenantId: string
  customerNoteList: Array<{ id: string; customerNote: string }>
  vpn: ResourceSummaryVpnResponse | null
  breakOutList: BreakOutResponse[]
  guaranteeList: GuaranteeResponse[]
  ipoeListOptions: IpoeListOptionType[]
  mobileExists: boolean
  disabledDates?: (value: Date) => boolean
}
const props = defineProps<PropsType>()

type Emits = {
  (e: 'prev'): void
  (e: 'submit', data: { mobile: TerminalMobileInputDataType; terminals: TerminalInputDataType[] }): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const { loading } = useLoading()
const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)
const { securityTermsOfServiceAccepted, getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted } =
  useTermsOfService(TermsOfServiceBasePath.Security)

const { currentSettingsBehaviorDetectionPlan, getSettingsBehaviorDetection } = useGetSettingsBehaviorDetection()

const step = ref(0)
const terminalNumber = ref(1)
const terminalCounter = ref(0)
const terminals = ref<TerminalInputDataType[]>([])
const terminalValids = ref<TerminalInputValidType[]>([])
const inputMobileData = ref(structuredClone(initialMobileInputData))
const inputMobileValid = ref({
  ...initialMobileValid,
  contractIdentificationDocumentType: true,
  contractIdentificationDocumentId: true,
  corporateVerificationMethod: false,
  jpkiRequestId: false,
})
const openTermsOfServiceDialog = ref(false)

const targetIpoeListOptions = computed(() =>
  props.ipoeListOptions.filter(
    ipoe =>
      terminals.value[terminalCounter.value]?.ipoeId === ipoe.value ||
      terminals.value.every(v => v.ipoeId !== ipoe.value),
  ),
)
const targetGuaranteeList = computed(() =>
  props.guaranteeList.filter(
    guarantee =>
      terminals.value[terminalCounter.value]?.guarantee.guaranteeId === guarantee.guaranteeId ||
      terminals.value.every(v => v.guarantee.guaranteeId !== guarantee.guaranteeId),
  ),
)

// 端末数
const terminalNumberOptions = [...Array(100)].map((_, index) => ({
  text: `${index + 1}`,
  value: `${index + 1}`,
}))
const handleTerminalNumberChange = (value: string) => {
  terminalNumber.value = Number(value)
}
const handleTerminalNumberNext = () => {
  // 端末数分の入力項目を作成する
  terminals.value = [...Array(terminalNumber.value)].map(() =>
    Object.assign({}, structuredClone(initialTerminalInputData), { vpnId: props.vpn?.vpnId ?? '' }),
  )
  terminalValids.value = [...Array(terminalNumber.value)].map(() =>
    Object.assign({}, structuredClone(initialTerminalValid), { vpnId: true }),
  )
  step.value++
}
// ボタンの処理
const handleTerminalPrev = () => {
  if (terminalCounter.value > 0) {
    terminalCounter.value--
  } else {
    step.value--
  }
}

const requiredTrafficReportFlowAnalyzer = computed(
  () =>
    terminals.value.some(
      terminal =>
        terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
        TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
    ) && !trafficReportFlowAnalyzerTermsOfServiceAccepted.value,
)

const requiredSecurity = computed(
  () =>
    terminals.value.some(
      terminal =>
        [terminal.threatDetection.threatDetectionPlan, terminal.flowCollector.flowCollectorPlan].some(
          plan => plan !== SecurityOptionTypes.NoSubscription,
        ) || terminal.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription,
    ) && !securityTermsOfServiceAccepted.value,
)

const requiredBehaviorDetection = computed(
  () =>
    terminals.value.some(
      terminal => terminal.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription,
    ) && currentSettingsBehaviorDetectionPlan.value === BehaviorDetectionPlanTypes.None,
)

const handleTerminalNext = async () => {
  if (terminalCounter.value + 1 === terminalNumber.value) {
    await getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
    await getSecurityTermsOfServiceAccepted()
    await getSettingsBehaviorDetection()

    openTermsOfServiceDialog.value =
      requiredTrafficReportFlowAnalyzer.value || requiredSecurity.value || requiredBehaviorDetection.value
    if (!openTermsOfServiceDialog.value) {
      step.value++
    }
  } else {
    terminalCounter.value++
  }
}

// 確認画面
const handleSubmit = () => {
  emits('submit', { mobile: inputMobileData.value, terminals: terminals.value })
}

const terminalsCountLabel = computed(() => `${terminalCounter.value + 1}/${terminalNumber.value}`)
const message = computed(() => {
  switch (step.value) {
    case Steps.NumberOfTerminals:
      return t('quickSetup.confirmNumberOfTerminals')
    case Steps.Mobile:
      return t('terminals.mobileInformation')
    case Steps.MobilePicInformation:
      return t('terminals.picInformation')
    case Steps.Terminal:
      return `${t('sideBar.terminal')} ${terminalsCountLabel.value}`
    default:
      return t('confirm.create')
  }
})

const helpLink = computed(() => {
  switch (step.value) {
    case Steps.Mobile:
      return TERMINAL_LINK.MOBILE
    default:
      return undefined
  }
})

const buttons = computed(() => {
  switch (step.value) {
    case Steps.Mobile:
    case Steps.MobilePicInformation:
      return {
        prevClick: () => (step.value === Steps.Mobile ? emits('prev') : step.value--),
        nextLabel: t('common.next'),
        nextClick: () => step.value++,
      }
    case Steps.NumberOfTerminals:
      return {
        prevClick: () => step.value--,
        nextLabel: t('common.next'),
        nextClick: handleTerminalNumberNext,
      }
    case Steps.Terminal:
      return {
        prevClick: handleTerminalPrev,
        nextLabel: t('common.next'),
        nextClick: handleTerminalNext,
      }
    default:
      return {
        prevClick: () => step.value--,
        nextLabel: t('common.create'),
        nextClick: handleSubmit,
      }
  }
})
const nextDisabled = computed(() => {
  if (step.value === Steps.Mobile) {
    return MOBILE_INFORMATION_KEYS.some(key => !inputMobileValid.value[key])
  }
  if (step.value === Steps.MobilePicInformation) {
    return MOBILE_PIC_INFORMATION_KEYS.some(key => !inputMobileValid.value[key])
  }
  if (step.value === Steps.Terminal) {
    const currentValid = terminalValids.value[terminalCounter.value]
    return (
      !currentValid ||
      Object.values(currentValid).some(valid =>
        typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
      )
    )
  }
  if (step.value === Steps.Confirm) {
    return loading.value
  }
  return false
})
const currentStep = computed(() => {
  switch (step.value) {
    case Steps.Mobile:
    case Steps.MobilePicInformation:
      return { step: Breadcrumbs[1] }
    case Steps.NumberOfTerminals:
      return { step: Breadcrumbs[2] }
    case Steps.Terminal:
      return { step: Breadcrumbs[3], countLabel: terminalsCountLabel.value }
    case Steps.Confirm:
      return { step: Breadcrumbs[4] }
    default:
      return undefined
  }
})

watch([step, terminalCounter], () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <QuickSetupTemplate
    :prev-label="t('common.return')"
    :next-label="buttons.nextLabel"
    :next-disabled="nextDisabled"
    :current-step="currentStep"
    @prev="buttons.prevClick"
    @next="buttons.nextClick"
  >
    <template #message>
      <div data-cy="quick-setup-terminal-message">
        {{ message }}
      </div>
    </template>
    <template v-if="helpLink" #help>
      <NuxtLink :to="helpLink" target="_blank">{{ helpLink }}</NuxtLink>
    </template>
    <EditTerminalMobile
      v-if="step === Steps.Mobile"
      v-model:mobile="inputMobileData"
      v-model:valid="inputMobileValid"
    />
    <EditTerminalMobilePicInformation
      v-if="step === Steps.MobilePicInformation"
      v-model:mobile="inputMobileData"
      v-model:valid="inputMobileValid"
      is-quick-setup
    />
    <SelectForm
      v-if="step === Steps.NumberOfTerminals"
      :model-value="`${terminalNumber}`"
      :options="terminalNumberOptions"
      required
      data-cy="quick-setup-terminal-number-of-terminal"
      @update:model-value="handleTerminalNumberChange"
    />
    <template v-for="(_terminal, index) in terminals" :key="`quick-setup-terminal-edit-terminal-data-${index}`">
      <EditTerminalData
        v-if="terminals[index] && terminalValids[index]"
        v-show="index === terminalCounter && step === Steps.Terminal"
        v-model:terminal="terminals[index]"
        v-model:valid="terminalValids[index]"
        is-bulk
        :customer-note-list="customerNoteList"
        :break-out-list="breakOutList"
        :guarantee-list="targetGuaranteeList"
        :ipoe-list-options="targetIpoeListOptions"
        :disabled="index !== terminalCounter || step !== Steps.Terminal"
        :mobile-exists="mobileExists"
        :disabled-dates="disabledDates"
        :data-cy="`quick-setup-terminal-edit-terminal-data-${index}`"
      />
    </template>
    <QuickSetupTerminalConfirm
      v-if="step === Steps.Confirm"
      v-model:mobile="inputMobileData"
      v-model:mobile-valid="inputMobileValid"
      v-model:terminals="terminals"
      v-model:terminal-valids="terminalValids"
      :customer-note-list="customerNoteList"
      :vpn="vpn"
      :break-out-list="breakOutList"
      :guarantee-list="guaranteeList"
      :ipoe-list-options="ipoeListOptions"
      :disabled-dates="disabledDates"
    />
    <TermsOfServiceConfirmDialog
      :open="openTermsOfServiceDialog"
      :tenant-id="tenantId"
      :show-traffic-report-flow-analyzer="requiredTrafficReportFlowAnalyzer"
      :show-security="requiredSecurity"
      :show-behavior-detection="requiredBehaviorDetection"
      @close="openTermsOfServiceDialog = false"
    />
  </QuickSetupTemplate>
</template>
