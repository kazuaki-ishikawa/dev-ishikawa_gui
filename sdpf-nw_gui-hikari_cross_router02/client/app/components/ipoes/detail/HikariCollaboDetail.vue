<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IpoeTypes, RemovalCollectTypes, FletsOrderTypes } from '@/api/ipoes/constants'
import type { HikariCollaboResponse } from '@/api/ipoes/types'

type PropType = {
  hikariCollabo: HikariCollaboResponse | null
  tenantId: string
  showRemovalInfo: boolean
  isOrder?: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const {
  getIpoeTypeText,
  getFletsTypeText,
  getCollectTypeText,
  getLanCollectText,
  getKitSendInstallAddressSameText,
  getExistText,
  getNecessaryText,
} = useIpoes()
const { getTimeText, getAdmissionApplicationInfoText } = useHikariCollaboUtils()

const requestTypeText = computed(() => {
  const fletsOrderType = props.hikariCollabo?.fletsOrderType
  // migrate は new と同じ表示
  const key = fletsOrderType === FletsOrderTypes.Migrate ? FletsOrderTypes.New : fletsOrderType
  return key ? t(`ipoes.${key}`) : ''
})

const terminalId = computed(() => props.hikariCollabo?.terminalId)
const terminalIdLink = computed(() =>
  terminalId.value ? `/tenants/${props.tenantId}/terminals/${terminalId.value}` : '',
)

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderId = computed(() => props.hikariCollabo?.orderId)
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: orderId.value }))

const showPhotographOption = computed(() => !!props.hikariCollabo?.constructionOption?.constructionResultReport)
const showFieldSurveyInfo = computed(
  () => !!props.hikariCollabo?.constructionOption?.siteRouteSurvey || !!props.hikariCollabo?.fieldSurveyRequirement,
)
</script>

<template>
  <div>
    <InnerCard :title="t('sideBar.ipoes')">
      <DetailGrid>
        <div>{{ t('ipoes.ipoeId') }}</div>
        <div>{{ hikariCollabo?.ipoeId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.customerNote') }}</div>
        <div>{{ hikariCollabo?.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.requestType') }}</div>
        <div>{{ requestTypeText }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ipv4Address') }}</div>
        <div>{{ hikariCollabo?.ipv4Address }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.fletsId') }}</div>
        <div>{{ hikariCollabo?.fletsId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.terminalId') }}</div>
        <NuxtLink class="cursor-pointer" :to="terminalIdLink">{{ terminalId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ipoeType') }}</div>
        <div>{{ getIpoeTypeText(hikariCollabo?.ipoeType) }}</div>
      </DetailGrid>
      <DetailGrid v-if="hikariCollabo?.ipoeType === IpoeTypes.Wide">
        <div>{{ t('ipoes.appControl') }}</div>
        <div>{{ getExistText(hikariCollabo?.appControl) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ref') }}</div>
        <div>{{ hikariCollabo?.ref }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ hikariCollabo?.resourceStatus }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink class="cursor-pointer" :to="orderIdLink">{{ orderId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid v-if="hikariCollabo?.orderStatus && !isOrder">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[hikariCollabo.orderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div>{{ formatDateTime(hikariCollabo?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div>{{ formatDateTime(hikariCollabo?.updateTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.serviceStartTime') }}</div>
        <div>{{ formatDateTime(hikariCollabo?.serviceStartTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="requestTypeText">
      <DetailGrid>
        <div>{{ t('ipoes.addressCode') }}</div>
        <div>{{ hikariCollabo?.installationPlaceCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.postalCode') }}</div>
        <div>{{ hikariCollabo?.postalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.address') }}</div>
        <div>{{ hikariCollabo?.address }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.onSiteRepairOption') }}</div>
        <div>{{ getExistText(hikariCollabo?.onSiteRepairOption) }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!hikariCollabo?.changeEffectiveDate">
        <div>{{ t('ipoes.changeEffectiveDate') }}</div>
        <div>{{ formatDate(hikariCollabo.changeEffectiveDate) }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="t('ipoes.fletsInformation')">
      <DetailGrid>
        <div>{{ t('ipoes.fletsType') }}</div>
        <div>{{ getFletsTypeText(hikariCollabo?.fletsType) }}</div>
      </DetailGrid>
    </InnerCard>
    <InnerCard :title="t('ipoes.constructionOption')">
      <slot name="siteRouteSurvey" />
      <DetailGrid>
        <div>{{ t('ipoes.lineConfirmation') }}</div>
        <div>{{ getExistText(hikariCollabo?.constructionOption?.lineConfirmation) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.wiringRouteConstruction') }}</div>
        <div>{{ getExistText(hikariCollabo?.constructionOption?.wiringRouteConstruction) }}</div>
      </DetailGrid>
      <slot name="constructionResultReport" />
      <template v-if="showPhotographOption">
        <DetailGrid>
          <div>{{ t('ipoes.photographConsent') }}</div>
          <div>{{ getExistText(hikariCollabo?.constructionOption?.photographConsent) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.photographConsentName') }}</div>
          <div>{{ hikariCollabo?.constructionOption?.photographConsentName }}</div>
        </DetailGrid>
      </template>
      <DetailGrid>
        <div>{{ t('ipoes.specifiedVisitDateTime') }}</div>
        <div>{{ getExistText(hikariCollabo?.constructionOption?.specifiedVisitDateTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="t('ipoes.fieldSurveyInfo')">
      <template #button><slot name="fieldSurveyButton" /></template>
      <DetailGrid>
        <div>{{ t('ipoes.fieldSurveyRequirement') }}</div>
        <div>{{ getNecessaryText(showFieldSurveyInfo) }}</div>
      </DetailGrid>
      <template v-if="showFieldSurveyInfo">
        <DetailGrid>
          <div>{{ t('ipoes.fieldSurveyDate') }}</div>
          <div>{{ formatDate(hikariCollabo?.fieldSurvey?.date) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.fieldSurveyTime') }}</div>
          <div>{{ getTimeText(hikariCollabo?.fieldSurvey?.time) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerCompanyName') }}</div>
          <div>{{ hikariCollabo?.fieldSurvey?.workerCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerCompanyPhoneNumber') }}</div>
          <div>{{ hikariCollabo?.fieldSurvey?.workerCompanyPhoneNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerResponsiblePersonName') }}</div>
          <div>{{ hikariCollabo?.fieldSurvey?.workerResponsiblePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.admissionApplicationInfo') }}</div>
          <div>{{ getAdmissionApplicationInfoText(hikariCollabo?.fieldSurvey?.admissionApplicationInfo) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.companyName') }}</div>
          <div>{{ hikariCollabo?.fieldSurvey?.attendanceCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.departmentName') }}</div>
          <div>{{ hikariCollabo?.fieldSurvey?.attendanceDepartmentName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.personName') }}</div>
          <div>{{ hikariCollabo?.fieldSurvey?.attendancePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.personNameKana') }}</div>
          <div>{{ hikariCollabo?.fieldSurvey?.attendancePersonNameKana }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.phoneNumber') }}</div>
          <div>{{ hikariCollabo?.fieldSurvey?.attendancePhoneNumber }}</div>
        </DetailGrid>
      </template>
    </InnerCard>

    <InnerCard :title="t('ipoes.constructionInfo')">
      <template #button><slot name="constructionButton" /></template>
      <DetailGrid>
        <div>{{ t('ipoes.constructionDate') }}</div>
        <div>{{ formatDate(hikariCollabo?.construction?.date) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.constructionTime') }}</div>
        <div>{{ getTimeText(hikariCollabo?.construction?.time) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.workerCompanyName') }}</div>
        <div>{{ hikariCollabo?.construction?.workerCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.workerCompanyPhoneNumber') }}</div>
        <div>{{ hikariCollabo?.construction?.workerCompanyPhoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.workerResponsiblePersonName') }}</div>
        <div>{{ hikariCollabo?.construction?.workerResponsiblePersonName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.admissionApplicationInfo') }}</div>
        <div>{{ getAdmissionApplicationInfoText(hikariCollabo?.construction?.admissionApplicationInfo) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.companyName') }}</div>
        <div>{{ hikariCollabo?.construction?.attendanceCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.departmentName') }}</div>
        <div>{{ hikariCollabo?.construction?.attendanceDepartmentName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.personName') }}</div>
        <div>{{ hikariCollabo?.construction?.attendancePersonName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.personNameKana') }}</div>
        <div>{{ hikariCollabo?.construction?.attendancePersonNameKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.phoneNumber') }}</div>
        <div>{{ hikariCollabo?.construction?.attendancePhoneNumber }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard v-if="showRemovalInfo" :title="t('ipoes.removalInformation')">
      <template #button><slot name="removalButton" /></template>
      <DetailGrid>
        <div>{{ t('ipoes.removalCollectType') }}</div>
        <div>{{ getCollectTypeText(hikariCollabo?.removal?.collectType) }}</div>
      </DetailGrid>
      <template v-if="hikariCollabo?.removal?.collectType === RemovalCollectTypes.Visit">
        <DetailGrid>
          <div>{{ t('ipoes.removalLanCollect') }}</div>
          <div>{{ getLanCollectText(hikariCollabo?.removal?.lanCollect) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.constructionDate') }}</div>
          <div>{{ formatDate(hikariCollabo?.removal?.date) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.constructionTime') }}</div>
          <div>{{ getTimeText(hikariCollabo?.removal?.time) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerCompanyName') }}</div>
          <div>{{ hikariCollabo?.removal?.workerCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerCompanyPhoneNumber') }}</div>
          <div>{{ hikariCollabo?.removal?.workerCompanyPhoneNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerResponsiblePersonName') }}</div>
          <div>{{ hikariCollabo?.removal?.workerResponsiblePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.admissionApplicationInfo') }}</div>
          <div>{{ getAdmissionApplicationInfoText(hikariCollabo?.removal?.admissionApplicationInfo) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.companyName') }}</div>
          <div>{{ hikariCollabo?.removal?.attendanceCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.departmentName') }}</div>
          <div>{{ hikariCollabo?.removal?.attendanceDepartmentName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.personName') }}</div>
          <div>{{ hikariCollabo?.removal?.attendancePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.personNameKana') }}</div>
          <div>{{ hikariCollabo?.removal?.attendancePersonNameKana }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.phoneNumber') }}</div>
          <div>{{ hikariCollabo?.removal?.attendancePhoneNumber }}</div>
        </DetailGrid>
      </template>
      <template v-if="hikariCollabo?.removal?.collectType === RemovalCollectTypes.Kit">
        <DetailGrid>
          <div>{{ t('ipoes.kitSendInstallAddressSame') }}</div>
          <div>{{ getKitSendInstallAddressSameText(hikariCollabo?.removal?.kitSendInstallAddressSame) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.kitSendAddressCompanyName') }}</div>
          <div>{{ hikariCollabo?.removal?.kitSendAddress?.companyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.kitSendAddressPersonName') }}</div>
          <div>{{ hikariCollabo?.removal?.kitSendAddress?.personName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.addressCode') }}</div>
          <div>{{ hikariCollabo?.removal?.kitSendAddress?.addressCode }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('contractor.address') }}</div>
          <div>{{ hikariCollabo?.removal?.kitSendAddress?.address }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('contractor.houseNumber') }}</div>
          <div>{{ hikariCollabo?.removal?.kitSendAddress?.houseNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('contractor.buildingName') }}</div>
          <div>{{ hikariCollabo?.removal?.kitSendAddress?.buildingName }}</div>
        </DetailGrid>
      </template>
    </InnerCard>
  </div>
</template>
