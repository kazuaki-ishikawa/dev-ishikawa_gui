<script lang="ts" setup>
import type { IconSize, IconType } from '@/components/icons/constants'
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  type: IconType
  disabled?: boolean
  color?: (typeof ColorKeyList)[number]
  size?: keyof typeof IconSize
}
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
  color: undefined,
  size: 'middle',
})

type Emits = {
  (e: 'click'): void
}
const emit = defineEmits<Emits>()

const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}

const bindColor = computed(() => (props.disabled ? { lightColor: 'info' as const } : { color: props.color }))
</script>

<template>
  <div class="hover-opacity d-flex cursor-pointer" :class="{ disabled }" @click="handleClick">
    <SvgIcon :type="type" v-bind="bindColor" :size="size" />
  </div>
</template>

<style scoped lang="scss">
.hover-opacity {
  &:hover {
    opacity: 0.5;
  }
}
.disabled {
  &:hover {
    cursor: auto;
    opacity: 1;
  }
}
</style>
