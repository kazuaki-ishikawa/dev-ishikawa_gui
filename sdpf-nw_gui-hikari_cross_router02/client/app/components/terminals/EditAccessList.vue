<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ProtocolTypes } from '@/api/constants'
import { ActionTypes, initialAccessControlInputData, initialAccessControlValid } from '@/api/terminals/constants'
import type { TerminalAccessControlInputData } from '@/api/terminals/types'

const PortDisabledProtocolList = [ProtocolTypes.Any, ProtocolTypes.Icmp] as const

type PropType = {
  disabled?: boolean
  title?: string
  sourceIpv4PrefixPlaceholder?: string
  destinationIpv4PrefixPlaceholder?: string
  sourceIpv4PrefixStaticValue?: string
  destinationIpv4PrefixStaticValue?: string
  maxItems?: number
}
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
  maxItems: 60,
  title: undefined,
  sourceIpv4PrefixPlaceholder: '8.8.8.8/32',
  destinationIpv4PrefixPlaceholder: '8.8.8.8/32',
  sourceIpv4PrefixStaticValue: '',
  destinationIpv4PrefixStaticValue: '',
})

const items = defineModel<TerminalAccessControlInputData[]>('values', { required: true })

const { t } = useI18n()
const rules = useRules()

const dialogOpenType = ref<'add' | number | null>(null)
const input = ref({
  ...initialAccessControlInputData,
  sourceIpv4Prefix: props.sourceIpv4PrefixStaticValue,
  destinationIpv4Prefix: props.destinationIpv4PrefixStaticValue,
})
const inputValid = ref({
  ...initialAccessControlValid,
  sourceIpv4Prefix: !!props.sourceIpv4PrefixStaticValue,
  destinationIpv4Prefix: !!props.destinationIpv4PrefixStaticValue,
})

const protocolOptions = Object.values(ProtocolTypes).map(value => ({ text: value, value }))
const actionOptions = [ActionTypes.Accept, ActionTypes.Discard].map(value => ({
  text: t(`accessControl.${value}`),
  value,
}))
const ipAddressOptions = ['0.0.0.0/0'].map(value => ({ text: value, value }))

const portDisabled = computed(() => PortDisabledProtocolList.includes(input.value.protocol))
const submitDisabled = computed(() => Object.values(inputValid.value).some(valid => !valid))
const isLanInFilters = computed(() => props.title === t('terminals.lanInFilters'))

const handleDialogSubmit = () => {
  const port = {
    sourcePort: !!input.value.sourcePort || portDisabled.value ? input.value.sourcePort : ProtocolTypes.Any,
    destinationPort:
      !!input.value.destinationPort || portDisabled.value ? input.value.destinationPort : ProtocolTypes.Any,
  }
  if (dialogOpenType.value === 'add') {
    items.value = items.value.concat([{ ...input.value, ...port }])
  } else if (typeof dialogOpenType.value === 'number') {
    items.value = items.value.map((item, index) => {
      if (index === dialogOpenType.value) {
        return { ...input.value, ...port }
      }
      return item
    })
  }
  handleDialogClose()
}
const handleDialogClose = () => {
  dialogOpenType.value = null
  input.value = {
    ...initialAccessControlInputData,
    sourceIpv4Prefix: props.sourceIpv4PrefixStaticValue,
    destinationIpv4Prefix: props.destinationIpv4PrefixStaticValue,
  }
  inputValid.value = {
    ...initialAccessControlValid,
    sourceIpv4Prefix: !!props.sourceIpv4PrefixStaticValue,
    destinationIpv4Prefix: !!props.destinationIpv4PrefixStaticValue,
  }
}
const handleAddClick = () => {
  dialogOpenType.value = 'add'
}
const handleEditClick = (index: number) => {
  dialogOpenType.value = index
  const found = items.value[index]
  if (found) {
    input.value = { ...found }
  }
}
const handleUpdateProtocol = (protocol: string) => {
  if (PortDisabledProtocolList.includes(protocol)) {
    input.value.sourcePort = ''
    input.value.destinationPort = ''
  }
}
</script>

<template>
  <EditTable
    v-model:items="items"
    :headers="[
      { text: t('terminals.protocol'), key: 'protocol', width: 75 },
      { text: t('terminals.sourcePort'), key: 'sourcePort', help: t('accessControl.help.sourcePort') },
      { text: t('terminals.destinationPort'), key: 'destinationPort', help: t('accessControl.help.destinationPort') },
      {
        text: t('terminals.sourceIpv4Prefix'),
        key: 'sourceIpv4Prefix',
      },
      {
        text: t('terminals.destinationIpv4Prefix'),
        key: 'destinationIpv4Prefix',
      },
      { text: t('terminals.action'), key: 'action' },
    ]"
    :disabled="disabled"
    :max-items="maxItems"
    editable
    orderable
    @click:add="handleAddClick"
    @click:edit="handleEditClick"
  >
    <template #action="{ data }">
      {{ actionOptions[data === ActionTypes.Accept ? 0 : 1]?.text }}
    </template>
  </EditTable>
  <Teleport to="body">
    <DialogBase
      :open="dialogOpenType !== null"
      :submit-label="dialogOpenType === 'add' ? t('common.add') : t('common.save')"
      :cancel-label="t('common.cancel')"
      :disabled="submitDisabled || disabled"
      overflow-y="visible"
      :title="title"
      data-cy="edit-access-list-dialog"
      @submit="handleDialogSubmit"
      @close="handleDialogClose"
    >
      <div>
        <InputGrid required :label="t('terminals.protocol')">
          <SelectForm
            v-model="input.protocol"
            :options="protocolOptions"
            size="middle"
            required
            :placeholder="protocolOptions[0]?.text"
            :disabled="disabled"
            data-cy="edit-access-list-protocol"
            @update:model-value="handleUpdateProtocol"
            @valid="(valid: boolean) => (inputValid.protocol = valid)"
          />
        </InputGrid>
        <InputGrid
          :required="!portDisabled"
          :label="t('terminals.sourcePort')"
          :help="t('accessControl.help.sourcePort')"
          :help-option="{ contentWidth: 500 }"
        >
          <InputForm
            v-model="input.sourcePort"
            :rules="[rules.port]"
            maxlength="11"
            :disabled="portDisabled || disabled"
            placeholder="any"
            :required="!portDisabled"
            data-cy="edit-access-list-source-port"
            @valid="(valid: boolean) => (inputValid.sourcePort = valid)"
          />
        </InputGrid>
        <InputGrid
          :required="!portDisabled"
          :label="t('terminals.destinationPort')"
          :help="t('accessControl.help.destinationPort')"
          :help-option="{ contentWidth: 500 }"
        >
          <InputForm
            v-model="input.destinationPort"
            :rules="[rules.port]"
            maxlength="11"
            :disabled="portDisabled || disabled"
            placeholder="any"
            :required="!portDisabled"
            data-cy="edit-access-list-destination-port"
            @valid="(valid: boolean) => (inputValid.destinationPort = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('terminals.sourceIpv4Prefix')">
          <SelectableInputForm
            v-model="input.sourceIpv4Prefix"
            :options="ipAddressOptions"
            :rules="[rules.cidr]"
            maxlength="18"
            required
            :disabled="!!sourceIpv4PrefixStaticValue || disabled"
            :placeholder="sourceIpv4PrefixPlaceholder"
            data-cy="edit-access-list-source-ipv4-prefix"
            @valid="(valid: boolean) => (inputValid.sourceIpv4Prefix = valid)"
          />
        </InputGrid>
        <InputGrid
          required
          :label="t('terminals.destinationIpv4Prefix')"
          :help="isLanInFilters ? t('terminals.help.destinationIpv4Prefix') : ''"
        >
          <SelectableInputForm
            v-model="input.destinationIpv4Prefix"
            :options="ipAddressOptions"
            :rules="[rules.cidr]"
            maxlength="18"
            required
            :disabled="!!destinationIpv4PrefixStaticValue || disabled"
            :placeholder="destinationIpv4PrefixPlaceholder"
            data-cy="edit-access-list-destination-ipv4-prefix"
            @valid="(valid: boolean) => (inputValid.destinationIpv4Prefix = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('terminals.action')" class="pb-3">
          <SelectForm
            v-model="input.action"
            :options="actionOptions"
            size="middle"
            required
            :placeholder="actionOptions[0]?.text"
            :disabled="disabled"
            data-cy="edit-access-list-action"
            @valid="(valid: boolean) => (inputValid.action = valid)"
          />
        </InputGrid>
      </div>
    </DialogBase>
  </Teleport>
</template>
