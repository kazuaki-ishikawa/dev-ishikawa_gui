<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.FicConnection.Delete,
  middleware: ['navigation'],
  params: ['tenantId', 'id'],
  fallback: {
    name: RouteName.FicConnection.List,
    params: ['tenantId'],
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
  },
})

const route = useRoute()
const { t } = useI18n()

const tenantId = computed(() => route.params.tenantId as string)
const ficConnectionId = computed(() => route.params.id as string)
const { ficConnection, getFicConnection } = useGetFicConnection()

const resourceName = computed(() => {
  if (!ficConnection.value) {
    return ''
  }
  return `${ficConnection.value.customerNote}（${ficConnection.value.ficConnectionId}）`
})

const moveToFicConnectionList = () => {
  return navigateTo({
    name: RouteName.FicConnection.List,
    params: { tenantId: tenantId.value },
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
    replace: true,
  })
}

const moveToFicConsole = async () => {
  const ficConsoleURL = (window as { ficConsoleURL?: string }).ficConsoleURL ?? ''
  await navigateTo(
    { path: ficConsoleURL, query: { tenant_id: tenantId.value } },
    {
      open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
    },
  )
}

onBeforeMount(() => {
  getFicConnection(ficConnectionId.value)
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="ficConnection?.customerNote" />

    <v-card class="mt-5">
      <NovaCardTitleWithBorder :title="t('nova.delete.completeTitle')">
        <NovaCardItemCompleted
          :order-id="ficConnection?.orderId ?? ''"
          :message="t('nova.fic.message.deleted', { resourceName })"
        />
        <span>{{ t('nova.fic.message.moveToDeleted') }}</span>
      </NovaCardTitleWithBorder>
    </v-card>

    <div class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined class="py-2" @click="moveToFicConnectionList">
        {{ t('nova.fic.moveToList') }}
      </NovaCustomButton>
      <NovaCustomButton class="py-2" @click="moveToFicConsole">
        <span class="text-pre-wrap">{{ t('nova.fic.moveToDeleted') }}</span>
      </NovaCustomButton>
    </div>
  </div>
</template>
