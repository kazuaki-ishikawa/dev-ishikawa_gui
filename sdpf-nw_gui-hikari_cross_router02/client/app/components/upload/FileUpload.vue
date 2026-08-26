<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { FileUploadContentPropType } from './FileUploadContent.vue'

type PropType = {
  fileName: string
  required?: boolean
} & FileUploadContentPropType
const props = withDefaults(defineProps<PropType>(), {
  required: false,
})

type Emits = {
  (e: 'submit', file: File): void
}
const emit = defineEmits<Emits>()
const { t } = useI18n()

const open = ref(false)
const errorMessage = ref('')
const selectedFile = ref<File | null>(null)

const displayText = computed(() => errorMessage.value || props.fileName)

const handleSubmit = () => {
  if (selectedFile.value) {
    emit('submit', selectedFile.value)
  }
  // handleClose が実行されるため useLoading の loading による保存ボタンの連打対策は不要(#12951)
  handleClose()
}
const handleClose = () => {
  if (props.required && !props.fileName && !selectedFile.value) {
    errorMessage.value = t('invalid.required')
  } else {
    errorMessage.value = ''
  }
  selectedFile.value = null
  open.value = false
}
const handleOpen = () => {
  open.value = true
  errorMessage.value = ''
}
</script>

<template>
  <div>
    <CustomButton
      :text="t('fileUpload.fileUpload')"
      icon="up-right-square"
      :disabled="disabled"
      data-cy="file-upload-button"
      @click="handleOpen"
    />
    <div :class="{ error: !!errorMessage }" data-cy="file-upload-display-text">{{ displayText }}</div>
    <DialogBase
      :open="open"
      :cancel-label="t('common.cancel')"
      :submit-label="t('common.save')"
      :disabled="!selectedFile || disabled"
      @close="handleClose"
      @submit="handleSubmit"
    >
      <div class="w-720px mx-auto">
        <div class="text-size-2xl text-center">{{ t('fileUpload.attachedFile') }}</div>
        <FileUploadContent
          v-if="open"
          v-model="selectedFile"
          v-model:error-message="errorMessage"
          :disabled="disabled"
          :file-type="fileType"
          :rules="rules"
          :note="note"
        />
      </div>
    </DialogBase>
  </div>
</template>

<style lang="scss" scoped>
$warning-color: rgb(var(--v-theme-warning));

.error {
  font-size: 0.85rem;
  color: $warning-color;
  padding: 0 0.85rem;
}

.w-720px {
  width: 720px;
}

.text-size-2xl {
  font-size: 1.5rem;
}
</style>
