<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SELECTABLE_LINE_MAX_COUNTS } from '@/api/rinkLines/constants'
import type { RinkLineListType } from '@/api/rinkLines/types'

type PropType = {
  lineGroupId: string
  lineList: RinkLineListType[]
  editType: 'add' | 'remove'
  isConfirmation?: boolean
}
const props = defineProps<PropType>()
const editLineNumberList = defineModel<string[]>('lineNumberList', { required: true })

const { t } = useI18n()

const currentSelectedLineNumberList = ref<string[]>([])
const selectedLineNumberList = ref<string[]>([])

const remainCount = computed(() => SELECTABLE_LINE_MAX_COUNTS - editLineNumberList.value.length)
const currentLineTableItems = computed(() => {
  return props.lineList.reduce<Array<{ lineNumber: string; planName: string; disabled: boolean }>>((list, line) => {
    if (editLineNumberList.value.includes(line.lineNumber)) {
      if (props.editType === 'add') {
        list.push({
          lineNumber: line.lineNumber,
          planName: line.planName,
          disabled: false,
        })
      } else {
        return list
      }
    }
    if (line.lineGroupId === props.lineGroupId) {
      list.push({
        lineNumber: line.lineNumber,
        planName: line.planName,
        disabled: props.editType === 'add' || SELECTABLE_LINE_MAX_COUNTS <= editLineNumberList.value.length,
      })
    }
    return list
  }, [])
})
const lineTableItems = computed(() => {
  return props.lineList.reduce<Array<{ lineNumber: string; planName: string; disabled: boolean }>>((list, line) => {
    // 回線削除の時は容量シェアグループから移動した回線のみテーブル表示する
    if (props.editType === 'remove') {
      if (editLineNumberList.value.includes(line.lineNumber)) {
        list.push({
          lineNumber: line.lineNumber,
          planName: line.planName,
          disabled: false,
        })
      }
      return list
    }
    // 回線追加の時回線一覧テーブル
    if (line.lineGroupId !== props.lineGroupId && !editLineNumberList.value.includes(line.lineNumber)) {
      list.push({
        lineNumber: line.lineNumber,
        planName: line.planName,
        disabled: SELECTABLE_LINE_MAX_COUNTS <= editLineNumberList.value.length,
      })
    }
    return list
  }, [])
})
const confirmationLineTableItems = computed(() =>
  (props.editType === 'add' ? currentLineTableItems : lineTableItems).value.filter(item =>
    editLineNumberList.value.includes(item.lineNumber),
  ),
)
const addDisabled = computed(() => selectedLineNumberList.value.length === 0)
const removeDisabled = computed(() => currentSelectedLineNumberList.value.length === 0)
const confirmationTitle = computed(() =>
  props.editType === 'add' ? t('rinkLineGroups.addLineList') : t('rinkLineGroups.deleteLineList'),
)

const handleCurrentToLineList = () => {
  if (props.editType === 'add') {
    editLineNumberList.value = editLineNumberList.value.filter(
      num => !currentSelectedLineNumberList.value.includes(num),
    )
    currentSelectedLineNumberList.value = []
  } else {
    editLineNumberList.value = [...editLineNumberList.value, ...currentSelectedLineNumberList.value]
    currentSelectedLineNumberList.value = []
  }
}
const handleLineListToCurrent = () => {
  if (props.editType === 'add') {
    editLineNumberList.value = [...editLineNumberList.value, ...selectedLineNumberList.value]
    selectedLineNumberList.value = []
  } else {
    editLineNumberList.value = editLineNumberList.value.filter(num => !selectedLineNumberList.value.includes(num))
    selectedLineNumberList.value = []
  }
}

watch(
  () => props.lineList,
  () => {
    currentSelectedLineNumberList.value = []
    selectedLineNumberList.value = []
  },
)
</script>

<template>
  <InnerCard v-if="isConfirmation" :title="confirmationTitle">
    <RinkLineTable
      v-model:selected-line-number-list="selectedLineNumberList"
      :items="confirmationLineTableItems"
      disabled
      data-cy="edit-rink-line-confirmation-line-table"
    />
  </InnerCard>
  <div v-else class="edit-rink-line-scroll-wrapper">
    <div class="edit-rink-line-container flex-center-flex-start">
      <InnerCard :title="t('rinkLineGroups.lineList')">
        <RinkLineTable
          v-model:selected-line-number-list="currentSelectedLineNumberList"
          :items="currentLineTableItems"
          :max-count="editType === 'remove' ? remainCount : undefined"
          data-cy="edit-rink-line-current-line-table"
        />
      </InnerCard>
      <div class="px-5 mt-10">
        <CustomButton
          :text="t('common.select')"
          :disabled="addDisabled"
          :width="180"
          icon="left-arrow"
          data-cy="edit-rink-line-add-button"
          @click="handleLineListToCurrent"
        />
        <CustomButton
          class="mt-3"
          :text="t('common.select')"
          :disabled="removeDisabled"
          :width="180"
          icon="right-arrow"
          data-cy="edit-rink-line-remove-button"
          @click="handleCurrentToLineList"
        />
      </div>
      <InnerCard :title="`${t('sideBar.rinkLines')} ${t('common.list')}`">
        <RinkLineTable
          v-model:selected-line-number-list="selectedLineNumberList"
          :items="lineTableItems"
          :max-count="editType === 'add' ? remainCount : undefined"
          data-cy="edit-rink-line-line-table"
        />
      </InnerCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.edit-rink-line-scroll-wrapper {
  overflow-x: auto;
}
.edit-rink-line-container {
  min-width: 1130px;
}
</style>
