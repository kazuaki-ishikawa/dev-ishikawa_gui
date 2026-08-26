<script setup lang="ts">
type PropType = {
  steps: Array<{
    title: string
    value: number
  }>
}
defineProps<PropType>()
const model = defineModel<number>({ required: true })
</script>

<template>
  <v-stepper v-model="model" elevation="0" bg-color="transparent" alt-labels>
    <v-stepper-header>
      <template v-for="(step, index) in steps" :key="step.value">
        <v-stepper-item
          :title="step.title"
          :value="step.value"
          :complete="step.value < model"
          :class="{ completed: step.value < model, current: step.value === model }"
          :style="{ opacity: step.value <= model ? 1 : 0.5 }"
        >
          <template #icon="{ hasCompleted }">
            <v-icon v-if="hasCompleted" color="success" icon="nova:check" />
            <span v-else>{{ step.value }}</span>
          </template>
        </v-stepper-item>
        <v-divider v-if="index !== steps.length - 1" />
      </template>
    </v-stepper-header>
  </v-stepper>
</template>

<style lang="scss" scoped>
:deep(.v-stepper-item) {
  &.completed {
    .v-avatar {
      border: 2px solid rgb(var(--v-theme-success));
    }
  }
  &.current {
    .v-avatar {
      border: 2px solid rgb(var(--v-theme-interactive));
      background-color: rgb(var(--v-theme-interactive));
      color: rgb(var(--v-theme-on-interactive));
    }
  }
  .v-avatar {
    width: 30px !important;
    height: 30px !important;
    border: 2px solid rgb(var(--v-theme-info));
    background-color: rgb(var(--v-theme-surface));
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: rgb(var(--v-theme-info));
  }
  .v-stepper-item__content {
    font-size: 0.85rem;
  }
}
</style>
