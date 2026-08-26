<script setup lang="ts">
const model = ref<string[]>([])

const options = [
  { text: '通常', value: 'normal' },
  {
    text: '--------------------文章が長い場合は折り返します--------------------',
    value: 'long',
  },
  { text: 'help', value: 'help', help: 'ヘルプテキスト' },
]
const single = ref(false)
const formValid = ref(null)
const isConfirmation = ref(false)
</script>

<template>
  <CardContainer>
    <div>※元実装の仕様上、エラーの状態でchecked や disabled になることはありません。</div>
    <div class="mb-4">
      ※下のサンプルでdisabled状態を見たい場合は、2項目にチェックを入れてください。（maxItem=2の設定）
    </div>
    <InnerCard>
      <InputGrid label="旧UI（比較用）" required>
        <CheckboxForm v-model:value="model" :options="options" :max-items="2" required col-min-width="200px" />
      </InputGrid>
      <InputGrid label="旧UI（比較用）disabled" required>
        <CheckboxForm v-model:value="model" :options="options" disabled :max-items="2" required col-min-width="200px" />
      </InputGrid>
    </InnerCard>

    <v-form v-model="formValid">
      <InnerCard>
        <NovaInputGrid label="横に並べる" required>
          <NovaCustomCheckboxes v-model="model" :options="options" :max-items="2" required inline>
            <template #explanation>{{ `説明欄説明欄説明欄説明欄説明欄説明欄説明欄\n説明欄` }}</template>
          </NovaCustomCheckboxes>
        </NovaInputGrid>
        <NovaInputGrid label="横に並べる required disabled" required>
          <NovaCustomCheckboxes v-model="model" :options="options" :max-items="2" required disabled inline />
        </NovaInputGrid>
      </InnerCard>
      <InnerCard>
        <NovaInputGrid label="縦に並べる(colorの設定)">
          <NovaCustomCheckboxes v-model="model" :options="options" :max-items="2" color="primary" />
        </NovaInputGrid>
      </InnerCard>
      <InnerCard>
        <NovaInputGrid label="checkbox-base">
          <NovaCheckboxBase v-model="single">
            <template #label>例えば規約同意とかに使う</template>
          </NovaCheckboxBase>
        </NovaInputGrid>
      </InnerCard>

      <InnerCard>
        <NovaInputGrid label="checkbox-form">
          <NovaCheckboxForm
            v-model="model"
            :original="['normal']"
            :is-confirmation="isConfirmation"
            :input-props="{
              options,
              maxItems: 2,
              inline: true,
            }"
          />
        </NovaInputGrid>
      </InnerCard>
    </v-form>

    <v-btn :disabled="!formValid || !single" @click.stop="isConfirmation = !isConfirmation">click</v-btn>
  </CardContainer>
</template>
