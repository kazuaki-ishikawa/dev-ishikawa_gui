<script setup lang="ts">
import type { RadioFormOptionType } from '@/components/input/types'
import type { RadioFormOptionType as NovaRadioFormOptionType } from '@/components/nova/form/types'

// 同じ options を旧UI と Nova UI の両方に渡すため、双方の option 型を満たす（subLabel は旧UIのスロット用）
type LegacyAndNovaRadioOptionType = RadioFormOptionType<string> &
  NovaRadioFormOptionType<string> & { subLabel?: string }

const model = ref('')

const options: LegacyAndNovaRadioOptionType[] = [
  { text: '通常', value: 'normal' },
  { text: '--------------------文章が長い場合は折り返します--------------------', value: 'long' },
  {
    text: 'help',
    value: 'help',
    help: 'ヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキスト\nヘルプテキストヘルプテキスト',
  },
  { text: 'icon', value: 'icon', icon: 'lock' },
  { text: 'help + icon', value: 'help-icon', help: 'ヘルプテキスト', icon: 'lock' },
  { text: 'disabled', value: 'disabled', disabled: true },
  {
    text: 'help + icon + disabled',
    value: 'help-icon-disabled',
    disabled: true,
    help: 'ヘルプテキスト',
    icon: 'lock',
  },
  { text: 'subLabel', value: 'sub-label', subLabel: 'ここに自由にサブラベルを表示することができます。' },
]

const formValid = ref(null)
const isConfirmation = ref(false)
</script>

<template>
  <CardContainer>
    <InnerCard>
      <InputGrid label="旧UI（比較用）" required :label-width="200">
        <RadioForm v-model="model" :options="options">
          <template #sublabel="{ value }">
            <div v-if="options.find(option => option.value === value)?.subLabel" class="text-warning">
              {{ options.find(option => option.value === value)?.subLabel }}
            </div>
          </template>
        </RadioForm>
      </InputGrid>
    </InnerCard>
    <v-form v-model="formValid">
      vuetify では subLabel 不要になってるので削除
      <InnerCard>
        <NovaInputGrid label="横に並べる" required>
          <NovaCustomRadioGroup v-model="model" :options="options.slice(0, -1)" inline />
        </NovaInputGrid>
        <NovaInputGrid label="横に並べる(disabled)" required>
          <NovaCustomRadioGroup v-model="model" :options="options.slice(0, -1)" inline disabled />
        </NovaInputGrid>
      </InnerCard>
      <InnerCard>
        <NovaInputGrid label="縦に並べる" required>
          <NovaCustomRadioGroup v-model="model" :options="options.slice(0, -1)" />
        </NovaInputGrid>
      </InnerCard>

      <InnerCard>
        <NovaInputGrid label="radio-from" required>
          <NovaRadioForm
            v-model="model"
            :is-confirmation="isConfirmation"
            :original="options[0]?.value"
            :input-props="{
              inline: true,
              options: options.slice(0, -1),
            }"
          />
        </NovaInputGrid>
      </InnerCard>
    </v-form>

    <v-btn :disabled="!formValid" @click.stop="isConfirmation = !isConfirmation">click</v-btn>
  </CardContainer>
</template>
