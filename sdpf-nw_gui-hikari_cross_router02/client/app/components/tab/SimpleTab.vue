<script lang="ts" setup generic="T extends string">
import type { IconType } from '@/components/icons/constants'

type TabType = { text: string; name: T; disabled?: boolean; icon?: IconType }
type PropType = {
  tabs: TabType[]
  currentTabName: T
  disabled?: boolean
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'click', name: T): void
}
const emits = defineEmits<Emits>()
const handleClick = (value: T) => {
  if (props.currentTabName !== value) {
    emits('click', value)
  }
}
</script>

<template>
  <div class="tab-container">
    <div class="d-flex">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="min-w-100px w-100 text-center"
        :class="[tab.name === currentTabName ? 'current-button' : 'button']"
        :disabled="disabled || tab.disabled"
        @click="() => handleClick(tab.name)"
      >
        <div class="position-relative text-pre-wrap">
          {{ tab.text }}
          <SvgIcon v-if="tab.icon" :type="tab.icon" size="small" />
        </div>
      </button>
    </div>
    <slot />
    <slot :name="currentTabName" />
  </div>
</template>

<style lang="scss" scoped>
$transition-time: 0.5s;
$text-color: #ffffff;
$primary-color: rgb(var(--v-theme-primary));
$secondary-color: rgb(var(--v-theme-secondary));
$light-primary-color: rgb(var(--v-theme-light-primary));
$info-color: rgb(var(--v-theme-info));
$light-info-color: rgb(var(--v-theme-light-info));

.tab-container {
  overflow: visible;
  .min-w-100px {
    min-width: 100px;
  }
  .common-button {
    padding: 0.85rem 0.5rem;
    border-top-left-radius: 0.25rem 0.25rem;
    border-top-right-radius: 0.25rem 0.25rem;
    border: solid 1px $text-color;
    border-bottom: none;
    position: relative;
    transition: all $transition-time;
    &:disabled {
      border: solid 1px $text-color;
      color: $text-color;
      background-color: $light-info-color;
      border-bottom: none;
      &::before {
        background: none;
      }
    }
  }
  .button {
    @extend .common-button;
    color: $primary-color;
    &::before {
      content: '';
      border-top-left-radius: 0.25rem 0.25rem;
      border-top-right-radius: 0.25rem 0.25rem;
      background: $light-primary-color;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transition: all $transition-time;
    }
    &:hover:not(:disabled) {
      cursor: pointer;
      color: $text-color;
      background: linear-gradient(90deg, $secondary-color, $primary-color);
      &::before {
        opacity: 0;
      }
    }
  }
  .current-button {
    @extend .common-button;
    color: $text-color;
    /* background: linear-gradient には transition が効かないため
    // ::before 疑似要素 の opacity を変化させて疑似的に transition を再現する */
    &::before {
      content: '';
      border-top-left-radius: 0.25rem 0.25rem;
      border-top-right-radius: 0.25rem 0.25rem;
      background: linear-gradient(90deg, $secondary-color, $primary-color);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transition: all $transition-time;
    }
  }
}
</style>
