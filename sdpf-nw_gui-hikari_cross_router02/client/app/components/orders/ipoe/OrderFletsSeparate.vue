<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { FletsSeparatePostRequest } from '@/api/ipoes/types'

type PropType = {
  request: FletsSeparatePostRequest
}
defineProps<PropType>()
const { t } = useI18n()
const { getHikariPlanText, getIpoeTypeText, isWidePlanType, getFletsOpenText, getExistText } = useIpoes()
</script>

<template>
  <div>
    <InnerCard :title="t('ipoes.fletsSeparate')">
      <DetailGrid>
        <div>{{ t('ipoes.customerNote') }}</div>
        <div>{{ request.customerNote }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.fletsId">
        <div>{{ t('ipoes.fletsId') }}</div>
        <div>{{ request.fletsId }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.hikariPlan">
        <div>{{ t('ipoes.hikariPlan') }}</div>
        <div>{{ getHikariPlanText(request.hikariPlan) }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.ipoeType">
        <div>{{ t('ipoes.ipoeType') }}</div>
        <div>{{ getIpoeTypeText(request.ipoeType) }}</div>
      </DetailGrid>
      <DetailGrid v-if="isWidePlanType(request?.ipoeType)">
        <div>{{ t('ipoes.appControl') }}</div>
        <div>{{ getExistText(request?.appControl) }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.accessKey">
        <div>{{ t('ipoes.accessKey') }}</div>
        <div>{{ request.accessKey }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- フレッツ情報 -->
    <InnerCard :title="t('ipoes.fletsInformation')">
      <DetailGrid>
        <div>{{ t('ipoes.fletsOpen') }}</div>
        <div>{{ getFletsOpenText(request.fletsOpen) }}</div>
      </DetailGrid>
      <DetailGrid v-if="!request.fletsOpen">
        <div>{{ t('ipoes.fletsOpenDate') }}</div>
        <div>{{ request?.fletsOpenDate }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.originContractor?.name">
        <div>{{ t('ipoes.contractorName') }}</div>
        <div>{{ request.originContractor.name }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.originContractor?.nameKana">
        <div>{{ t('ipoes.contractorNameKana') }}</div>
        <div>{{ request.originContractor.nameKana }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.originContractor?.phoneNumber">
        <div>{{ t('ipoes.contractorPhoneNumber') }}</div>
        <div>{{ request.originContractor.phoneNumber }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.originContractor?.postalCode">
        <div>{{ t('ipoes.contractorPostalCode') }}</div>
        <div>{{ request.originContractor.postalCode }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.originContractor?.mailAddress">
        <div>{{ t('ipoes.contractorMailAddress') }}</div>
        <div>{{ request.originContractor.mailAddress }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.installationPlace?.postalCode">
        <div>{{ t('ipoes.installationPlacePostalCode') }}</div>
        <div>{{ request.installationPlace.postalCode }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request?.installationPlace?.phoneNumber">
        <div>{{ t('ipoes.installationPlacePhoneNumber') }}</div>
        <div>{{ request.installationPlace.phoneNumber }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- 申込者情報 -->
    <InnerCard v-if="!!request?.applicant" :title="t('ipoes.applicant')">
      <DetailGrid v-if="!!request.applicant?.name">
        <div>{{ t('ipoes.applicantName') }}</div>
        <div>{{ request.applicant.name }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request.applicant?.nameKana">
        <div>{{ t('ipoes.applicantNameKana') }}</div>
        <div>{{ request.applicant.nameKana }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request.applicant?.phoneNumber">
        <div>{{ t('ipoes.applicantPhoneNumber') }}</div>
        <div>{{ request.applicant.phoneNumber }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!request.applicant?.mailAddress">
        <div>{{ t('ipoes.applicantMailAddress') }}</div>
        <div>{{ request.applicant.mailAddress }}</div>
      </DetailGrid>
    </InnerCard>
  </div>
</template>
