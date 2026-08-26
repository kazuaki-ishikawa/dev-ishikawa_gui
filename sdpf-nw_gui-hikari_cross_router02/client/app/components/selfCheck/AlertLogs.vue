<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

type PropType = {
  tenantId: string
  terminalId: string
}
const props = defineProps<PropType>()
const { t } = useI18n()
const moveToAlertLogs = async () => {
  await navigateTo(
    { path: `/tenants/${props.tenantId}/monitoring/alert-details`, query: { terminalId: props.terminalId } },
    { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } },
  )
}
</script>

<template>
  <div class="grid flex-content-between">
    <div class="mb-2 text-secondary">{{ t('selfCheck.alertLog') }}</div>
    <CustomButton
      class="mx-auto"
      icon="up-right-square"
      :text="t('summary.showDetail')"
      :width="180"
      @click="moveToAlertLogs"
    />
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
}
</style>
