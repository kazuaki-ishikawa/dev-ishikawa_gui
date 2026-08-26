<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteName } from '@/route/constants'
import { ResourceStatusTypes } from '@/api/constants'
import { OperationTypes } from '@/api/terminals/constants'

definePageMeta({
  name: RouteName.BreakOut.Detail,
})

const { t } = useI18n()
const { loading } = useLoading()
const route = useRoute()

const tenantId = computed(() => route.params.tenantId as string)
const breakOutListId = computed(() => route.params.id as string)
const openBreakOutApplyDialog = ref(false)

const { breakOut, getBreakOut } = useGetBreakOut()
const { postTerminalBulkOperation } = usePostTerminalBulkOperation()
const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { allowNavigation } = useMiddleware()

const disabled = computed(
  () => !breakOut.value || loading.value || breakOut.value.resourceStatus === ResourceStatusTypes.Terminated,
)
const activeTerminalIds = computed(() =>
  resourceSummaryTerminalList.value.terminals
    .filter(terminal => terminal.resourceStatus === ResourceStatusTypes.Active)
    .map(terminal => terminal.terminalId),
)
const breakOutListUpdateDisabled = computed(() => activeTerminalIds.value.length === 0)
const hasTerminals = computed(() => resourceSummaryTerminalList.value.terminals.length > 0)
const applyDisabled = computed(() => disabled.value || breakOutListUpdateDisabled.value)

const moveToOrder = () => {
  return navigateTo({ name: RouteName.Order.Detail, params: { tenantId: tenantId.value, id: breakOut.value?.orderId } })
}
const moveToEdit = () => {
  return navigateTo({ name: RouteName.BreakOut.Edit, params: { tenantId: tenantId.value, id: breakOutListId.value } })
}

const handlePostTerminalBulkOperation = async () => {
  try {
    await postTerminalBulkOperation(activeTerminalIds.value, OperationTypes.BreakOutListUpdate)
    const targetRoute = {
      name: RouteName.BreakOut.Apply,
      params: { tenantId: tenantId.value, id: breakOutListId.value },
    }
    allowNavigation(targetRoute)
    return navigateTo(targetRoute)
  } finally {
    openBreakOutApplyDialog.value = false
  }
}

onBeforeMount(() => {
  getBreakOut(breakOutListId.value)
  getAllResourceSummaryTerminalList({ breakOutListId: breakOutListId.value })
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="breakOut?.customerNote">
      <div>
        <NovaCustomButton
          outlined
          prepend-icon="nova:order-history"
          :disabled="!breakOut?.orderId"
          @click="moveToOrder"
        >
          {{ t('nova.sideBar.other.orders') }}
        </NovaCustomButton>
        <NovaCustomButton class="ml-4" prepend-icon="nova:edit" :disabled="disabled" @click="moveToEdit">
          {{ t('nova.common.update') }}
        </NovaCustomButton>
      </div>
    </NovaPageHeader>

    <NovaCautionCard v-if="!applyDisabled" :title="t('nova.breakOut.message.alert')" icon="alert-triangle" class="mt-3">
      <div class="flex-space-between-center">
        <div>適用すると</div>
        <NovaCustomButton @click="openBreakOutApplyDialog = true">
          {{ t('nova.breakOut.applyButton') }}
        </NovaCustomButton>
      </div>
    </NovaCautionCard>

    <v-card class="my-5" :title="t('nova.details.basicInformation')">
      <v-card-item>
        <NovaBreakOutDetail :break-out="breakOut" />
      </v-card-item>
      <div class="flex-end-center mb-5 mr-4">
        <NovaCustomButton :disabled="applyDisabled" @click="openBreakOutApplyDialog = true">
          {{ t('nova.breakOut.applyButton') }}
        </NovaCustomButton>
      </div>
    </v-card>

    <NovaDeleteCard class="mb-5" :disabled="disabled || hasTerminals">
      {{ t('nova.delete.confirmation') }}
    </NovaDeleteCard>

    <NovaDialogBase v-model="openBreakOutApplyDialog" :title="t('nova.breakOut.applyDialogTitle')">
      {{ t('nova.breakOut.message.applySetting') }}

      <template #actions>
        <NovaCustomButton outlined @click="openBreakOutApplyDialog = false">
          {{ t('nova.common.cancel') }}
        </NovaCustomButton>
        <NovaCustomButton class="ml-4" :disabled="loading" @click="handlePostTerminalBulkOperation">
          {{ t('nova.breakOut.applyDialogSubmitButton') }}
        </NovaCustomButton>
      </template>
    </NovaDialogBase>
  </div>
</template>
