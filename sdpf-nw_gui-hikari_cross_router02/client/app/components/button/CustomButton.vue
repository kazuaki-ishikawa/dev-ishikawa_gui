<script lang="ts" setup>
import CircleCaretRightIcon from '~icons/ztgict/circle-caret-right'
import DownloadIcon from '~icons/ztgict/download'
import ReloadIcon from '~icons/ztgict/reload'
import SearchIcon from '~icons/ztgict/search'
import UpRightSquareIcon from '~icons/ztgict/up-right-square'
import LockIcon from '~icons/ztgict/lock'
import LightIcon from '~icons/ztgict/light'
import type { CustomButtonIconType } from '@/components/button/types'
import type { ColorKeyList } from '@/components/constants'

const DEFAULT_HEIGHT = 34

type PropType = {
  text: string
  icon?: CustomButtonIconType
  color?: (typeof ColorKeyList)[number]
  width?: number
  disabled?: boolean
  size?: 'default' | 'large'
}
const props = withDefaults(defineProps<PropType>(), {
  color: 'primary',
  width: 300,
  disabled: false,
  size: 'default',
})

const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const buttonWidth = computed(() => `${props.width}px`)
const primaryColor = computed(() => colors.value[props.color])
const lightColor = computed(() => {
  switch (props.color) {
    case 'primary':
      return colors.value.secondary
    case 'error':
      return colors.value['error-lighten-2']
    case 'warning':
      return colors.value['warning-lighten-2']
    default: // secondary or info
      return colors.value[props.color]
  }
})
</script>

<template>
  <v-btn
    :disabled="props.disabled"
    variant="text"
    rounded="pill"
    :height="size === 'default' ? DEFAULT_HEIGHT : undefined"
    :size="size"
    :ripple="false"
    class="flex-center-center button"
  >
    <span class="position-relative text-pre-wrap" :class="{ 'ml-3': props.icon === 'left-arrow' }">{{
      props.text
    }}</span>
    <CircleCaretRightIcon v-if="props.icon === 'right-arrow'" class="right-arrow-icon" />
    <CircleCaretRightIcon v-else-if="props.icon === 'left-arrow'" class="left-arrow-icon" />
    <UpRightSquareIcon v-else-if="props.icon === 'up-right-square'" class="up-right-square-icon" />
    <SearchIcon v-else-if="props.icon === 'search'" class="search-icon" />
    <DownloadIcon v-else-if="props.icon === 'download'" class="download-icon" />
    <ReloadIcon v-else-if="props.icon === 'reload'" class="reload-icon" />
    <LockIcon v-else-if="props.icon === 'lock'" class="lock-icon" />
    <LightIcon v-else-if="props.icon === 'light'" class="light-icon" />
  </v-btn>
</template>

<style lang="scss" scoped>
$primary-color: v-bind(primaryColor);
$light-color: v-bind(lightColor);
$light-info-color: rgb(var(--v-theme-light-info));
$text-color: #fff;
$transition-time: 0.5s;

.button {
  border: solid 1px transparent;
  width: v-bind(buttonWidth);
  min-width: 0;
  position: relative;
  padding: 0;
  color: $text-color;
  font-size: 0.875rem;
  transition: all $transition-time;
  :deep(.v-btn__content) {
    width: 100%;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }
  :deep(.v-btn__overlay),
  :deep(.v-btn__underlay) {
    display: none;
  }
  /* background: linear-gradient には transition が効かないため
  // ::before 疑似要素 の opacity を変化させて疑似的に transition を再現する */
  &::before {
    content: '';
    background: linear-gradient(90deg, $light-color, $primary-color);
    border-radius: inherit;
    position: absolute;
    width: 100%;
    height: 100%;
    transition: all $transition-time;
  }
  &:disabled {
    opacity: 1;
    background-color: $light-info-color;
    &::before {
      background: none;
    }
  }
  path {
    transition: all $transition-time;
    fill: $text-color;
  }
  &:hover:not(:disabled) {
    cursor: pointer;
    color: $primary-color;
    border: solid 1px $primary-color;
    background-image: linear-gradient(90deg, $text-color, $text-color);
    &::before {
      opacity: 0;
    }
    path {
      fill: $primary-color;
    }
  }
  .right-arrow-icon {
    position: absolute;
    top: auto;
    right: 8px;
    width: 18px;
    height: 18px;
  }
  .left-arrow-icon {
    position: absolute;
    top: auto;
    left: 8px;
    width: 18px;
    height: 18px;
    transform: rotate(180deg);
  }
  .up-right-square-icon {
    position: absolute;
    top: auto;
    right: 14px;
  }
  .search-icon {
    position: absolute;
    top: auto;
    right: 14px;
    width: 12px;
    height: 12px;
  }
  .download-icon {
    position: absolute;
    top: auto;
    right: 14px;
  }
  .reload-icon {
    position: absolute;
    top: auto;
    right: 9px;
    width: 18px;
    height: 18px;
  }
  .lock-icon {
    position: absolute;
    top: auto;
    right: 14px;
  }
  .light-icon {
    position: absolute;
    top: auto;
    right: 10px;
    width: 19px;
  }
}
</style>
