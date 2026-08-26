<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { CustomTextFieldPropType } from '@/components/nova/form/types'

type PropType = {
  inputProps: Omit<CustomTextFieldPropType, 'color'>
  isConfirmation?: boolean
  original?: string[]
  maxItems?: number
  minItems?: number
}
const props = withDefaults(defineProps<PropType>(), {
  isConfirmation: false,
  original: undefined,
  maxItems: undefined,
  minItems: 0,
})

const model = defineModel<string[]>({ required: true })

const { t } = useI18n()

const edited = computed(() => props.original !== undefined && !isEqual(model.value, props.original))
const disabled = computed(() => props.inputProps?.disabled || props.isConfirmation)
const baseColor = computed(() => (edited.value ? 'success' : undefined))

const originalValues = computed<Array<{ value: string; id: string }>>(
  () =>
    props.original?.map((value, index) => ({
      value,
      id: index.toString(),
    })) ?? [],
)
const modelValue = computed<Array<{ value: string; id: string }>>({
  get: (previous?: Array<{ value: string; id: string }>) => {
    return model.value.map((value, index) => {
      const sameIndexItem = previous?.[index]
      if (sameIndexItem) {
        return { ...sameIndexItem, value }
      }

      return { value, id: createRandomString('multiple-input-form-') }
    })
  },
  set: (values: Array<{ value: string; id: string }>) => {
    model.value = values.map(value => value.value)
  },
})

const lengthRules = (values: string[]) => {
  if (props.maxItems !== undefined && props.maxItems < values.length) {
    return t('nova.invalid.tooManyItems', { max: props.maxItems })
  }
  if (props.minItems > values.length) {
    return t('nova.invalid.tooFewItems', { min: props.minItems })
  }
  return true
}

const handleUpdateValue = (value: string, id: string) => {
  modelValue.value = modelValue.value.map(item => (item.id === id ? { ...item, value } : item))
}

const handleUpdateMultipleFormValues = (id?: string) => {
  if (id === undefined) {
    modelValue.value = [
      ...modelValue.value,
      {
        value: '',
        id: createRandomString({ prefix: 'multiple-input-form-' }),
      },
    ]
  } else {
    modelValue.value = modelValue.value.filter(d => d.id !== id)
  }
}

onBeforeMount(() => {
  // model.value の長さが minItems より小さい場合は minItems に合わせて初期化
  if (model.value.length < props.minItems) {
    model.value = [...model.value, ...Array.from({ length: props.minItems - model.value.length }, () => '')]
  }
})
</script>

<template>
  <NovaValidationInput :value="model" :rules="[lengthRules]">
    <template #default="{ invalid }">
      <v-sheet color="transparent" class="d-flex flex-wrap ga-6">
        <NovaMultipleItems v-if="isConfirmation && edited && original !== undefined" :values="originalValues" disabled>
          <template #child="{ data }">
            <NovaCustomTextField v-bind="{ ...inputProps }" :model-value="data.value" color="info" disabled>
              <template #prepend>
                <span class="text-error text-sm">{{ t('nova.common.beforeUpdate') }}</span>
              </template>
              <template v-if="$slots.explanation" #explanation><slot name="explanation" /></template>
            </NovaCustomTextField>
          </template>
        </NovaMultipleItems>
        <NovaMultipleItems
          :values="modelValue"
          :disabled="disabled"
          :min-items="minItems"
          :max-items="maxItems"
          @click:add="handleUpdateMultipleFormValues"
          @click:remove="handleUpdateMultipleFormValues"
        >
          <template #child="{ data }">
            <NovaCustomTextField
              v-bind="{ ...inputProps }"
              :model-value="data.value"
              :color="invalid ? 'error' : baseColor"
              :disabled="disabled"
              @update:model-value="(value: string) => handleUpdateValue(value, data.id)"
            >
              <template v-if="isConfirmation && edited" #prepend>
                <span class="text-error text-sm">{{ t('nova.common.afterUpdate') }}</span>
              </template>
              <template v-if="$slots.explanation" #explanation><slot name="explanation" /></template>
            </NovaCustomTextField>
          </template>
        </NovaMultipleItems>
      </v-sheet>
    </template>
  </NovaValidationInput>
</template>
