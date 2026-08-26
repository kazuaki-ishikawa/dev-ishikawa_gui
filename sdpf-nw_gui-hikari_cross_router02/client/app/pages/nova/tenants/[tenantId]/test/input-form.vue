<script setup lang="ts">
// NovaInputForm（@/components/nova/input/InputForm.vue）の動作確認用ページ。
// 既存 InputForm の使われ方を踏襲しつつ、各種パターンを一覧で確認できる。
const rules = useRules()
const { duplicateDnsIpAddressRules } = useRinkConnections()

const input = reactive({
  // パスワード
  password: '',
  // explanation あり × 文字数制限あり（全角）
  fullwidthName: '',
  // explanation あり × 文字数制限なし
  constraintOnly: '',
  // explanation なし × 文字数制限あり（半角）
  halfwidthCode: '',
  // explanation なし × 文字数制限なし
  plain: '',
  // required
  requiredField: '',
  // minlength
  minlengthField: '',
  // disabled
  disabledField: '変更できない固定値',
  // フォーマット検証（ipAddress）
  ipAddress: '',
  // 任意 width 指定
  customWidth: '',
})

const formValid = ref<boolean | null>(null)
const disabled = computed(() => !formValid.value)
const ipFormValid = ref(false)
const isConfirmation = ref(false)
</script>

<template>
  <CardContainer>
    <div class="font-weight-bold">InputPrefixedIpForm 動作確認</div>
    <v-form v-model="ipFormValid">
      <NovaInputGrid label="rules.availableIpAddressを設定">
        <NovaInputPrefixedIpForm
          v-model="input.ipAddress"
          original="1.1.12.31/24"
          :input-props="{
            rules: [rules.ipAddress, rules.availableIpAddress(['1.1.12.31/24'], 24)],
          }"
          :prefix="24"
          :is-confirmation="isConfirmation"
        >
          <template #explanation>{{ `利用可能: 1.1.12.31/24\nオリジナル: 1.1.12.31/24` }}</template>
        </NovaInputPrefixedIpForm>
      </NovaInputGrid>
      <NovaInputGrid required label="duplicateDnsIpAddressRules original なし">
        <NovaInputPrefixedIpForm
          v-model="input.ipAddress"
          :input-props="{
            required: true,
            placeholder: '1.1.12.32',
            rules: [rules.ipAddress, duplicateDnsIpAddressRules('100.100.12.31/24')],
          }"
          :prefix="24"
          :is-confirmation="isConfirmation"
        >
          <template #explanation>{{ `duplicate: 100.100.12.31/24` }}</template>
        </NovaInputPrefixedIpForm>
      </NovaInputGrid>
      <NovaInputGrid label="disabled の placeholder を確認" required>
        <NovaInputPrefixedIpForm
          v-model="input.ipAddress"
          original="1.1.12.32/24"
          :input-props="{
            disabled: true,
            required: true,
            placeholder: '1.1.1.1',
            rules: [rules.ipAddress, rules.availableIpAddress(['1.1.12.31/24'], 24)],
          }"
          :prefix="24"
        >
          <template #explanation>{{ `利用可能: 1.1.12.31/24\nオリジナル: 1.1.12.31/24` }}</template>
        </NovaInputPrefixedIpForm>
      </NovaInputGrid>
      <v-btn :disabled="!ipFormValid" @click.stop="isConfirmation = !isConfirmation">
        formValid: {{ ipFormValid }} / isConfirmation: {{ isConfirmation }}
      </v-btn>
    </v-form>
    <InnerCard title="NovaInputForm 動作確認">
      <v-form v-model="formValid">
        <!-- パスワード用フォーム（表示切り替え + 検証ルール + minlength） -->
        <NovaInputGrid required label="パスワード用フォーム">
          <NovaCustomTextField
            v-model="input.password"
            password
            required
            placeholder="********"
            :rules="[rules.minlength(2), rules.halfwidthMaxlength(15)]"
            data-cy="nova-test-password"
            :max-length="15"
          >
            <template #explanation>半角15文字以内</template>
          </NovaCustomTextField>
        </NovaInputGrid>

        <!-- explanation あり × 文字数制限あり（全角） -->
        <NovaInputGrid required label="explanation あり / 文字数制限あり">
          <NovaCustomTextField
            v-model="input.fullwidthName"
            required
            placeholder="株式会社○○"
            :rules="[rules.fullwidthCharacter, rules.fullwidthMaxlength(35)]"
            data-cy="nova-test-fullwidth-name"
            :max-length="35"
          >
            <template #explanation>全角35文字以内</template>
          </NovaCustomTextField>
        </NovaInputGrid>

        <!-- explanation あり × 文字数制限なし -->
        <NovaInputGrid label="explanation あり / 文字数制限なし">
          <NovaCustomTextField
            v-model="input.constraintOnly"
            placeholder="任意入力"
            data-cy="nova-test-constraint-only"
          >
            <template #explanation>文字数制限なし</template>
          </NovaCustomTextField>
        </NovaInputGrid>

        <!-- explanation なし × 文字数制限あり（半角64字） -->
        <NovaInputGrid required label="explanation なし / 文字数制限あり(半角64字)">
          <NovaCustomTextField
            v-model="input.halfwidthCode"
            required
            placeholder="halfwidth code"
            :rules="[rules.halfwidthMaxlength(64)]"
            data-cy="nova-test-halfwidth-code"
            :max-length="64"
          />
        </NovaInputGrid>

        <!-- explanation なし × 文字数制限なし（最小構成） -->
        <NovaInputGrid label="explanation なし / 文字数制限なし">
          <NovaCustomTextField v-model="input.plain" placeholder="自由入力" data-cy="nova-test-plain" />
        </NovaInputGrid>

        <!-- required（必須検証のみ） -->
        <NovaInputGrid required label="required（必須）">
          <NovaCustomTextField
            v-model="input.requiredField"
            required
            placeholder="必須項目"
            data-cy="nova-test-required"
          />
        </NovaInputGrid>

        <!-- minlength（最小文字数検証） -->
        <NovaInputGrid label="minlength（4文字以上）">
          <NovaCustomTextField
            v-model="input.minlengthField"
            :rules="[rules.minlength(4)]"
            placeholder="4文字以上"
            data-cy="nova-test-minlength"
          />
        </NovaInputGrid>

        <!-- disabled（入力不可） -->
        <NovaInputGrid label="disabled（入力不可）/ placeholder 表示確認">
          <NovaCustomTextField
            v-model="input.minlengthField"
            :placeholder="input.disabledField"
            disabled
            data-cy="nova-test-disabled"
          />
        </NovaInputGrid>

        <!-- フォーマット検証（呼び出し側で rules を渡す例） -->
        <NovaInputGrid label="フォーマット検証（ipAddress）">
          <NovaCustomTextField
            v-model="input.ipAddress"
            placeholder="192.0.2.1"
            :rules="[rules.ipAddress]"
            data-cy="nova-test-ip-address"
          >
            <template #explanation>IPv4アドレス形式</template>
          </NovaCustomTextField>
        </NovaInputGrid>

        <!-- 任意 width 指定（size ではなく width で指定） -->
        <NovaInputGrid label="任意 width 指定（600px）">
          <NovaCustomTextField v-model="input.customWidth" width="600px" data-cy="nova-test-custom-width" />
        </NovaInputGrid>
      </v-form>
    </InnerCard>

    <!-- 文字数超過などで不正な場合は submit を無効化できることの確認 -->
    <div class="flex-flex-end-center pt-2">
      <CustomButton
        icon="right-arrow"
        text="確認（disabled 連動）"
        :width="220"
        :disabled="disabled"
        data-cy="nova-test-submit-button"
      />
    </div>
  </CardContainer>
</template>
