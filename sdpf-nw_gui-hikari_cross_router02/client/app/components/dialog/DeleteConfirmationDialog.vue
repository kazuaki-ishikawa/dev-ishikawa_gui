<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

type PropType = {
  open: boolean
  type: 'flets' | 'vpn' | 'fic' | 'breakOut' | 'selfTerminals' | 'rinkLineGroup'
  data: { id?: string; customerNote?: string }
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'submit'): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const resource = computed(() => {
  switch (props.type) {
    case 'flets':
      return t('service.ipoe')
    case 'vpn':
      return 'VPN'
    case 'fic':
      return 'FIC'
    case 'breakOut':
      return t('service.breakOut')
    case 'selfTerminals':
      return t('service.terminal')
    case 'rinkLineGroup':
      return t('service.rinkLineGroups')
    default:
      return ''
  }
})

const label = computed(() => {
  switch (props.type) {
    case 'flets':
      return { id: t('ipoes.ipoeId'), customerNote: t('ipoes.customerNote') }
    case 'vpn':
      return { id: 'VPN ID', customerNote: t('vpn.name') }
    case 'fic':
      return { id: 'FIC ID', customerNote: t('fic.customerNote') }
    case 'breakOut':
      return { id: t('breakOut.id'), customerNote: t('breakOut.customerNote') }
    case 'selfTerminals':
      return { id: t('terminals.terminalId'), customerNote: t('terminals.name') }
    case 'rinkLineGroup':
      return { id: '', customerNote: t('rinkLineGroups.lineGroupName') }
    default:
      return {}
  }
})

const submitLabel = computed(() => props.type === 'rinkLineGroup' ? t('common.remove') : t('common.delete'))

const submitted = ref(false)
const handleSubmit = () => {
  submitted.value = true
  emits('submit')
}

watchEffect(() => {
  submitted.value = !props.open
})
</script>

<template>
  <DialogBase
    :open="open"
    :submit-label="submitLabel"
    submit-color="warning"
    :cancel-label="t('common.cancel')"
    :disabled="submitted"
    @submit="handleSubmit"
    @close="emits('close')"
  >
    <div class="px-5">
      <div data-cy="delete-confirmation-dialog-confirmation-message">{{ t('confirm.delete', { resource }) }}</div>
      <DetailGrid v-if="data.id">
        <div>{{ label.id }}</div>
        <div data-cy="delete-confirmation-dialog-id">{{ data.id }}</div>
      </DetailGrid>
      <DetailGrid v-if="data.customerNote">
        <div>{{ label.customerNote }}</div>
        <div data-cy="delete-confirmation-dialog-customer-note">{{ data.customerNote }}</div>
      </DetailGrid>
      <div v-if="type === 'selfTerminals'" class="text-warning" data-cy="delete-confirmation-dialog-abolition-notice">
        {{ t('terminals.note.abolitionNotice') }}
      </div>
    </div>
  </DialogBase>
</template>
