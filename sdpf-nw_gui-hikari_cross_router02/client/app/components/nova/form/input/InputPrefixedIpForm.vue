<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { InputPrefixedIpFormType } from '@/components/nova/form/types'

const props = withDefaults(defineProps<InputPrefixedIpFormType>(), {
  isConfirmation: false,
  original: undefined,
})
const model = defineModel<string>({ required: true })

const { t } = useI18n()

const inputValue = computed({
  get: () => {
    // プレフィックスありのIPアドレスが返ってくるので、サブネットマスクを除いた部分を返す
    return model.value.replace(/\/\d+$/, '')
  },
  set: (value: string) => {
    // model.value にセットする際は、プレフィックスを付与してセットする
    model.value = value ? `${value}/${props.prefix}` : ''
  },
})

const edited = computed(() => props.original !== undefined && props.original !== model.value)
const disabled = computed(() => props.inputProps?.disabled || props.isConfirmation)
const baseColor = computed(() => (edited.value ? 'success' : undefined))
const replacedOriginal = computed(() => {
  if (props.original === undefined) {
    return ''
  }
  return props.original.replace(/\/\d+$/, '')
})
</script>

<template>
  <v-sheet color="transparent" class="d-flex flex-wrap ga-6">
    <v-sheet v-if="isConfirmation && edited && original !== undefined" color="transparent" width="fit-content">
      <NovaCustomTextField
        v-bind="{ ...inputProps }"
        :model-value="replacedOriginal"
        color="info"
        disabled
        :max-length="15"
      >
        <template #prepend>
          <span class="text-error text-sm">{{ t('nova.common.beforeUpdate') }}</span>
        </template>
        <template #explanation><slot name="explanation" /></template>
        <template #append-inner>
          <span class="text-info text-sm">{{ `/${props.prefix}` }}</span>
        </template>
      </NovaCustomTextField>
    </v-sheet>
    <v-sheet color="transparent" width="fit-content">
      <NovaCustomTextField
        v-bind="{ ...inputProps }"
        v-model="inputValue"
        :color="baseColor"
        :disabled="disabled"
        :max-length="15"
      >
        <template v-if="isConfirmation && edited" #prepend>
          <span class="text-error text-sm">{{ t('nova.common.afterUpdate') }}</span>
        </template>
        <template #explanation><slot name="explanation" /></template>
        <template #append-inner>
          <span class="text-info text-sm">{{ `/${props.prefix}` }}</span>
        </template>
      </NovaCustomTextField>
    </v-sheet>
  </v-sheet>
</template>
