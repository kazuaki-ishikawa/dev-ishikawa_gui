<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import {
  CircuitTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
} from '@/api/constants'
import type {
  TrafficReportFlowAnalyzerPlanType,
  TerminalFlowCollectorPlanType,
  TerminalThreatDetectionPlanType,
  TerminalBehaviorDetectionPlanType,
} from '@/api/types'
import { initialConfirmationChecked as initChecked, TerminalCreationSteps } from '@/api/terminals/constants'
import type { GuaranteeResponse } from '@/api/guarantees/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import {
  SELF_TERMINAL_LINK,
  VpnRouteLimitList,
  initialSelfTerminalInputData,
  initialSelfTerminalValid,
  initialTermsOfServiceAgreement,
} from '@/api/selfTerminals/constants'
import { IconTypes } from '@/components/icons/constants'

const initialConfirmationChecked = initChecked.filter(({ key }) => ['vpn-id'].includes(key))

type PropsType = {
  guaranteeList: GuaranteeResponse[]
  vpnListOptions: Array<{ text: string; value: string }>
  customerNoteList: Array<{ id: string; customerNote: string }>
}
const props = defineProps<PropsType>()

const terminalCreationStep = defineModel<number>('terminalCreationStep', {
  required: true,
})
const isConfirmation = computed({
  get: () => terminalCreationStep.value === TerminalCreationSteps.Confirmation,
  set: (value: boolean) => {
    terminalCreationStep.value = value
      ? TerminalCreationSteps.Confirmation
      : TerminalCreationSteps.TerminalAndMobileInformation
  },
})

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()
const { useableOptions, vpnRouteLimitOptions } = useSelfTerminals()
const { createSelfTerminal } = useCreateSelfTerminal()
const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)
const { securityTermsOfServiceAccepted, getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted } =
  useTermsOfService(TermsOfServiceBasePath.Security)
const { getSecurityHelpDesk, shouldShowHelpDeskCampaign } = useGetSecurityHelpDesk()

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)
const { currentSettingsBehaviorDetectionPlan, getSettingsBehaviorDetection } = useGetSettingsBehaviorDetection()

const createdTerminalId = ref<string>('')
const openTermsOfServiceDialog = ref(false)
const termsOfServiceAgreementRef = ref(structuredClone(initialTermsOfServiceAgreement))
const termsOfServiceAgreement = computed({
  get: () =>
    termsOfServiceAgreementRef.value.filter(checked => {
      switch (checked.key) {
        case 'wan-security-options':
          // セキュリティオプションが申し込まれている場合
          return (
            [inputData.value.threatDetectionPlan, inputData.value.flowCollectorPlan].some(
              plan => plan !== SecurityOptionTypes.NoSubscription,
            ) || inputData.value.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription
          )
        case 'traffic-report-flow-analyzer':
          // トラフィックレポート（フロー分析）が申し込まれている場合
          return (
            inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
            TrafficReportFlowAnalyzerPlanTypes.NoSubscription
          )
        default:
          return true
      }
    }),
  set: val => {
    termsOfServiceAgreementRef.value = val
  },
})

const confirmationChecked = ref(structuredClone(initialConfirmationChecked))

const inputData = ref(structuredClone(initialSelfTerminalInputData))
const inputValid = ref(structuredClone(initialSelfTerminalValid))

const useGuaranteeVpnString = ref('')
const useGuaranteeVpn = computed({
  get: () => useGuaranteeVpnString.value === 'true',
  set: (value: boolean) => {
    useGuaranteeVpnString.value = `${value}`
  },
})
const internetAdvertise = computed(() => inputData.value.guarantee.internetAdvertise === 'true')
watch(internetAdvertise, () => (inputData.value.guarantee.internetPingMonitoring = 'false'))
const openSuccessDialog = ref(false)

const selectedGuarantee = computed(() =>
  props.guaranteeList.find(guarantee => guarantee.guaranteeId === inputData.value.guarantee.guaranteeId),
)
const hasGuaranteeInternetRateLimit = computed(() => {
  return !selectedGuarantee.value || !!selectedGuarantee.value.internet?.rateLimit
})
const hasGuaranteeVpnRateLimit = computed(() => {
  return !selectedGuarantee.value || !!selectedGuarantee.value.vpn?.rateLimit
})
watch(hasGuaranteeInternetRateLimit, next => {
  if (!next) {
    // インターネットの利用不可にする
    inputData.value.guarantee.internetAdvertise = 'false'
    inputValid.value.guarantee.internetAdvertise = true
  }
})
watch(hasGuaranteeVpnRateLimit, next => {
  if (!next) {
    // VPNの利用不可にする
    handleUpdateUseGuaranteeVpn('false')
  }
})

const requiredTrafficReportFlowAnalyzer = computed(
  () =>
    inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
      TrafficReportFlowAnalyzerPlanTypes.NoSubscription && !trafficReportFlowAnalyzerTermsOfServiceAccepted.value,
)
const requiredSecurity = computed(
  () =>
    ([inputData.value.threatDetectionPlan, inputData.value.flowCollectorPlan].some(
      plan => plan !== SecurityOptionTypes.NoSubscription,
    ) ||
      inputData.value.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription) &&
    !securityTermsOfServiceAccepted.value,
)
const requiredBehaviorDetection = computed(
  () =>
    inputData.value.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription &&
    currentSettingsBehaviorDetectionPlan.value === BehaviorDetectionPlanTypes.None,
)

const switchConfirm = async () => {
  await getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
  await getSecurityTermsOfServiceAccepted()
  await getSecurityHelpDesk()
  await getSettingsBehaviorDetection()

  openTermsOfServiceDialog.value =
    requiredTrafficReportFlowAnalyzer.value || requiredSecurity.value || requiredBehaviorDetection.value
  isConfirmation.value = !openTermsOfServiceDialog.value
}
watch(isConfirmation, next => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (!next) {
    termsOfServiceAgreement.value = structuredClone(initialTermsOfServiceAgreement)
    confirmationChecked.value = structuredClone(initialConfirmationChecked)
  }
})

const foundVpnRouteLimit = computed(() => VpnRouteLimitList.find(num => `${num}` === inputData.value.vpnRouteLimit))

const showHelpDeskCampaign = computed(() =>
  shouldShowHelpDeskCampaign(
    inputData.value.threatDetectionPlan,
    inputData.value.flowCollectorPlan,
    inputData.value.behaviorDetectionPlan,
  ),
)

const handleSubmit = async () => {
  const vpn = {
    act: inputData.value.guarantee.vpnActConnectedIpv4Prefix
      ? { connectedIpv4Prefix: inputData.value.guarantee.vpnActConnectedIpv4Prefix }
      : undefined,
    sby: inputData.value.guarantee.vpnSbyConnectedIpv4Prefix
      ? { connectedIpv4Prefix: inputData.value.guarantee.vpnSbyConnectedIpv4Prefix }
      : undefined,
  }
  const vpnAdvertiseNetworks = inputData.value.vpnAdvertiseNetworks.filter(Boolean)
  const request = {
    customerNote: inputData.value.customerNote,
    installationPostalCode: inputData.value.installationPostalCode,
    installationAddress: inputData.value.installationAddress,
    primaryCircuitType: CircuitTypes.Guarantee,
    vpnId: useGuaranteeVpn.value ? inputData.value.vpnId : undefined,
    vpnRouteLimit: useGuaranteeVpn.value ? foundVpnRouteLimit.value : undefined,
    vpnAdvertiseNetworks: vpnAdvertiseNetworks.length > 0 ? vpnAdvertiseNetworks : undefined,
    guarantee: {
      guaranteeId: inputData.value.guarantee.guaranteeId,
      internet: {
        advertise: internetAdvertise.value,
        pingMonitoring: internetAdvertise.value
          ? inputData.value.guarantee.internetPingMonitoring === 'true'
          : undefined,
      },
      vpn: useGuaranteeVpn.value && Object.values(vpn).some(value => !!value) ? vpn : undefined,
    },
    trafficReportFlowAnalyzer: {
      trafficReportFlowAnalyzerPlan: inputData.value.trafficReportFlowAnalyzer
        .trafficReportFlowAnalyzerPlan as TrafficReportFlowAnalyzerPlanType,
      trafficReportFlowAnalyzerAlert:
        inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert === 'true',
    },
    flowCollector: {
      flowCollectorPlan: inputData.value.flowCollectorPlan as TerminalFlowCollectorPlanType,
    },
    threatDetection: {
      threatDetectionPlan: inputData.value.threatDetectionPlan as TerminalThreatDetectionPlanType,
    },
    behaviorDetection: {
      behaviorDetectionPlan: inputData.value.behaviorDetectionPlan as TerminalBehaviorDetectionPlanType,
    },
  }

  const response = await createSelfTerminal(request)
  // 成功した場合はダイアログを表示
  navigationGuard(false)
  openSuccessDialog.value = true
  createdTerminalId.value = response.terminalId
}

const isNoNetworkInUse = computed(() => !internetAdvertise.value && !useGuaranteeVpn.value)
const submitDisabled = computed(() => {
  const invalid = Object.entries(inputValid.value).some(([_, valid]) =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  )
  const agreed = termsOfServiceAgreement.value.every(checked => checked.value)
  const checked = !useGuaranteeVpn.value || confirmationChecked.value.every(checked => checked.value)
  return (
    invalid || !useGuaranteeVpnString.value || isNoNetworkInUse.value || (isConfirmation.value && (!agreed || !checked))
  )
})
const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : switchConfirm
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})
const guaranteeListOptions = computed(() =>
  props.guaranteeList.map(guarantee => ({
    text: `${guarantee.guaranteeId} / ${guarantee.customerNote}`,
    value: guarantee.guaranteeId,
  })),
)

const handleUpdateUseGuaranteeVpn = (value: string) => {
  useGuaranteeVpnString.value = value
  inputValid.value.vpnId = value !== 'true'
  inputValid.value.guarantee.vpnActConnectedIpv4Prefix = value !== 'true'
  inputValid.value.guarantee.vpnSbyConnectedIpv4Prefix = value !== 'true'
  if (value !== 'true') {
    inputData.value.vpnId = ''
    inputData.value.guarantee.vpnActConnectedIpv4Prefix = ''
    inputData.value.guarantee.vpnSbyConnectedIpv4Prefix = ''
    inputData.value.vpnRouteLimit = ''
  } else {
    inputData.value.vpnRouteLimit = `${VpnRouteLimitList[0]}`
  }
}
</script>

<template>
  <div>
    <!-- ルーター基本設定 -->
    <InnerCard :title="t('terminals.basicConfiguration')">
      <template #help>
        <i18n-t keypath="selfTerminals.help.basicConfiguration" scope="global">
          <template #linkText>
            <NuxtLink :to="SELF_TERMINAL_LINK.BASE_SETTING" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <InputGrid required :label="t('terminals.name')">
        <InputForm
          v-model="inputData.customerNote"
          maxlength="64"
          required
          placeholder="東京本社A館１号機"
          :disabled="isConfirmation"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
          data-cy="self-terminal-create-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.installationPostalCode')">
        <SearchPostalCode
          v-model="inputData.installationPostalCode"
          v-model:address="inputData.installationAddress"
          v-model:valid="inputValid.installationPostalCode"
          required
          :placeholder="t('placeholder.postalCode')"
          :disabled="isConfirmation"
          data-cy="self-terminal-create-installation-postal-code"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.installationAddress')" :help="t('terminals.help.address')">
        <InputForm
          v-model="inputData.installationAddress"
          :rules="[
            rules.fullwidthCharacter,
            rules.forbiddenControlCharacter,
            rules.noSpaceAtBeginningAndEnd,
            rules.noConsecutiveSpaces,
            rules.startsWithPrefecture,
          ]"
          size="large"
          maxlength="300"
          required
          placeholder="東京都千代田区大手町２−３−１"
          :disabled="isConfirmation"
          data-cy="self-terminal-create-installation-address"
          @valid="(valid: boolean) => (inputValid.installationAddress = valid)"
        />
      </InputGrid>
    </InnerCard>

    <!-- リソース設定 -->
    <InnerCard :title="t('terminals.resourceSettings')">
      <template #help>
        <i18n-t keypath="selfTerminals.help.resourceSettings" scope="global">
          <template #linkText>
            <NuxtLink :to="SELF_TERMINAL_LINK.RESOURCE_SETTING" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <InputGrid required :label="t('terminals.guaranteeId')">
        <SelectForm
          v-model="inputData.guarantee.guaranteeId"
          :options="guaranteeListOptions"
          placeholder="Z000000002 / ギャランティアクセス名"
          required
          :disabled="isConfirmation"
          size="middle"
          data-cy="self-terminal-create-guarantee-guarantee-id"
          @valid="(valid: boolean) => (inputValid.guarantee.guaranteeId = valid)"
        />
      </InputGrid>
      <div class="pl-5">
        <InputGrid required :label="t('terminals.internet')" :label-width="271">
          <RadioForm
            v-model="inputData.guarantee.internetAdvertise"
            :options="useableOptions"
            :disabled="isConfirmation || !hasGuaranteeInternetRateLimit"
            data-cy="self-terminal-create-guarantee-internet"
            @valid="(valid: boolean) => (inputValid.guarantee.internetAdvertise = valid)"
          />
          <div v-if="isNoNetworkInUse" class="text-sm text-warning">{{ t('selfTerminals.note.networkRequired') }}</div>
        </InputGrid>
        <div class="pl-5">
          <InputGrid v-if="internetAdvertise" :label="t('terminals.pingMonitoring')" :label-width="251">
            <RadioForm
              v-model="inputData.guarantee.internetPingMonitoring"
              :options="useableOptions"
              :disabled="isConfirmation"
              data-cy="self-terminal-create-guarantee-internet-ping-monitoring"
              @valid="(valid: boolean) => (inputValid.guarantee.internetPingMonitoring = valid)"
            />
            <template #footer>
              <div
                v-if="inputData.guarantee.internetPingMonitoring === 'true'"
                class="ml-272px text-sm text-error mt-2"
              >
                <div>{{ t('selfTerminals.note.pingMonitoring.message-1') }}</div>
                <div class="mt-4">{{ t('selfTerminals.note.pingMonitoring.message-2') }}</div>
                <div class="ml-4">{{ t('selfTerminals.note.pingMonitoring.message-3') }}</div>
                <div class="ml-4">{{ t('selfTerminals.note.pingMonitoring.message-4') }}</div>
                <div class="mt-4">{{ t('selfTerminals.note.pingMonitoring.message-5') }}</div>
                <div class="ml-4">{{ t('selfTerminals.note.pingMonitoring.message-6') }}</div>
              </div>
            </template>
          </InputGrid>
          <div><!-- Ping監視に border-bottom を表示するためのダミーの要素 --></div>
        </div>
        <InputGrid required :label="t('terminals.vpn')" :label-width="271">
          <RadioForm
            :model-value="useGuaranteeVpnString"
            :options="useableOptions"
            :disabled="isConfirmation || !hasGuaranteeVpnRateLimit"
            data-cy="self-terminal-create-guarantee-vpn"
            @update:model-value="handleUpdateUseGuaranteeVpn"
          />
          <div v-if="isNoNetworkInUse" class="text-sm text-warning">{{ t('selfTerminals.note.networkRequired') }}</div>
        </InputGrid>
        <div class="pl-5">
          <InputGrid
            :label="t('terminals.connectionAddressAct')"
            :required="useGuaranteeVpn"
            :label-width="251"
            :help="t('selfTerminals.help.connectionAddressAct')"
          >
            <InputPrefixedIpForm
              v-model="inputData.guarantee.vpnActConnectedIpv4Prefix"
              :prefix="30"
              placeholder="192.0.2.4"
              :disabled="isConfirmation || !useGuaranteeVpn"
              :required="useGuaranteeVpn"
              :rules="[rules.ipAddress]"
              maxlength="15"
              size="small"
              data-cy="self-terminal-create-guarantee-vpn-act-connected-ipv4-prefix"
              @valid="(valid: boolean) => (inputValid.guarantee.vpnActConnectedIpv4Prefix = valid)"
            />
          </InputGrid>
          <InputGrid
            :label="t('terminals.connectionAddressSby')"
            :required="useGuaranteeVpn"
            :label-width="251"
            :help="t('selfTerminals.help.connectionAddressSby')"
          >
            <InputPrefixedIpForm
              v-model="inputData.guarantee.vpnSbyConnectedIpv4Prefix"
              :prefix="30"
              placeholder="192.0.2.12"
              :disabled="isConfirmation || !useGuaranteeVpn"
              :required="useGuaranteeVpn"
              :rules="[rules.ipAddress]"
              maxlength="15"
              size="small"
              data-cy="self-terminal-create-guarantee-vpn-sby-connected-ipv4-prefix"
              @valid="(valid: boolean) => (inputValid.guarantee.vpnSbyConnectedIpv4Prefix = valid)"
            />
          </InputGrid>
          <div><!-- 接続アドレス (Sby)に border-bottom を表示するためのダミーの要素 --></div>
        </div>
      </div>
      <InputGrid :label="t('terminals.vpnIdName')" :required="useGuaranteeVpn">
        <SelectForm
          v-model="inputData.vpnId"
          :options="vpnListOptions"
          :required="useGuaranteeVpn"
          placeholder="V000000002 / 拠点間通信用VPN"
          :disabled="isConfirmation || !useGuaranteeVpn"
          size="middle"
          data-cy="self-terminal-create-vpn-id"
          @valid="(valid: boolean) => (inputValid.vpnId = valid)"
        />
        <template v-if="useGuaranteeVpn" #footer>
          <div class="text-warning text-pre-wrap">
            {{ t('terminals.note.vpnId') }}
          </div>
        </template>
      </InputGrid>
      <InputGrid
        v-if="useGuaranteeVpn"
        :label="t('terminals.vpnRouteLimit')"
        :required="useGuaranteeVpn"
        :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
      >
        <template #help>
          <i18n-t keypath="selfTerminals.help.vpnRouteLimit" scope="global">
            <template #linkText>
              <NuxtLink :to="SELF_TERMINAL_LINK.PRICE" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <RadioForm
          v-model="inputData.vpnRouteLimit"
          :options="vpnRouteLimitOptions"
          :disabled="isConfirmation || !useGuaranteeVpn"
          :required="useGuaranteeVpn"
          data-cy="self-terminal-create-vpn-route-limit"
          @valid="(valid: boolean) => (inputValid.vpnRouteLimit = valid)"
        />
      </InputGrid>
      <EditVpnAdvertiseNetworks
        v-if="useGuaranteeVpn"
        v-model="inputData.vpnAdvertiseNetworks"
        :disabled="isConfirmation"
        :max-items="foundVpnRouteLimit"
        :vpn-id="inputData.vpnId"
        @valid="(valid: boolean) => (inputValid.vpnAdvertiseNetworks = valid)"
      />
    </InnerCard>

    <!-- フロー可視化 -->
    <EditTrafficReportFlowAnalyzer
      v-model="inputData.trafficReportFlowAnalyzer"
      v-model:valid="inputValid.trafficReportFlowAnalyzer"
      :primary-circuit-type="CircuitTypes.Guarantee"
      :disabled="isConfirmation"
    />

    <!-- セキュリティオプション -->
    <EditSecurityOptions
      v-model:threat-detection-plan="inputData.threatDetectionPlan"
      v-model:threat-detection-plan-valid="inputValid.threatDetectionPlan"
      v-model:flow-collector-plan="inputData.flowCollectorPlan"
      v-model:flow-collector-plan-valid="inputValid.flowCollectorPlan"
      v-model:behavior-detection-plan="inputData.behaviorDetectionPlan"
      v-model:behavior-detection-plan-valid="inputValid.behaviorDetectionPlan"
      :disabled="isConfirmation"
    />

    <InnerCard v-if="isConfirmation && useGuaranteeVpn" :title="t('terminals.confirm.title')">
      <div
        v-for="checked in confirmationChecked"
        :key="checked.key"
        :data-cy="`self-terminal-create-checkbox-${checked.key}`"
        class="flex-flex-start-center mt-2"
      >
        <CheckboxBase v-model:value="checked.value" />
        <i18n-t :keypath="checked.keypath" tag="span" scope="global" class="text-pre-wrap ml-6 text-warning">
          <template v-if="!!checked.link" #here>
            <NuxtLink :to="checked.link" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </div>
    </InnerCard>

    <!-- 留意事項 -->
    <template v-if="isConfirmation">
      <SelfTerminalTermsOfService
        v-for="agreement in termsOfServiceAgreement"
        :key="agreement.key"
        v-model="agreement.value"
        :type="agreement.key"
        :data-cy="`self-terminal-create-terms-of-service-${agreement.key}`"
      />
    </template>

    <div class="flex-flex-end-center">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="self-terminal-create-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :width="180"
        :disabled="submitDisabled || loading"
        :text="submit.text"
        data-cy="self-terminal-create-submit-button"
        @click="submit.click"
      />
    </div>
    <TerminalSuccessDialog
      :open="openSuccessDialog"
      :terminal-id="createdTerminalId"
      :show-help-desk-campaign="showHelpDeskCampaign"
      @close="router.back()"
    />
    <TermsOfServiceConfirmDialog
      :open="openTermsOfServiceDialog"
      :tenant-id="tenantId"
      :show-traffic-report-flow-analyzer="requiredTrafficReportFlowAnalyzer"
      :show-security="requiredSecurity"
      :show-behavior-detection="requiredBehaviorDetection"
      @close="openTermsOfServiceDialog = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.ml-272px {
  margin-left: 272px;
}
</style>
