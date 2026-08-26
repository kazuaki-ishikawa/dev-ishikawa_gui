<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const terminalId = computed(() => route.params.id as string)

const { editable, selfTerminal, getSelfTerminal } = useGetSelfTerminal()
const { deleteDialog, deleteSelfTerminal } = useDeleteSelfTerminal()

const moveToEdit = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.SelfTerminals}/${terminalId.value}/edit` })
}
const handleDelete = async () => {
  await deleteSelfTerminal(terminalId.value)
  // 廃止に成功した後は自動的に一覧画面に戻る
  return navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.Terminals}` })
}

onBeforeMount(async () => {
  await getSelfTerminal(terminalId.value)
})
</script>

<template>
  <CardContainer>
    <SelfTerminalDetail :self-terminal="selfTerminal" :tenant-id="tenantId" />
    <div class="flex-flex-end-center">
      <CustomButton
        color="info"
        icon="left-arrow"
        :text="t('common.return')"
        :width="180"
        data-cy="self-terminals-id-index-return-button"
        @click="router.back()"
      />
      <CustomButton
        class="ml-6"
        color="warning"
        icon="right-arrow"
        :disabled="!editable"
        :text="t('common.delete')"
        :width="180"
        data-cy="self-terminals-id-index-delete-button"
        @click="deleteDialog = true"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="!editable"
        :text="t('common.edit')"
        :width="180"
        data-cy="self-terminals-id-index-edit-button"
        @click="moveToEdit()"
      />
    </div>
    <DeleteConfirmationDialog
      :open="deleteDialog"
      type="selfTerminals"
      :data="{ id: terminalId, customerNote: selfTerminal?.customerNote ?? '' }"
      data-cy="self-terminals-id-index-delete-confirmation-dialog"
      @submit="handleDelete"
      @close="deleteDialog = false"
    />
  </CardContainer>
</template>
