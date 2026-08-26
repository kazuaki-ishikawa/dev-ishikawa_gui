<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { omit } from 'es-toolkit'
import {
  DiversionContractTypes,
  initialDiversionInputData,
  initialDiversionValid,
} from '@/api/hikariCollaboUtil/constants'
import type { DiversionContractType } from '@/api/hikariCollaboUtil/types'
import { TenantPages } from '@/components/sidebar/constants'

const Steps = {
  Judge: 1,
  Input: 2,
  Confirmation: 3,
} as const

const router = useRouter()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const ipoeId = computed(() => route.params.id as string)

const { t } = useI18n()
const rules = useRules()
const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const step = ref<(typeof Steps)[keyof typeof Steps]>(Steps.Judge)
const inputData = ref({ ...initialDiversionInputData })
const inputValid = ref({ ...initialDiversionValid, diversionDate: true })
const openDialog = ref(false)

const { loading } = useLoading()
const { diversionContractTypeOptions } = useHikariCollaboUtils()
const { judgedResponse, postHikariCollaboDiversionJudge, putHikariCollaboDiversion } = useHikariCollaboDiversion()
const { getIpoeTypeText, getFletsTypeText, getExistText } = useIpoes()

const isIndividual = computed(() => inputData.value.contractType === DiversionContractTypes.Individual)
const invalid = computed(() => Object.values(inputValid.value).some(v => !v))
const isJudge = computed(() => step.value === Steps.Judge)
const judgedResultErrors = computed(() => judgedResponse.value?.diversionCheckResult?.errors ?? [])
const request = computed(() => ({
  diversionNumber: inputData.value.diversionNumber,
  diversionDate: inputData.value.diversionDate,
  contractInfo: {
    contractType: inputData.value.contractType as DiversionContractType,
    contractorName: inputData.value.contractorName,
    contractorNameKana: inputData.value.contractorNameKana,
  },
}))

const handleJudgeClick = async () => {
  await postHikariCollaboDiversionJudge(ipoeId.value, omit(request.value, ['diversionDate']))
  if (judgedResponse.value && judgedResponse.value.diversionCheckResult.result) {
    step.value++
  } else {
    openDialog.value = true
  }
}
const handleSaveClick = async () => {
  await putHikariCollaboDiversion(ipoeId.value, request.value)
  navigationGuard(false)
  // 完了後は一覧画面へ移動する
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.Ipoes}` }, { replace: true })
}
const handleReturnClick = () => {
  switch (step.value) {
    case Steps.Judge:
      router.back()
      break
    case Steps.Input:
      inputData.value.diversionDate = ''
      inputValid.value.diversionDate = true
      step.value--
      break
    case Steps.Confirmation:
      step.value--
      break
  }
}

const submitButton = computed(() => {
  switch (step.value) {
    case Steps.Judge:
      return {
        text: t('ipoes.judgeButtonLabel'),
        click: handleJudgeClick,
      }
    case Steps.Confirmation:
      return {
        text: t('common.save'),
        width: 180,
        click: handleSaveClick,
      }
    default:
      return {
        text: t('common.confirm'),
        width: 180,
        click: () => step.value++,
      }
  }
})
watch(step, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <CardContainer>
    <InnerCard :title="t('ipoes.diversion')">
      <!-- 転用承諾番号 -->
      <InputGrid v-if="isJudge" required :label="t('ipoes.diversionNumber')" :help="t('ipoes.help.diversionNumber')">
        <InputForm
          v-model="inputData.diversionNumber"
          :rules="[rules.diversionNumber]"
          required
          maxlength="11"
          placeholder="E1234567890"
          data-cy="ipoes-id-diversion-diversion-number"
          @valid="(valid: boolean) => (inputValid.diversionNumber = valid)"
        />
      </InputGrid>
      <template v-else>
        <DetailGrid>
          <div>{{ t('ipoes.diversionNumber') }}</div>
          <div>{{ inputData.diversionNumber }}</div>
        </DetailGrid>
        <!-- 転用希望日 -->
        <InputGrid required :label="t('ipoes.diversionDate')">
          <DatePicker
            v-model="inputData.diversionDate"
            :min-date="judgedResponse?.diversionCheckResult?.diversionShortestDate"
            required
            :disabled="Steps.Confirmation <= step"
            data-cy="ipoes-id-diversion-diversion-date"
            @valid="(valid: boolean) => (inputValid.diversionDate = valid)"
          />
        </InputGrid>
      </template>
    </InnerCard>

    <!-- 契約情報 -->
    <InnerCard v-if="isJudge" :title="t('ipoes.contractInformation')">
      <InputGrid required :label="t('ipoes.contractType')">
        <RadioForm
          v-model="inputData.contractType"
          :options="diversionContractTypeOptions"
          data-cy="ipoes-id-diversion-contract-type"
          @valid="(valid: boolean) => (inputValid.contractType = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('ipoes.contractorName')">
        <InputForm
          v-model="inputData.contractorName"
          :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces, rules.fullwidthSpace]"
          required
          maxlength="64"
          :placeholder="isIndividual ? t('placeholder.name') : t('placeholder.companyName')"
          data-cy="ipoes-id-diversion-contractor-name"
          @valid="(valid: boolean) => (inputValid.contractorName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('ipoes.contractorNameKana')">
        <InputForm
          v-model="inputData.contractorNameKana"
          :rules="[rules.nameKana, rules.noConsecutiveSpaces, rules.fullwidthSpace]"
          required
          maxlength="64"
          :placeholder="isIndividual ? t('placeholder.nameKana') : t('placeholder.companyNameKana')"
          data-cy="ipoes-id-diversion-contractor-name-kana"
          @valid="(valid: boolean) => (inputValid.contractorNameKana = valid)"
        />
      </InputGrid>
    </InnerCard>

    <!-- 基本情報 -->
    <InnerCard v-else :title="t('ipoes.basicInformation')">
      <DetailGrid>
        <div>{{ t('ipoes.customerNote') }}</div>
        <div>{{ judgedResponse?.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.fletsType') }}</div>
        <div>{{ getFletsTypeText(judgedResponse?.fletsType) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ipoeType') }}</div>
        <div>{{ getIpoeTypeText(judgedResponse?.ipoeType) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.appControl') }}</div>
        <div>{{ getExistText(judgedResponse?.appControl) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.contractorName') }}</div>
        <div>{{ judgedResponse?.contractInfo.contractorName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.contractorNameKana') }}</div>
        <div>{{ judgedResponse?.contractInfo.contractorNameKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.postalCode') }}</div>
        <div>{{ judgedResponse?.installationPlace?.postalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.address') }}</div>
        <div>{{ judgedResponse?.installationPlace?.address }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.onSiteRepairOption') }}</div>
        <div>{{ getExistText(judgedResponse?.onSiteRepairOption) }}</div>
      </DetailGrid>
    </InnerCard>

    <div class="grid-flow-col justify-end ga-4 pt-2">
      <CustomButton
        color="info"
        icon="left-arrow"
        :text="t('common.return')"
        :width="180"
        data-cy="ipoes-id-diversion-cancel-button"
        @click="handleReturnClick"
      />
      <CustomButton
        icon="right-arrow"
        :text="submitButton.text"
        :disabled="invalid || loading"
        :width="submitButton.width"
        data-cy="ipoes-id-diversion-submit-button"
        @click="submitButton.click"
      />
    </div>

    <DialogBase
      :open="openDialog"
      :title="t('ipoes.diversionJudgedResult.dialogTitle')"
      title-color="warning"
      :width="1100"
      :cancel-label="t('common.close')"
      @close="openDialog = false"
    >
      <InnerCard color="warning" :title="t('common.error')" class="mt-6">
        <InputGrid
          v-for="error in judgedResultErrors"
          :key="error.code"
          :label="t(`ipoes.diversionJudgedResult.${error.code}`)"
          :label-width="380"
          data-cy="ipoes-id-diversion-errors"
        >
          <div class="text-pre-wrap w-600px">{{ error.reason }}</div>
        </InputGrid>
      </InnerCard>
    </DialogBase>
  </CardContainer>
</template>

<style lang="scss" scoped>
.w-600px {
  width: 600px;
}
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
