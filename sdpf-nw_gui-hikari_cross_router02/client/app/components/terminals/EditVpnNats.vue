<script lang="ts" setup>
import { omit } from 'es-toolkit'
import { nanoid } from 'nanoid'
import { useI18n } from 'vue-i18n'
import { NatTypes, NatTypesText, initialVpnNatsInputData, initialVpnNatsValid } from '@/api/terminals/constants'
import type { TerminalVpnNatsInputType } from '@/api/terminals/types'

type TerminalVpnNatsInputTypeWidthId = { id: string } & TerminalVpnNatsInputType
type VpnNatsValidType = typeof initialVpnNatsValid
type VpnNatsKeyType = keyof typeof initialVpnNatsValid

type PropType = {
  vpnRouting: string
  vpnId?: string
  terminalId?: string
  required?: boolean
  disabled?: boolean
  isLans: boolean
  labelWidth?: number
}
const props = withDefaults(defineProps<PropType>(), {
  required: false,
  disabled: false,
  labelWidth: undefined,
})
const model = defineModel<TerminalVpnNatsInputType[]>('values', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()

const items = ref<TerminalVpnNatsInputTypeWidthId[]>([])
const validList = ref<VpnNatsValidType[]>([])

const vpnNatTypeOptions = computed(() =>
  Object.entries(NatTypesText)
    .filter(([key, _value]) => props.vpnRouting !== 'true' || key !== NatTypes.Nat)
    .map(([key, value]) => ({ text: value, value: key })),
)
const innerIpv4PrefixBindOptions = computed(() => ({
  rules: [rules.cidr],
  maxlength: '18',
  required: true,
  placeholder: props.isLans ? '192.168.1.0/24' : '192.168.2.0/24',
  disabled: props.disabled,
  size: 'xSmall' as const,
  ['data-cy']: 'edit-vpn-nats-inner-ipv4-prefix',
}))
const outerIpv4PrefixBindOptions = computed(() => ({
  rules: [rules.cidr],
  maxlength: '18',
  required: true,
  placeholder: props.isLans ? '10.10.1.0/24' : '10.10.2.0/24',
  disabled: props.disabled,
  size: 'xSmall' as const,
  ['data-cy']: 'edit-vpn-nats-outer-ipv4-prefix',
}))

const handleItemsChange = (value: string, key: VpnNatsKeyType, index: number) => {
  if (!items.value[index]) {
    return
  }
  items.value[index][key] = value
  model.value = items.value.map(item => omit(item, ['id']))
}
const handleValidListChange = (valid: boolean, key: VpnNatsKeyType, index: number) => {
  if (!validList.value[index]) {
    return
  }
  validList.value[index][key] = valid
  const check = validList.value.every(obj => Object.values(obj).every(v => v))
  emits('valid', check && (!props.required || validList.value.length > 0))
}

const handlePlusClick = () => {
  items.value = items.value.concat([{ ...initialVpnNatsInputData, id: nanoid() }])
  validList.value = validList.value.concat([{ ...initialVpnNatsValid }])
  model.value = items.value.map(item => omit(item, ['id']))
}
const handleMinusClick = (index: number) => {
  items.value = items.value.slice(0, index).concat(items.value.slice(index + 1))
  validList.value = validList.value.slice(0, index).concat(validList.value.slice(index + 1))
  model.value = items.value.map(item => omit(item, ['id']))
}

watch(validList, () => {
  const valid = validList.value.every(obj => Object.values(obj).every(v => v))
  emits('valid', valid && (!props.required || validList.value.length > 0))
})

watch(
  () => props.vpnRouting,
  next => {
    if (next === 'true') {
      items.value.forEach((v, index) => {
        if (v.type === NatTypes.Nat) {
          handleItemsChange('', 'type', index)
          handleValidListChange(false, 'type', index)
        }
      })
    }
  },
)

onBeforeMount(() => {
  items.value = model.value.map(val => ({ ...val, id: nanoid() }))
  validList.value = model.value.map(val => ({
    type: !!val.type,
    innerIpv4Prefix: !!val.innerIpv4Prefix,
    outerIpv4Prefix: !!val.outerIpv4Prefix,
  }))
})
</script>

<template>
  <InputGrid
    :label="isLans ? t('terminals.vpnNatsLans') : t('terminals.vpnNatsLanStatic')"
    :help="isLans ? undefined : t('terminals.help.vpnNatsLanStatic')"
    :label-width="labelWidth"
  >
    <MultipleForm :disabled="disabled" :values="items" @click:add="handlePlusClick" @click:remove="handleMinusClick">
      <template #child="{ data, index }">
        <div class="flex-flex-start-center">
          <div class="text-sm text-info">{{ t('terminals.vpnNatType') }}</div>
          <HelpTooltip class="px-2 pt-1" size="smallMiddle">{{ t('terminals.help.vpnNatType') }}</HelpTooltip>
        </div>

        <RadioForm
          :model-value="data.type"
          :options="vpnNatTypeOptions"
          required
          :disabled="disabled"
          class="mb-5"
          data-cy="edit-vpn-nats-type"
          @valid="(valid: boolean) => handleValidListChange(valid, 'type', index)"
          @update:model-value="(value: string) => handleItemsChange(value, 'type', index)"
        />
        <div class="flex-flex-start-center">
          <div class="text-sm text-info">{{ t('terminals.innerIpv4NetworkAddress') }}</div>
          <HelpTooltip class="px-2 pt-1" size="smallMiddle">
            {{
              isLans
                ? t('terminals.help.innerIpv4NetworkAddressLans')
                : t('terminals.help.innerIpv4NetworkAddressLanStatic')
            }}
          </HelpTooltip>
        </div>
        <InputForm
          :model-value="data.innerIpv4Prefix"
          v-bind="innerIpv4PrefixBindOptions"
          @valid="(valid: boolean) => handleValidListChange(valid, 'innerIpv4Prefix', index)"
          @update:model-value="(value: string) => handleItemsChange(value, 'innerIpv4Prefix', index)"
        />
        <div class="text-sm text-info">{{ t('terminals.outerIpv4NetworkAddress') }}</div>
        <InputFormWithCheckVpnRoutesButton
          :model-value="data.outerIpv4Prefix"
          v-bind="outerIpv4PrefixBindOptions"
          :vpn-id="vpnId"
          :terminal-id="terminalId"
          @valid="(valid: boolean) => handleValidListChange(valid, 'outerIpv4Prefix', index)"
          @update:model-value="(value: string) => handleItemsChange(value, 'outerIpv4Prefix', index)"
        />
      </template>
    </MultipleForm>
  </InputGrid>
</template>
