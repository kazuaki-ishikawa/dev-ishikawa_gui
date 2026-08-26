<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { CustomButtonIconType } from '@/components/button/types'

const { t } = useI18n()
const emits = defineEmits<{ (e: 'cancel'): void }>()
const isConfirmation = defineModel<boolean>('isConfirmation', { required: true })

const icon = computed<CustomButtonIconType>(() => (isConfirmation.value ? 'left-arrow' : 'right-arrow'))
const text = computed(() => (isConfirmation.value ? t('common.return') : t('common.cancel')))
const handleClick = () => (isConfirmation.value ? (isConfirmation.value = false) : emits('cancel'))
</script>

<template>
  <CustomButton color="info" :icon="icon" :width="180" :text="text" @click="handleClick" />
</template>
