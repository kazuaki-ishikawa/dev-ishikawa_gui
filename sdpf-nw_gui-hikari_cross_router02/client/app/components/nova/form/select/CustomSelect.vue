<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CustomSelectPropType } from '@/components/nova/form/types'

type SelectItem = { title: string; value: string }

const props = withDefaults(defineProps<CustomSelectPropType>(), { width: '380px' })
const model = defineModel<string | string[]>({ required: true })

const { t } = useI18n()
// TODO: #17645 とりあえずbuttonの対応はルーターの画面実装時に考えるslotsでどうにかなるはず
const items = computed(() => props.options.map(option => ({ title: option.text, value: option.value })))
const itemsValueList = computed(() => props.options.map(option => option.value))

const requiredRule = (value: string | string[]) =>
  !!props.disabled || !props.required || !!value.length || t('invalid.required')

const selectedValueRule = (value: string) =>
  !!props.allowCustomValue ||
  !value?.length ||
  !itemsValueList.value.length ||
  itemsValueList.value.includes(value) ||
  t('nova.invalid.unSelectedItemValue')

const validationRules = (v: string | string[]) => {
  if (props.disabled) {
    return true
  }

  const msg = [selectedValueRule, ...(props.rules ?? [])].reduce((msg, rule) => {
    if (!msg && typeof v === 'string') {
      const newMessage = rule(v)
      return newMessage !== true ? newMessage : ''
    }
    if (!msg && typeof v !== 'string') {
      const newMessage = v.map((v: string) => rule(v)).filter(m => m !== true)[0]
      return newMessage === undefined ? '' : newMessage
    }
    return msg
  }, '')

  return msg || true
}

const getFilteredItems = (value: string | SelectItem | Array<string | SelectItem>) => {
  if (Array.isArray(value)) {
    const values = value.map(item => (typeof item === 'string' ? item : item.value))
    // allowCustomValue = true の場合は候補外の値もそのまま返す
    return props.allowCustomValue ? values : values.filter(item => itemsValueList.value.includes(item))
  } else {
    return typeof value === 'string' ? value : value.value
  }
}

const getModelValueItem = (value: string) => {
  const item = items.value.find(item => item.value === value)
  return item ?? (props.allowCustomValue ? value : undefined)
}

const modelValue = computed({
  get: () => {
    // nullの場合しか空と判定されないため制御
    if (!model.value?.length) {
      return null
    }

    // 単一選択の場合は候補内の値を表示用のitemへ復元する
    if (typeof model.value === 'string') {
      return getModelValueItem(model.value) ?? model.value
    }

    // 複数選択の場合は候補内の値を表示用のitemへ復元する
    return model.value.flatMap(value => {
      const item = getModelValueItem(value)
      return item === undefined ? [value] : [item]
    })
  },
  // clear を押すと null が返ってくるため制御
  set: (value: string | SelectItem | Array<string | SelectItem> | null) => {
    // allowCustomValue=false の場合は自由入力値を空として扱う
    const selected = !props.allowCustomValue && typeof value === 'string' ? null : value
    model.value = selected === null ? (!props.multiple ? '' : []) : getFilteredItems(selected)
  },
})
</script>

<template>
  <NovaValidationInput
    :value="model"
    :rules="[requiredRule, validationRules]"
    hide-details="auto"
    :width="width"
    style="flex: none"
  >
    <template #default="{ invalid }">
      <v-combobox
        v-model="modelValue"
        :items="items"
        :multiple="multiple"
        :placeholder="disabled ? '' : placeholder"
        :error="invalid"
        :bg-color="invalid ? 'light-error' : color ? `light-${color}` : disabled ? 'light-info' : 'white'"
        :disabled="disabled"
        :list-props="{ slim: true, density: 'compact', class: 'custom-select-list', style: 'overflow-x: hidden' }"
        variant="outlined"
        :clearable="!required"
        hide-details
        auto-select-first="exact"
        density="compact"
        class="custom-select"
      />
    </template>

    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

    <template v-if="$slots.explanation" #explanation>
      <slot name="explanation" />
    </template>
  </NovaValidationInput>
</template>

<style lang="scss" scoped>
$placeholder-color: rgb(var(--v-theme-info-lighten-2));

:global(.custom-select-list .v-list-item-title) {
  font-size: v.$input-font-size;
}
:global(.custom-select-list .v-list-item) {
  padding-block: 0;
}
.custom-select {
  --v-border-opacity: 0.8 !important;
  box-sizing: border-box;

  :deep(.v-input__control) {
    pointer-events: auto !important;
    cursor: not-allowed !important;
  }

  :deep(.v-field__input) {
    font-size: v.$input-font-size;
    input::placeholder {
      color: $placeholder-color;
      opacity: 1;
    }
  }

  /* ─── 状態: 無効時の透明度・枠線色 ─── */
  :deep(.v-field--disabled) {
    --v-disabled-opacity: 0.7 !important;
    .v-field__outline {
      color: $placeholder-color;
    }
  }
}
</style>
