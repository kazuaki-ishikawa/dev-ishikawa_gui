<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DownloadTypes } from '@/components/button/constants'
import type { DownloadChartType } from '@/components/button/types'

type Emits = {
  (e: 'download', type: DownloadChartType): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const dropdownOpen = ref(false)
const handleDownlaod = (type: DownloadChartType) => {
  emits('download', type)
}

const dropdownOptions = [
  { text: t('trafficDetails.downloadPng'), value: DownloadTypes.Png },
  { text: t('trafficDetails.downloadJpeg'), value: DownloadTypes.Jpeg },
  { text: t('trafficDetails.downloadPdf'), value: DownloadTypes.Pdf },
  { text: t('trafficDetails.downloadSvg'), value: DownloadTypes.Svg },
]
</script>

<template>
  <DropDown v-model:dropdown-open="dropdownOpen" :options="dropdownOptions" @click="handleDownlaod">
    <CircleButton icon="download" @click.stop="dropdownOpen = true" />
  </DropDown>
</template>
