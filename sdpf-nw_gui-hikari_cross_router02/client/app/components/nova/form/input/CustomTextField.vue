<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { CustomTextFieldPropType } from '@/components/nova/form/types'
import { NovaIconTypes } from '@/components/icons/constants'

const props = withDefaults(defineProps<CustomTextFieldPropType>(), {
  rules: () => [],
  width: '380px',
  required: false,
  disabled: false,
  password: false,
})
const model = defineModel<string>({ required: true })

const { t } = useI18n()

const showPassword = ref(!props.password)

const validationRules = computed(() => {
  if (props.disabled) {
    return []
  }
  return [...(props.required ? [(value: string) => !!value || t('invalid.required')] : []), ...props.rules]
})

const handleClear = () => {
  model.value = ''
}
</script>

<template>
  <NovaValidationInput :value="model" :rules="validationRules" hide-details="auto" :width="width">
    <template #default="{ invalid }">
      <v-text-field
        v-model="model"
        variant="outlined"
        density="compact"
        :error="invalid"
        :color="invalid ? 'error' : color ? color : props.disabled ? 'info' : undefined"
        :bg-color="invalid ? 'light-error' : color ? `light-${color}` : props.disabled ? 'light-info' : 'white'"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="disabled ? '' : placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        clearable
        hide-details
        class="custom-text-field"
        @click:clear="handleClear"
      >
        <template v-if="prependIcon" #prepend-inner>
          <v-icon :icon="`nova:${prependIcon}`" color="black" size="20" />
        </template>

        <template v-if="maxLength" #append>
          <span class="text-sm text-info">{{ model.length }} / {{ maxLength }}</span>
        </template>

        <template v-if="password || $slots['append-inner']" #append-inner>
          <slot name="append-inner" />
          <v-icon
            v-if="password"
            role="button"
            tabindex="0"
            :icon="`nova:${showPassword ? NovaIconTypes.EyeOff : NovaIconTypes.Eye}`"
            :color="invalid ? 'error' : 'info'"
            @click="showPassword = !showPassword"
          />
        </template>
      </v-text-field>
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

.custom-text-field {
  --v-disabled-opacity: 0.9 !important;
  box-sizing: border-box;

  /* 無効時のカーソル */
  :deep(.v-input__control) {
    pointer-events: auto !important;
    cursor: not-allowed !important;
  }

  /*
  * ─── .v-field__input : 実際の <input>（余白・placeholder 色） ───
  * 余白と placeholder 色は props で指定できないため CSS で指定する
  */
  :deep(.v-field__input) {
    padding: 0.25rem 0.7rem;
    font-size: v.$input-font-size;

    &::placeholder {
      color: $placeholder-color;
      /*
      * Vuetify はデフォルトで placeholder に opacity 0.38 をかけるため、
      * 他フォーム（native input）と濃さを揃えるよう opacity を打ち消す
      */
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
