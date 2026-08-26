<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IpoeTypes } from '@/api/ipoes/constants'
import type { HikariCollaboPostRequest } from '@/api/ipoes/types'

type PropType = {
  request: HikariCollaboPostRequest
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { getIpoeTypeText, getFletsTypeText, getExistText } = useIpoes()

const showLineConfirmation = computed(() => props.request.constructionOption.siteRouteSurvey)
const showPhotographOption = computed(() => props.request.constructionOption.constructionResultReport)
</script>

<template>
  <InnerCard :title="t('ipoes.new')">
    <DetailGrid>
      <div>{{ t('ipoes.customerNote') }}</div>
      <div>{{ request.customerNote }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.fletsType') }}</div>
      <div>{{ getFletsTypeText(request.fletsType) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.ipoeType') }}</div>
      <div>{{ getIpoeTypeText(request?.ipoeType) }}</div>
    </DetailGrid>
    <DetailGrid v-if="request?.ipoeType === IpoeTypes.Wide">
      <div>{{ t('ipoes.appControl') }}</div>
      <div>{{ getExistText(request?.appControl) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.addressCode') }}</div>
      <div>{{ request?.installationPlaceCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.onSiteRepairOption') }}</div>
      <div>{{ getExistText(request.onSiteRepairOption) }}</div>
    </DetailGrid>
  </InnerCard>

  <InnerCard :title="t('ipoes.constructionOption')">
    <DetailGrid>
      <div>{{ t('ipoes.siteRouteSurvey') }}</div>
      <div>{{ getExistText(request.constructionOption.siteRouteSurvey) }}</div>
    </DetailGrid>
    <DetailGrid v-if="showLineConfirmation">
      <div>{{ t('ipoes.lineConfirmation') }}</div>
      <div>{{ getExistText(request.constructionOption?.lineConfirmation) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.wiringRouteConstruction') }}</div>
      <div>{{ getExistText(request.constructionOption.wiringRouteConstruction) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.constructionResultReport') }}</div>
      <div>{{ getExistText(request.constructionOption.constructionResultReport) }}</div>
    </DetailGrid>
    <template v-if="showPhotographOption">
      <DetailGrid>
        <div>{{ t('ipoes.photographConsent') }}</div>
        <div>{{ getExistText(request.constructionOption?.photographConsent) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.photographConsentName') }}</div>
        <div>{{ request.constructionOption?.photographConsentName }}</div>
      </DetailGrid>
    </template>
    <DetailGrid>
      <div>{{ t('ipoes.specifiedVisitDateTime') }}</div>
      <div>{{ getExistText(request.constructionOption.specifiedVisitDateTime) }}</div>
    </DetailGrid>
  </InnerCard>
</template>
