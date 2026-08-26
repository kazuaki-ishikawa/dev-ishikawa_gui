<script setup lang="ts">
import type { SelectFormPropType } from '@/components/input/types'
import { UNSELECTED_VALUE } from '@/components/input/constants'

const props = defineProps<SelectFormPropType>()
const model = defineModel<string[]>({ required: true })
type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const remove = (value: string) => {
  model.value = model.value.filter(v => v !== value)
}

const selectedList = computed(() =>
  model.value
    .map(value => {
      const found = props.options.find(opt => opt.value === value)
      return found ?? { text: value, value }
    })
    .filter(value => value.value !== UNSELECTED_VALUE),
)
</script>

<template>
  <div>
    <SelectForm
      v-model="model"
      v-bind="props"
      :size="props.size ?? 'middle'"
      @valid="(valid: boolean) => emits('valid', valid)"
    />
    <div v-if="model.length > 0" class="d-flex flex-wrap text-sm mt-1">
      <LabelAndCloseButton
        v-for="selected in selectedList"
        :key="selected.value"
        :text="selected.text"
        :value="selected.value"
        :show-button="!props.disabled"
        overflow
        :data-cy="`multiple-select-form-${selected.value}`"
        @click="remove"
      />
    </div>
  </div>
</template>
