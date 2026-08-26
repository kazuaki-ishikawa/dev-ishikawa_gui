<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const vpnId = computed(() => route.params.id as string)

const { loading } = useLoading()
const { getVpn, vpn, editable, routeHeaders, routeItems } = useGetVpn()
const { deleteDialog, deleteVpn } = useDeleteVpn()

const moveToEdit = async () => {
  await navigateTo({ path: `${route.path}/edit` })
}

const handleDelete = async () => {
  await deleteVpn(vpnId.value)
  return navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.Vpns}` })
}

onBeforeMount(() => {
  getVpn(vpnId.value)
})
</script>

<template>
  <CardContainer>
    <InnerCard>
      <DetailGrid>
        <div class="text-secondary text-lg">VPN ID</div>
        <div>{{ vpn?.vpnId }}</div>
      </DetailGrid>
    </InnerCard>
    <InnerCard :title="`VPN ${t('common.detail')}`">
      <VpnDetail :vpn="vpn" :tenant-id="tenantId" />
    </InnerCard>
    <InnerCard :title="t('vpn.routeList')">
      <SeparatedTable :headers="routeHeaders" :items="routeItems" :key-items="['route', 'resourceId']" />
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CustomButton color="info" icon="left-arrow" :text="t('common.return')" :width="180" @click="router.back()" />
      <CustomButton
        class="ml-6"
        color="warning"
        icon="right-arrow"
        :disabled="!editable || loading"
        :text="t('common.delete')"
        :width="180"
        data-cy="vpn-id-index-delete-button"
        @click="deleteDialog = true"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="!editable || loading"
        :text="t('common.edit')"
        :width="180"
        data-cy="vpn-id-index-edit-button"
        @click="moveToEdit()"
      />
    </div>
    <DeleteConfirmationDialog
      :open="deleteDialog"
      type="vpn"
      :data="{ id: vpn?.vpnId, customerNote: vpn?.customerNote }"
      @submit="handleDelete"
      @close="deleteDialog = false"
    />
  </CardContainer>
</template>
