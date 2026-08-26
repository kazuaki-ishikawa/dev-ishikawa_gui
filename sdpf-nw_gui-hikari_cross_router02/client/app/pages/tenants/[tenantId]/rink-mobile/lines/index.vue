<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'
import { RinkMobilePages, TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const { showRinkMobileMaintenanceNotification, disabledRinkMobileMaintenanceApplication } = useRinkMobileMaintenance()

const moveTo = (view: 'create' | 'edit' | 'remove' | typeof RinkMobilePages.LineGroups) => {
  if (view === RinkMobilePages.LineGroups) {
    return navigateTo({
      path: `/tenants/${route.params.tenantId}/${TenantPages.RinkMobile}/${RinkMobilePages.LineGroups}`,
    })
  }
  return navigateTo({ path: `${route.path}/${view}` })
}
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Sim" color="secondary" />
      <div class="ml-2 text-lg">{{ t('sideBar.rinkLines') }}</div>
    </div>

    <div class="d-flex flex-wrap ga-6">
      <CustomButton
        icon="right-arrow"
        :text="t('common.newApplication')"
        :width="180"
        :disabled="disabledRinkMobileMaintenanceApplication"
        data-cy="rink-mobile-lines-index-application-button"
        @click="moveTo('create')"
      />
      <CustomButton
        icon="right-arrow"
        :text="t('common.edit')"
        :width="180"
        data-cy="rink-mobile-lines-index-edit-button"
        @click="moveTo('edit')"
      />
      <CustomButton
        icon="right-arrow"
        :text="t('common.delete')"
        :width="180"
        color="warning"
        :disabled="disabledRinkMobileMaintenanceApplication"
        data-cy="rink-mobile-lines-index-remove-button"
        @click="moveTo('remove')"
      />
      <CustomButton
        icon="right-arrow"
        :text="t('service.rinkLineGroups')"
        :width="230"
        @click="moveTo(RinkMobilePages.LineGroups)"
      />
    </div>

    <div
      v-if="showRinkMobileMaintenanceNotification"
      class="mt-4 text-warning text-pre-wrap"
      data-cy="rink-mobile-lines-index-maintenance-notification"
    >
      {{ t('rinkConnections.message.maintenanceApplicationSuspension') }}
    </div>
  </CardContainer>
</template>
