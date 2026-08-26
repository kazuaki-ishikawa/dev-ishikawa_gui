<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'
import type { CustomButtonIconType } from '@/components/button/types'
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  open: boolean
  submitLabel?: string
  submitColor?: 'primary' | 'info' | 'warning'
  submitWidth?: number
  submitIcon?: CustomButtonIconType
  cancelLabel?: string
  cancelWidth?: number
  cancelIcon?: CustomButtonIconType
  disabled?: boolean
  overflowY?: 'auto' | 'visible'
  title?: string
  titleColor?: (typeof ColorKeyList)[number]
  width?: number
}
const props = withDefaults(defineProps<PropType>(), {
  submitLabel: '',
  submitColor: 'primary',
  submitWidth: 150,
  submitIcon: 'right-arrow',
  cancelLabel: '',
  cancelWidth: 150,
  cancelIcon: 'right-arrow',
  disabled: false,
  overflowY: 'auto',
  title: '',
  titleColor: 'secondary',
  width: 900,
})

type Emits = {
  (e: 'submit'): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const dialogWidth = computed(() => `${props.width}px`)
</script>

<template>
  <v-overlay :model-value="open" :close-on-back="false" attach persistent class="dialog-main">
    <div v-if="open" class="dialog-card-main" :style="{ width: dialogWidth }">
      <div class="dialog-card">
        <div
          class="dialog-title position-absolute w-100 flex-center-center"
          :class="`text-${titleColor}`"
          data-cy="dialog-base-title"
        >
          {{ title }}
        </div>
        <div class="dialog-card-content" :style="{ overflowY: overflowY }">
          <slot />
        </div>
        <div v-if="!$slots.footer" class="dialog-card-buttons flex-center-center">
          <CustomButton
            v-if="props.cancelLabel"
            :text="props.cancelLabel"
            :icon="props.cancelIcon"
            :width="cancelWidth"
            color="info"
            class="dialog-base-cancel-button"
            @click="emits('close')"
          />
          <CustomButton
            v-if="props.submitLabel"
            :text="props.submitLabel"
            :disabled="props.disabled"
            :color="props.submitColor"
            :icon="props.submitIcon"
            :width="submitWidth"
            class="dialog-base-submit-button"
            :class="{ 'ml-5': !!props.cancelLabel }"
            @click="emits('submit')"
          />
        </div>
        <slot name="footer" />
        <div class="dialog-card-close flex-center-center flex-column px-1 bg-info" @click="emits('close')">
          <SvgIcon :type="IconTypes.Close" />
          <div class="pt-1">{{ t('common.close') }}</div>
        </div>
        <span class="dialog-card-corner bg-info" />
      </div>
    </div>
  </v-overlay>
</template>

<style lang="scss" scoped>
.dialog-main {
  align-items: center;
  justify-content: center;
  margin: auto;
}
.dialog-title {
  height: 80px;
  font-size: 1.5rem;
}
.dialog-card {
  position: relative;
  display: grid;
  grid-template-rows: 1fr 70px;
  min-height: 250px;
  max-height: 90vh;
  border-radius: 20px;
  background-color: #fff;
  .dialog-card-content {
    max-height: 800px;
    padding: 0 1rem;
    margin-top: 80px;
  }
  .dialog-card-buttons {
    height: fit-content;
    padding: 0 1rem 1rem 1rem;
    align-self: flex-end;
  }
  .dialog-card-close {
    position: absolute;
    top: 0;
    right: 0;
    color: #fff;
    font-size: 0.725rem;
    width: 80px;
    height: 80px;
    border-top-right-radius: 20px;
    border-bottom-left-radius: 20px;
    cursor: pointer;
  }
  .dialog-card-corner {
    display: block;
    width: 20px;
    height: 20px;
    position: absolute;
    top: 0;
    right: 88px;
    transform: rotate(90deg);
    &::before {
      display: block;
      width: 200%;
      height: 200%;
      position: absolute;
      top: 0px;
      left: 0px;
      overflow: hidden;
      content: '';
      background: #fff;
      border-radius: 50%;
    }
  }
}
</style>
