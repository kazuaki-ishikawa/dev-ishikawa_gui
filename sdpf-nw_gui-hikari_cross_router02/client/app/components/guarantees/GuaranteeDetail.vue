<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import type { TerminalType } from '@/api/types'
import { FieldSurveyResultTypes } from '@/api/guarantees/constants'
import type {
  ReserveStatusType,
  GuaranteeResponse,
  FieldSurveyResultType,
  WorkerInfoType,
} from '@/api/guarantees/types'

// #16258 現調レスファイルダウンロードボタンの非表示対応
const SHOW_FIELD_SURVEY_LESS_FILE_DOWNLOAD = false

type PropType = {
  guarantee: GuaranteeResponse | null
  tenantId: string
  terminalType?: TerminalType
  isOrder?: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const route = useRoute()

const orderId = computed(() => props.guarantee?.orderId || '')

const isEdit = computed(() => {
  const routeName = route.name as string
  return routeName.split('-').slice(-1)[0] === 'edit'
})

const workerCompanyInformationDialog = ref<{ data: WorkerInfoType; open: true } | { data: null; open: false }>({
  data: null,
  open: false,
})
const handleOpenWorkerCompanyInformationDialog = (data?: WorkerInfoType) => {
  workerCompanyInformationDialog.value = data ? { data, open: true } : { data: null, open: false }
}
const handleCloseWorkerCompanyInformationDialog = () => {
  workerCompanyInformationDialog.value = { data: null, open: false }
}

const { getTimeText } = useHikariCollaboUtils()
const {
  getNecessaryText,
  getCommunicationModeText,
  basicInformationRefState,
  fieldSurveyRefState,
  constructionRefState,
  getSurveyLessText,
  getDrawingResendRequestText,
} = useGuarantees()
const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: orderId.value }))

const desiredDates = computed(() => ({
  fieldSurvey: Object.fromEntries(props.guarantee?.fieldSurvey?.desiredDates?.map(d => [d.priority, d]) ?? []),
  construction: Object.fromEntries(props.guarantee?.construction?.desiredDates?.map(d => [d.priority, d]) ?? []),
  removal: Object.fromEntries(props.guarantee?.removal?.desiredDates?.map(d => [d.priority, d]) ?? []),
}))

const getReserveStatusText = (status?: ReserveStatusType) => (status ? t(`guarantees.${status}`) : '')
const getFieldSurveyResultText = (result?: FieldSurveyResultType) =>
  !result ? '' : result === FieldSurveyResultTypes.OK ? 'OK' : 'NG'

const terminalPath = computed(() => {
  if (!props.guarantee?.terminalId || !props.terminalType) {
    return ''
  }
  if (props.terminalType === TerminalTypes.Rental) {
    return `/tenants/${props.tenantId}/terminals/${props.guarantee?.terminalId}`
  }
  return `/tenants/${props.tenantId}/self-terminals/${props.guarantee?.terminalId}`
})

const { downloadDocument } = useDownloadDocument()
const handleFieldSurveyLessFileIdClick = () => {
  const documentId = props.guarantee?.fieldSurveyLessInfo?.fieldSurveyLessFileId
  if (documentId) {
    const fileName = `${props.guarantee?.guaranteeId}_fieldSurveyLessFile`
    downloadDocument({ documentId, fileName })
  }
}
</script>

<template>
  <div>
    <!-- 詳細 -->
    <div ref="basicInformationRefState">
      <InnerCard :title="t('guarantees.basicInformation')">
        <DetailGrid>
          <div>{{ t('guarantees.guaranteeId') }}</div>
          <div>{{ guarantee?.guaranteeId }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.accessLineId') }}</div>
          <div>{{ guarantee?.accessLineId }}</div>
        </DetailGrid>
        <slot name="customer-note" />
        <DetailGrid>
          <div>{{ t('guarantees.physicalBandwidth') }}</div>
          <div>{{ guarantee?.physicalBandwidth }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.interface') }}</div>
          <div>{{ guarantee?.userInterfaceType }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.communicationMode') }}</div>
          <div>{{ getCommunicationModeText(guarantee?.communicationMode) }}</div>
        </DetailGrid>
        <slot name="rate-limit" />
        <DetailGrid>
          <div>{{ t('guarantees.terminalId') }}</div>
          <NuxtLink v-if="terminalPath" class="cursor-pointer" :to="terminalPath">
            {{ guarantee?.terminalId }}
          </NuxtLink>
          <div v-else>{{ guarantee?.terminalId }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.terminalType') }}</div>
          <div>{{ props.terminalType ? t(`terminals.${props.terminalType}`) : '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('details.resourceStatus') }}</div>
          <div>{{ guarantee?.resourceStatus }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('details.orderId') }}</div>
          <NuxtLink class="cursor-pointer" :to="orderIdLink">{{ orderId }}</NuxtLink>
        </DetailGrid>
        <DetailGrid v-if="guarantee?.orderStatus && !isOrder">
          <div>{{ t('details.orderStatus') }}</div>
          <div>{{ orderStatusTypeTranslation[guarantee.orderStatus] }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('details.creationTime') }}</div>
          <div>{{ formatDateTime(guarantee?.creationTime) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('details.updateTime') }}</div>
          <div>{{ formatDateTime(guarantee?.updateTime) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('details.serviceStartTime') }}</div>
          <div>{{ formatDateTime(guarantee?.serviceStartTime) }}</div>
        </DetailGrid>
      </InnerCard>
    </div>

    <div ref="fieldSurveyRefState">
      <InnerCard :title="t('guarantees.fieldSurveyDetailsInformation')">
        <template #button>
          <slot name="reserve-field-survey-construction-date-button" />
        </template>
        <DetailGrid>
          <div>{{ t('guarantees.reserveStatus') }}</div>
          <div>{{ getReserveStatusText(guarantee?.fieldSurvey?.reserveStatus) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.fieldSurveyResult') }}</div>
          <div>
            {{ getFieldSurveyResultText(guarantee?.fieldSurveyResult) }}
          </div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.fieldSurveyReportUpdateTime') }}</div>
          <div>{{ formatDateTime(guarantee?.fieldSurveyReportUpdateTime) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.fieldSurveyLess') }}</div>
          <div>
            <CheckboxBase :value="!!guarantee?.fieldSurveyLess" disabled />
          </div>
        </DetailGrid>
        <template v-if="!!guarantee?.fieldSurveyLess">
          <DetailGrid v-if="SHOW_FIELD_SURVEY_LESS_FILE_DOWNLOAD">
            <div>{{ t('guarantees.fieldSurveyLessFileId') }}</div>
            <div>
              <CustomButton
                icon="download"
                :text="t('common.download')"
                :width="280"
                :disabled="!guarantee?.fieldSurveyLessInfo?.fieldSurveyLessFileId || isEdit"
                data-cy="guarantee-detail-field-survey-less-info-download-button"
                @click="handleFieldSurveyLessFileIdClick"
              />
            </div>
          </DetailGrid>
          <div class="mt-3">{{ t('guarantees.result') }}</div>
          <DetailGrid :label-width="270" class="ml-5">
            <div>{{ t('guarantees.fieldSurveyLessResult') }}</div>
            <div data-cy="guarantee-detail-field-survey-less-info-survey-less-result">
              {{ getSurveyLessText(guarantee?.fieldSurveyLessInfo?.fieldSurveyLessResult) }}
            </div>
          </DetailGrid>
          <DetailGrid :label-width="270" class="ml-5">
            <div>{{ t('guarantees.drawingResendRequest') }}</div>
            <div data-cy="guarantee-detail-field-survey-less-info-drawing-resend-request">
              {{ getDrawingResendRequestText(guarantee?.fieldSurveyLessInfo?.drawingResendRequest) }}
            </div>
          </DetailGrid>
          <DetailGrid :label-width="270" class="ml-5">
            <div>{{ t('guarantees.drawingDeficiencyReason') }}</div>
            <div data-cy="guarantee-detail-field-survey-less-info-drawing-deficiency-reason">
              {{ guarantee?.fieldSurveyLessInfo?.drawingDeficiencyReason ?? '' }}
            </div>
            <template #footer>
              <div class="w-100 text-sm text-warning text-pre-wrap">
                {{ t('guarantees.note.drawingDeficiencyReason') }}
              </div>
            </template>
          </DetailGrid>
        </template>
        <DetailGrid>
          <div>{{ t('guarantees.admissionApplicationRequired') }}</div>
          <div>{{ getNecessaryText(guarantee?.fieldSurvey?.admissionApplicationRequired) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.reserveDate') }}</div>
          <div class="ga-2">
            <span> {{ formatDate(guarantee?.fieldSurvey?.date) }} </span>
            <span> {{ getTimeText(guarantee?.fieldSurvey?.time) }} </span>
          </div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.operationAdjustmentSpecifiedVisitDateTime') }}</div>
          <div>
            <CheckboxBase :value="!!guarantee?.fieldSurvey?.operationAdjustment" disabled />
          </div>
        </DetailGrid>
        <div class="ml-5">
          <DetailGrid
            v-for="(label, index) of ['firstChoice', 'secondChoice', 'thirdChoice']"
            :key="label"
            :label-width="270"
          >
            <div>{{ t(`guarantees.${label}`) }}</div>
            <div class="ga-2">
              <span> {{ formatDate(desiredDates.fieldSurvey?.[index + 1]?.date) }} </span>
              <span>
                {{ getTimeText(desiredDates.fieldSurvey?.[index + 1]?.time) }}
              </span>
            </div>
          </DetailGrid>
        </div>
        <div class="text-secondary text-lg mt-3 flex-space-between-center">
          <div>{{ t('guarantees.workerCompanyInformation') }}</div>
          <CustomButton
            v-if="!isEdit"
            icon="right-arrow"
            :text="t('guarantees.getWorkerCompanyInformation')"
            :width="250"
            :disabled="!guarantee?.fieldSurvey?.workerInfo"
            data-cy="guarantee-detail-field-survey-worker-info-button"
            @click="handleOpenWorkerCompanyInformationDialog(guarantee?.fieldSurvey?.workerInfo)"
          />
        </div>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfoUpdateTime') }}</div>
          <div>{{ formatDateTime(guarantee?.fieldSurvey?.workerInfoUpdateTime) }}</div>
        </DetailGrid>
        <div class="text-secondary text-lg mt-3">{{ t('guarantees.preContact') }}</div>
        <DetailGrid>
          <div>{{ t('guarantees.preContactCompanyName') }}</div>
          <div>{{ guarantee?.fieldSurvey?.preContactCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.preContactPersonName') }}</div>
          <div>{{ guarantee?.fieldSurvey?.preContactPersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.preContactPhoneNumber') }}</div>
          <div>{{ guarantee?.fieldSurvey?.preContactPhoneNumber }}</div>
        </DetailGrid>
        <div class="text-secondary text-lg mt-3">{{ t('guarantees.attendanceInformation') }}</div>
        <DetailGrid>
          <div>{{ t('guarantees.attendanceCompanyName') }}</div>
          <div>{{ guarantee?.fieldSurvey?.attendanceCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.attendancePersonName') }}</div>
          <div>{{ guarantee?.fieldSurvey?.attendancePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.attendancePhoneNumber') }}</div>
          <div>{{ guarantee?.fieldSurvey?.attendancePhoneNumber }}</div>
        </DetailGrid>
      </InnerCard>
    </div>

    <div ref="constructionRefState">
      <InnerCard :title="t('guarantees.constructionDetailsInformation')">
        <template #button><slot name="construction-detail-information-top" /></template>
        <DetailGrid>
          <div>{{ t('guarantees.reserveStatus') }}</div>
          <div>{{ getReserveStatusText(guarantee?.construction?.reserveStatus) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.admissionApplicationRequired') }}</div>
          <div>{{ getNecessaryText(guarantee?.construction?.admissionApplicationRequired) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.reserveDate') }}</div>
          <div class="ga-2">
            <span> {{ formatDate(guarantee?.construction?.date) }} </span>
            <span> {{ getTimeText(guarantee?.construction?.time) }} </span>
          </div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.operationAdjustmentSpecifiedVisitDateTime') }}</div>
          <div>
            <CheckboxBase :value="!!guarantee?.construction?.operationAdjustment" disabled />
          </div>
        </DetailGrid>
        <div class="ml-5">
          <DetailGrid
            v-for="(label, index) of ['firstChoice', 'secondChoice', 'thirdChoice']"
            :key="label"
            :label-width="270"
          >
            <div>{{ t(`guarantees.${label}`) }}</div>
            <div class="ga-2">
              <span> {{ formatDate(desiredDates.construction?.[index + 1]?.date) }} </span>
              <span>
                {{ getTimeText(desiredDates.construction?.[index + 1]?.time) }}
              </span>
            </div>
          </DetailGrid>
        </div>
        <div class="text-secondary text-lg mt-3 flex-space-between-center">
          <div>{{ t('guarantees.workerCompanyInformation') }}</div>
          <CustomButton
            v-if="!isEdit"
            icon="right-arrow"
            :text="t('guarantees.getWorkerCompanyInformation')"
            :width="250"
            :disabled="!guarantee?.construction?.workerInfo"
            data-cy="guarantee-detail-construction-worker-info-button"
            @click="handleOpenWorkerCompanyInformationDialog(guarantee?.construction?.workerInfo)"
          />
        </div>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfoUpdateTime') }}</div>
          <div>{{ formatDateTime(guarantee?.construction?.workerInfoUpdateTime) }}</div>
        </DetailGrid>
        <div class="text-secondary text-lg mt-3">{{ t('guarantees.preContact') }}</div>
        <DetailGrid>
          <div>{{ t('guarantees.preContactCompanyName') }}</div>
          <div>{{ guarantee?.construction?.preContactCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.preContactPersonName') }}</div>
          <div>{{ guarantee?.construction?.preContactPersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.preContactPhoneNumber') }}</div>
          <div>{{ guarantee?.construction?.preContactPhoneNumber }}</div>
        </DetailGrid>
        <div class="text-secondary text-lg mt-3">{{ t('guarantees.attendanceInformation') }}</div>
        <DetailGrid>
          <div>{{ t('guarantees.attendanceCompanyName') }}</div>
          <div>{{ guarantee?.construction?.attendanceCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.attendancePersonName') }}</div>
          <div>{{ guarantee?.construction?.attendancePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.attendancePhoneNumber') }}</div>
          <div>{{ guarantee?.construction?.attendancePhoneNumber }}</div>
        </DetailGrid>
      </InnerCard>
    </div>

    <div v-if="!!guarantee?.removal" data-cy="guarantee-detail-removal-section">
      <InnerCard :title="t('guarantees.removalInformation')">
        <template #button>
          <slot name="reserve-removal-date-button" />
        </template>
        <DetailGrid>
          <div>{{ t('guarantees.reserveStatus') }}</div>
          <div>{{ getReserveStatusText(guarantee?.removal?.reserveStatus) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.reserveDate') }}</div>
          <div class="ga-2">
            <span> {{ formatDate(guarantee?.removal?.date) }} </span>
            <span> {{ getTimeText(guarantee?.removal?.time) }} </span>
          </div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.operationAdjustment') }}</div>
          <div>
            <CheckboxBase :value="!!guarantee?.removal?.operationAdjustment" disabled />
          </div>
        </DetailGrid>
        <div class="ml-5">
          <DetailGrid
            v-for="(label, index) of ['firstChoice', 'secondChoice', 'thirdChoice']"
            :key="label"
            :label-width="270"
          >
            <div>{{ t(`guarantees.${label}`) }}</div>
            <div class="ga-2">
              <span> {{ formatDate(desiredDates.removal?.[index + 1]?.date) }} </span>
              <span>
                {{ getTimeText(desiredDates.removal?.[index + 1]?.time) }}
              </span>
            </div>
          </DetailGrid>
        </div>
        <div class="text-secondary text-lg mt-3 flex-space-between-center">
          <div>{{ t('guarantees.workerCompanyInformation') }}</div>
          <CustomButton
            v-if="!isEdit"
            icon="right-arrow"
            :text="t('guarantees.getWorkerCompanyInformation')"
            :width="250"
            :disabled="!guarantee?.removal?.workerInfo"
            data-cy="guarantee-detail-removal-worker-info-button"
            @click="handleOpenWorkerCompanyInformationDialog(guarantee?.removal?.workerInfo)"
          />
        </div>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfoUpdateTime') }}</div>
          <div>{{ formatDateTime(guarantee?.removal?.workerInfoUpdateTime) }}</div>
        </DetailGrid>
        <div class="text-secondary text-lg mt-3">{{ t('guarantees.preContact') }}</div>
        <DetailGrid>
          <div>{{ t('guarantees.preContactCompanyName') }}</div>
          <div>{{ guarantee?.removal?.preContactCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.preContactPersonName') }}</div>
          <div>{{ guarantee?.removal?.preContactPersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.preContactPhoneNumber') }}</div>
          <div>{{ guarantee?.removal?.preContactPhoneNumber }}</div>
        </DetailGrid>
        <div class="text-secondary text-lg mt-3">{{ t('guarantees.attendanceInformation') }}</div>
        <DetailGrid>
          <div>{{ t('guarantees.attendanceCompanyName') }}</div>
          <div>{{ guarantee?.removal?.attendanceCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.attendancePersonName') }}</div>
          <div>{{ guarantee?.removal?.attendancePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.attendancePhoneNumber') }}</div>
          <div>{{ guarantee?.removal?.attendancePhoneNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.admissionApplicationRequired') }}</div>
          <div>{{ getNecessaryText(guarantee?.removal?.admissionApplicationRequired) }}</div>
        </DetailGrid>
      </InnerCard>
    </div>
    <WorkerCompanyInformationDialog
      v-if="workerCompanyInformationDialog.open"
      :open="workerCompanyInformationDialog.open"
      :worker-info="workerCompanyInformationDialog.data"
      @close="handleCloseWorkerCompanyInformationDialog"
    />
  </div>
</template>
