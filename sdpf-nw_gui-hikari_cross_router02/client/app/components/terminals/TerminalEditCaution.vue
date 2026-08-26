<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NetworkTypes, TERMINAL_LINK } from '@/api/terminals/constants'
import type { TerminalInputDataType, TerminalPutKeysWithoutMobile } from '@/api/terminals/types'

type PropType = {
  editData: TerminalInputDataType
  originalData: Pick<TerminalInputDataType, TerminalPutKeysWithoutMobile>
}
const props = defineProps<PropType>()

const { t } = useI18n()

const isGuarantee = computed(() => !!props.originalData.guarantee.guaranteeId)
const removeVpn = computed(() => isGuarantee.value && !!props.originalData.vpnId && !props.editData.vpnId)

const wasInternetInUseBefore = computed(
  () =>
    props.originalData.breakOut.length > 0 ||
    props.originalData.defaultGateway.nexthopNetwork === NetworkTypes.Internet ||
    props.originalData.wanStaticRoutes.some(route => route.nexthopNetwork === NetworkTypes.Internet),
)
const isInternetInUseAfter = computed(
  () =>
    props.editData.breakOut.length > 0 ||
    props.editData.defaultGateway.nexthopNetwork === NetworkTypes.Internet ||
    props.editData.wanStaticRoutes.some(route => route.nexthopNetwork === NetworkTypes.Internet),
)
const removeInternet = computed(() => isGuarantee.value && wasInternetInUseBefore.value && !isInternetInUseAfter.value)
</script>

<template>
  <InnerCard v-if="removeVpn">
    <div class="font-weight-bold">{{ t('terminals.editCautions.title', { number: 1 }) }}</div>
    <i18n-t keypath="terminals.editCautions.removeVpn-1.base" tag="div" scope="global" class="text-pre-wrap">
      <template #underline>
        <span class="text-decoration-underline">{{ t('terminals.editCautions.removeVpn-1.underline') }}</span>
      </template>
    </i18n-t>
    <div class="pt-3 font-weight-bold">{{ t('terminals.editCautions.title', { number: 2 }) }}</div>
    <i18n-t keypath="terminals.editCautions.removeVpn-2.base" tag="div" scope="global" class="text-pre-wrap">
      <template #underline>
        <span class="text-decoration-underline">{{ t('terminals.editCautions.removeVpn-2.underline') }}</span>
      </template>
    </i18n-t>
    <i18n-t keypath="terminals.editCautions.removeProcess.base" tag="div" scope="global" class="pt-3 text-pre-wrap">
      <template #type>{{ t('terminals.vpn') }}</template>
      <template #underline>
        <span class="text-decoration-underline">
          {{ t('terminals.editCautions.removeProcess.underline', { type: t('terminals.vpn') }) }}
        </span>
      </template>
      <template #here>
        <NuxtLink :to="TERMINAL_LINK.CHANGE_IWAN" target="_blank">
          {{ t('common.here') }}
        </NuxtLink>
      </template>
    </i18n-t>
  </InnerCard>
  <InnerCard v-if="removeInternet">
    <div class="font-weight-bold">{{ t('terminals.editCautions.title', { number: 1 }) }}</div>
    <i18n-t keypath="terminals.editCautions.removeInternet-1.base" tag="div" scope="global" class="text-pre-wrap">
      <template #list>
        <ul class="my-0">
          <li>{{ t('terminals.editCautions.removeInternet-1.list-1') }}</li>
          <li>{{ t('terminals.editCautions.removeInternet-1.list-2') }}</li>
          <li>{{ t('terminals.editCautions.removeInternet-1.list-3') }}</li>
        </ul>
      </template>
      <template #underline>
        <span class="text-decoration-underline">{{ t('terminals.editCautions.removeInternet-1.underline') }}</span>
      </template>
    </i18n-t>
    <div class="pt-3 font-weight-bold">{{ t('terminals.editCautions.title', { number: 2 }) }}</div>
    <i18n-t keypath="terminals.editCautions.removeInternet-2.base" tag="div" scope="global" class="text-pre-wrap">
      <template #underline>
        <span class="text-decoration-underline">{{ t('terminals.editCautions.removeInternet-2.underline') }}</span>
      </template>
    </i18n-t>
    <i18n-t keypath="terminals.editCautions.removeProcess.base" tag="div" scope="global" class="pt-3 text-pre-wrap">
      <template #type>{{ t('terminals.internet') }}</template>
      <template #underline>
        <span class="text-decoration-underline">
          {{ t('terminals.editCautions.removeProcess.underline', { type: t('terminals.internet') }) }}
        </span>
      </template>
      <template #here>
        <NuxtLink :to="TERMINAL_LINK.CHANGE_IWAN" target="_blank">
          {{ t('common.here') }}
        </NuxtLink>
      </template>
    </i18n-t>
  </InnerCard>
</template>
