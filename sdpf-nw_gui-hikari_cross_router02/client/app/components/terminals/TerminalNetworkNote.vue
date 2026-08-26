<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TERMINAL_LINK, type NetworkTypes } from '@/api/terminals/constants'

type PropType = {
  connectionType: typeof NetworkTypes.Vpn | typeof NetworkTypes.Internet
}
const props = defineProps<PropType>()
const { t } = useI18n()
const type = computed(() => t(`terminals.${props.connectionType}`))
const connection = computed(() => t(`terminals.note.network.connection.${props.connectionType}`))
</script>

<template>
  <div class="text-pre-wrap">
    <i18n-t keypath="terminals.note.network.base" tag="div" scope="global">
      <template #connection>{{ connection }}</template>
      <template #underline>
        {{ t('terminals.note.network.underline', { type }) }}
      </template>
      <template #here>
        <NuxtLink :to="TERMINAL_LINK.CHANGE_IWAN" target="_blank">
          {{ t('common.here') }}
        </NuxtLink>
      </template>
    </i18n-t>
    <div class="font-weight-bold">{{ t('terminals.note.network.caution.title') }}</div>
    <div class="text-decoration-underline">
      {{ t('terminals.note.network.caution.underline', { type, connection }) }}
    </div>
  </div>
</template>
