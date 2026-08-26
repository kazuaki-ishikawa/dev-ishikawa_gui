<script setup lang="ts">
import type { RadioFormOptionType as NovaRadioFormOptionType } from '@/components/nova/form/types'

const model = ref('normal')
const original = ref('normal')

const options: NovaRadioFormOptionType<string>[] = [
  { text: '通常', value: 'normal', help: '標準プラン' },
  {
    text: '--------------------文章が長い場合は折り返します--------------------',
    value: 'long',
    help: 'ラベル折り返し確認用',
  },
  {
    text: 'help（長文）',
    value: 'help',
    help: 'ヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキスト',
  },
  { text: 'noteなし', value: 'no-note' },
  { text: 'disabled', value: 'disabled', disabled: true, help: '選択不可' },
]
const optionsWithoutNote: NovaRadioFormOptionType<string>[] = [
  { text: '通常', value: 'normal' },
  {
    text: '文章の長さによって縦幅が変わります',
    value: 'long',
  },
  { text: 'disabled', value: 'disabled', disabled: true },
]

const formValid = ref<boolean | null>(null)
const isConfirmation = ref(false)
const disabled = ref(false)
</script>

<template>
  <CardContainer>
    <InnerCard title="NovaRadioCardForm 動作確認">
      <v-form v-model="formValid">
        <NovaInputGrid label="基本" required>
          <NovaRadioCardForm
            v-model="model"
            :original="original"
            :is-confirmation="isConfirmation"
            :input-props="{ options, disabled }"
          />
        </NovaInputGrid>

        <NovaInputGrid label="title / note slot 差し替え" required>
          <NovaRadioCardForm
            v-model="model"
            :original="original"
            :is-confirmation="isConfirmation"
            :input-props="{ options }"
          >
            <template #title="{ option }">
              <span>{{ option.text }}</span>
            </template>
            <template #note="{ option }">
              <span>{{ option.help || '補足なし' }}</span>
            </template>
            <template #explanation>
              Enter / Space でカード選択可能。確認モードでは original と model の差分表示を確認。
            </template>
          </NovaRadioCardForm>
        </NovaInputGrid>

        <NovaInputGrid label="noteなし + 3列" required>
          <NovaRadioCardForm
            v-model="model"
            :original="original"
            :is-confirmation="isConfirmation"
            :input-props="{ options: optionsWithoutNote, columns: 3 }"
          />
        </NovaInputGrid>
      </v-form>

      <div class="d-flex ga-2 mt-4">
        <v-btn :disabled="!formValid" @click.stop="isConfirmation = !isConfirmation">
          isConfirmation: {{ isConfirmation }}
        </v-btn>
        <v-btn variant="outlined" @click.stop="disabled = !disabled">disabled: {{ disabled }}</v-btn>
        <v-btn variant="outlined" @click.stop="original = model">original を現在値に同期</v-btn>
      </div>

      <div class="mt-3 text-sm text-info">
        model: {{ model }} / original: {{ original }} / formValid: {{ formValid }}
      </div>
    </InnerCard>
  </CardContainer>
</template>
