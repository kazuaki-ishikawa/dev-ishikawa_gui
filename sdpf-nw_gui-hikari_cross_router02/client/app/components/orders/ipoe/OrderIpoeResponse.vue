<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { DownloadableDocumentIdType } from '@/api/orders/types'
import { RequestTypes } from '@/api/ipoes/constants'
import type {
  FletsSeparateResponse,
  FletsSeparatePostRequest,
  FletsSeparatePutRequest,
  HikariCollaboPostRequest,
  HikariCollaboPutRequest,
  HikariCollaboDeleteRequest,
  HikariCollaboResponse,
} from '@/api/ipoes/types'
import type { HikariCollaboDiversionRequest } from '@/api/hikariCollaboUtil/types'

type PropType = {
  request:
    | FletsSeparatePostRequest
    | FletsSeparatePutRequest
    | HikariCollaboPostRequest
    | HikariCollaboPutRequest
    | HikariCollaboDeleteRequest
    | HikariCollaboDiversionRequest
    | null
  response: FletsSeparateResponse | HikariCollaboResponse
  tenantId: string
  downloadableDocumentId?: DownloadableDocumentIdType
}
const props = defineProps<PropType>()
const { t } = useI18n()
const { getExistText } = useIpoes()
const { downloadDocument } = useDownloadDocument()

const requestType = computed(() => {
  if (!props.request) {
    return RequestTypes.FletsSeparate
  } else if ('diversionNumber' in props.request) {
    // 光コラボ転用オーダーのレスポンスは光コラボ扱いとする
    return RequestTypes.HikariCollabo
  } else {
    return props.response?.ref && props.response.ref.includes('hikari-collabo')
      ? RequestTypes.HikariCollabo
      : RequestTypes.FletsSeparate
  }
})
const fletsSeparateResponse = computed(() =>
  requestType.value === RequestTypes.FletsSeparate ? (props.response as FletsSeparateResponse) : null,
)
const hikariCollaboResponse = computed(() =>
  requestType.value === RequestTypes.HikariCollabo ? (props.response as HikariCollaboResponse) : null,
)

const showRemovalInfo = computed(() => 'removal' in props.response)
const ipoeId = computed(() => props.response.ipoeId)

const handleSiteRouteSurveyReportClick = () => {
  const documentId = props.downloadableDocumentId?.collaboSiteRouteSurveyReport
  if (documentId) {
    const fileName = `${ipoeId.value}_site_route_survey_report`
    downloadDocument({ documentId, fileName })
  }
}
const handleConstructionResultReportClick = () => {
  const documentId = props.downloadableDocumentId?.collaboConstructionResultReport
  if (documentId) {
    const fileName = `${ipoeId.value}_construction_result_report`
    downloadDocument({ documentId, fileName })
  }
}
const handleFieldSurveyWorkCandidateClick = () => {
  const documentId = props.downloadableDocumentId?.collaboFieldSurveyWorkCandidate
  if (documentId) {
    const fileName = `${ipoeId.value}_field_survey_work_candidate`
    downloadDocument({ documentId, fileName })
  }
}
const handleConstructionWorkCandidateClick = () => {
  const documentId = props.downloadableDocumentId?.collaboConstructionWorkCandidate
  if (documentId) {
    const fileName = `${ipoeId.value}_construction_work_candidate`
    downloadDocument({ documentId, fileName })
  }
}
const handleRemovalWorkCandidateClick = () => {
  const documentId = props.downloadableDocumentId?.collaboRemovalWorkCandidate
  if (documentId) {
    const fileName = `${ipoeId.value}_removal_work_candidate`
    downloadDocument({ documentId, fileName })
  }
}
</script>

<template>
  <div>
    <FletsSeparateDetail
      v-if="fletsSeparateResponse"
      :flets-separate="fletsSeparateResponse"
      :tenant-id="tenantId"
      is-order
    />
    <HikariCollaboDetail
      v-if="hikariCollaboResponse"
      :hikari-collabo="hikariCollaboResponse"
      :tenant-id="tenantId"
      :show-removal-info="showRemovalInfo"
      is-order
    >
      <template v-if="'constructionOption' in response" #siteRouteSurvey>
        <DetailGrid>
          <div class="flex-flex-start-center">{{ t('ipoes.siteRouteSurvey') }}</div>
          <div class="flex-space-between-center">
            <div>{{ getExistText(response.constructionOption?.siteRouteSurvey) }}</div>
            <CustomButton
              v-if="downloadableDocumentId?.collaboSiteRouteSurveyReport"
              icon="right-arrow"
              :text="t('ipoeConstruction.siteRouteSurveyReport')"
              :width="280"
              @click="handleSiteRouteSurveyReportClick"
            />
          </div>
        </DetailGrid>
      </template>
      <template v-if="'constructionOption' in response" #constructionResultReport>
        <DetailGrid>
          <div class="flex-flex-start-center">{{ t('ipoes.constructionResultReport') }}</div>
          <div class="flex-space-between-center">
            <div>{{ getExistText(response.constructionOption?.constructionResultReport) }}</div>
            <CustomButton
              v-if="downloadableDocumentId?.collaboConstructionResultReport"
              icon="right-arrow"
              :text="t('ipoeConstruction.constructionResultReport')"
              :width="180"
              @click="handleConstructionResultReportClick"
            />
          </div>
        </DetailGrid>
      </template>
      <template #fieldSurveyButton>
        <CustomButton
          v-if="downloadableDocumentId?.collaboFieldSurveyWorkCandidate"
          icon="right-arrow"
          :text="t('ipoeConstruction.fieldSurveyWorkCandidate')"
          :width="280"
          @click="handleFieldSurveyWorkCandidateClick"
        />
      </template>
      <template #constructionButton>
        <CustomButton
          v-if="downloadableDocumentId?.collaboConstructionWorkCandidate"
          icon="right-arrow"
          :text="t('ipoeConstruction.constructionWorkCandidate')"
          :width="280"
          @click="handleConstructionWorkCandidateClick"
        />
      </template>
      <template #removalButton>
        <CustomButton
          v-if="showRemovalInfo && downloadableDocumentId?.collaboRemovalWorkCandidate"
          icon="right-arrow"
          :text="t('ipoeConstruction.removalWorkCandidate')"
          :width="280"
          @click="handleRemovalWorkCandidateClick"
        />
      </template>
    </HikariCollaboDetail>
  </div>
</template>
