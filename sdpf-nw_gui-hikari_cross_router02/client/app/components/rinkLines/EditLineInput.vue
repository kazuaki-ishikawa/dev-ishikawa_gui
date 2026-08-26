<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  type initialRinkLineListInputData,
  type initialRinkLineListValid,
  RinkLineAccessTypes,
} from '@/api/rinkLines/constants'
import type { AvailableLinePrefixResponse, RinkLineAccessType } from '@/api/rinkLines/types'
import type { OptionType } from '@/components/input/types'
import type { PlanOptionsType } from '@/components/rinkLines/types'

type PropType = {
  planOptions: PlanOptionsType
  deviceOptions: Array<OptionType<string>>
  availableLinePrefix: AvailableLinePrefixResponse
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
})

const input = defineModel<typeof initialRinkLineListInputData>({ required: true })
const inputValid = defineModel<typeof initialRinkLineListValid>('valid', { required: true })

const { t } = useI18n()
const rules = useRules()
const { rinkLineRules } = useRinkLines()

const accessTypeOptions = [
  { text: t(`rinkLines.accessTypes.${RinkLineAccessTypes.Lte}`), value: RinkLineAccessTypes.Lte },
  { text: t(`rinkLines.accessTypes.${RinkLineAccessTypes.Nsa5g}`), value: RinkLineAccessTypes.Nsa5g },
]
const handleAccessTypeUpdate = (value: RinkLineAccessType) => {
  const found = props.planOptions[value]?.find(plan => plan.value === input.value.planLimitAlias)
  input.value.planLimitAlias = found?.value ?? ''
}
</script>

<template>
  <div>
    <InputGrid required :label="t('rinkLines.accessType')">
      <SelectForm
        v-model="input.accessType"
        :options="accessTypeOptions"
        :placeholder="accessTypeOptions[0]?.text"
        size="middle"
        required
        :disabled="disabled"
        data-cy="edit-line-input-access-type"
        @update:model-value="handleAccessTypeUpdate"
        @valid="(valid: boolean) => (inputValid.accessType = valid)"
      />
    </InputGrid>
    <InputGrid required :label="t('rinkLines.plan')">
      <SelectForm
        v-model="input.planLimitAlias"
        :options="planOptions?.[input.accessType] ?? []"
        :placeholder="planOptions[input.accessType]![0]?.text"
        size="middle"
        required
        :disabled="disabled"
        data-cy="edit-line-input-plan-limit-alias"
        @valid="(valid: boolean) => (inputValid.planLimitAlias = valid)"
      />
    </InputGrid>
    <InputGrid required :label="t('rinkLines.deviceName')">
      <SelectForm
        v-model="input.deviceNameAlias"
        :options="deviceOptions"
        :placeholder="deviceOptions[0]?.text"
        size="middle"
        required
        :disabled="disabled"
        data-cy="edit-line-input-device-name-alias"
        @valid="(valid: boolean) => (inputValid.deviceNameAlias = valid)"
      />
    </InputGrid>
    <InputGrid required :label="t('rinkLines.authenticationId')" :help="t('rinkLines.help.authenticationId')">
      <InputForm
        v-model="input.authenticationId"
        :rules="[rinkLineRules.authenticationId, rules.maxlength(10)]"
        placeholder="1234567890"
        maxlength="10"
        minlength="3"
        required
        :disabled="disabled"
        data-cy="edit-line-input-authentication-id"
        @valid="(valid: boolean) => (inputValid.authenticationId = valid)"
      />
    </InputGrid>
    <InputGrid
      required
      :label="t('rinkLines.authenticationPassword')"
      :help="t('rinkLines.help.authenticationPassword')"
    >
      <InputForm
        v-model="input.authenticationPassword"
        :rules="[rinkLineRules.password]"
        maxlength="15"
        minlength="2"
        required
        password
        placeholder="********"
        :disabled="disabled"
        data-cy="edit-line-input-authentication-password"
        @valid="(valid: boolean) => (inputValid.authenticationPassword = valid)"
      />
    </InputGrid>
    <InputGrid required :label="t('rinkLines.actIpAddress')">
      <InputPrefixedIpForm
        v-model="input.actIpAddress"
        :prefix="32"
        :rules="[rules.ipAddress, rules.availableIpAddress(availableLinePrefix.lineActPrefix, 32)]"
        placeholder="192.0.2.4"
        maxlength="15"
        required
        :disabled="disabled"
        data-cy="edit-line-input-act-ip-address"
        @valid="(valid: boolean) => (inputValid.actIpAddress = valid)"
      />
      <template #footer>
        <div class="footer text-sm mt-2" data-cy="edit-line-input-act-ip-address-available-prefix">
          <span>{{ t('rinkLines.availableIpAddress') }}</span>
          <div v-if="availableLinePrefix.lineActPrefix.length === 0">{{ t('orders.none') }}</div>
          <div v-else class="line-prefix-list d-flex flex-wrap">
            <span v-for="prefix in availableLinePrefix.lineActPrefix" :key="prefix">
              {{ prefix }}
            </span>
          </div>
        </div>
      </template>
    </InputGrid>
    <InputGrid :label="t('rinkLines.sbyIpAddress')">
      <InputPrefixedIpForm
        v-model="input.sbyIpAddress"
        :prefix="32"
        :rules="[rules.ipAddress, rules.availableIpAddress(availableLinePrefix.lineSbyPrefix, 32)]"
        placeholder="192.0.2.4"
        maxlength="15"
        :disabled="disabled"
        data-cy="edit-line-input-sby-ip-address"
        @valid="(valid: boolean) => (inputValid.sbyIpAddress = valid)"
      />
      <template #footer>
        <div class="footer text-sm mt-2" data-cy="edit-line-input-sby-ip-address-available-prefix">
          <span>{{ t('rinkLines.availableIpAddress') }}</span>
          <div v-if="availableLinePrefix.lineSbyPrefix.length === 0">{{ t('orders.none') }}</div>
          <div v-else class="line-prefix-list d-flex flex-wrap">
            <span v-for="prefix in availableLinePrefix.lineSbyPrefix" :key="prefix">
              {{ prefix }}
            </span>
          </div>
        </div>
      </template>
    </InputGrid>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 1rem;
}
.line-prefix-list {
  column-gap: 1rem;
  row-gap: 0.5rem;
}
</style>
