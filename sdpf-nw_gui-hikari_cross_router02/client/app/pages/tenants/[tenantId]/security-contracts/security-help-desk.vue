<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { OrderStatusTypes } from '@/api/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const { loading } = useLoading()
const tenantId = computed(() => route.params.tenantId as string)

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const { securityHelpDesk, getSecurityHelpDesk, editable, status } = useGetSecurityHelpDesk()
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)

const dialogType = ref<'delete' | 'create' | null>(null)
const isCountsEmpty = computed(() => !securityHelpDesk.value?.supportedTerminalCount)
const { createSecurityHelpDesk } = useCreateSecurityHelpDesk()
const { deleteSecurityHelpDesk } = useDeleteSecurityHelpDesk()

const handleSubmit = async () => {
  try {
    if (dialogType.value === 'create') {
      securityHelpDesk.value = await createSecurityHelpDesk()
    } else if (dialogType.value === 'delete') {
      securityHelpDesk.value = await deleteSecurityHelpDesk()
    }
  } catch {
    securityHelpDesk.value = null
  } finally {
    // ダイアログを閉じる
    dialogType.value = null
  }
}

const orderIdLink = computed(() =>
  getOrderIdLink({ tenantId: tenantId.value, orderId: securityHelpDesk.value?.orderId }),
)

const isCreatable = computed(() =>
  [SecurityHelpDeskStatus.Unused, SecurityHelpDeskStatus.Deleted].includes(status.value),
)

onBeforeMount(async () => {
  await getSecurityTermsOfServiceAccepted()
  if (securityTermsOfServiceAccepted.value) {
    getSecurityHelpDesk()
  }
})
</script>

<template>
  <div>
    <CardContainer
      v-if="!securityHelpDesk?.effectiveDate && securityTermsOfServiceAccepted"
      data-cy="security-contracts-security-help-desk-campaign"
    >
      <div class="text-xl font-weight-bold">{{ t('securityHelpDesk.campaign') }}</div>
      <div class="mt-4">{{ t('securityHelpDesk.note.campaign') }}</div>
    </CardContainer>
    <CardContainer class="mt-4">
      <div class="flex-flex-start-center mb-3">
        <SvgIcon class="pt-1" :type="IconTypes.Support" color="secondary" />
        <div class="flex-grow-1 ml-2 text-lg">{{ t('securityContracts.securityHelpDesk') }}</div>
        <CustomButton
          v-if="!securityTermsOfServiceAccepted"
          color="primary"
          icon="up-right-square"
          :text="t('terms.confirmation')"
          :width="180"
          data-cy="security-contracts-security-help-desk-terms-of-service-button"
          @click="() => moveToSecurityTermOfService(tenantId)"
        />
      </div>
      <div v-if="!securityTermsOfServiceAccepted" class="text-warning mb-4">
        {{ t('securityHelpDesk.note.termsOfService') }}
      </div>
      <InnerCard>
        <DetailGrid>
          <div>{{ t('securityHelpDesk.status') }}</div>
          <div>{{ securityHelpDesk?.enabled ? t('securityHelpDesk.using') : t('securityHelpDesk.notUsing') }}</div>
        </DetailGrid>
        <DetailGrid v-if="!isCreatable">
          <div>
            {{
              status === SecurityHelpDeskStatus.Deleting ? t('details.serviceEndDate') : t('details.serviceStartDate')
            }}
          </div>
          <div>{{ formatDate(securityHelpDesk?.effectiveDate) }}</div>
        </DetailGrid>
        <DetailGrid v-if="!isCountsEmpty">
          <div>{{ t('securityHelpDesk.supportedTerminalCount') }}</div>
          <div>{{ securityHelpDesk?.supportedTerminalCount }}</div>
        </DetailGrid>
        <template v-if="!isCreatable">
          <DetailGrid>
            <div>{{ t('securityHelpDesk.supportUrl') }}</div>
            <NuxtLink v-if="securityHelpDesk?.supportUrl" :to="securityHelpDesk.supportUrl" target="_blank">
              {{ t('securityHelpDesk.contacts') }}
            </NuxtLink>
            <div v-else>-</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('securityHelpDesk.supportEmail') }}</div>
            <div>{{ securityHelpDesk?.supportEmail ?? '-' }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('details.orderId') }}</div>
            <NuxtLink v-if="orderIdLink" :to="orderIdLink">{{ securityHelpDesk?.orderId }}</NuxtLink>
            <div v-else>-</div>
          </DetailGrid>
          <DetailGrid
            v-if="!!securityHelpDesk?.orderStatus && securityHelpDesk.orderStatus !== OrderStatusTypes.Completed"
          >
            <div>{{ t('details.orderStatus') }}</div>
            <div>{{ orderStatusTypeTranslation[securityHelpDesk.orderStatus] }}</div>
          </DetailGrid>
        </template>
      </InnerCard>

      <div
        v-if="securityTermsOfServiceAccepted"
        class="text-pre-wrap text-warning"
        data-cy="security-contracts-security-help-desk-caution"
      >
        <div v-if="securityHelpDesk?.enabled">
          {{ t('securityHelpDesk.note.usingCaution') }}
        </div>
        <i18n-t v-else keypath="securityHelpDesk.note.notUsingCaution" tag="div" scope="global">
          <template #linkText>
            <NuxtLink
              to="https://sdpf.ntt.com/"
              target="_blank"
              data-cy="security-contracts-security-help-desk-support-link"
            >
              {{ t('securityHelpDesk.note.service') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </div>

      <div class="flex-end-center mt-4">
        <CustomButton
          v-if="isCreatable"
          color="primary"
          icon="right-arrow"
          :text="t('securityHelpDesk.create')"
          :width="180"
          :disabled="!securityTermsOfServiceAccepted || isCountsEmpty || !editable"
          data-cy="security-contracts-security-help-desk-create-button"
          @click="dialogType = 'create'"
        />
        <CustomButton
          v-if="status === SecurityHelpDeskStatus.Created"
          color="warning"
          icon="right-arrow"
          :text="t('securityHelpDesk.delete')"
          :width="180"
          :disabled="!editable"
          data-cy="security-contracts-security-help-desk-delete-button"
          @click="dialogType = 'delete'"
        />
      </div>
    </CardContainer>
    <DialogBase
      :open="!!dialogType"
      :submit-label="dialogType ? t(`securityHelpDesk.${dialogType}SubmitButton`) : undefined"
      :submit-color="dialogType === 'create' ? 'primary' : 'warning'"
      :cancel-label="t('common.cancel')"
      :disabled="loading"
      data-cy="security-contracts-security-help-desk-confirm-dialog"
      @submit="handleSubmit"
      @close="dialogType = null"
    >
      <div class="text-center text-lg mt-6">{{ t(`securityHelpDesk.confirm.${dialogType}`) }}</div>
    </DialogBase>
  </div>
</template>
