<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { initialMsbEditInputData, initialMsbEditValid } from '@/api/msb/constants'
import type { MsbPatchRequest } from '@/api/msb/types'

const { t } = useI18n()
const rules = useRules()
const router = useRouter()
const route = useRoute()
const resourceId = computed(() => route.params.id as string)

const inputData = ref(structuredClone(initialMsbEditInputData))
const inputValid = ref({ ...initialMsbEditValid })

const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()

const { msbLicenseOptions } = useMsb()
const { msbLicenses, getMsbLicenses } = useGetMsbLicenses()
const { updateMsbLicenses } = useUpdateMsbLicenses()

const isConfirmation = ref(false)

const originalData = computed(() => ({
  emailAddress: '',
  customerSpecialNote: '',
  licensePacks: {
    '1licensePacks': `${msbLicenses.value?.licensePacks['1licensePacks'] ?? 0}`,
    '10licensePacks': `${msbLicenses.value?.licensePacks['10licensePacks'] ?? 0}`,
    '100licensePacks': `${msbLicenses.value?.licensePacks['100licensePacks'] ?? 0}`,
    '1000licensePacks': `${msbLicenses.value?.licensePacks['1000licensePacks'] ?? 0}`,
    '10000licensePacks': `${msbLicenses.value?.licensePacks['10000licensePacks'] ?? 0}`,
  },
}))

const changed = computed(() => !isEqual(inputData.value, originalData.value))
const disabled = computed(() => Object.values(inputValid.value).some(valid => !valid) || !changed.value)
const noLicensePack = computed(() => Object.values(inputData.value.licensePacks).every(value => value === '0'))

const switchConfirm = () => {
  isConfirmation.value = !isConfirmation.value
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSubmit = async () => {
  if (!msbLicenses.value) {
    return
  }

  const request: MsbPatchRequest = {
    emailAddress: inputData.value.emailAddress,
    customerSpecialNote: inputData.value.customerSpecialNote || undefined,
    licensePacks: {
      '1licensePacks': Number(inputData.value.licensePacks['1licensePacks']),
      '10licensePacks': Number(inputData.value.licensePacks['10licensePacks']),
      '100licensePacks': Number(inputData.value.licensePacks['100licensePacks']),
      '1000licensePacks': Number(inputData.value.licensePacks['1000licensePacks']),
      '10000licensePacks': Number(inputData.value.licensePacks['10000licensePacks']),
    },
  }
  await updateMsbLicenses(resourceId.value, request)
  navigationGuard(false)
  router.back()
}

watch(originalData, value => (inputData.value = structuredClone(value)), { immediate: true })
watchEffect(() => navigationGuard(changed.value))

onBeforeMount(async () => {
  await getMsbLicenses(resourceId.value)
})
</script>

<template>
  <CardContainer>
    <InnerCard :title="t('msb.customerInformation')">
      <InputGrid required :label="t('msb.emailAddress')" :help="t('msb.help.emailAddress')">
        <InputForm
          v-model="inputData.emailAddress"
          :rules="[rules.mailAddress]"
          required
          maxlength="254"
          placeholder="mail@example.com"
          :disabled="isConfirmation"
          data-cy="msb-id-edit-email-address"
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
          data-cy="msb-id-edit-customer-special-note"
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
          data-cy="msb-id-edit-10000license-packs"
          :disabled="isConfirmation"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.licensePacks.1000licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['1000licensePacks']"
          :options="msbLicenseOptions(8)"
          size="middle"
          required
          data-cy="msb-id-edit-1000license-packs"
          :disabled="isConfirmation"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.licensePacks.100licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['100licensePacks']"
          :options="msbLicenseOptions(7)"
          size="middle"
          required
          data-cy="msb-id-edit-100license-packs"
          :disabled="isConfirmation"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.licensePacks.10licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['10licensePacks']"
          :options="msbLicenseOptions(8)"
          size="middle"
          required
          data-cy="msb-id-edit-10license-packs"
          :disabled="isConfirmation"
        />
      </InputGrid>
      <InputGrid required :label="t('msb.licensePacks.1licensePacks')">
        <SelectForm
          v-model="inputData.licensePacks['1licensePacks']"
          :options="msbLicenseOptions(8)"
          size="middle"
          required
          data-cy="msb-id-edit-1license-packs"
          :disabled="isConfirmation"
        />
      </InputGrid>
      <div v-if="!loading && noLicensePack" class="mb-4 text-warning" data-cy="msb-id-edit-no-license-pack">
        {{ t('msb.message.noLicensePack') }}
      </div>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="msb-id-edit-cancel-button"
        @cancel="isConfirmation ? switchConfirm() : router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="disabled || loading || noLicensePack"
        :width="180"
        :text="isConfirmation ? t('common.application') : t('common.confirm')"
        data-cy="msb-id-edit-submit-button"
        @click="isConfirmation ? handleSubmit() : switchConfirm()"
      />
    </div>
  </CardContainer>
</template>
