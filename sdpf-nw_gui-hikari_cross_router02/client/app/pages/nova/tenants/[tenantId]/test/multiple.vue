<script setup lang="ts">
const rules = useRules()

// MultipleInputRangeForm.vueの動作確認用
const multipleIpRangeFormValid = ref(false)
const multipleIpRangeFormValues = ref<Array<[string, string]>>([])
const multipleIpRangeFormIsConfirmation = ref(false)

const multipleRangeFormValues = ref<Array<[string, string]>>([])

// MultipleInputForm.vueの動作確認用
const multipleInputFormValid = ref(false)
const multipleInputFormValues = ref<string[]>([])
const multipleInputFormIsConfirmation = ref(false)

// MultipleForm.vueの動作確認用
const multipleFormValues = ref<Array<{ id: string; name: string }>>([
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
])
const handleUpdateMultipleFormValues = (id?: string) => {
  if (id === undefined) {
    multipleFormValues.value = [
      ...multipleFormValues.value,
      {
        name: `item ${multipleFormValues.value.length + 1}`,
        id: createRandomString({ prefix: 'test-' }),
      },
    ]
  } else {
    multipleFormValues.value = multipleFormValues.value.filter(m => m.id !== id)
  }
}
</script>

<template>
  <div>
    <v-form v-model="multipleIpRangeFormValid" class="my-5">
      <div class="font-weight-bold text-lg">MultipleInputRangeForm.vue</div>

      <NovaInputGrid required label="MultipleInputRangeForm（新規作成用）">
        <NovaMultipleInputRangeForm
          v-model="multipleIpRangeFormValues"
          :input-props="{
            rules: [rules.ipAddress],
            maxLength: 15,
            required: true,
          }"
          :min-items="1"
          :max-items="5"
          :placeholder="['192.168.1.10', '192.168.1.99']"
          :is-confirmation="multipleIpRangeFormIsConfirmation"
        />
      </NovaInputGrid>
      <NovaInputGrid label="MultipleInputRangeForm（変更用）">
        <NovaMultipleInputRangeForm
          v-model="multipleIpRangeFormValues"
          :input-props="{
            rules: [rules.ipAddress],
            maxLength: 15,
            width: '200px',
          }"
          :max-items="5"
          :placeholder="['192.168.1.10', '192.168.1.99']"
          :original="[['192.168.1.10', '192.168.1.99']]"
          :is-confirmation="multipleIpRangeFormIsConfirmation"
        >
          <template #explanation>isConfirmation=trueになった場合、横並びになるくらいのwidthを指定</template>
        </NovaMultipleInputRangeForm>
      </NovaInputGrid>

      <NovaInputGrid label="IPに限らない値でも可能（変更用）">
        <NovaMultipleInputRangeForm
          v-model="multipleRangeFormValues"
          :input-props="{
            rules: [rules.number],
            maxLength: 3,
          }"
          :max-items="1"
          :placeholder="['3', '10']"
          :original="[['3', '10']]"
          :is-confirmation="multipleIpRangeFormIsConfirmation"
        >
          <template #explanation>{{ `数字を入力\nmax-items=1` }}</template>
        </NovaMultipleInputRangeForm>
      </NovaInputGrid>

      <v-btn
        :disabled="!multipleIpRangeFormValid"
        @click.stop="multipleIpRangeFormIsConfirmation = !multipleIpRangeFormIsConfirmation"
      >
        multipleIpRangeFormValid:{{ multipleIpRangeFormValid }}
      </v-btn>
    </v-form>

    <v-form v-model="multipleInputFormValid" class="my-5">
      <div class="font-weight-bold text-lg">MultipleInputForm.vue</div>
      <NovaInputGrid label="MultipleInputForm（新規作成用）">
        <NovaMultipleInputForm
          v-model="multipleInputFormValues"
          :max-items="5"
          :is-confirmation="multipleInputFormIsConfirmation"
          :input-props="{ placeholder: 'Enter value', rules: [rules.ipAddress] }"
        >
          <template #explanation>IP Address max-items=5</template>
        </NovaMultipleInputForm>
      </NovaInputGrid>
      <NovaInputGrid required label="MultipleInputForm（変更用）original:['1.1.1.1']">
        <NovaMultipleInputForm
          v-model="multipleInputFormValues"
          :original="['1.1.1.1']"
          :min-items="1"
          :is-confirmation="multipleInputFormIsConfirmation"
          :input-props="{ placeholder: 'Enter value', required: true, rules: [rules.ipAddress] }"
        />
      </NovaInputGrid>
      <v-btn
        :disabled="!multipleInputFormValid"
        @click.stop="multipleInputFormIsConfirmation = !multipleInputFormIsConfirmation"
      >
        multipleInputFormValid:{{ multipleInputFormValid }}
      </v-btn>
    </v-form>

    <div class="font-weight-bold text-lg">MultipleForm.vue</div>
    <NovaMultipleItems
      :values="multipleFormValues"
      :disabled="false"
      :min-items="0"
      :max-items="5"
      @click:add="handleUpdateMultipleFormValues"
      @click:remove="handleUpdateMultipleFormValues"
    >
      <template #child="{ data }">
        <div>{{ data.name }}</div>
      </template>
    </NovaMultipleItems>
  </div>
</template>
