<script lang="ts" setup generic="T extends Required<{ id: string }>">
type PropType = {
  values: Array<T>
  disabled?: boolean
  minItems?: number
  maxItems?: number
}
const props = withDefaults(defineProps<PropType>(), {
  required: false,
  disabled: false,
  minItems: 0,
})

type Emits = {
  (e: 'click:add'): void
  (e: 'click:remove', index: number): void
}
const emits = defineEmits<Emits>()
const addDisabled = computed(() => props?.maxItems !== undefined && props.maxItems <= props.values.length)
</script>

<template>
  <div>
    <div v-for="(data, index) in values" :key="data.id" class="multiple-form">
      <div class="px-2 py-2">
        <slot name="child" :data="data" :index="index">{{ data }}</slot>
      </div>
      <div v-if="!disabled" class="flex-center-center">
        <CircleButton
          v-if="minItems <= index"
          icon="trush"
          color="info"
          data-cy="multiple-form-trash-button"
          @click="() => emits('click:remove', index)"
        />
      </div>
    </div>
    <div v-if="!disabled" class="multiple-add flex-center-center">
      <CircleButton icon="plus" :disabled="addDisabled" @click="emits('click:add')" />
    </div>
  </div>
</template>

<style scoped lang="scss">
$light-primary-color: rgb(var(--v-theme-light-primary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));

.multiple-form {
  display: grid;
  grid-template-columns: 1fr 55px;
  > :first-child {
    border-right: 1px dashed $light-primary-color;
  }
  &:nth-of-type(odd) {
    background-color: $light-secondary-color;
  }
  &:nth-of-type(even) {
    background-color: #fff;
  }
}
.multiple-add {
  margin-left: auto;
  padding-top: 0.5rem;
  width: 55px;
}
</style>
