<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  open: boolean
  tenantId: string
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'submit', request: { file: File }): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()

const errorMessage = ref('')
const selectedFile = ref<File | null>(null)

const isConfirmation = ref(false)
const handleSubmit = () => {
  if (isConfirmation.value && !!selectedFile.value) {
    emits('submit', { file: selectedFile.value })
  } else {
    isConfirmation.value = true
  }
}
const handleClose = () => {
  if (isConfirmation.value) {
    isConfirmation.value = false
  } else {
    emits('close')
  }
}
watch(
  () => props.open,
  () => {
    if (props.open) {
      // 初期化する
      errorMessage.value = ''
      selectedFile.value = null
      isConfirmation.value = false
    }
  },
)
</script>

<template>
  <DialogBase
    :open="open"
    :submit-label="isConfirmation ? t('common.save') : t('common.confirm')"
    :cancel-label="isConfirmation ? t('common.return') : t('common.cancel')"
    :cancel-icon="isConfirmation ? 'left-arrow' : 'right-arrow'"
    :disabled="loading || !selectedFile"
    @submit="handleSubmit"
    @close="handleClose"
  >
    <div v-if="isConfirmation">{{ t('guarantees.updateFieldSurveyLessInfoOrderConfirmation') }}</div>
    <InputGrid required :label="t('guarantees.fieldSurveyLessFileId')">
      <div class="w-552px">
        <FileUploadContent
          v-if="open"
          v-model="selectedFile"
          v-model:error-message="errorMessage"
          file-type="report"
          :disabled="isConfirmation"
          :rules="[rules.fileMaxSizeMB(3)]"
          :note="t('guarantees.note.fieldSurveyLessFileFormat')"
        />
      </div>
      <template #footer>
        <div text-warning>{{ t('fileUpload.maxSizeNote', { max: 3 }) }}</div>
      </template>
    </InputGrid>
  </DialogBase>
</template>

<style lang="scss" scoped>
.w-552px {
  width: 552px;
}
</style>
