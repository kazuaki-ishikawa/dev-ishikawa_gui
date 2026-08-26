<script lang="ts" setup>
type PropType = {
  text: number | string
  selected?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  selected: false,
})
</script>

<template>
  <CustomButton v-if="props.selected" class="mx-1" :text="`${props.text}`" :width="36" />
  <ClearButton v-else class="mx-1" :text="`${props.text}`" :width="36" />
</template>
