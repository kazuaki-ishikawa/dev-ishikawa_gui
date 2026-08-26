<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const { showRinkMobileMaintenanceNotification } = useRinkMobileMaintenance()

const moveTo = async (view: 'create' | 'edit' | 'remove') => {
  await navigateTo({ path: `${route.path}/${view}` })
}
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Sim" color="secondary" />
      <div class="ml-2 text-lg">{{ t('sideBar.rinkConnections') }}</div>
    </div>
    <div class="d-flex flex-wrap ga-6">
      <CustomButton
        icon="right-arrow"
        :text="t('common.createNew')"
        :width="180"
        data-cy="rink-mobile-connections-index-create-button"
        @click="moveTo('create')"
      />
      <CustomButton
        icon="right-arrow"
        :text="t('common.edit')"
        :width="180"
        data-cy="rink-mobile-connections-index-edit-button"
        @click="moveTo('edit')"
      />
      <CustomButton
        icon="right-arrow"
        :text="t('common.delete')"
        :width="180"
        color="warning"
        data-cy="rink-mobile-connections-index-remove-button"
        @click="moveTo('remove')"
      />
    </div>

    <div
      v-if="showRinkMobileMaintenanceNotification"
      class="mt-4 text-warning text-pre-wrap"
      data-cy="rink-mobile-connections-index-maintenance-notification"
    >
      {{ t('rinkConnections.message.maintenanceOrderCancellationAfterApplication') }}
    </div>
  </CardContainer>
</template>
