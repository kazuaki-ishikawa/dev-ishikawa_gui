<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { CustomTextFieldPropType } from '@/components/nova/form/types'

type PropType = CustomTextFieldPropType & {
  rows?: number
}
const props = withDefaults(defineProps<PropType>(), {
  width: '380px',
  rows: 5,
  rules: () => [],
})

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const counterValue = computed(() => model.value.length)

const validationRules = computed(() => {
  if (props.disabled) {
    return []
  }
  return [...(props.required ? [(value: string) => !!value || t('invalid.required')] : []), ...props.rules]
})
</script>

<template>
  <NovaValidationInput :value="model" :rules="validationRules" hide-details="auto" :width="width">
    <template #default="{ invalid }">
      <v-textarea
        v-model="model"
        :error="invalid"
        :rows="rows"
        :placeholder="disabled ? '' : placeholder"
        :disabled="disabled"
        :bg-color="invalid ? 'light-error' : color ? `light-${color}` : disabled ? 'light-info' : 'white'"
        variant="outlined"
        no-resize
        :hide-details="!maxLength"
        class="custom-textarea position-relative"
      >
        <template v-if="$slots.append" #append>
          <slot name="append" />
        </template>
        <template v-if="maxLength" #details>
          <div
            class="w-100 text-right pb-1 text-info"
            :class="`bg-${invalid ? 'light-error' : color ? `light-${color}` : disabled ? 'light-info' : 'white'}`"
          >
            {{ counterValue }} / {{ maxLength }}
          </div>
        </template>
      </v-textarea>
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

.custom-textarea {
  :deep(.v-input__details) {
    position: absolute;
    bottom: 2px;
    right: 24px;
    min-height: 0px;
    width: calc(100% - 35px);
    .v-messages {
      min-height: 0px;
    }
  }
  :deep(.v-input__control) {
    pointer-events: auto !important;
    cursor: not-allowed !important;
  }

  :deep(.v-field__field) {
    textarea {
      height: 100%;
      padding-bottom: 30px;
      box-sizing: border-box;
      resize: both;
    }
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
