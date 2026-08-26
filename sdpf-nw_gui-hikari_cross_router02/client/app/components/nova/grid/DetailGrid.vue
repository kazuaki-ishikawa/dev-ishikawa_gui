<script setup lang="ts">
type PropType = {
  label: string
}

defineProps<PropType>()
</script>

<template>
  <div class="detail-grid">
    <div class="detail-grid-label">{{ label }}</div>
    <div class="detail-grid-content flex-flex-start-center">
      <div><slot /></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$border-color: rgb(var(--v-theme-info-lighten-3));

.detail-grid {
  display: grid;
  grid-template-columns: 160px 1fr;
  font-size: 13px;
  .detail-grid-label {
    display: flex;
    align-items: center;
    white-space: pre-line;
    padding: 12px 16px;
    background-color: rgb(var(--v-theme-light-info));
  }
  .detail-grid-content {
    padding: 12px 16px;
    border-right: 1px solid $border-color;
  }

  &:last-of-type {
    border-block: 1px solid $border-color;
  }
  &:not(:last-of-type) {
    border-block-start: 1px solid $border-color;
  }
}
</style>
