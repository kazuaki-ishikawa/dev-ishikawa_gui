<script lang="ts" setup>
type PropType = {
  labelWidth?: number
}

const props = withDefaults(defineProps<PropType>(), {
  labelWidth: 290,
})
const labelWidth = computed(() => `${props.labelWidth}px`)
</script>

<template>
  <div class="detail-grid-container">
    <div class="detail-grid">
      <slot />
    </div>
    <div :style="{ 'margin-left': `${props.labelWidth + 30}px` }">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
$label-width: v-bind(labelWidth);
$label: calc($label-width + 0.85rem);

.detail-grid {
  display: grid;
  grid-template-columns: $label 1fr;
  padding: 0.75rem 0;
  > :first-child {
    padding-right: 0.5rem;
  }
  > :last-child {
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 1rem;
    height: 100%;
    &::before {
      position: absolute;
      top: 0.25rem;
      left: 0;
      content: '';
      border-left: v.$split-bold-border;
      height: calc(100% - 0.5rem);
      min-height: 1rem;
    }
  }
  &:first-of-type {
    padding-top: 0.5rem;
  }
  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0.5rem;
  }
}

.detail-grid-container {
  padding: 0.65rem 0;
  &:not(:last-of-type) {
    border-bottom: v.$split-border;
  }
}
</style>
