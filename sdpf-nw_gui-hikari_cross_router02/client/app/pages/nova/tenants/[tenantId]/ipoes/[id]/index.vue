<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LansTypes } from '@/api/terminals/constants'
import { TabNames } from '@/components/nova/ipoes/constants'
import type { TabNameType } from '@/components/nova/ipoes/types'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Ipoe.Detail,
})

const route = useRoute()
const { t } = useI18n()
const { loading } = useLoading()

const tenantId = computed(() => route.params.tenantId as string)
const ipoeId = computed(() => route.params.id as string)

const { getIpoe, hikariCollabo, fletsSeparate, isHikariCollabo, editable } = useGetIpoe()
const { deleteDialog, deleteFletsSeparate } = useDeleteFletsSeparate()
const { getOrder, order } = useGetOrder()
const { getTerminal, terminal } = useGetTerminal()
const { availableTime, checkAvailableTime } = useCheckAvailableTime()
const { contractor, getContractor } = useGetContractor()
const { allowNavigation } = useMiddleware()

const currentTab = ref<TabNameType>(TabNames.Contract)
const tabs = computed(() => [
  {
    title: t('nova.ipoes.contractInformation'),
    value: TabNames.Contract,
    dataCy: 'nova-ipoes-id-contract-tab',
  },
  ...(hikariCollabo.value
    ? [
        {
          title: t('nova.ipoes.fieldSurveyAndConstructionInformation'),
          value: TabNames.Construction,
          dataCy: 'nova-ipoes-id-construction-tab',
        },
      ]
    : []),
])

// フレッツ別契約型/光一括型
const currentIpoe = computed(() => fletsSeparate.value ?? hikariCollabo.value)

const isOutsideReceptionHour = computed(() => isHikariCollabo.value && !availableTime.value?.available)
const hasEmptyAddressCode = computed(() => isHikariCollabo.value && !contractor.value?.addressCode)
const deleteButtonDisabled = computed(
  () => !editable.value || loading.value || isOutsideReceptionHour.value || hasEmptyAddressCode.value,
)

const fieldSurveyButtonDisabled = computed(
  () =>
    !!hikariCollabo.value?.fieldSurvey?.date ||
    !!hikariCollabo.value?.construction?.date ||
    !!hikariCollabo.value?.ticketIssueRequirement ||
    (!hikariCollabo.value?.fieldSurveyRequirement && !hikariCollabo.value?.constructionOption?.siteRouteSurvey),
)
const constructionButtonDisabled = computed(
  () =>
    !!hikariCollabo.value?.construction?.date ||
    !!hikariCollabo.value?.ticketIssueRequirement ||
    (!!hikariCollabo.value?.fieldSurveyRequirement && !hikariCollabo.value.fieldSurvey?.date) ||
    (!!hikariCollabo.value?.constructionOption?.siteRouteSurvey && !hikariCollabo.value.fieldSurvey?.date),
)

const circuitType = computed(() => {
  if (!currentIpoe.value || !terminal.value) {
    return null
  }
  if (terminal.value.primaryCircuit.circuitId === currentIpoe.value.ipoeId) {
    return LansTypes.Primary
  }
  if (terminal.value.secondaryCircuit?.circuitId === currentIpoe.value.ipoeId) {
    return LansTypes.Secondary
  }
  return null
})

const moveToOrder = () => {
  return navigateTo({
    name: RouteName.Order.Detail,
    params: { tenantId: tenantId.value, id: currentIpoe.value?.orderId },
  })
}

const moveToFieldSurveyReservation = () => {
  // TODO: 現地調査日予約画面の実装後に遷移する
  console.log('TODO: Move to the field survey reservation page')
}

const moveToConstructionReservation = () => {
  // TODO: 宅内工事日予約画面の実装後に遷移する
  console.log('TODO: Move to the construction reservation page')
}

const resourceName = computed(() => {
  if (!fletsSeparate.value) {
    return ''
  }
  return `${fletsSeparate.value.customerNote}（${fletsSeparate.value.ipoeId}）`
})
const handleDelete = () => {
  if (isHikariCollabo.value) {
    // TODO: 光回線一括提供型の廃止画面に遷移
  } else {
    deleteDialog.value = true
  }
}
const executeDelete = async () => {
  try {
    await deleteFletsSeparate(ipoeId.value)
    const targetRoute = { name: RouteName.Ipoe.Delete, params: { tenantId: tenantId.value, id: ipoeId.value } }
    allowNavigation(targetRoute)
    return navigateTo(targetRoute)
  } catch {
    // エラーの時は何もしない
  }
}

onBeforeMount(async () => {
  await getIpoe(ipoeId.value)
  checkAvailableTime()
  getContractor()
  if (hikariCollabo.value?.orderId) {
    await getOrder(hikariCollabo.value.orderId)
  }
  if (currentIpoe.value?.terminalId) {
    await getTerminal(currentIpoe.value.terminalId)
  }
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="currentIpoe?.customerNote">
      <div>
        <NovaCustomButton
          outlined
          prepend-icon="nova:order-history"
          :disabled="!currentIpoe?.orderId"
          @click="moveToOrder"
        >
          {{ t('nova.sideBar.other.orders') }}
        </NovaCustomButton>
        <NovaCustomButton class="ml-4" prepend-icon="nova:edit" :disabled="!editable || loading">
          {{ t('nova.common.update') }}
        </NovaCustomButton>
      </div>
    </NovaPageHeader>
    <div v-if="currentIpoe?.resourceStatus || circuitType" class="d-flex align-center ga-2">
      <NovaCircuitTypeTag v-if="circuitType" :type="circuitType" data-cy="nova-ipoes-id-circuit-type-tag" />
      <NovaResourceStatusTag
        v-if="currentIpoe?.resourceStatus"
        :status="currentIpoe.resourceStatus"
        data-cy="nova-ipoes-id-resource-status-tag"
      />
    </div>
    <template v-if="currentIpoe">
      <NovaTextSlideTab v-model="currentTab" :tabs="tabs" class="mt-5">
        <template #contract>
          <NovaFletsSeparateDetail v-if="fletsSeparate" :flets-separate="fletsSeparate" />
          <NovaHikariCollaboContractDetail v-else-if="hikariCollabo" :hikari-collabo="hikariCollabo" />
        </template>
        <template #construction>
          <NovaHikariCollaboConstructionDetail
            v-if="hikariCollabo"
            :hikari-collabo="hikariCollabo"
            :downloadable-document-id="order?.downloadableDocumentId"
            :field-survey-button-disabled="fieldSurveyButtonDisabled"
            :construction-button-disabled="constructionButtonDisabled"
            @reserve-field-survey="moveToFieldSurveyReservation"
            @reserve-construction="moveToConstructionReservation"
          />
        </template>
      </NovaTextSlideTab>
    </template>
    <NovaDeleteCard class="mb-5" :disabled="deleteButtonDisabled" @click="handleDelete">
      {{ t('nova.delete.confirmation') }}
    </NovaDeleteCard>

    <NovaDeleteDialog
      v-model="deleteDialog"
      :title="t('nova.delete.dialogTitle', { resourceType: t('nova.ipoe.name') })"
      :items="[
        { label: t('nova.ipoe.accessCircuitId'), value: fletsSeparate?.ipoeId ?? '' },
        { label: t('nova.ipoe.accessCircuitName'), value: fletsSeparate?.customerNote ?? '' },
      ]"
      :disabled="deleteButtonDisabled"
      @submit="executeDelete"
    >
      <template #description>
        <div data-cy="ipoes-id-index-delete-dialog-description">
          {{ t('nova.delete.dialogDescription', { resourceName }) }}
        </div>
      </template>
    </NovaDeleteDialog>
  </div>
</template>
