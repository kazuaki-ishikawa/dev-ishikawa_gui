<script setup lang="ts" generic="T">
import type { VInput } from 'vuetify/components'
import type { RuleType } from '@/components/nova/form/types'

type PropType = {
  value: T
  rules?: RuleType<T>[]
  hideDetails?: 'auto' | boolean
  width?: string
}
withDefaults(defineProps<PropType>(), {
  hideDetails: 'auto',
})

const inputRef = useTemplateRef<InstanceType<typeof VInput>>('inputRef')
const isInvalid = computed(() => inputRef.value?.isValid === false)
</script>

<template>
  <v-input
    ref="inputRef"
    :model-value="value"
    :rules="rules"
    :hide-details="hideDetails"
    validate-on="eager"
    style="height: fit-content"
  >
    <slot v-bind="{ invalid: isInvalid }" />

    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

    <template v-if="$slots.explanation" #details>
      <div class="explanation text-pre-wrap text-info text-sm">
        <slot name="explanation" />
      </div>
    </template>

    <template #message="{ message }">
      <v-icon size="20" icon="nova:alert-circle" color="error" class="my-auto" />
      <div>{{ message }}</div>
    </template>
  </v-input>
</template>

<style lang="scss" scoped>
:deep(.custom-text-field),
:deep(.custom-textarea),
:deep(.custom-select) {
  width: fit-content;
  flex-grow: 0;
  > .v-input__control {
    width: v-bind(width);
  }
}

:deep(.v-messages) {
  min-height: 0 !important;
}
:deep(.v-messages__message) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  line-height: normal;
  font-size: 0.85rem;
}
/*
* ─── .v-input__details : メッセージ欄の配置 ───
* explanation と errorMessage を縦に並べて左寄せにする
*/
:deep(.v-input__details) {
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding-inline: 0;
}

/*
* ─── slot#explanation の表示順 ───
* Vuetify は #details を .v-messages(errorMessage)の後に描画するため、
* そのままだと下に来てしまう。order: -1 で順序を反転させて上に表示する
*/
.explanation {
  margin-bottom: 0.25rem;
  order: -1;
}

/*
  * ─── .slide-y-transition-leave-active : メッセージ切替時の退場アニメーション ───
  * エラー文言の切替時に旧メッセージの退場アニメーション中、メッセージと上下に重なるのを、
  * 退場側のトランジションを消して旧メッセージを即座に消すことで防ぐ
  */
:deep(.v-input__details .slide-y-transition-leave-active) {
  transition: none !important;
}
</style>
