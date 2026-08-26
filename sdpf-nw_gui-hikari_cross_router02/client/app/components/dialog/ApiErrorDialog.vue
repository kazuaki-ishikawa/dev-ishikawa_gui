<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

type PropType = {
  open: boolean
  message: string
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()
</script>

<template>
  <DialogBase
    :open="props.open"
    :submit-label="t('common.close')"
    submit-color="info"
    :width="950"
    @submit="emits('close')"
    @close="emits('close')"
  >
    <div class="text-pre-wrap mb-3 text-xl text-info text-center">
      <div>{{ props.message }}</div>
      <i18n-t keypath="message.apiError" tag="span" scope="global">
        <template #here>
          <NuxtLink
            to="https://sdpf.ntt.com/services/docs/rink/tutorials/troubleshooting.html#error-detail"
            target="_blank"
          >
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </div>
  </DialogBase>
</template>
