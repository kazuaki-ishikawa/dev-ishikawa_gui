<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const rules = useRules()
const { lengthRule } = useBreakOut()

const formValid = ref(false)
const isConfirmation = ref(false)
const original = ref({
  dstPrefixList: ['192.0.2.0/24', '192.0.12.0/24', '192.0.112.0/24'] as string[],
  fqdnList: 'example.cpm\n*.exa.com',
  prefixList: '111.0.2.0/24\n111.0.12.0/24\n111.0.112.0/24',
})
const model = ref({ dstPrefixList: [] as string[], fqdnList: '', prefixList: '' })

const fqdnList = computed(() =>
  model.value.fqdnList ? Array.from(new Set(model.value.fqdnList.split('\n').filter(Boolean))) : undefined,
)
const prefixList = computed(() =>
  model.value.prefixList ? Array.from(new Set(model.value.prefixList.split('\n').filter(Boolean))) : undefined,
)

const length = computed(() => ({
  fqdnList: fqdnList.value?.length ?? 0,
  prefixList: prefixList.value?.length ?? 0,
  total: (fqdnList.value?.length ?? 0) + (prefixList.value?.length ?? 0),
}))
</script>

<template>
  <v-form v-model="formValid">
    <div>originalなし（新規作成）</div>
    <NovaInputGrid label="required" required>
      <NovaTextareaForm
        :input-props="{
          placeholder: t('breakOut.placeholder.prefixList'),
          rules: [rules.prefixList],
          required: true,
        }"
        :model-value="model.dstPrefixList.join('\n')"
        :is-confirmation="isConfirmation"
        @update:model-value="(value: string) => (model.dstPrefixList = value.split('\n'))"
      >
        <template #explanation>explanation test</template>
      </NovaTextareaForm>
    </NovaInputGrid>

    <NovaInputGrid label="disabled" :required="length.total === 0">
      <NovaTextareaForm
        v-model="model.prefixList"
        :input-props="{
          placeholder: t('breakOut.placeholder.prefixList'),
          rules: [lengthRule(length.total), rules.prefixList],
          required: length.total === 0,
          disabled: true,
          maxLength: 100,
        }"
        :is-confirmation="isConfirmation"
      />
    </NovaInputGrid>

    <NovaInputGrid label="append/maxLength:1000" :required="length.total === 0">
      <NovaTextareaForm
        v-model="model.fqdnList"
        :input-props="{
          placeholder: t('breakOut.placeholder.fqdnList'),
          rules: [lengthRule(length.total), rules.fqdnList],
          required: length.total === 0,
          maxLength: 1000,
        }"
      >
        <template #append>
          <div>{{ length.fqdnList + t('breakOut.listUnit') }}</div>
        </template>
      </NovaTextareaForm>
    </NovaInputGrid>

    <div>originalあり（変更画面）</div>
    <NovaInputGrid label="required" required>
      <NovaTextareaForm
        :input-props="{
          placeholder: t('breakOut.placeholder.prefixList'),
          rules: [rules.prefixList],
          required: true,
        }"
        :model-value="model.dstPrefixList.join('\n')"
        :is-confirmation="isConfirmation"
        :original="original.dstPrefixList.join('\n')"
        @update:model-value="(value: string) => (model.dstPrefixList = value.split('\n'))"
      >
        <template #explanation>{{ `オリジナル: ${original.dstPrefixList}` }}</template>
      </NovaTextareaForm>
    </NovaInputGrid>

    <NovaInputGrid label="disabled" :required="length.total === 0">
      <NovaTextareaForm
        v-model="model.prefixList"
        :input-props="{
          placeholder: t('breakOut.placeholder.prefixList'),
          rules: [lengthRule(length.total), rules.prefixList],
          required: length.total === 0,
          disabled: true,
        }"
        :is-confirmation="isConfirmation"
        :original="original.prefixList"
      >
        <template #explanation>{{ `オリジナル: ${original.prefixList}` }}</template>
      </NovaTextareaForm>
    </NovaInputGrid>

    <NovaInputGrid label="append/maxLength:1000" :required="length.total === 0">
      <NovaTextareaForm
        v-model="model.fqdnList"
        :input-props="{
          placeholder: t('breakOut.placeholder.fqdnList'),
          rules: [lengthRule(length.total), rules.fqdnList],
          required: length.total === 0,
          maxLength: 1000,
        }"
        :original="original.fqdnList"
        :is-confirmation="isConfirmation"
      >
        <template #append>
          <div>{{ length.fqdnList + t('breakOut.listUnit') }}</div>
        </template>
        <template #explanation>{{ `オリジナル: ${original.fqdnList}` }}</template>
      </NovaTextareaForm>
    </NovaInputGrid>
    <v-btn :disabled="!formValid" @click.stop="isConfirmation = !isConfirmation">
      formValid: {{ formValid }} / isConfirmation: {{ isConfirmation }}
    </v-btn>
  </v-form>
</template>
