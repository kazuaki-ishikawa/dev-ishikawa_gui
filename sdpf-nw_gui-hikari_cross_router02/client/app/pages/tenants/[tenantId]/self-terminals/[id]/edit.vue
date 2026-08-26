<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import {
  CircuitTypes,
  TerminalTypes,
  ResourceStatusTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
} from '@/api/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import {
  SELF_TERMINAL_LINK,
  VpnRouteLimitList,
  initialSelfTerminalInputData,
  initialSelfTerminalValid,
  initialTermsOfServiceAgreement,
} from '@/api/selfTerminals/constants'
import { TERMINAL_LINK } from '@/api/terminals/constants'
import type { SelfTerminalPutRequest } from '@/api/selfTerminals/types'
import { IconTypes } from '@/components/icons/constants'

type ValidKeys = keyof typeof initialSelfTerminalValid

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rules = useRules()
const { navigationGuard } = useNavigationGuard()

const tenantId = computed(() => route.params.tenantId as string)
const terminalId = computed(() => route.params.id as string)
const { loading } = useLoading()

const { getTrafficReportFlowAnalyzerPutRequest, getThreatDetection, getFlowCollector, getBehaviorDetection } =
  useTerminalInput()
const { useableOptions, vpnRouteLimitOptions } = useSelfTerminals()
const { editable, selfTerminal, getSelfTerminal } = useGetSelfTerminal()
const { updateSelfTerminal } = useUpdateSelfTerminal()

const { getAllGuaranteeList, getAttachableGuaranteeList } = useGetAllGuaranteeList()
const { getSummaryVpnList, unterminatedVpnListOptions } = useGetSummaryVpnList()
const { customerNoteList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()

const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)
const { securityTermsOfServiceAccepted, getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted } =
  useTermsOfService(TermsOfServiceBasePath.Security)

const { getSecurityHelpDesk, shouldShowHelpDeskCampaign } = useGetSecurityHelpDesk()

const { currentSettingsBehaviorDetectionPlan, getSettingsBehaviorDetection } = useGetSettingsBehaviorDetection()

const updatedOrderId = ref<string>('')
const openTermsOfServiceDialog = ref(false)
const openSuccessDialog = ref(false)
const inputData = ref(structuredClone(initialSelfTerminalInputData))
const inputValid = ref(structuredClone(initialSelfTerminalValid))

const termsOfServiceAgreementRef = ref(structuredClone(initialTermsOfServiceAgreement))
const termsOfServiceAgreement = computed({
  get: () =>
    termsOfServiceAgreementRef.value.filter(checked => {
      switch (checked.key) {
        case 'self-terminal':
          return false
        case 'wan-security-options':
          // WANセキュリティオプションを新規に申し込んだ場合
          return (
            (originalData.value.threatDetectionPlan === SecurityOptionTypes.NoSubscription &&
              inputData.value.threatDetectionPlan !== SecurityOptionTypes.NoSubscription) ||
            (originalData.value.flowCollectorPlan === SecurityOptionTypes.NoSubscription &&
              inputData.value.flowCollectorPlan !== SecurityOptionTypes.NoSubscription) ||
            (originalData.value.behaviorDetectionPlan === BehaviorDetectionOptionTypes.NoSubscription &&
              inputData.value.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription)
          )
        case 'traffic-report-flow-analyzer':
          // トラフィックレポート・フローアナライザーを新規に申し込んだ場合
          return (
            originalData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
              TrafficReportFlowAnalyzerPlanTypes.NoSubscription &&
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

const useGuaranteeVpnString = ref('')
const useGuaranteeVpn = computed({
  get: () => useGuaranteeVpnString.value === 'true',
  set: (value: boolean) => {
    useGuaranteeVpnString.value = `${value}`
  },
})
const internetAdvertise = computed(() => inputData.value.guarantee.internetAdvertise === 'true')
watch(internetAdvertise, next => {
  if (!next) {
    inputData.value.guarantee.internetPingMonitoring = 'false'
  }
})

// 変更時に紐付け可能なギャランティ回線は active のもののみ
const guaranteeList = computed(() => getAttachableGuaranteeList(terminalId.value, [ResourceStatusTypes.Active]))
const attachableGuaranteeListOptions = computed(() =>
  guaranteeList.value.map(guarantee => ({
    text: `${guarantee.guaranteeId} / ${guarantee.customerNote}`,
    value: guarantee.guaranteeId,
  })),
)
const selectedGuarantee = computed(() =>
  guaranteeList.value.find(guarantee => guarantee.guaranteeId === inputData.value.guarantee.guaranteeId),
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
const foundVpnRouteLimit = computed(() => VpnRouteLimitList.find(num => `${num}` === inputData.value.vpnRouteLimit))

const originalData = computed(() => ({
  customerNote: selfTerminal.value?.customerNote ?? '',
  installationPostalCode: selfTerminal.value?.installationPostalCode ?? '',
  installationAddress: selfTerminal.value?.installationAddress ?? '',
  vpnId: selfTerminal.value?.vpnId ?? '',
  vpnRouteLimit: `${selfTerminal.value?.vpnRouteLimit ?? ''}`,
  vpnAdvertiseNetworks: selfTerminal.value?.vpnAdvertiseNetworks ?? [],
  trafficReportFlowAnalyzer: {
    trafficReportFlowAnalyzerPlan: selfTerminal.value?.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ?? '',
    trafficReportFlowAnalyzerAlert: `${selfTerminal.value?.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert ?? ''}`,
  },
  threatDetectionPlan: selfTerminal.value?.threatDetection.threatDetectionPlan ?? SecurityOptionTypes.NoSubscription,
  flowCollectorPlan: selfTerminal.value?.flowCollector.flowCollectorPlan ?? SecurityOptionTypes.NoSubscription,
  behaviorDetectionPlan:
    selfTerminal.value?.behaviorDetection.behaviorDetectionPlan ?? BehaviorDetectionOptionTypes.NoSubscription,
  guarantee: {
    guaranteeId: selfTerminal.value?.guarantee?.guaranteeId ?? '',
    internetAdvertise: `${!!selfTerminal.value?.guarantee?.internet?.advertise}`,
    internetPingMonitoring: `${!!selfTerminal.value?.guarantee?.internet?.pingMonitoring}`,
    vpnActConnectedIpv4Prefix: selfTerminal.value?.guarantee?.vpn?.act?.connectedIpv4Prefix ?? '',
    vpnSbyConnectedIpv4Prefix: selfTerminal.value?.guarantee?.vpn?.sby?.connectedIpv4Prefix ?? '',
  },
}))

watch(originalData, () => {
  inputData.value = {
    ...originalData.value,
    trafficReportFlowAnalyzer: { ...originalData.value.trafficReportFlowAnalyzer },
    guarantee: { ...originalData.value.guarantee },
  }
  useGuaranteeVpn.value = !!originalData.value.vpnId
})
const changed = computed(() => !isEqual(inputData.value, originalData.value))
watchEffect(() => navigationGuard(changed.value))

const isConfirmation = ref(false)
const isNoNetworkInUse = computed(() => !internetAdvertise.value && !useGuaranteeVpn.value)
const saveDisabled = computed(() => {
  const invalid = Object.values(inputValid.value).some(valid =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  )
  return (
    !editable.value ||
    invalid ||
    !changed.value ||
    !useGuaranteeVpnString.value ||
    isNoNetworkInUse.value ||
    (isConfirmation.value && termsOfServiceAgreement.value.some(checked => !checked.value))
  )
})

watch(isConfirmation, next => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  inputData.value.vpnAdvertiseNetworks = inputData.value.vpnAdvertiseNetworks.filter(Boolean)
  if (!next) {
    termsOfServiceAgreement.value = structuredClone(initialTermsOfServiceAgreement)
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

const showHelpDeskCampaign = computed(() =>
  shouldShowHelpDeskCampaign(
    inputData.value.threatDetectionPlan,
    inputData.value.flowCollectorPlan,
    inputData.value.behaviorDetectionPlan,
  ),
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
const handleSubmit = async () => {
  const request = Object.entries(originalData.value).reduce<SelfTerminalPutRequest>((acc, [key, originalValue]) => {
    const inputValue = inputData.value[key as keyof typeof initialSelfTerminalInputData]
    if (isEqual(inputValue, originalValue)) {
      return acc
    }
    switch (key) {
      case 'guarantee':
        return {
          ...acc,
          guarantee: {
            guaranteeId: inputData.value.guarantee.guaranteeId,
            internet: {
              advertise: internetAdvertise.value,
              pingMonitoring: inputData.value.guarantee.internetPingMonitoring === 'true',
            },
            vpn: useGuaranteeVpn.value
              ? {
                  act: {
                    connectedIpv4Prefix: inputData.value.guarantee.vpnActConnectedIpv4Prefix,
                  },
                  sby: {
                    connectedIpv4Prefix: inputData.value.guarantee.vpnSbyConnectedIpv4Prefix,
                  },
                }
              : undefined,
          },
        }
      case 'vpnId':
        // VPNを利用しない場合、guarantee.vpn を 送信しない
        return useGuaranteeVpn.value ? { ...acc, vpnId: inputData.value.vpnId } : { ...acc, vpnId: null }
      case 'vpnRouteLimit':
        return {
          ...acc,
          // VPNを利用しない場合は vpnRouteLimit を 送信しない
          vpnRouteLimit: useGuaranteeVpn.value ? foundVpnRouteLimit.value : undefined,
        }
      case 'trafficReportFlowAnalyzer': {
        return {
          ...acc,
          trafficReportFlowAnalyzer: getTrafficReportFlowAnalyzerPutRequest(
            inputData.value.trafficReportFlowAnalyzer,
            originalData.value.trafficReportFlowAnalyzer,
          ),
        }
      }
      case 'threatDetectionPlan': {
        const threatDetection = getThreatDetection(inputData.value.threatDetectionPlan)
        return { ...acc, threatDetection }
      }
      case 'flowCollectorPlan': {
        const flowCollector = getFlowCollector(inputData.value.flowCollectorPlan)
        return { ...acc, flowCollector }
      }
      case 'behaviorDetectionPlan': {
        const behaviorDetection = getBehaviorDetection(inputData.value.behaviorDetectionPlan)
        return { ...acc, behaviorDetection }
      }
      default:
        return { ...acc, [key]: inputValue }
    }
  }, {})
  const response = await updateSelfTerminal(terminalId.value, request)
  navigationGuard(false)
  openSuccessDialog.value = true
  updatedOrderId.value = response.orderId ?? ''
}

const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : switchConfirm
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})

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
    inputData.value.vpnAdvertiseNetworks = []
    inputValid.value.vpnAdvertiseNetworks = true
  } else {
    inputData.value.vpnRouteLimit = `${VpnRouteLimitList[0]}`
  }
}

onBeforeMount(async () => {
  getAllResourceSummaryTerminalList({ terminalType: TerminalTypes.Self })
  getAllGuaranteeList()
  getSummaryVpnList()
  await getSelfTerminal(terminalId.value)

  const valid = Object.keys(inputValid.value).reduce((acc, cur) => {
    if (typeof inputValid.value[cur as ValidKeys] === 'boolean') {
      return { ...acc, [cur]: true }
    }
    const objectValid = Object.keys(inputValid.value[cur as ValidKeys]).reduce((acc, cur) => {
      return { ...acc, [cur]: true }
    }, {})
    return { ...acc, [cur]: objectValid }
  }, structuredClone(initialSelfTerminalValid))
  inputValid.value = valid
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-5">
      {{ t('confirm.update') }}
    </div>
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
      <DetailGrid>
        <div>{{ t('terminals.terminalId') }}</div>
        <div>{{ selfTerminal?.terminalId }}</div>
      </DetailGrid>
      <InputGrid required :label="t('terminals.name')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList, terminalId)]"
          required
          maxlength="64"
          placeholder="東京本社A館１号機"
          :disabled="isConfirmation"
          data-cy="self-terminals-id-edit-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.installationPostalCode')">
        <SearchPostalCode
          v-model="inputData.installationPostalCode"
          v-model:address="inputData.installationAddress"
          v-model:valid="inputValid.installationPostalCode"
          :rules="[rules.postalCode]"
          required
          :disabled="isConfirmation"
          :placeholder="t('placeholder.postalCode')"
          data-cy="self-terminals-id-edit-installation-postal-code"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.installationAddress')" :help="t('terminals.help.address')">
        <InputForm
          v-model="inputData.installationAddress"
          size="large"
          maxlength="300"
          required
          placeholder="東京都千代田区大手町２−３−１"
          :rules="[
            rules.fullwidthCharacter,
            rules.forbiddenControlCharacter,
            rules.noSpaceAtBeginningAndEnd,
            rules.noConsecutiveSpaces,
            rules.startsWithPrefecture,
          ]"
          :disabled="isConfirmation"
          data-cy="self-terminals-id-edit-installation-address"
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
          required
          :options="attachableGuaranteeListOptions"
          placeholder="Z000000002 / ギャランティアクセス名"
          :disabled="isConfirmation"
          size="middle"
          data-cy="self-terminals-id-edit-guarantee-guarantee-id"
          @valid="(valid: boolean) => (inputValid.guarantee.guaranteeId = valid)"
        />
      </InputGrid>
      <div class="pl-5">
        <!-- インターネット -->
        <InputGrid required :label="t('terminals.internet')" :label-width="271">
          <RadioForm
            v-model="inputData.guarantee.internetAdvertise"
            :options="useableOptions"
            :disabled="isConfirmation || !hasGuaranteeInternetRateLimit"
            data-cy="self-terminals-id-edit-guarantee-internet"
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
              data-cy="self-terminals-id-edit-guarantee-internet-ping-monitoring"
              @valid="(valid: boolean) => (inputValid.guarantee.internetPingMonitoring = valid)"
            />
            <template #footer>
              <div v-if="inputData.guarantee.internetPingMonitoring === 'true'" class="text-sm text-error mt-2 ml-68">
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
        <!-- VPN -->
        <InputGrid required :label="t('terminals.vpn')" :label-width="271">
          <RadioForm
            :model-value="useGuaranteeVpnString"
            :options="useableOptions"
            :disabled="isConfirmation || !hasGuaranteeVpnRateLimit"
            data-cy="self-terminals-id-edit-guarantee-vpn"
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
              data-cy="self-terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"
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
              data-cy="self-terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"
              @valid="(valid: boolean) => (inputValid.guarantee.vpnSbyConnectedIpv4Prefix = valid)"
            />
          </InputGrid>
          <div><!-- 接続アドレス (Sby)に border-bottom を表示するためのダミーの要素 --></div>
        </div>
      </div>
      <InputGrid :label="t('terminals.vpnIdName')" :required="useGuaranteeVpn">
        <SelectForm
          v-model="inputData.vpnId"
          :options="unterminatedVpnListOptions"
          :required="useGuaranteeVpn"
          placeholder="V000000002 / 拠点間通信用VPN"
          :disabled="isConfirmation || !useGuaranteeVpn"
          size="middle"
          data-cy="self-terminals-id-edit-vpn-id"
          @valid="(valid: boolean) => (inputValid.vpnId = valid)"
        />
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
          :disabled="isConfirmation"
          :required="useGuaranteeVpn"
          data-cy="self-terminals-id-edit-vpn-route-limit"
          @valid="(valid: boolean) => (inputValid.vpnRouteLimit = valid)"
        />
      </InputGrid>
      <EditVpnAdvertiseNetworks
        v-if="useGuaranteeVpn"
        v-model="inputData.vpnAdvertiseNetworks"
        :terminal-id="terminalId"
        :disabled="isConfirmation"
        :max-items="foundVpnRouteLimit"
        :vpn-id="inputData.vpnId"
        @valid="(valid: boolean) => (inputValid.vpnAdvertiseNetworks = valid)"
      />
      <DetailGrid>
        <div>{{ t('terminals.asNumber') }}</div>
        <div data-cy="self-terminals-id-edit-as-number">{{ selfTerminal?.asNumber }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- フロー可視化 -->
    <EditTrafficReportFlowAnalyzer
      v-model="inputData.trafficReportFlowAnalyzer"
      v-model:valid="inputValid.trafficReportFlowAnalyzer"
      :primary-circuit-type="CircuitTypes.Guarantee"
      :initial-traffic-report-flow-analyzer="selfTerminal?.trafficReportFlowAnalyzer"
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
      :threat-detection="selfTerminal?.threatDetection"
      :flow-collector="selfTerminal?.flowCollector"
      :behavior-detection="selfTerminal?.behaviorDetection"
      :disabled="isConfirmation"
    />

    <template v-if="isConfirmation">
      <!-- 規約同意 -->
      <SelfTerminalTermsOfService
        v-for="agreement in termsOfServiceAgreement"
        :key="agreement.key"
        v-model="agreement.value"
        :type="agreement.key"
        :data-cy="`self-terminals-id-edit-terminal-terms-of-service-${agreement.key}`"
      />

      <!-- 電源OFF時の変更制限の注意喚起 -->
      <div class="text-warning mb-4">
        <i18n-t keypath="terminals.note.checkRouterPower" scope="global">
          <template #here>
            <NuxtLink :to="TERMINAL_LINK.RINK_0153" target="_blank">{{ t('common.here') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </template>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="self-terminals-id-edit-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="saveDisabled || loading"
        :text="submit.text"
        :width="180"
        data-cy="self-terminals-id-edit-submit-button"
        @click="submit.click"
      />
    </div>
    <TermsOfServiceConfirmDialog
      :open="openTermsOfServiceDialog"
      :tenant-id="tenantId"
      :show-traffic-report-flow-analyzer="requiredTrafficReportFlowAnalyzer"
      :show-security="requiredSecurity"
      :show-behavior-detection="requiredBehaviorDetection"
      @close="openTermsOfServiceDialog = false"
    />
    <TerminalSuccessDialog
      :open="openSuccessDialog"
      :order-id="updatedOrderId"
      :show-help-desk-campaign="showHelpDeskCampaign"
      @close="router.back()"
    />
  </CardContainer>
</template>
