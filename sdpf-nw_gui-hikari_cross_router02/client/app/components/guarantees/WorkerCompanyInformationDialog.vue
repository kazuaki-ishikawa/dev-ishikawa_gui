<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { WorkerInfoType } from '@/api/guarantees/types'

const { t } = useI18n()

type PropType = {
  open: boolean
  workerInfo: WorkerInfoType
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const workers = computed(() =>
  props.workerInfo.workerCandidates?.map((worker, index) => ({
    id: index + 1,
    name: worker.name ?? '',
    kana: worker.nameKana ?? '',
  })),
)
const confirmedWorkers = computed(() =>
  props.workerInfo.confirmedWorkers?.map((worker, index) => ({
    id: index + 1,
    name: worker.name ?? '',
    kana: worker.nameKana ?? '',
  })),
)
const getConstructinoTypeText = (constructionType?: string) =>
  ['fieldSurvey', 'construction', 'removal'].includes(constructionType ?? '')
    ? t(`guarantees.${constructionType}`)
    : constructionType
</script>

<template>
  <DialogBase
    :open="props.open"
    :title="t('guarantees.workerInfo.workerCompanyInfo')"
    :submit-label="t('common.close')"
    submit-color="info"
    @submit="emits('close')"
    @close="emits('close')"
  >
    <div class="mt-4">
      <InnerCard>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.constructionType') }}</div>
          <div>{{ getConstructinoTypeText(props.workerInfo.constructionType) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.accessLineId') }}</div>
          <div>{{ props.workerInfo.accessLineId ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.companyName') }}</div>
          <div>{{ props.workerInfo.companyName ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.companyPhoneNumber') }}</div>
          <div>{{ props.workerInfo.companyPhoneNumber ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.responsiblePersonName') }}</div>
          <div>{{ props.workerInfo.responsiblePersonName ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.responsiblePersonNameKana') }}</div>
          <div>{{ props.workerInfo.responsiblePersonNameKana ?? '' }}</div>
        </DetailGrid>
        <template v-for="worker in workers" :key="worker.id">
          <DetailGrid>
            <div>{{ t('guarantees.workerInfo.workerName', { index: worker.id }) }}</div>
            <div>{{ worker.name }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('guarantees.workerInfo.workerNameKana', { index: worker.id }) }}</div>
            <div>{{ worker.kana }}</div>
          </DetailGrid>
        </template>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.answerDateOfWorkerCandidates') }}</div>
          <div>{{ props.workerInfo.answerDateOfWorkerCandidates }}</div>
        </DetailGrid>
        <template v-for="worker in confirmedWorkers" :key="worker.id">
          <DetailGrid>
            <div>{{ t('guarantees.workerInfo.confirmedWorkerName', { index: worker.id }) }}</div>
            <div>{{ worker.name }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('guarantees.workerInfo.confirmedWorkerNameKana', { index: worker.id }) }}</div>
            <div>{{ worker.kana }}</div>
          </DetailGrid>
        </template>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.answerDateOfConfirmedWorkers') }}</div>
          <div>{{ props.workerInfo.answerDateOfConfirmedWorkers }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.numberOfWorkers') }}</div>
          <div>{{ props.workerInfo.numberOfWorkers ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.placeOfWork') }}</div>
          <div>{{ props.workerInfo.placeOfWork ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.dateOfWork') }}</div>
          <div>{{ props.workerInfo.dateOfWork }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.vehicleInfo') }}</div>
          <div>{{ props.workerInfo.vehicleInfo ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.mobilePhoneInfo') }}</div>
          <div>{{ props.workerInfo.mobilePhoneInfo ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.cameraInfo') }}</div>
          <div>{{ props.workerInfo.cameraInfo ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.pcInfo') }}</div>
          <div>{{ props.workerInfo.pcInfo ?? '' }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.workerInfo.remarks') }}</div>
          <div>{{ props.workerInfo.remarks ?? '' }}</div>
        </DetailGrid>
      </InnerCard>
    </div>
  </DialogBase>
</template>
