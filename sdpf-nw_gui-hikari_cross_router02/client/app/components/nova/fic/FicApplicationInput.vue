<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FicRequestTypes } from '@/api/ficConnections/constants'
import type { FicConnectionPostRequest, FicRequestType } from '@/api/ficConnections/types'
import type { OptionType } from '@/components/nova/form/types'

type PropType = {
  vpnListOptions: OptionType<string>[]
  customerNoteList: Array<{ id: string; customerNote: string }>
  isConfirmation?: boolean
  requestType?: FicRequestType
}
const props = withDefaults(defineProps<PropType>(), {
  isConfirmation: false,
  requestType: undefined,
})

const model = defineModel<Required<FicConnectionPostRequest>>({ required: true })

const { t } = useI18n()

const rules = useRules()
const { routeAdvertisementOptions } = useFicConnections()

const ficPremiumOptions = [
  { text: t('nova.common.use'), value: true },
  { text: t('nova.common.disuse'), value: false },
]

const requestTypeText = computed(() => {
  switch (props.requestType) {
    case FicRequestTypes.FicConnection:
      return t('nova.fic.ficConnection')
    case FicRequestTypes.SimpleFicConnection:
      return t('nova.fic.simpleFicConnection')
    default:
      return ''
  }
})
</script>

<template>
  <div>
    <p v-if="isConfirmation" class="text-body-medium text-pre-wrap mb-4">
      {{ t('nova.create.confirmDescription') }}
    </p>

    <NovaInputGrid v-if="isConfirmation" :label="t('nova.fic.requestType')">
      {{ requestTypeText }}
    </NovaInputGrid>

    <NovaInputGrid required :label="t('nova.fic.customerNote')">
      <NovaInputForm
        v-model="model.customerNote"
        :input-props="{
          placeholder: t('nova.fic.customerNote'),
          maxLength: 64,
          rules: [rules.customerNote, rules.duplicateCustomerNote(customerNoteList)],
          required: true,
        }"
        :is-confirmation="isConfirmation"
      >
        <template #explanation>
          {{ t('nova.invalid.maxlength.none', { maxlength: 64 }) }}
        </template>
      </NovaInputForm>
    </NovaInputGrid>

    <NovaInputGrid required :label="t('nova.fic.vpnIdName')">
      <NovaSelectForm
        v-model="model.vpnId"
        :is-confirmation="isConfirmation"
        :input-props="{
          options: vpnListOptions,
          placeholder: 'V000000002 / 拠点間通信用VPN',
          required: true,
        }"
      />
    </NovaInputGrid>

    <NovaInputGrid required :label="t('nova.fic.routeAdvertisement')">
      <NovaSelectForm
        v-model="model.routeAdvertisement"
        :is-confirmation="isConfirmation"
        :input-props="{
          options: routeAdvertisementOptions,
          placeholder: routeAdvertisementOptions[0]?.text,
          width: '640px',
          required: true,
        }"
      />
    </NovaInputGrid>

    <NovaInputGrid required :label="t('nova.fic.ficPremium')">
      <NovaRadioForm
        v-model="model.ficPremium"
        :input-props="{ options: ficPremiumOptions, inline: true }"
        :is-confirmation="isConfirmation"
      />
    </NovaInputGrid>
  </div>
</template>
