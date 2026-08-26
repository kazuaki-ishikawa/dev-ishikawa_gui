<script setup lang="ts" generic="T">
import { useI18n } from 'vue-i18n'
import type { CustomRadioGroupOptionType } from '@/components/nova/form/types'

type PropType = CustomRadioGroupOptionType<T> & {
  singleColumn?: boolean
}

const model = defineModel<T>({ required: true })
const props = withDefaults(defineProps<PropType>(), {
  singleColumn: false,
})

const { t } = useI18n()

const columnCount = computed(() => {
  const value = Math.trunc(props.columns ?? 2)
  return Math.min(Math.max(value, 1), 3)
})

const selectedBorderColor = computed(() =>
  props.color ? `rgb(var(--v-theme-${props.color}))` : 'rgb(var(--v-theme-info-darken-2))',
)

const requiredRule = (value: T) =>
  !!props.disabled || props.options.some(option => !option.disabled && option.value === value) || t('invalid.required')

const isOptionSelectable = (optionDisabled?: boolean) => !optionDisabled && !props.disabled

const selectOption = (value: T, optionDisabled?: boolean) => {
  if (!isOptionSelectable(optionDisabled)) {
    return
  }
  model.value = value
}
</script>

<template>
  <NovaValidationInput :value="model" :rules="[requiredRule]" :hide-details="disabled ? true : 'auto'">
    <template #default="{ invalid }">
      <v-radio-group
        v-model="model"
        hide-details
        class="radio-card-form"
        :error="invalid"
        :color="invalid ? 'error' : color"
        :readonly="disabled"
      >
        <template v-if="$slots.prepend" #prepend>
          <slot name="prepend" />
        </template>
        <div
          :class="['radio-card-grid', 'ga-2', { 'radio-card-grid--single': singleColumn }]"
          :style="singleColumn ? undefined : { '--radio-card-columns': `${columnCount}` }"
        >
          <v-card
            v-for="(option, index) in options"
            :key="`${option.value}`"
            class="radio-card"
            variant="outlined"
            rounded="md"
            :ripple="isOptionSelectable(option.disabled)"
            :class="{
              'radio-card--selected': model === option.value,
              'radio-card--disabled': !!option.disabled || !!disabled,
              'radio-card--error': invalid,
            }"
            @click="selectOption(option.value, option.disabled)"
          >
            <div :class="['radio-card-inner', 'd-flex', 'align-center', 'ga-6', 'px-4']">
              <v-radio
                :model-value="model"
                :value="option.value"
                :disabled="disabled && !!model ? false : option.disabled"
                :class="{ disabled: !!disabled }"
                hide-details
              />
              <div class="radio-card-content">
                <div class="text-lg font-weight-bold">
                  <slot name="title" :option="option" :index="index" :selected="model === option.value">
                    {{ option.text }}
                  </slot>
                </div>
                <div v-if="$slots.note || option.help" class="mt-1 text-sm text-info">
                  <slot name="note" :option="option" :index="index" :selected="model === option.value">
                    {{ option.help }}
                  </slot>
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </v-radio-group>
    </template>

    <template v-if="$slots.explanation" #explanation>
      <slot name="explanation" />
    </template>
  </NovaValidationInput>
</template>

<style lang="scss" scoped>
$info-color: rgb(var(--v-theme-info));
$placeholder-color: rgb(var(--v-theme-info-lighten-2));
$selected-border-color: v-bind(selectedBorderColor);

.radio-card-form {
  width: 100%;

  &.v-input--readonly {
    .radio-card--disabled {
      opacity: 1;

      .radio-card-content {
        opacity: 0.6;
      }

      :deep(.v-radio) {
        opacity: 0.6 !important;
      }
    }
  }
}

.radio-card-grid {
  display: grid;
  grid-template-columns: repeat(var(--radio-card-columns, 2), minmax(0, 1fr));

  @media (max-width: 960px) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

.radio-card-grid--single {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.radio-card {
  border-color: rgb(var(--v-theme-info-lighten-2));
  cursor: pointer;
  height: 100%;

  &:focus-visible {
    outline: none;
  }

  &:hover:not(.radio-card--disabled) {
    border-color: rgb(var(--v-theme-info-darken-2));
  }

  &--selected {
    border-color: $selected-border-color;
  }

  &--error {
    border-color: rgb(var(--v-theme-error));
  }

  &--disabled {
    border-color: $placeholder-color;
    cursor: not-allowed;
    opacity: 0.85;
    pointer-events: auto;

    .radio-card-content,
    :deep(.v-label) {
      color: $info-color;
    }
  }
}

.radio-card-inner {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  min-height: 56px;
}

.radio-card-content {
  min-width: 0;
  padding: 12px 0;
}

:deep(.radio-card .v-radio) {
  flex: 0 0 auto;
  margin-inline-end: 0;

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

:deep(.radio-card .v-selection-control) {
  min-height: auto;
}

:deep(.radio-card .v-selection-control__wrapper) {
  width: 22px;
  height: 22px;
}
</style>
