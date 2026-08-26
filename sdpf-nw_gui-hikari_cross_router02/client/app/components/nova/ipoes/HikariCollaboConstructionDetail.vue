<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { HikariCollaboResponse } from '@/api/ipoes/types'
import type { DownloadableDocumentIdType } from '@/api/orders/types'

type PropType = {
  hikariCollabo: HikariCollaboResponse
  downloadableDocumentId?: DownloadableDocumentIdType
  fieldSurveyButtonDisabled?: boolean
  constructionButtonDisabled?: boolean
}
const props = defineProps<PropType>()
const emits = defineEmits<{
  reserveFieldSurvey: []
  reserveConstruction: []
}>()

const { t } = useI18n()
const { getTimeText, getAdmissionApplicationInfoText } = useHikariCollaboUtils()
const { downloadDocument } = useDownloadDocument()

const existText = (value?: boolean) =>
  value === undefined ? '' : value ? t('nova.common.exist') : t('nova.common.nonExist')
const constructionPreferenceText = (value?: boolean) =>
  value === undefined ? '' : value ? t('nova.common.desired') : t('nova.common.notDesired')
const photographConsentText = (value?: boolean) =>
  value === undefined ? '' : value ? t('nova.ipoes.photographConsentTrue') : t('nova.ipoes.photographConsentFalse')
const fieldSurveyRequired = computed(
  () => props.hikariCollabo.constructionOption?.siteRouteSurvey || props.hikariCollabo.fieldSurveyRequirement,
)
const surveyReportHeaders = [
  { title: t('nova.ipoes.reportName'), key: 'reportName', sortable: false },
  { title: t('nova.ipoes.operation'), key: 'operation', sortable: false, width: 160 },
]
const surveyReportItems = computed(() => [
  {
    reportName: t('nova.ipoes.siteRouteSurveyReport'),
    documentId: props.downloadableDocumentId?.collaboSiteRouteSurveyReport,
    fileName: 'site_route_survey_report',
  },
  {
    reportName: t('nova.ipoes.constructionResultReport'),
    documentId: props.downloadableDocumentId?.collaboConstructionResultReport,
    fileName: 'construction_result_report',
  },
])
const downloadReport = (documentId: string | undefined, fileName: string) => {
  if (documentId) {
    downloadDocument({ documentId, fileName: `${props.hikariCollabo.ipoeId}_${fileName}` })
  }
}
</script>

<template>
  <v-card class="my-5" :title="t('nova.ipoes.constructionOption')">
    <v-card-item>
      <div>
        <NovaDetailGrid :label="t('nova.ipoes.siteRouteSurvey')">
          {{ existText(hikariCollabo.constructionOption?.siteRouteSurvey) }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.lineConfirmation')">
          {{ existText(hikariCollabo.constructionOption?.lineConfirmation) }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.wiringRouteConstruction')">
          {{ constructionPreferenceText(hikariCollabo.constructionOption?.wiringRouteConstruction) }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.constructionResultReport')">
          {{ existText(hikariCollabo.constructionOption?.constructionResultReport) }}
        </NovaDetailGrid>
        <template v-if="hikariCollabo.constructionOption?.constructionResultReport">
          <NovaDetailGrid :label="t('nova.ipoes.photographConsent')">
            {{ photographConsentText(hikariCollabo.constructionOption.photographConsent) }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.photographConsentName')">
            {{ hikariCollabo.constructionOption.photographConsentName }}
          </NovaDetailGrid>
        </template>
        <NovaDetailGrid :label="t('nova.ipoes.specifiedVisitDateTime')">
          {{ existText(hikariCollabo.constructionOption?.specifiedVisitDateTime) }}
        </NovaDetailGrid>
      </div>
    </v-card-item>
  </v-card>

  <v-card class="my-5" :title="t('nova.ipoes.surveyReports')">
    <v-card-item>
      <NovaDataTable :headers="surveyReportHeaders" :items="surveyReportItems" height="auto">
        <template #[`item.operation`]="{ item }">
          <NovaCustomButton
            outlined
            :disabled="!item.documentId"
            append-icon="nova:download"
            @click="downloadReport(item.documentId, item.fileName)"
          >
            {{ t('nova.common.download') }}
          </NovaCustomButton>
        </template>
      </NovaDataTable>
    </v-card-item>
  </v-card>

  <v-card class="my-5">
    <v-card-item>
      <div class="d-flex align-center justify-space-between ga-4 mb-3">
        <div class="font-weight-bold text-title-large">{{ t('nova.ipoes.fieldSurveyDetail') }}</div>
        <div class="d-flex ga-3">
          <NovaCustomButton
            outlined
            append-icon="nova:download"
            :disabled="!downloadableDocumentId?.collaboFieldSurveyWorkCandidate"
            @click="
              downloadReport(downloadableDocumentId?.collaboFieldSurveyWorkCandidate, 'field_survey_work_candidate')
            "
          >
            {{ t('nova.ipoes.fieldSurveyWorkCandidate') }}
          </NovaCustomButton>
          <NovaCustomButton outlined :disabled="fieldSurveyButtonDisabled" @click="emits('reserveFieldSurvey')">
            {{ t('nova.ipoes.reserveFieldSurveyDate') }}
          </NovaCustomButton>
        </div>
      </div>
      <NovaCardSubTitle :title="t('nova.ipoes.fieldSurveyDetail')" />
      <NovaDetailGrid :label="t('nova.ipoes.fieldSurveyRequirement')">
        {{ fieldSurveyRequired ? t('nova.common.necessary') : t('nova.common.unnecessary') }}
      </NovaDetailGrid>
      <template v-if="fieldSurveyRequired">
        <div>
          <NovaDetailGrid :label="t('nova.ipoes.fieldSurveyDate')">
            {{ formatDate(hikariCollabo.fieldSurvey?.date) }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.fieldSurveyTime')">
            {{ getTimeText(hikariCollabo.fieldSurvey?.time) }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.admissionApplicationInfo')">
            {{ getAdmissionApplicationInfoText(hikariCollabo.fieldSurvey?.admissionApplicationInfo) }}
          </NovaDetailGrid>
        </div>
        <NovaCardSubTitle :title="t('nova.ipoes.workerCompanyInformation')" />
        <div>
          <NovaDetailGrid :label="t('nova.ipoes.workerCompanyName')">
            {{ hikariCollabo.fieldSurvey?.workerCompanyName }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.workerCompanyPhoneNumber')">
            {{ hikariCollabo.fieldSurvey?.workerCompanyPhoneNumber }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.workerResponsiblePersonName')">
            {{ hikariCollabo.fieldSurvey?.workerResponsiblePersonName }}
          </NovaDetailGrid>
        </div>

        <NovaCardSubTitle :title="t('nova.ipoes.attendanceInformation')" />
        <div>
          <NovaDetailGrid :label="t('nova.ipoes.attendanceCompanyName')">
            {{ hikariCollabo.fieldSurvey?.attendanceCompanyName }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.attendanceDepartmentName')">
            {{ hikariCollabo.fieldSurvey?.attendanceDepartmentName }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.attendancePersonName')">
            {{ hikariCollabo.fieldSurvey?.attendancePersonName }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.attendancePersonNameKana')">
            {{ hikariCollabo.fieldSurvey?.attendancePersonNameKana }}
          </NovaDetailGrid>
          <NovaDetailGrid :label="t('nova.ipoes.attendancePhoneNumber')">
            {{ hikariCollabo.fieldSurvey?.attendancePhoneNumber }}
          </NovaDetailGrid>
        </div>
      </template>
    </v-card-item>
  </v-card>

  <v-card class="my-5">
    <v-card-item>
      <div class="d-flex align-center justify-space-between ga-4 mb-3">
        <div class="font-weight-bold text-title-large">{{ t('nova.ipoes.constructionDetail') }}</div>
        <div class="d-flex ga-3">
          <NovaCustomButton
            outlined
            append-icon="nova:download"
            :disabled="!downloadableDocumentId?.collaboConstructionWorkCandidate"
            @click="
              downloadReport(downloadableDocumentId?.collaboConstructionWorkCandidate, 'construction_work_candidate')
            "
          >
            {{ t('nova.ipoes.constructionWorkCandidate') }}
          </NovaCustomButton>
          <NovaCustomButton outlined :disabled="constructionButtonDisabled" @click="emits('reserveConstruction')">
            {{ t('nova.ipoes.reserveConstructionDate') }}
          </NovaCustomButton>
        </div>
      </div>
      <NovaCardSubTitle :title="t('nova.ipoes.constructionDetail')" />
      <div>
        <NovaDetailGrid :label="t('nova.ipoes.constructionDate')">
          {{ formatDate(hikariCollabo.construction?.date) }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.constructionTime')">
          {{ getTimeText(hikariCollabo.construction?.time) }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.admissionApplicationInfo')">
          {{ getAdmissionApplicationInfoText(hikariCollabo.construction?.admissionApplicationInfo) }}
        </NovaDetailGrid>
      </div>

      <NovaCardSubTitle :title="t('nova.ipoes.workerCompanyInformation')" />
      <div>
        <NovaDetailGrid :label="t('nova.ipoes.workerCompanyName')">
          {{ hikariCollabo.construction?.workerCompanyName }}
        </NovaDetailGrid>
      </div>

      <NovaCardSubTitle :title="t('nova.ipoes.preContact')" />
      <div>
        <NovaDetailGrid :label="t('nova.ipoes.companyPhoneNumber')">
          {{ hikariCollabo.construction?.workerCompanyPhoneNumber }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.responsiblePersonName')">
          {{ hikariCollabo.construction?.workerResponsiblePersonName }}
        </NovaDetailGrid>
      </div>

      <NovaCardSubTitle :title="t('nova.ipoes.attendanceInformation')" />
      <div>
        <NovaDetailGrid :label="t('nova.ipoes.attendanceCompanyName')">
          {{ hikariCollabo.construction?.attendanceCompanyName }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.attendanceDepartmentName')">
          {{ hikariCollabo.construction?.attendanceDepartmentName }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.attendancePersonName')">
          {{ hikariCollabo.construction?.attendancePersonName }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.attendancePersonNameKana')">
          {{ hikariCollabo.construction?.attendancePersonNameKana }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.attendancePhoneNumber')">
          {{ hikariCollabo.construction?.attendancePhoneNumber }}
        </NovaDetailGrid>
      </div>
    </v-card-item>
  </v-card>
</template>
