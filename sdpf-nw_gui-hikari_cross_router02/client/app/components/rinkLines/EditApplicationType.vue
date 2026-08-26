<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RinkLineApplicationTypes } from '@/api/rinkLines/constants'

type Props = {
  disabled?: boolean
}
defineProps<Props>()
const model = defineModel<string>({ required: true })

type Emits = {
  (e: 'download:excel'): void
  (e: 'upload:csv', file: File): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const applicationOptions = Object.values(RinkLineApplicationTypes).map(value => ({
  text: t(`rinkLines.applicationType.${value}`),
  value,
}))

const csvFileName = ref<string>('')
const csvSteps = [
  { text: t('rinkLines.applicationType.csvStep1') },
  { text: t('rinkLines.applicationType.csvStep2') },
  { text: t('rinkLines.applicationType.csvStep3') },
]

const handleCsvUpload = (file: File) => {
  csvFileName.value = file.name
  emits('upload:csv', file)
}
</script>

<template>
  <InnerCard :title="t('rinkLines.applicationType.label')">
    <RadioForm
      v-model="model"
      :options="applicationOptions"
      :disabled="disabled"
      class="pt-3"
      data-cy="edit-application-type-application-type"
    />
  </InnerCard>
  <template v-if="model === RinkLineApplicationTypes.Csv">
    <div class="grid-cols-3 ga-4 py-3">
      <StepBox v-for="(line, index) in csvSteps" :key="line.text" :step="index + 1">
        <div class="pa-2 text-center text-sm text-pre-wrap">{{ line.text }}</div>
        <NuxtLink v-if="index === 0" class="border-b-sm ma-2 cursor-pointer" @click="emits('download:excel')">
          {{ t('rinkLines.applicationType.excel') }}
        </NuxtLink>
      </StepBox>
    </div>
    <div class="d-flex justify-end">
      <FileUpload
        :file-name="csvFileName"
        file-type="csv"
        :disabled="disabled"
        data-cy="edit-application-type-file-upload"
        @submit="handleCsvUpload"
      />
    </div>
  </template>
</template>

<style lang="scss" scoped>
.grid-cols-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
</style>
