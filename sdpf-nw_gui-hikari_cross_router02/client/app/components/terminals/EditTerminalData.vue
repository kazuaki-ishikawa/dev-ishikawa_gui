<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircuitTypes, TerminalDeviceTypes, TrafficReportFlowAnalyzerPlanTypes } from '@/api/constants'
import type { TerminalDeviceType } from '@/api/types'
import type { BreakOutResponse } from '@/api/breakOut/types'
import type { GuaranteeResponse, InternetRateLimitType, VpnRateLimitType } from '@/api/guarantees/types'
import { HikariPlans } from '@/api/ipoes/constants'
import {
  TERMINAL_LINK,
  NetworkTypes,
  LanTypes,
  initialTerminalGuaranteeInputData,
  initialTerminalGuaranteeInputValid,
  initialFiltersInputData,
} from '@/api/terminals/constants'
import type { TerminalInputDataType, TerminalInputValidType } from '@/api/terminals/types'
import { IconTypes } from '@/components/icons/constants'
import { UNSELECTED_VALUE } from '@/components/input/constants'
import type { InputCircuitType } from '@/components/terminals/EditCircuitTypes.vue'
import type { IpoeListOptionType } from '@/components/terminals/types'

type FilteredGuaranteeType = {
  guaranteeId: string
  customerNote: string
  internetRateLimit: InternetRateLimitType | null
  vpnRateLimit: VpnRateLimitType | null
  pattern1G: boolean
}

type PropsType = {
  customerNoteList: Array<{ id: string; customerNote: string }>
  breakOutList: BreakOutResponse[]
  guaranteeList: GuaranteeResponse[]
  ipoeListOptions: IpoeListOptionType[]
  vpnListOptions?: Array<{ text: string; value: string }>
  disabled?: boolean
  isBulk?: boolean
  mobileExists?: boolean
  disabledDates?: (value: Date) => boolean
  serviceClosedDaysFetchFailed?: boolean
}
const props = defineProps<PropsType>()
const inputData = defineModel<TerminalInputDataType>('terminal', { required: true })
const inputValid = defineModel<TerminalInputValidType>('valid', { required: true })

const { t } = useI18n()
const rules = useRules()

const {
  checkCircuitTypeSelected,
  getShowBreakOut,
  getShowDefaultGatewayNexthop,
  getGuaranteeListFilterPatterns,
  lanTypeOptions,
  networkTypeOptions,
  wanDefaultGatewayVpnRoutingOptions,
  breakOutOptions,
  terminalDeviceTypeOptions,
} = useTerminalInput()

const deliveryDateWorkDays = computed(() => {
  // 最短配送日:
  // main=Mobile, backup=なし: 10営業日
  // main=IPoE, backup=Mobile: 10営業日
  // main=Guarantee, backup=Mobile: 10営業日
  // main=Guarantee, backup=IPoE: 7営業日
  // main=Guarantee, backup=なし: 10営業日
  // main=IPoE, backup=なし: 7営業日
  if (
    checkCircuitTypeSelected(inputData.value, CircuitTypes.Mobile) ||
    (inputData.value.primaryCircuitType === CircuitTypes.Guarantee && !inputData.value.secondaryCircuitType)
  ) {
    return 10
  }
  return 7
})
const minDeliveryDate = computed(() =>
  props.disabledDates ? calcMinDate(deliveryDateWorkDays.value, props.disabledDates) : undefined,
)

const filteredGuaranteeList = computed(() =>
  props.guaranteeList.reduce<FilteredGuaranteeType[]>((arr, guarantee) => {
    const { pattern100M, pattern1G } = getGuaranteeListFilterPatterns(guarantee)
    // サービスルーターに紐付け可能なギャランティ回線のみを表示する
    if (pattern100M || pattern1G) {
      arr.push({
        guaranteeId: guarantee.guaranteeId,
        customerNote: guarantee.customerNote,
        internetRateLimit: guarantee.internet?.rateLimit ?? null,
        vpnRateLimit: guarantee.vpn?.rateLimit ?? null,
        pattern1G,
      })
    }
    return arr
  }, []),
)
const guaranteeListOptions = computed(() =>
  filteredGuaranteeList.value.map(guarantee => ({
    text: `${guarantee.guaranteeId} / ${guarantee.customerNote}`,
    value: guarantee.guaranteeId,
  })),
)
const selectedGuarantee = computed(() =>
  filteredGuaranteeList.value.find(guarantee => guarantee.guaranteeId === inputData.value.guarantee.guaranteeId),
)
const isRouter02Selected = computed(
  () => !props.isBulk && inputData.value.terminalDeviceType === TerminalDeviceTypes.Router02,
)
const isRouter01Selected = computed(
  () => props.isBulk || inputData.value.terminalDeviceType === TerminalDeviceTypes.Router01,
)
const filteredIpoeListOptions = computed(() =>
  props.ipoeListOptions.filter(({ hikariPlan }) => !isRouter01Selected.value || hikariPlan !== HikariPlans.Cross),
)
const filteredLanTypeOptions = computed(() =>
  lanTypeOptions
    // 選択したギャランティ回線の物理帯域が 1G の場合は switchPort は選択できない
    .filter(({ value }) => !selectedGuarantee.value?.pattern1G || value === LanTypes.RoutedPort)
    // RINKルーター02 はスイッチポート方式のみ利用可能
    .filter(({ value }) => !isRouter02Selected.value || value === LanTypes.SwitchPort),
)
const updateLanType = (value: string) => {
  if (inputData.value.lanType === value) {
    return
  }
  // LANタイプが変更されると、ルーテッドポート方式のLANポート名とスイッチポート方式のLAN種別は流用できないため初期化する
  inputData.value.lanType = value
  inputData.value.lans = []
  inputValid.value.lans = false
}
watch(selectedGuarantee, next => {
  if (next?.pattern1G && inputData.value.lanType === LanTypes.SwitchPort) {
    updateLanType('')
  }
})
const hasGuaranteeInternetRateLimit = computed(
  () =>
    // disabled(一括の確認画面の場合等)、ギャランティ以外の場合は常に true になるようにする
    props.disabled ||
    inputData.value.primaryCircuitType !== CircuitTypes.Guarantee ||
    !selectedGuarantee.value ||
    !!selectedGuarantee.value.internetRateLimit,
)
const hasGuaranteeVpnRateLimit = computed(
  () =>
    // disabled(一括の確認画面の場合等)、ギャランティ以外の場合は常に true になるようにする
    props.disabled ||
    inputData.value.primaryCircuitType !== CircuitTypes.Guarantee ||
    !selectedGuarantee.value ||
    !!selectedGuarantee.value.vpnRateLimit,
)

const isGuaranteeSelected = computed(() => checkCircuitTypeSelected(inputData.value, CircuitTypes.Guarantee))
const isIpoeSelected = computed(() => checkCircuitTypeSelected(inputData.value, CircuitTypes.Ipoe))
const showDefaultGatewayNexthop = computed(() => getShowDefaultGatewayNexthop(inputData.value))
const isVpnIdEmpty = computed(() => !inputData.value.vpnId || inputData.value.vpnId === UNSELECTED_VALUE)
const isBreakOutEmpty = computed(
  () => inputData.value.breakOut.length === 0 || inputData.value.breakOut.includes(UNSELECTED_VALUE),
)
watch(isBreakOutEmpty, next => {
  if (next) {
    // breakOut が空の場合は interceptDnsServers は入力不可になる
    inputData.value.interceptDnsServers = []
    inputValid.value.interceptDnsServers = true
  } else {
    // breakOut が選択された場合は interceptDnsServers は入力必須になる
    inputData.value.interceptDnsServers =
      0 < inputData.value.interceptDnsServers.length ? inputData.value.interceptDnsServers : ['']
  }
})
const showBreakOut = computed(() => getShowBreakOut(inputData.value))
watch(showBreakOut, next => {
  if (!next) {
    inputData.value.breakOut = []
    inputData.value.interceptDnsServers = []
    inputValid.value.interceptDnsServers = true
  }
  inputValid.value.breakOut = !next
})

watch([showBreakOut, hasGuaranteeInternetRateLimit], () => {
  if (!hasGuaranteeInternetRateLimit.value) {
    // ギャランティ回線のインターネット帯域制限が未選択の場合は、特定通信ブレイクアウトを利用無しにする
    inputData.value.breakOut = [UNSELECTED_VALUE]
    inputValid.value.breakOut = true
  }
})

const currentBreakOut = ref<BreakOutResponse>()
const openBreakoutDialog = (breakOut: BreakOutResponse) => {
  currentBreakOut.value = breakOut
}

const nexthopNetworkOptions = computed(() =>
  networkTypeOptions
    .filter(({ value }) => !isVpnIdEmpty.value || value !== NetworkTypes.Vpn)
    .filter(({ value }) => hasGuaranteeInternetRateLimit.value || value !== NetworkTypes.Internet),
)
watch(hasGuaranteeInternetRateLimit, next => {
  if (!next) {
    // インターネットの利用を設定する欄を空にする
    if (inputData.value.defaultGateway.nexthopNetwork === NetworkTypes.Internet) {
      inputData.value.defaultGateway.nexthopNetwork = ''
      inputValid.value.defaultGateway.nexthopNetwork = false
    }
    inputData.value.wanStaticRoutes = inputData.value.wanStaticRoutes.filter(
      wan => wan.nexthopNetwork !== NetworkTypes.Internet,
    )
  }
})

const concatBreakOutOptions = computed(() =>
  props.breakOutList.reduce<Array<{ text: string; value: string; button?: { click: () => void } }>>(
    (options, breakOut) => {
      options.push({
        text: breakOut.customerNote,
        value: breakOut.breakOutListId,
        button: { click: () => openBreakoutDialog(breakOut) },
      })
      return options
    },
    [{ text: t('breakOut.unselected'), value: UNSELECTED_VALUE }, ...breakOutOptions],
  ),
)

// ipv4AddressRanges は必須項目なのでここに値があれば入力済みと判定する
const showDhcpRelayServers = computed(
  () => !inputData.value.lans.some(lan => lan.dhcpServer.ipv4AddressRanges.length > 0),
)
watch(showDhcpRelayServers, () => {
  inputData.value.dhcpRelayServers = []
  inputValid.value.dhcpRelayServers = true
})
const dhcpServerDisabled = computed(() => inputData.value.dhcpRelayServers.filter(Boolean).length > 0)

const openFirstMobileDialog = ref(false)
const handleCircuitTypesChecked = (item: InputCircuitType) => {
  const commonValid = {
    primaryCircuitType: true,
    secondaryCircuitType: true,
    ipoeId: item.primary !== CircuitTypes.Ipoe && item.secondary !== CircuitTypes.Ipoe,
  }
  Object.assign(inputValid.value, {
    ...commonValid,
    guarantee:
      item.primary !== CircuitTypes.Guarantee
        ? { guaranteeId: true, vpnActConnectedIpv4Prefix: true, vpnSbyConnectedIpv4Prefix: true }
        : structuredClone(initialTerminalGuaranteeInputValid),
    trafficReportFlowAnalyzer: {
      trafficReportFlowAnalyzerPlan: true,
    },
  })
  Object.assign(inputData.value, {
    primaryCircuitType: item.primary,
    secondaryCircuitType: item.secondary || '',
    ipoeId: '',
    guarantee: structuredClone(initialTerminalGuaranteeInputData),
    trafficReportFlowAnalyzer: {
      trafficReportFlowAnalyzerPlan:
        item.primary === CircuitTypes.Guarantee
          ? inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan
          : TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
      trafficReportFlowAnalyzerAlert:
        item.primary === CircuitTypes.Guarantee
          ? inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert
          : 'false',
    },
  })
  if (
    (item.primary === CircuitTypes.Mobile || item.secondary === CircuitTypes.Mobile) &&
    props.mobileExists === false
  ) {
    openFirstMobileDialog.value = true
  }
}
const updateTerminalDeviceType = (value: TerminalDeviceType) => {
  inputData.value.terminalDeviceType = value
  if (value !== TerminalDeviceTypes.Router02) {
    // RINKルーター01 は光ネクストのみ利用可能なため、光クロスを選択済みの場合はクリアする
    const selectedIpoe = props.ipoeListOptions.find(option => option.value === inputData.value.ipoeId)
    if (selectedIpoe?.hikariPlan === HikariPlans.Cross) {
      inputData.value.ipoeId = ''
      inputValid.value.ipoeId = !isIpoeSelected.value
    }
    return
  }
  const isIpoeOnly = inputData.value.primaryCircuitType === CircuitTypes.Ipoe && !inputData.value.secondaryCircuitType
  if (!isIpoeOnly) {
    handleCircuitTypesChecked({ primary: CircuitTypes.Ipoe })
  }
  // RINKルーター02 はスイッチポート方式固定
  updateLanType(LanTypes.SwitchPort)
  inputData.value.lans = inputData.value.lans.map(lan => ({
    ...lan,
    lanInFilters: { ...initialFiltersInputData },
  }))
}
const updateDefaultGatewayNexthopNetwork = (value: string) => {
  // nexthopNetwork を LAN 以外にしたときは nexthopIpv4Address と vpnRouting をクリアする
  if (value !== NetworkTypes.Lan) {
    inputData.value.defaultGateway.nexthopIpv4Address = ''
    inputData.value.defaultGateway.vpnRouting = ''
  } else {
    inputData.value.defaultGateway.vpnRouting = 'false'
  }
  inputData.value.defaultGateway.nexthopNetwork = value
  inputValid.value.defaultGateway.nexthopIpv4Address = value !== NetworkTypes.Lan
}
const updateVpnId = (value: string) => {
  inputData.value.vpnId = value
  // vpnId が空の場合は inputData.defaultGateway.nexthopNetwork は VPN を選べない
  const empty = !value || value === UNSELECTED_VALUE
  if (empty && inputData.value.defaultGateway.nexthopNetwork === NetworkTypes.Vpn) {
    inputData.value.defaultGateway.nexthopNetwork = ''
    inputValid.value.defaultGateway.nexthopNetwork = false
  }
  if (empty) {
    // vpnId が空の場合は inputData.wanStaticRoutes.nexthopNetwork は VPN を選べない
    inputData.value.wanStaticRoutes = inputData.value.wanStaticRoutes.filter(
      wan => wan.nexthopNetwork !== NetworkTypes.Vpn,
    )
    // vpnId が空の場合は inputData.vpnInFilters, inputData.vpnOutFilters は入力不可
    inputData.value.vpnInFilters = { ...initialFiltersInputData }
    inputData.value.vpnOutFilters = { ...initialFiltersInputData }
    inputValid.value.vpnInFilters = true
    inputValid.value.vpnOutFilters = true
    // vpnId が空の場合は vpnActConnectedIpv4Prefix vpnSbyConnectedIpv4Prefix を初期化し入力不可
    inputData.value.guarantee.vpnActConnectedIpv4Prefix = ''
    inputData.value.guarantee.vpnSbyConnectedIpv4Prefix = ''
  }
}
watch(hasGuaranteeVpnRateLimit, next => !next && updateVpnId(UNSELECTED_VALUE))
</script>

<template>
  <div>
    <!-- 利用ルーター機種（一括は対象外） -->
    <InnerCard v-if="!isBulk" :title="t('terminals.terminalDeviceType')">
      <RadioForm
        :model-value="inputData.terminalDeviceType"
        :options="terminalDeviceTypeOptions"
        :disabled="disabled"
        required
        class="pt-4"
        data-cy="edit-terminal-data-terminal-device-type"
        @valid="(valid: boolean) => (inputValid.terminalDeviceType = valid)"
        @update:model-value="updateTerminalDeviceType"
      />
    </InnerCard>
    <!-- 利用アクセス回線選択 -->
    <EditCircuitTypes
      :primary-circuit-type="inputData.primaryCircuitType"
      :secondary-circuit-type="inputData.secondaryCircuitType"
      :terminal-device-type="isBulk ? undefined : inputData.terminalDeviceType"
      :disabled="disabled"
      data-cy="edit-terminal-data-edit-circuit-types"
      @checked="handleCircuitTypesChecked"
    />
    <!-- ルーター基本設定 -->
    <InnerCard :title="t('terminals.basicConfiguration')">
      <template #help>
        <i18n-t keypath="terminals.help.basicConfiguration" scope="global">
          <template #linkText>
            <NuxtLink :to="TERMINAL_LINK.BASE_SETTING" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <InputGrid required :label="t('terminals.name')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
          maxlength="64"
          required
          placeholder="東京本社A館１号機"
          :disabled="disabled"
          data-cy="edit-terminal-data-customer-note"
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
          :disabled="disabled"
          data-cy="edit-terminal-data-installation-postal-code"
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
          :disabled="disabled"
          data-cy="edit-terminal-data-installation-address"
          @valid="(valid: boolean) => (inputValid.installationAddress = valid)"
        />
      </InputGrid>
    </InnerCard>

    <!-- リソース設定 -->
    <InnerCard :title="t('terminals.resourceSettings')">
      <template #help>
        <i18n-t keypath="terminals.help.resourceSettings" scope="global">
          <template #linkText1>
            <NuxtLink :to="TERMINAL_LINK.RESOURCE_SETTINGS_IPOE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
          <template #linkText2>
            <NuxtLink :to="TERMINAL_LINK.RESOURCE_SETTINGS_GUARANTEE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <InputGrid :required="isGuaranteeSelected" :label="t('terminals.guaranteeId')">
        <SelectForm
          v-model="inputData.guarantee.guaranteeId"
          :options="guaranteeListOptions"
          placeholder="Z000000002 / ギャランティアクセス名"
          :required="isGuaranteeSelected"
          :disabled="disabled || !isGuaranteeSelected"
          size="middle"
          data-cy="edit-terminal-data-guarantee-guarantee-id"
          @valid="(valid: boolean) => (inputValid.guarantee.guaranteeId = valid)"
        />
      </InputGrid>
      <div v-if="isGuaranteeSelected" class="pl-5">
        <div class="mt-3 text-secondary text-lg">{{ t('terminals.vpn') }}</div>
        <InputGrid :required="!isVpnIdEmpty" :label="t('terminals.connectionAddressAct')" :label-width="271">
          <InputFormWithCheckVpnRoutesButton
            v-model="inputData.guarantee.vpnActConnectedIpv4Prefix"
            :vpn-id="inputData.vpnId"
            :prefix="30"
            placeholder="192.0.2.4"
            :disabled="disabled || isVpnIdEmpty"
            :required="!isVpnIdEmpty"
            :rules="[rules.ipAddress]"
            maxlength="15"
            size="small"
            data-cy="edit-terminal-data-guarantee-vpn-act-connected-ipv4-prefix"
            @valid="(valid: boolean) => (inputValid.guarantee.vpnActConnectedIpv4Prefix = valid)"
          />
        </InputGrid>
        <InputGrid :required="!isVpnIdEmpty" :label="t('terminals.connectionAddressSby')" :label-width="271">
          <InputFormWithCheckVpnRoutesButton
            v-model="inputData.guarantee.vpnSbyConnectedIpv4Prefix"
            :vpn-id="inputData.vpnId"
            :prefix="30"
            placeholder="192.0.2.12"
            :disabled="disabled || isVpnIdEmpty"
            :required="!isVpnIdEmpty"
            :rules="[rules.ipAddress]"
            maxlength="15"
            size="small"
            data-cy="edit-terminal-data-guarantee-vpn-sby-connected-ipv4-prefix"
            @valid="(valid: boolean) => (inputValid.guarantee.vpnSbyConnectedIpv4Prefix = valid)"
          />
        </InputGrid>
      </div>
      <InputGrid :required="isIpoeSelected" :label="t('terminals.ipoeId')">
        <SelectForm
          v-model="inputData.ipoeId"
          :options="filteredIpoeListOptions"
          placeholder="Z000000001 / 回線名"
          :required="isIpoeSelected"
          :disabled="disabled || !isIpoeSelected"
          size="middle"
          data-cy="edit-terminal-data-ipoe-id"
          @valid="(valid: boolean) => (inputValid.ipoeId = valid)"
        />
        <template #footer>
          <i18n-t keypath="terminals.note.ipoeId" tag="div" scope="global" class="text-warning">
            <template #linkText>
              <NuxtLink :to="TERMINAL_LINK.IPOE" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
      </InputGrid>
      <InputGrid
        v-if="!!vpnListOptions"
        :label="t('terminals.vpnIdName')"
        :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
        required
      >
        <template #help>
          <i18n-t keypath="terminals.help.vpnId" tag="span" scope="global" class="text-pre-wrap">
            <template #linkText>
              <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <SelectForm
          :model-value="inputData.vpnId"
          :options="[{ text: t('vpn.unselected'), value: UNSELECTED_VALUE }, ...vpnListOptions]"
          placeholder="V000000002 / 拠点間通信用VPN"
          :disabled="disabled || !hasGuaranteeVpnRateLimit"
          required
          size="middle"
          data-cy="edit-terminal-data-vpn-id"
          @valid="(valid: boolean) => (inputValid.vpnId = valid)"
          @update:model-value="updateVpnId"
        />
        <template #footer>
          <div v-if="inputData.vpnId && inputData.vpnId !== UNSELECTED_VALUE" class="text-warning text-pre-wrap">
            {{ t('terminals.note.vpnId') }}
          </div>
          <TerminalNetworkNote v-if="!hasGuaranteeVpnRateLimit" :connection-type="NetworkTypes.Vpn" />
        </template>
      </InputGrid>
    </InnerCard>

    <!-- ネットワーク設定 -->
    <InnerCard :title="t('terminals.networkSettings')">
      <template #help>
        <i18n-t keypath="terminals.help.networkSettings" scope="global">
          <template #linkText>
            <NuxtLink :to="TERMINAL_LINK.NETWORK_SETTING" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <div class="mt-3 text-secondary text-lg">{{ t('terminals.basicSettings') }}</div>
      <!-- Loopbackアドレス -->
      <InputGrid
        required
        :label="t('terminals.loopbackIpv4Address')"
        :help="t('terminals.help.loopbackIpv4Address')"
        :help-option="{ contentWidth: 500 }"
      >
        <InputFormWithCheckVpnRoutesButton
          v-model="inputData.loopbackIpv4Address"
          :vpn-id="inputData.vpnId"
          required
          :rules="[rules.ipAddress, rules.inAcceptableRange]"
          maxlength="15"
          placeholder="172.16.0.1"
          :disabled="disabled"
          data-cy="edit-terminal-data-loopback-ipv4-address"
          @valid="(valid: boolean) => (inputValid.loopbackIpv4Address = valid)"
        />
        <template #footer>
          <div class="text-warning">
            <span>※</span>
            <i18n-t keypath="terminals.note.loopbackIpv4Address" tag="span" scope="global" class="text-pre-wrap">
              <template #linkText>
                <NuxtLink :to="TERMINAL_LINK.NETWORK_SETTING" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </div>
        </template>
      </InputGrid>
      <!-- LANタイプ -->
      <InputGrid
        required
        :label="t('terminals.lanType')"
        :help="t('terminals.help.lanType')"
        :help-option="{ contentWidth: 500 }"
      >
        <SelectForm
          :model-value="inputData.lanType"
          :options="filteredLanTypeOptions"
          required
          :placeholder="filteredLanTypeOptions[0]?.text"
          :disabled="disabled || isRouter02Selected"
          data-cy="edit-terminal-data-lan-type"
          @valid="(valid: boolean) => (inputValid.lanType = valid)"
          @update:model-value="updateLanType"
        />
      </InputGrid>
      <!-- 直下セグメント -->
      <template v-if="inputData.lanType">
        <div class="mt-4 flex-flex-start-center">
          <div class="required">{{ t('terminals.lans') }}</div>
          <HelpTooltip class="px-2 mt-1" size="smallMiddle">{{ t('terminals.help.lans') }}</HelpTooltip>
        </div>
        <EditLans
          v-model:values="inputData.lans"
          :vpn-id="inputData.vpnId"
          :lan-type="inputData.lanType"
          :dhcp-server-disabled="dhcpServerDisabled"
          :hide-lan-in-filters="isRouter02Selected"
          :disabled="disabled"
          data-cy="edit-terminal-data-lans"
          @valid="(valid: boolean) => (inputValid.lans = valid)"
        />
      </template>

      <!-- デフォルトルート設定 -->
      <div class="flex-flex-start-center" :class="{ 'pt-5': disabled }">
        <div class="text-secondary text-lg">{{ t('terminals.wanDefaultGateWay') }}</div>
        <HelpTooltip
          v-if="!hasGuaranteeInternetRateLimit"
          class="mt-2 ml-2"
          size="smallMiddle"
          color="error"
          :icon="IconTypes.AlertTriangle"
          :content-width="665"
        >
          <TerminalNetworkNote :connection-type="NetworkTypes.Internet" />
        </HelpTooltip>
      </div>
      <InputGrid required :label="t('terminals.nexthopNetwork')" :help="t('terminals.help.nexthopNetwork')">
        <SelectForm
          :model-value="inputData.defaultGateway.nexthopNetwork"
          :options="nexthopNetworkOptions"
          size="middle"
          required
          :placeholder="nexthopNetworkOptions[0]?.text"
          :disabled="disabled"
          data-cy="edit-terminal-data-default-gateway-nexthop-network"
          @valid="(valid: boolean) => (inputValid.defaultGateway.nexthopNetwork = valid)"
          @update:model-value="updateDefaultGatewayNexthopNetwork"
        />
        <template #footer>
          <i18n-t
            v-if="inputData.defaultGateway.nexthopNetwork"
            keypath="terminals.note.nexthopNetwork"
            tag="div"
            scope="global"
            class="mt-2"
          >
            <template #here>
              <NuxtLink :to="TERMINAL_LINK.NETWORK_SETTING" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
      </InputGrid>
      <template v-if="showDefaultGatewayNexthop">
        <InputGrid required :label="t('terminals.nexthopIpv4AddressDefaultGateway')">
          <InputForm
            v-model="inputData.defaultGateway.nexthopIpv4Address"
            :rules="[rules.ipAddress]"
            maxlength="15"
            placeholder="10.0.0.2"
            required
            :disabled="disabled"
            data-cy="edit-terminal-data-default-gateway-nexthop-ipv4-address"
            @valid="(valid: boolean) => (inputValid.defaultGateway.nexthopIpv4Address = valid)"
          />
        </InputGrid>
        <InputGrid
          class="pb-1"
          required
          :label="t('terminals.defaultRouteWithinVpn')"
          :help="t('terminals.help.defaultRouteWithinVpn')"
        >
          <RadioForm
            v-model="inputData.defaultGateway.vpnRouting"
            :options="wanDefaultGatewayVpnRoutingOptions"
            required
            :disabled="disabled"
            data-cy="edit-terminal-data-default-gateway-vpn-routing"
            @valid="(valid: boolean) => (inputValid.defaultGateway.vpnRouting = valid)"
          />
        </InputGrid>
      </template>
      <template v-if="showBreakOut">
        <InputGrid :label="t('terminals.breakOut')" required :help-option="{ icon: IconTypes.Alert, color: 'warning' }">
          <template #help>
            <i18n-t keypath="terminals.help.breakOut" tag="span" scope="global" class="text-pre-wrap">
              <template #linkText>
                <NuxtLink :to="TERMINAL_LINK.PRICE" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <MultipleSelectForm
            v-model="inputData.breakOut"
            required
            :options="concatBreakOutOptions"
            :disabled="disabled || !hasGuaranteeInternetRateLimit"
            :max-itemas="8"
            :placeholder="breakOutOptions[0]?.text"
            data-cy="edit-terminal-data-break-out"
            @valid="(valid: boolean) => (inputValid.breakOut = valid)"
          />
        </InputGrid>
        <InputGrid
          v-if="!isBreakOutEmpty"
          required
          :label="t('terminals.breakOutDnsServers')"
          :help="t('terminals.help.breakOutDnsServers')"
        >
          <MultipleInputForm
            v-model:values="inputData.interceptDnsServers"
            required
            :rules="[rules.ipAddress]"
            maxlength="15"
            :min-items="1"
            :max-items="8"
            placeholder="192.168.1.5"
            :disabled="disabled"
            data-cy="edit-terminal-data-break-out-dns-servers"
            @valid="(valid: boolean) => (inputValid.interceptDnsServers = valid)"
          />
        </InputGrid>
      </template>
    </InnerCard>

    <!-- トラフィックレポート（フロー分析） -->
    <EditTrafficReportFlowAnalyzer
      v-model="inputData.trafficReportFlowAnalyzer"
      v-model:valid="inputValid.trafficReportFlowAnalyzer"
      :primary-circuit-type="inputData.primaryCircuitType"
      :disabled="disabled"
    />

    <!-- セキュリティオプション -->
    <EditSecurityOptions
      v-model:threat-detection-plan="inputData.threatDetection.threatDetectionPlan"
      v-model:threat-detection-plan-valid="inputValid.threatDetection.threatDetectionPlan"
      v-model:flow-collector-plan="inputData.flowCollector.flowCollectorPlan"
      v-model:flow-collector-plan-valid="inputValid.flowCollector.flowCollectorPlan"
      v-model:behavior-detection-plan="inputData.behaviorDetection.behaviorDetectionPlan"
      v-model:behavior-detection-plan-valid="inputValid.behaviorDetection.behaviorDetectionPlan"
      :disabled="disabled"
    />

    <!-- 端末詳細設定 -->
    <CollapseCard data-cy="edit-terminal-data-detail-settings" :title="t('terminals.detailSettings')" default-open>
      <template #help>
        <i18n-t keypath="terminals.help.detailSettings" scope="global">
          <template #linkText>
            <NuxtLink :to="TERMINAL_LINK.DETAIL_SETTING" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <!-- 拠点内セグメント（非直下セグメント） -->
      <div v-if="!isBulk" class="flex-flex-start-center">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.lanStaticRoutes') }}</div>
        <HelpTooltip class="mt-3" size="smallMiddle">{{ t('terminals.help.lanStaticRoutes') }}</HelpTooltip>
      </div>
      <EditLanStaticRoutes
        v-if="!isBulk"
        v-model:values="inputData.lanStaticRoutes"
        :vpn-id="inputData.vpnId"
        :disabled="disabled"
        data-cy="edit-terminal-data-lan-static-routes"
        @valid="(valid: boolean) => (inputValid.lanStaticRoutes = valid)"
      />

      <!-- WAN向けスタティックルート設定 -->
      <template v-if="!isBulk">
        <div class="flex-flex-start-center">
          <div class="collapse-title text-secondary text-lg">{{ t('terminals.wanStaticRoutes') }}</div>
          <HelpTooltip class="mx-2 mt-3" size="smallMiddle">{{ t('terminals.help.wanStaticRoutes') }}</HelpTooltip>
          <HelpTooltip
            v-if="!hasGuaranteeInternetRateLimit"
            class="mt-3"
            size="smallMiddle"
            color="error"
            :icon="IconTypes.AlertTriangle"
            :content-width="665"
          >
            <TerminalNetworkNote :connection-type="NetworkTypes.Internet" />
          </HelpTooltip>
        </div>
        <EditWanStaticRoutes
          v-model:values="inputData.wanStaticRoutes"
          :disabled="disabled"
          :has-guarantee-internet-rate-limit="hasGuaranteeInternetRateLimit"
          :has-vpn="!isVpnIdEmpty"
          data-cy="edit-terminal-data-wan-static-routes"
          @valid="(valid: boolean) => (inputValid.wanStaticRoutes = valid)"
        />
      </template>

      <!-- WANポートフィルタ（VPN → 拠点） -->
      <template v-if="!isBulk">
        <div class="flex-flex-start-center">
          <div class="collapse-title text-secondary text-lg">{{ t('terminals.vpnInFilters') }}</div>
          <HelpTooltip class="mx-2 mt-3" size="smallMiddle" :content-width="700">
            <div>{{ t('terminals.help.vpnInFilters') }}</div>
            <div class="font-weight-bold text-decoration-underline mt-4">
              {{ t('terminals.help.filtersImage', { filterName: t('terminals.vpnInFilters') }) }}
            </div>
            <img src="~/assets/images/vpn-in-filters.png" width="600px" class="mt-2" />
          </HelpTooltip>
        </div>
        <EditFilters
          v-model="inputData.vpnInFilters"
          :disabled="disabled || isVpnIdEmpty"
          :edit-access-list-option="{
            title: t('terminals.vpnInFilters'),
            sourceIpv4PrefixPlaceholder: '192.168.3.0/24',
            destinationIpv4PrefixPlaceholder: '192.168.1.0/24',
          }"
          data-cy="edit-terminal-data-vpn-in-filters"
          @valid="(valid: boolean) => (inputValid.vpnInFilters = valid)"
        />
      </template>

      <!-- WANポートフィルタ（拠点 → VPN） -->
      <template v-if="!isBulk">
        <div class="flex-flex-start-center">
          <div class="collapse-title text-secondary text-lg">{{ t('terminals.vpnOutFilters') }}</div>
          <HelpTooltip class="mx-2 mt-3" size="smallMiddle" :content-width="700">
            <div>{{ t('terminals.help.vpnOutFilters') }}</div>
            <div class="font-weight-bold text-decoration-underline mt-4">
              {{ t('terminals.help.filtersImage', { filterName: t('terminals.vpnOutFilters') }) }}
            </div>
            <img src="~/assets/images/vpn-out-filters.png" width="600px" class="mt-2" />
          </HelpTooltip>
        </div>
        <EditFilters
          v-model="inputData.vpnOutFilters"
          :disabled="disabled || isVpnIdEmpty"
          :edit-access-list-option="{
            title: t('terminals.vpnOutFilters'),
            sourceIpv4PrefixPlaceholder: '192.168.1.0/24',
            destinationIpv4PrefixPlaceholder: '192.168.3.0/24',
          }"
          data-cy="edit-terminal-data-vpn-out-filters"
          @valid="(valid: boolean) => (inputValid.vpnOutFilters = valid)"
        />
      </template>

      <!-- WANポートフィルタ（拠点 → Internet） -->
      <template v-if="!isBulk">
        <div class="flex-flex-start-center">
          <div class="collapse-title text-secondary text-lg">{{ t('terminals.inet4OutFilters') }}</div>
          <HelpTooltip class="mx-2 mt-3" size="smallMiddle" :content-width="700">
            <div>{{ t('terminals.help.inet4OutFilters') }}</div>
            <div class="font-weight-bold text-decoration-underline mt-4">
              {{ t('terminals.help.filtersImage', { filterName: t('terminals.inet4OutFilters') }) }}
            </div>
            <img src="~/assets/images/inet4-out-filters.png" width="600px" class="mt-2" />
          </HelpTooltip>
        </div>
        <EditFilters
          v-model="inputData.inet4OutFilters"
          :disabled="disabled"
          :edit-access-list-option="{
            title: t('terminals.inet4OutFilters'),
            sourceIpv4PrefixPlaceholder: '192.168.1.0/24',
            destinationIpv4PrefixPlaceholder: '8.8.8.8/32',
          }"
          data-cy="edit-terminal-data-inet4-out-filters"
          @valid="(valid: boolean) => (inputValid.inet4OutFilters = valid)"
        />
      </template>

      <!-- DHCP Relay -->
      <div class="flex-flex-start-center">
        <div class="collapse-title text-secondary text-lg">{{ t('terminals.relay') }}</div>
        <HelpTooltip class="mx-2 mt-3" size="smallMiddle">{{ t('terminals.help.dhcpRelay') }}</HelpTooltip>
      </div>
      <div v-if="!showDhcpRelayServers" data-cy="edit-terminal-data-message-dhcp-settings">
        {{ t('terminals.message.dhcpSettings') }}
      </div>
      <InputGrid v-else :label="t('terminals.serverIpv4Address')">
        <MultipleInputForm
          v-model:values="inputData.dhcpRelayServers"
          :rules="[rules.ipAddress]"
          maxlength="15"
          placeholder="192.168.1.5"
          :max-items="4"
          :disabled="disabled"
          data-cy="edit-terminal-data-dhcp-relay-servers"
          @valid="(valid: boolean) => (inputValid.dhcpRelayServers = valid)"
        />
      </InputGrid>
    </CollapseCard>

    <!-- 配送先情報 -->
    <InnerCard :title="t('terminals.deliveryInformation')">
      <template #help>
        <i18n-t keypath="terminals.help.deliveryInformation" scope="global">
          <template #linkText>
            <NuxtLink :to="TERMINAL_LINK.DELIVERY" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <InputGrid required :label="t('terminals.picName')">
        <InputForm
          v-model="inputData.deliveryName"
          maxlength="64"
          required
          :rules="[rules.fullwidthSpace, rules.noConsecutiveSpaces]"
          :placeholder="t('placeholder.name')"
          :disabled="disabled"
          data-cy="edit-terminal-data-delivery-name"
          @valid="(valid: boolean) => (inputValid.deliveryName = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('terminals.deliveryCompanyName')">
        <InputForm
          v-model="inputData.deliveryCompanyName"
          maxlength="40"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces, rules.contractorName]"
          :placeholder="t('placeholder.companyName')"
          :disabled="disabled"
          data-cy="edit-terminal-data-delivery-company-name"
          @valid="(valid: boolean) => (inputValid.deliveryCompanyName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.picDepartmentName')">
        <InputForm
          v-model="inputData.deliveryDepartmentName"
          maxlength="20"
          required
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
          placeholder="情報システム部ネットワーク課"
          :disabled="disabled"
          data-cy="edit-terminal-data-delivery-department-name"
          @valid="(valid: boolean) => (inputValid.deliveryDepartmentName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.phoneNumber')">
        <InputForm
          v-model="inputData.deliveryPhoneNumber"
          :rules="[rules.phoneNumber]"
          maxlength="13"
          required
          placeholder="03-1234-5678"
          :disabled="disabled"
          data-cy="edit-terminal-data-delivery-phone-number"
          @valid="(valid: boolean) => (inputValid.deliveryPhoneNumber = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.postalCode')">
        <SearchPostalCode
          v-model="inputData.deliveryPostalCode"
          v-model:address="inputData.deliveryAddress"
          v-model:valid="inputValid.deliveryPostalCode"
          required
          :disabled="disabled"
          :placeholder="t('placeholder.postalCode')"
          data-cy="edit-terminal-data-delivery-postal-code"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.address')" :help="t('terminals.help.address')">
        <InputForm
          v-model="inputData.deliveryAddress"
          size="large"
          maxlength="300"
          required
          placeholder="東京都千代田区大手町２−３−１"
          :disabled="disabled"
          data-cy="edit-terminal-data-delivery-address"
          @valid="(valid: boolean) => (inputValid.deliveryAddress = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.addressKana')">
        <InputForm
          v-model="inputData.deliveryAddressKana"
          size="large"
          maxlength="300"
          required
          placeholder="トウキョウトチヨダクオオテマチ２−３−１"
          :disabled="disabled"
          data-cy="edit-terminal-data-delivery-address-kana"
          @valid="(valid: boolean) => (inputValid.deliveryAddressKana = valid)"
        />
      </InputGrid>
      <InputGrid
        required
        :label="t('terminals.deliveryDate')"
        :help="t('terminals.help.deliveryDate', { workDays: deliveryDateWorkDays })"
        :help-option="{ contentWidth: 500 }"
      >
        <DatePicker
          v-model="inputData.deliveryDate"
          required
          :min-date="minDeliveryDate"
          :disabled="disabled || serviceClosedDaysFetchFailed"
          :disabled-dates="disabledDates"
          data-cy="edit-terminal-data-delivery-date"
          @valid="(valid: boolean) => (inputValid.deliveryDate = valid)"
        />
        <template #footer>
          <div class="d-flex text-warning mt-2">
            <i18n-t keypath="terminals.note.deliveryDate" tag="span" scope="global" class="text-pre-wrap">
              <template #workDays>{{ deliveryDateWorkDays }}</template>
              <template #here>
                <NuxtLink :to="TERMINAL_LINK.DELIVERY_DATE" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </div>
        </template>
      </InputGrid>
    </InnerCard>

    <!-- モバイル申し込み情報 -->
    <slot name="mobile" data-cy="edit-terminal-data-mobile-information" />

    <!-- ブレイクアウトの詳細表示ダイアログ -->
    <BreakOutDetailDialog :break-out="currentBreakOut" @close="() => (currentBreakOut = undefined)" />
    <FirstMobileDialog v-model="openFirstMobileDialog" />
  </div>
</template>

<style scoped lang="scss">
.collapse-title {
  padding-top: 0.75rem;
  padding-bottom: 0.25rem;
}
.required::after {
  content: '*';
  color: rgb(var(--v-theme-error));
}
</style>
