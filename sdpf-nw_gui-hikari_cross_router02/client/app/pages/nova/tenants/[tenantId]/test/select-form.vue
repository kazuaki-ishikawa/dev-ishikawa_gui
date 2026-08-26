<script setup lang="ts">
const rules = useRules()

const isConfirmation = ref(false)
const ipAddressOptions = ['0.0.0.0/0'].map(value => ({ text: value, value }))

const formValid = ref<boolean>(false)
const inputData = ref<{
  text: string
  single: string
  multiple: string[]
}>({
  text: '',
  single: 'custom-outside-value',
  multiple: [],
})

// #17645 再現用: multiple かつ required で未選択（空配列）のまま検証すると valid になってしまう
const bugFormValid = ref<boolean>(false)
const bugMultiple = ref<string[]>([])

// #17645 再現用: allowCustomValue=true でも候補外の自由入力値が再描画時に表示モデルへ復元されない
const customValueSingle = ref<string>('')
const customValueMultiple = ref<string[]>([])
const remountKey = ref(0)
const remount = () => remountKey.value++
const setCustomValues = () => {
  customValueSingle.value = 'custom-outside-value'
  customValueMultiple.value = ['custom-outside-1', 'custom-outside-2']
}
const options = [
  { text: '通常', value: 'normal' },
  { text: '--------------------文章が長い場合は折り返します--------------------', value: 'long' },
  {
    text: 'help',
    value: 'help',
    help: 'ヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキストヘルプテキスト\nヘルプテキストヘルプテキスト',
  },
  { text: 'icon', value: 'icon' },
  { text: 'help + icon', value: 'help-icon' },
  { text: 'disabled', value: 'disabled' },
  {
    text: 'help + icon + disabled',
    value: 'help-icon-disabled',
  },
  { text: 'subLabel', value: 'sub-label' },
  { text: '0.0.0.0/0', value: '0.0.0.0/0' },
]
</script>

<template>
  <v-form v-model="formValid">
    <div>form valid {{ formValid }}</div>
    <div>input data: {{ inputData.single }}</div>
    <div>multiple data: {{ inputData.multiple }}</div>
    <NovaInputGrid required label="必須(width=250px)">
      <NovaCustomSelect v-model="inputData.single" required :options="options" placeholder="必須" width="250px" />
    </NovaInputGrid>
    <NovaInputGrid required label="multiple:placeholderなし">
      <NovaCustomSelect v-model="inputData.multiple" required :options="options" multiple />
    </NovaInputGrid>
    <NovaInputGrid label="required なし">
      <NovaCustomSelect v-model="inputData.single" :options="options" placeholder="必須なし" width="550px" />
    </NovaInputGrid>
    <NovaInputGrid label="required なし multiple">
      <NovaCustomSelect v-model="inputData.multiple" :options="options" multiple placeholder="必須なし" />
    </NovaInputGrid>
    <NovaInputGrid required label="disabled">
      <NovaCustomSelect v-model="inputData.single" required :options="options" placeholder="disabled" disabled />
    </NovaInputGrid>
    <div class="font-weight-bold my-2">SelectableInputForm の 表示サンプル</div>

    <NovaInputGrid required label="1件のみ">
      <NovaCustomSelect
        v-model="inputData.single"
        :options="ipAddressOptions"
        :rules="[rules.cidr, rules.maxlength(18)]"
        required
        placeholder="1件のみ"
        allow-custom-value
      />
      <div>inputData.single: {{ inputData.single }}</div>
    </NovaInputGrid>
    <NovaInputGrid required label="複数設定可能">
      <NovaCustomSelect
        v-model="inputData.multiple"
        :options="ipAddressOptions"
        :rules="[rules.cidr, rules.maxlength(18)]"
        required
        placeholder="複数設定可能"
        multiple
        allow-custom-value
      />
      <div>inputData.customValueMultiple: {{ inputData.multiple }}</div>
    </NovaInputGrid>

    <div class="font-weight-bold my-2">NovaSelectForm の 表示サンプル</div>
    <NovaInputGrid required label="Nova Select From">
      <NovaSelectForm
        v-model="inputData.single"
        original="normal"
        :is-confirmation="isConfirmation"
        :input-props="{ placeholder: 'テスト', width: '550px', options: options, required: true }"
      >
        <template #explanation> 説明文のサンプル(original: normal) </template>
      </NovaSelectForm>
    </NovaInputGrid>
    <v-btn @click.stop="isConfirmation = !isConfirmation">isConfirmation</v-btn>

    <div class="font-weight-bold my-2">CustomTextField の 表示サンプル(スタイル比較用)</div>
    <NovaInputGrid label="メールアドレス形式のバリデーション">
      <NovaCustomTextField v-model="inputData.text" placeholder="自由入力" :rules="[rules.mailAddress]" />
    </NovaInputGrid>
    <NovaInputGrid label="disabled">
      <NovaCustomTextField v-model="inputData.text" disabled placeholder="自由入力" />
    </NovaInputGrid>
    <NovaInputGrid label="input-form " required>
      <NovaInputForm
        v-model="inputData.text"
        original="mail@test.com"
        :is-confirmation="isConfirmation"
        :input-props="{ placeholder: '自由', required: true, rules: [rules.mailAddress] }"
      >
        <template #explanation> 説明文のサンプル(original: mail@test.com) </template>
      </NovaInputForm>
    </NovaInputGrid>
    <v-btn @click.stop="isConfirmation = !isConfirmation">isConfirmation</v-btn>

    <div class="font-weight-bold mt-4 mb-2 text-error">#17645 再現: multiple + required の必須すり抜け</div>
    <div>
      未選択（空配列）のまま送信ボタンが押せてしまえばバグ。本来は required なので form valid が false
      になり、ボタンが無効化されるべき。
    </div>
    <v-form v-model="bugFormValid">
      <div>bug form valid: {{ bugFormValid }}</div>
      <div>bug multiple data: {{ bugMultiple }}</div>
      <NovaInputGrid required label="multiple + required（未選択で再現）">
        <NovaCustomSelect v-model="bugMultiple" required :options="options" multiple placeholder="必須の複数選択" />
      </NovaInputGrid>
      <v-btn :disabled="!bugFormValid" color="error">
        {{ bugFormValid ? '送信可能（バグ: 未選択でも押せる）' : '送信不可（正常）' }}
      </v-btn>
    </v-form>

    <div class="font-weight-bold mt-4 mb-2 text-error">
      #17645 再現: allowCustomValue の候補外値が再描画で表示から消える
    </div>
    <div>
      候補外（options に存在しない）の値をセットした後に「再描画」を押すと、model には値が残っているのに
      入力欄の表示が空になればバグ。本来は allowCustomValue=true なので候補外の値も表示され続けるべき。
    </div>
    <div>single model: {{ customValueSingle }}</div>
    <div>multiple model: {{ customValueMultiple }}</div>
    <v-btn class="my-2" @click.stop="setCustomValues"> 候補外の値をセット </v-btn>
    <v-btn class="my-2 ml-2" @click.stop="remount">再描画（remount）</v-btn>
    <NovaInputGrid label="allowCustomValue single（候補外の値を保持）">
      <NovaCustomSelect
        :key="`single-${remountKey}`"
        v-model="customValueSingle"
        :options="options"
        placeholder="候補外の値を入力"
        allow-custom-value
      />
    </NovaInputGrid>
    <NovaInputGrid label="allowCustomValue multiple（候補外の値を保持）">
      <NovaCustomSelect
        :key="`multiple-${remountKey}`"
        v-model="customValueMultiple"
        :options="options"
        placeholder="候補外の値を入力"
        multiple
        allow-custom-value
      />
    </NovaInputGrid>
  </v-form>
</template>
