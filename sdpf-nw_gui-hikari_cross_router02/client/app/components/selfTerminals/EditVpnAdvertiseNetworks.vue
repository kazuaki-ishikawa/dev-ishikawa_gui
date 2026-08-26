<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { VpnRouteLimitList } from '@/api/selfTerminals/constants'

type PropsType = {
  disabled: boolean
  vpnId: string
  terminalId?: string
  maxItems?: (typeof VpnRouteLimitList)[number]
}
const props = defineProps<PropsType>()
type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const model = defineModel<string[]>({ required: true })

const { t } = useI18n()
const rules = useRules()

const vpnAdvertiseNetworksInput = ref<Array<{ id: string; value: string; valid: boolean }>>([])
const updateVpnAdvertiseNetworks = (index?: number) => {
  if (index === undefined) {
    vpnAdvertiseNetworksInput.value = vpnAdvertiseNetworksInput.value.concat([
      {
        value: '',
        valid: true,
        id: createRandomString({ prefix: 'vpn-advertise-networks-' }),
      },
    ])
  } else {
    vpnAdvertiseNetworksInput.value = vpnAdvertiseNetworksInput.value.filter((_, idx) => idx !== index)
  }
}
const handleVpnAdvertiseNetworksChange = (value: string, index: number) => {
  if (!vpnAdvertiseNetworksInput.value[index]) {
    return
  }
  vpnAdvertiseNetworksInput.value[index].value = value
}
const handleVpnAdvertiseNetworksValidChange = (value: boolean, index: number) => {
  if (vpnAdvertiseNetworksInput.value[index]) {
    vpnAdvertiseNetworksInput.value[index].valid = value
  }
}

watchEffect(() => {
  model.value = vpnAdvertiseNetworksInput.value.filter(item => !!item.value).map(item => item.value)
  const invalid = vpnAdvertiseNetworksInput.value.some(({ valid }) => !valid)
  emits('valid', !invalid)
})

watch(
  () => props.maxItems,
  next => {
    if (next) {
      vpnAdvertiseNetworksInput.value = vpnAdvertiseNetworksInput.value.slice(0, next)
    }
  },
)
watch(
  () => props.disabled,
  next => {
    if (next) {
      vpnAdvertiseNetworksInput.value = vpnAdvertiseNetworksInput.value.filter(item => !!item.value)
    }
  },
)
onBeforeMount(() => {
  vpnAdvertiseNetworksInput.value = model.value.map(item => ({
    id: createRandomString({ prefix: 'vpn-advertise-networks-' }),
    value: item,
    valid: true,
  }))
})
onBeforeUnmount(() => {
  model.value = []
  emits('valid', true)
})
</script>

<template>
  <InputGrid
    :label="t('terminals.vpnAdvertiseNetworks')"
    :help="t('selfTerminals.help.vpnAdvertiseNetworks')"
    :help-option="{ contentWidth: 650 }"
  >
    <MultipleForm
      :values="vpnAdvertiseNetworksInput"
      :disabled="disabled"
      :max-items="maxItems"
      data-cy="edit-vpn-advertise-networks"
      @click:add="updateVpnAdvertiseNetworks"
      @click:remove="updateVpnAdvertiseNetworks"
    >
      <template #child="{ data, index }">
        <InputFormWithCheckVpnRoutesButton
          :model-value="data.value"
          :vpn-id="vpnId"
          :terminal-id="terminalId"
          :rules="[rules.cidr, rules.networkAddress]"
          :disabled="disabled"
          maxlength="18"
          placeholder="192.168.1.0/24"
          @update:model-value="value => handleVpnAdvertiseNetworksChange(value, index)"
          @valid="valid => handleVpnAdvertiseNetworksValidChange(valid, index)"
        />
      </template>
    </MultipleForm>
  </InputGrid>
</template>
