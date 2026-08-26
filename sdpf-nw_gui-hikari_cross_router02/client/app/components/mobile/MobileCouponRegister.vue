<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

defineProps<{ disabled: boolean }>()
const couponCode = defineModel<string>('couponCode', { required: true })
type Emits = {
  (e: 'next'): void
  (e: 'back'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()

const couponCodeValid = ref(true)
</script>

<template>
  <div>
    <div class="mb-3 text-lg">{{ t('mobile.mobileCouponRegister') }}</div>
    <div class="mb-3">{{ t('mobile.mobileCouponRegisterMessage') }}</div>
    <InputForm
      v-model="couponCode"
      :rules="[rules.mobileDiscountCode]"
      placeholder="5GT-ZABCDEFG"
      @valid="(valid: boolean) => (couponCodeValid = valid)"
    />
    <div class="flex-flex-end-center pt-4">
      <CustomButton icon="left-arrow" color="info" :text="t('common.return')" :width="180" @click="emits('back')" />
      <CustomButton
        class="ml-6"
        :text="t('common.next')"
        icon="right-arrow"
        :width="180"
        :disabled="!couponCodeValid || disabled"
        @click="emits('next')"
      />
    </div>
  </div>
</template>
