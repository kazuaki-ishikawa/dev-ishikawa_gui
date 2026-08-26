<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const moveToConstructionMaintenance = async () => {
  await navigateTo('https://sdpf.ntt.com/service-status', {
    external: true,
    open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
  })
}
</script>

<template>
  <div class="grid flex-content-between">
    <div class="mb-2 text-secondary">{{ t('selfCheck.constructionMaintenance') }}</div>
    <CustomButton
      class="mx-auto"
      icon="up-right-square"
      :text="t('summary.showDetail')"
      :width="180"
      @click="moveToConstructionMaintenance"
    />
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
}
</style>
