<script setup lang="ts">
type PropType = {
  limit: number
  total: number
}
const props = defineProps<PropType>()
const page = defineModel<number>('page', { required: true })

const pageMax = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))
</script>

<template>
  <v-pagination
    v-model="page"
    :length="pageMax"
    :total-visible="5"
    first-icon="nova:chevron-left-double"
    prev-icon="nova:chevron-left"
    next-icon="nova:chevron-right"
    last-icon="nova:chevron-right-double"
    show-first-last-page
    density="compact"
    variant="text"
    class="pagination-navigation"
  />
</template>

<style lang="scss" scoped>
.pagination-navigation {
  // 選択されていないページ番号の文字色を info にする
  :deep(.v-pagination__item:not(.v-pagination__item--is-active) .v-btn) {
    color: rgb(var(--v-theme-info));
  }

  :deep(.v-pagination__item--is-active) {
    .v-btn {
      font-weight: bold;
      background-color: rgb(var(--v-theme-surface));
      border: 1px solid rgb(var(--v-theme-info-lighten-3));
    }

    // 選択中アイテムに重なるグレーの overlay を無効化して白背景を見せる
    .v-btn__overlay {
      opacity: 0;
    }
  }

  :deep(.v-pagination__first .v-icon),
  :deep(.v-pagination__prev .v-icon),
  :deep(.v-pagination__next .v-icon),
  :deep(.v-pagination__last .v-icon) {
    font-size: 0.875rem;
    // チェブロン SVG は下側に余白があり上寄りに見えるため、下方向へ微調整して中央に揃える
    transform: translateY(1.5px);
  }
}
</style>
