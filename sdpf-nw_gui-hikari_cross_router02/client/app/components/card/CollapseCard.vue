<script lang="ts" setup>
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  title: string
  defaultOpen?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  defaultOpen: false,
})

const open = ref(false)
const bottomBorderRadius = computed(() => ({
  borderBottomLeftRadius: open.value ? '0px' : undefined,
  borderBottomRightRadius: open.value ? '0px' : undefined,
}))
watchEffect(() => (open.value = props.defaultOpen))
</script>

<template>
  <div class="collapse-card">
    <div class="header flex-space-between-center" :style="bottomBorderRadius" @click.stop="open = !open">
      <div class="flex-flex-start-center">
        <div class="text-lg">{{ props.title }}</div>
        <HelpTooltip v-if="$slots.help" class="px-2 pt-1" size="smallMiddle" color="white">
          <slot name="help" />
        </HelpTooltip>
      </div>
      <div class="d-flex" :class="open ? 'arrow-down' : 'arrow-up'">
        <SvgIcon :type="IconTypes.ChevronUp" />
      </div>
    </div>
    <Transition name="collapse" class="content">
      <div v-show="open">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
$transition: all 0.3s ease-in-out;
$secondary-color: rgb(var(--v-theme-secondary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));

.padding {
  padding: 0.75rem 1.25rem;
}
.collapse-card {
  border-radius: v.$child-border-radius;
  background-color: rgb(var(--v-theme-highlight));
  margin-bottom: 1rem;
  .header {
    @extend .padding;
    background-color: $secondary-color;
    color: $light-secondary-color;
    border-radius: v.$child-border-radius;
    transition: $transition;
    cursor: pointer;
    .arrow-up {
      transition: $transition;
      transform: rotateZ(0);
    }
    .arrow-down {
      transition: $transition;
      transform: rotateZ(-180deg);
    }
  }
  .content {
    @extend .padding;
  }
}

.collapse-enter-active,
.collapse-leave-active {
  transition: $transition;
}

.collapse-enter-from,
.collapse-leave-to {
  transform: translateY(-5px);
  opacity: 0;
}
</style>
