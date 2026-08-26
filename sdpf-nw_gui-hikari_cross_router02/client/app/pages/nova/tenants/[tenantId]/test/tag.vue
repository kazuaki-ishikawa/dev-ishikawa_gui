<script setup lang="ts">
const colors = ['info', 'primary', 'success', 'warning', 'error'] as const

const colorLabels: Record<(typeof colors)[number], string> = {
  info: 'Info',
  primary: 'Primary',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
}
</script>

<template>
  <CardContainer>
    <InnerCard title="Nova Tag Color Test">
      <p class="mb-4 text-sm text-info">
        LightColorTag / DarkColorTag の全色（info, primary, success, warning, error）確認用
      </p>

      <div class="tag-grid">
        <div class="tag-grid__header">Color</div>
        <div class="tag-grid__header">LightColorTag</div>
        <div class="tag-grid__header">DarkColorTag</div>

        <template v-for="color in colors" :key="color">
          <div class="tag-grid__cell text-sm font-weight-bold">{{ colorLabels[color] }}</div>
          <div class="tag-grid__cell">
            <NovaLightColorTag :label="`${colorLabels[color]} Light`" :color="color" />
          </div>
          <div class="tag-grid__cell">
            <NovaDarkColorTag :label="`${colorLabels[color]} Dark`" :color="color" />
          </div>
        </template>
      </div>
    </InnerCard>
  </CardContainer>
</template>

<style scoped lang="scss">
.tag-grid {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px 14px;
  align-items: center;
}

.tag-grid__header {
  font-weight: 700;
  font-size: 0.9rem;
}

.tag-grid__cell {
  min-height: 28px;
  display: flex;
  align-items: center;
}

@media (max-width: 960px) {
  .tag-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
