<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TERMINAL_LINK } from '@/api/terminals/constants'

const open = defineModel<boolean>({ required: true })
const { t } = useI18n()
</script>

<template>
  <DialogBase
    :open="open"
    :title="t('terminals.confirm.firstMobile.title')"
    :submit-label="t('common.confirm')"
    @submit="open = false"
    @close="open = false"
  >
    <div class="px-4">
      <i18n-t keypath="terminals.confirm.firstMobile.message" tag="div" scope="global" class="text-pre-wrap my-2">
        <template #redText>
          <span class="text-error">{{ t('terminals.confirm.firstMobile.redText') }}</span>
        </template>
        <template #here>
          <NuxtLink :to="TERMINAL_LINK.FIRST_MOBILE" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </div>
  </DialogBase>
</template>
