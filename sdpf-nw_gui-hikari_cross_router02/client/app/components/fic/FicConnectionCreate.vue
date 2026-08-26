<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteAdvertisementTypes } from '@/api/ficConnections/constants'
import type { FicConnectionPostRequest } from '@/api/ficConnections/types'

type PropType = {
  vpnListOptions: Array<{ text: string; value: string }>
  customerNoteList: Array<{ id: string; customerNote: string }>
}
defineProps<PropType>()

type Emits = {
  (e: 'submit', request: FicConnectionPostRequest): void
  (e: 'cancel'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const { loading } = useLoading()
const rules = useRules()
const { routeAdvertisementOptions } = useFicConnections()

const inputData = ref<Required<FicConnectionPostRequest>>({
  customerNote: '',
  vpnId: '',
  routeAdvertisement: RouteAdvertisementTypes.Full,
  ficPremium: false,
})
const inputValid = ref({ customerNote: false, vpnId: false, routeAdvertisement: true, ficPremium: true })
const isConfirmation = ref(false)

const title = `${t('sideBar.fic')} ${t('common.createNew')}`
const submitDisabled = computed(() => Object.values(inputValid.value).some(valid => !valid))

const submit = computed(() => {
  const click = isConfirmation.value ? () => emits('submit', inputData.value) : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.create') : t('common.confirm')
  return { click, text }
})
</script>

<template>
  <div>
    <div v-if="isConfirmation" class="mb-2">
      {{ t('confirm.create') }}
    </div>
    <InnerCard :title="title">
      <InputGrid required :label="t('fic.customerNote')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
          maxlength="64"
          :placeholder="t('fic.customerNote')"
          :disabled="isConfirmation"
          required
          data-cy="fic-connection-create-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('terminals.vpnIdName')">
        <SelectForm
          v-model="inputData.vpnId"
          required
          :options="vpnListOptions"
          placeholder="V000000002 / 拠点間通信用VPN"
          :disabled="isConfirmation"
          size="middle"
          data-cy="fic-connection-create-vpn-id"
          @valid="(valid: boolean) => (inputValid.vpnId = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('fic.routeAdvertisement')">
        <SelectForm
          v-model="inputData.routeAdvertisement"
          required
          :options="routeAdvertisementOptions"
          :placeholder="routeAdvertisementOptions[0]?.text"
          size="large"
          :disabled="isConfirmation"
          data-cy="fic-connection-create-route-advertisement"
          @valid="(valid: boolean) => (inputValid.routeAdvertisement = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('fic.ficPremium')">
        <RadioForm
          v-model="inputData.ficPremium"
          :options="[
            { text: t('common.use'), value: true },
            { text: t('common.disuse'), value: false },
          ]"
          :disabled="isConfirmation"
          data-cy="fic-connection-create-fic-premium"
          @valid="(valid: boolean) => (inputValid.ficPremium = valid)"
        />
      </InputGrid>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="fic-connection-create-cancel-button"
        @cancel="emits('cancel')"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="submitDisabled || loading"
        :width="180"
        :text="submit.text"
        data-cy="fic-connection-create-submit-button"
        @click="submit.click"
      />
    </div>
  </div>
</template>
