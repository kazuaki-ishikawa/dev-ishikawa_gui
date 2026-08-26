<script setup lang="ts">
// Step2 以降で使用するファイル
import { useI18n } from 'vue-i18n'
import type { RinkConnectionVpnFilterType } from '@/api/rinkConnections/types'

type PropType = {
  vpnFilterList: RinkConnectionVpnFilterType[] | null
}
defineProps<PropType>()

const { t } = useI18n()
const { getVpnFilterPatternText, getUseableText } = useRinkConnections()

const headers = [
  { key: 'pattern', text: t('rinkConnections.pattern') },
  { key: 'prefixList', text: t('rinkConnections.prefixList') },
]
</script>

<template>
  <DetailGrid>
    <div>{{ t('rinkConnections.optionVpnFilter') }}</div>
    <div data-cy="vpn-options-detail-option-vpn-filter">{{ getUseableText(!!vpnFilterList?.length) }}</div>
  </DetailGrid>
  <InputGrid v-if="!!vpnFilterList?.length" :label="t('rinkConnections.vpnFilterList')">
    <StripedTable :headers="headers" :items="vpnFilterList" data-cy="vpn-options-detail-vpn-filter-list">
      <template #pattern="{ row }">
        <div>{{ getVpnFilterPatternText(row.pattern) }}</div>
      </template>
      <template #prefixList="{ row }">
        <div class="text-pre-wrap">{{ row.prefixList.join('\n') }}</div>
      </template>
    </StripedTable>
  </InputGrid>
</template>
