<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GUARANTEE_LINK } from '@/api/guarantees/constants'
import type { InitialGuaranteeInputDataType } from '@/api/guarantees/types'

type PropType = {
  editData: InitialGuaranteeInputDataType
  originalData: InitialGuaranteeInputDataType
}
const props = defineProps<PropType>()

const { t } = useI18n()
const connectVpn = computed(() => !props.originalData.vpnRateLimit && !!props.editData.vpnRateLimit)
const connectInternet = computed(() => !props.originalData.internetRateLimit && !!props.editData.internetRateLimit)
</script>

<template>
  <InnerCard v-if="connectVpn">
    <div class="font-weight-bold">{{ t('guarantees.editCautions.title', { number: 1 }) }}</div>
    <i18n-t keypath="guarantees.editCautions.caution-1.base" tag="div" scope="global" class="text-pre-wrap">
      <template #type>
        {{ t('guarantees.vpn') }}
      </template>
      <template #underline>
        <span class="text-decoration-underline">{{ t('guarantees.editCautions.caution-1.underline') }}</span>
      </template>
    </i18n-t>
    <div class="pt-3 font-weight-bold">{{ t('guarantees.editCautions.title', { number: 2 }) }}</div>
    <div>
      <span class="text-decoration-underline">{{
        t('guarantees.editCautions.caution-2', { type: t('guarantees.vpn') })
      }}</span>
    </div>
    <i18n-t keypath="guarantees.editCautions.connectVpn-3.base" tag="div" scope="global" class="pt-3 text-pre-wrap">
      <template #underline>
        <span class="text-decoration-underline">{{ t('guarantees.editCautions.connectVpn-3.underline') }}</span>
      </template>
      <template #here>
        <NuxtLink :to="GUARANTEE_LINK.STEP_VPN" target="_blank">
          {{ t('common.here') }}
        </NuxtLink>
      </template>
    </i18n-t>
  </InnerCard>
  <InnerCard v-if="connectInternet">
    <div class="font-weight-bold">{{ t('guarantees.editCautions.title', { number: 1 }) }}</div>
    <i18n-t keypath="guarantees.editCautions.caution-1.base" tag="div" scope="global" class="text-pre-wrap">
      <template #type>
        {{ t('guarantees.internet') }}
      </template>
      <template #underline>
        <span class="text-decoration-underline">{{ t('guarantees.editCautions.caution-1.underline') }}</span>
      </template>
    </i18n-t>
    <div class="pt-3 font-weight-bold">{{ t('guarantees.editCautions.title', { number: 2 }) }}</div>
    <span class="text-decoration-underline">{{
      t('guarantees.editCautions.caution-2', { type: t('guarantees.internet') })
    }}</span>
    <i18n-t
      keypath="guarantees.editCautions.connectInternet-3.base"
      tag="div"
      scope="global"
      class="pt-3 text-pre-wrap"
    >
      <template #list>
        <ul>
          <i18n-t keypath="guarantees.editCautions.connectInternet-3.list-1" tag="li" scope="global">
            <template #here>
              <NuxtLink :to="GUARANTEE_LINK.CHANGE_LBO" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
          <i18n-t keypath="guarantees.editCautions.connectInternet-3.list-2" tag="li" scope="global">
            <template #here>
              <NuxtLink :to="GUARANTEE_LINK.TERMINAL" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
          <i18n-t keypath="guarantees.editCautions.connectInternet-3.list-3" tag="li" scope="global">
            <template #here>
              <NuxtLink :to="GUARANTEE_LINK.TERMINAL" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </ul>
      </template>
    </i18n-t>
  </InnerCard>
</template>
