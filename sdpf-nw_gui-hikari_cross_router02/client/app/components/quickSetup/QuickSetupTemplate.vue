<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Breadcrumbs } from './constants'
import CheckSuccessIcon from '~icons/ztgict/check-success'

type PropsType = {
  nextLabel: string
  nextDisabled?: boolean
  prevLabel?: string
  currentStep?: {
    step: (typeof Breadcrumbs)[number]
    countLabel?: string
  }
}

const props = defineProps<PropsType>()

type Emits = {
  (e: 'prev'): void
  (e: 'next'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const countLabel = computed(() => (props.currentStep?.countLabel ? `(${props.currentStep?.countLabel})` : ''))
const currentIndex = computed(() => {
  const foundIndex = Breadcrumbs.findIndex(step => step === props.currentStep?.step)
  return foundIndex + 1
})
const currentBredcrumbs = computed(() => (currentIndex.value > 0 ? Breadcrumbs.slice(0, currentIndex.value) : []))
</script>

<template>
  <div>
    <div
      v-if="currentBredcrumbs.length > 0"
      class="breadcrumbs flex-space-evenly-center rounded-xl py-1 font-weight-medium"
    >
      <div v-for="(step, index) in currentBredcrumbs" :key="step" class="flex-center-center text-size-sm text-white">
        <CheckSuccessIcon v-if="step !== currentStep?.step" width="23px" height="23px" />
        <span v-if="step === currentStep?.step" class="step-number-base bg-white text-primary">
          {{ index + 1 }}
        </span>
        <span class="mx-2" :class="{ 'opacity-80': step !== currentStep?.step }">
          {{ t(`quickSetup.${step}`) }}
        </span>
        <span v-if="step === 'terminals'" class="w-55px">{{ countLabel }}</span>
      </div>
    </div>
    <div class="py-6px flex-space-evenly-center bg-white rounded-xl mb-3 text-grey">
      <div v-for="(step, index) in Breadcrumbs" :key="`info-${step}`" class="w-20 flex-center-center">
        <span class="bg-grey step-number-base text-white">{{ index + 1 }}</span>
        <span class="ml-2 text-size-sm">{{ t(`quickSetup.${step}`) }}</span>
      </div>
    </div>

    <CardContainer>
      <div class="border-b-md pb-3 mb-5 flex-flex-start-center">
        <slot name="message" />
        <HelpTooltip v-if="$slots.help" class="px-2 pt-1" size="smallMiddle">
          <slot name="help" />
        </HelpTooltip>
      </div>
      <slot />
      <div class="flex-flex-end-center pt-8">
        <CustomButton
          v-if="!!prevLabel"
          icon="left-arrow"
          color="info"
          :text="prevLabel"
          :width="180"
          data-cy="quick-step-template-prev-button"
          @click="emits('prev')"
        />
        <CustomButton
          class="ml-6"
          icon="right-arrow"
          :width="180"
          :text="nextLabel"
          :disabled="nextDisabled"
          data-cy="quick-step-template-next-button"
          @click="emits('next')"
        />
      </div>
    </CardContainer>
  </div>
</template>

<style lang="scss" scoped>
$current-index: v-bind(currentIndex);
$counter: calc(5 - $current-index);
$minus: calc($counter * 1.5rem + $current-index * 1.75rem);
$item-width: calc((100% - $minus) / 5);
$primary-color: rgb(var(--v-theme-primary));
$secondary-color: rgb(var(--v-theme-secondary));

.text-size-sm {
  font-size: 0.825rem;
}
.breadcrumbs {
  position: absolute;
  background: linear-gradient(90deg, $secondary-color, $primary-color);
  width: calc($item-width * $current-index);
  height: 1.5rem;
}
.step-number-base {
  width: 1.25rem;
  height: 1.25rem;
  text-align: center;
  font-size: 0.75rem;
  border-radius: 1.25rem;
}
.opacity-80 {
  opacity: 0.8;
}
.w-55px {
  width: 55px;
}
.py-6px {
  padding-top: 6px;
  padding-bottom: 6px;
}
.w-20 {
  width: 20%;
}
</style>
