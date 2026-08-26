<script lang="ts" setup>
import { IconTypes } from '@/components/icons/constants'

type IconColor = { lightColor?: 'info'; color?: 'secondary' }

type PropType = {
  limit?: number
  total?: number
}
const props = withDefaults(defineProps<PropType>(), {
  limit: 10,
  total: 0,
})
const page = defineModel<number>('page', { default: 1 })

const disabledLeftIcon = computed(() => page.value <= 1)
const leftIconClass = computed(() => `rotate-180 ${disabledLeftIcon.value ? 'disabled' : ''}`)
const leftIconColor = computed<IconColor>(() => ({
  lightColor: disabledLeftIcon.value ? 'info' : undefined,
  color: disabledLeftIcon.value ? undefined : 'secondary',
}))

const disabledRightIcon = computed(() => props.total <= props.limit * (page.value - 1) + props.limit)
const rightIconClass = computed(() => (disabledRightIcon.value ? 'disabled' : ''))
const rightIconColor = computed<IconColor>(() => ({
  lightColor: disabledRightIcon.value ? 'info' : undefined,
  color: disabledRightIcon.value ? undefined : 'secondary',
}))

const pageMax = computed(() => Math.ceil(props.total / props.limit))

const handleLeftForwardClick = () => {
  if (!disabledLeftIcon.value) {
    page.value = 1
  }
}
const handleLeftClick = () => {
  if (!disabledLeftIcon.value) {
    page.value -= 1
  }
}
const handleRightForwardClick = () => {
  if (!disabledRightIcon.value) {
    page.value = pageMax.value
  }
}
const handleRightClick = () => {
  if (!disabledRightIcon.value) {
    page.value += 1
  }
}
</script>

<template>
  <div class="pagination-footer flex-center-center mt-3 bg-white py-2">
    <div class="d-flex mx-3 cursor-pointer" :class="leftIconClass" @click.stop="handleLeftForwardClick">
      <SvgIcon :type="IconTypes.Forward" :light-color="leftIconColor.lightColor" :color="leftIconColor.color" />
    </div>
    <div class="d-flex mx-3 cursor-pointer" :class="leftIconClass" @click.stop="handleLeftClick">
      <SvgIcon
        :type="IconTypes.CaretRight"
        :light-color="leftIconColor.lightColor"
        :color="leftIconColor.color"
        size="small"
      />
    </div>
    <div class="d-flex pl-2">
      <PageNumberButton text="1" :selected="page <= 1" @click="page = 1" />
      <div v-if="page >= 4" class="text-center mx-2">...</div>
      <PageNumberButton v-if="page >= 3" :text="page - 1" @click="page -= 1" />
      <PageNumberButton v-if="page >= 2 && page <= pageMax - 1" :text="page" selected @click="page = page" />
      <PageNumberButton v-if="page <= pageMax - 2" :text="page + 1" @click="page += 1" />
      <div v-if="page <= pageMax - 3" class="text-center mx-2">...</div>
      <PageNumberButton v-if="pageMax >= 2" :text="pageMax" :selected="page === pageMax" @click="page = pageMax" />
    </div>

    <div class="d-flex mx-3 cursor-pointer" :class="rightIconClass" @click.stop="handleRightClick">
      <SvgIcon
        :type="IconTypes.CaretRight"
        :light-color="rightIconColor.lightColor"
        :color="rightIconColor.color"
        size="small"
      />
    </div>
    <div class="d-flex mx-3 cursor-pointer" :class="rightIconClass" @click.stop="handleRightForwardClick">
      <SvgIcon :type="IconTypes.Forward" :light-color="rightIconColor.lightColor" :color="rightIconColor.color" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pagination-footer {
  border-radius: 0.75rem;
  .disabled {
    cursor: auto;
  }
  .rotate-180 {
    transform: rotate(180deg);
  }
}
</style>
