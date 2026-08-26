<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ButtonType } from '@/components/nova/idaas/types'
import { ButtonTypes } from '@/components/nova/idaas/constants'

type PropType = {
  title: string
  text: string
  buttonType?: ButtonType
}
defineProps<PropType>()

const { t } = useI18n()

type Emits = {
  (e: 'click', type?: ButtonType): void
}
const emits = defineEmits<Emits>()
</script>

<template>
  <div>
    <v-card class="my-5">
      <NovaCardTitleWithBorder :title="title" />
      <v-card-text class="py-4">
        <div class="text-pre-wrap" data-cy="api-key-result-card-text">{{ text }}</div>
      </v-card-text>
    </v-card>
    <div v-if="buttonType" class="flex-center-center">
      <NovaCustomButton outlined data-cy="api-key-result-card-button" @click="emits('click', buttonType)">
        {{
          buttonType === ButtonTypes.MoveToSetting
            ? t('nova.apiKeySetting.moveToSetting')
            : t('nova.apiKeySetting.moveToReport')
        }}
      </NovaCustomButton>
    </div>
  </div>
</template>
