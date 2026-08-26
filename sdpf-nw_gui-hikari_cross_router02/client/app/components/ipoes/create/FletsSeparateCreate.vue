<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import {
  IPOE_LINK,
  HikariPlans,
  IpoeTypes,
  initialFletsSeparateInputData,
  initialFletsSeparateValid,
} from '@/api/ipoes/constants'
import type { FletsSeparatePostRequest, HikariPlanType, IpoeType } from '@/api/ipoes/types'
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  ipoeType?: IpoeType
  customerNoteList: Array<{ id: string; customerNote: string }>
}
const props = defineProps<PropType>()
const isConfirmation = defineModel<boolean>('isConfirmation', { required: true })

type Emits = {
  (e: 'submit', value: FletsSeparatePostRequest): void
  (e: 'cancel'): void
  (e: 'confirm', value: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()
const today = dayjs().format()
const yesterday = dayjs().subtract(1, 'day').format()

const inputData = ref(structuredClone(initialFletsSeparateInputData))
const inputValid = ref(structuredClone(initialFletsSeparateValid))

const {
  hikariPlanOptions,
  getFletsSeparateIpoeTypeOptions,
  getIpoeTypeText,
  isWidePlanType,
  existOptions,
  fletsOpenOptions,
} = useIpoes()

const agreed = ref(false)
const isWidePlan = computed(() => isWidePlanType(inputData.value.ipoeType))
const ipoeTypeOptions = computed(() => getFletsSeparateIpoeTypeOptions(inputData.value.hikariPlan))
const nameEmpty = computed(
  () =>
    !inputData.value.applicant.name &&
    !inputData.value.applicant.nameKana &&
    !inputData.value.originContractor.name &&
    !inputData.value.originContractor.nameKana,
)
const postalCodeEmpty = computed(
  () => !inputData.value.originContractor.postalCode && !inputData.value.installationPlace.postalCode,
)
const contactEmpty = computed(
  () =>
    !inputData.value.applicant.phoneNumber &&
    !inputData.value.applicant.mailAddress &&
    !inputData.value.originContractor.phoneNumber &&
    !inputData.value.originContractor.mailAddress &&
    !inputData.value.installationPlace.phoneNumber,
)
const invalid = computed(() =>
  Object.values(inputValid.value).some(valid =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  ),
)
const saveDisabled = computed(() => {
  if (!inputData.value.fletsId) {
    return invalid.value || nameEmpty.value || postalCodeEmpty.value || contactEmpty.value
  } else if (!inputData.value.accessKey) {
    return invalid.value || (nameEmpty.value && contactEmpty.value)
  } else {
    return invalid.value
  }
})

const showCustomerInformation = computed(() => !inputData.value.fletsId || !inputData.value.accessKey)
watch(showCustomerInformation, next => {
  if (!next) {
    inputData.value = {
      ...inputData.value,
      applicant: { ...initialFletsSeparateInputData.applicant },
      originContractor: { ...initialFletsSeparateInputData.originContractor },
      installationPlace: { ...initialFletsSeparateInputData.installationPlace },
    }
    inputValid.value = {
      ...inputValid.value,
      applicant: { ...initialFletsSeparateValid.applicant },
      originContractor: { ...initialFletsSeparateValid.originContractor },
      installationPlace: { ...initialFletsSeparateValid.installationPlace },
    }
  }
})

const handleIpoeTypeChange = (value: string) => {
  if (!isWidePlanType(value)) {
    inputData.value.appControl = 'false'
    inputValid.value.appControl = true
  }
  inputData.value.ipoeType = value
}

// 光クロスはスーパーワイドのみ選択可能
const handleHikariPlanChange = (value: string) => {
  handleIpoeTypeChange(value === HikariPlans.Cross ? IpoeTypes.SuperWide : '')
}

const handleFletsOpenChange = (value: string) => {
  inputData.value.fletsOpenDate = ''
  inputValid.value.fletsOpenDate = value === 'true'
}

const handleSave = () => {
  const data = Object.entries(inputData.value).reduce<FletsSeparatePostRequest>(
    (acc, [key, value]) => {
      if (typeof value === 'object' && Object.values(value).some(v => !!v)) {
        const obj = Object.entries(value).reduce((a, [k, v]) => {
          return { ...a, [k]: v || undefined }
        }, {})
        Object.assign(acc, { [key]: obj })
      } else if (key === 'ipoeType') {
        Object.assign(acc, { [key]: value as IpoeType })
      } else if (key === 'hikariPlan') {
        Object.assign(acc, { [key]: value as HikariPlanType })
      } else if ((key === 'appControl' || key === 'fletsOpen') && !!value) {
        Object.assign(acc, { [key]: value === 'true' })
      } else if (typeof value === 'string' && !!value) {
        Object.assign(acc, { [key]: value })
      }
      return acc
    },
    { customerNote: '', hikariPlan: HikariPlans.Next, ipoeType: 'normal', appControl: false, fletsOpen: true },
  )
  emits('submit', data)
}

const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : () => emits('confirm', true)
  const text = isConfirmation.value ? t('common.create') : t('common.confirm')
  return { click, text }
})

onBeforeMount(() => {
  inputData.value.ipoeType = props.ipoeType || ''
  inputValid.value.ipoeType = !!props.ipoeType
})
</script>

<template>
  <div class="px-5">
    <InputGrid required :label="t('ipoes.customerNote')">
      <InputForm
        v-model="inputData.customerNote"
        :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
        required
        maxlength="64"
        placeholder="東京本社A館フレッツ光ファミリー"
        :disabled="isConfirmation"
        data-cy="flets-separate-customer-note"
        @valid="(valid: boolean) => (inputValid.customerNote = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('ipoes.fletsId')" :help="t('ipoes.help.fletsId')">
      <InputForm
        v-model="inputData.fletsId"
        :rules="[rules.fletsId]"
        maxlength="13"
        placeholder="CAF1234567890"
        :disabled="isConfirmation"
        data-cy="flets-separate-flets-id"
        @valid="(valid: boolean) => (inputValid.fletsId = valid)"
      />
    </InputGrid>
    <InputGrid required :label="t('ipoes.hikariPlan')">
      <RadioForm
        v-model="inputData.hikariPlan"
        required
        :options="hikariPlanOptions"
        :disabled="isConfirmation"
        data-cy="flets-separate-hikari-plan"
        @valid="(valid: boolean) => (inputValid.hikariPlan = valid)"
        @update:model-value="handleHikariPlanChange"
      />
    </InputGrid>
    <InputGrid required :label="t('ipoes.ipoeType')">
      <SelectForm
        :model-value="inputData.ipoeType"
        required
        :options="ipoeTypeOptions"
        :placeholder="ipoeTypeOptions[0]?.text"
        :disabled="isConfirmation"
        data-cy="flets-separate-ipoe-type"
        @valid="(valid: boolean) => (inputValid.ipoeType = valid)"
        @update:model-value="handleIpoeTypeChange"
      />
      <template #footer>
        <div
          v-if="isWidePlan"
          class="flex-column flex-center-flex-start text-warning mt-4"
          data-cy="flets-separate-wide-note"
        >
          <span class="font-weight-bold">{{ t('ipoes.wideNote.title') }}</span>
          <i18n-t keypath="ipoes.wideNote.text" scope="global" tag="span">
            <template #plan>{{ getIpoeTypeText(inputData.ipoeType) }}</template>
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.PRICE" target="_blank">
                {{ t('ipoes.wideNote.linkText') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </div>
      </template>
    </InputGrid>
    <InputGrid
      v-if="isWidePlan"
      required
      class="my-1"
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
        data-cy="flets-separate-app-control"
        @valid="(valid: boolean) => (inputValid.appControl = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('ipoes.accessKey')" :help="t('ipoes.help.accessKey')">
      <InputForm
        v-model="inputData.accessKey"
        :rules="[rules.accessKey]"
        maxlength="8"
        placeholder="abcd1234"
        :disabled="isConfirmation"
        data-cy="flets-separate-access-key"
        @valid="(valid: boolean) => (inputValid.accessKey = valid)"
      />
    </InputGrid>
    <InputGrid :label="t('ipoes.ipoeApplicationDate')" :help="t('ipoes.help.ipoeApplicationDate')">
      <DatePicker
        v-model="inputData.ipoeApplicationDate"
        :min-date="yesterday"
        :disabled="isConfirmation"
        data-cy="flets-separate-ipoe-application-date"
        @valid="(valid: boolean) => (inputValid.ipoeApplicationDate = valid)"
      />
    </InputGrid>
    <InputGrid class="my-1" required :label="t('ipoes.fletsOpen')" :help="t('ipoes.help.fletsOpen')">
      <RadioForm
        v-model="inputData.fletsOpen"
        required
        :options="fletsOpenOptions"
        :disabled="isConfirmation"
        data-cy="flets-separate-flets-open"
        @valid="(valid: boolean) => (inputValid.fletsOpen = valid)"
        @update:model-value="handleFletsOpenChange"
      />
    </InputGrid>
    <InputGrid
      v-if="inputData.fletsOpen === 'false'"
      required
      :label="t('ipoes.fletsOpenDate')"
      :help="t('ipoes.help.fletsOpenDate')"
    >
      <DatePicker
        v-model="inputData.fletsOpenDate"
        required
        :min-date="today"
        :disabled="isConfirmation"
        data-cy="flets-separate-flets-open-date"
        @valid="(valid: boolean) => (inputValid.fletsOpenDate = valid)"
      />
    </InputGrid>

    <template v-if="showCustomerInformation">
      <div class="flex-flex-start-center pt-5">
        {{ t('ipoes.customerInformation') }}
        <HelpTooltip class="px-2 pt-1" size="smallMiddle">
          <i18n-t keypath="ipoes.help.customerInfo" scope="global">
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.CUSTOMER_INFO" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </HelpTooltip>
      </div>
      <NumberContainer :number="1">
        <InputGrid :label="t('ipoes.contractorName')" :label-width="240">
          <InputForm
            v-model="inputData.originContractor.name"
            size="large"
            maxlength="64"
            :placeholder="t('placeholder.companyName')"
            :disabled="isConfirmation"
            data-cy="flets-separate-origin-contractor-name"
            @valid="(valid: boolean) => (inputValid.originContractor.name = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.contractorNameKana')" :label-width="240">
          <InputForm
            v-model="inputData.originContractor.nameKana"
            :rules="[rules.nameKana]"
            size="large"
            maxlength="128"
            :placeholder="t('placeholder.companyNameKana')"
            :disabled="isConfirmation"
            data-cy="flets-separate-origin-contractor-name-kana"
            @valid="(valid: boolean) => (inputValid.originContractor.nameKana = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.applicantName')" :label-width="240">
          <InputForm
            v-model="inputData.applicant.name"
            maxlength="41"
            :rules="[rules.fullwidthSpace]"
            :placeholder="t('placeholder.name')"
            :disabled="isConfirmation"
            data-cy="flets-separate-applicant-name"
            @valid="(valid: boolean) => (inputValid.applicant.name = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.applicantNameKana')" :label-width="240">
          <InputForm
            v-model="inputData.applicant.nameKana"
            maxlength="41"
            :rules="[rules.nameKana, rules.fullwidthSpace]"
            :placeholder="t('placeholder.nameKana')"
            :disabled="isConfirmation"
            data-cy="flets-separate-applicant-name-kana"
            @valid="(valid: boolean) => (inputValid.applicant.nameKana = valid)"
          />
        </InputGrid>
      </NumberContainer>

      <NumberContainer :number="2">
        <InputGrid :label="t('ipoes.contractorPostalCode')" :label-width="240">
          <InputForm
            v-model="inputData.originContractor.postalCode"
            :rules="[rules.postalCode]"
            maxlength="8"
            placeholder="100-8019"
            :disabled="isConfirmation"
            data-cy="flets-separate-origin-contractor-postal-code"
            @valid="(valid: boolean) => (inputValid.originContractor.postalCode = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.installationPlacePostalCode')" :label-width="240">
          <InputForm
            v-model="inputData.installationPlace.postalCode"
            :rules="[rules.postalCode]"
            maxlength="8"
            placeholder="100-8019"
            :disabled="isConfirmation"
            data-cy="flets-separate-installation-place-postal-code"
            @valid="(valid: boolean) => (inputValid.installationPlace.postalCode = valid)"
          />
        </InputGrid>
      </NumberContainer>

      <NumberContainer :number="3">
        <InputGrid :label="t('ipoes.applicantPhoneNumber')" :label-width="240">
          <InputForm
            v-model="inputData.applicant.phoneNumber"
            :rules="[rules.phoneNumber]"
            maxlength="13"
            placeholder="03-1234-5678"
            :disabled="isConfirmation"
            data-cy="flets-separate-applicant-phone-number"
            @valid="(valid: boolean) => (inputValid.applicant.phoneNumber = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.contractorPhoneNumber')" :label-width="240">
          <InputForm
            v-model="inputData.originContractor.phoneNumber"
            :rules="[rules.phoneNumber]"
            maxlength="13"
            placeholder="03-1234-5678"
            :disabled="isConfirmation"
            data-cy="flets-separate-origin-contractor-phone-number"
            @valid="(valid: boolean) => (inputValid.originContractor.phoneNumber = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.installationPlacePhoneNumber')" :label-width="240">
          <InputForm
            v-model="inputData.installationPlace.phoneNumber"
            :rules="[rules.phoneNumber]"
            maxlength="13"
            placeholder="03-1234-5678"
            :disabled="isConfirmation"
            data-cy="flets-separate-installation-place-phone-number"
            @valid="(valid: boolean) => (inputValid.installationPlace.phoneNumber = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.contractorMailAddress')" :label-width="240">
          <InputForm
            v-model="inputData.originContractor.mailAddress"
            :rules="[rules.mailAddress]"
            maxlength="60"
            placeholder="user@example.com"
            :disabled="isConfirmation"
            data-cy="flets-separate-origin-contractor-mail-address"
            @valid="(valid: boolean) => (inputValid.originContractor.mailAddress = valid)"
          />
        </InputGrid>
        <InputGrid :label="t('ipoes.applicantMailAddress')" :label-width="240">
          <InputForm
            v-model="inputData.applicant.mailAddress"
            :rules="[rules.mailAddress]"
            maxlength="60"
            placeholder="user@example.com"
            :disabled="isConfirmation"
            data-cy="flets-separate-applicant-mail-address"
            @valid="(valid: boolean) => (inputValid.applicant.mailAddress = valid)"
          />
        </InputGrid>
      </NumberContainer>
    </template>

    <HikariCollaboTermsOfService v-if="isConfirmation && isWidePlan" v-model="agreed" class="mt-5" />

    <div v-if="isConfirmation" class="flex-flex-end-center mt-5">
      <div class="text-pre-wrap">{{ t('ipoes.message.createWarning') }}</div>
    </div>

    <div class="flex-flex-end-center mt-5">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="flets-separate-cancel-button"
        @cancel="emits('cancel')"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :width="180"
        :text="submit.text"
        :disabled="saveDisabled || loading || (isConfirmation && isWidePlan && !agreed)"
        data-cy="flets-separate-submit-button"
        @click="submit.click"
      />
    </div>
  </div>
</template>
