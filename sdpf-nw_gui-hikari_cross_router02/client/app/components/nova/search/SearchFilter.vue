<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  disabled?: boolean
}

defineProps<PropType>()

const emits = defineEmits<{
  (e: 'clear'): void
  (e: 'search'): void
}>()

const { t } = useI18n()
</script>

<template>
  <v-card class="pa-3 my-5">
    <div class="flex-space-between-center">
      <div class="flex-grow-1 search-filter-input-area">
        <div class="flex-flex-start-center ga-4 flex-wrap">
          <slot />
        </div>
      </div>
      <div class="flex-flex-end-center ga-4">
        <NovaCustomButton outlined :disabled="disabled" @click="emits('clear')">
          {{ t('nova.common.clear') }}
        </NovaCustomButton>
        <NovaCustomButton :disabled="disabled" @click="emits('search')">
          {{ t('nova.common.search') }}
        </NovaCustomButton>
      </div>
    </div>
  </v-card>
</template>

<style lang="scss" scoped>
.search-filter-input-area {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
</style>
