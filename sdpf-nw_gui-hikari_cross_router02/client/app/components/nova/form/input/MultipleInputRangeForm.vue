<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { CustomTextFieldPropType } from '@/components/nova/form/types'

type ModelValueType = [string, string]
type InputValueType = { value: ModelValueType; id: string }
type PropType = {
  inputProps: Omit<CustomTextFieldPropType, 'color' | 'placeholder'>
  placeholder?: ModelValueType
  isConfirmation?: boolean
  original?: ModelValueType[]
  maxItems?: number
  minItems?: number
}
const props = withDefaults(defineProps<PropType>(), {
  isConfirmation: false,
  original: undefined,
  maxItems: undefined,
  minItems: 0,
})

const model = defineModel<ModelValueType[]>({ required: true })

const { t } = useI18n()

const edited = computed(() => props.original !== undefined && !isEqual(model.value, props.original))
const disabled = computed(() => props.inputProps?.disabled || props.isConfirmation)
const baseColor = computed(() => (edited.value ? 'success' : undefined))

const showLabel = computed(() => props.isConfirmation && edited.value)
const style = computed(() => ({
  ['grid-template-columns']: showLabel.value ? '80px 1fr 30px 1fr' : '1fr 30px 1fr',
}))

const originalValues = computed<InputValueType[]>(
  () =>
    props.original?.map((value, index) => ({
      value,
      id: index.toString(),
    })) ?? [],
)
const modelValue = computed<InputValueType[]>({
  get: (previous?: InputValueType[]) => {
    return model.value.map((value, index) => {
      const sameIndexItem = previous?.[index]
      if (sameIndexItem) {
        return { ...sameIndexItem, value }
      }

      return { value, id: createRandomString({ prefix: 'multiple-input-form-' }) }
    })
  },
  set: (values: InputValueType[]) => {
    model.value = values.map(value => value.value)
  },
})

const lengthRules = (values: ModelValueType[]) => {
  if (props.maxItems !== undefined && props.maxItems < values.length) {
    return t('nova.invalid.tooManyItems', { max: props.maxItems })
  }
  if (props.minItems > values.length) {
    return t('nova.invalid.tooFewItems', { min: props.minItems })
  }
  return true
}

const handleUpdateValue = (value: ModelValueType, id: string) => {
  modelValue.value = modelValue.value.map(item => (item.id === id ? { ...item, value } : item))
}

const handleUpdateMultipleFormValues = (id?: string) => {
  if (id === undefined) {
    modelValue.value = modelValue.value.concat([
      { value: ['', ''], id: createRandomString('multiple-input-range-form-') },
    ])
  } else {
    modelValue.value = modelValue.value.filter(d => d.id !== id)
  }
}

onBeforeMount(() => {
  // model.value の長さが minItems より小さい場合は minItems に合わせて初期化
  if (model.value.length < props.minItems) {
    model.value = model.value.concat(Array.from({ length: props.minItems - model.value.length }, () => ['', '']))
  }
})
</script>

<template>
  <NovaValidationInput :value="model" :rules="[lengthRules]">
    <template #default="{ invalid }">
      <v-sheet color="transparent" class="d-flex flex-wrap ga-6">
        <NovaMultipleItems v-if="showLabel && original !== undefined" :values="originalValues" disabled>
          <template #child="{ data }">
            <div class="multiple-input-range-form-input" :style="style">
              <div class="text-error text-sm">{{ t('nova.common.beforeUpdate') }}</div>
              <NovaCustomTextField v-bind="{ ...inputProps }" :model-value="data.value[0]" color="info" disabled>
                <template #explanation><slot name="explanation" /></template>
              </NovaCustomTextField>
              <div class="text-center mt-2">〜</div>
              <NovaCustomTextField v-bind="{ ...inputProps }" :model-value="data.value[1]" color="info" disabled />
            </div>
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
            <div class="multiple-input-range-form-input" :style="style">
              <div v-if="showLabel">
                <span class="text-error text-sm">{{ t('nova.common.afterUpdate') }}</span>
              </div>
              <NovaCustomTextField
                v-bind="{ ...inputProps }"
                :placeholder="placeholder?.[0]"
                :model-value="data.value[0]"
                :color="invalid ? 'error' : baseColor"
                :disabled="disabled"
                @update:model-value="(value: string) => handleUpdateValue([value, data.value[1]], data.id)"
              >
                <template #explanation><slot name="explanation" /></template>
              </NovaCustomTextField>
              <div class="text-center mt-2">〜</div>
              <NovaCustomTextField
                v-bind="{ ...inputProps }"
                :placeholder="placeholder?.[1]"
                :model-value="data.value[1]"
                :color="invalid ? 'error' : baseColor"
                :disabled="disabled"
                @update:model-value="(value: string) => handleUpdateValue([data.value[0], value], data.id)"
              />
            </div>
          </template>
        </NovaMultipleItems>
      </v-sheet>
    </template>
  </NovaValidationInput>
</template>

<style lang="scss" scoped>
.multiple-input-range-form-input {
  display: grid;
  gap: 8px;
}
</style>
