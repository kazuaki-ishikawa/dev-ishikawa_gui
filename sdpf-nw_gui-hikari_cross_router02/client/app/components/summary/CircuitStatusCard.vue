<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

type PropsType = {
  title: string
}
defineProps<PropsType>()
type Emits = {
  (e: 'click'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()
</script>

<template>
  <InnerCard>
    <div class="text-secondary">{{ title }}</div>
    <div class="my-3">
      <slot />
    </div>
    <CustomButton class="mx-auto" icon="right-arrow" :text="t('summary.showDetail')" :width="180" @click="emits('click')" />
  </InnerCard>
</template>
