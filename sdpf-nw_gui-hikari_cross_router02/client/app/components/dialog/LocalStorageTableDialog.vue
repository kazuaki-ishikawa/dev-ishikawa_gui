<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  open: boolean
  status: 'deleteOnly' | 'noLimit' | null
  items: Array<{ name: string; timestamp: string }>
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'click:use', timestamp: string): void
  (e: 'click:remove', timestamp: string): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const deletedMessage = ref('')
const removeConfirmation = ref(false)
const currentResource = ref<{ name: string; timestamp: string }>()

const headers = [
  { text: t('localStorage.name'), key: 'name' },
  { text: t('localStorage.timestamp'), key: 'timestamp' },
  { text: '', key: 'useFilterButton', width: 160 },
  { text: '', key: 'deleteFilterButton', width: 160 },
]
const useButtonDisabled = computed(() => props.status === 'deleteOnly')

const timestampToLocaleString = (timestamp: string) => {
  return new Date(parseInt(timestamp)).toLocaleString()
}

const handleRemoveButtonClick = (data: { name: string; timestamp: string }) => {
  currentResource.value = data
  removeConfirmation.value = true
}
const handleRemoveCancelClick = () => {
  currentResource.value = undefined
  removeConfirmation.value = false
}

const handleRemove = async () => {
  if (currentResource.value) {
    deletedMessage.value = t('message.deleted')
    emits('click:remove', currentResource.value.timestamp)
  }
}

const handleClose = () => {
  // 削除実行済みの場合は emits で閉じる
  if (removeConfirmation.value && !deletedMessage.value) {
    handleRemoveCancelClick()
  } else {
    emits('close')
  }
}

watch(
  () => props.open,
  next => {
    if (!next) {
      deletedMessage.value = ''
      currentResource.value = undefined
      removeConfirmation.value = false
    }
  },
)
</script>

<template>
  <DialogBase
    :open="open"
    :width="removeConfirmation ? 900 : 1100"
    data-cy="local-storage-table-dialog"
    @close="handleClose"
  >
    <!-- テーブル表示 -->
    <StripedTable v-if="!removeConfirmation" :headers="headers" :items="items" :key-items="['timestamp']">
      <template #timestamp="{ row }">
        {{ timestampToLocaleString(row.timestamp) }}
      </template>
      <template #useFilterButton="{ row }">
        <CustomButton
          :text="t('localStorage.startLoading')"
          color="primary"
          :width="130"
          :disabled="useButtonDisabled"
          data-cy="local-storage-table-dialog-use-button"
          @click="emits('click:use', row.timestamp)"
        />
      </template>
      <template #deleteFilterButton="{ row }">
        <CustomButton :text="t('common.remove')" color="warning" :width="130" @click="handleRemoveButtonClick(row)" />
      </template>
    </StripedTable>

    <!-- 削除確認画面 -->
    <div v-if="removeConfirmation && !deletedMessage" class="text-center text-lg pt-6">
      <div>{{ t('localStorage.deleteConfirm', { name: currentResource?.name }) }}</div>
    </div>

    <!-- 削除完了 -->
    <div v-if="removeConfirmation && !!deletedMessage" class="text-size-xl text-info text-center text-pre-wrap">
      {{ deletedMessage }}
    </div>

    <template v-if="removeConfirmation" #footer>
      <div v-if="!!deletedMessage" class="flex-center-center">
        <CustomButton :text="t('common.close')" color="info" icon="right-arrow" :width="150" @click="emits('close')" />
      </div>
      <div v-else class="flex-center-center">
        <CustomButton
          class="mr-5"
          :text="t('common.cancel')"
          color="info"
          icon="left-arrow"
          :width="150"
          @click="handleRemoveCancelClick"
        />
        <CustomButton
          :text="t('common.remove')"
          color="warning"
          icon="right-arrow"
          :width="150"
          @click="handleRemove"
        />
      </div>
    </template>
  </DialogBase>
</template>

<style lang="scss" scoped>
.text-size-xl {
  font-size: 1.5rem;
}
</style>
