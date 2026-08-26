<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IPOE_LINK } from '@/api/ipoes/constants'

type PropType = {
  open: boolean
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'close', hideNextTime: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const hideLineOutMessage = ref(false)

const handleClose = () => {
  emits('close', hideLineOutMessage.value)
}
</script>

<template>
  <DialogBase :open="props.open" :cancel-label="t('common.close')" @close="handleClose">
    <div>
      <i18n-t keypath="ipoes.help.lineOutNotice" tag="div" scope="global" class="text-pre-wrap text-center">
        <template #here>
          <NuxtLink :to="IPOE_LINK.INQUIRY" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
      <div class="mt-3 d-flex justify-center">
        <TermOfServiceCheckbox
          v-model="hideLineOutMessage"
          :label="t('ipoes.help.hideNextTime')"
          col-min-width="360px"
          data-cy="line-out-dialog-hide-next-time-checkbox"
        />
      </div>
    </div>
  </DialogBase>
</template>
