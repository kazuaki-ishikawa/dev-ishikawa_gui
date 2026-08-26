<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { VpnPutRequest } from '@/api/vpns/types'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const rules = useRules()
const tenantId = computed(() => route.params.tenantId as string)
const vpnId = computed(() => route.params.id as string)
const { loading } = useLoading()

const isConfirmation = ref(false)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const inputData = ref<VpnPutRequest>({ customerNote: '' })
const inputValid = ref({ customerNote: true })
const { updateVpn } = useUpdateVpn()

const { getVpn, vpn, editable, routeHeaders, routeItems } = useGetVpn()
const { getSummaryVpnList, customerNoteList } = useGetSummaryVpnList()

const originalData = computed(() => ({ customerNote: vpn.value?.customerNote ?? '' }))

const disabled = computed(
  () =>
    !editable.value ||
    Object.values(inputValid.value).some(valid => !valid) ||
    isEqual(inputData.value, originalData.value),
)

const handleSubmit = async () => {
  if (isConfirmation.value) {
    await updateVpn(vpnId.value, inputData.value)
    navigationGuard(false)
    // ブラウザバックしたときに編集画面へ遷移しないように、履歴情報を辿って詳細画面へ戻る。
    router.back()
  } else {
    isConfirmation.value = true
  }
}

const { navigationGuard } = useNavigationGuard()
watch(originalData, () => (inputData.value = { ...originalData.value }))
watchEffect(() => navigationGuard(!isEqual(inputData.value, originalData.value)))

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: tenantId.value, orderId: vpn.value?.orderId }))

onBeforeMount(() => {
  getVpn(vpnId.value)
  getSummaryVpnList()
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">
      {{ t('confirm.update') }}
    </div>
    <InnerCard>
      <DetailGrid>
        <div class="text-secondary text-lg">VPN ID</div>
        <div>{{ vpn?.vpnId }}</div>
      </DetailGrid>
    </InnerCard>
    <InnerCard :title="`VPN ${t('common.edit')}`">
      <InputGrid required :label="t('vpn.name')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList, vpnId)]"
          maxlength="64"
          required
          placeholder="拠点間通信用VPN"
          :disabled="isConfirmation"
          data-cy="vpn-id-edit-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <DetailGrid>
        <div>{{ t('vpn.internalAddress') }}</div>
        <div>{{ vpn?.internalAddress }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ vpn?.resourceStatus }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink :to="orderIdLink"> {{ vpn?.orderId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid v-if="vpn?.orderStatus">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[vpn.orderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div>{{ formatDateTime(vpn?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div>{{ formatDateTime(vpn?.updateTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.serviceStartTime') }}</div>
        <div>{{ formatDateTime(vpn?.serviceStartTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('vpn.routeCount') }}</div>
        <div>{{ vpn?.routeCount }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="t('vpn.routeList')">
      <SeparatedTable :headers="routeHeaders" :items="routeItems" :key-items="['route', 'resourceId']" />
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="disabled || loading"
        :width="180"
        :text="isConfirmation ? t('common.save') : t('common.confirm')"
        data-cy="vpn-id-edit-save-button"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
