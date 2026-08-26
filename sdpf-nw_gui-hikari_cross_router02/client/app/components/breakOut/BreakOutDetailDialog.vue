<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BreakOutResponse } from '@/api/breakOut/types'
import { TenantPages } from '@/components/sidebar/constants'

type PropType = {
  breakOut?: BreakOutResponse
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const handleMoveDetail = async () => {
  if (props.breakOut?.tenantId && props.breakOut?.breakOutListId) {
    await navigateTo({
      path: `/tenants/${props.breakOut.tenantId}/${TenantPages.BreakOutLists}/${props.breakOut.breakOutListId}`,
    })
  }
}
</script>

<template>
  <DialogBase :open="!!breakOut" @close="emits('close')">
    <template #default>
      <BreakOutDetail :break-out="breakOut" />
    </template>
    <template #footer>
      <div class="flex-space-between-center px-4">
        <CustomButton :text="t('breakOut.moveToDetail')" icon="right-arrow" :width="320" @click="handleMoveDetail" />
        <CustomButton :text="t('common.close')" icon="right-arrow" color="info" :width="150" @click="emits('close')" />
      </div>
    </template>
  </DialogBase>
</template>
