<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  alert: { timestamp: string; info: string }
}
defineProps<PropType>()
type Emits = {
  (e: 'click'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()
</script>

<template>
  <div class="alert-card">
    <div class="d-flex">
      <div class="flex-grow-1">{{ t('alerts.unsolvedAlerts') }}</div>
      <div>{{ alert.timestamp }}</div>
    </div>
    <div class="d-flex">
      <SvgIcon class="pt-1" :type="IconTypes.Alert" size="xLarge" />
      <div class="pl-5">
        <div class="py-2">{{ alert.info }}</div>
        <div class="alert-detail-button" @click="emits('click')">
          <div class="pl-5 text-center flex-grow-1">{{ t('summary.showDetail') }}</div>
          <SvgIcon class="pt-2px pr-2" :type="IconTypes.UpRightSquare" color="warning" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-warning));
$light-color: rgb(var(--v-theme-light-warning));

.alert-card {
  color: #fff;
  padding: 1rem 1.5rem;
  background: linear-gradient(90deg, $light-color, 0.25rem, $primary-color);
  border-radius: v.$child-border-radius;
}
.alert-detail-button {
  width: 180px;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: $primary-color;
  background-color: #fff;
  border-radius: 1.5rem;
  padding: 0.5rem 0;
  &:hover {
    cursor: pointer;
    opacity: 0.8;
  }
}
.pt-2px {
  padding-top: 2px;
}
</style>
