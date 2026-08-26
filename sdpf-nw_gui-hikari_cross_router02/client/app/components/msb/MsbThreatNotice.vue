<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { MSB_LINK } from '@/api/msb/constants'
import type { MsbThreatNoticeResponse } from '@/api/msb/types'
import { IconTypes } from '@/components/icons/constants'

type Props = {
  threatNotice: MsbThreatNoticeResponse | null
  showManagementConsoleButton?: boolean
}
defineProps<Props>()

const { t } = useI18n()

const moveToManagementConsole = async () => {
  await navigateTo(MSB_LINK.CONSOLE, {
    external: true,
    open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
  })
}
</script>

<template>
  <CardContainer class="mb-5">
    <div class="flex-flex-start-center pb-3">
      <SvgIcon class="pt-1" :type="IconTypes.News" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ t('msb.notification') }}</div>
    </div>

    <div class="text-pre-wrap" data-cy="msb-threat-notice-message">
      {{ threatNotice?.message || t('msb.message.noNotification') }}
    </div>
    <div v-if="showManagementConsoleButton" class="flex-flex-end-center pt-2">
      <CustomButton
        icon="right-arrow"
        :text="t('msb.managementConsole')"
        :width="180"
        data-cy="msb-threat-notice-console-button"
        @click="moveToManagementConsole"
      />
    </div>
  </CardContainer>
</template>
