<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SELF_TERMINAL_LINK } from '@/api/selfTerminals/constants'
import { SecurityContractsPages, TenantPages } from '@/components/sidebar/constants'

const props = defineProps<{
  open: boolean
  orderId?: string
  bulkOrderId?: string
  terminalId?: string
  showHelpDeskCampaign?: boolean
}>()
type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const acceptedMessage = computed(() => {
  if (props.orderId) {
    return `${t('message.accepted')}\n${t('details.orderId')} ${props.orderId}`
  }
  if (props.bulkOrderId) {
    return `${t('message.accepted')}\n${t('orders.bulkOrderId')} ${props.bulkOrderId}`
  }
  return t('message.accepted')
})

const moveToOrderDetailButtonLabel = computed(() => {
  return props.orderId ? t('common.moveToOrderDetail') : t('common.moveToOrderList')
})

const moveToOrderDetail = () => {
  // 自営ルーター作成以外はオーダー詳細かオーダー一覧に遷移させる
  if (props.orderId) {
    return navigateTo(`/tenants/${tenantId.value}/${TenantPages.Orders}/${props.orderId}`, { replace: true })
  }

  // edit-bulk から呼び出した場合は bulkOrderId は存在しないので undefined になる
  return navigateTo(
    {
      path: `/tenants/${tenantId.value}/${TenantPages.Orders}`,
      query: { bulkOrderId: props.bulkOrderId },
    },
    { replace: true },
  )
}

const moveToDetail = async () => {
  await navigateTo(`/tenants/${tenantId.value}/self-terminals/${props.terminalId}`, { replace: true })
}

const moveToSecurityHelpDeskCreate = async () => {
  await navigateTo(
    `/tenants/${tenantId.value}/${TenantPages.SecurityContracts}/${SecurityContractsPages.SecurityHelpDesk}`,
    { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } },
  )
}
</script>

<template>
  <DialogBase :open="open" data-cy="terminal-success-dialog" @close="emits('close')">
    <div class="text-center text-pre-wrap">
      <!-- 申込受付メッセージ -->
      <div data-cy="terminal-success-dialog-accepted-message">{{ acceptedMessage }}</div>
      <!-- 自営ルーター作成後メッセージ -->
      <div v-if="terminalId">
        <div data-cy="self-terminal-create-dialog-message-1">{{ t('selfTerminals.created.message-1') }}</div>
        <div data-cy="self-terminal-create-dialog-message-2" class="text-error mb-6">
          {{ t('selfTerminals.created.message-2') }}
        </div>
        <i18n-t
          keypath="selfTerminals.created.message-3"
          tag="div"
          scope="global"
          data-cy="self-terminal-create-dialog-message-3"
        >
          <template #here>
            <NuxtLink :to="SELF_TERMINAL_LINK.TICKET" class="text-primary">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </div>
      <!-- ヘルプデスクキャンペーン -->
      <div v-if="showHelpDeskCampaign" class="mt-6" data-cy="terminal-success-dialog-help-desk-campaign">
        {{ t('securityHelpDesk.note.campaignAdvertiseMessage') }}
      </div>
    </div>
    <template #footer>
      <div class="flex-center-center">
        <CustomButton
          v-if="!terminalId"
          :text="moveToOrderDetailButtonLabel"
          color="info"
          icon="right-arrow"
          :width="180"
          data-cy="terminal-success-dialog-move-to-order-detail"
          @click="moveToOrderDetail"
        />
        <CustomButton
          v-if="terminalId"
          :text="t('selfTerminals.created.button')"
          color="info"
          icon="right-arrow"
          :width="340"
          data-cy="terminal-success-dialog-move-to-detail"
          @click="moveToDetail"
        />
        <CustomButton
          v-if="showHelpDeskCampaign"
          :text="t('securityHelpDesk.securityHelpDeskCreateButton')"
          color="primary"
          icon="up-right-square"
          :width="180"
          data-cy="terminal-success-dialog-move-to-security-help-desk-create"
          class="ml-5"
          @click="moveToSecurityHelpDeskCreate"
        />
      </div>
    </template>
  </DialogBase>
</template>
