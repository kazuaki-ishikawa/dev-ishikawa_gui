<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SecurityHelpDeskResponse } from '@/api/securityHelpDesk/types'

type PropType = {
  securityHelpDesk: SecurityHelpDeskResponse
}
defineProps<PropType>()

const { t } = useI18n()
</script>

<template>
  <div>
    <DetailGrid>
      <div>{{ t('securityHelpDesk.status') }}</div>
      <div>{{ securityHelpDesk.enabled ? t('securityHelpDesk.using') : t('securityHelpDesk.notUsing') }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ securityHelpDesk.enabled ? t('details.serviceEndDate') : t('details.serviceStartDate') }}</div>
      <div>{{ formatDate(securityHelpDesk?.effectiveDate) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('securityHelpDesk.supportedTerminalCount') }}</div>
      <div>{{ securityHelpDesk.supportedTerminalCount }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('securityHelpDesk.supportUrl') }}</div>
      <NuxtLink v-if="securityHelpDesk?.supportUrl" :to="securityHelpDesk.supportUrl" target="_blank">
        {{ t('securityHelpDesk.contacts') }}
      </NuxtLink>
      <div v-else>-</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('securityHelpDesk.supportEmail') }}</div>
      <div>{{ securityHelpDesk?.supportEmail ?? '-' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.orderId') }}</div>
      <div>{{ securityHelpDesk?.orderId ?? '-' }}</div>
    </DetailGrid>
  </div>
</template>
