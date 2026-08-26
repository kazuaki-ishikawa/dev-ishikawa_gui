<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  orderId: string
  message: string
}
defineProps<PropType>()

const { t } = useI18n()
</script>

<template>
  <div>
    <div class="font-weight-bold" data-cy="card-item-completed-order-id">
      {{ t('nova.update.orderId', { orderId }) }}
    </div>
    <div class="my-5 font-weight-bold text-pre-wrap">{{ message }}</div>
  </div>
</template>
