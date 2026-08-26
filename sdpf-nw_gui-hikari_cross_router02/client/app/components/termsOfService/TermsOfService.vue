<script lang="ts" setup>
// width と height には CSS で使用可能なすべての値が使える
// width/height に数値を入れた場合には px として解釈される
type PropType = {
  width?: string | number
  height?: string | number
}
const props = withDefaults(defineProps<PropType>(), {
  width: 'auto',
  height: 'auto',
})

const containerWidth = computed(() => (Number.isFinite(props.width) ? `${props.width}px` : props.width))
const containerHeight = computed(() => (Number.isFinite(props.height) ? `${props.height}px` : props.height))
const containerRef = ref<HTMLElement>()
</script>

<template>
  <div ref="containerRef" class="term-of-service-container pa-4 bg-white">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.term-of-service-container {
  width: v-bind(containerWidth);
  height: v-bind(containerHeight);
  overflow-y: auto;
  border-radius: v.$child-border-radius;
  border: 0.1rem solid #000;
  clip-path: inset(0 round v.$child-border-radius);
}
</style>
