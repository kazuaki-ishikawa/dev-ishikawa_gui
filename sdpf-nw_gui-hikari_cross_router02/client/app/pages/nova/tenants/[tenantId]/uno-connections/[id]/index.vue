<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.UnoConnection.Detail,
})

const route = useRoute()
const { t } = useI18n()
const { loading } = useLoading()

const tenantId = computed(() => route.params.tenantId as string)
const unoConnectionId = computed(() => route.params.id as string)

const { getUnoConnection, unoConnection, deletable } = useGetUnoConnection()
const { deleteDialog, deleteUnoConnection } = useDeleteUnoConnection()
const { allowNavigation } = useMiddleware()

const resourceName = computed(() => {
  if (!unoConnection.value) {
    return ''
  }
  return `${unoConnection.value.customerNote}（${unoConnection.value.unoConnectionId}）`
})

const moveToOrder = () => {
  return navigateTo({
    name: RouteName.Order.Detail,
    params: { tenantId: tenantId.value, id: unoConnection.value?.orderId },
  })
}
const handleDelete = async () => {
  try {
    await deleteUnoConnection(unoConnectionId.value)
    const targetRoute = {
      name: RouteName.UnoConnection.Delete,
      params: { tenantId: tenantId.value, id: unoConnectionId.value },
    }
    allowNavigation(targetRoute)
    return navigateTo(targetRoute)
  } catch {
    // エラーの時は何もしない
  }
}

onBeforeMount(() => {
  getUnoConnection(unoConnectionId.value)
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="unoConnection?.customerNote">
      <div>
        <NovaCustomButton
          outlined
          prepend-icon="nova:order-history"
          :disabled="!unoConnection?.orderId"
          @click="moveToOrder"
        >
          {{ t('nova.sideBar.other.orders') }}
        </NovaCustomButton>
      </div>
    </NovaPageHeader>
    <NovaResourceStatusTag v-if="unoConnection?.resourceStatus" :status="unoConnection.resourceStatus" />

    <v-card class="my-5" :title="t('nova.details.basicInformation')">
      <NovaUnoConnectionDetail :uno-connection="unoConnection" />
    </v-card>

    <NovaDeleteCard class="mb-5" :disabled="!deletable || loading" @click="deleteDialog = true">
      {{ t('nova.delete.confirmation') }}
    </NovaDeleteCard>

    <NovaDeleteDialog
      v-model="deleteDialog"
      :title="t('nova.delete.dialogTitle', { resourceType: t('nova.unoConnections.title') })"
      :items="[
        { label: t('nova.unoConnections.unoConnectionId'), value: unoConnection?.unoConnectionId ?? '' },
        { label: t('nova.unoConnections.customerNote'), value: unoConnection?.customerNote ?? '' },
      ]"
      @submit="handleDelete"
    >
      <template #description>
        <div class="text-pre-wrap" data-cy="uno-connections-id-index-delete-dialog-description">
          {{ t('nova.delete.dialogDescription', { resourceName }) }}
        </div>
      </template>
    </NovaDeleteDialog>
  </div>
</template>
