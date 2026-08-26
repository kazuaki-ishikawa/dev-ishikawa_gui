<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import {
  TERMINAL_LINK,
  initialDhcpServerInputData,
  initialDhcpServerValid,
  initialFiltersInputData,
  initialLansInputData,
  initialLansValid,
  LansTypes,
  LanTypes,
  NatTypesText,
  LansPortNumberList,
} from '@/api/terminals/constants'
import type { TerminalLansInputType, NatType } from '@/api/terminals/types'

const LABEL_WIDTH = 380
const DIALOG_WIDTH = 1180

type PropType = {
  lanType: string
  vpnId?: string
  terminalId?: string
  dhcpServerDisabled?: boolean
  hideLanInFilters?: boolean
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  dhcpServerDisabled: false,
  hideLanInFilters: false,
  disabled: false,
})
const items = defineModel<TerminalLansInputType[]>('values', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()

const { vpnRoutingOptions } = useTerminalInput()

const settingOptions = [
  { text: t('common.withSettings'), value: true },
  { text: t('common.noSettings'), value: false },
]

const dialogOpenType = ref<'add' | number | null>(null)
const input = ref(structuredClone(initialLansInputData))
const inputValid = ref(structuredClone(initialLansValid))
const useLanInFilters = ref(false)

const useDhcpServer = computed(() => input.value.dhcpServer.ipv4AddressRanges.length > 0)
const isSwitchPort = computed(() => props.lanType === LanTypes.SwitchPort)
const isRoutedPort = computed(() => props.lanType === LanTypes.RoutedPort)
const lanMaxItems = computed(() => (isRoutedPort.value ? LansPortNumberList.length : 4))

const primaryLanInFilters = computed(() => {
  // Primary かつ LAN受信フィルタ設定ありの LANポートフィルタ設定を取得する
  const primaryLan = items.value.find(item => item.type === LansTypes.Primary && !!item.lanInFilters.defaultPolicy)
  return primaryLan?.lanInFilters
})

const headers = computed(() => [
  { text: t('terminals.lansType'), key: 'type', width: 80 },
  ...(isRoutedPort.value ? [{ text: t('terminals.interface'), key: 'portNumber', width: 50 }] : []),
  { text: t('terminals.ipv4Address'), key: 'ipv4Address', width: 140 },
  { text: t('terminals.ipv4PrefixLength'), key: 'ipv4PrefixLength', width: 100 },
  { text: t('terminals.vpnRoutingLans'), key: 'vpnRouting', width: 200 },
  { text: t('terminals.vpnNatsLans'), key: 'vpnNats', width: 200 },
  { text: t('terminals.server'), key: 'dhcpServer', width: 80 },
  ...(props.hideLanInFilters
    ? []
    : [
        {
          text: t('terminals.lanInFilters'),
          key: 'lanInFilters',
          helpContentWidth: 740,
          width: 120,
        },
        ...(isSwitchPort.value || primaryLanInFilters.value
          ? [{ text: t('terminals.lanInFiltersCount'), key: 'lanInFiltersCount', width: 120 }]
          : []),
      ]),
])

const accessListMaxItems = computed(() => {
  const maxTotal = 100
  const otherLansCount = items.value
    .filter((_, index) => index !== dialogOpenType.value)
    .reduce((sum, lan) => sum + lan.lanInFilters.accessControlList.length, 0)
  return maxTotal - otherLansCount
})

const isInputTypePrimary = computed(() => input.value.type === LansTypes.Primary)

const handleLanTypeChange = (value: string) => {
  input.value.type = value
  inputValid.value.lanInFilters = true
  if (value !== LansTypes.Primary) {
    useLanInFilters.value = false
    input.value = {
      ...input.value,
      dhcpServer: { ...initialDhcpServerInputData },
      lanInFilters: { ...initialFiltersInputData },
    }
    inputValid.value.dhcpServer = { ...initialDhcpServerValid }
  }
}

const lanTypeDisabled = computed(() => {
  return {
    primary: items.value.some(item => item.type === LansTypes.Primary),
    secondary: items.value.filter(item => item.type === LansTypes.Secondary).length >= lanMaxItems.value - 1,
  }
})
const lanTypeOptions = computed(() => {
  return Object.entries(LansTypes)
    .filter(
      ([_key, value]) =>
        !lanTypeDisabled.value[value] ||
        // Primary の編集時には両タイプ表示する
        (typeof dialogOpenType.value === 'number' && items.value[dialogOpenType.value]?.type === value),
    )
    .map(([key, value]) => ({ text: key, value }))
})

const portNumberOptions = computed(() =>
  LansPortNumberList.map((portNumber, portNumberIndex) => {
    const portNumberString = String(portNumber)
    return {
      text: t('terminals.etherPort', { portNumber: portNumberIndex }),
      value: portNumberString,
      disabled: items.value.some(
        (item, itemIndex) => itemIndex !== dialogOpenType.value && item.portNumber === portNumberString,
      ),
    }
  }).filter(option => !option.disabled),
)
const submitDisabled = computed(() =>
  Object.values(inputValid.value).some(valid =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  ),
)
const valid = computed(() => items.value.some(item => item.type === LansTypes.Primary))
watch(valid, () => emits('valid', valid.value), { immediate: true })

const handleUseLanInFiltersChange = (value: boolean) => {
  useLanInFilters.value = value
  inputValid.value.lanInFilters =
    !value || (!!input.value.lanInFilters.defaultPolicy && !!input.value.lanInFilters.accessControlList.length)
}

const ipv4AddressWithPrefixRule = (vpnRouting: string, ipv4Address: string, ipv4PrefixLength: string) => () =>
  !ipv4Address ||
  !ipv4PrefixLength ||
  rules.prefixLength(ipv4PrefixLength) !== true || // 別のルールに違反するときはこのルールを適用しない
  rules.ipAddress(ipv4Address) !== true || // 別のルールに違反するときはこのルールを適用しない
  rules.inAcceptableRange(ipv4Address) !== true || // 別のルールに違反するときはこのルールを適用しない
  vpnRouting === 'false' ||
  rules.acceptableIpAddressWithPrefix(`${ipv4Address}/${ipv4PrefixLength}`)

const subnetOverlapRule = () => {
  if (isSwitchPort.value || !input.value.ipv4Address || !input.value.ipv4PrefixLength) {
    return true
  }
  const inputSubnet = `${input.value.ipv4Address}/${input.value.ipv4PrefixLength}`

  const results = items.value
    .filter((_, index) => index !== dialogOpenType.value) // 編集中のitemを除外する
    .map(item => rules.noSubnetOverlap(`${item.ipv4Address}/${item.ipv4PrefixLength}`, inputSubnet))

  return results.find(result => result !== true) ?? true
}

const handleDialogSubmit = () => {
  const lanInFilters = useLanInFilters.value ? input.value.lanInFilters : { ...initialFiltersInputData }
  const newItem = { ...input.value, lanInFilters }

  if (dialogOpenType.value === 'add') {
    items.value = items.value.concat([newItem])
  } else if (dialogOpenType.value !== null) {
    items.value = items.value.map((item, index) => (index === dialogOpenType.value ? newItem : item))
  }
  handleDialogClose()
}
const handleDialogClose = () => {
  dialogOpenType.value = null
}
const handleUseDhcpServerChange = (value: boolean) => {
  if (value) {
    input.value.dhcpServer = {
      ...initialDhcpServerInputData,
      ipv4AddressRanges: [['', '']],
      primaryDnsServer: '202.234.232.6',
      secondaryDnsServer: '221.113.139.250',
    }
    inputValid.value.dhcpServer = { ...initialDhcpServerValid, ipv4AddressRanges: false }
  } else {
    input.value.dhcpServer = { ...initialDhcpServerInputData }
    inputValid.value.dhcpServer = { ...initialDhcpServerValid }
  }
}
const handleAddClick = () => {
  input.value = {
    ...initialLansInputData,
    type: !isSwitchPort.value ? LansTypes.Primary : '',
    vpnNats: [],
    dhcpServer: { ...initialDhcpServerInputData },
    lanInFilters: { ...initialLansInputData.lanInFilters },
  }
  inputValid.value = {
    ...initialLansValid,
    type: !isSwitchPort.value,
    dhcpServer: { ...initialDhcpServerValid },
    lanInFilters: true,
  }
  useLanInFilters.value = false
  dialogOpenType.value = 'add'
}
const handleEditClick = (index: number) => {
  const item = items.value[index]
  if (!item) {
    return
  }
  input.value = {
    ...item,
    dhcpServer: item.dhcpServer,
  }
  inputValid.value = {
    type: true,
    portNumber: true,
    ipv4Address: true,
    ipv4PrefixLength: true,
    vpnRouting: true,
    vpnNats: true,
    dhcpServer: { ...initialDhcpServerValid },
    lanInFilters: true,
  }
  useLanInFilters.value = !!item.lanInFilters.defaultPolicy
  dialogOpenType.value = index
}

watch(
  () => props.lanType,
  () => {
    items.value = []
  },
)
</script>

<template>
  <div>
    <EditTable
      v-model:items="items"
      :headers="headers"
      :disabled="disabled"
      editable
      :max-items="lanMaxItems"
      @click:add="handleAddClick"
      @click:edit="handleEditClick"
    >
      <template #help-lanInFilters>
        <div>
          {{
            isSwitchPort ? t('terminals.help.lanInFiltersSwitchPortTable') : t('terminals.help.lanInFiltersRoutedPort')
          }}
        </div>
        <div class="font-weight-bold text-decoration-underline mt-4">
          {{ t('terminals.help.filtersImage', { filterName: t('terminals.lanInFilters') }) }}
        </div>
        <img src="~/assets/images/lan-in-filters.png" width="600" class="mt-2" />
      </template>
      <template #type="{ data }">
        {{ Object.entries(LansTypes).find(([_, value]) => data === value)?.[0] }}
      </template>
      <template #portNumber="{ data }">
        {{ LansPortNumberList.indexOf(Number(data)) < 0 ? '' : `Ether${LansPortNumberList.indexOf(Number(data))}` }}
      </template>
      <template #vpnRouting="{ data }">
        {{ vpnRoutingOptions[data === 'true' ? 0 : 1]?.text }}
      </template>
      <template #vpnNats="{ row: { vpnNats: data } }">
        <div v-if="data.length === 0" />
        <div v-for="(nat, index) in data" :key="`edit-lans-vpn-nats-${index}`" class="vpn-nats text-sm">
          <div :class="{ 'pt-1': index > 0 }">type: {{ NatTypesText[nat.type as NatType] }}</div>
          <div>inner: {{ nat.innerIpv4Prefix }}</div>
          <div :class="{ 'pb-2': index + 1 < data.length }">outer: {{ nat.outerIpv4Prefix }}</div>
        </div>
      </template>
      <template #dhcpServer="{ row: { dhcpServer: data } }">
        <div v-if="data.ipv4AddressRanges.length > 0">{{ t('common.withSettings') }}</div>
        <div v-else>{{ t('common.noSettings') }}</div>
      </template>
      <template #lanInFilters="{ row: { lanInFilters: data, type } }">
        <div v-if="data.defaultPolicy || (type !== LansTypes.Primary && !!primaryLanInFilters)">
          {{ t('common.withSettings') }}
        </div>
        <div v-else-if="type === LansTypes.Primary">{{ t('common.noSettings') }}</div>
        <div v-else />
      </template>
      <template #lanInFiltersCount="{ row: { lanInFilters: data, type } }">
        <div v-if="type === LansTypes.Primary">
          {{ data.accessControlList.length }}
        </div>
        <div v-else-if="primaryLanInFilters">
          {{ primaryLanInFilters.accessControlList.length }}
        </div>
        <div v-else />
      </template>
    </EditTable>
    <DialogBase
      :open="dialogOpenType !== null"
      :submit-label="dialogOpenType === 'add' ? t('common.add') : t('common.save')"
      :cancel-label="t('common.cancel')"
      :disabled="disabled || submitDisabled"
      :title="t('terminals.lans')"
      :width="DIALOG_WIDTH"
      @submit="handleDialogSubmit"
      @close="handleDialogClose"
    >
      <div class="pb-3">
        <InputGrid
          v-if="isSwitchPort"
          required
          :label="t('terminals.lansType')"
          :help="t('terminals.help.lansType')"
          :label-width="LABEL_WIDTH"
        >
          <RadioForm
            :model-value="input.type"
            :options="lanTypeOptions"
            required
            :disabled="disabled"
            data-cy="edit-lans-lan-type"
            @update:model-value="handleLanTypeChange"
            @valid="(valid: boolean) => (inputValid.type = valid)"
          />
        </InputGrid>
        <InputGrid
          v-else-if="isRoutedPort"
          required
          :label="t('terminals.interface')"
          :label-width="LABEL_WIDTH"
          data-cy="edit-lans-port-number"
        >
          <template #help>
            <i18n-t keypath="terminals.help.interface" scope="global">
              <template #linkText>
                <NuxtLink :to="TERMINAL_LINK.INTERFACE" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="input.portNumber"
            :options="portNumberOptions"
            required
            :disabled="disabled"
            data-cy="edit-lans-port-number"
            @valid="(valid: boolean) => (inputValid.portNumber = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('terminals.ipv4Address')" :label-width="LABEL_WIDTH">
          <template #help>
            <i18n-t keypath="terminals.help.ipv4Address" scope="global">
              <template #linkText>
                <NuxtLink :to="TERMINAL_LINK.NETWORK_SETTING" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <InputFormWithCheckVpnRoutesButton
            v-model="input.ipv4Address"
            :vpn-id="vpnId"
            :terminal-id="terminalId"
            :rules="[
              rules.ipAddress,
              rules.inAcceptableRange,
              ipv4AddressWithPrefixRule(input.vpnRouting, input.ipv4Address, input.ipv4PrefixLength),
              subnetOverlapRule,
            ]"
            maxlength="15"
            required
            placeholder="192.168.1.1"
            :disabled="disabled"
            data-cy="edit-lans-ipv4-address"
            @valid="(valid: boolean) => (inputValid.ipv4Address = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('terminals.ipv4PrefixLength')" :label-width="LABEL_WIDTH">
          <InputForm
            v-model="input.ipv4PrefixLength"
            :rules="[
              rules.prefixLength,
              ipv4AddressWithPrefixRule(input.vpnRouting, input.ipv4Address, input.ipv4PrefixLength),
              subnetOverlapRule,
            ]"
            maxlength="2"
            required
            placeholder="24"
            :disabled="disabled"
            data-cy="edit-lans-ipv4-prefix-length"
            @valid="(valid: boolean) => (inputValid.ipv4PrefixLength = valid)"
          />
        </InputGrid>
        <InputGrid
          required
          :label="t('terminals.vpnRoutingLans')"
          :help="t('terminals.help.vpnRoutingLans')"
          :label-width="LABEL_WIDTH"
        >
          <RadioForm
            v-model="input.vpnRouting"
            :options="vpnRoutingOptions"
            required
            :disabled="disabled"
            data-cy="edit-lans-vpn-routing"
            @valid="(valid: boolean) => (inputValid.vpnRouting = valid)"
          />
        </InputGrid>
        <EditVpnNats
          v-model:values="input.vpnNats"
          :vpn-routing="input.vpnRouting"
          :terminal-id="terminalId"
          :label-width="LABEL_WIDTH"
          :vpn-id="vpnId"
          is-lans
          :disabled="disabled"
          data-cy="edit-lans-edit-vpn-nats"
          @valid="(valid: boolean) => (inputValid.vpnNats = valid)"
        />
        <!-- DHCP Server (type が primary の場合のみ設定可能) -->
        <InputGrid v-if="isInputTypePrimary" required :label="t('terminals.server')" :label-width="LABEL_WIDTH">
          <RadioForm
            :model-value="useDhcpServer"
            :options="settingOptions"
            :disabled="disabled || dhcpServerDisabled"
            class="py-3"
            data-cy="edit-lans-dhcp-type"
            @update:model-value="handleUseDhcpServerChange"
          />
          <div v-if="dhcpServerDisabled">{{ t('terminals.message.dhcpSettings') }}</div>
        </InputGrid>
        <template v-if="useDhcpServer">
          <InputGrid
            required
            :label="t('terminals.ipv4AddressRanges')"
            :help="t('terminals.help.ipv4AddressRanges')"
            :label-width="LABEL_WIDTH"
          >
            <MultipleIpRangeForm
              v-model:values="input.dhcpServer.ipv4AddressRanges"
              :rules="[rules.ipAddress]"
              :min-items="1"
              :max-items="5"
              maxlength="15"
              required
              :placeholder="['192.168.1.10', '192.168.1.99']"
              :disabled="disabled"
              data-cy="edit-lans-dhcp-server-ipv4-address-ranges"
              @valid="(valid: boolean) => (inputValid.dhcpServer.ipv4AddressRanges = valid)"
            />
          </InputGrid>
          <InputGrid :label="t('terminals.domain')" :label-width="LABEL_WIDTH">
            <InputForm
              v-model="input.dhcpServer.domain"
              :rules="[rules.domain]"
              maxlength="200"
              placeholder="example.com"
              :disabled="disabled"
              data-cy="edit-lans-dhcp-server-domain"
              @valid="(valid: boolean) => (inputValid.dhcpServer.domain = valid)"
            />
          </InputGrid>
          <InputGrid
            :label="t('terminals.primaryDnsServer')"
            :label-width="LABEL_WIDTH"
            :help="t('terminals.help.dnsServer')"
          >
            <InputForm
              v-model="input.dhcpServer.primaryDnsServer"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="202.234.232.6"
              :disabled="disabled"
              data-cy="edit-lans-dhcp-server-primary-dns-server"
              @valid="(valid: boolean) => (inputValid.dhcpServer.primaryDnsServer = valid)"
            />
          </InputGrid>
          <InputGrid
            :label="t('terminals.secondaryDnsServer')"
            :label-width="LABEL_WIDTH"
            :help="t('terminals.help.dnsServer')"
          >
            <InputForm
              v-model="input.dhcpServer.secondaryDnsServer"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="221.113.139.250"
              :disabled="disabled"
              data-cy="edit-lans-dhcp-server-secondary-dns-server"
              @valid="(valid: boolean) => (inputValid.dhcpServer.secondaryDnsServer = valid)"
            />
          </InputGrid>
          <InputGrid
            :label="t('terminals.primaryWinsServer')"
            :label-width="LABEL_WIDTH"
            :help="t('terminals.help.dnsServer')"
          >
            <InputForm
              v-model="input.dhcpServer.primaryWinsServer"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="192.168.1.3"
              :disabled="disabled"
              data-cy="edit-lans-dhcp-server-primary-wins-server"
              @valid="(valid: boolean) => (inputValid.dhcpServer.primaryWinsServer = valid)"
            />
          </InputGrid>
          <InputGrid
            :label="t('terminals.secondaryWinsServer')"
            :label-width="LABEL_WIDTH"
            :help="t('terminals.help.dnsServer')"
          >
            <InputForm
              v-model="input.dhcpServer.secondaryWinsServer"
              :rules="[rules.ipAddress]"
              maxlength="15"
              placeholder="192.168.1.4"
              :disabled="disabled"
              data-cy="edit-lans-dhcp-server-secondary-wins-server"
              @valid="(valid: boolean) => (inputValid.dhcpServer.secondaryWinsServer = valid)"
            />
          </InputGrid>
        </template>
        <template v-if="!hideLanInFilters">
          <InputGrid
            :required="isInputTypePrimary"
            :label="t('terminals.lanInFilters')"
            :label-width="LABEL_WIDTH"
            :help-option="{ contentWidth: 740 }"
          >
            <template #help>
              <div>
                {{
                  isSwitchPort ? t('terminals.help.lanInFiltersSwitchPort') : t('terminals.help.lanInFiltersRoutedPort')
                }}
              </div>
              <div class="font-weight-bold text-decoration-underline mt-4">
                {{ t('terminals.help.filtersImage', { filterName: t('terminals.lanInFilters') }) }}
              </div>
              <img src="~/assets/images/lan-in-filters.png" width="600" class="mt-2" />
            </template>
            <RadioForm
              v-if="isInputTypePrimary"
              :model-value="useLanInFilters"
              :options="settingOptions"
              :disabled="disabled"
              class="py-3"
              data-cy="edit-lans-lan-in-filters"
              @update:model-value="handleUseLanInFiltersChange"
            />
            <div v-else-if="!!primaryLanInFilters" data-cy="edit-lans-show-primary-lan-in-filters">
              {{ t('terminals.message.showPrimaryLanInFilters') }}
            </div>
          </InputGrid>
          <EditFilters
            v-if="useLanInFilters"
            v-model="input.lanInFilters"
            required
            :disabled="disabled"
            :label-width="LABEL_WIDTH"
            :edit-access-list-option="{
              title: t('terminals.lanInFilters'),
              sourceIpv4PrefixPlaceholder: '192.168.0.0/24',
              destinationIpv4PrefixPlaceholder: '192.168.0.0/24',
              maxItems: accessListMaxItems,
            }"
            data-cy="edit-lans-edit-filters"
            @valid="(valid: boolean) => (inputValid.lanInFilters = valid)"
          />
          <EditFilters
            v-else-if="!isInputTypePrimary && !!primaryLanInFilters"
            :model-value="primaryLanInFilters"
            disabled
            :label-width="LABEL_WIDTH"
            data-cy="edit-lans-edit-filters-readonly"
          />
        </template>
      </div>
    </DialogBase>
  </div>
</template>

<style scoped lang="scss">
$secondary-color: rgb(var(--v-theme-secondary));

.vpn-nats {
  border-bottom: 1px dashed $secondary-color;
  &:last-of-type {
    border-bottom: none;
  }
}
</style>
