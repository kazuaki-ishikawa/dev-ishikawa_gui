<script setup lang="ts">
type PropType = {
  label: string
  help?: string
}
const props = defineProps<PropType>()
</script>

<template>
  <div class="separated-grid">
    <div class="separated-grid-label flex-center-center">
      {{ props.label }}
      <HelpTooltip v-if="$slots.help || !!props.help" class="pl-1 pt-1" size="smallMiddle" :content-width="550">
        <slot v-if="$slots.help" name="help" />
        <span v-else>{{ props.help }}</span>
      </HelpTooltip>
    </div>
    <div class="separated-grid-body bg-white py-2 px-5">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$light-primary-color: rgb(var(--v-theme-light-primary));

.separated-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  .separated-grid-label {
    border-radius: v.$child-border-radius 0 0 v.$child-border-radius;
    background-color: $light-primary-color;
    color: $secondary-color;
  }
  .separated-grid-body {
    border-radius: 0 v.$child-border-radius v.$child-border-radius 0;
  }
}
</style>
