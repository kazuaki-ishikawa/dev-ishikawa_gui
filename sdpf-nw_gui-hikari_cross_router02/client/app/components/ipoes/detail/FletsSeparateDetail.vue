<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FletsSeparateResponse } from '@/api/ipoes/types'

type PropType = {
  fletsSeparate: FletsSeparateResponse | null
  tenantId: string
  isOrder?: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { getHikariPlanText, getIpoeTypeText, isWidePlanType, getExistText, getFletsOpenText } = useIpoes()

const terminalId = computed(() => props.fletsSeparate?.terminalId)
const terminalIdLink = computed(() =>
  terminalId.value ? `/tenants/${props.tenantId}/terminals/${terminalId.value}` : '',
)

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderId = computed(() => props.fletsSeparate?.orderId)
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: orderId.value }))
</script>

<template>
  <div>
    <InnerCard :title="t('sideBar.ipoes')">
      <DetailGrid>
        <div>{{ t('ipoes.ipoeId') }}</div>
        <div>{{ fletsSeparate?.ipoeId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.customerNote') }}</div>
        <div>{{ fletsSeparate?.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.requestType') }}</div>
        <div>{{ t('ipoes.fletsSeparate') }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ipv4Address') }}</div>
        <div>{{ fletsSeparate?.ipv4Address }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.fletsId') }}</div>
        <div>{{ fletsSeparate?.fletsId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.hikariPlan') }}</div>
        <div data-cy="flets-separate-detail-hikari-plan">{{ getHikariPlanText(fletsSeparate?.hikariPlan) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.terminalId') }}</div>
        <NuxtLink class="cursor-pointer" :to="terminalIdLink">{{ terminalId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ipoeType') }}</div>
        <div data-cy="flets-separate-detail-ipoe-type">{{ getIpoeTypeText(fletsSeparate?.ipoeType) }}</div>
      </DetailGrid>
      <DetailGrid v-if="isWidePlanType(fletsSeparate?.ipoeType)">
        <div>{{ t('ipoes.appControl') }}</div>
        <div data-cy="flets-separate-detail-app-control">{{ getExistText(fletsSeparate?.appControl) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ref') }}</div>
        <div>{{ fletsSeparate?.ref }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ fletsSeparate?.resourceStatus }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink class="cursor-pointer" :to="orderIdLink">{{ orderId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid v-if="fletsSeparate?.orderStatus && !isOrder">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[fletsSeparate.orderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div>{{ formatDateTime(fletsSeparate?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div>{{ formatDateTime(fletsSeparate?.updateTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.serviceStartTime') }}</div>
        <div>{{ formatDateTime(fletsSeparate?.serviceStartTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="t('ipoes.fletsSeparate')">
      <DetailGrid>
        <div>{{ t('ipoes.accessKey') }}</div>
        <div>{{ fletsSeparate?.accessKey }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ipoeApplicationDate') }}</div>
        <div>{{ formatDate(fletsSeparate?.ipoeApplicationDate) }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="t('ipoes.fletsInformation')">
      <DetailGrid>
        <div>{{ t('ipoes.fletsOpen') }}</div>
        <div>{{ getFletsOpenText(fletsSeparate?.fletsOpen) }}</div>
      </DetailGrid>
      <DetailGrid v-if="!fletsSeparate?.fletsOpen">
        <div>{{ t('ipoes.fletsOpenDate') }}</div>
        <div>{{ formatDate(fletsSeparate?.fletsOpenDate) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.contractorName') }}</div>
        <div>{{ fletsSeparate?.originContractor?.name }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.contractorNameKana') }}</div>
        <div>{{ fletsSeparate?.originContractor?.nameKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.contractorPhoneNumber') }}</div>
        <div>{{ fletsSeparate?.originContractor?.phoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.contractorPostalCode') }}</div>
        <div>{{ fletsSeparate?.originContractor?.postalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.contractorMailAddress') }}</div>
        <div>{{ fletsSeparate?.originContractor?.mailAddress }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.installationPlacePhoneNumber') }}</div>
        <div>{{ fletsSeparate?.installationPlace?.phoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.installationPlacePostalCode') }}</div>
        <div>{{ fletsSeparate?.installationPlace?.postalCode }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="t('ipoes.applicant')">
      <DetailGrid>
        <div>{{ t('ipoes.applicantName') }}</div>
        <div>{{ fletsSeparate?.applicant?.name }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.applicantNameKana') }}</div>
        <div>{{ fletsSeparate?.applicant?.nameKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.applicantPhoneNumber') }}</div>
        <div>{{ fletsSeparate?.applicant?.phoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.applicantMailAddress') }}</div>
        <div>{{ fletsSeparate?.applicant?.mailAddress }}</div>
      </DetailGrid>
    </InnerCard>
  </div>
</template>
