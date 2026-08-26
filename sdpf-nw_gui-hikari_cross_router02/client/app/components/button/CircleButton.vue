<script lang="ts" setup>
import DownloadIcon from '~icons/ztgict/download'
import PlusIcon from '~icons/ztgict/plus'
import TrushIcon from '~icons/ztgict/trush'
import SearchIcon from '~icons/ztgict/search'
import EditIcon from '~icons/ztgict/quick-setup'
import CaretRightIcon from '~icons/ztgict/caret-right'
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  icon: 'plus' | 'trush' | 'download' | 'edit' | 'search' | 'caret-right' | 'caret-left'
  color?: (typeof ColorKeyList)[number]
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  color: 'primary',
  disabled: false,
})

const primaryColor = computed(() => `rgb(var(--v-theme-${props.color}))`)
const lightColor = computed(() => `rgb(var(--v-theme-light-${props.color}))`)
</script>

<template>
  <v-btn :disabled="props.disabled" :ripple="false" variant="text" size="30" icon class="button">
    <PlusIcon v-if="props.icon === 'plus'" class="plus-icon" />
    <TrushIcon v-else-if="props.icon === 'trush'" class="trush-icon" />
    <DownloadIcon v-else-if="props.icon === 'download'" class="download-icon" />
    <SearchIcon v-else-if="props.icon === 'search'" class="search-icon" />
    <EditIcon v-else-if="props.icon === 'edit'" class="edit-icon" />
    <CaretRightIcon v-else-if="props.icon === 'caret-right'" class="caret-right-icon" />
    <CaretRightIcon v-else-if="props.icon === 'caret-left'" class="caret-left-icon" />
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
  color: $text-color;
  transition: all $transition-time;
  /* background: linear-gradient には transition が効かないため
  // ::before 疑似要素 の opacity を変化させて疑似的に transition を再現する */
  &::before {
    content: '';
    background: linear-gradient(90deg, $light-color, $primary-color);
    border-radius: 50%;
    position: absolute;
    width: 100%;
    height: 100%;
    transition: all $transition-time;
  }
  &:disabled {
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
  .plus-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 13px;
    height: 13px;
  }
  .trush-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 15px;
    height: 18px;
  }
  .download-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
  }
  .search-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 15px;
    height: 15px;
  }
  .edit-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
  }
  .caret-right-icon {
    position: absolute;
    top: 50%;
    left: 55%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
  }
  .caret-left-icon {
    position: absolute;
    top: 50%;
    left: 45%;
    width: 12px;
    height: 12px;
    transform: translate(-50%, -50%) rotate(180deg);
  }
}
</style>
