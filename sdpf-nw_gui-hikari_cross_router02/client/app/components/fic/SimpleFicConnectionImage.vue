<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type Emits = {
  (e: 'click'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const steps = [
  [
    { text: t('common.docomoBusinessRinkSecuredWan'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step1-2'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step1-3'), class: 'text-sm' },
  ],
  [
    { text: t('fic.step.simpleFicConnection.step2-1'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step2-2'), class: 'text-size-xs' },
    { text: t('fic.step.simpleFicConnection.step2-3'), class: 'text-size-xs' },
    { text: t('fic.step.simpleFicConnection.step2-4'), class: 'text-size-xs' },
  ],
  [
    { text: t('fic.step.simpleFicConnection.step3-1'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step3-2'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step3-3'), class: 'text-sm' },
  ],
  [
    { text: t('fic.step.simpleFicConnection.step4-1'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step4-2'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step4-3'), class: 'text-sm' },
  ],
  [
    { text: t('fic.step.simpleFicConnection.step5-1'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step5-2'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step5-3'), class: 'text-sm' },
    { text: t('fic.step.simpleFicConnection.step5-4'), class: 'text-sm' },
  ],
]
</script>

<template>
  <div>
    <StepBox :step="1" only clickable @click="emits('click')">
      <i18n-t keypath="fic.step.simpleFicConnection.title" tag="span" scope="global" class="my-2">
        <template #simpleConnection>
          <span class="text-lg font-weight-bold">{{ t('fic.simpleConnection') }}</span>
        </template>
      </i18n-t>
      <div class="step-container ga-4">
        <div v-for="(step, index) in steps" :key="index" class="grid-inner border-sm border-solid">
          <div v-for="line in step" :key="line.text" :class="line.class" class="text-center">{{ line.text }}</div>
        </div>
      </div>
    </StepBox>
    <div class="radius border-sm border-solid mt-6 pa-4 border-solid">
      <div>{{ t('fic.step.ficConnectionImage') }}</div>
      <div class="text-sm">{{ t('fic.step.simpleFicConnection.image') }}</div>
      <div class="mt-4 text-sm">{{ t('fic.step.simpleFicConnection.example') }}</div>
      <img class="my-4 w-100" src="~/assets/images/simple-fic-connection.png" />
    </div>
  </div>
</template>

<style scoped lang="scss">
$arrow-color: rgb(var(--v-theme-light-info));

.text-size-xs {
  font-size: 0.625rem;
}
.step-container {
  width: 98%;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.radius {
  border-radius: v.$child-border-radius;
}
.grid-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 0.5rem;
  border-style: dashed;
  border-radius: 0.5rem;
  &:not(:first-child) {
    position: relative;
    &::before {
      position: absolute;
      top: 50%;
      left: -0.5rem;
      display: block;
      height: 1.5rem;
      width: 1.5rem;
      content: '';
      background-color: $arrow-color;
      transform: translate(-50%, -50%);
      mask-repeat: no-repeat;
      mask-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M470.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 256 265.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160zm-352 160l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L210.7 256 73.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z"/></svg>');
    }
  }
}
</style>
