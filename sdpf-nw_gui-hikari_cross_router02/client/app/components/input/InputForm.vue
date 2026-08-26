<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Size } from '@/components/input/constants'
import type { InputFormPropType } from '@/components/input/types'
import { IconTypes } from '@/components/icons/constants'

const props = withDefaults(defineProps<InputFormPropType>(), {
  rules: () => [],
  size: 'middle',
  required: false,
  disabled: false,
  placeholder: '',
  maxlength: undefined,
  minlength: undefined,
  password: false,
})
const model = defineModel<string>({ required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const showPassword = ref(!props.password)
const width = computed(() => Size[props.size])

const errorMessage = computed(() => {
  if (props.disabled) {
    return ''
  }
  const required = props.required && !model.value ? t('invalid.required') : ''
  const minlength =
    props.minlength && model.value.length < Number(props.minlength)
      ? t('invalid.minlength', { minlength: props.minlength })
      : ''
  const message = props.rules.reduce((msg, rule) => {
    if (!msg) {
      const newMessage = rule(model.value)
      return newMessage !== true ? newMessage : ''
    }
    return msg
  }, '')
  return required || message || minlength
})
watch(errorMessage, next => emits('valid', !next), { immediate: true })
</script>

<template>
  <div class="flex-flex-start-flex-start">
    <div :style="{ width }">
      <div class="position-relative flex-flex-start-center">
        <v-text-field
          v-model="model"
          class="input-vuetify"
          variant="outlined"
          density="compact"
          :base-color="errorMessage ? 'warning' : 'info'"
          :color="errorMessage ? 'warning' : 'primary'"
          :bg-color="errorMessage ? 'light-warning' : 'white'"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="disabled ? '' : placeholder"
          :disabled="disabled"
          :maxlength="maxlength"
          hide-details
        />
        <div v-if="!!model && !disabled" class="button" @click="model = ''">
          <SvgIcon :type="IconTypes.CircleClose" :color="errorMessage ? 'warning' : 'info'" />
        </div>
      </div>
      <div class="text-warning text-sm pl-2 w-max">{{ errorMessage }}</div>
    </div>
    <div v-if="!!password" class="mt-10px ml-3 cursor-pointer">
      <SvgIcon
        :type="showPassword ? IconTypes.EyeOff : IconTypes.Eye"
        :color="errorMessage ? 'warning' : 'info'"
        @click="showPassword = !showPassword"
      />
    </div>
    <div v-if="!!props.maxlength" class="w-64px ml-3 mt-2">
      {{ `${model.length}/${props.maxlength}` }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
$light-info-color: rgb(var(--v-theme-light-info));

.input-vuetify {
  width: 100%;
  box-sizing: border-box;

  // ─── .v-field__input : 実際の <input>（余白・placeholder 色） ───
  // 余白と placeholder 色は props で指定できないため CSS で指定する
  :deep(.v-field__input) {
    height: 100%;
    padding: 0.5rem 2.5rem 0.5rem 0.7rem;
    font-size: v.$input-font-size;

    &::placeholder {
      color: $light-info-color;
      // Vuetify はデフォルトで placeholder に opacity 0.38 をかけるため、
      // 他フォーム（native input）と濃さを揃えるよう opacity を打ち消す
      opacity: 1;
    }
  }

  // ─── .v-field__outline : 枠線の太さ・濃さ ───
  // 色は base-color / color の props で指定。ここでは props で指定できない
  // 「常に 1px」「hover で濃さを変えない（opacity 固定）」だけを担う
  :deep(.v-field__outline) {
    --v-field-border-width: 1px;
    --v-field-border-opacity: 1;
  }

  // ─── 状態: 無効時の枠線色 ───
  // Vuetify は disabled だと base-color を無視する（枠線が黒系になる）ため、
  // 他フォームと同じ薄い info 色を CSS で明示する
  :deep(.v-field--disabled .v-field__outline) {
    color: $light-info-color;
  }
}

.button {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  height: 18px;
  width: 18px;
  border: none;
  border-radius: 50%;
  background-color: #fff;
  cursor: pointer;
  svg {
    position: absolute;
    top: 0;
    left: 0;
  }
  &:hover {
    opacity: 0.8;
  }
}
.w-max {
  width: max-content;
}
.mt-10px {
  margin-top: 10px;
}
.w-64px {
  width: 64px;
}
</style>
