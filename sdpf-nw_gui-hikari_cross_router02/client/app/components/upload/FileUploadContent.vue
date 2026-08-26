<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DocumentExtensions, DocumentFileTypes } from '@/api/constants'

const FileTypes = {
  image: [DocumentExtensions.Png, DocumentExtensions.Jpeg, DocumentExtensions.Jpg, DocumentExtensions.Pdf],
  csv: [DocumentExtensions.Csv],
  report: [DocumentExtensions.Pdf, DocumentExtensions.Xls, DocumentExtensions.Xlsx, DocumentExtensions.Zip],
} as const

export type FileUploadContentPropType = {
  fileType?: keyof typeof FileTypes
  rules?: Array<(value: File) => true | string>
  note?: string
  disabled?: boolean
}
const props = withDefaults(defineProps<FileUploadContentPropType>(), {
  fileType: 'image',
  rules: () => [],
  note: '',
  disabled: false,
})

const selectedFile = defineModel<File | null>({ required: true })
const errorMessage = defineModel<string>('errorMessage', { required: true })

const { t } = useI18n()

const enterCounter = ref(0)
const inputRef = ref<HTMLInputElement>()
const selectedFileText = computed(() => selectedFile.value?.name ?? t('fileUpload.unselected'))
const accept = computed(() => FileTypes[props.fileType].map(ext => `.${ext}`).join(','))
const documentFileTypes = computed(() => FileTypes[props.fileType].flatMap(type => DocumentFileTypes[type]))

const setFileInfo = (files?: FileList | null) => {
  if (!files || files.length === 0) {
    return
  }
  const file = files[0]!
  if (props.fileType === 'image' && !documentFileTypes.value.includes(file.type)) {
    errorMessage.value = t('fileUpload.differentImageFileFormat')
    selectedFile.value = null
    return
  }
  if (props.fileType === 'csv' && !documentFileTypes.value.includes(file.type)) {
    errorMessage.value = t('fileUpload.differentCsvFileFormat')
    selectedFile.value = null
    return
  }
  if (props.fileType === 'report' && !documentFileTypes.value.includes(file.type)) {
    errorMessage.value = t('fileUpload.differentFileFormat')
    selectedFile.value = null
    return
  }
  const ruleResult = props.rules.map(func => func(file)).find(value => typeof value === 'string')
  if (ruleResult) {
    errorMessage.value = ruleResult as string
    selectedFile.value = null
    return
  }
  errorMessage.value = ''
  selectedFile.value = file
}

const dragEnter = () => {
  enterCounter.value++
}
const dragLeave = () => {
  enterCounter.value--
}
const dropFile = (event: DragEvent) => {
  enterCounter.value = 0
  setFileInfo(event.dataTransfer?.files)
}
const handleInputChange = (event: Event) => {
  setFileInfo((event.target as HTMLInputElement)?.files)
}
</script>

<template>
  <div>
    <div v-if="!disabled && note" class="file-upload-notes">
      <div class="text-lg text-warning mb-2">{{ t('common.note') }}</div>
      <div class="line-height text-pre-wrap text-sm">{{ note }}</div>
    </div>
    <div
      v-if="!disabled"
      :class="{ enter: 0 < enterCounter, error: !!errorMessage }"
      class="file-upload-dnd-area"
      @dragenter="dragEnter"
      @dragleave.stop="dragLeave"
      @dragover.prevent
      @drop.prevent="dropFile"
    >
      <div>{{ t('fileUpload.dragAndDropOr') }}</div>
      <div>
        <CustomButton :text="t('fileUpload.selectFile')" icon="right-arrow" :width="200" @click="inputRef?.click()" />
        <span class="pl-3 text-sm">{{ selectedFileText }}</span>
      </div>
      <input ref="inputRef" hidden :accept="accept" type="file" @change="handleInputChange" />
    </div>
    <div v-else class="pl-3 text-sm" data-cy="file-upload-selected-file-text">{{ selectedFileText }}</div>
    <div class="text-sm text-warning">{{ errorMessage }}</div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-primary));
$info-color: rgb(var(--v-theme-info));
$warning-color: rgb(var(--v-theme-warning));
$light-primary-color: rgb(var(--v-theme-light-primary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));
$light-warning-color: rgb(var(--v-theme-light-warning));

.error {
  font-size: 0.85rem;
  color: $warning-color;
  padding: 0 0.85rem;
}
.file-upload-dnd-area {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100px;
  margin: 0.5rem auto;
  padding: 1rem 1.5rem;
  color: $info-color;
  border: 1px dashed $primary-color;
  border-radius: v.$child-border-radius;
  background-color: $light-secondary-color;
  .line-height {
    line-height: 1.625;
  }
  &.error {
    border: 1px dashed $warning-color;
    background-color: $light-warning-color;
  }
  &.enter {
    color: $info-color;
    border: 1px dashed $primary-color;
    background-color: $light-primary-color;
  }
}
.file-upload-notes {
  margin: 0.5rem auto;
  padding: 1rem 1.5rem;
  color: $info-color;
  border: 1px dashed $warning-color;
  border-radius: v.$child-border-radius;
  background-color: $light-warning-color;
}
</style>
