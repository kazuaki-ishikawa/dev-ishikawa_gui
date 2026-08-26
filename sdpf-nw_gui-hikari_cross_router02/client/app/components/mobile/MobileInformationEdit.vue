<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { MobileResponse, MobilePutRequest } from '@/api/mobile/types'

type PropType = {
  mobile: MobileResponse | null
  tenantId: string
  showCancelButton?: boolean
}
const props = defineProps<PropType>()
const model = defineModel<MobilePutRequest>({ required: true })

type Emits = {
  (e: 'submit', changed: boolean): void
  (e: 'cancel'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { navigationGuard } = useNavigationGuard()

const inputValid = ref({ mobileDiscountCode: true })
const disableMobileDiscountCode = computed(() => !!props.mobile?.mobileTermsOfServiceAccepted)
const disabled = computed(
  () => disableMobileDiscountCode.value || Object.values(inputValid.value).some(valid => !valid),
)
const { getOrderIdLink } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: props.mobile?.orderId }))

const originalData = computed(() => ({
  mobileDiscountCode: props.mobile?.mobileDiscountCode || null,
}))
watch(
  originalData,
  () => {
    model.value.mobileDiscountCode = originalData.value.mobileDiscountCode
  },
  { immediate: true },
)
const changed = computed(() => !isEqual(model.value, originalData.value))
watchEffect(() => navigationGuard(changed.value))
const handleSubmit = () => {
  navigationGuard(false)
  emits('submit', changed.value)
}
</script>

<template>
  <div>
    <InnerCard>
      <DetailGrid v-if="mobile?.orderId">
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink :to="orderIdLink"> {{ mobile.orderId }}</NuxtLink>
      </DetailGrid>
      <InputGrid :label="t('mobile.mobileDiscountCode')" :help="t('mobile.help.mobileDiscountCode')">
        <InputForm
          :model-value="model.mobileDiscountCode ?? ''"
          :rules="[rules.mobileDiscountCode]"
          placeholder="5GT-ZABCDEFG"
          :disabled="disableMobileDiscountCode"
          data-cy="mobile-information-edit-mobile-discount-code"
          @update:model-value="(value: string) => (model.mobileDiscountCode = value || null)"
          @valid="(valid: boolean) => (inputValid.mobileDiscountCode = valid)"
        />
      </InputGrid>
      <DetailGrid>
        <div>{{ t('mobile.mobileTermsOfServiceAccepted') }}</div>
        <div>{{ mobile?.mobileTermsOfServiceAccepted ? t('terms.agreed') : t('terms.disagreed') }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('mobile.mobileRepresentativeNumber') }}</div>
        <div>{{ mobile?.mobileRepresentativeNumber }}</div>
      </DetailGrid>
    </InnerCard>
    <div class="flex-flex-end-center pt-2">
      <CustomButton
        v-if="showCancelButton"
        color="info"
        icon="right-arrow"
        :text="t('common.cancel')"
        :width="180"
        data-cy="mobile-information-edit-cancel-button"
        @click="() => emits('cancel')"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="disabled"
        :text="t('common.next')"
        :width="180"
        data-cy="mobile-information-edit-submit-button"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>
