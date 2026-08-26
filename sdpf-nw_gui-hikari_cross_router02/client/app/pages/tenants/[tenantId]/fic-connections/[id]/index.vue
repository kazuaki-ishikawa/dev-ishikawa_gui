<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const ficConnectionId = computed(() => route.params.id as string)

const { loading } = useLoading()
const { ficConnection, getFicConnection, editable } = useGetFicConnection()
const { deleteDialog, deleteFicConnection } = useDeleteFicConnection()
const moveConsoleDialog = ref<'deleted' | 'move'>()

const handleRemoveFicConnection = async () => {
  ficConnection.value = await deleteFicConnection(ficConnectionId.value)
  // 廃止に成功した時にダイアログを表示する
  moveConsoleDialog.value = 'deleted'
}
const moveToEdit = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/fic-connections/${ficConnectionId.value}/edit` })
}

const handleMoveToConsole = async () => {
  moveConsoleDialog.value = undefined
  const ficConsoleURL = (window as { ficConsoleURL?: string }).ficConsoleURL ?? ''
  await navigateTo(
    { path: ficConsoleURL, query: { tenant_id: tenantId.value } },
    {
      open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
    },
  )
}

const dialog = computed(() => ({
  cancelLabel: moveConsoleDialog.value === 'move' ? t('common.close') : undefined,
  submitLabel: moveConsoleDialog.value === 'move' ? t('fic.moveToConsole') : t('fic.moveToDeleted'),
  close: () => {
    if (moveConsoleDialog.value === 'move') {
      moveConsoleDialog.value = undefined
    } else {
      return navigateTo({ path: `/tenants/${tenantId.value}/fic-connections` })
    }
  },
}))

onBeforeMount(() => getFicConnection(ficConnectionId.value))
</script>

<template>
  <CardContainer>
    <InnerCard>
      <DetailGrid>
        <div class="text-secondary text-lg">{{ t('fic.ficId') }}</div>
        <div>{{ ficConnection?.ficConnectionId }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="`${t('sideBar.fic')} ${t('common.detail')}`">
      <FicConnectionDetail :fic-connection="ficConnection" :tenant-id="tenantId" />
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CustomButton color="info" icon="left-arrow" :text="t('common.return')" :width="180" @click="router.back()" />
      <CustomButton
        class="ml-6"
        color="warning"
        icon="right-arrow"
        :text="t('common.delete')"
        :width="180"
        :disabled="!editable || loading"
        data-cy="fic-connection-id-index-delete-button"
        @click="deleteDialog = true"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :text="t('common.edit')"
        :width="180"
        :disabled="!editable || loading"
        data-cy="fic-connection-id-index-edit-button"
        @click="moveToEdit()"
      />
      <CustomButton
        class="ml-6"
        color="info"
        icon="right-arrow"
        :text="t('fic.moveToConsole')"
        :width="210"
        @click="moveConsoleDialog = 'move'"
      />
    </div>
    <DeleteConfirmationDialog
      :open="deleteDialog"
      type="fic"
      :data="{ id: ficConnection?.ficConnectionId, customerNote: ficConnection?.customerNote }"
      @submit="handleRemoveFicConnection"
      @close="deleteDialog = false"
    />
    <DialogBase
      :open="!!moveConsoleDialog"
      :cancel-label="dialog.cancelLabel"
      :submit-label="dialog.submitLabel"
      :submit-width="270"
      :disabled="loading"
      @close="dialog.close"
      @submit="handleMoveToConsole"
    >
      <template v-if="moveConsoleDialog === 'move'">
        <div class="text-pre-wrap mb-3">{{ t('fic.message.moveToConsole') }}</div>
      </template>
      <template v-else>
        <div class="text-center text-2xl mb-3">{{ t('message.deleted') }}</div>
        <div class="text-center text-pre-wrap mb-3">{{ t('fic.message.moveToDeleted') }}</div>
      </template>
    </DialogBase>
  </CardContainer>
</template>
