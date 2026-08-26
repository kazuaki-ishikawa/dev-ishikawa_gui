<script lang="ts" setup>
import { nanoid } from 'nanoid'
import type { InputFormPropType } from '@/components/input/types'

type PropType = Omit<InputFormPropType, 'placeholder' | 'size'> & {
  placeholder?: [string, string]
  maxItems?: number
  minItems?: number
}
const props = withDefaults(defineProps<PropType>(), {
  rules: () => [],
  required: false,
  placeholder: () => ['', ''],
  placeHolderEnd: undefined,
  maxItems: undefined,
  minItems: 0,
  maxlength: undefined,
  disabled: false,
})

const model = defineModel<Array<[string, string]>>('values', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const validList = ref<Array<[boolean, boolean]>>([])
const keys = ref<string[]>([])
const addDisabled = computed(() => !!props?.maxItems && props.maxItems <= model.value.length)

const changeValue = (value: string, index: number, start = false) => {
  if (start) {
    model.value = model.value.map((org, idx) => (idx === index ? [value, org[1]] : org))
  } else {
    model.value = model.value.map((org, idx) => (idx === index ? [org[0], value] : org))
  }
}
const changeValid = (valid: boolean, index: number, start = false) => {
  if (start) {
    validList.value = validList.value.map((org, idx) => (idx === index ? [valid, org[1]] : org))
  } else {
    validList.value = validList.value.map((org, idx) => (idx === index ? [org[0], valid] : org))
  }
}

const handlePlusClick = () => {
  validList.value = validList.value.concat([[!props.required, !props.required]])
  keys.value = [...keys.value, nanoid()]
  model.value = [...model.value, ['', '']]
}

const handleMinusClick = (index: number) => {
  if (model.value.length > 1) {
    model.value = model.value.filter((_, idx) => idx !== index)
    validList.value = validList.value.filter((_, idx) => idx !== index)
    keys.value = keys.value.filter((_, idx) => idx !== index)
  } else {
    validList.value = []
    model.value = []
    keys.value = []
  }
}

const valid = computed(() => {
  return props.minItems <= validList.value.length && !validList.value.some(valid => !valid[0] || !valid[1])
})
watch(valid, next => emits('valid', next), { immediate: true })

onBeforeMount(() => {
  // keys が model と同じ長さでない場合は初期化
  if (keys.value.length !== model.value.length) {
    validList.value = model.value.map(
      // props.minItems より小さい index の要素は必須項目になる
      (value, index) => {
        const valid1 = (props.minItems <= index || !!value[0]) && props.rules.every(rule => rule(value[0]) === true)
        const valid2 = (props.minItems <= index || !!value[1]) && props.rules.every(rule => rule(value[1]) === true)
        return [valid1, valid2]
      },
    )
    keys.value = model.value.map(_ => nanoid())
  }
})
</script>

<template>
  <div>
    <div v-for="(value, idx) in model" :key="keys[idx]" class="grid-cols pb-3">
      <div class="d-flex">
        <div class="flex-flex-start-flex-start w-100">
          <div class="mt-2 mr-2">start<span v-if="required" class="text-error">*</span></div>
          <InputForm
            :model-value="value[0]"
            :rules="rules"
            :required="required"
            :placeholder="disabled ? '' : placeholder[0]"
            :disabled="disabled"
            :maxlength="maxlength"
            size="xSmall"
            class="multiple-range-form-start-input"
            @update:model-value="(value: string) => changeValue(value, idx, true)"
            @valid="(valid: boolean) => changeValid(valid, idx, true)"
          />
        </div>
        <div class="flex-flex-start-flex-start w-100">
          <div class="ml-0-8px mt-2 mr-3">end<span v-if="required" class="text-error">*</span></div>
          <InputForm
            :model-value="value[1]"
            :rules="rules"
            :required="required"
            :placeholder="disabled ? '' : placeholder[1]"
            :disabled="disabled"
            :maxlength="maxlength"
            size="xSmall"
            class="multiple-range-form-end-input"
            @update:model-value="(value: string) => changeValue(value, idx)"
            @valid="(valid: boolean) => changeValid(valid, idx)"
          />
        </div>
      </div>
      <div class="flex-center-center">
        <CircleButton
          v-if="minItems <= idx && !disabled"
          icon="trush"
          color="info"
          class="multiple-range-form-trush-button"
          @click="() => handleMinusClick(idx)"
        />
      </div>
    </div>
    <div v-if="!disabled" class="multiple-range-form-plus-button w-55px flex-center-center ml-auto pt-2">
      <CircleButton icon="plus" :disabled="addDisabled" @click="handlePlusClick" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid-cols {
  display: grid;
  grid-template-columns: 1fr 55px;
}
.ml-0-8px {
  margin-left: 0.8px;
}
.w-55px {
  width: 55px;
}
</style>
