<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import type { CustomTooltipPropType } from './types'

const props = withDefaults(defineProps<CustomTooltipPropType>(), {
  contentWidth: 300,
})

const tooltip = ref<HTMLDivElement | null>(null)
const container = ref<HTMLDivElement | null>(null)

const tooltipRect = ref<DOMRect>()
const containerRact = ref<DOMRect>()
const containerStyle = ref<CSSProperties>({ visibility: 'hidden', top: '0px', left: '0px' })
const beakPosition = ref({ bottom: '-15px', left: '8.5px', transform: 'scale(1)' })
const hideTimeout = ref<NodeJS.Timeout | null>(null)

const contentMaxWidth = computed(() => `${props.contentWidth}px`)
const containerHeight = computed(() => containerRact.value?.height ?? 0)

watchEffect(() => {
  const offsetParent = tooltip.value?.offsetParent
  const offsetParentRact = offsetParent?.getClientRects()[0]
  const tooltipRectTop = tooltipRect.value?.top ?? 0
  const tooltipRectLeft = tooltipRect.value?.left ?? 0
  const tooltipRectHeight = tooltipRect.value?.height ?? 0
  const visibility = tooltipRect.value ? 'visible' : 'hidden'
  const inversionTop = tooltipRectTop < containerHeight.value

  if (offsetParent?.className === 'dialog-card') {
    // ダイアログ(基準が absolute になる)の場合
    const dialogTop = tooltipRectTop - containerHeight.value - (offsetParentRact?.top ?? 0) - 5
    const dialogLeft = tooltipRectLeft - (offsetParentRact?.left ?? 0)
    const inversionLeft = (offsetParentRact?.width ?? 0) - dialogLeft < props.contentWidth
    beakPosition.value = {
      // top までの距離が container の高さより小さい場合、下側に表示する
      bottom: inversionTop ? `${containerHeight.value}px` : '-15px',
      // left までの距離が container の幅より小さい場合、左側に表示する
      left: inversionLeft ? `${props.contentWidth}px` : '8.5px',
      transform: inversionTop ? 'scale(1, -1)' : 'scale(1)',
    }
    containerStyle.value = {
      visibility,
      // top までの距離が container の高さより小さい場合、下側に表示する
      top: `${inversionTop ? dialogTop + containerHeight.value + tooltipRectHeight : dialogTop}px`,
      // left までの距離が container の幅より小さい場合、左側に表示する
      left: `${inversionLeft ? dialogLeft - props.contentWidth : dialogLeft}px`,
    }
    return
  }

  const inversionLeft = window.innerWidth - tooltipRectLeft < props.contentWidth
  beakPosition.value = {
    // top までの距離が container の高さより小さい場合、下側に表示する
    bottom: inversionTop ? `${containerHeight.value}px` : '-15px',
    // left までの距離が container の幅より小さい場合、左側に表示する
    left: inversionLeft ? `${props.contentWidth}px` : '8.5px',
    transform: inversionTop ? 'scale(1, -1)' : 'scale(1)',
  }
  containerStyle.value = {
    visibility,
    // top までの距離が container の高さより小さい場合、下側に表示する
    top: `${inversionTop ? tooltipRectTop + tooltipRectHeight + 5 : tooltipRectTop - containerHeight.value - 5}px`,
    // left までの距離が container の幅より小さい場合、左側に表示する
    left: `${inversionLeft ? tooltipRectLeft - props.contentWidth : tooltipRectLeft}px`,
  }
})

const mouseover = () => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
    hideTimeout.value = null
  }
  tooltipRect.value = tooltip.value?.getClientRects()[0]
  containerRact.value = container.value?.getClientRects()[0]
}
const mouseleave = () => {
  hideTimeout.value = setTimeout(() => {
    tooltipRect.value = undefined
    containerRact.value = undefined
  }, 300) // 300ms の遅延（Material Design の推奨値）
}
</script>

<template>
  <div ref="tooltip" class="help-tooltip" @mouseover.stop="mouseover" @mouseleave.stop="mouseleave">
    <slot name="activator" />
    <div
      ref="container"
      class="tooltip-container"
      :style="containerStyle"
      @mouseover.stop="mouseover"
      @mouseleave.stop="mouseleave"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$max-width: v-bind(contentMaxWidth);
$bg-color: #fff;
$info-color: rgb(var(--v-theme-info));
$light-info-color: rgb(var(--v-theme-light-info));
$beak-bottom: v-bind('beakPosition.bottom');
$beak-left: v-bind('beakPosition.left');
$beak-transform: v-bind('beakPosition.transform');

.help-tooltip {
  cursor: pointer;

  .tooltip-container {
    position: fixed;
    z-index: v.$tooltip-z-index;
    width: $max-width;
    padding: 0.5rem 0.85rem;
    color: $info-color;
    background-color: $bg-color;
    box-shadow: 0.1rem 0.2rem 0.7rem $light-info-color;
    border-radius: 5px;
    white-space: pre-wrap;
    word-break: break-all;
    &:before {
      content: '';
      width: 0;
      height: 0;
      border: 6px solid transparent;
      border-top: 10px solid $bg-color;
      position: absolute;
      bottom: $beak-bottom;
      left: $beak-left;
      transform: $beak-transform;
    }
  }
}
</style>
