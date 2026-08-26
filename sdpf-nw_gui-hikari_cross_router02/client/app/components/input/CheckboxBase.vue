<script lang="ts" setup>
type PropType = {
  error?: boolean
  disabled?: boolean
  indeterminate?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  error: false,
  disabled: false,
  indeterminate: false,
})
const model = defineModel<boolean>('value', { required: true })

const checkboxClass = computed(() => {
  const list = ['checkbox']
  if (props.disabled) {
    list.push('disabled')
  }
  if (props.error) {
    list.push('error')
  }

  if (model.value) {
    return [...list, 'checked'].join(' ')
  } else if (props.indeterminate) {
    return [...list, 'indeterminate'].join(' ')
  } else {
    return list.join(' ')
  }
})
const handleClick = (checked: boolean) => {
  if (!props.disabled) {
    model.value = checked
  }
}
</script>

<template>
  <div :class="checkboxClass" @click="handleClick(!model)" />
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));
$warning-color: rgb(var(--v-theme-warning));
$light-info-color: rgb(var(--v-theme-light-info));

.checkbox {
  position: relative;
  width: 15px;
  height: 15px;
  margin: 8px 1.6px;
  cursor: pointer;
  &::before {
    content: '';
    display: block;
    width: 15px;
    height: 15px;
    border-radius: 0.2rem;
    border: 2px solid $info-color;
    background-color: #fff;
    position: absolute;
    top: -2px;
    left: 0;
  }
  &::after {
    content: '';
    display: block;
    height: 5px;
    width: 9px;
    transform: rotate(-45deg);
    position: absolute;
    top: 2px;
    left: 4px;
  }
  &.indeterminate {
    &::before {
      border: 1px solid $secondary-color;
      background-color: $secondary-color;
    }
    &::after {
      border-bottom: 2px solid #fff;
      transform: rotate(0deg);
      left: 4.2px;
    }
  }
  &.checked {
    &::before {
      border: 2px solid $secondary-color;
      background-color: $secondary-color;
    }
    &::after {
      border-bottom: 2px solid #fff;
      border-left: 2px solid #fff;
    }
  }
  &.error {
    &::before {
      border: 2px solid $warning-color;
    }
    &.checked::before {
      border: 2px solid $warning-color;
      background-color: $warning-color;
    }
  }
  &.disabled {
    cursor: auto;
    &::before {
      border: 2px solid $light-info-color;
      background-color: v.$light-info-alpha-color;
    }
    &.checked::before {
      border: 2px solid $light-info-color;
      background-color: $light-info-color;
    }
  }
}
</style>
