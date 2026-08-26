<script lang="ts" setup generic="T">
import { useI18n } from 'vue-i18n'
import type { CustomRadioGroupOptionType } from '@/components/nova/form/types'

const model = defineModel<T>({ required: true })
const props = withDefaults(defineProps<CustomRadioGroupOptionType<T>>(), {
  inline: false, // デフォルトで縦並び
})

const { t } = useI18n()
const required = (v: T) =>
  !!props.disabled || props.options.some(option => !option.disabled && option.value === v) || t('invalid.required')
</script>

<template>
  <NovaValidationInput :value="model" :rules="[required]" :hide-details="disabled ? true : 'auto'">
    <template #default="{ invalid }">
      <v-radio-group
        v-model="model"
        hide-details
        :inline="inline"
        density="compact"
        class="radio-form"
        :error="invalid"
        :color="invalid ? 'error' : color"
        :readonly="disabled"
      >
        <div v-for="option in options" :key="`${option.value}`">
          <div class="d-inline-flex align-center ga-2">
            <!-- invalid/color 値を反映させるために readonly を使っているため、変則的な disabled 設定にする -->
            <!-- readonly=disabled によってクリックは不可になっているので false でも問題はない -->
            <v-radio
              :value="option.value"
              :label="option.text"
              :disabled="disabled && !!model ? false : option.disabled"
              :class="{ disabled: disabled }"
            />
            <v-icon
              v-if="option.icon"
              :icon="`nova:${option.icon}`"
              size="20"
              :class="{ 'v-selection-control--disabled': !!option.disabled || disabled }"
            />
            <NovaHelpTooltip v-if="option.help" size="18">
              {{ option.help }}
            </NovaHelpTooltip>
          </div>
        </div>
      </v-radio-group>
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
$info-color: rgb(var(--v-theme-info));

.radio-form {
  :deep(.v-selection-control-group) {
    column-gap: 16px;
  }

  &.v-input--readonly {
    :deep(.v-radio) {
      opacity: 0.6 !important;
      &.v-selection-control--disabled {
        .v-icon,
        .v-label {
          color: $info-color;
        }
      }
    }
  }

  :deep(.v-radio) {
    &.disabled,
    &.v-selection-control--disabled {
      .v-selection-control__input input,
      .v-icon,
      .v-label {
        pointer-events: auto;
        cursor: not-allowed;
      }
    }
  }
}
</style>
