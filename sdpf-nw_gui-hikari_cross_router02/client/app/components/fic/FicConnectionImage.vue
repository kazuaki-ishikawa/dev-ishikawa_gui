<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FIC_URL } from '@/api/ficConnections/constants'

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
    { text: 'Flexible InterConnect', class: 'text-sm' },
    { text: t('fic.step.ficConnection.step2-2'), class: 'text-sm' },
    { text: t('fic.step.ficConnection.step2-3'), class: 'text-size-xs' },
    { text: t('fic.step.ficConnection.step2-4'), class: 'text-size-xs' },
  ],
]
</script>

<template>
  <div>
    <div class="grid-cols-3 ga-4 py-3">
      <StepBox :step="1" clickable @click="emits('click')">
        <div v-for="line in steps[0]" :key="line.text" :class="line.class">{{ line.text }}</div>
      </StepBox>
      <StepBox :step="2" class="arrow">
        <div v-for="line in steps[1]" :key="line.text" :class="line.class">{{ line.text }}</div>
        <i18n-t keypath="fic.step.ficConnection.step2-5" tag="span" scope="global" class="text-size-xs">
          <template #link>
            <NuxtLink :to="FIC_URL.FIC_CONSOLE" target="_blank">
              {{ t('fic.console') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </StepBox>
      <div
        class="step-3-content radius arrow bg-grey-lighten-4 text-sm flex-center-center flex-column border-sm border-solid my-auto"
      >
        <div>{{ t('fic.step.ficConnection.step3-1') }}</div>
        <div>{{ t('fic.step.ficConnection.step3-2') }}</div>
        <div class="text-xs">{{ t('fic.step.ficConnection.step3-3') }}</div>
      </div>
    </div>
    <div class="radius mt-6 pa-4 border-sm border-solid">
      <div>{{ t('fic.step.ficConnectionImage') }}</div>
      <img class="my-4 w-100" src="~/assets/images/fic-connection.svg" />
    </div>
  </div>
</template>

<style scoped lang="scss">
$arrow-color: rgb(var(--v-theme-light-info));

.grid-cols-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.text-size-xs {
  font-size: 0.625rem;
}
.step-3-content {
  height: 112px;
}
.radius {
  border-radius: v.$child-border-radius;
}
.arrow {
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
</style>
