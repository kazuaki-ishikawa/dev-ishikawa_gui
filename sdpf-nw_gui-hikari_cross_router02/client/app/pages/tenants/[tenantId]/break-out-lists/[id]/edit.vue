<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { initialBreakOutData, initialBreakOutValid } from '@/api/breakOut/constants'
import { OperationTypes } from '@/api/terminals/constants'
import { TenantPages } from '@/components/sidebar/constants'

const router = useRouter()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const breakOutListId = computed(() => route.params.id as string)

const { t } = useI18n()
const { loading } = useLoading()
const rules = useRules()

const { navigationGuard } = useNavigationGuard()
const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const { formatBreakOutPostRequest, lengthRule } = useBreakOut()
const { customerNoteList, getBreakOutList } = useGetBreakOutList()
const { breakOut, getBreakOut } = useGetBreakOut()
const { updateBreakOut } = useUpdateBreakOut()

const { postTerminalBulkOperation } = usePostTerminalBulkOperation()
const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()

const inputData = ref(structuredClone(initialBreakOutData))
const inputValid = ref(structuredClone(initialBreakOutValid))
const isConfirmation = ref(false)
const openDialog = ref(false)
const activeTerminalIds = ref<string[]>([])

watch(resourceSummaryTerminalList, () => {
  activeTerminalIds.value = resourceSummaryTerminalList.value.terminals
    .filter(terminal => terminal.resourceStatus === ResourceStatusTypes.Active)
    .map(terminal => terminal.terminalId)
})
const breakOutListUpdateDisabled = computed(() => activeTerminalIds.value.length === 0)

const originalData = computed(() => ({
  customerNote: breakOut.value?.customerNote ?? '',
  fqdnList: breakOut.value?.fqdnList?.join('\n') ?? '',
  prefixList: breakOut.value?.prefixList?.join('\n') ?? '',
}))
const orderIdLink = computed(() =>
  breakOut.value ? getOrderIdLink({ tenantId: breakOut.value.tenantId, orderId: breakOut.value.orderId }) : '',
)

const originalRequest = computed(() => formatBreakOutPostRequest(originalData.value))
const request = computed(() => formatBreakOutPostRequest(inputData.value))
const length = computed(() => ({
  fqdnList: request.value.fqdnList?.length ?? 0,
  prefixList: request.value.prefixList?.length ?? 0,
  total: (request.value.fqdnList?.length ?? 0) + (request.value.prefixList?.length ?? 0),
}))
const disabled = computed(
  () =>
    !breakOut.value ||
    breakOut.value.resourceStatus === ResourceStatusTypes.Terminated ||
    Object.values(inputValid.value).some(valid => !valid) ||
    // 改行で変更判定されないようにrequest値で変更判定する
    isEqual(request.value, originalRequest.value),
)

const handlePostTerminalBulkOperation = async () => {
  await postTerminalBulkOperation(activeTerminalIds.value, OperationTypes.BreakOutListUpdate)
  openDialog.value = false
  navigationGuard(false)
  router.back()
}
const handleSave = async () => {
  // 変更のあったデータのみ送信する
  const updateRequest = {
    customerNote:
      request.value.customerNote === originalRequest.value.customerNote ? undefined : request.value.customerNote,
    fqdnList: isEqual(request.value.fqdnList, originalRequest.value.fqdnList)
      ? undefined
      : (request.value.fqdnList ?? []),
    prefixList: isEqual(request.value.prefixList, originalRequest.value.prefixList)
      ? undefined
      : (request.value.prefixList ?? []),
  }
  breakOut.value = await updateBreakOut(breakOutListId.value, updateRequest)
  openDialog.value = true
}

const handleClose = () => {
  openDialog.value = false
  navigationGuard(false)
  router.back()
}

const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})

const moveToOrderDetail = async () => {
  openDialog.value = false
  await navigateTo(`/tenants/${tenantId.value}/${TenantPages.Orders}/${breakOut.value?.orderId}`, { replace: true })
}

watch(originalData, next => (inputData.value = { ...next }))
watchEffect(() => navigationGuard(!isEqual(request.value, originalRequest.value)))

onBeforeMount(() => {
  getBreakOutList()
  getBreakOut(breakOutListId.value)
  getAllResourceSummaryTerminalList({ breakOutListId: breakOutListId.value })
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">
      {{ t('confirm.update') }}
    </div>
    <InnerCard :title="`${t('breakOut.title')} ${t('common.edit')}`">
      <InputGrid required :label="t('breakOut.customerNote')" :help="t('breakOut.help.customerNote')">
        <InputForm
          v-model="inputData.customerNote"
          maxlength="64"
          required
          :placeholder="t('breakOut.placeholder.list')"
          :disabled="isConfirmation"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList, breakOutListId)]"
          data-cy="break-out-lists-id-edit-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <InputGrid
        :label="t('breakOut.fqdnList')"
        :help="t('breakOut.help.fqdnList', { example: t('breakOut.placeholder.fqdnList') })"
      >
        <div class="flex-flex-start-flex-start">
          <TextareaForm
            v-model="inputData.fqdnList"
            :placeholder="t('breakOut.placeholder.fqdnList')"
            :disabled="isConfirmation"
            :rules="[lengthRule(length.total), rules.fqdnList]"
            :required="length.total === 0"
            data-cy="break-out-lists-id-edit-fqdn-list"
            @valid="(valid: boolean) => (inputValid.fqdnList = valid)"
          />
          <div class="px-5">{{ length.fqdnList + t('breakOut.listUnit') }}</div>
        </div>
        <div class="text-sm pl-2">{{ t('breakOut.note.fqdnList') }}</div>
      </InputGrid>
      <InputGrid
        :label="t('breakOut.prefixList')"
        :help="t('breakOut.help.prefixList', { example: t('breakOut.placeholder.prefixList') })"
      >
        <div class="flex-flex-start-flex-start">
          <TextareaForm
            v-model="inputData.prefixList"
            :placeholder="t('breakOut.placeholder.prefixList')"
            :disabled="isConfirmation"
            :rules="[lengthRule(length.total), rules.prefixList]"
            :required="length.total === 0"
            data-cy="break-out-lists-id-edit-prefix-list"
            @valid="(valid: boolean) => (inputValid.prefixList = valid)"
          />
          <div class="px-5">{{ length.prefixList + t('breakOut.listUnit') }}</div>
        </div>
      </InputGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink
          v-if="!!orderIdLink"
          class="cursor-pointer"
          :to="orderIdLink"
          data-cy="break-out-lists-id-edit-order-id-link"
        >
          {{ breakOut?.orderId }}
        </NuxtLink>
        <div v-else>{{ breakOut?.orderId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div data-cy="break-out-lists-id-edit-creation-time">{{ formatDateTime(breakOut?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid v-if="breakOut?.orderStatus">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[breakOut.orderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div data-cy="break-out-lists-id-edit-update-time">{{ formatDateTime(breakOut?.updateTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="disabled || loading"
        :width="180"
        :text="submit.text"
        data-cy="break-out-lists-id-edit-save-button"
        @click="submit.click"
      />
    </div>
    <DialogBase :open="openDialog" @close="handleClose">
      <div class="text-center text-pre-wrap text-lg">{{ t('message.accepted') }}</div>
      <div v-if="!breakOutListUpdateDisabled" class="mt-3 text-center text-lg">
        {{ t('terminals.confirm.operations.breakOutListUpdate') }}
      </div>
      <template #footer>
        <div class="flex-center-center">
          <CustomButton
            v-if="!breakOutListUpdateDisabled"
            class="mr-4"
            :text="t('terminals.operations.breakOutListUpdate')"
            icon="right-arrow"
            :width="280"
            :disabled="loading"
            data-cy="break-out-lists-id-edit-break-out-list-update-button"
            @click="handlePostTerminalBulkOperation"
          />
          <CustomButton
            :text="t('common.moveToOrderDetail')"
            icon="right-arrow"
            color="info"
            :width="280"
            data-cy="break-out-lists-id-edit-move-to-order-detail-button"
            @click="moveToOrderDetail"
          />
        </div>
      </template>
    </DialogBase>
  </CardContainer>
</template>
