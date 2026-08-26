<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { TerminalTypes, BandwidthUnitTypes } from '@/api/constants'
import { CampaignTypes } from '@/api/campaigns/constants'
import {
  VpnRateLimitTypes,
  InternetRateLimitTypes,
  initialGuaranteeInputData,
  ConnectionTypes,
} from '@/api/guarantees/constants'
import type { ThresholdType, DurationType, NotificationIntervalType } from '@/api/guarantees/types'
import { NetworkTypes } from '@/api/terminals/constants'
import { IconTypes } from '@/components/icons/constants'

const EditField = [
  'customerNote',
  'internetRateLimit',
  'internetThreshold',
  'internetDuration',
  'internetNotificationInterval',
  'vpnRateLimit',
  'vpnThreshold',
  'vpnDuration',
  'vpnNotificationInterval',
] as const

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rules = useRules()
const tenantId = computed(() => route.params.tenantId as string)
const guaranteeId = computed(() => route.params.id as string)

const { loading } = useLoading()

const {
  inputData,
  inputValid,
  thresholdOptions,
  durationOptions,
  notificationIntervalOptions,
  rateLimitRule,
  getInternetRateLimitOptions,
  getVpnRateLimitOptions,
  updateInternetRateLimit,
  updateVpnRateLimit,
  updateInternetThreshold,
  updateVpnThreshold,
} = useGuarantees()
const { getAllResourceSummaryGuaranteeList, customerNoteList } = useGetAllResourceSummaryGuaranteeList()
const { guarantee, editable, getGuarantee } = useGetGuarantee()
const { updateGuarantee } = useUpdateGuarantee()

const terminalId = computed(() => guarantee.value?.terminalId ?? '')
const { terminal, getTerminal } = useGetTerminal()
const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { selfTerminal, getSelfTerminal } = useGetSelfTerminal()
const { campaigns, getCampaignList } = useGetCampaignList()

const terminalType = computed(
  () =>
    resourceSummaryTerminalList.value.terminals.find(terminal => terminal.terminalId === guarantee.value?.terminalId)
      ?.terminalType,
)

const vpnRateLimitRequired = computed(
  () =>
    (terminalType.value === TerminalTypes.Rental && !!terminal.value?.vpnId) ||
    (terminalType.value === TerminalTypes.Self && !!selfTerminal.value?.vpnId),
)
const internetRateLimitRequired = computed(() => {
  if (terminalType.value === TerminalTypes.Rental) {
    return (
      (terminal.value?.breakOut ?? []).length > 0 ||
      terminal.value?.defaultGateway.nexthopNetwork === NetworkTypes.Internet ||
      !!terminal.value?.wanStaticRoutes?.some(v => v.nexthopNetwork === NetworkTypes.Internet)
    )
  } else if (terminalType.value === TerminalTypes.Self) {
    return !!selfTerminal.value?.guarantee?.internet?.advertise
  } else {
    return false
  }
})
const areRateLimitsEmpty = computed(() => !inputData.value.internetRateLimit && !inputData.value.vpnRateLimit)

// rateLimit のルール
const attachedCampaign = computed(
  () =>
    campaigns.value.find(campaign => campaign.resourceId === guarantee.value?.guaranteeId)?.campaignInfo?.networkType,
)
const extraRateLimit = computed(() => (guarantee.value?.physicalBandwidth === '100M' ? 10 : 100))
const internetRateLimitOptions = computed(() => {
  const options = getInternetRateLimitOptions(guarantee.value?.physicalBandwidth ?? '', terminalType.value ?? '')
  if (attachedCampaign.value === ConnectionTypes.Internet) {
    return options.map(option => ({
      text: t('guarantees.rateLimitCampaignText', {
        rateLimit: `${convertBandwidthToUnit(option.text, BandwidthUnitTypes.MB) - extraRateLimit.value}M`,
        extraRateLimit: extraRateLimit.value,
      }),
      value: option.value,
    }))
  }
  return options
})

const vpnRateLimitOptions = computed(() => {
  const options = getVpnRateLimitOptions(guarantee.value?.physicalBandwidth ?? '', terminalType.value ?? '')
  if (attachedCampaign.value === ConnectionTypes.Vpn) {
    return options.map(option => ({
      text: t('guarantees.rateLimitCampaignText', {
        rateLimit: `${convertBandwidthToUnit(option.text, BandwidthUnitTypes.MB) - extraRateLimit.value}M`,
        extraRateLimit: extraRateLimit.value,
      }),
      value: option.value,
    }))
  }
  return options
})

const internetRateLimitRule = (vpnRateLimit: string) => (internetRateLimit: string) =>
  rateLimitRule({
    target: 'internet',
    terminalType: terminalType.value ?? '',
    physicalBandwidth: guarantee.value?.physicalBandwidth ?? '',
    vpnRateLimit,
    internetRateLimit,
  })
const vpnRateLimitRule = (internetRateLimit: string) => (vpnRateLimit: string) =>
  rateLimitRule({
    target: 'vpn',
    terminalType: terminalType.value ?? '',
    physicalBandwidth: guarantee.value?.physicalBandwidth ?? '',
    vpnRateLimit,
    internetRateLimit,
  })

const showVpnRateLimitWarning = computed(
  () =>
    !terminalType.value &&
    convertBandwidthToUnit(guarantee.value?.physicalBandwidth ?? '') ===
      convertBandwidthToUnit(inputData.value.vpnRateLimit),
)

const invalid = computed(() =>
  Object.entries(inputValid.value)
    .filter(([key]) => EditField.includes(key))
    .some(([_, valid]) => !valid),
)
const disabled = computed(
  () => !editable.value || invalid.value || isEqual(inputData.value, originalData.value) || areRateLimitsEmpty.value,
)

const isConfirmation = ref(false)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const { navigationGuard } = useNavigationGuard()
const originalData = computed(() => ({
  ...initialGuaranteeInputData,
  customerNote: guarantee.value?.customerNote ?? '',
  internetRateLimit: guarantee.value?.internet?.rateLimit ?? '',
  internetThreshold: guarantee.value?.internet?.alertSetting?.threshold ?? '',
  internetDuration: guarantee.value?.internet?.alertSetting?.duration ?? '',
  internetNotificationInterval: guarantee.value?.internet?.alertSetting?.notificationInterval ?? '',
  vpnRateLimit: guarantee.value?.vpn?.rateLimit ?? '',
  vpnThreshold: guarantee.value?.vpn?.alertSetting?.threshold ?? '',
  vpnDuration: guarantee.value?.vpn?.alertSetting?.duration ?? '',
  vpnNotificationInterval: guarantee.value?.vpn?.alertSetting?.notificationInterval ?? '',
}))
watch(originalData, () => {
  inputData.value = { ...inputData.value, ...originalData.value }
  inputValid.value = EditField.reduce((acc, key) => ({ ...acc, [key]: true }), { ...inputValid.value })
})
watchEffect(() => navigationGuard(!isEqual(inputData.value, originalData.value)))

const handleSave = async () => {
  const request = {
    customerNote: inputData.value.customerNote,
    internet: {
      rateLimit: InternetRateLimitTypes.find(rateLimit => rateLimit === inputData.value.internetRateLimit) || null,
      alertSetting: inputData.value.internetThreshold
        ? {
            threshold: inputData.value.internetThreshold as ThresholdType,
            duration: inputData.value.internetDuration as DurationType,
            notificationInterval: inputData.value.internetNotificationInterval as NotificationIntervalType,
          }
        : null,
    },
    vpn: {
      rateLimit: VpnRateLimitTypes.find(rateLimit => rateLimit === inputData.value.vpnRateLimit) || null,
      alertSetting: inputData.value.vpnThreshold
        ? {
            threshold: inputData.value.vpnThreshold as ThresholdType,
            duration: inputData.value.vpnDuration as DurationType,
            notificationInterval: inputData.value.vpnNotificationInterval as NotificationIntervalType,
          }
        : null,
    },
  }
  await updateGuarantee(guaranteeId.value, request)
  navigationGuard(false)
  router.back()
}

const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})

onBeforeMount(async () => {
  getAllResourceSummaryGuaranteeList()
  if (guaranteeId.value) {
    await getGuarantee(guaranteeId.value)
    getCampaignList({ resourceId: guaranteeId.value, campaignType: CampaignTypes.GuaranteeOneRankUp })
  }
  if (terminalId.value) {
    await getAllResourceSummaryTerminalList({ terminalId: [terminalId.value] })
    if (terminalType.value === TerminalTypes.Rental) {
      // レートリミットの判定用に getTerminal を実行する. データ取得前にボタンが活性化されないよう await で完了を待つ
      await getTerminal(terminalId.value)
    } else if (terminalType.value === TerminalTypes.Self) {
      await getSelfTerminal(terminalId.value)
    }
  }
})
</script>

<template>
  <div>
    <!-- アンカーボタン -->
    <GuaranteeAnchorButton v-if="!isConfirmation" class="mb-3" />
    <!-- 更新確認 -->
    <div v-if="isConfirmation" class="mb-2">{{ t('confirm.update') }}</div>
    <!-- 詳細 -->
    <CardContainer>
      <div
        v-if="attachedCampaign"
        class="mb-4 text-error text-pre-wrap"
        data-cy="guarantees-circuits-id-edit-rate-limit-disabled"
      >
        {{ t('guarantees.rateLimitDisabled') }}
      </div>
      <GuaranteeDetail :guarantee="guarantee" :tenant-id="tenantId" :terminal-type="terminalType">
        <template #customer-note>
          <InputGrid required :label="t('guarantees.customerNote')">
            <InputForm
              v-model="inputData.customerNote"
              :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList, guaranteeId)]"
              required
              maxlength="64"
              :placeholder="t('guarantees.customerNote')"
              :disabled="isConfirmation"
              data-cy="guarantees-circuits-id-edit-customer-note"
              @valid="(valid: boolean) => (inputValid.customerNote = valid)"
            />
          </InputGrid>
        </template>
        <template #rate-limit>
          <!-- インターネット -->
          <div class="mt-3 text-secondary text-lg">{{ t('guarantees.internet') }}</div>
          <InputGrid
            :required="internetRateLimitRequired || areRateLimitsEmpty"
            :label="t('guarantees.rateLimit')"
            :help-option="{
              icon: IconTypes.AlertTriangle,
              color: 'error',
              contentWidth: 760,
            }"
          >
            <template v-if="internetRateLimitRequired" #help>
              <GuaranteeRateLimitHelp :connection-type="ConnectionTypes.Internet" />
            </template>
            <template v-else-if="areRateLimitsEmpty" #help>
              {{ t('guarantees.rateLimitsEmpty') }}
            </template>
            <SelectForm
              v-model="inputData.internetRateLimit"
              :options="internetRateLimitOptions"
              :required="internetRateLimitRequired || areRateLimitsEmpty"
              :disabled="isConfirmation || !!attachedCampaign"
              :placeholder="internetRateLimitOptions[0]?.text"
              :rules="[internetRateLimitRule(inputData.vpnRateLimit)]"
              data-cy="guarantees-circuits-id-edit-internet-rate-limit"
              @valid="(valid: boolean) => (inputValid.internetRateLimit = valid)"
              @update:model-value="updateInternetRateLimit"
            />
          </InputGrid>
          <div class="mt-3 ml-5">
            <div class="text-secondary text-lg">{{ t('guarantees.alertSetting') }}</div>
            <InputGrid :label="t('guarantees.threshold')" :label-width="270">
              <SelectForm
                :model-value="inputData.internetThreshold"
                :options="thresholdOptions"
                :placeholder="thresholdOptions[0]?.text"
                :disabled="isConfirmation || !inputData.internetRateLimit"
                data-cy="guarantees-circuits-id-edit-internet-threshold"
                @valid="(valid: boolean) => (inputValid.internetThreshold = valid)"
                @update:model-value="updateInternetThreshold"
              />
            </InputGrid>
            <InputGrid :required="!!inputData.internetThreshold" :label="t('guarantees.duration')" :label-width="270">
              <SelectForm
                v-model="inputData.internetDuration"
                :options="durationOptions"
                :placeholder="durationOptions[0]?.text"
                :required="!!inputData.internetThreshold"
                :disabled="isConfirmation || !inputData.internetThreshold"
                data-cy="guarantees-circuits-id-edit-internet-duration"
                @valid="(valid: boolean) => (inputValid.internetDuration = valid)"
              />
            </InputGrid>
            <InputGrid
              :required="!!inputData.internetThreshold"
              :label="t('guarantees.notificationInterval')"
              :label-width="270"
            >
              <SelectForm
                v-model="inputData.internetNotificationInterval"
                :options="notificationIntervalOptions"
                :placeholder="notificationIntervalOptions[0]?.text"
                :required="!!inputData.internetThreshold"
                :disabled="isConfirmation || !inputData.internetThreshold"
                data-cy="guarantees-circuits-id-edit-internet-notification-interval"
                @valid="(valid: boolean) => (inputValid.internetNotificationInterval = valid)"
              />
            </InputGrid>
          </div>
          <!-- VPN -->
          <div class="mt-3 text-secondary text-lg">{{ t('guarantees.vpn') }}</div>
          <InputGrid
            :required="vpnRateLimitRequired || areRateLimitsEmpty"
            :label="t('guarantees.rateLimit')"
            :help-option="{
              icon: IconTypes.AlertTriangle,
              color: 'error',
              contentWidth: 760,
            }"
          >
            <template v-if="vpnRateLimitRequired" #help>
              <GuaranteeRateLimitHelp :connection-type="ConnectionTypes.Vpn" />
            </template>
            <template v-else-if="areRateLimitsEmpty" #help>
              {{ t('guarantees.rateLimitsEmpty') }}
            </template>
            <SelectForm
              v-model="inputData.vpnRateLimit"
              :options="vpnRateLimitOptions"
              :required="vpnRateLimitRequired || areRateLimitsEmpty"
              :disabled="isConfirmation || !!attachedCampaign"
              :placeholder="vpnRateLimitOptions[0]?.text"
              :rules="[vpnRateLimitRule(inputData.internetRateLimit)]"
              data-cy="guarantees-circuits-id-edit-vpn-rate-limit"
              @valid="(valid: boolean) => (inputValid.vpnRateLimit = valid)"
              @update:model-value="updateVpnRateLimit"
            />
            <div v-if="showVpnRateLimitWarning" class="text-warning text-sm mt-1 text-pre-wrap">
              {{ t('guarantees.vpnRateLimitMax') }}
            </div>
          </InputGrid>
          <div class="mt-3 ml-5">
            <div class="text-secondary text-lg">{{ t('guarantees.alertSetting') }}</div>
            <InputGrid :label="t('guarantees.threshold')" :label-width="270">
              <SelectForm
                :model-value="inputData.vpnThreshold"
                :options="thresholdOptions"
                :placeholder="thresholdOptions[0]?.text"
                :disabled="isConfirmation || !inputData.vpnRateLimit"
                data-cy="guarantees-circuits-id-edit-vpn-threshold"
                @valid="(valid: boolean) => (inputValid.vpnThreshold = valid)"
                @update:model-value="updateVpnThreshold"
              />
            </InputGrid>
            <InputGrid :required="!!inputData.vpnThreshold" :label="t('guarantees.duration')" :label-width="270">
              <SelectForm
                v-model="inputData.vpnDuration"
                :options="durationOptions"
                :placeholder="durationOptions[0]?.text"
                :required="!!inputData.vpnThreshold"
                :disabled="isConfirmation || !inputData.vpnThreshold"
                data-cy="guarantees-circuits-id-edit-vpn-duration"
                @valid="(valid: boolean) => (inputValid.vpnDuration = valid)"
              />
            </InputGrid>
            <InputGrid
              :required="!!inputData.vpnThreshold"
              :label="t('guarantees.notificationInterval')"
              :label-width="270"
            >
              <SelectForm
                v-model="inputData.vpnNotificationInterval"
                :options="notificationIntervalOptions"
                :placeholder="notificationIntervalOptions[0]?.text"
                :required="!!inputData.vpnThreshold"
                :disabled="isConfirmation || !inputData.vpnThreshold"
                data-cy="guarantees-circuits-id-edit-vpn-notification-interval"
                @valid="(valid: boolean) => (inputValid.vpnNotificationInterval = valid)"
              />
            </InputGrid>
          </div>
        </template>
      </GuaranteeDetail>
      <GuaranteeEditCaution v-if="isConfirmation" :edit-data="inputData" :original-data="originalData" />
      <div class="grid-flow-col justify-end ga-4">
        <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
        <CustomButton
          icon="right-arrow"
          :disabled="disabled || loading"
          :width="180"
          :text="submit.text"
          data-cy="guarantees-circuits-id-edit-save-button"
          @click="submit.click"
        />
      </div>
    </CardContainer>
  </div>
</template>

<style lang="scss" scoped>
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
