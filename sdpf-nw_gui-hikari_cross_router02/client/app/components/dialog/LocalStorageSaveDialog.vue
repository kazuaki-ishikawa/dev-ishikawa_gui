<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  open: boolean
  addable: boolean
}

const props = defineProps<PropType>()
type Emits = {
  (e: 'submit', name: string): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const name = ref('')
const inputValid = ref(false)

watch(
  () => props.open,
  () => {
    name.value = t('localStorage.defaultName')
    inputValid.value = true
  },
)
</script>

<template>
  <DialogBase :open="open" data-cy="local-storage-save-dialog" @close="emits('close')">
    <!-- 入力 -->
    <template v-if="addable">
      <div>{{ t('localStorage.saveConfirm') }}</div>
      <InputGrid required :label="t('localStorage.name')">
        <InputForm
          v-model="name"
          required
          maxlength="64"
          :placeholder="t('localStorage.defaultName')"
          data-cy="local-storage-save-dialog-name-input"
          @valid="valid => (inputValid = valid)"
        />
      </InputGrid>
    </template>
    <!-- 保存が10件を超える場合 -->
    <template v-else>
      <div class="text-center text-pre-wrap pt-4">
        {{ t('localStorage.maxItems') }}
      </div>
    </template>

    <template #footer>
      <div class="flex-center-center">
        <CustomButton
          class="mr-5"
          :text="t('common.cancel')"
          color="info"
          icon="left-arrow"
          :width="180"
          @click="emits('close')"
        />
        <CustomButton
          :text="addable ? t('common.save') : t('localStorage.moveToListButton')"
          icon="right-arrow"
          :width="180"
          :disabled="!inputValid"
          data-cy="local-storage-save-dialog-submit-button"
          @click="emits('submit', name)"
        />
      </div>
    </template>
  </DialogBase>
</template>
