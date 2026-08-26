<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { LansType } from '@/api/terminals/types'

type PropType = {
  type: LansType
}
const props = defineProps<PropType>()

const { t } = useI18n()
const label = computed(() => t(`nova.terminals.${props.type}Circuit`))
</script>

<template>
  <v-chip label size="small" variant="outlined" class="bg-surface px-3">
    {{ label }}
  </v-chip>
</template>
