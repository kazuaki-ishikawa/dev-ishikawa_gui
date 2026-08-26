<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.FicConnection.Detail,
})

const route = useRoute()
const { t } = useI18n()
const { loading } = useLoading()

const tenantId = computed(() => route.params.tenantId as string)
const ficConnectionId = computed(() => route.params.id as string)
const { ficConnection, getFicConnection, editable } = useGetFicConnection()
const { deleteDialog, deleteFicConnection } = useDeleteFicConnection()
const { allowNavigation } = useMiddleware()

const moveConsoleDialog = ref(false)

const resourceName = computed(() => {
  if (!ficConnection.value) {
    return ''
  }
  return `${ficConnection.value.customerNote}（${ficConnection.value.ficConnectionId}）`
})

const moveToOrder = () => {
  return navigateTo({
    name: RouteName.Order.Detail,
    params: { tenantId: tenantId.value, id: ficConnection.value?.orderId },
  })
}

const moveToEdit = () => {
  return navigateTo({
    name: RouteName.FicConnection.Edit,
    params: { tenantId: tenantId.value, id: ficConnectionId.value },
  })
}

const handleMoveToConsole = async () => {
  moveConsoleDialog.value = false
  const ficConsoleURL = (window as { ficConsoleURL?: string }).ficConsoleURL ?? ''
  await navigateTo(
    { path: ficConsoleURL, query: { tenant_id: tenantId.value } },
    {
      open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
    },
  )
}

const handleDelete = async () => {
  try {
    await deleteFicConnection(ficConnectionId.value)
    const targetRoute = {
      name: RouteName.FicConnection.Delete,
      params: { tenantId: tenantId.value, id: ficConnectionId.value },
    }
    allowNavigation(targetRoute)
    return navigateTo(targetRoute)
  } catch {
    // エラー通知は useAPI 内で行う
    // コンソールに Vue 由来のエラーログが出力されないよう、ここで空の catch を行う
  } finally {
    deleteDialog.value = false
  }
}

onBeforeMount(() => {
  getFicConnection(ficConnectionId.value)
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="ficConnection?.customerNote">
      <div>
        <NovaCustomButton
          outlined
          prepend-icon="nova:order-history"
          :disabled="!ficConnection?.orderId"
          @click="moveToOrder"
        >
          {{ t('nova.sideBar.other.orders') }}
        </NovaCustomButton>
        <NovaCustomButton class="ml-4" prepend-icon="nova:edit" :disabled="!editable || loading" @click="moveToEdit">
          {{ t('nova.common.update') }}
        </NovaCustomButton>
      </div>
    </NovaPageHeader>
    <NovaResourceStatusTag v-if="ficConnection?.resourceStatus" :status="ficConnection.resourceStatus" />

    <v-card class="my-5" :title="t('nova.fic.detailInformation')">
      <template #append>
        <NovaCustomButton outlined append-icon="nova:up-right-square" @click="moveConsoleDialog = true">
          {{ t('nova.fic.moveToConsole') }}
        </NovaCustomButton>
      </template>
      <v-card-item>
        <NovaFicConnectionDetail :fic-connection="ficConnection" />
      </v-card-item>
    </v-card>

    <NovaDeleteCard class="mb-5" :disabled="!editable || loading" @click="deleteDialog = true">
      {{ t('nova.delete.confirmation') }}
    </NovaDeleteCard>

    <NovaDeleteDialog
      v-model="deleteDialog"
      :title="t('nova.delete.dialogTitle', { resourceType: t('nova.fic.name') })"
      :items="[
        { label: t('nova.fic.ficId'), value: ficConnection?.ficConnectionId ?? '' },
        { label: t('nova.fic.customerNote'), value: ficConnection?.customerNote ?? '' },
      ]"
      @submit="handleDelete"
    >
      <template #description>
        <div>{{ t('nova.delete.dialogDescription', { resourceName }) }}</div>
      </template>
    </NovaDeleteDialog>

    <NovaDialogBase v-model="moveConsoleDialog" :title="t('nova.fic.message.moveToConsole')" icon="alert-circle">
      <div class="text-pre-wrap">{{ t('nova.fic.message.workspace') }}</div>

      <template #actions>
        <NovaCustomButton outlined @click="moveConsoleDialog = false">
          {{ t('nova.common.cancel') }}
        </NovaCustomButton>
        <NovaCustomButton class="ml-4" @click="handleMoveToConsole">
          {{ t('nova.fic.moveToConsole') }}
        </NovaCustomButton>
      </template>
    </NovaDialogBase>
  </div>
</template>
