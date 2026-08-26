<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { VPN_LINK } from '@/api/vpns/constants'
import type { VpnPostRequest } from '@/api/vpns/types'

const { t } = useI18n()
const rules = useRules()
const router = useRouter()

const inputData = ref<VpnPostRequest>({ customerNote: '', internalAddress: '' })
const inputValid = ref({ customerNote: false, internalAddress: false })

const { loading } = useLoading()
const { setNotificationMessageState } = useNotificationDialog()

// vpn取得
const { getSummaryVpnList, customerNoteList } = useGetSummaryVpnList()
const { createVpn } = useCreateVpn()

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const isConfirmation = ref(false)
const disabled = computed(() => Object.values(inputValid.value).some(valid => !valid))

const handleSubmit = async () => {
  if (isConfirmation.value) {
    const resposnse = await createVpn(inputData.value)
    setNotificationMessageState({ message: t('message.accepted'), orderId: resposnse.orderId })
    navigationGuard(false)
    router.back()
  } else {
    isConfirmation.value = true
  }
}
onBeforeMount(getSummaryVpnList)
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">
      <div class="mb-2">{{ t('confirm.create') }}</div>
      <div class="mb-3 text-error">{{ t('vpn.createResourceNote') }}</div>
    </div>
    <InnerCard :title="`VPN ${t('common.createNew')}`">
      <template #help>
        <i18n-t keypath="vpn.help.create" scope="global">
          <template #linkText>
            <NuxtLink :to="VPN_LINK.VPN" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <InputGrid required :label="t('vpn.name')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
          maxlength="64"
          required
          placeholder="拠点間通信用VPN"
          :disabled="isConfirmation"
          data-cy="vpn-create-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('vpn.internalAddress')" :help="t('vpn.help.internalAddress')">
        <InputPrefixedIpForm
          v-model="inputData.internalAddress"
          :prefix="26"
          :rules="[rules.ipAddress]"
          maxlength="15"
          required
          placeholder="10.192.0.0"
          :disabled="isConfirmation"
          data-cy="vpn-create-internal-address"
          @valid="(valid: boolean) => (inputValid.internalAddress = valid)"
        />
      </InputGrid>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="disabled || loading"
        :width="180"
        :text="isConfirmation ? t('common.create') : t('common.confirm')"
        data-cy="vpn-create-submit"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
