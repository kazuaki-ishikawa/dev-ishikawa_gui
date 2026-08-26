<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { initialLanStaticRoutesInputData, initialLanStaticRoutesValid, NatTypesText } from '@/api/terminals/constants'
import type { TerminalLanStaticRoutesInputType, NatType } from '@/api/terminals/types'

const DIALOG_WIDTH = 1080

type PropType = {
  required?: boolean
  disabled?: boolean
  vpnId?: string
  terminalId?: string
}
const props = withDefaults(defineProps<PropType>(), {
  required: false,
  disabled: false,
})
const items = defineModel<TerminalLanStaticRoutesInputType[]>('values', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { vpnRoutingOptions } = useTerminalInput()

const dialogOpenType = ref<'add' | number | null>(null)
const input = ref(structuredClone(initialLanStaticRoutesInputData))
const inputValid = ref(structuredClone(initialLanStaticRoutesValid))

const sortedItems = computed({
  get: () => items.value.toSorted((a, b) => cidrSort(a.destinationIpv4Prefix, b.destinationIpv4Prefix)),
  set: newValue => {
    items.value = newValue
  },
})
const submitDisabled = computed(() => Object.values(inputValid.value).some(valid => !valid))
const valid = computed(() => !props.required || items.value.length > 0)
watch(valid, () => emits('valid', valid.value))

const handleDialogSubmit = () => {
  if (dialogOpenType.value === 'add') {
    sortedItems.value = sortedItems.value.concat([{ ...input.value, vpnNats: input.value.vpnNats }])
  } else if (typeof dialogOpenType.value === 'number') {
    sortedItems.value = sortedItems.value.map((item, index) => {
      if (index === dialogOpenType.value) {
        return { ...input.value, vpnNats: input.value.vpnNats }
      }
      return item
    })
  }
  handleDialogClose()
}
const handleDialogClose = () => {
  dialogOpenType.value = null
  input.value = structuredClone(initialLanStaticRoutesInputData)
  inputValid.value = structuredClone(initialLanStaticRoutesValid)
}
const handleAddClick = () => {
  dialogOpenType.value = 'add'
}
const handleEditClick = (index: number) => {
  dialogOpenType.value = index
  const found = sortedItems.value[index]
  if (found) {
    input.value = { ...found, vpnNats: found.vpnNats }
  }
}
</script>

<template>
  <div>
    <EditTable
      v-model:items="sortedItems"
      :headers="[
        { text: t('terminals.destinationIpv4NetworkAddress'), key: 'destinationIpv4Prefix' },
        { text: t('terminals.nexthopIpv4Address'), key: 'nexthopIpv4Address' },
        { text: t('terminals.vpnRoutingLanStatic'), key: 'vpnRouting' },
        { text: t('terminals.vpnNatsLanStatic'), key: 'vpnNats', width: 200 },
      ]"
      editable
      :disabled="disabled"
      :max-items="95"
      @click:add="handleAddClick"
      @click:edit="handleEditClick"
    >
      <template #vpnRouting="{ row: { vpnRouting } }">
        {{ vpnRoutingOptions[vpnRouting === 'true' ? 0 : 1]?.text }}
      </template>
      <template #vpnNats="{ row: { vpnNats: data } }">
        <div v-if="data.length === 0" />
        <div v-for="(nat, index) in data" :key="`edit-lan-static-routes-vpn-nats-${index}`" class="vpn-nats text-sm">
          <div :class="{ 'pt-1': index > 0 }">type: {{ NatTypesText[nat.type as NatType] }}</div>
          <div>inner: {{ nat.innerIpv4Prefix }}</div>
          <div :class="{ 'pb-2': index + 1 < data.length }">outer: {{ nat.outerIpv4Prefix }}</div>
        </div>
      </template>
    </EditTable>
    <DialogBase
      :open="dialogOpenType !== null"
      :submit-label="dialogOpenType === 'add' ? t('common.add') : t('common.save')"
      :cancel-label="t('common.cancel')"
      :disabled="submitDisabled || disabled"
      :title="t('terminals.lanStaticRoutes')"
      :width="DIALOG_WIDTH"
      @submit="handleDialogSubmit"
      @close="handleDialogClose"
    >
      <div>
        <InputGrid required :label="t('terminals.destinationIpv4NetworkAddress')">
          <InputFormWithCheckVpnRoutesButton
            v-model="input.destinationIpv4Prefix"
            :vpn-id="vpnId"
            :terminal-id="terminalId"
            :rules="[rules.cidr]"
            maxlength="18"
            required
            placeholder="192.168.2.0/24"
            :disabled="disabled"
            data-cy="edit-lan-static-routes-destination-ipv4-prefix"
            @valid="(valid: boolean) => (inputValid.destinationIpv4Prefix = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('terminals.nexthopIpv4Address')">
          <InputForm
            v-model="input.nexthopIpv4Address"
            :rules="[rules.ipAddress]"
            maxlength="15"
            required
            size="xSmall"
            placeholder="192.168.1.2"
            :disabled="disabled"
            data-cy="edit-lan-static-routes-nexthop-ipv4-address"
            @valid="(valid: boolean) => (inputValid.nexthopIpv4Address = valid)"
          />
        </InputGrid>
        <InputGrid class="pb-8" required :label="t('terminals.vpnRoutingLanStatic')">
          <RadioForm
            v-model="input.vpnRouting"
            :options="vpnRoutingOptions"
            :disabled="disabled"
            data-cy="edit-lan-static-routes-vpn-routing"
            @valid="(valid: boolean) => (inputValid.vpnRouting = valid)"
          />
        </InputGrid>
        <EditVpnNats
          v-model:values="input.vpnNats"
          :vpn-routing="input.vpnRouting"
          :vpn-id="vpnId"
          :terminal-id="terminalId"
          :is-lans="false"
          :disabled="disabled"
          data-cy="edit-lan-static-routes-edit-vpn-nats"
          @valid="(valid: boolean) => (inputValid.vpnNats = valid)"
        />
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
