<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <v-sheet color="highlight" rounded="md" class="pa-6">
    <div class="text-body-medium font-weight-bold mb-4">{{ t('nova.fic.simpleConnection.diagram.title') }}</div>

    <div class="flow">
      <!-- step1 -->
      <div class="d-flex flex-column justify-center single">
        <v-sheet border rounded="md" color="surface" class="pa-3">
          <div class="text-body-small font-weight-bold">1. {{ t('nova.fic.simpleConnection.diagram.step1Title') }}</div>
        </v-sheet>
      </div>

      <!-- 矢印（step1 → step2 / step3） -->
      <div class="connector" aria-hidden="true">
        <svg class="svg" viewBox="0 0 64 120" preserveAspectRatio="none">
          <path class="line" d="M0,60 C28,60 36,32 64,32" />
          <path class="line" d="M0,60 C28,60 36,88 64,88" />
          <path class="head" d="M58,28 L64,32 L58,36" />
          <path class="head" d="M58,84 L64,88 L58,92" />
        </svg>
      </div>

      <!-- step2 / step3 -->
      <div class="d-flex flex-column justify-center ga-3 stack">
        <v-sheet border rounded="md" color="surface" class="pa-3">
          <div class="text-body-small">
            <div class="font-weight-bold">2. {{ t('nova.fic.simpleConnection.diagram.step2Title') }}</div>
            <div class="text-info">{{ t('nova.fic.simpleConnection.diagram.step2Note') }}</div>
          </div>
        </v-sheet>
        <v-sheet border rounded="md" color="surface" class="pa-3">
          <div class="text-body-small font-weight-bold">3. {{ t('nova.fic.simpleConnection.diagram.step3Title') }}</div>
        </v-sheet>
      </div>

      <!-- 矢印（step2 / step3 → step4） -->
      <div class="connector" aria-hidden="true">
        <svg class="svg" viewBox="0 0 64 120" preserveAspectRatio="none">
          <path class="line" d="M0,32 C28,32 36,60 64,60" />
          <path class="line" d="M0,88 C28,88 36,60 64,60" />
          <path class="head" d="M58,56 L64,60 L58,64" />
        </svg>
      </div>

      <!-- step4 -->
      <div class="d-flex flex-column justify-center single">
        <v-sheet border rounded="md" color="surface" class="pa-3">
          <div class="text-body-small font-weight-bold">4. {{ t('nova.fic.simpleConnection.diagram.step4Title') }}</div>
        </v-sheet>
      </div>

      <!-- 矢印（step4 → step5） -->
      <div class="connector" aria-hidden="true">
        <svg class="svg" viewBox="0 0 64 120" preserveAspectRatio="none">
          <path class="line" d="M0,60 H60" />
          <path class="head" d="M54,56 L60,60 L54,64" />
        </svg>
      </div>

      <!-- step5 -->
      <div class="d-flex flex-column justify-center single">
        <v-sheet border rounded="md" color="surface" class="pa-3">
          <div class="text-body-small">
            <div class="font-weight-bold">5. {{ t('nova.fic.simpleConnection.diagram.step5Title') }}</div>
            <div>{{ t('nova.fic.simpleConnection.diagram.step5Note') }}</div>
          </div>
        </v-sheet>
      </div>
    </div>
  </v-sheet>
</template>

<style scoped lang="scss">
.flow {
  display: flex;
  align-items: stretch;
  gap: 8px;
  overflow-x: auto;

  .single {
    flex: 1 1 160px;
    min-width: 150px;
  }
  .stack {
    flex: 1 1 180px;
    min-width: 160px;
  }

  .connector {
    flex: 0 0 64px;
    align-self: stretch;
  }

  .svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .line,
  .head {
    fill: none;
    stroke: rgb(var(--v-theme-info));
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
}
</style>
