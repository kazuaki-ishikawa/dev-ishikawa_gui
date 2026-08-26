<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import {
  initialSearchAddressInputData,
  initialSearchAddressValid,
  JudgeResultListResultTypes,
} from '@/api/hikariCollaboUtil/constants'
import {
  IPOE_LINK,
  IpoeTypes,
  FletsOrderTypes,
  initialHikariCollaboInputData,
  initialHikariCollaboValid,
} from '@/api/ipoes/constants'
import type { IpoeType, FletsType, HikariCollaboPostRequest } from '@/api/ipoes/types'
import { IconTypes } from '@/components/icons/constants'

const Steps = {
  SearchAddress: 0,
  ApplicantInput: 1,
  Confirm: 2,
} as const

type PropsType = {
  isConfirmation: boolean
  ipoeType?: IpoeType
  customerNoteList: Array<{ id: string; customerNote: string }>
}
const props = defineProps<PropsType>()

type Emits = {
  (e: 'submit', request: HikariCollaboPostRequest): void
  (e: 'cancel'): void
  (e: 'confirm', value: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()

const { searchAddress, addressCandidate, searchAddressErrorMessage, selectedRequestKeys } = useSearchAddress()
const { judgeAddressCode, judged, showJudgeError } = useJudgeAddressCode()
const { fletsTypeOptions, nextIpoeTypeOptions, existOptions, photographConsentOptions } = useIpoes()
const { loading } = useLoading()

const searchAddressInputData = ref({ ...initialSearchAddressInputData })
const searchAddressValid = ref({ ...initialSearchAddressValid })
const inputData = ref(structuredClone(initialHikariCollaboInputData))
const inputValid = ref(structuredClone(initialHikariCollaboValid))
const step = ref(0)
const agreed = ref(false)

const showMoveToApplicantInput = computed(() => !!addressCandidate.value?.installationPlaceCode)
const showLineConfirmation = computed(() => inputData.value.constructionOption.siteRouteSurvey === 'true')
const showPhotographOption = computed(() => inputData.value.constructionOption.constructionResultReport === 'true')
watch(step, () => emits('confirm', step.value === Steps.Confirm))

const availableFletsTypeList = computed(() => {
  const list = judged.value?.judgeResultList?.reduce<FletsType[]>(
    (list, judge) => (judge.result !== JudgeResultListResultTypes.NotAvailable ? [...list, judge.fletsType] : list),
    [],
  )
  return list ?? []
})
const filteredFletsTypeOptions = computed(() =>
  fletsTypeOptions.filter(option => availableFletsTypeList.value.includes(option.value)),
)

const confirmationDisabled = computed(() =>
  Object.values(inputValid.value).some(valid =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  ),
)
const isWide = computed(() => inputData.value.ipoeType === IpoeTypes.Wide)

const handleSubmit = () => {
  const {
    constructionOption: {
      siteRouteSurvey,
      lineConfirmation,
      wiringRouteConstruction,
      constructionResultReport,
      photographConsent,
      photographConsentName,
      specifiedVisitDateTime,
    },
  } = inputData.value
  const request: HikariCollaboPostRequest = {
    customerNote: inputData.value.customerNote,
    ipoeType: inputData.value.ipoeType as IpoeType,
    appControl: inputData.value.appControl === 'true',
    onSiteRepairOption: inputData.value.onSiteRepairOption === 'true',
    fletsOrderType: FletsOrderTypes.New,
    fletsType: inputData.value.fletsType as FletsType,
    installationPlaceCode: addressCandidate.value?.installationPlaceCode ?? '',
    constructionOption: {
      siteRouteSurvey: siteRouteSurvey === 'true',
      lineConfirmation: siteRouteSurvey === 'true' ? lineConfirmation === 'true' : undefined,
      wiringRouteConstruction: wiringRouteConstruction === 'true',
      constructionResultReport: constructionResultReport === 'true',
      photographConsent: photographConsent ? photographConsent === 'true' : undefined,
      photographConsentName: photographConsentName || undefined,
      specifiedVisitDateTime: specifiedVisitDateTime === 'true',
    },
  }
  emits('submit', request)
}
const handleReturn = () => {
  step.value--
  agreed.value = false
}
const handleNextStep = () => step.value++
watch(showMoveToApplicantInput, async () => {
  if (!addressCandidate.value?.installationPlaceCode) {
    inputData.value.installationPlaceCode = ''
    return
  }

  inputData.value.installationPlaceCode = addressCandidate.value.installationPlaceCode
  judgeAddressCode({ installationPlaceCode: addressCandidate.value.installationPlaceCode })
})

const handleIpoeTypeChange = (value: string) => {
  inputData.value.ipoeType = value
  inputData.value.appControl = 'false'
  inputValid.value.appControl = true
}
const handleSiteRouteSurveyChange = (value: string) => {
  inputData.value.constructionOption.lineConfirmation = ''
  inputValid.value.constructionOption.lineConfirmation = value !== 'true'
}
const handleConstructionResultReportChange = (value: string) => {
  inputData.value.constructionOption.photographConsent = ''
  inputData.value.constructionOption.photographConsentName = ''
  inputValid.value.constructionOption.photographConsent = value !== 'true'
  inputValid.value.constructionOption.photographConsentName = value !== 'true'
}
const handlePhotographConsentChange = (value: string) => {
  inputData.value.constructionOption.photographConsentName = ''
  inputValid.value.constructionOption.photographConsentName = value !== 'true'
}

onBeforeMount(() => {
  inputData.value.ipoeType = props.ipoeType || ''
  inputValid.value.ipoeType = !!props.ipoeType
})
</script>

<template>
  <div>
    <template v-if="step === Steps.SearchAddress">
      <SearchAddress
        v-model:input="searchAddressInputData"
        v-model:valid="searchAddressValid"
        :selected-request-keys="selectedRequestKeys"
        :disabled="loading"
        :address-candidate="addressCandidate"
        :finished="showMoveToApplicantInput"
        :error-message="searchAddressErrorMessage"
        has-building-type-notice
        class="px-5"
        @search="searchAddress"
      />
      <div
        v-if="showJudgeError"
        class="mt-3 ml-5 text-warning text-pre-wrap"
        data-cy="hikari-collabo-new-create-judge-error"
      >
        {{ t(`ipoes.judgeError.${addressCandidate!.buildingType}`) }}
      </div>
      <div class="flex-flex-end-center pt-8">
        <CustomButton
          icon="right-arrow"
          color="info"
          :text="t('common.cancel')"
          :width="180"
          @click="emits('cancel')"
        />
        <CustomButton
          v-if="showMoveToApplicantInput"
          class="ml-6"
          icon="right-arrow"
          :disabled="!judged || loading"
          :text="t('ipoes.moveToApplicantInput')"
          :width="250"
          data-cy="hikari-collabo-new-move-to-applicant-input-button"
          @click="handleNextStep"
        />
      </div>
    </template>
    <template v-if="step === Steps.ApplicantInput || step === Steps.Confirm">
      <InnerCard :title="t('ipoes.basicInformation')">
        <template #help>
          <i18n-t keypath="ipoes.help.basicInformation" scope="global">
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.BE_PLAN" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <InputGrid required :label="t('ipoes.customerNote')">
          <InputForm
            v-model="inputData.customerNote"
            :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
            required
            maxlength="64"
            placeholder="東京本社A館光回線ファミリータイプ"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-customer-note"
            @valid="(valid: boolean) => (inputValid.customerNote = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.fletsType')">
          <template #help>
            <i18n-t keypath="ipoes.help.fletsType" scope="global">
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.BE_PLAN" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="inputData.fletsType"
            :options="filteredFletsTypeOptions"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-flets-type"
            @valid="(valid: boolean) => (inputValid.fletsType = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('ipoes.ipoeType')">
          <SelectForm
            :model-value="inputData.ipoeType"
            required
            :options="nextIpoeTypeOptions"
            :placeholder="nextIpoeTypeOptions[0]?.text"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-ipoe-type"
            @valid="(valid: boolean) => (inputValid.ipoeType = valid)"
            @update:model-value="handleIpoeTypeChange"
          />
          <template #footer>
            <div
              v-if="inputData.ipoeType === IpoeTypes.Wide"
              class="flex-column flex-center-flex-start text-warning mt-4"
            >
              <span class="font-weight-bold">{{ t('ipoes.wideNote.title') }}</span>
              <i18n-t keypath="ipoes.wideNote.text" scope="global" tag="span">
                <template #plan>{{ t('ipoes.wide') }}</template>
                <template #linkText>
                  <NuxtLink :to="IPOE_LINK.PRICE_LIST" target="_blank">
                    {{ t('ipoes.wideNote.linkText') }}
                  </NuxtLink>
                </template>
              </i18n-t>
            </div>
          </template>
        </InputGrid>
        <InputGrid
          v-if="isWide"
          class="my-1"
          required
          :label="t('ipoes.appControl')"
          :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
        >
          <template #help>
            <i18n-t keypath="ipoes.help.appControl" scope="global">
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.PRICE_LIST" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="inputData.appControl"
            required
            :options="existOptions"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-app-control"
            @valid="(valid: boolean) => (inputValid.appControl = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.addressCode')">
          <InputForm
            v-model="inputData.installationPlaceCode"
            disabled
            data-cy="hikari-collabo-new-installation-place-code"
            @valid="(valid: boolean) => (inputValid.installationPlaceCode = valid)"
          />
        </InputGrid>
        <InputGrid
          required
          :label="t('ipoes.onSiteRepairOption')"
          :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
        >
          <template #help>
            <i18n-t keypath="ipoes.help.onSiteRepairOption" scope="global">
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.PRICE_LIST" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="inputData.onSiteRepairOption"
            :options="existOptions"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-on-site-repair-option"
            @valid="(valid: boolean) => (inputValid.onSiteRepairOption = valid)"
          />
        </InputGrid>
      </InnerCard>

      <InnerCard :title="t('ipoes.constructionOption')">
        <template #help>
          <i18n-t keypath="ipoes.help.constructionOption" scope="global">
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.BE_PLAN" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <InputGrid
          required
          :label="t('ipoes.siteRouteSurvey')"
          :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
        >
          <template #help>
            <i18n-t keypath="ipoes.help.siteRouteSurvey" scope="global">
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.PRICE_LIST_01" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="inputData.constructionOption.siteRouteSurvey"
            :options="existOptions"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-construction-option-site-route-survey"
            @valid="(valid: boolean) => (inputValid.constructionOption.siteRouteSurvey = valid)"
            @update:model-value="handleSiteRouteSurveyChange"
          />
        </InputGrid>
        <InputGrid
          v-if="showLineConfirmation"
          required
          :label="t('ipoes.lineConfirmation')"
          :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
        >
          <template #help>
            <i18n-t keypath="ipoes.help.lineConfirmation" scope="global">
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.PRICE_LIST_01" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="inputData.constructionOption.lineConfirmation"
            :options="existOptions"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-construction-option-line-confirmation"
            @valid="(valid: boolean) => (inputValid.constructionOption.lineConfirmation = valid)"
          />
        </InputGrid>
        <InputGrid
          required
          :label="t('ipoes.wiringRouteConstruction')"
          :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
        >
          <template #help>
            <i18n-t keypath="ipoes.help.wiringRouteConstruction" scope="global">
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.PRICE_LIST_01" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="inputData.constructionOption.wiringRouteConstruction"
            :options="existOptions"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-construction-option-wiring-route-construction"
            @valid="(valid: boolean) => (inputValid.constructionOption.wiringRouteConstruction = valid)"
          />
        </InputGrid>
        <InputGrid
          required
          :label="t('ipoes.constructionResultReport')"
          :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
        >
          <template #help>
            <i18n-t keypath="ipoes.help.constructionResultReport" scope="global">
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.PRICE_LIST_01" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="inputData.constructionOption.constructionResultReport"
            :options="existOptions"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-construction-option-construction-result-report"
            @valid="(valid: boolean) => (inputValid.constructionOption.constructionResultReport = valid)"
            @update:model-value="handleConstructionResultReportChange"
          />
        </InputGrid>
        <template v-if="showPhotographOption">
          <InputGrid required :label="t('ipoes.photographConsent')">
            <RadioForm
              v-model="inputData.constructionOption.photographConsent"
              :options="photographConsentOptions"
              :disabled="isConfirmation"
              data-cy="hikari-collabo-new-construction-option-photograph-consent"
              @valid="(valid: boolean) => (inputValid.constructionOption.photographConsent = valid)"
              @update:model-value="handlePhotographConsentChange"
            />
          </InputGrid>
          <InputGrid
            v-if="inputData.constructionOption.photographConsent === 'true'"
            required
            :label="t('ipoes.photographConsentName')"
          >
            <InputForm
              v-model="inputData.constructionOption.photographConsentName"
              required
              maxlength="41"
              :rules="[rules.fullwidthCharacter, rules.fullwidthSpace]"
              :placeholder="t('placeholder.name')"
              :disabled="isConfirmation"
              data-cy="hikari-collabo-new-construction-option-photograph-consent-name"
              @valid="(valid: boolean) => (inputValid.constructionOption.photographConsentName = valid)"
            />
          </InputGrid>
        </template>
        <InputGrid
          required
          :label="t('ipoes.specifiedVisitDateTime')"
          :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
        >
          <template #help>
            <i18n-t keypath="ipoes.help.specifiedVisitDateTime" scope="global">
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.PRICE_LIST_01" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
          <RadioForm
            v-model="inputData.constructionOption.specifiedVisitDateTime"
            :options="existOptions"
            :disabled="isConfirmation"
            data-cy="hikari-collabo-new-construction-option-specified-visit-date-time"
            @valid="(valid: boolean) => (inputValid.constructionOption.specifiedVisitDateTime = valid)"
          />
        </InputGrid>
      </InnerCard>

      <HikariCollaboTermsOfService v-if="isConfirmation && isWide" v-model="agreed" />

      <div class="flex-flex-end-center pt-2">
        <CustomButton
          icon="left-arrow"
          color="info"
          :text="t('common.return')"
          :width="180"
          data-cy="hikari-collabo-new-return-button"
          @click="handleReturn"
        />
        <CustomButton
          v-if="step === Steps.ApplicantInput"
          class="ml-6"
          icon="right-arrow"
          :text="t('common.confirm')"
          :width="180"
          :disabled="confirmationDisabled"
          data-cy="hikari-collabo-new-confirm-button"
          @click="handleNextStep"
        />
        <CustomButton
          v-if="isConfirmation"
          class="ml-6"
          icon="right-arrow"
          :disabled="(isWide && !agreed) || loading"
          :text="t('common.create')"
          :width="180"
          data-cy="hikari-collabo-new-submit-button"
          @click="handleSubmit"
        />
      </div>
    </template>
  </div>
</template>
