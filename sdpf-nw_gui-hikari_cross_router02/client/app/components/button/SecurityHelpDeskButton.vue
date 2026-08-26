<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SecurityContractsPages, TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()

const moveToSecurityHelpDesk = async () => {
  await navigateTo(
    `/tenants/${route.params.tenantId}/${TenantPages.SecurityContracts}/${SecurityContractsPages.SecurityHelpDesk}`,
  )
}
</script>

<template>
  <CustomButton
    icon="right-arrow"
    :text="t('securityContracts.securityHelpDesk')"
    :width="230"
    data-cy="security-help-desk-button"
    @click="moveToSecurityHelpDesk"
  />
</template>
