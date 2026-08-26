<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge'
}
withDefaults(defineProps<PropType>(), {
  size: 'large',
})

const { t } = useI18n()

const sizeMap: Record<NonNullable<PropType['size']>, { size: number; width?: number }> = {
  xSmall: { size: 16, width: 2 },
  small: { size: 24, width: 3 },
  medium: { size: 40 },
  large: { size: 64 },
  xLarge: { size: 96 },
}
</script>

<template>
  <div class="text-center my-5">
    <v-progress-circular :size="sizeMap[size].size" :width="sizeMap[size].width" indeterminate class="mb-1" />
    <span v-if="size === 'xSmall' || size === 'small'" class="px-3">{{ t('nova.message.loading') }}</span>
    <div v-else class="py-2">{{ t('nova.message.loading') }}</div>
  </div>
</template>
