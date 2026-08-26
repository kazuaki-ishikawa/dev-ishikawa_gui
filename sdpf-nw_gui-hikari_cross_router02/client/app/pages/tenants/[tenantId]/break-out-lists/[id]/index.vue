<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { OperationTypes } from '@/api/terminals/constants'
import { TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const { loading } = useLoading()

const route = useRoute()
const router = useRouter()

const tenantId = computed(() => route.params.tenantId as string)
const breakOutListId = computed(() => route.params.id as string)
const openBreakOutApplyDialog = ref(false)
const activeTerminalIds = ref<string[]>([])

const { breakOut, getBreakOut } = useGetBreakOut()
const { deleteDialog, deleteBreakOut } = useDeleteBreakOut()
const handleRemoveBreakOut = async () => {
  await deleteBreakOut(breakOutListId.value)
  moveToList()
}

const { postTerminalBulkOperation } = usePostTerminalBulkOperation()
const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()

const disabled = computed(() => !breakOut.value || breakOut.value.resourceStatus === ResourceStatusTypes.Terminated)
watch(resourceSummaryTerminalList, () => {
  activeTerminalIds.value = resourceSummaryTerminalList.value.terminals
    .filter(terminal => terminal.resourceStatus === ResourceStatusTypes.Active)
    .map(terminal => terminal.terminalId)
})
const breakOutListUpdateDisabled = computed(() => activeTerminalIds.value.length === 0)
const hasTerminals = computed(() => resourceSummaryTerminalList.value.terminals.length > 0)

const moveToList = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.BreakOutLists}` })
}
const moveToEdit = async () => {
  await navigateTo({
    path: `/tenants/${tenantId.value}/${TenantPages.BreakOutLists}/${breakOutListId.value}/edit`,
  })
}
const handlePostTerminalBulkOperation = async () => {
  await postTerminalBulkOperation(activeTerminalIds.value, OperationTypes.BreakOutListUpdate)
  openBreakOutApplyDialog.value = false
}

onBeforeMount(() => {
  getBreakOut(breakOutListId.value)
  getAllResourceSummaryTerminalList({ breakOutListId: breakOutListId.value })
})
</script>

<template>
  <CardContainer>
    <InnerCard :title="`${t('breakOut.title')} ${t('common.detail')}`">
      <BreakOutDetail :break-out="breakOut" show-times />
    </InnerCard>
    <div class="d-flex flex-wrap justify-space-between">
      <CustomButton
        icon="right-arrow"
        :width="260"
        :text="t('terminals.operations.breakOutListUpdate')"
        :disabled="disabled || breakOutListUpdateDisabled"
        data-cy="break-out-lists-id-index-apply-break-out-list-button"
        class="flex-start mt-2"
        @click="openBreakOutApplyDialog = true"
      />
      <div class="d-flex mt-2">
        <CustomButton
          icon="left-arrow"
          color="info"
          :width="180"
          :text="t('common.return')"
          data-cy="break-out-lists-id-index-return-button"
          @click="router.back()"
        />
        <CustomButton
          class="ml-6"
          icon="right-arrow"
          color="warning"
          :width="180"
          :text="t('common.delete')"
          :disabled="disabled || hasTerminals"
          data-cy="break-out-lists-id-index-delete-button"
          @click="deleteDialog = true"
        />
        <CustomButton
          class="ml-6"
          icon="right-arrow"
          :width="180"
          :text="t('common.edit')"
          :disabled="disabled"
          data-cy="break-out-lists-id-index-edit-button"
          @click="moveToEdit()"
        />
      </div>
    </div>
    <DeleteConfirmationDialog
      :open="deleteDialog"
      type="breakOut"
      :data="{ id: breakOut?.breakOutListId, customerNote: breakOut?.customerNote }"
      @submit="handleRemoveBreakOut"
      @close="deleteDialog = false"
    />
    <DialogBase
      :open="openBreakOutApplyDialog"
      :cancel-label="t('common.cancel')"
      :submit-label="t('common.apply')"
      :disabled="loading"
      @close="openBreakOutApplyDialog = false"
      @submit="handlePostTerminalBulkOperation"
    >
      <div class="text-center">{{ t('terminals.confirm.operations.breakOutListUpdate') }}</div>
    </DialogBase>
  </CardContainer>
</template>
