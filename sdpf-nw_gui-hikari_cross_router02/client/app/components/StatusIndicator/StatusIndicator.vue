<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  status?: 'ok' | 'ng' | 'down' | 'warning' | 'disconnected'
  text?: string
}
const props = withDefaults(defineProps<PropType>(), {
  status: 'ok',
})

const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const statusText = computed(() => {
  if (props.text) {
    return props.text
  }
  switch (props.status) {
    case 'ok':
      return 'OK'
    case 'down':
      return 'Down'
    case 'ng':
      return 'NG'
    case 'warning':
      return 'Warning'
    case 'disconnected':
      return t('selfCheck.disconnected')
    default:
      return ''
  }
})
const rightColor = computed(() => {
  switch (props.status) {
    case 'ok':
      return colors.value.success
    case 'warning':
      return colors.value.warning
    case 'disconnected':
      return colors.value.info
    default:
      return colors.value.error
  }
})
const leftColor = computed(() => {
  switch (props.status) {
    case 'ok':
      return colors.value['light-success']
    case 'warning':
      return colors.value['light-warning']
    case 'disconnected':
      return colors.value['light-info']
    default:
      return colors.value['light-error']
  }
})
</script>

<template>
  <div class="status-indicator-container flex-center-center h-100">
    <SvgIcon v-if="status === 'ok'" :type="IconTypes.OK" />
    <SvgIcon v-else-if="status !== 'disconnected'" :type="IconTypes.NG" />
    <div class="status-text font-weight-semibold">{{ statusText }}</div>
  </div>
</template>

<style lang="scss" scoped>
$text-color: #fff;
.status-indicator-container {
  width: 100%;
  color: $text-color;
  background: linear-gradient(90deg, v-bind(leftColor), 0.25rem, v-bind(rightColor));
  path {
    fill: $text-color;
  }
}
.status-text {
  margin-left: 5px;
  height: 16px;
  line-height: 14px;
}
</style>
