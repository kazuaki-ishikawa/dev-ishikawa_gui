<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ActionTypes } from '@/api/terminals/constants'
import type { TerminalFiltersInputType, TerminalAccessControlInputData } from '@/api/terminals/types'

type PropType = {
  required?: boolean
  disabled?: boolean
  editable?: boolean
  labelWidth?: number
  editAccessListOption?: {
    title?: string
    maxItems?: number
    sourceIpv4PrefixPlaceholder?: string
    destinationIpv4PrefixPlaceholder?: string
    sourceIpv4PrefixStaticValue?: string
    destinationIpv4PrefixStaticValue?: string
  }
}
const model = defineModel<TerminalFiltersInputType>({ required: true })

const props = withDefaults(defineProps<PropType>(), {
  required: false,
  disabled: false,
  editable: true,
  labelWidth: 290,
  editAccessListOption: () => ({ maxItems: 60 }),
})

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const defaultPolicyOptions = [ActionTypes.Accept, ActionTypes.Discard].map(value => ({
  text: t(`accessControl.${value}`),
  value,
}))
const defaultPolicyText = computed(() => {
  const found = defaultPolicyOptions.find(option => option.value === model.value.defaultPolicy)
  return found?.text ?? ''
})

const defaultPolicyUpdate = (defaultPolicy: string) => {
  model.value = { defaultPolicy, accessControlList: model.value.accessControlList }
}
const accessContorolListUpdate = (accessControlList: TerminalAccessControlInputData[]) => {
  model.value = { defaultPolicy: model.value.defaultPolicy, accessControlList }
}

const valid = computed(
  () => !props.required || (!!model.value.defaultPolicy && model.value.accessControlList.length > 0),
)
watch(valid, () => {
  emits('valid', valid.value)
})
</script>

<template>
  <div>
    <DetailGrid v-if="!editable">
      <div>{{ t('terminals.defaultPolicy') }}</div>
      <div>{{ defaultPolicyText }}</div>
    </DetailGrid>

    <InputGrid
      v-if="editable"
      :required="required"
      :label="t('terminals.defaultPolicy')"
      :label-width="labelWidth"
      :help="t('terminals.help.defaultPolicy')"
    >
      <SelectForm
        :model-value="model.defaultPolicy"
        :options="defaultPolicyOptions"
        size="middle"
        :disabled="disabled"
        :required="required"
        :placeholder="defaultPolicyOptions[0]?.text"
        data-cy="edit-filters-default-policy"
        @update:model-value="defaultPolicyUpdate"
      />
    </InputGrid>

    <EditAccessList
      :values="model.accessControlList"
      :disabled="disabled || !editable"
      v-bind="{ ...editAccessListOption }"
      @update:values="accessContorolListUpdate"
    />
  </div>
</template>
