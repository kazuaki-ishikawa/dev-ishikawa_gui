<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Ipoe.Delete,
  middleware: ['navigation'],
  params: ['tenantId', 'id'],
  fallback: {
    name: RouteName.Ipoe.List,
    params: ['tenantId'],
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
  },
})

const route = useRoute()
const { t } = useI18n()

const tenantId = computed(() => route.params.tenantId as string)
const ipoeId = computed(() => route.params.id as string)

const { fletsSeparate, hikariCollabo, isFletsSeparate, getIpoe } = useGetIpoe()

const customerNote = computed(() => fletsSeparate.value?.customerNote ?? hikariCollabo.value?.customerNote ?? '')

const moveToIpoeList = () => {
  return navigateTo({
    name: RouteName.Ipoe.List,
    params: { tenantId: tenantId.value },
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
    replace: true,
  })
}
const moveToOrderDetail = (id: string) => {
  return navigateTo({
    name: RouteName.Order.Detail,
    params: { tenantId: tenantId.value, id },
    replace: true,
  })
}

onBeforeMount(() => {
  getIpoe(ipoeId.value)
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="customerNote" />
    <template v-if="isFletsSeparate">
      <v-card class="mt-5">
        <NovaCardTitleWithBorder :title="t('nova.delete.completeTitle')">
          <NovaCardItemCompleted
            :order-id="fletsSeparate?.orderId ?? ''"
            :message="t('nova.delete.sentMail', { resourceName: t('nova.ipoe.name') })"
          />
          <span class="text-pre-wrap">{{ t('nova.update.completeDescription') }}</span>
        </NovaCardTitleWithBorder>
      </v-card>

      <div class="flex-center-center ga-6 py-4">
        <NovaCustomButton outlined data-cy="ipoes-id-delete-cancel-button" @click="moveToIpoeList">
          {{ t('nova.ipoe.moveToList') }}
        </NovaCustomButton>
        <NovaCustomButton
          :disabled="!fletsSeparate?.orderId"
          data-cy="ipoes-id-delete-submit-button"
          @click="moveToOrderDetail(fletsSeparate?.orderId ?? '')"
        >
          {{ t('nova.common.moveToOrderDetail') }}
        </NovaCustomButton>
      </div>
    </template>
  </div>
</template>
