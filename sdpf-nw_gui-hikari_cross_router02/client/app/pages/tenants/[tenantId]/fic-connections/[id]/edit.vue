<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { RouteAdvertisementTypes } from '@/api/ficConnections/constants'
import type { FicConnectionPutRequest } from '@/api/ficConnections/types'

const { t } = useI18n()
const { navigationGuard } = useNavigationGuard()

const route = useRoute()
const router = useRouter()
const rules = useRules()
const tenantId = computed(() => route.params.tenantId as string)
const ficConnectionId = computed(() => route.params.id as string)
const { loading } = useLoading()

const { routeAdvertisementOptions } = useFicConnections()
const { customerNoteList, getFicConnectionList } = useGetFicConnectionList()
const { ficConnection, getFicConnection, editable } = useGetFicConnection()
const { updateFicConnection } = useUpdateFicConnection()

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: tenantId.value, orderId: ficConnection.value?.orderId }))

const inputData = ref<Required<FicConnectionPutRequest>>({
  customerNote: '',
  routeAdvertisement: RouteAdvertisementTypes.Full,
})
const inputValid = ref({ customerNote: true, routeAdvertisement: true })

const isConfirmation = ref(false)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const originalData = computed(() => ({
  customerNote: ficConnection.value?.customerNote ?? '',
  routeAdvertisement: ficConnection.value?.routeAdvertisement ?? RouteAdvertisementTypes.Full,
}))
watch(originalData, () => (inputData.value = { ...originalData.value }))
watchEffect(() => {
  navigationGuard(!isEqual(inputData.value, originalData.value))
})

const submitDisabled = computed(
  () =>
    !editable.value ||
    isEqual(inputData.value, originalData.value) ||
    Object.values(inputValid.value).some(valid => !valid),
)

const handleSubmit = async () => {
  const request = {
    customerNote:
      inputData.value.customerNote !== originalData.value.customerNote ? inputData.value.customerNote : undefined,
    routeAdvertisement:
      inputData.value.routeAdvertisement !== originalData.value.routeAdvertisement
        ? inputData.value.routeAdvertisement
        : undefined,
  }
  await updateFicConnection(ficConnectionId.value, request)
  navigationGuard(false)
  router.back()
}

const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})

onBeforeMount(() => {
  getFicConnection(ficConnectionId.value)
  getFicConnectionList()
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">
      {{ t('confirm.update') }}
    </div>

    <InnerCard>
      <DetailGrid>
        <div class="text-secondary text-lg">{{ t('fic.ficId') }}</div>
        <div>{{ ficConnection?.ficConnectionId }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="`${t('sideBar.fic')} ${t('common.edit')}`">
      <InputGrid required :label="t('fic.customerNote')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList, ficConnectionId)]"
          maxlength="64"
          required
          :placeholder="t('fic.customerNote')"
          :disabled="isConfirmation"
          data-cy="fic-connection-id-edit-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <DetailGrid>
        <div>VPN ID</div>
        <div>{{ ficConnection?.vpnId }}</div>
      </DetailGrid>
      <InputGrid required :label="t('fic.routeAdvertisement')">
        <SelectForm
          v-model="inputData.routeAdvertisement"
          required
          :options="routeAdvertisementOptions"
          :placeholder="routeAdvertisementOptions[0]?.text"
          :disabled="isConfirmation"
          size="large"
          data-cy="fic-connection-id-edit-route-advertisement"
          @valid="(valid: boolean) => (inputValid.routeAdvertisement = valid)"
        />
      </InputGrid>
      <DetailGrid>
        <div>{{ t('fic.ficPremium') }}</div>
        <div>{{ ficConnection?.ficPremium ? t('common.use') : t('common.disuse') }}</div>
      </DetailGrid>
      <DetailGrid>
        <div class="flex-flex-start-center">
          {{ t('fic.referenceFicConnectionId') }}
          <HelpTooltip class="px-2 pt-1" v-bind="{ size: 'smallMiddle' }">
            {{ t('fic.help.referenceFicConnectionId') }}
          </HelpTooltip>
        </div>
        <div>{{ ficConnection?.referenceFicConnectionId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('fic.publicServiceKey') }}</div>
        <div class="break-all">{{ ficConnection?.publicServiceKey }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('fic.bandwidth') }}</div>
        <div>{{ ficConnection?.bandwidth }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ ficConnection?.resourceStatus }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink :to="orderIdLink"> {{ ficConnection?.orderId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid v-if="ficConnection?.orderStatus">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[ficConnection.orderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div>{{ formatDateTime(ficConnection?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div>{{ formatDateTime(ficConnection?.updateTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.serviceStartTime') }}</div>
        <div>{{ formatDateTime(ficConnection?.serviceStartTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :width="180"
        :disabled="submitDisabled || loading"
        :text="submit.text"
        data-cy="fic-connection-id-edit-save-button"
        @click="submit.click"
      />
    </div>
  </CardContainer>
</template>

<style lang="scss" scoped>
.break-all {
  word-break: break-all;
}
</style>
