<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CustomerTypes, initialMsbInputData, initialMsbValid } from '@/api/msb/constants'
import type { MsbPostRequest } from '@/api/msb/types'

const { t } = useI18n()
const rules = useRules()
const router = useRouter()

const inputData = ref(structuredClone(initialMsbInputData))
const inputValid = ref({ ...initialMsbValid })

const { loading } = useLoading()

const { createMsb } = useCreateMsb()
const { msbLicenseOptions } = useMsb()
const { contractor, getContractor } = useGetContractor()

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const disabled = computed(() => Object.values(inputValid.value).some(valid => !valid))
const isConfirmation = ref(false)
const noLicensePack = computed(() => Object.values(inputData.value.licensePacks).every(value => value === '0'))

const switchConfirm = () => {
  isConfirmation.value = !isConfirmation.value
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSubmit = async () => {
  const request: MsbPostRequest = {
    ...inputData.value,
    customerSpecialNote: inputData.value.customerSpecialNote || null,
    licensePacks: {
      '1licensePacks': Number(inputData.value.licensePacks['1licensePacks']),
      '10licensePacks': Number(inputData.value.licensePacks['10licensePacks']),
      '100licensePacks': Number(inputData.value.licensePacks['100licensePacks']),
      '1000licensePacks': Number(inputData.value.licensePacks['1000licensePacks']),
      '10000licensePacks': Number(inputData.value.licensePacks['10000licensePacks']),
    },
  }
  await createMsb(request)
  navigationGuard(false)
  router.back()
}

onBeforeMount(getContractor)
</script>

<template>
  <CardContainer>
    <InnerCard :title="t('msb.customerInformation')">
      <DetailGrid>
        <div>{{ t('msb.contractorName') }}</div>
        <div>{{ contractor?.name }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('msb.contractorNameKana') }}</div>
        <div>{{ contractor?.nameKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('contractor.postalCode') }}</div>
        <div>{{ contractor?.postalCode }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('contractor.address') }}</div>
        <div>{{ contractor?.address }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('contractor.houseNumber') }}</div>
        <div>{{ contractor?.houseNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('contractor.buildingName') }}</div>
        <div>{{ contractor?.buildingName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('contractor.addressKana') }}</div>
        <div>{{ contractor?.addressKana }}</div>
      </DetailGrid>
      <InputGrid required :label="t('msb.departmentName')">
        <InputForm
          v-model="inputData.departmentName"
          maxlength="20"
          required
          placeholder="営業部"
          :disabled="isConfirmation"
          data-cy="msb-create-department-name"
          @valid="valid => (inputValid.departmentName = valid)"
        />
      </InputGrid>
      <DetailGrid>
        <div>{{ t('terminals.picName') }}</div>
        <div>{{ contractor?.picName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('contractor.phoneNumber') }}</div>
        <div>{{ contractor?.phoneNumber }}</div>
      </DetailGrid>
      <InputGrid required :label="t('msb.customerType')">
        <RadioForm
          v-model="inputData.customerType"
          :options="[
            { text: `${t('msb.customerTypes.corporate')}`, value: CustomerTypes.Corporate },
            { text: `${t('msb.customerTypes.government')}`, value: CustomerTypes.Government },
          ]"
          required
          :disabled="isConfirmation"
          data-cy="msb-create-customer-type"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.emailAddress')" :help="t('msb.help.emailAddress')">
        <InputForm
          v-model="inputData.emailAddress"
          :rules="[rules.mailAddress]"
          maxlength="254"
          required
          placeholder="mail@example.com"
          :disabled="isConfirmation"
          data-cy="msb-create-email-address"
          @valid="valid => (inputValid.emailAddress = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('msb.customerSpecialNote')">
        <InputForm
          v-model="inputData.customerSpecialNote"
          :rules="[rules.fullwidthCharacter]"
          maxlength="254"
          placeholder="弊社個別案内時記入"
          :disabled="isConfirmation"
          data-cy="msb-create-customer-special-note"
          @valid="valid => (inputValid.customerSpecialNote = valid)"
        />
      </InputGrid>
    </InnerCard>

    <InnerCard :title="t('msb.applicationLicenseInformation')" :note="t('msb.note.applicationLicenseInformation')" class="mt-4">
      <InputGrid required :label="t('msb.licensePacks.10000licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['10000licensePacks']"
          :options="msbLicenseOptions(9)"
          size="middle"
          required
          :disabled="isConfirmation"
          data-cy="msb-create-10000license-packs"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.licensePacks.1000licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['1000licensePacks']"
          :options="msbLicenseOptions(8)"
          size="middle"
          required
          :disabled="isConfirmation"
          data-cy="msb-create-1000license-packs"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.licensePacks.100licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['100licensePacks']"
          :options="msbLicenseOptions(7)"
          size="middle"
          required
          :disabled="isConfirmation"
          data-cy="msb-create-100license-packs"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.licensePacks.10licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['10licensePacks']"
          :options="msbLicenseOptions(8)"
          size="middle"
          required
          :disabled="isConfirmation"
          data-cy="msb-create-10license-packs"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.licensePacks.1licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['1licensePacks']"
          :options="msbLicenseOptions(8)"
          size="middle"
          required
          :disabled="isConfirmation"
          data-cy="msb-create-1license-packs"
        />
      </InputGrid>
      <div v-if="noLicensePack" class="mb-4 text-warning" data-cy="msb-create-no-license-pack">
        {{ t('msb.message.noLicensePack') }}
      </div>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        @cancel="isConfirmation ? switchConfirm() : router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="disabled || loading || noLicensePack"
        :width="180"
        :text="isConfirmation ? t('common.create') : t('common.confirm')"
        data-cy="msb-create-submit-button"
        @click="isConfirmation ? handleSubmit() : switchConfirm()"
      />
    </div>
  </CardContainer>
</template>
