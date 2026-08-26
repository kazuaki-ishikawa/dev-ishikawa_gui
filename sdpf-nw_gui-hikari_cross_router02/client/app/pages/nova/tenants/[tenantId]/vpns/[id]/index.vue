<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Vpn.Detail,
})

const route = useRoute()
const { t } = useI18n()
const { loading } = useLoading()

const tenantId = computed(() => route.params.tenantId as string)
const vpnId = computed(() => route.params.id as string)

const { getVpn, vpn, routeItems, editable } = useGetVpn()
const { deleteDialog, deleteVpn } = useDeleteVpn()
const { allowNavigation } = useMiddleware()

const resourceName = computed(() => {
  if (!vpn.value) {
    return ''
  }
  return `${vpn.value.customerNote}（${vpn.value.vpnId}）`
})

const moveTo = (name: string, id?: string) => {
  if (!id) {
    return
  }
  return navigateTo({ name, params: { tenantId: tenantId.value, id } })
}

const handleDelete = async () => {
  try {
    await deleteVpn(vpnId.value)
    const targetRoute = { name: RouteName.Vpn.Delete, params: { tenantId: tenantId.value, id: vpnId.value } }
    allowNavigation(targetRoute)
    return navigateTo(targetRoute)
  } catch {
    // エラーの時は何もしない
  }
}

onBeforeMount(() => {
  getVpn(vpnId.value)
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="vpn?.customerNote">
      <div>
        <NovaMenuButton
          :button-label="t('nova.common.actionMenuButtonLabel')"
          :items="[
            {
              title: t('nova.sideBar.other.orders'),
              click: () => moveTo(RouteName.Order.Detail, vpn?.orderId),
              disabled: !vpn?.orderId,
            },
            {
              title: t('nova.common.delete'),
              color: 'error',
              click: () => (deleteDialog = true),
              disabled: !editable || loading,
            },
          ]"
        />
        <NovaCustomButton
          class="ml-4"
          prepend-icon="nova:edit"
          :disabled="!editable || loading"
          data-cy="vpns-id-index-edit-button"
          @click="moveTo(RouteName.Vpn.Edit, vpnId)"
        >
          {{ t('nova.common.update') }}
        </NovaCustomButton>
      </div>
    </NovaPageHeader>
    <NovaResourceStatusTag v-if="vpn?.resourceStatus" :status="vpn.resourceStatus" />

    <v-card class="my-5" :title="t('nova.details.basicInformation')">
      <v-card-item>
        <NovaVpnDetail :vpn="vpn" />
      </v-card-item>
    </v-card>
    <v-card class="my-5" :title="t('nova.vpn.routeList')">
      <v-card-item>
        <NovaVpnRouteTable :items="routeItems" />
      </v-card-item>
    </v-card>

    <NovaDeleteCard :disabled="!editable || loading" @click="deleteDialog = true">
      {{ t('nova.delete.confirmation') }}
    </NovaDeleteCard>

    <NovaDeleteDialog
      v-model="deleteDialog"
      :title="t('nova.delete.dialogTitle', { resourceType: 'VPN' })"
      :items="[
        { label: 'VPN ID', value: vpn?.vpnId ?? '' },
        { label: t('nova.vpn.name'), value: vpn?.customerNote ?? '' },
      ]"
      @submit="handleDelete"
    >
      <template #description>
        <div data-cy="vpns-id-index-delete-dialog-description">
          {{ t('nova.delete.dialogDescription', { resourceName: resourceName }) }}
        </div>
      </template>
    </NovaDeleteDialog>
  </div>
</template>
