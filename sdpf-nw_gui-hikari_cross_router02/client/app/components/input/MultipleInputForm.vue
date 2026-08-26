<script lang="ts" setup>
import { nanoid } from 'nanoid'
import { Size } from '@/components/input/constants'
import type { InputFormPropType } from '@/components/input/types'

type PropType = InputFormPropType & {
  maxItems?: number
  minItems?: number
}
const props = withDefaults(defineProps<PropType>(), {
  rules: () => [],
  required: false,
  placeholder: '',
  maxItems: undefined,
  minItems: 0,
  maxlength: undefined,
  disabled: false,
  size: 'middle',
})
const model = defineModel<string[]>('values', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const validList = ref<boolean[]>([])
const keys = ref<string[]>([])

const inputWidth = computed(() => Size[props.size])
const addDisabled = computed(() => !!props?.maxItems && props.maxItems <= model.value.length)

const changeValue = (value: string, index: number) => {
  model.value = model.value.map((org, idx) => (index === idx ? value : org))
}
const changeValid = (valid: boolean, index: number) => {
  validList.value = validList.value.map((org, idx) => (index === idx ? valid : org))
}

const handlePlusClick = () => {
  validList.value = [...validList.value, props.minItems < validList.value.length + 1]
  keys.value = [...keys.value, nanoid()]
  model.value = [...model.value, '']
}
const handleMinusClick = (index: number) => {
  validList.value = validList.value.filter((_, idx) => index !== idx)
  keys.value = keys.value.filter((_, idx) => index !== idx)
  model.value = model.value.filter((_, idx) => index !== idx)
}
const valid = computed(() => props.minItems <= validList.value.length && validList.value.every(valid => valid))
watch(valid, () => emits('valid', valid.value), { immediate: true })

watch(
  model,
  () => {
    // keys が model と同じ長さでない場合は初期化
    if (keys.value.length !== model.value.length) {
      validList.value = model.value.map(
        // props.minItems より小さい index の要素は必須項目になる
        (value, index) => (props.minItems <= index || !!value) && props.rules.every(rule => rule(value) === true),
      )
      keys.value = model.value.map(_ => nanoid())
    }
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <div v-for="(value, idx) in model" :key="keys[idx]" class="d-flex pb-2">
      <InputForm
        :model-value="value"
        :rules="rules"
        :required="idx < minItems"
        :placeholder="disabled ? '' : placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        :size="size"
        @update:model-value="(value: string) => changeValue(value, idx)"
        @valid="(valid: boolean) => changeValid(valid, idx)"
      />
      <CircleButton
        v-if="minItems <= idx && !disabled"
        icon="trush"
        color="info"
        class="multiple-input-form-trush-button ml-2 mt-1"
        @click="() => handleMinusClick(idx)"
      />
    </div>
    <div v-if="!disabled" class="multiple-add">
      <CircleButton class="ml-83-2px" icon="plus" :disabled="addDisabled" @click="handlePlusClick" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.multiple-add {
  padding-left: v-bind(inputWidth);
}
.ml-83-2px {
  margin-left: 83.2px;
}
</style>
