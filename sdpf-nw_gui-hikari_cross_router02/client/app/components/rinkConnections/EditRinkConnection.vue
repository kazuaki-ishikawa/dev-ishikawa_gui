<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BreakOutType } from '@/api/types'
import {
  MAX_BREAKOUT_COUNT,
  RinkConnectionTypes,
  initialRinkConnectionInputData,
  initialRinkConnectionValid,
} from '@/api/rinkConnections/constants'
import type { RinkConnectionType, RinkConnectionResponse } from '@/api/rinkConnections/types'

type PropType = {
  vpnOptions: Array<{ text: string; value: string }>
  lineActPrefixOptions: Array<{ text: string; value: string }>
  lineSbyPrefixOptions: Array<{ text: string; value: string }>
  scheduleNetworkList: string[]
  disabled: boolean
  disabledConnectionType?: RinkConnectionType[]
  originalRinkConnection?: RinkConnectionResponse
}
const props = withDefaults(defineProps<PropType>(), {
  disabledConnectionType: () => [],
})

const inputData = defineModel<typeof initialRinkConnectionInputData>({ required: true })
const inputValid = defineModel<typeof initialRinkConnectionValid>('valid', { required: true })

const { t } = useI18n()
const route = useRoute()
const rules = useRules()

const { rinkConnectionTypeOptions, breakOutOptions, useableOptions, duplicateDnsIpAddressRules } = useRinkConnections()

const isEditView = computed(() => route.name === 'tenants-tenantId-rink-mobile-connections-edit')
const timeFrameLabel = computed(() => {
  if (isEditView.value) {
    return t('rinkConnections.updateRequestedDate')
  } else {
    return t('rinkConnections.startRequestedDate')
  }
})
const filteredRinkConnectionTypeOptions = computed(() =>
  rinkConnectionTypeOptions.map(data => ({ ...data, disabled: !!props.disabledConnectionType.includes(data.value) })),
)

const isInternetOnly = computed(() => inputData.value.connectionType === RinkConnectionTypes.InternetOnly)
const isVpnOnly = computed(() => inputData.value.connectionType === RinkConnectionTypes.VpnOnly)
const isInternetVpn = computed(() => inputData.value.connectionType === RinkConnectionTypes.InternetVpn)
const isVpnBreakOut = computed(() => inputData.value.connectionType === RinkConnectionTypes.VpnBreakOut)
const requiredVpnId = computed(() => isVpnOnly.value || isInternetVpn.value || isVpnBreakOut.value)
const requiredDnsIpAddress = computed(() => !isVpnOnly.value || inputData.value.useDnsServer)
const nameAliases = computed(() =>
  inputData.value.customLocalBreakOutList.map(customLocalBreakOut => customLocalBreakOut.nameAlias).filter(Boolean),
)
const requiredBreakOutList = computed(() => {
  return isVpnBreakOut.value && nameAliases.value.length === 0
})
// 編集画面では VPN ID は internetOnly からの構成変更のみで編集可能
const vpnIdEditable = computed(() => {
  return (
    requiredVpnId.value &&
    (!isEditView.value || props.disabledConnectionType.includes(RinkConnectionTypes.InternetOnly))
  )
})

const originalAuthDomainName = computed(() => {
  return props.originalRinkConnection?.authDomainName || ''
})
const originalApn = computed(() => {
  return props.originalRinkConnection?.apn ?? ''
})
const originalVpnId = computed(() => {
  return props.originalRinkConnection?.vpnId || ''
})
const showVpnInformation = computed(() => {
  return requiredVpnId.value && !!originalVpnId.value
})
const vpnNetworkPrefixEditable = computed(
  () => !isEditView.value || props.disabledConnectionType.includes(RinkConnectionTypes.InternetOnly),
)

const handleUpdateConnectionType = (connectionType: string) => {
  const validInternetOnly = connectionType === RinkConnectionTypes.InternetOnly
  const validVpnBreakOut = connectionType === RinkConnectionTypes.VpnBreakOut
  const requiredVpnNetworkPrefix =
    !validInternetOnly && (!isEditView.value || props.disabledConnectionType.includes(RinkConnectionTypes.InternetOnly))

  // 直前の値が internetOnly の場合は初期化されているため initialRinkConnectionValid から値を取得する
  const validRecord = isInternetOnly.value ? initialRinkConnectionValid : inputValid.value
  inputValid.value = {
    ...inputValid.value,
    connectionType: true,
    vpnId: validInternetOnly || validRecord.vpnId || !vpnIdEditable.value,
    vpnNetworkPrefix: !requiredVpnNetworkPrefix || validRecord.vpnNetworkPrefix,
    breakOutList: validInternetOnly || !validVpnBreakOut || initialRinkConnectionValid.breakOutList,
    customLocalBreakOutList:
      validInternetOnly || !validVpnBreakOut || initialRinkConnectionValid.customLocalBreakOutList,
  }
  // connectionType が internetOnly の場合は初期化するため initialRinkConnectionInputData から値を取得する
  const inputRecord = validInternetOnly ? initialRinkConnectionInputData : inputData.value
  inputData.value = {
    ...inputData.value,
    connectionType,
    vpnId: inputRecord.vpnId,
    useDnsServer: true,
    vpnNetworkPrefix: requiredVpnNetworkPrefix ? inputRecord.vpnNetworkPrefix : inputData.value.vpnNetworkPrefix,
    vpnConnectionPrefix: inputRecord.vpnConnectionPrefix,
    breakOutList: inputRecord.breakOutList,
    customLocalBreakOutList: inputRecord.customLocalBreakOutList,
  }
}

const handleUpdatePoiRedundancy = (value: boolean) => {
  inputValid.value = {
    ...inputValid.value,
    lineSbyPrefix: !value,
  }
  inputData.value = {
    ...inputData.value,
    lineSbyPrefix: initialRinkConnectionInputData.lineSbyPrefix,
  }
}

const handleUpdateUseDnsServer = (value: boolean) => {
  inputValid.value = {
    ...inputValid.value,
    dnsIpAddressPrimary: true,
    dnsIpAddressSecondary: true,
  }
  inputData.value = {
    ...inputData.value,
    dnsIpAddressPrimary: value ? initialRinkConnectionInputData.dnsIpAddressPrimary : '',
    dnsIpAddressSecondary: value ? initialRinkConnectionInputData.dnsIpAddressSecondary : '',
  }
}

const handleUpdateBreakOutList = (value: BreakOutType[]) => {
  inputData.value.breakOutList = value
  // 未入力（nameAliasが空）のcustomLocalBreakOutListを削除
  inputData.value.customLocalBreakOutList = inputData.value.customLocalBreakOutList.filter(item => !!item.nameAlias)
}
</script>

<template>
  <div>
    <InnerCard :title="t('rinkConnections.connectionType')">
      <template v-if="disabledConnectionType.includes(inputData.connectionType)" #description>
        <div class="text-sm text-warning mb-n2">{{ t('rinkConnections.message.invalidConnectionType') }}</div>
      </template>
      <RadioForm
        class="pt-3"
        :model-value="inputData.connectionType"
        :options="filteredRinkConnectionTypeOptions"
        :disabled="disabled"
        data-cy="edit-rink-connection-connection-type"
        @update:model-value="handleUpdateConnectionType"
        @valid="valid => (inputValid.connectionType = valid)"
      />
    </InnerCard>

    <InnerCard v-if="inputData.connectionType" :title="t('rinkConnections.basicInformation')">
      <InputGrid v-if="vpnIdEditable" :label="t('rinkConnections.vpnId')" required>
        <SelectForm
          v-model="inputData.vpnId"
          :options="vpnOptions"
          :disabled="disabled"
          required
          size="middle"
          placeholder="V000000002 / 拠点間通信用VPN"
          data-cy="edit-rink-connection-vpn-id-select-form"
          @valid="valid => (inputValid.vpnId = valid)"
        />
      </InputGrid>
      <DetailGrid v-else-if="showVpnInformation">
        <div>{{ t('rinkConnections.vpnId') }}</div>
        <div data-cy="edit-rink-connection-vpn-id-information">
          {{ originalVpnId }}
        </div>
      </DetailGrid>
      <DetailGrid v-if="isEditView">
        <div>{{ t('rinkConnections.apn') }}</div>
        <div data-cy="edit-rink-connection-apn">{{ originalApn }}</div>
      </DetailGrid>
      <!-- ブレイクアウト -->
      <template v-if="isVpnBreakOut">
        <InputGrid :label="t('rinkConnections.breakOut')" :required="requiredBreakOutList">
          <CheckboxForm
            :value="inputData.breakOutList"
            :options="breakOutOptions"
            :max-items="MAX_BREAKOUT_COUNT - nameAliases.length"
            :required="requiredBreakOutList"
            :disabled="disabled"
            col-min-width="220px"
            data-cy="edit-rink-connection-break-out-list"
            @update:value="handleUpdateBreakOutList"
            @valid="valid => (inputValid.breakOutList = valid)"
          />
        </InputGrid>
        <EditCustomLocalBreakOutList
          v-model="inputData.customLocalBreakOutList"
          :max-items="MAX_BREAKOUT_COUNT - inputData.breakOutList.length"
          :required="!inputData.breakOutList.length"
          :disabled="disabled"
          data-cy="edit-rink-connection-custom-local-break-out-list"
          @valid="valid => (inputValid.customLocalBreakOutList = valid)"
        />
      </template>

      <InputGrid v-if="isInternetVpn" :label="t('rinkConnections.vpnConnectionPrefix')">
        <TextareaForm
          :model-value="inputData.vpnConnectionPrefix.join('\n')"
          :placeholder="t('placeholder.globalIpAddressList')"
          :rules="[rules.prefixList, rules.networkAddressList, rules.globalIpAddressList]"
          :disabled="disabled"
          data-cy="edit-rink-connection-vpn-connection-prefix"
          @update:model-value="value => (inputData.vpnConnectionPrefix = value.split('\n'))"
          @valid="valid => (inputValid.vpnConnectionPrefix = valid)"
        />
      </InputGrid>
      <InputGrid v-if="isVpnOnly" :label="t('rinkConnections.editMenu.dnsServer')" required>
        <RadioForm
          v-model="inputData.useDnsServer"
          :options="useableOptions"
          :disabled="disabled"
          data-cy="edit-rink-connection-use-dns-server"
          @update:model-value="handleUpdateUseDnsServer"
          @valid="valid => (inputValid.useDnsServer = valid)"
        />
      </InputGrid>
      <template v-if="requiredDnsIpAddress">
        <InputGrid :label="t('rinkConnections.dnsIpAddressPrimary')" required>
          <InputPrefixedIpForm
            v-model="inputData.dnsIpAddressPrimary"
            :prefix="32"
            :rules="[rules.ipAddress, duplicateDnsIpAddressRules(inputData.dnsIpAddressSecondary)]"
            :disabled="disabled"
            required
            maxlength="15"
            placeholder="202.234.232.6"
            data-cy="edit-rink-connection-dns-ip-address-primary"
            @valid="valid => (inputValid.dnsIpAddressPrimary = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('rinkConnections.dnsIpAddressSecondary')" required>
          <InputPrefixedIpForm
            v-model="inputData.dnsIpAddressSecondary"
            :prefix="32"
            :rules="[rules.ipAddress, duplicateDnsIpAddressRules(inputData.dnsIpAddressPrimary)]"
            :disabled="disabled"
            required
            maxlength="15"
            placeholder="221.113.139.250"
            data-cy="edit-rink-connection-dns-ip-address-secondary"
            @valid="valid => (inputValid.dnsIpAddressSecondary = valid)"
          />
        </InputGrid>
      </template>
      <DetailGrid v-if="isEditView && originalAuthDomainName">
        <div>{{ t('rinkConnections.authDomainName') }}</div>
        <div data-cy="edit-rink-connection-auth-domain-name">{{ originalAuthDomainName }}</div>
      </DetailGrid>
      <InputGrid :label="t('rinkConnections.poiRedundancy')" :required="!isEditView">
        <RadioForm
          v-model="inputData.poiRedundancy"
          :options="useableOptions"
          :disabled="disabled || isEditView"
          data-cy="edit-rink-connection-poi-redundancy"
          @update:model-value="handleUpdatePoiRedundancy"
          @valid="valid => (inputValid.poiRedundancy = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('rinkConnections.lineActPrefix')" :required="!isEditView">
        <SelectForm
          v-model="inputData.lineActPrefix"
          :options="lineActPrefixOptions"
          :required="!isEditView"
          :disabled="disabled || isEditView"
          :placeholder="lineActPrefixOptions[0]?.text"
          data-cy="edit-rink-connection-line-act-prefix"
          @valid="valid => (inputValid.lineActPrefix = valid)"
        />
      </InputGrid>
      <InputGrid v-if="inputData.poiRedundancy" :label="t('rinkConnections.lineSbyPrefix')" :required="!isEditView">
        <SelectForm
          v-model="inputData.lineSbyPrefix"
          :options="lineSbyPrefixOptions"
          :required="!isEditView"
          :disabled="disabled || isEditView"
          :placeholder="lineSbyPrefixOptions[0]?.text"
          data-cy="edit-rink-connection-line-sby-prefix"
          @valid="valid => (inputValid.lineSbyPrefix = valid)"
        />
      </InputGrid>
      <template v-if="requiredVpnId">
        <InputGrid :label="t('rinkConnections.vpnNetworkPrefix')" :required="vpnNetworkPrefixEditable">
          <InputPrefixedIpForm
            v-model="inputData.vpnNetworkPrefix"
            :prefix="28"
            :rules="[rules.ipAddress]"
            :disabled="disabled || !vpnNetworkPrefixEditable"
            :required="vpnNetworkPrefixEditable"
            maxlength="15"
            placeholder="192.168.1.0"
            data-cy="edit-rink-connection-vpn-network-prefix"
            @valid="valid => (inputValid.vpnNetworkPrefix = valid)"
          />
        </InputGrid>
      </template>
    </InnerCard>

    <InnerCard v-if="inputData.connectionType" :title="timeFrameLabel">
      <InputGrid :label="timeFrameLabel" required>
        <EditScheduleNetworkDate
          v-if="isEditView"
          v-model="inputData.timeFrame"
          :schedule-network-list="scheduleNetworkList"
          :disabled="disabled"
          required
          data-cy="edit-rink-connection-time-frame"
          @valid="valid => (inputValid.timeFrame = valid)"
        />
        <EditScheduleNetworkDatePicker
          v-else
          v-model="inputData.timeFrame"
          :schedule-network-list="scheduleNetworkList"
          :disabled="disabled"
          required
          data-cy="edit-rink-connection-time-frame-date-picker"
          @valid="valid => (inputValid.timeFrame = valid)"
        />
      </InputGrid>
    </InnerCard>
  </div>
</template>
